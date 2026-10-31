-- Partial public intake, preserving existing requests and commercial snapshots.
alter table public.customers add column full_name text check(length(full_name) between 1 and 160);
alter table public.moving_requests add column full_name text check(length(full_name) between 1 and 160);
update public.customers set full_name=concat_ws(' ',first_name,last_name);
update public.moving_requests set full_name=concat_ws(' ',first_name,last_name);
alter table public.customers alter column first_name drop not null, alter column last_name drop not null;
alter table public.moving_requests alter column first_name drop not null, alter column last_name drop not null,
 alter column property_type drop not null, alter column origin_floor drop not null, alter column destination_floor drop not null,
 alter column origin_elevator drop not null, alter column destination_elevator drop not null,
 add column intake_version integer not null default 1 check(intake_version in (1,2)),
 add column move_size text check(move_size in ('STUDIO','BEDROOMS_1','BEDROOMS_2','BEDROOMS_3','BEDROOMS_4','BEDROOMS_5_PLUS','OFFICE','COMMERCIAL')),
 add column suggested_mode text check(suggested_mode in ('LOCAL','PER_MILE')),
 add column territorial_reviewed boolean not null default false,
 add column territorial_source text not null default 'LEGACY' check(territorial_source in ('LEGACY','MANUAL','GOOGLE','STAFF'));
alter table public.addresses alter column street drop not null, alter column unit drop not null, alter column city drop not null,
 alter column state drop not null, alter column country drop not null, alter column postal_code drop not null,
 add column input text check(length(input)<=300), add column place_id text check(length(place_id)<=300),
 add column precision text not null default 'ADDRESS' check(precision in ('ADDRESS','POSTAL_CODE','MANUAL')),
 add column county text check(county in ('MIAMI_DADE','OTHER_FL'));
alter table public.customers add constraint customer_name_present check(full_name is not null or (first_name is not null and last_name is not null));
alter table public.moving_requests add constraint request_name_present check(full_name is not null or (first_name is not null and last_name is not null));
create or replace function public.intake_finalize(p_hash text) returns text
language plpgsql security definer set search_path='' as $$
declare session private.intake_sessions; d jsonb; customer uuid; origin uuid; destination uuid; request uuid; number text; desired date;
begin
  select * into strict session from private.intake_sessions where token_hash=p_hash for update;
  if session.cleanup_started or session.expires_at<now() then raise exception 'EXPIRED'; end if;
  if session.request_id is not null then
    select request_number into number from public.moving_requests where id=session.request_id;
    return number;
  end if;
  if exists(select 1 from private.intake_files where session_id=session.id and not ready) then raise exception 'FILES_PENDING'; end if;
  d=session.data;
  desired=(d->>'moving_date')::date;
  if desired is not null and (desired<=(now() at time zone 'America/New_York')::date or extract(dow from desired)=0) then raise exception 'INVALID_DATE'; end if;
  insert into public.customers(full_name,first_name,last_name,phone,email) values(coalesce(d->>'full_name',concat_ws(' ',d->>'first_name',d->>'last_name')),d->>'first_name',d->>'last_name',d->>'phone',d->>'email')
    on conflict(phone) do nothing returning id into customer;
  if customer is null then select id into strict customer from public.customers where phone=d->>'phone'; end if;
  insert into public.addresses(street,unit,city,state,postal_code,country,input,place_id,precision,county)
 values(d#>>'{origin,street}',d#>>'{origin,unit}',d#>>'{origin,city}',d#>>'{origin,state}',d#>>'{origin,postal_code}',d#>>'{origin,country}',d#>>'{origin,input}',d#>>'{origin,place_id}',coalesce(d#>>'{origin,precision}','ADDRESS'),d#>>'{origin,county}') returning id into origin;
  insert into public.addresses(street,unit,city,state,postal_code,country,input,place_id,precision,county)
 values(d#>>'{destination,street}',d#>>'{destination,unit}',d#>>'{destination,city}',d#>>'{destination,state}',d#>>'{destination,postal_code}',d#>>'{destination,country}',d#>>'{destination,input}',d#>>'{destination,place_id}',coalesce(d#>>'{destination,precision}','ADDRESS'),d#>>'{destination,county}') returning id into destination;
  insert into public.moving_requests(full_name,intake_version,move_size,suggested_mode,territorial_source,customer_id,first_name,last_name,phone,email,origin_id,destination_id,moving_date,property_type,bedrooms,property_size,size_unit,origin_floor,destination_floor,origin_elevator,destination_elevator,workers,comments)
    values(coalesce(d->>'full_name',concat_ws(' ',d->>'first_name',d->>'last_name')),coalesce((d->>'version')::integer,1),d->>'move_size',d->>'suggested_mode',coalesce(d->>'territorial_source','LEGACY'),customer,d->>'first_name',d->>'last_name',d->>'phone',d->>'email',origin,destination,desired,d->>'property_type',(d->>'bedrooms')::smallint,(d->>'property_size')::numeric,d->>'size_unit',(d->>'origin_floor')::smallint,(d->>'destination_floor')::smallint,(d->>'origin_elevator')::boolean,(d->>'destination_elevator')::boolean,(d->>'workers')::smallint,d->>'comments') returning id,request_number into request,number;
  insert into public.attachments(request_id,object_path,file_name,mime_type,byte_size)
    select request,object_path,file_name,mime_type,byte_size from private.intake_files where session_id=session.id;
  update private.intake_sessions set request_id=request,expires_at=now()+interval '1 day' where id=session.id;
  return number;
end; $$;

create or replace function public.edit_request(p_id uuid,p_version integer,p_data jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests; a public.addresses; b public.addresses; changed boolean;
begin
  perform private.require_permission('requests.edit');
  select * into strict r from public.moving_requests where id=p_id for update;
  if r.version<>p_version then raise exception 'CONFLICT'; end if;
  if p_data ? 'full_name' and (not coalesce((p_data->>'territorial_reviewed')::boolean,false) or p_data->>'origin_county' not in ('MIAMI_DADE','OTHER_FL') or p_data->>'destination_county' not in ('MIAMI_DADE','OTHER_FL') ) then raise exception 'INVALID_INPUT'; end if;
  select * into strict a from public.addresses where id=r.origin_id;
  if exists(select 1 from public.customers where phone=p_data->>'phone' and id<>r.customer_id) then raise exception 'PHONE_CONFLICT'; end if;
  select * into strict b from public.addresses where id=r.destination_id;
  changed=(a.county is distinct from p_data->>'origin_county') or (b.county is distinct from p_data->>'destination_county') or (a.street,a.unit,a.city,a.postal_code) is distinct from (p_data#>>'{origin,street}',p_data#>>'{origin,unit}',p_data#>>'{origin,city}',p_data#>>'{origin,postal_code}')
    or (b.street,b.unit,b.city,b.postal_code) is distinct from (p_data#>>'{destination,street}',p_data#>>'{destination,unit}',p_data#>>'{destination,city}',p_data#>>'{destination,postal_code}');
  -- An accepted route cannot silently change. Edit the estimate first so the
  -- operator explicitly reviews its territorial classification and terms.
  if changed and exists(select 1 from public.quotes where request_id=p_id and status in ('ACCEPTED','CONFIRMED')) then raise exception 'REVIEW_QUOTE_FIRST'; end if;
  if p_data->>'email' is not null and p_data->>'email' !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then raise exception 'INVALID_INPUT'; end if;
  update public.addresses set street=p_data#>>'{origin,street}',unit=p_data#>>'{origin,unit}',city=p_data#>>'{origin,city}',state=p_data#>>'{origin,state}',postal_code=p_data#>>'{origin,postal_code}',country=p_data#>>'{origin,country}',county=p_data->>'origin_county',precision='ADDRESS',place_id=null where id=r.origin_id;
  update public.addresses set street=p_data#>>'{destination,street}',unit=p_data#>>'{destination,unit}',city=p_data#>>'{destination,city}',state=p_data#>>'{destination,state}',postal_code=p_data#>>'{destination,postal_code}',country=p_data#>>'{destination,country}',county=p_data->>'destination_county',precision='ADDRESS',place_id=null where id=r.destination_id;
  update public.moving_requests set full_name=coalesce(p_data->>'full_name',concat_ws(' ',p_data->>'first_name',p_data->>'last_name')),territorial_reviewed=true,territorial_source='STAFF',suggested_mode=case when p_data->>'origin_county'='MIAMI_DADE' and p_data->>'destination_county'='MIAMI_DADE' then 'LOCAL' else 'PER_MILE' end,first_name=p_data->>'first_name',last_name=p_data->>'last_name',phone=p_data->>'phone',email=p_data->>'email',
    moving_date=(p_data->>'moving_date')::date,property_type=p_data->>'property_type',bedrooms=(p_data->>'bedrooms')::smallint,
    property_size=(p_data->>'property_size')::numeric,size_unit=p_data->>'size_unit',origin_floor=(p_data->>'origin_floor')::smallint,destination_floor=(p_data->>'destination_floor')::smallint,
    origin_elevator=(p_data->>'origin_elevator')::boolean,destination_elevator=(p_data->>'destination_elevator')::boolean,
    workers=(p_data->>'workers')::smallint,comments=p_data->>'comments',version=version+1 where id=p_id;
  -- Move addresses reference the same per-request address snapshots.
end; $$;


create function public.edit_customer_name(p_id uuid,p_version integer,p_name text,p_phone text,p_email text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_permission('requests.edit');
 perform 1 from public.customers where id=p_id and version=p_version for update;
 if not found then raise exception 'CONFLICT'; end if;
 update public.customers set full_name=trim(p_name),first_name=null,last_name=null,phone=p_phone,email=nullif(p_email,''),version=version+1 where id=p_id;
end; $$;
revoke all on function public.edit_customer_name(uuid,integer,text,text,text) from public,anon;
grant execute on function public.edit_customer_name(uuid,integer,text,text,text) to authenticated;

create function private.check_route_ready() returns trigger language plpgsql security definer set search_path='' as $$
declare r public.moving_requests;
begin
 select * into strict r from public.moving_requests where id=new.request_id for update;
 if r.intake_version=2 then
  if not r.territorial_reviewed or r.suggested_mode is null or exists(select 1 from public.addresses where id in (r.origin_id,r.destination_id) and (street is null or city is null or postal_code is null or state is distinct from 'FL' or country is distinct from 'US' or county is null)) then raise exception 'ROUTE_REVIEW_REQUIRED'; end if;
  if tg_table_name='quotes' then
   if new.mode<>r.suggested_mode then raise exception 'ROUTE_REVIEW_REQUIRED'; end if;
  elsif exists(select 1 from public.quotes where request_id=r.id and mode<>r.suggested_mode) then raise exception 'ROUTE_REVIEW_REQUIRED'; end if;
 end if;
 return new;
end; $$;
create trigger quote_route_ready before insert or update on public.quotes for each row when (new.status in ('ACCEPTED','CONFIRMED')) execute function private.check_route_ready();
create trigger move_route_ready before insert or update on public.moves for each row when (new.status='SCHEDULED') execute function private.check_route_ready();

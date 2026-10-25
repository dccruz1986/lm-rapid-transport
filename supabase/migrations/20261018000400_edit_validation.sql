-- Retain RPC validation for both old clients and the simplified editor.
create or replace function public.edit_request(p_id uuid,p_version integer,p_data jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests; a public.addresses; b public.addresses; changed boolean;
begin
  perform private.require_permission('requests.edit');
  select * into strict r from public.moving_requests where id=p_id for update;
  if r.version<>p_version then raise exception 'CONFLICT'; end if;
  if (r.intake_version=2 or p_data ? 'full_name') and (not coalesce((p_data->>'territorial_reviewed')::boolean,false) or coalesce(p_data->>'origin_county','') not in ('MIAMI_DADE','OTHER_FL') or coalesce(p_data->>'destination_county','') not in ('MIAMI_DADE','OTHER_FL') ) then raise exception 'INVALID_INPUT'; end if;
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
  update public.moving_requests set full_name=coalesce(p_data->>'full_name',concat_ws(' ',p_data->>'first_name',p_data->>'last_name')),territorial_reviewed=coalesce((p_data->>'territorial_reviewed')::boolean,false),territorial_source='STAFF',suggested_mode=case when p_data->>'origin_county' is null or p_data->>'destination_county' is null then null when p_data->>'origin_county'='MIAMI_DADE' and p_data->>'destination_county'='MIAMI_DADE' then 'LOCAL' else 'PER_MILE' end,first_name=p_data->>'first_name',last_name=p_data->>'last_name',phone=p_data->>'phone',email=p_data->>'email',
    moving_date=(p_data->>'moving_date')::date,property_type=p_data->>'property_type',bedrooms=(p_data->>'bedrooms')::smallint,
    property_size=(p_data->>'property_size')::numeric,size_unit=p_data->>'size_unit',origin_floor=(p_data->>'origin_floor')::smallint,destination_floor=(p_data->>'destination_floor')::smallint,
    origin_elevator=(p_data->>'origin_elevator')::boolean,destination_elevator=(p_data->>'destination_elevator')::boolean,
    workers=(p_data->>'workers')::smallint,comments=p_data->>'comments',version=version+1 where id=p_id;
  -- Move addresses reference the same per-request address snapshots.
end; $$;


create or replace function public.edit_customer_name(p_id uuid,p_version integer,p_name text,p_phone text,p_email text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_permission('requests.edit');
 p_email=nullif(trim(p_email),'');
 if p_email is not null and p_email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then raise exception 'INVALID_INPUT'; end if;
 perform 1 from public.customers where id=p_id and version=p_version for update;
 if not found then raise exception 'CONFLICT'; end if;
 update public.customers set full_name=trim(p_name),first_name=null,last_name=null,phone=p_phone,email=p_email,version=version+1 where id=p_id;
end; $$;
create or replace function public.edit_customer(p_id uuid,p_version integer,p_first text,p_last text,p_phone text,p_email text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_permission('requests.edit');
 p_email=nullif(trim(p_email),'');
 if p_email is not null and p_email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then raise exception 'INVALID_INPUT'; end if;
 perform 1 from public.customers where id=p_id and version=p_version for update;
 if not found then raise exception 'CONFLICT'; end if;
 update public.customers set full_name=concat_ws(' ',trim(p_first),trim(p_last)),first_name=trim(p_first),last_name=trim(p_last),phone=p_phone,email=p_email,version=version+1 where id=p_id;
end; $$;
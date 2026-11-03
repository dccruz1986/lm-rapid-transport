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
  update public.addresses set street=p_data#>>'{origin,street}',unit=p_data#>>'{origin,unit}',city=p_data#>>'{origin,city}',state=p_data#>>'{origin,state}',postal_code=p_data#>>'{origin,postal_code}',country=p_data#>>'{origin,country}',county=p_data->>'origin_county',precision=coalesce(p_data#>>'{origin,precision}','ADDRESS'),place_id=case when (p_data->'origin') ? 'place_id' then nullif(p_data#>>'{origin,place_id}','') when (a.street,a.city,a.postal_code) is not distinct from (p_data#>>'{origin,street}',p_data#>>'{origin,city}',p_data#>>'{origin,postal_code}') then a.place_id else null end where id=r.origin_id;
  update public.addresses set street=p_data#>>'{destination,street}',unit=p_data#>>'{destination,unit}',city=p_data#>>'{destination,city}',state=p_data#>>'{destination,state}',postal_code=p_data#>>'{destination,postal_code}',country=p_data#>>'{destination,country}',county=p_data->>'destination_county',precision=coalesce(p_data#>>'{destination,precision}','ADDRESS'),place_id=case when (p_data->'destination') ? 'place_id' then nullif(p_data#>>'{destination,place_id}','') when (b.street,b.city,b.postal_code) is not distinct from (p_data#>>'{destination,street}',p_data#>>'{destination,city}',p_data#>>'{destination,postal_code}') then b.place_id else null end where id=r.destination_id;
  update public.moving_requests set full_name=coalesce(p_data->>'full_name',concat_ws(' ',p_data->>'first_name',p_data->>'last_name')),territorial_reviewed=coalesce((p_data->>'territorial_reviewed')::boolean,false),territorial_source='STAFF',suggested_mode=case when p_data->>'origin_county' is null or p_data->>'destination_county' is null then null when p_data->>'origin_county'='MIAMI_DADE' and p_data->>'destination_county'='MIAMI_DADE' then 'LOCAL' else 'PER_MILE' end,first_name=p_data->>'first_name',last_name=p_data->>'last_name',phone=p_data->>'phone',email=p_data->>'email',
    moving_date=(p_data->>'moving_date')::date,property_type=p_data->>'property_type',bedrooms=(p_data->>'bedrooms')::smallint,
    property_size=(p_data->>'property_size')::numeric,size_unit=p_data->>'size_unit',origin_floor=(p_data->>'origin_floor')::smallint,destination_floor=(p_data->>'destination_floor')::smallint,
    origin_elevator=(p_data->>'origin_elevator')::boolean,destination_elevator=(p_data->>'destination_elevator')::boolean,
    workers=(p_data->>'workers')::smallint,comments=p_data->>'comments',version=version+1 where id=p_id;
  -- Move addresses reference the same per-request address snapshots.
end; $$;



create or replace function public.create_request(p_key uuid,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare previous private.request_creations; customer uuid; origin uuid; destination uuid;
  request uuid; number text; desired date; v_actor uuid := auth.uid();
begin
  perform private.require_permission('requests.create');
  if p_key is null or p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'INVALID_INPUT'; end if;
  -- Serialize retries, including when the first operation has not committed yet.
  perform pg_advisory_xact_lock(hashtextextended(v_actor::text||p_key::text,0));
  select * into previous from private.request_creations where request_creations.actor=v_actor and operation=p_key;
  if found then
    if previous.fingerprint is distinct from encode(sha256(convert_to(p_data::text,'UTF8')),'hex') then raise exception 'CONFLICT'; end if;
    select request_number into number from public.moving_requests where id=previous.request_id;
    return jsonb_build_object('id',previous.request_id,'request_number',number);
  end if;
  if not coalesce(
    length(trim(p_data->>'full_name')) between 1 and 160
    and p_data->>'phone' ~ '^\+1[2-9][0-9]{2}[2-9][0-9]{6}$'
    and length(trim(p_data->>'origin')) between 3 and 300
    and length(trim(p_data->>'destination')) between 3 and 300
    and p_data->>'move_size' in ('STUDIO','BEDROOMS_1','BEDROOMS_2','BEDROOMS_3','BEDROOMS_4','BEDROOMS_5_PLUS','OFFICE','COMMERCIAL')
    and length(p_data->>'comments')<=4000, false)
    or (p_data->>'email' is not null and (length(p_data->>'email')>254 or p_data->>'email' !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$'))
    or not (p_data ? 'moving_date')
    then raise exception 'INVALID_INPUT'; end if;
  if p_data->>'moving_date' is not null then
    begin
      if p_data->>'moving_date' !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'INVALID_DATE'; end if;
      desired=(p_data->>'moving_date')::date;
    exception when others then raise exception 'INVALID_DATE'; end;
    if desired<=(now() at time zone 'America/New_York')::date or extract(dow from desired)=0 then raise exception 'INVALID_DATE'; end if;
  end if;
  insert into public.customers(full_name,phone,email) values(trim(p_data->>'full_name'),p_data->>'phone',p_data->>'email')
    on conflict(phone) do nothing returning id into customer;
  if customer is null then select id into strict customer from public.customers where phone=p_data->>'phone'; end if;
  insert into public.addresses(input,postal_code,state,country,precision)
    values(trim(p_data->>'origin'),case when trim(p_data->>'origin') ~ '^\d{5}$' then trim(p_data->>'origin') end,null,null,'MANUAL') returning id into origin;
  insert into public.addresses(input,postal_code,state,country,precision)
    values(trim(p_data->>'destination'),case when trim(p_data->>'destination') ~ '^\d{5}$' then trim(p_data->>'destination') end,null,null,'MANUAL') returning id into destination;

  if p_data->'origin_location' is not null and p_data->'origin_location'<>'null'::jsonb then
    if p_data#>>'{origin_location,label}' is distinct from p_data->>'origin' then raise exception 'INVALID_INPUT'; end if;
    update public.addresses set place_id=nullif(p_data#>>'{origin_location,place_id}',''), precision=coalesce(p_data#>>'{origin_location,precision}','MANUAL'),street=nullif(p_data#>>'{origin_location,street}',''),city=nullif(p_data#>>'{origin_location,city}',''),postal_code=nullif(p_data#>>'{origin_location,postal_code}','') where id=origin;
  end if;

  if p_data->'destination_location' is not null and p_data->'destination_location'<>'null'::jsonb then
    if p_data#>>'{destination_location,label}' is distinct from p_data->>'destination' then raise exception 'INVALID_INPUT'; end if;
    update public.addresses set place_id=nullif(p_data#>>'{destination_location,place_id}',''), precision=coalesce(p_data#>>'{destination_location,precision}','MANUAL'),street=nullif(p_data#>>'{destination_location,street}',''),city=nullif(p_data#>>'{destination_location,city}',''),postal_code=nullif(p_data#>>'{destination_location,postal_code}','') where id=destination;
  end if;
  insert into public.moving_requests(full_name,phone,email,customer_id,origin_id,destination_id,intake_version,move_size,moving_date,comments,territorial_source)
    values(trim(p_data->>'full_name'),p_data->>'phone',p_data->>'email',customer,origin,destination,2,p_data->>'move_size',desired,p_data->>'comments','MANUAL')
    returning id,request_number into request,number;
  insert into private.request_creations(actor,operation,fingerprint,request_id) values(v_actor,p_key,encode(sha256(convert_to(p_data::text,'UTF8')),'hex'),request);
  return jsonb_build_object('id',request,'request_number',number);
end; $$;
revoke all on function public.create_request(uuid,jsonb) from public,anon;
grant execute on function public.create_request(uuid,jsonb) to authenticated;




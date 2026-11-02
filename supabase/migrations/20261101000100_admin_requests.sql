insert into private.role_permissions(role,action)
select role,'requests.create' from unnest(array['ADMIN','MANAGER','DISPATCHER']) role
on conflict do nothing;

create table private.request_creations (
  actor uuid not null references public.profiles(id),
  operation uuid not null,
  fingerprint text not null,
  request_id uuid not null references public.moving_requests(id),
  created_at timestamptz not null default now(),
  primary key(actor,operation)
);
revoke all on private.request_creations from public,anon,authenticated;

create function public.create_request(p_key uuid,p_data jsonb) returns jsonb
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
  insert into public.moving_requests(full_name,phone,email,customer_id,origin_id,destination_id,intake_version,move_size,moving_date,comments,territorial_source)
    values(trim(p_data->>'full_name'),p_data->>'phone',p_data->>'email',customer,origin,destination,2,p_data->>'move_size',desired,p_data->>'comments','MANUAL')
    returning id,request_number into request,number;
  insert into private.request_creations(actor,operation,fingerprint,request_id) values(v_actor,p_key,encode(sha256(convert_to(p_data::text,'UTF8')),'hex'),request);
  return jsonb_build_object('id',request,'request_number',number);
end; $$;
revoke all on function public.create_request(uuid,jsonb) from public,anon;
grant execute on function public.create_request(uuid,jsonb) to authenticated;



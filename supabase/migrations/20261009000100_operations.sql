create function public.request_action(p_id uuid,p_version integer,p_action text,p_reason text default '') returns void
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests;
begin
  perform private.require_permission(case p_action when 'cancel' then 'records.cancel' when 'reactivate' then 'records.reactivate' else 'requests.edit' end);
  select * into strict r from public.moving_requests where id=p_id for update;
  if r.version<>p_version then raise exception 'CONFLICT'; end if;
  if length(p_reason)>1000 then raise exception 'INVALID_INPUT'; end if;
  if p_action='contact' and r.status in ('NEW','PENDING_REVIEW') then
    update public.moving_requests set status='CONTACTED',version=version+1 where id=p_id;
  elsif p_action='cancel' and r.status not in ('CANCELLED','COMPLETED') then
    update public.quotes set status='CANCELLED',version=version+1 where request_id=p_id;
    update public.moves set status='CANCELLED',cancelled_at=now(),cancellation_reason=nullif(p_reason,''),version=version+1 where request_id=p_id;
    update public.moving_requests set status='CANCELLED',cancelled_at=now(),cancellation_reason=nullif(p_reason,''),version=version+1 where id=p_id;
  elsif p_action='reactivate' and r.status='CANCELLED' then
    update public.quotes set status='ESTIMATED',confirmed_terms=null,terms_version=terms_version+1,version=version+1 where request_id=p_id;
    update public.moves set status='PENDING_REVIEW',version=version+1 where request_id=p_id;
    update public.moving_requests set status='PENDING_REVIEW',version=version+1 where id=p_id;
  else raise exception 'INVALID_TRANSITION'; end if;
end; $$;

create function public.save_note(p_request uuid,p_body text,p_id uuid default null,p_delete boolean default false) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  perform private.require_permission('notes.manage');
  if p_delete then
    delete from public.notes where id=p_id and request_id=p_request returning id into result;
    if result is null then raise exception 'NOT_FOUND'; end if;
  elsif p_id is null then
    insert into public.notes(request_id,body,author_id) values(p_request,trim(p_body),auth.uid()) returning id into result;
  else
    update public.notes set body=trim(p_body) where id=p_id and request_id=p_request returning id into result;
    if result is null then raise exception 'NOT_FOUND'; end if;
  end if;
  return result;
end; $$;

create function public.edit_customer(p_id uuid,p_version integer,p_first text,p_last text,p_phone text,p_email text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.customers;
begin
  perform private.require_permission('requests.edit');
  select * into strict c from public.customers where id=p_id for update;
  if c.version<>p_version then raise exception 'CONFLICT'; end if;
  if p_email is not null and p_email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then raise exception 'INVALID_INPUT'; end if;
  update public.customers set first_name=trim(p_first),last_name=trim(p_last),phone=p_phone,email=p_email,version=version+1 where id=p_id;
end; $$;

create function public.edit_request(p_id uuid,p_version integer,p_data jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests; a public.addresses; b public.addresses; changed boolean;
begin
  perform private.require_permission('requests.edit');
  select * into strict r from public.moving_requests where id=p_id for update;
  if r.version<>p_version then raise exception 'CONFLICT'; end if;
  select * into strict a from public.addresses where id=r.origin_id;
  if exists(select 1 from public.customers where phone=p_data->>'phone' and id<>r.customer_id) then raise exception 'PHONE_CONFLICT'; end if;
  select * into strict b from public.addresses where id=r.destination_id;
  changed=(a.street,a.unit,a.city,a.postal_code) is distinct from (p_data#>>'{origin,street}',p_data#>>'{origin,unit}',p_data#>>'{origin,city}',p_data#>>'{origin,postal_code}')
    or (b.street,b.unit,b.city,b.postal_code) is distinct from (p_data#>>'{destination,street}',p_data#>>'{destination,unit}',p_data#>>'{destination,city}',p_data#>>'{destination,postal_code}');
  -- An accepted route cannot silently change. Edit the estimate first so the
  -- operator explicitly reviews its territorial classification and terms.
  if changed and exists(select 1 from public.quotes where request_id=p_id and status in ('ACCEPTED','CONFIRMED')) then raise exception 'REVIEW_QUOTE_FIRST'; end if;
  if p_data->>'email' is not null and p_data->>'email' !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then raise exception 'INVALID_INPUT'; end if;
  update public.addresses set street=p_data#>>'{origin,street}',unit=p_data#>>'{origin,unit}',city=p_data#>>'{origin,city}',state=p_data#>>'{origin,state}',postal_code=p_data#>>'{origin,postal_code}',country=p_data#>>'{origin,country}' where id=r.origin_id;
  update public.addresses set street=p_data#>>'{destination,street}',unit=p_data#>>'{destination,unit}',city=p_data#>>'{destination,city}',state=p_data#>>'{destination,state}',postal_code=p_data#>>'{destination,postal_code}',country=p_data#>>'{destination,country}' where id=r.destination_id;
  update public.moving_requests set first_name=p_data->>'first_name',last_name=p_data->>'last_name',phone=p_data->>'phone',email=p_data->>'email',
    moving_date=(p_data->>'moving_date')::date,property_type=p_data->>'property_type',bedrooms=(p_data->>'bedrooms')::smallint,
    property_size=(p_data->>'property_size')::numeric,size_unit=p_data->>'size_unit',origin_floor=(p_data->>'origin_floor')::smallint,destination_floor=(p_data->>'destination_floor')::smallint,
    origin_elevator=(p_data->>'origin_elevator')::boolean,destination_elevator=(p_data->>'destination_elevator')::boolean,
    workers=(p_data->>'workers')::smallint,comments=p_data->>'comments',version=version+1 where id=p_id;
  -- Move addresses reference the same per-request address snapshots.
end; $$;

create function public.dashboard_metrics() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare start_week timestamptz; end_week timestamptz;
begin
  perform private.require_permission('records.read');
  start_week=date_trunc('week',now() at time zone 'America/New_York') at time zone 'America/New_York';
  end_week=(date_trunc('week',now() at time zone 'America/New_York')+interval '7 days') at time zone 'America/New_York';
  return jsonb_build_object(
    'new_requests',(select count(*) from public.moving_requests where status='NEW'),
    'quotes_pending',(select count(*) from public.quotes q where q.status='ACCEPTED' and exists(select 1 from public.quote_communications c where c.quote_id=q.id and c.terms_version=q.terms_version and c.confirmed_at is null)),
    'confirmed_moves',(select count(*) from public.moving_requests where status='CONFIRMED'),
    'moves_this_week',(select count(*) from public.moves where scheduled_at>=start_week and scheduled_at<end_week and status not in ('CANCELLED','PENDING_REVIEW')),
    'completed_moves',(select count(*) from public.moves where status='COMPLETED')
  );
end; $$;
revoke all on function public.request_action(uuid,integer,text,text),public.save_note(uuid,text,uuid,boolean),public.edit_customer(uuid,integer,text,text,text,text),public.edit_request(uuid,integer,jsonb),public.dashboard_metrics() from public,anon;
grant execute on function public.request_action(uuid,integer,text,text),public.save_note(uuid,text,uuid,boolean),public.edit_customer(uuid,integer,text,text,text,text),public.edit_request(uuid,integer,jsonb),public.dashboard_metrics() to authenticated;

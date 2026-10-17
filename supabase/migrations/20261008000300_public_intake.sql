create function public.intake_quota(p_key text,p_limit integer,p_seconds integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare total integer;
begin
  if p_limit<1 or p_seconds<1 or length(p_key)>128 then raise exception 'INVALID_QUOTA'; end if;
  insert into private.rate_limits(key,count,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict(key) do update set
    count=case when private.rate_limits.expires_at<now() then 1 else private.rate_limits.count+1 end,
    expires_at=case when private.rate_limits.expires_at<now() then excluded.expires_at else private.rate_limits.expires_at end
  returning count into total;
  return total<=p_limit;
end; $$;

create function public.intake_begin(p_key uuid,p_hash text,p_data jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare existing private.intake_sessions; result uuid;
begin
  if length(p_hash)<>64 or octet_length(p_data::text)>20000 then raise exception 'INVALID_INPUT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
  select * into existing from private.intake_sessions where idempotency_key=p_key;
  if found then
    if existing.token_hash<>p_hash or existing.data<>p_data then raise exception 'CONFLICT'; end if;
    if existing.expires_at<now() or existing.cleanup_started then raise exception 'EXPIRED'; end if;
    return existing.id;
  end if;
  insert into private.intake_sessions(idempotency_key,token_hash,data) values(p_key,p_hash,p_data) returning id into result;
  return result;
end; $$;

create function public.intake_file(p_hash text,p_id uuid,p_action text,p_name text default '',p_mime text default '',p_size integer default 0) returns text
language plpgsql security definer set search_path='' as $$
declare session private.intake_sessions; item private.intake_files; object_name text;
begin
  select * into strict session from private.intake_sessions where token_hash=p_hash for update;
  if session.request_id is not null or session.expires_at<now() or session.cleanup_started then raise exception 'EXPIRED'; end if;
  select * into item from private.intake_files where id=p_id and session_id=session.id;
  if p_action='reserve' then
    if found then
      if item.file_name<>p_name or item.mime_type<>p_mime or item.byte_size<>p_size then raise exception 'CONFLICT'; end if;
      return item.object_path;
    end if;
    if p_size not between 1 and 5242880 or p_mime not in ('image/jpeg','image/png','image/webp') or length(p_name)>120 then raise exception 'INVALID_FILE'; end if;
    if (select count(*) from private.intake_files where session_id=session.id)>=8 then raise exception 'FILE_LIMIT'; end if;
    object_name=session.id::text||'/'||p_id::text;
    insert into private.intake_files(id,session_id,object_path,file_name,mime_type,byte_size) values(p_id,session.id,object_name,p_name,p_mime,p_size);
    return object_name;
  end if;
  if item.id is null then raise exception 'FILE_NOT_FOUND'; end if;
  if p_action='ready' then
    update private.intake_files set ready=true where id=p_id;
  elsif p_action='remove' then
    delete from private.intake_files where id=p_id;
  elsif p_action<>'get' then raise exception 'INVALID_ACTION'; end if;
  return item.object_path;
end; $$;

create function public.intake_finalize(p_hash text) returns text
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
  insert into public.customers(first_name,last_name,phone,email) values(d->>'first_name',d->>'last_name',d->>'phone',d->>'email')
    on conflict(phone) do nothing returning id into customer;
  if customer is null then select id into strict customer from public.customers where phone=d->>'phone'; end if;
  insert into public.addresses(street,unit,city,state,postal_code,country)
    values(d#>>'{origin,street}',d#>>'{origin,unit}',d#>>'{origin,city}',d#>>'{origin,state}',d#>>'{origin,postal_code}',d#>>'{origin,country}') returning id into origin;
  insert into public.addresses(street,unit,city,state,postal_code,country)
    values(d#>>'{destination,street}',d#>>'{destination,unit}',d#>>'{destination,city}',d#>>'{destination,state}',d#>>'{destination,postal_code}',d#>>'{destination,country}') returning id into destination;
  insert into public.moving_requests(customer_id,first_name,last_name,phone,email,origin_id,destination_id,moving_date,property_type,bedrooms,property_size,size_unit,origin_floor,destination_floor,origin_elevator,destination_elevator,workers,comments)
    values(customer,d->>'first_name',d->>'last_name',d->>'phone',d->>'email',origin,destination,desired,d->>'property_type',(d->>'bedrooms')::smallint,(d->>'property_size')::numeric,d->>'size_unit',(d->>'origin_floor')::smallint,(d->>'destination_floor')::smallint,(d->>'origin_elevator')::boolean,(d->>'destination_elevator')::boolean,(d->>'workers')::smallint,d->>'comments') returning id,request_number into request,number;
  insert into public.attachments(request_id,object_path,file_name,mime_type,byte_size)
    select request,object_path,file_name,mime_type,byte_size from private.intake_files where session_id=session.id;
  update private.intake_sessions set request_id=request,expires_at=now()+interval '1 day' where id=session.id;
  return number;
end; $$;

-- One-hour grace exceeds the endpoint's one-minute execution budget.
create function public.intake_cleanup_candidates() returns table(id uuid,paths text[])
language plpgsql security definer set search_path='' as $$
begin
  delete from private.rate_limits where expires_at<now()-interval '1 day';
  delete from private.intake_sessions where request_id is not null and expires_at<now();
  return query with expired as (
    select s.id from private.intake_sessions s where s.request_id is null and s.expires_at<now()-interval '1 hour'
    order by s.expires_at limit 100 for update skip locked
  ), claimed as (
    update private.intake_sessions s set cleanup_started=true from expired e where s.id=e.id returning s.id
  ) select c.id,coalesce(array_agg(f.object_path) filter(where f.id is not null),array[]::text[])
    from claimed c left join private.intake_files f on f.session_id=c.id group by c.id;
end; $$;
create function public.intake_cleanup_finish(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  delete from private.intake_sessions where id=p_id and cleanup_started and request_id is null;
end; $$;

revoke all on function public.intake_quota(text,integer,integer),public.intake_begin(uuid,text,jsonb),public.intake_file(text,uuid,text,text,text,integer),public.intake_finalize(text),public.intake_cleanup_candidates(),public.intake_cleanup_finish(uuid) from public,anon,authenticated;
grant execute on function public.intake_quota(text,integer,integer),public.intake_begin(uuid,text,jsonb),public.intake_file(text,uuid,text,text,text,integer),public.intake_finalize(text),public.intake_cleanup_candidates(),public.intake_cleanup_finish(uuid) to service_role;

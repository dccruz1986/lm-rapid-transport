create function public.reopen_quote(p_request uuid,p_version integer) returns void
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests; q public.quotes;
begin
  perform private.require_permission('quotes.edit');
  select * into strict r from public.moving_requests where id=p_request for update;
  select * into strict q from public.quotes where request_id=p_request for update;
  if p_version is null or q.version<>p_version then raise exception 'CONFLICT'; end if;
  if r.status='CANCELLED' then raise exception 'INVALID_TRANSITION'; end if;
  if r.status='COMPLETED' then perform private.require_permission('moves.correct'); end if;
  update public.quotes set status='ESTIMATED',terms_version=terms_version+1,version=version+1 where id=q.id;
  update public.moving_requests set status=case when status in ('IN_PROGRESS','COMPLETED') then status else 'QUOTED' end,version=version+1 where id=p_request;
end; $$;

create function public.schedule_move(p_request uuid,p_version integer,p_at timestamptz,p_notes text,p_duration integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests; q public.quotes; m public.moves;
begin
  perform private.require_permission('moves.schedule');
  select * into strict r from public.moving_requests where id=p_request for update;
  select * into strict q from public.quotes where request_id=p_request for update;
  select * into m from public.moves where request_id=p_request for update;
  if p_version is null then raise exception 'CONFLICT'; end if;
  if p_at is null or not isfinite(p_at) or p_at<=now() or extract(dow from p_at at time zone 'America/New_York')=0
    or p_notes is null or length(p_notes)>4000 or p_duration is null or p_duration not between 1 and 10080 then raise exception 'INVALID_INPUT'; end if;
  if r.status<>'CONFIRMED' or q.status<>'CONFIRMED' or q.confirmed_terms is null
    or (m.id is not null and m.status not in ('SCHEDULED','PENDING_REVIEW')) then raise exception 'INVALID_TRANSITION'; end if;
  -- A retried first conversion returns its unique associated move, without overwriting it.
  if p_version=0 and m.id is not null and m.status='SCHEDULED' then return m.id; end if;
  if coalesce(m.version,0)<>p_version then raise exception 'CONFLICT'; end if;
  if m.id is null then
    insert into public.moves(request_id,customer_id,origin_id,destination_id,scheduled_at,notes,estimated_duration_minutes)
    values(p_request,r.customer_id,r.origin_id,r.destination_id,p_at,p_notes,p_duration) returning * into m;
  else
    perform private.price_history(p_request,'move',m.id::text,to_jsonb(m),jsonb_build_object('estimated_duration_minutes',p_duration),array['estimated_duration_minutes']);
    update public.moves set scheduled_at=p_at,notes=p_notes,estimated_duration_minutes=p_duration,status='SCHEDULED',
      started_at=case when m.status='PENDING_REVIEW' then null else started_at end,
      finished_at=case when m.status='PENDING_REVIEW' then null else finished_at end,
      actual_miles=case when m.status='PENDING_REVIEW' then null else actual_miles end,version=version+1 where id=m.id;
  end if;
  return m.id;
end; $$;

create function public.record_move(p_request uuid,p_version integer,p_action text,p_start timestamptz,p_end timestamptz,p_miles numeric) returns void
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests; q public.quotes; m public.moves; updated public.moves; amount bigint; quantity numeric;
begin
  perform private.require_permission('moves.operate');
  select * into strict r from public.moving_requests where id=p_request for update;
  select * into strict q from public.quotes where request_id=p_request for update;
  select * into strict m from public.moves where request_id=p_request for update;
  if p_version is null or m.version<>p_version then raise exception 'CONFLICT'; end if;
  if p_action is null or p_action not in ('start','save','complete','correct') then raise exception 'INVALID_INPUT'; end if;
  if m.status='COMPLETED' then
    perform private.require_permission('moves.correct');
    if p_action<>'correct' then raise exception 'INVALID_TRANSITION'; end if;
  elsif (p_action='start' and m.status<>'SCHEDULED') or (p_action in ('save','complete') and m.status<>'IN_PROGRESS') or p_action='correct' then
    raise exception 'INVALID_TRANSITION';
  end if;
  if m.status in ('CANCELLED','PENDING_REVIEW') or (p_action in ('start','complete') and q.status<>'CONFIRMED') then raise exception 'INVALID_TRANSITION'; end if;
  if p_start is null or not isfinite(p_start) or p_start>now() or
    (p_end is not null and (not isfinite(p_end) or p_end<=p_start or p_end>now() or p_end-p_start>interval '168 hours'))
    or (p_miles is not null and (not(p_miles>0 and p_miles<=10000) or p_miles<>round(p_miles,4)))
    or (q.mode='LOCAL' and p_miles is not null) or (p_action='start' and p_end is not null) then raise exception 'INVALID_INPUT'; end if;
  if p_action in ('complete','correct') then
    if p_end is null or (q.mode='PER_MILE' and p_miles is null) then raise exception 'INVALID_INPUT'; end if;
    quantity=case when q.mode='LOCAL' then extract(epoch from(p_end-p_start))/3600 else p_miles end;
    amount=private.quote_total(q.mode,quantity,q.rate_cents,q.minimum_hours);
  end if;
  update public.moves set started_at=p_start,finished_at=p_end,actual_miles=p_miles,
    status=case when p_action='start' then 'IN_PROGRESS' when p_action='complete' then 'COMPLETED' else status end,
    final_total_cents=case when amount is not null and q.status='CONFIRMED' then amount else final_total_cents end,
    revised_total_cents=case when amount is not null and q.status<>'CONFIRMED' then amount else null end,
    version=version+1 where id=m.id returning * into updated;
  perform private.price_history(p_request,'move',m.id::text,to_jsonb(m),to_jsonb(updated),array['started_at','finished_at','actual_miles']);
  if p_action in ('start','complete') then
    update public.moving_requests set status=updated.status,version=version+1 where id=p_request;
  end if;
end; $$;
revoke all on function public.reopen_quote(uuid,integer),public.schedule_move(uuid,integer,timestamptz,text,integer),public.record_move(uuid,integer,text,timestamptz,timestamptz,numeric) from public,anon;
grant execute on function public.reopen_quote(uuid,integer),public.schedule_move(uuid,integer,timestamptz,text,integer),public.record_move(uuid,integer,text,timestamptz,timestamptz,numeric) to authenticated;

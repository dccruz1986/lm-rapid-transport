create or replace function public.schedule_move(p_request uuid,p_version integer,p_at timestamptz,p_notes text,p_duration integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests; q public.quotes; m public.moves; updated public.moves;
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
      actual_miles=case when m.status='PENDING_REVIEW' then null else actual_miles end,version=version+1 where id=m.id returning * into updated;
    perform private.price_history(p_request,'move',m.id::text,to_jsonb(m),to_jsonb(updated),array['started_at','finished_at','actual_miles']);
  end if;
  return m.id;
end; $$;

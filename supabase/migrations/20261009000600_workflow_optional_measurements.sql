create or replace function public.communicate_quote(p_request uuid,p_version integer,p_medium text,p_at timestamptz,p_response text,p_confirm boolean) returns void
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests; q public.quotes; terms jsonb;
begin
  perform private.require_permission('quotes.confirm');
  select * into strict r from public.moving_requests where id=p_request for update;
  select * into strict q from public.quotes where request_id=p_request for update;
  if p_version is null or q.version<>p_version then raise exception 'CONFLICT'; end if;
  if r.status='COMPLETED' then perform private.require_permission('moves.correct'); end if;
  if r.status='CANCELLED' or q.status not in ('ACCEPTED','CONFIRMED') then raise exception 'INVALID_TRANSITION'; end if;
  if p_medium is null or p_medium not in ('PHONE','WHATSAPP','EMAIL') or p_at is null or not isfinite(p_at) or p_at>now()
    or p_at<date_trunc('minute',q.created_at) or p_response is null or length(p_response)>2000 or p_confirm is null
    or (p_confirm and length(trim(p_response))=0) then raise exception 'INVALID_INPUT'; end if;
  terms=jsonb_build_object('mode',q.mode,'workers',q.workers,'rate_cents',q.rate_cents,'minimum_hours',q.minimum_hours,
    'estimated_quantity',q.estimated_quantity,'estimated_total_cents',q.estimated_total_cents,'terms_version',q.terms_version);
  insert into public.quote_communications(quote_id,terms_version,terms,medium,communicated_at,response,confirmed_at,actor_id)
  values(q.id,q.terms_version,terms,p_medium,p_at,p_response,case when p_confirm then p_at end,auth.uid());
  update public.quotes set status=case when p_confirm then 'CONFIRMED' else status end,
    confirmed_terms=case when p_confirm then terms else confirmed_terms end,version=version+1 where id=q.id;
  if p_confirm then
    update public.moving_requests set status=case when status in ('IN_PROGRESS','COMPLETED') then status else 'CONFIRMED' end,version=version+1 where id=p_request;
    update public.moves set final_total_cents=revised_total_cents,revised_total_cents=null,version=version+1
      where request_id=p_request and status='COMPLETED' and revised_total_cents is not null;
  end if;
end; $$;
create or replace function public.record_move(p_request uuid,p_version integer,p_action text,p_start timestamptz,p_end timestamptz default null,p_miles numeric default null) returns void
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

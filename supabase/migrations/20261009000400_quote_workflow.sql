-- All workflow RPCs lock the request before its quote and move, matching cancellation.
create function private.quote_total(p_mode text,p_quantity numeric,p_rate integer,p_minimum integer) returns bigint
language plpgsql immutable set search_path='' as $$
begin
  if p_mode is null or p_mode not in ('LOCAL','PER_MILE') or p_quantity is null or not(p_quantity>0 and p_quantity<=10000)
    or (p_mode='LOCAL' and p_quantity>168) or p_rate is null or p_rate not between 1 and 10000000
    or p_minimum is null or p_minimum not between 1 and 24 then raise exception 'INVALID_INPUT'; end if;
  return (case when p_mode='LOCAL' then greatest(p_minimum,ceil(p_quantity)) else ceil(p_quantity) end)*p_rate;
end; $$;

create function private.price_history(p_request uuid,p_entity text,p_id text,p_before jsonb,p_after jsonb,p_fields text[]) returns void
language plpgsql set search_path='' as $$
declare f text;
begin
  foreach f in array p_fields loop
    if p_before->f is distinct from p_after->f then
      insert into public.pricing_change_history(request_id,entity_type,entity_id,field,old_value,new_value,actor_id)
      values(p_request,p_entity,p_id,f,p_before->f,p_after->f,auth.uid());
    end if;
  end loop;
end; $$;

create function public.save_quote(p_request uuid,p_version integer,p_mode text,p_workers integer,p_rate integer,p_quantity numeric) returns uuid
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests; q public.quotes; updated public.quotes; settings public.pricing_settings; m public.moves; changed boolean; total bigint;
begin
  perform private.require_permission('quotes.edit');
  select * into strict r from public.moving_requests where id=p_request for update;
  if r.status='CANCELLED' then raise exception 'INVALID_TRANSITION'; end if;
  select * into q from public.quotes where request_id=p_request for update;
  select * into m from public.moves where request_id=p_request for update;
  if m.status='COMPLETED' then perform private.require_permission('moves.correct'); end if;
  if p_version is null or coalesce(q.version,0)<>p_version then raise exception 'CONFLICT'; end if;
  if p_workers is null or p_workers not in (2,3,4) or p_quantity<>round(p_quantity,4) then raise exception 'INVALID_INPUT'; end if;
  select * into strict settings from public.pricing_settings where id;
  total=private.quote_total(p_mode,p_quantity,p_rate,coalesce(q.minimum_hours,settings.minimum_hours));
  -- Changing mode after work starts would invalidate the meaning of actual measurements.
  if m.status in ('IN_PROGRESS','COMPLETED') and q.mode<>p_mode then raise exception 'INVALID_TRANSITION'; end if;
  if q.id is null then
    insert into public.quotes(request_id,mode,workers,rate_cents,minimum_hours,estimated_quantity,estimated_total_cents)
    values(p_request,p_mode,p_workers,p_rate,settings.minimum_hours,p_quantity,total) returning * into updated;
  else
    changed=(q.mode,q.workers,q.rate_cents) is distinct from (p_mode,p_workers,p_rate);
    update public.quotes set mode=p_mode,workers=p_workers,rate_cents=p_rate,
      estimated_quantity=p_quantity,estimated_total_cents=total,version=version+1,
      terms_version=terms_version+case when changed then 1 else 0 end,
      status=case when changed then 'ESTIMATED' else status end
      where id=q.id returning * into updated;
    perform private.price_history(p_request,'quote',q.id::text,to_jsonb(q),to_jsonb(updated),array['rate_cents','estimated_quantity']);
    if changed and m.status='COMPLETED' then
      update public.moves set revised_total_cents=private.quote_total(p_mode,
        case when p_mode='LOCAL' then extract(epoch from (m.finished_at-m.started_at))/3600 else m.actual_miles end,
        p_rate,q.minimum_hours),version=version+1 where id=m.id;
    end if;
  end if;
  update public.moving_requests set workers=p_workers,
    status=case when status in ('IN_PROGRESS','COMPLETED') then status when updated.status='CONFIRMED' then 'CONFIRMED' else 'QUOTED' end,
    version=version+1 where id=p_request;
  return updated.id;
end; $$;

create function public.approve_quote(p_request uuid,p_version integer) returns void
language plpgsql security definer set search_path='' as $$
declare r public.moving_requests; q public.quotes;
begin
  perform private.require_permission('quotes.approve');
  select * into strict r from public.moving_requests where id=p_request for update;
  select * into strict q from public.quotes where request_id=p_request for update;
  if p_version is null or q.version<>p_version then raise exception 'CONFLICT'; end if;
  if r.status='COMPLETED' then perform private.require_permission('moves.correct'); end if;
  if r.status='CANCELLED' or q.status<>'ESTIMATED' then raise exception 'INVALID_TRANSITION'; end if;
  update public.quotes set status='ACCEPTED',version=version+1 where id=q.id;
end; $$;

create function public.communicate_quote(p_request uuid,p_version integer,p_medium text,p_at timestamptz,p_response text,p_confirm boolean) returns void
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
    or p_at<q.created_at or p_response is null or length(p_response)>2000 or p_confirm is null
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
revoke all on function private.quote_total(text,numeric,integer,integer),private.price_history(uuid,text,text,jsonb,jsonb,text[]) from public,anon,authenticated;
revoke all on function public.save_quote(uuid,integer,text,integer,integer,numeric),public.approve_quote(uuid,integer),public.communicate_quote(uuid,integer,text,timestamptz,text,boolean) from public,anon;
grant execute on function public.save_quote(uuid,integer,text,integer,integer,numeric),public.approve_quote(uuid,integer),public.communicate_quote(uuid,integer,text,timestamptz,text,boolean) to authenticated;

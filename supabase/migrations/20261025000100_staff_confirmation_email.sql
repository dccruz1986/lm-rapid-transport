-- One reservation per email, with bounded resend attempts across callers/processes.
create table private.staff_email_attempts (
 email text primary key, role text not null, last_at timestamptz not null,
 window_at timestamptz not null, attempts integer not null
);
revoke all on private.staff_email_attempts from public,anon,authenticated;

create function public.begin_staff_email(p_email text,p_role text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare target uuid; prior private.staff_email_attempts; normalized text=lower(trim(p_email));
begin
 perform private.require_permission('users.manage');
 if p_email is null or length(p_email)>254 or normalized !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$'
   or p_role is null or p_role not in ('ADMIN','MANAGER','DISPATCHER') then raise exception 'INVALID_INPUT'; end if;
 if p_role='ADMIN' then perform private.require_permission('users.admin'); end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(normalized,781));
 select * into prior from private.staff_email_attempts where email=normalized for update;
 if found and (prior.last_at>now()-interval '1 minute' or
   (prior.window_at>now()-interval '1 hour' and prior.attempts>=5)) then raise exception 'INVITE_RATE_LIMITED'; end if;
 if exists(select 1 from public.profiles where email=normalized) then
   target=public.pending_staff_invitation(normalized,p_role);
 else
   -- A failed/pending reservation must not be upgraded by a concurrent retry.
   if exists(select 1 from private.staff_invites where email=normalized and role<>p_role and created_at>now()-interval '1 day') then raise exception 'USER_EXISTS'; end if;
   perform public.reserve_staff_invite(normalized,p_role);
 end if;
 insert into private.staff_email_attempts values(normalized,p_role,now(),now(),1)
 on conflict(email) do update set role=excluded.role,last_at=now(),
   window_at=case when prior.window_at<=now()-interval '1 hour' then now() else prior.window_at end,
   attempts=case when prior.window_at<=now()-interval '1 hour' then 1 else prior.attempts+1 end;
 return jsonb_build_object('operation_id',gen_random_uuid(),'pending_id',target);
end; $$;
revoke all on function public.begin_staff_email(text,text) from public,anon;
grant execute on function public.begin_staff_email(text,text) to authenticated;

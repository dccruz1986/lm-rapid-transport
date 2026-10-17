-- Repeating an invitation after an SMTP failure must not grant a different role.
create function public.pending_staff_invitation(p_email text, p_role text) returns uuid
language plpgsql security definer set search_path='' as $$
declare target public.profiles;
begin
  perform private.require_permission('users.manage');
  select * into target from public.profiles where email=lower(trim(p_email));
  if not found then return null; end if;
  if target.role='ADMIN' or p_role='ADMIN' then
    perform private.require_permission('users.admin');
  end if;
  if target.role<>p_role or not target.active then raise exception 'USER_EXISTS'; end if;
  if exists(select 1 from auth.users where id=target.id and invited_at is not null
    and last_sign_in_at is null) then return target.id; end if;
  raise exception 'USER_EXISTS';
end; $$;
revoke all on function public.pending_staff_invitation(text,text) from public,anon;
grant execute on function public.pending_staff_invitation(text,text) to authenticated;

create or replace function private.provision_profile() returns trigger
language plpgsql security definer set search_path='' as $$
declare assigned text;
begin
  select role into assigned from private.staff_invites
    where email=lower(new.email) and created_at>now()-interval '1 day';
  insert into public.profiles(id,email,role,active)
    values(new.id,lower(new.email),coalesce(assigned,'DISPATCHER'),assigned is not null);
  delete from private.staff_invites where email=lower(new.email);
  return new;
end; $$;

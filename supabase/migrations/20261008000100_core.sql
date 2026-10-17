create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;

create table public.profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  full_name text not null default '',
  role text not null check (role in ('ADMIN','MANAGER','DISPATCHER','MOVER','DRIVER')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table private.role_permissions (
  role text not null,
  action text not null,
  primary key(role,action)
);
insert into private.role_permissions
select role, action from unnest(array['ADMIN','MANAGER','DISPATCHER']) role
cross join unnest(array['records.read','requests.edit','notes.manage','quotes.edit','quotes.approve','quotes.confirm','moves.schedule','moves.operate','records.cancel','records.reactivate','history.read']) action;
insert into private.role_permissions
select role, action from unnest(array['ADMIN','MANAGER']) role
cross join unnest(array['pricing.manage','moves.correct','users.manage']) action;
insert into private.role_permissions values ('ADMIN','users.admin');

create function private.has_permission(p_action text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p join private.role_permissions rp on rp.role=p.role
    where p.id=(select auth.uid()) and p.active and rp.action=p_action);
$$;
grant execute on function private.has_permission(text) to authenticated;
create function private.require_permission(p_action text) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.has_permission(p_action) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
end; $$;
create function public.my_permissions() returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(rp.action),array[]::text[]) from public.profiles p
  join private.role_permissions rp on rp.role=p.role where p.id=(select auth.uid()) and p.active;
$$;
grant execute on function public.my_permissions() to authenticated;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check(length(first_name) between 1 and 80),
  last_name text not null check(length(last_name) between 1 and 80),
  phone text not null unique check(phone ~ '^\+1[2-9][0-9]{9}$'),
  email text check(email is null or length(email)<=254),
  version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  street text not null check(length(street) between 3 and 200),
  unit text not null default '' check(length(unit)<=40),
  city text not null check(length(city) between 2 and 100),
  state text not null default 'FL' check(state='FL'),
  postal_code text not null check(postal_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  country text not null default 'US' check(country='US'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create sequence private.request_number_seq start 1001;
create table public.moving_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique default ('LM-' || lpad(nextval('private.request_number_seq')::text,6,'0')),
  customer_id uuid not null references public.customers(id),
  first_name text not null check(length(first_name) between 1 and 80),
  last_name text not null check(length(last_name) between 1 and 80),
  phone text not null check(phone ~ '^\+1[2-9][0-9]{9}$'),
  email text,
  origin_id uuid not null unique references public.addresses(id),
  destination_id uuid not null unique references public.addresses(id),
  moving_date date,
  property_type text not null check(property_type in ('HOUSE','APARTMENT','OFFICE','COMMERCIAL')),
  bedrooms smallint check(bedrooms between 0 and 20),
  property_size numeric check(property_size>0 and property_size<=1000000),
  size_unit text check(size_unit in ('SQFT','SQM')),
  origin_floor smallint not null check(origin_floor between -5 and 150),
  destination_floor smallint not null check(destination_floor between -5 and 150),
  origin_elevator boolean not null, destination_elevator boolean not null,
  workers smallint check(workers in (2,3,4)),
  comments text not null default '' check(length(comments)<=4000),
  status text not null default 'NEW' check(status in ('NEW','CONTACTED','QUOTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','PENDING_REVIEW')),
  cancelled_at timestamptz, cancellation_reason text check(length(cancellation_reason)<=1000),
  version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(origin_id<>destination_id),
  check((property_size is null and size_unit is null) or (property_size is not null and size_unit is not null)),
  check((property_type in ('HOUSE','APARTMENT') and bedrooms is not null) or (property_type in ('OFFICE','COMMERCIAL') and bedrooms is null))
);
create index requests_customer_idx on public.moving_requests(customer_id);
create index requests_status_created_idx on public.moving_requests(status,created_at desc);
create index requests_date_idx on public.moving_requests(moving_date);
create index customers_name_idx on public.customers(lower(last_name),lower(first_name));

create table public.pricing_settings (
  id boolean primary key default true check(id),
  hourly_two integer not null default 11900 check(hourly_two between 1 and 10000000),
  hourly_three integer not null default 14500 check(hourly_three between 1 and 10000000),
  hourly_four integer not null default 16500 check(hourly_four between 1 and 10000000),
  per_mile integer not null default 400 check(per_mile between 1 and 10000000),
  minimum_hours smallint not null default 3 check(minimum_hours between 1 and 24),
  version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into public.pricing_settings(id) values(true);
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.moving_requests(id),
  mode text not null check(mode in ('LOCAL','PER_MILE')),
  workers smallint not null check(workers in (2,3,4)),
  rate_cents integer not null check(rate_cents between 1 and 10000000),
  minimum_hours smallint not null check(minimum_hours between 1 and 24),
  estimated_quantity numeric(12,4) not null check(estimated_quantity>0 and estimated_quantity<=10000),
  estimated_total_cents bigint not null check(estimated_total_cents>=0),
  status text not null default 'ESTIMATED' check(status in ('ESTIMATED','ACCEPTED','CONFIRMED','CANCELLED')),
  terms_version integer not null default 1,
  confirmed_terms jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.quote_communications (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id),
  terms_version integer not null,
  terms jsonb not null,
  medium text not null check(medium in ('PHONE','WHATSAPP','EMAIL')),
  communicated_at timestamptz not null,
  response text not null default '' check(length(response)<=2000),
  confirmed_at timestamptz,
  actor_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index communications_quote_version_idx on public.quote_communications(quote_id,terms_version);
create table public.moves (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.moving_requests(id),
  customer_id uuid not null references public.customers(id),
  origin_id uuid not null references public.addresses(id),
  destination_id uuid not null references public.addresses(id),
  scheduled_at timestamptz not null,
  status text not null default 'SCHEDULED' check(status in ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED','PENDING_REVIEW')),
  notes text not null default '' check(length(notes)<=4000),
  estimated_duration_minutes integer check(estimated_duration_minutes>0),
  started_at timestamptz, finished_at timestamptz,
  actual_miles numeric(12,4) check(actual_miles>0 and actual_miles<=10000),
  final_total_cents bigint check(final_total_cents>=0),
  revised_total_cents bigint check(revised_total_cents>=0),
  cancelled_at timestamptz, cancellation_reason text check(length(cancellation_reason)<=1000),
  version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(finished_at is null or (started_at is not null and finished_at>started_at))
);
create index moves_customer_idx on public.moves(customer_id);
create index moves_date_idx on public.moves(scheduled_at,status);
create index moves_origin_idx on public.moves(origin_id);
create index moves_destination_idx on public.moves(destination_id);
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.moving_requests(id),
  body text not null check(length(body) between 1 and 4000),
  author_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index notes_request_idx on public.notes(request_id);
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.moving_requests(id),
  object_path text not null unique,
  file_name text not null,
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size integer not null check(byte_size between 1 and 5242880),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index attachments_request_idx on public.attachments(request_id);
create table public.pricing_change_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.moving_requests(id),
  entity_type text not null,
  entity_id text not null,
  field text not null,
  old_value jsonb, new_value jsonb,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index history_request_idx on public.pricing_change_history(request_id,created_at desc);
create table private.staff_invites (
  email text primary key,
  role text not null check(role in ('ADMIN','MANAGER','DISPATCHER')),
  invited_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create table private.intake_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  idempotency_key uuid not null unique,
  data jsonb not null,
  request_id uuid references public.moving_requests(id),
  expires_at timestamptz not null default now()+interval '30 minutes',
  cleanup_started boolean not null default false,
  created_at timestamptz not null default now()
);
create table private.intake_files (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references private.intake_sessions(id) on delete cascade,
  object_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size integer not null check(byte_size between 1 and 5242880),
  ready boolean not null default false,
  created_at timestamptz not null default now()
);
create table private.rate_limits (
  key text primary key,
  count integer not null,
  expires_at timestamptz not null
);

create function private.touch() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end; $$;
do $$ declare t text; begin
  foreach t in array array['profiles','customers','addresses','moving_requests','pricing_settings','quotes','quote_communications','moves','notes','attachments'] loop
    execute format('create trigger touch before update on public.%I for each row execute function private.touch()',t);
  end loop;
  foreach t in array array['profiles','customers','addresses','moving_requests','pricing_settings','quotes','quote_communications','moves','notes','attachments','pricing_change_history'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('create policy staff_read on public.%I for select to authenticated using (private.has_permission(%L))',t,case when t='pricing_change_history' then 'history.read' else 'records.read' end);
  end loop;
end $$;
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()));
revoke all on all tables in schema private from anon, authenticated;
revoke execute on all functions in schema private from public, anon;
grant execute on function private.has_permission(text) to authenticated;
grant usage,select on all sequences in schema private to service_role;

create function private.provision_profile() returns trigger
language plpgsql security definer set search_path='' as $$
declare assigned text;
begin
  select role into assigned from private.staff_invites where email=lower(new.email);
  insert into public.profiles(id,email,role,active) values(new.id,lower(new.email),coalesce(assigned,'DISPATCHER'),assigned is not null);
  delete from private.staff_invites where email=lower(new.email);
  return new;
end; $$;
create trigger provision_staff after insert on auth.users for each row execute function private.provision_profile();

create function public.reserve_staff_invite(p_email text,p_role text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_permission('users.manage');
  if p_role not in ('ADMIN','MANAGER','DISPATCHER') or length(p_email)>254 or p_email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then raise exception 'INVALID_INPUT'; end if;
  if p_role='ADMIN' then perform private.require_permission('users.admin'); end if;
  if exists(select 1 from public.profiles where email=lower(trim(p_email))) then raise exception 'USER_EXISTS'; end if;
  insert into private.staff_invites(email,role,invited_by) values(lower(trim(p_email)),p_role,auth.uid())
  on conflict(email) do update set role=excluded.role,invited_by=excluded.invited_by,created_at=now();
end; $$;
create function public.set_staff_active(p_id uuid,p_active boolean) returns void
language plpgsql security definer set search_path='' as $$
declare target public.profiles;
begin
  perform private.require_permission('users.manage');
  perform pg_catalog.pg_advisory_xact_lock(417829);
  select * into strict target from public.profiles where id=p_id for update;
  if target.role='ADMIN' then
    perform private.require_permission('users.admin');
    if not p_active and (select count(*) from public.profiles where role='ADMIN' and active)<=1 then raise exception 'LAST_ADMIN'; end if;
  end if;
  update public.profiles set active=p_active where id=p_id;
end; $$;
grant execute on function public.reserve_staff_invite(text,text),public.set_staff_active(uuid,boolean) to authenticated;

create function public.bootstrap_admin(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(417829);
  if exists(select 1 from public.profiles where role='ADMIN' and active) then raise exception 'ADMIN_ALREADY_EXISTS'; end if;
  update public.profiles set role='ADMIN',active=true where id=p_id;
  if not found then raise exception 'USER_NOT_FOUND'; end if;
end; $$;
revoke all on function public.bootstrap_admin(uuid) from public,anon,authenticated;
grant execute on function public.bootstrap_admin(uuid) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('request-photos','request-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy staff_photos on storage.objects for select to authenticated
using(bucket_id='request-photos' and private.has_permission('records.read') and exists(select 1 from public.attachments a where a.object_path=name));

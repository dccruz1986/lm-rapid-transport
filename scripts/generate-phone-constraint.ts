// Run when upgrading libphonenumber metadata; commit the generated SQL migration.
import metadata from "../packages/validation/node_modules/libphonenumber-js/metadata.max.json";

const types = metadata.countries.US[11] as string[][];
const patterns = types.map((type) => type[0]).filter((pattern): pattern is string => Boolean(pattern));
const pattern = `^\\+1(?:${patterns.join("|")})$`;
if (pattern.includes("'")) throw new Error("Unexpected metadata");
await Bun.write(
  "supabase/migrations/20261009000200_contact_validation.sql",
  `
-- Generated from the locked libphonenumber-js US metadata: NANP +1 alone is insufficient.
create function private.valid_us_phone(p_phone text) returns boolean
language sql immutable set search_path='' as $$ select p_phone ~ '${pattern}'; $$;
grant execute on function private.valid_us_phone(text) to authenticated,service_role;
alter table public.customers add constraint customers_us_phone check(private.valid_us_phone(phone));
alter table public.moving_requests add constraint requests_us_phone check(private.valid_us_phone(phone));

create or replace function public.edit_customer(p_id uuid,p_version integer,p_first text,p_last text,p_phone text,p_email text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.customers;
begin
  perform private.require_permission('requests.edit');
  select * into strict c from public.customers where id=p_id for update;
  if c.version<>p_version then raise exception 'CONFLICT'; end if;
  p_email=nullif(trim(p_email),'');
  if p_email is not null and p_email !~ '^[^@ ]+@[^@ ]+\\.[^@ ]+$' then raise exception 'INVALID_INPUT'; end if;
  update public.customers set first_name=trim(p_first),last_name=trim(p_last),phone=p_phone,email=p_email,version=version+1 where id=p_id;
end; $$;
`,
);
console.log("Generated US phone constraints from locked metadata.");

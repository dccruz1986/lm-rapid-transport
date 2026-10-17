
-- Generated from the locked libphonenumber-js US metadata: NANP +1 alone is insufficient.
create function private.valid_us_phone(p_phone text) returns boolean
language sql immutable set search_path='' as $$ select p_phone ~ '^\+1(?:983[2-57-9]\d{6}|(?:2(?:0[1-35-9]|1[02-9]|2[03-57-9]|3[1459]|4[08]|5[1-46]|6[0279]|7[02469]|8[13])|3(?:0[1-57-9]|1[02-9]|2[013-79]|3[0-24679]|4[167]|5[0-3]|6[01349]|8[056])|4(?:0[124-9]|1[02-579]|2[3-5]|3[0245]|4[023578]|58|6[349]|7[02589]|8[04])|5(?:0[1-57-9]|1[0235-8]|20|3[0149]|4[01]|5[179]|6[1-47]|7[0-5]|8[0256])|6(?:0[1-35-9]|1[024-9]|2[03689]|3[016]|4[0156]|5[01679]|6[0-279]|78|8[0-269])|7(?:0[1-46-8]|1[2-9]|2[04-8]|3[0-2478]|4[0378]|5[47]|6[02359]|7[0-59]|8[156])|8(?:0[1-68]|1[02-8]|2[0168]|3[0-2589]|4[03578]|5[046-9]|6[02-5]|7[028])|9(?:0[1346-9]|1[02-9]|2[0589]|3[0146-8]|4[01357-9]|5[12469]|7[0-3589]|8[04-69]))[2-9]\d{6}|8(?:00|33|44|55|66|77|88)[2-9]\d{6}|900[2-9]\d{6}|52(?:3(?:[2-46-9][02-9]\d|5(?:[02-46-9]\d|5[0-46-9]))|4(?:[2-478][02-9]\d|5(?:[034]\d|2[024-9]|5[0-46-9])|6(?:0[1-9]|[2-9]\d)|9(?:[05-9]\d|2[0-5]|49)))\d{4}|52[34][2-9]1[02-9]\d{4}|5(?:00|2[125-9]|3[23]|44|66|77|88)[2-9]\d{6})$'; $$;
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
  if p_email is not null and p_email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then raise exception 'INVALID_INPUT'; end if;
  update public.customers set first_name=trim(p_first),last_name=trim(p_last),phone=p_phone,email=p_email,version=version+1 where id=p_id;
end; $$;

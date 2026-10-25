create or replace function private.check_route_ready() returns trigger language plpgsql security definer set search_path='' as $$
declare r public.moving_requests;
begin
 select * into strict r from public.moving_requests where id=new.request_id for update;
 if tg_table_name='quotes' then
  if new.status='ACCEPTED' and new.mode='LOCAL' then return new; end if;
 end if;
 if r.intake_version=2 then
  if not r.territorial_reviewed or r.suggested_mode is null or exists(select 1 from public.addresses where id in (r.origin_id,r.destination_id) and (street is null or city is null or postal_code is null or state is distinct from 'FL' or country is distinct from 'US' or county is null)) then raise exception 'ROUTE_REVIEW_REQUIRED'; end if;
  if tg_table_name='quotes' then
   if new.mode<>r.suggested_mode then raise exception 'ROUTE_REVIEW_REQUIRED'; end if;
  elsif exists(select 1 from public.quotes where request_id=r.id and mode<>r.suggested_mode) then raise exception 'ROUTE_REVIEW_REQUIRED'; end if;
 end if;
 return new;
end; $$;



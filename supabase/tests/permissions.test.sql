begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users(id,email) values
('90000000-0000-0000-0000-000000000001','rls-admin@example.test'),
('90000000-0000-0000-0000-000000000002','rls-manager@example.test'),
('90000000-0000-0000-0000-000000000003','rls-dispatcher@example.test');
update public.profiles set active=true,role='ADMIN' where email='rls-admin@example.test';
update public.profiles set active=true,role='MANAGER' where email='rls-manager@example.test';
update public.profiles set active=true,role='DISPATCHER' where email='rls-dispatcher@example.test';

select ok(not has_table_privilege('anon','public.customers','SELECT'),'Anonymous cannot read customers');
select ok(not has_table_privilege('authenticated','public.quotes','UPDATE'),'Staff cannot bypass RPC and update quotes directly');
select ok(not has_function_privilege('authenticated','public.bootstrap_admin(uuid)','EXECUTE'),'Staff cannot execute bootstrap');

set local role authenticated;
select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000003',true);
select ok(private.has_permission('quotes.approve'),'Dispatcher can approve individual quotes');
select ok(not private.has_permission('pricing.manage'),'Dispatcher cannot manage global prices');
select is((select count(*)::integer from public.customers where id::text like '10000000-%'),10,'Dispatcher can read all development customers');
select throws_ok($$select public.reserve_staff_invite('forbidden@example.test','ADMIN')$$,'42501',null,'Dispatcher cannot invite staff');
select ok(private.has_permission('history.read'),'Dispatcher can read pricing history');

reset role;
update public.profiles set active=false where email='rls-dispatcher@example.test';
set local role authenticated;
select is((select count(*)::integer from public.customers),0,'Deactivated user immediately loses record access');
select is(cardinality(public.my_permissions()),0,'Deactivated user has no effective permissions');
select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.reserve_staff_invite('forbidden@example.test','ADMIN')$$,'42501',null,'Manager cannot invite an ADMIN');
select lives_ok($$select public.reserve_staff_invite('allowed@example.test','DISPATCHER')$$,'Manager can reserve a dispatcher invitation');
reset role;

select * from finish();
rollback;

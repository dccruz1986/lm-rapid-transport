begin;
create extension if not exists pgtap with schema extensions;
select plan(8);
insert into auth.users(id,email) values
('91000000-0000-0000-0000-000000000001','invite-admin@example.test'),
('91000000-0000-0000-0000-000000000002','invite-manager@example.test');
update public.profiles set active=true,role='ADMIN' where email='invite-admin@example.test';
update public.profiles set active=true,role='MANAGER' where email='invite-manager@example.test';
set local role authenticated;
select set_config('request.jwt.claim.sub','91000000-0000-0000-0000-000000000002',true);
select lives_ok($$select public.reserve_staff_invite('pending@example.test','DISPATCHER')$$,'Manager reserves invitation');
reset role;
insert into auth.users(id,email,invited_at) values
('91000000-0000-0000-0000-000000000003','pending@example.test',now());
select is((select role from public.profiles where email='pending@example.test'),'DISPATCHER','Invitation assigns reserved role');
set local role authenticated;
select is(public.pending_staff_invitation('pending@example.test','DISPATCHER'),'91000000-0000-0000-0000-000000000003'::uuid,'Retry recovers same pending account');
select throws_ok($$select public.pending_staff_invitation('pending@example.test','ADMIN')$$,'42501',null,'Manager cannot upgrade invitation to ADMIN');
select throws_ok($$select public.pending_staff_invitation('pending@example.test','MANAGER')$$,'P0001','USER_EXISTS','Retry cannot change role');
reset role;
update auth.users set last_sign_in_at=now() where email='pending@example.test';
set local role authenticated;
select throws_ok($$select public.pending_staff_invitation('pending@example.test','DISPATCHER')$$,'P0001','USER_EXISTS','Active account is not reinvited');
select lives_ok($$select public.reserve_staff_invite('expired@example.test','MANAGER')$$,'Reserve another invitation');
reset role;
update private.staff_invites set created_at=now()-interval '2 days' where email='expired@example.test';
insert into auth.users(id,email) values ('91000000-0000-0000-0000-000000000004','expired@example.test');
select is((select active from public.profiles where email='expired@example.test'),false,'Expired reservation cannot enable an account');
select * from finish();
rollback;

begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
select ok(not has_function_privilege('anon','public.intake_begin(uuid,text,jsonb)','EXECUTE'),'Anonymous cannot call privileged intake RPC');
select ok(not has_function_privilege('authenticated','public.intake_finalize(text)','EXECUTE'),'Staff cannot bypass intake validation with service RPC');
select ok(public.intake_quota('integration-quota',1,3600),'First quota operation allowed');
select ok(not public.intake_quota('integration-quota',1,3600),'Persistent quota blocks second operation');
insert into private.intake_sessions(id,token_hash,idempotency_key,data) values
('92000000-0000-0000-0000-000000000001',repeat('a',64),gen_random_uuid(),'{}');
select lives_ok($$select public.intake_file(repeat('a',64),'92000000-0000-0000-0000-000000000002','reserve','photo.png','image/png',100)$$,'Reserve temporary file');
select throws_ok($$select public.intake_finalize(repeat('a',64))$$,'P0001','FILES_PENDING','Incomplete file prevents partial request');
select lives_ok($$select public.intake_file(repeat('a',64),'92000000-0000-0000-0000-000000000002','get')$$,'Mark file for removal');
select throws_ok($$select public.intake_file(repeat('a',64),'92000000-0000-0000-0000-000000000002','ready')$$,'P0001','CONFLICT','Upload cannot mark removing file ready');
update private.intake_sessions set expires_at=now()-interval '2 hours' where token_hash=repeat('a',64);
select is((select count(*)::integer from public.intake_cleanup_candidates()),1,'Cleanup claims expired session');
select throws_ok($$select public.intake_file(repeat('a',64),'92000000-0000-0000-0000-000000000002','reserve','photo.png','image/png',100)$$,'P0001','EXPIRED','Claimed session rejects further uploads');
select * from finish();
rollback;

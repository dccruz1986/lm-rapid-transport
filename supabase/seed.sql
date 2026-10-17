-- Development fixtures only. Never load this file into production.
do $$
declare i integer; c uuid; a uuid; b uuid; r uuid; q uuid; s text; day date;
begin
  for i in 1..10 loop
    insert into public.customers(id,first_name,last_name,phone,email)
    values(('10000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'Cliente '||i,'Ejemplo','+130555501'||lpad(i::text,2,'0'),'example'||i||'@example.test');
  end loop;
  for i in 1..15 loop
    c=('10000000-0000-0000-0000-'||lpad((((i-1)%10)+1)::text,12,'0'))::uuid;
    insert into public.addresses(street,city,postal_code) values('Dirección ficticia '||i,'Miami','33130') returning id into a;
    insert into public.addresses(street,city,postal_code) values('Destino ficticio '||i,case when i%2=0 then 'Orlando' else 'Miami' end,'33131') returning id into b;
    s=(array['NEW','CONTACTED','QUOTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','PENDING_REVIEW'])[((i-1)%8)+1];
    day=(now() at time zone 'America/New_York')::date+case when s='COMPLETED' then -i when s='IN_PROGRESS' then -1 else i end;
    if extract(dow from day)=0 then day=day+1; end if;
    insert into public.moving_requests(customer_id,first_name,last_name,phone,email,origin_id,destination_id,moving_date,property_type,bedrooms,origin_floor,destination_floor,origin_elevator,destination_elevator,workers,status)
    select c,first_name,last_name,phone,email,a,b,case when i%4=0 then null else day end,case when i%3=0 then 'OFFICE' else 'APARTMENT' end,case when i%3=0 then null else 2 end,1,0,true,false,2,s from public.customers where id=c returning id into r;
    if s in ('QUOTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','PENDING_REVIEW') then
      insert into public.quotes(request_id,mode,workers,rate_cents,minimum_hours,estimated_quantity,estimated_total_cents,status,confirmed_terms)
      values(r,case when i%2=0 then 'PER_MILE' else 'LOCAL' end,2,case when i%2=0 then 400 else 11900 end,3,case when i%2=0 then 100 else 3 end,case when i%2=0 then 40000 else 35700 end,case when s in ('QUOTED','PENDING_REVIEW') then 'ESTIMATED' when s='CANCELLED' then 'CANCELLED' else 'CONFIRMED' end,case when s in ('CONFIRMED','IN_PROGRESS','COMPLETED') then jsonb_build_object('mode',case when i%2=0 then 'PER_MILE' else 'LOCAL' end,'rate_cents',case when i%2=0 then 400 else 11900 end,'minimum_hours',3,'workers',2) else null end) returning id into q;
    end if;
    if s in ('CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','PENDING_REVIEW') then
      insert into public.moves(request_id,customer_id,origin_id,destination_id,scheduled_at,status,started_at,finished_at,actual_miles,final_total_cents)
      values(r,c,a,b,(day+time '09:00') at time zone 'America/New_York',case when s='CONFIRMED' then 'SCHEDULED' else s end,case when s in ('IN_PROGRESS','COMPLETED') then now()-interval '4 hours' end,case when s='COMPLETED' then now() end,case when s='COMPLETED' and i%2=0 then 110.2 end,case when s='COMPLETED' then case when i%2=0 then 44400 else 47600 end end);
    end if;
  end loop;
end $$;

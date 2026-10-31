-- Preserve unknown counts for the 5+ size category and review all edited routes.
do $$ declare c record; begin
 for c in select conname from pg_constraint where conrelid='public.moving_requests'::regclass and contype='c'
 and pg_get_constraintdef(oid) like '%property_type%' and pg_get_constraintdef(oid) like '%bedrooms%' loop
 execute format('alter table public.moving_requests drop constraint %I',c.conname);
 end loop;
end $$;
alter table public.moving_requests add constraint property_bedrooms_consistent check(
 property_type is null or (property_type in ('HOUSE','APARTMENT') and (bedrooms is not null or move_size='BEDROOMS_5_PLUS'))
 or (property_type in ('OFFICE','COMMERCIAL') and bedrooms is null));
update public.moving_requests set move_size=case when property_type in ('OFFICE','COMMERCIAL') then property_type
 when bedrooms=0 then 'STUDIO' when bedrooms between 1 and 4 then 'BEDROOMS_'||bedrooms::text when bedrooms>=5 then 'BEDROOMS_5_PLUS' end
 where intake_version=1;

create function private.invalidate_location_review() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (new.street,new.unit,new.city,new.postal_code,new.state,new.country,new.county) is distinct from
 (old.street,old.unit,old.city,old.postal_code,old.state,old.country,old.county) then
  update public.moving_requests set territorial_reviewed=false,suggested_mode=null,territorial_source='MANUAL'
  where origin_id=new.id or destination_id=new.id;
 end if;
 return new;
end; $$;
create trigger address_invalidates_review after update on public.addresses for each row execute function private.invalidate_location_review();

create or replace function public.edit_customer(p_id uuid,p_version integer,p_first text,p_last text,p_phone text,p_email text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_permission('requests.edit');
 perform 1 from public.customers where id=p_id and version=p_version for update;
 if not found then raise exception 'CONFLICT'; end if;
 update public.customers set full_name=concat_ws(' ',trim(p_first),trim(p_last)),first_name=trim(p_first),last_name=trim(p_last),phone=p_phone,email=nullif(p_email,''),version=version+1 where id=p_id;
end; $$;

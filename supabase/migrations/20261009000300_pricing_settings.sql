create function public.update_pricing_settings(p_version integer, p_two integer, p_three integer, p_four integer, p_mile integer, p_minimum integer) returns void
language plpgsql security definer set search_path='' as $$
declare previous public.pricing_settings; updated public.pricing_settings; field_name text;
begin
  perform private.require_permission('pricing.manage');
  select * into strict previous from public.pricing_settings where id for update;
  if p_version is null or previous.version<>p_version then raise exception 'CONFLICT'; end if;
  update public.pricing_settings set hourly_two=p_two,hourly_three=p_three,hourly_four=p_four,
    per_mile=p_mile,minimum_hours=p_minimum,version=version+1 where id returning * into updated;
  foreach field_name in array array['hourly_two','hourly_three','hourly_four','per_mile','minimum_hours'] loop
    if to_jsonb(previous)->field_name is distinct from to_jsonb(updated)->field_name then
      insert into public.pricing_change_history(entity_type,entity_id,field,old_value,new_value,actor_id)
      values('pricing_settings','true',field_name,to_jsonb(previous)->field_name,to_jsonb(updated)->field_name,auth.uid());
    end if;
  end loop;
end; $$;
revoke all on function public.update_pricing_settings(integer,integer,integer,integer,integer,integer) from public,anon;
grant execute on function public.update_pricing_settings(integer,integer,integer,integer,integer,integer) to authenticated;

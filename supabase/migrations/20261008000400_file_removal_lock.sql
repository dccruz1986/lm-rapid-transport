alter table private.intake_files add column deleting boolean not null default false;

create or replace function public.intake_file(p_hash text,p_id uuid,p_action text,p_name text default '',p_mime text default '',p_size integer default 0) returns text
language plpgsql security definer set search_path='' as $$
declare session private.intake_sessions; item private.intake_files; object_name text;
begin
  select * into strict session from private.intake_sessions where token_hash=p_hash for update;
  if session.request_id is not null or session.expires_at<now() or session.cleanup_started then raise exception 'EXPIRED'; end if;
  select * into item from private.intake_files where id=p_id and session_id=session.id;
  if p_action='reserve' then
    if found then
      if item.deleting then raise exception 'CONFLICT'; end if;
      if item.file_name<>p_name or item.mime_type<>p_mime or item.byte_size<>p_size then raise exception 'CONFLICT'; end if;
      return item.object_path;
    end if;
    if p_size not between 1 and 5242880 or p_mime not in ('image/jpeg','image/png','image/webp') or length(p_name)>120 then raise exception 'INVALID_FILE'; end if;
    if (select count(*) from private.intake_files where session_id=session.id)>=8 then raise exception 'FILE_LIMIT'; end if;
    object_name=session.id::text||'/'||p_id::text;
    insert into private.intake_files(id,session_id,object_path,file_name,mime_type,byte_size) values(p_id,session.id,object_name,p_name,p_mime,p_size);
    return object_name;
  end if;
  if item.id is null then raise exception 'FILE_NOT_FOUND'; end if;
  if p_action='ready' then
    if item.deleting then raise exception 'CONFLICT'; end if;
    update private.intake_files set ready=true where id=p_id;
  elsif p_action='get' then
    -- Mark before deleting Storage so concurrent finalization sees a pending file.
    update private.intake_files set deleting=true,ready=false where id=p_id;
  elsif p_action='remove' then
    delete from private.intake_files where id=p_id and deleting;
  else raise exception 'INVALID_ACTION'; end if;
  return item.object_path;
end; $$;

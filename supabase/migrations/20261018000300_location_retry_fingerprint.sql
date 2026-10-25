-- Keep retries identical even if a location proof expires between begin attempts.
create or replace function public.intake_begin(p_key uuid,p_hash text,p_data jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare existing private.intake_sessions; result uuid;
begin
  if length(p_hash)<>64 or octet_length(p_data::text)>20000 then raise exception 'INVALID_INPUT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
  select * into existing from private.intake_sessions where idempotency_key=p_key;
  if found then
    if existing.token_hash<>p_hash or (existing.data<>p_data and not (existing.data->>'version'='2' and p_data->>'version'='2' and existing.data->>'client_fingerprint' is not null and existing.data->>'client_fingerprint'=p_data->>'client_fingerprint')) then raise exception 'CONFLICT'; end if;
    if existing.expires_at<now() or existing.cleanup_started then raise exception 'EXPIRED'; end if;
    return existing.id;
  end if;
  insert into private.intake_sessions(idempotency_key,token_hash,data) values(p_key,p_hash,p_data) returning id into result;
  return result;
end; $$;


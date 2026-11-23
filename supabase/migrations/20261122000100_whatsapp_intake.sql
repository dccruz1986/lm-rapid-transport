create table private.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null default gen_random_uuid(),
  phone_number_id text not null,
  sender text not null,
  step text not null default 'START',
  answers jsonb not null default '{}'::jsonb,
  editing boolean not null default false,
  request_id uuid references public.moving_requests(id),
  updated_at timestamptz not null default now(),
  unique (phone_number_id, sender)
);

create table private.whatsapp_messages (
  message_id text primary key,
  conversation_id uuid not null references private.whatsapp_conversations(id),
  received_at timestamptz not null default now()
);

create table private.whatsapp_outbox (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references private.whatsapp_conversations(id),
  body text not null,
  state text not null default 'PENDING' check (state in ('PENDING', 'SENDING', 'SENT', 'FAILED')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index whatsapp_outbox_pending_idx on private.whatsapp_outbox (next_attempt_at)
  where state in ('PENDING', 'FAILED');

revoke all on private.whatsapp_conversations, private.whatsapp_messages, private.whatsapp_outbox from public, anon, authenticated;
grant select, insert, update on private.whatsapp_conversations, private.whatsapp_messages, private.whatsapp_outbox to service_role;
grant usage, select on sequence private.whatsapp_outbox_id_seq to service_role;

create or replace function public.whatsapp_receive(p_number_id text, p_sender text, p_message_id text, p_text text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  c private.whatsapp_conversations;
  answer text := trim(p_text);
  reply text;
  next_step text;
  next_answers jsonb;
  desired date;
  created_request uuid;
  reference text;
  intake_hash text;
  intake_data jsonb;
  normalized_phone text;
  size_value text;
  editing_now boolean;
begin
  if length(p_number_id) not between 1 and 100 or length(p_sender) not between 10 and 20
    or length(p_message_id) not between 1 and 300 or length(answer) > 1000 then
    raise exception 'INVALID_INPUT';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_number_id || ':' || p_sender, 0));
  insert into private.whatsapp_conversations(phone_number_id, sender)
    values(p_number_id, p_sender) on conflict(phone_number_id, sender) do nothing;
  select * into strict c from private.whatsapp_conversations
    where phone_number_id = p_number_id and sender = p_sender for update;
  insert into private.whatsapp_messages(message_id, conversation_id)
    values(p_message_id, c.id) on conflict(message_id) do nothing;
  if not found then return; end if;
  next_step := c.step;
  next_answers := c.answers;
  editing_now := c.editing;
  if c.step = 'START' or c.step = 'DONE' then
    next_step := 'ORIGIN';
    next_answers := '{}'::jsonb;
    editing_now := false;
    if c.step = 'DONE' then
      update private.whatsapp_conversations set request_id = null, draft_id = gen_random_uuid() where id = c.id;
    end if;
    reply := 'Para solicitar una mudanza, ¿cuál es el ZIP o dirección de origen en Florida?';
  elsif c.step = 'ORIGIN' then
    if length(answer) between 3 and 300 then
      next_answers := jsonb_set(next_answers, '{origin}', to_jsonb(answer));
      next_step := 'DESTINATION';
      reply := '¿Cuál es el ZIP o dirección de destino en Florida?';
    else reply := 'Escribe un ZIP o dirección de origen válido.'; end if;
  elsif c.step = 'DESTINATION' then
    if length(answer) between 3 and 300 then
      next_answers := jsonb_set(next_answers, '{destination}', to_jsonb(answer));
      next_step := 'DATE';
      reply := '¿Qué fecha prefieres? Escríbela como AAAA-MM-DD.';
    else reply := 'Escribe un ZIP o dirección de destino válido.'; end if;
  elsif c.step = 'DATE' then
    begin
      if answer !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'DATE'; end if;
      desired := answer::date;
      if to_char(desired, 'YYYY-MM-DD') <> answer or desired <= (now() at time zone 'America/New_York')::date
        or extract(dow from desired) = 0 then raise exception 'DATE'; end if;
      next_answers := jsonb_set(next_answers, '{moving_date}', to_jsonb(answer));
      next_step := 'SIZE';
      reply := '¿Cuál es el tamaño? Responde ESTUDIO, 1, 2, 3, 4, 5+, OFICINA o COMERCIAL.';
    exception when others then reply := 'Indica una fecha futura que no sea domingo, como AAAA-MM-DD.'; end;
  elsif c.step = 'SIZE' then
    size_value := case upper(answer)
      when 'ESTUDIO' then 'STUDIO' when '1' then 'BEDROOMS_1' when '2' then 'BEDROOMS_2'
      when '3' then 'BEDROOMS_3' when '4' then 'BEDROOMS_4' when '5+' then 'BEDROOMS_5_PLUS'
      when 'OFICINA' then 'OFFICE' when 'COMERCIAL' then 'COMMERCIAL' else null end;
    if size_value is not null then
      next_answers := jsonb_set(next_answers, '{move_size}', to_jsonb(size_value));
      next_step := 'NAME';
      reply := '¿Cuál es tu nombre completo?';
    else reply := 'Responde ESTUDIO, 1, 2, 3, 4, 5+, OFICINA o COMERCIAL.'; end if;
  elsif c.step = 'NAME' then
    if length(answer) between 1 and 160 then
      next_answers := jsonb_set(next_answers, '{full_name}', to_jsonb(answer));
      next_step := 'PHONE';
      reply := '¿Qué teléfono estadounidense usamos para contactarte? Puedes escribir ESTE para usar tu número de WhatsApp.';
    else reply := 'Escribe tu nombre, de hasta 160 caracteres.'; end if;
  elsif c.step = 'PHONE' then
    normalized_phone := regexp_replace(case when upper(answer) = 'ESTE' then p_sender else answer end, '[^0-9]', '', 'g');
    if length(normalized_phone) = 10 then normalized_phone := '1' || normalized_phone; end if;
    if normalized_phone ~ '^1[2-9][0-9]{9}$' then
      next_answers := jsonb_set(next_answers, '{phone}', to_jsonb('+' || normalized_phone));
      next_step := 'EMAIL';
      reply := '¿Cuál es tu correo? Si prefieres omitirlo, escribe OMITIR.';
    else reply := 'Escribe un número estadounidense válido o ESTE.'; end if;
  elsif c.step = 'EMAIL' then
    if upper(answer) = 'OMITIR' or answer ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' and length(answer) <= 254 then
      next_answers := jsonb_set(next_answers, '{email}', case when upper(answer) = 'OMITIR' then 'null'::jsonb else to_jsonb(answer) end);
      next_step := 'REVIEW';
      reply := format('Confirma tu solicitud: origen %s, destino %s, fecha %s, tamaño %s, nombre %s, teléfono %s, correo %s. Responde CONFIRMAR o EDITAR.',
        next_answers->>'origin', next_answers->>'destination', next_answers->>'moving_date', next_answers->>'move_size',
        next_answers->>'full_name', next_answers->>'phone', coalesce(next_answers->>'email', 'omitido'));
    else reply := 'Escribe un correo válido o OMITIR.'; end if;
  elsif c.step = 'REVIEW' then
    if upper(answer) = 'EDITAR' then
      reply := 'Indica qué quieres corregir: EDITAR ORIGEN, DESTINO, FECHA, TAMAÑO, NOMBRE, TELÉFONO o CORREO.';
    elsif upper(answer) in ('EDITAR ORIGEN', 'EDITAR DESTINO', 'EDITAR FECHA', 'EDITAR TAMAÑO', 'EDITAR NOMBRE', 'EDITAR TELÉFONO', 'EDITAR TELEFONO', 'EDITAR CORREO') then
      next_step := case upper(answer)
        when 'EDITAR ORIGEN' then 'ORIGIN' when 'EDITAR DESTINO' then 'DESTINATION'
        when 'EDITAR FECHA' then 'DATE' when 'EDITAR TAMAÑO' then 'SIZE'
        when 'EDITAR NOMBRE' then 'NAME' when 'EDITAR CORREO' then 'EMAIL' else 'PHONE' end;
      editing_now := true;
      reply := case next_step when 'ORIGIN' then 'Escribe el nuevo ZIP o dirección de origen.'
        when 'DESTINATION' then 'Escribe el nuevo ZIP o dirección de destino.'
        when 'DATE' then 'Escribe la nueva fecha como AAAA-MM-DD.'
        when 'SIZE' then 'Escribe ESTUDIO, 1, 2, 3, 4, 5+, OFICINA o COMERCIAL.'
        when 'NAME' then 'Escribe el nombre completo.'
        when 'PHONE' then 'Escribe el teléfono estadounidense o ESTE.'
        else 'Escribe el nuevo correo u OMITIR.' end;
    elsif upper(answer) = 'CONFIRMAR' then
      if c.request_id is null then
        intake_hash := md5(c.draft_id::text) || md5('whatsapp:' || c.draft_id::text);
        intake_data := jsonb_build_object(
          'version', 2,
          'full_name', next_answers->>'full_name',
          'phone', next_answers->>'phone',
          'email', next_answers->>'email',
          'moving_date', next_answers->>'moving_date',
          'move_size', next_answers->>'move_size',
          'comments', '',
          'territorial_source', 'MANUAL',
          'origin', jsonb_build_object('input', next_answers->>'origin',
            'postal_code', case when next_answers->>'origin' ~ '^[0-9]{5}$' then next_answers->>'origin' end,
            'precision', 'MANUAL'),
          'destination', jsonb_build_object('input', next_answers->>'destination',
            'postal_code', case when next_answers->>'destination' ~ '^[0-9]{5}$' then next_answers->>'destination' end,
            'precision', 'MANUAL'),
          'bedrooms', case when next_answers->>'move_size' = 'STUDIO' then 0
            when next_answers->>'move_size' ~ '^BEDROOMS_[1-4]$' then right(next_answers->>'move_size', 1)::integer end,
          'property_type', case when next_answers->>'move_size' in ('OFFICE', 'COMMERCIAL') then next_answers->>'move_size' end
        );
        perform public.intake_begin(c.draft_id, intake_hash, intake_data);
        reference := public.intake_finalize(intake_hash);
        select request_id into strict created_request from private.intake_sessions where idempotency_key = c.draft_id;
        update public.moving_requests set status = 'PENDING_REVIEW' where id = created_request;
        update private.whatsapp_conversations set request_id = created_request where id = c.id;
      else
        select request_number into reference from public.moving_requests where id = c.request_id;
      end if;
      next_step := 'DONE';
      reply := 'Recibimos tu solicitud ' || reference || '. Te contactaremos para confirmar los detalles.';
    else reply := 'Responde CONFIRMAR para enviarla o EDITAR para corregirla.'; end if;
  end if;
  if c.editing and c.step <> 'REVIEW' and next_step <> c.step then
    next_step := 'REVIEW';
    editing_now := false;
    reply := format('Revisa tu solicitud: origen %s, destino %s, fecha %s, tamaño %s, nombre %s, teléfono %s, correo %s. Responde CONFIRMAR o EDITAR.',
      next_answers->>'origin', next_answers->>'destination', next_answers->>'moving_date', next_answers->>'move_size',
      next_answers->>'full_name', next_answers->>'phone', coalesce(next_answers->>'email', 'omitido'));
  end if;
  update private.whatsapp_conversations set step = next_step, answers = next_answers, editing = editing_now, updated_at = now() where id = c.id;
  insert into private.whatsapp_outbox(conversation_id, body) values(c.id, reply);
end; $$;

revoke all on function public.whatsapp_receive(text, text, text, text) from public, anon, authenticated;
grant execute on function public.whatsapp_receive(text, text, text, text) to service_role;

alter table private.whatsapp_outbox add column claimed_at timestamptz;

create or replace function public.whatsapp_claim_outbox(p_number_id text)
returns table(id bigint, recipient text, body text) language sql security definer set search_path = '' as $$
  with claimed as (
    select o.id from private.whatsapp_outbox o
    join private.whatsapp_conversations c on c.id = o.conversation_id
    where c.phone_number_id = p_number_id
      and ((o.state in ('PENDING', 'FAILED') and o.next_attempt_at <= now())
        or (o.state = 'SENDING' and o.claimed_at < now() - interval '2 minutes'))
      and o.attempts < 8
    order by o.id limit 10 for update of o skip locked
  ), updated as (
    update private.whatsapp_outbox o set state = 'SENDING', claimed_at = now(), attempts = attempts + 1
    from claimed where o.id = claimed.id returning o.id, o.conversation_id, o.body
  )
  select u.id, c.sender, u.body from updated u
  join private.whatsapp_conversations c on c.id = u.conversation_id;
$$;

create or replace function public.whatsapp_finish_outbox(p_id bigint, p_sent boolean)
returns void language sql security definer set search_path = '' as $$
  update private.whatsapp_outbox
    set state = case when p_sent then 'SENT' else 'FAILED' end,
      claimed_at = null,
      next_attempt_at = now() + make_interval(secs => least(3600, (power(2, attempts)::integer * 10)))
    where id = p_id and state = 'SENDING';
$$;

revoke all on function public.whatsapp_claim_outbox(text), public.whatsapp_finish_outbox(bigint, boolean)
  from public, anon, authenticated;
grant execute on function public.whatsapp_claim_outbox(text), public.whatsapp_finish_outbox(bigint, boolean)
  to service_role;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create or replace function private.whatsapp_drain_outbox() returns void
language plpgsql security definer set search_path = '' as $$
declare
  callback text;
  secret text;
begin
  select decrypted_secret into callback from vault.decrypted_secrets where name = 'whatsapp_webhook_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'whatsapp_drain_secret';
  if callback is null or secret is null then return; end if;
  perform net.http_post(
    url := callback,
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-WhatsApp-Drain-Secret', secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
end; $$;

revoke all on function private.whatsapp_drain_outbox() from public, anon, authenticated;
select cron.schedule('whatsapp-outbox-drain', '* * * * *', 'select private.whatsapp_drain_outbox()');

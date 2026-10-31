# Invitaciones de personal con Resend

El admin reserva la invitación/rol, genera el token con Supabase Auth y llama a la función resend con to, action_url y operation_id. El correo usa el callback SSR /auth/confirm y no contiene contraseñas. La recuperación ordinaria continúa usando SMTP de Supabase.

## Configuración

- Admin: SUPABASE_SECRET_KEY (clave secret de Supabase llamada default), NEXT_PUBLIC_SUPABASE_URL y ADMIN_URL.
- Edge Function: RESEND_API_KEY (secreto Resend con permiso de envío), RESEND_FROM_EMAIL (remitente autorizado), ADMIN_URL (mismo origen público del admin).
- No colocar claves privadas en variables NEXT_PUBLIC, Git, logs ni argumentos visibles compartidos. Usar archivos ignorados o la gestión de secretos del proyecto.
- La función usa withSupabase auth: secret y verify_jwt=false: la autenticación no está desactivada; valida la clave secreta en apikey. En local/self-hosted requiere SUPABASE_SECRET_KEYS con la clave default del entorno.
- El remitente de prueba de Resend puede limitar destinatarios; usar un dominio/remitente autorizado para producción.
- Autorizar en Supabase Auth el origen de ADMIN_URL y /auth/set-password. El correo apunta a /auth/confirm?token_hash=...&type=invite o recovery.

## Puesta en marcha

1. Aplicar migración 20261025000100_staff_confirmation_email.sql (en local: bun run db:migrate).
2. Configurar los secretos de la Edge Function y desplegar resend antes de actualizar admin. En local servir la función con un archivo de entorno ignorado. No subir archivos con secretos.
3. Configurar ADMIN_URL idéntico en admin y función; mantener SMTP operativo para recuperación ordinaria.
4. Invitar desde Personal: conservar email y rol en reintentos. El límite es un intento por minuto y cinco por hora por correo; la cuenta pendiente no se duplica.
5. Verificar con destinatario controlado que llega el correo y el enlace permite establecer contraseña. Aceptación por Resend no prueba entrega en bandeja ni activación.

## Reintentos y fallos

La función reintenta una vez fallos de transporte/5xx con payload e Idempotency-Key idénticos. Un reenvío explícito genera una nueva operación/enlace, sujeto a límites persistentes. Errores no borran usuarios ni cambian roles. Una cuenta que ya inició sesión no se reinvita. Los intentos almacenan solo correo, rol, contador y tiempos, nunca enlaces o tokens. Las filas de límite se reutilizan, una por destinatario.

## Rollback

Volver el admin al flujo de invitación Auth anterior manteniendo SMTP. No borrar usuarios ni reservas para deshacer un fallo de correo. La tabla privada de límites puede permanecer; la función de correo debe seguir restringida. Aplicar migraciones de forma normal, sin resetear datos.

## Referencias

- https://supabase.com/docs/reference/javascript/auth-admin-generatelink
- https://supabase.com/docs/guides/functions/auth
- https://resend.com/docs/dashboard/emails/idempotency-keys

## Why

La Edge Function resend contiene destinatario y contenido de prueba, y referencia RESEND_API_KEY sin leerla del entorno. Al crear personal desde admin debe enviarse una invitación/confirmación real al correo indicado, conservando la activación segura de Supabase Auth.

## What Changes

- Recibir y validar el destinatario `to` por parámetro en la función existente.
- Usar RESEND_API_KEY como secreto del runtime y un remitente configurable autorizado en Resend.
- Integrar el alta de personal con un enlace de invitación emitido por Supabase Auth y un único envío por Resend.
- Restringir la función a llamadas internas autorizadas; informar fallos de entrega sin presentar éxito falso ni duplicar usuarios al reintentar.
- Mantener permisos, roles, establecimiento de contraseña y recuperación de acceso.

## Capabilities

### New Capabilities
- `staff-confirmation-email`: entrega de invitaciones de personal por Edge Function y Resend, con destinatario dinámico y errores controlados.

### Modified Capabilities
- `staff-access`: invitación generada por Supabase Auth y entregada por Resend al crear personal desde admin.

## Impact

supabase/functions/resend, configuración de funciones, apps/admin/src/app/auth/actions.ts, documentación de secretos y pruebas de invitación. El alcance es personal creado desde admin, no contactos de clientes ni altas manuales desde Studio. No se envían correos ni se despliega durante la propuesta.

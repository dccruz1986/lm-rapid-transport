## Context

La propuesta cubre invitaciones de personal desde admin. La acción actual reserva el rol con reserve_staff_invite, usa inviteUserByEmail y recupera invitaciones pendientes mediante resetPasswordForEmail. La función resend admite acceso publishable/secret y envía contenido fijo; no está integrada al alta.

## Goals / Non-Goals

**Goals:** destinatario dinámico, confirmación real mediante Auth, secreto Resend solo en servidor, entrega observable y reintento seguro.

**Non-Goals:** registro público, correos comerciales, confirmación de cotizaciones, altas realizadas directamente en Studio, rediseño general de recuperación de contraseña.

## Decisions

1. Conservar reserva de invitación y autorización users.manage/roles. Sustituir el envío automático del alta por generateLink(type invite) desde servidor privilegiado; enviar el enlace generado mediante la función existente. No llamar también inviteUserByEmail: produciría dos envíos. Auth sigue validando token, caducidad y contraseña; enviar un correo no confirma la cuenta.
2. Contrato interno POST JSON: to (un email), action_url (enlace Auth generado en servidor), operation_id (identificador estable del envío). Validar tamaños, formato, método y URL contra origen/ruta de Auth permitidos; redirect al admin configurado. La plantilla y asunto pertenecen a la función, no se aceptan HTML, remitentes ni asuntos arbitrarios.
3. La función lee Deno.env.get('RESEND_API_KEY') y RESEND_FROM_EMAIL; falla explícitamente sin configuración. Admitir solo autenticación secreta servidor-a-servidor compatible con el runtime instalado; retirar acceso publishable. El navegador solo llama la acción admin autenticada.
4. Resend debe devolver respuesta exitosa con identificador para indicar envío aceptado; no equivale a entrega en bandeja. Manejar 4xx, 429, 5xx, timeout y respuesta inválida con códigos acotados. No registrar tokens, claves, formulario completo ni cuerpo del proveedor.
5. Reintento: mantener usuario/reserva pendientes tras fallo. Reutilizar el mismo payload e Idempotency-Key para reintentos de transporte de una operación. Un reenvío explícito genera nueva operación/enlace, con límite persistente por invitación y autorización repetida; no cambia roles ni crea otro usuario. Si existe una cuenta pendiente, usar el mecanismo Auth de recuperación ya existente con enlace generado y entrega Resend; no usar recuperación para usuarios activos arbitrarios. Verificar compatibilidad con pending_staff_invitation y pruebas SQL existentes.
6. Mantener recuperación ordinaria de contraseña con su canal actual. Documentar SMTP aún requerido para ese flujo; no reemplazar globalmente Auth por un hook en este cambio. SMTP de Resend o Send Email Hook son alternativas válidas pero no aprovechan el contrato por parámetro solicitado en esta función.

## Risks / Trade-offs

- Alta y envío no son una transacción única → estado pendiente y reenvío explícito, sin borrar usuarios por fallos externos.
- Timeout tras aceptación del proveedor → idempotencia para el mismo payload; no afirmar entrega sin evidencia.
- Remitente de prueba restringido → configurar remitente/dominio autorizado antes de prueba real.
- Enlace de activación sensible → solo canal servidor y destinatario validado, sin exposición en UI/logs.

## Migration Plan

Configurar secretos y remitente; probar localmente con proveedor simulado; desplegar función restringida antes del cambio admin; verificar entrega a destinatario controlado y activación. Rollback del admin al flujo Auth anterior sin eliminar usuarios o invitaciones existentes; conservar recuperación SMTP operativa. No desplegar ni enviar durante esta propuesta.

## Open Questions

El remitente de producción y la disponibilidad del secreto se comprobarán en implementación sin copiar claves al repositorio. Se conserva como alcance el alta de personal desde admin.

## References

- Supabase generateLink: https://supabase.com/docs/reference/javascript/auth-admin-generatelink
- Resend idempotencia: https://resend.com/docs/dashboard/emails/idempotency-keys

## Ajuste de implementación

El correo usa el token hash emitido por generateLink dentro de ADMIN_URL/auth/confirm?token_hash=...&type=invite|recovery. Es el callback SSR existente que intercambia el token y establece cookies antes de abrir /auth/set-password; evita depender de fragmentos de sesión en el navegador. La función permite únicamente ese origen/ruta y esos dos parámetros. Se conserva withSupabase con auth: secret (clave default por apikey); no se añade otro secreto de autenticación.

Reenvío explícito: begin_staff_email serializa por email, conserva rol de reserva vigente, comprueba cuenta pendiente y limita a un intento/minuto y cinco/hora. Reintentos de transporte ocurren dentro de la misma invocación de la función; un nuevo envío explícito es otra operación. No se almacenan enlaces en DB.

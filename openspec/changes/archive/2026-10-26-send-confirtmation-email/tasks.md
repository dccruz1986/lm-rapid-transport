## 1. Función de correo

- [x] 1.1 Definir contrato POST to/action_url/operation_id, validación de email/URL/límites y errores tipados en resend.
- [x] 1.2 Leer RESEND_API_KEY y RESEND_FROM_EMAIL del runtime, restringir invocación a servidor autenticado y eliminar destinatario/contenido de prueba.
- [x] 1.3 Crear plantilla de invitación con enlace Auth escapado, timeout, comprobación de estado/ID Resend e idempotencia de transporte, sin logs sensibles.

## 2. Alta y reenvío de personal

- [x] 2.1 Adaptar acción admin para reservar rol, generar enlace Auth e invocar resend con to del usuario; evitar envío automático duplicado y preservar permisos existentes.
- [x] 2.2 Implementar reintentos/reenvíos de cuenta pendiente con operación estable para transporte, límite persistente y nueva operación para reenvío explícito; preservar identidad/rol y tratar conflictos/concurrencia.
- [x] 2.3 Mostrar estados de invitación pendiente, envío aceptado y error recuperable sin confundirlos con cuenta confirmada o entrega efectiva; preservar recuperación ordinaria y redirects.

## 3. Configuración y pruebas

- [x] 3.1 Documentar secretos con placeholders, remitente autorizado, despliegue función/admin, SMTP de recuperación y rollback sin borrar usuarios.
- [x] 3.2 Probar to dinámico con dos destinatarios, entradas inválidas, acceso público denegado, secretos ausentes, fallos/timeout/429 de Resend y deduplicación de transporte.
- [x] 3.3 Probar permisos de ADMIN/MANAGER/DISPATCHER, alta/reserva, envío fallido seguido de reenvío, ausencia de usuarios duplicados y enlace inválido/expirado.
- [x] 3.4 Ejecutar tipos y pruebas relevantes, verificar activación con proveedor simulado y documentar por separado la prueba real a un destinatario controlado cuando estén configurados remitente y secretos.





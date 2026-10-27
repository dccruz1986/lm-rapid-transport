# Verificación 2026-10-25

- Migración 20261025000100 aplicada al entorno local existente; sin reset de datos.
- 140 pruebas SQL correctas (10 nuevas): roles, denegación anónima, concurrencia por cooldown, reenvío con identidad conservada, límites y rechazo de cuenta ya activada.
- 5 pruebas unitarias de handler, 24 aserciones: destinatario variable, validación/URL, cuerpo limitado, configuración ausente, 4xx/429/5xx, timeout, respuesta inválida, payload/clave de idempotencia idénticos.
- Integración contra Auth local con usuarios sintéticos y proveedor de correo simulado: reserva, generateLink invite, rol asignado, pendiente recuperable, fallo de correo y reintento, activación, contraseña, inicio de sesión, rechazo de enlaces inválidos/caducados/usados y cuenta ya activada. Usuarios sintéticos eliminados al finalizar.
- Tipos raíz y admin correctos; build admin correcto.
- Sin correos reales enviados ni despliegues remotos. La configuración de Resend/remitente real y entrega en bandeja no se ha probado.

## Pendiente para tarea 3.2

La comprobación del wrapper real de autenticación de la Edge Function no pudo ejecutarse. Docker Desktop inició correctamente y la base de datos funciona, pero supabase functions serve resend falla al montar una capa del runtime: snapshot overlayfs 121/fs inexistente. Recuperar la imagen oficial public.ecr.aws/supabase/edge-runtime:v1.77.4 no resolvió el problema. No se borraron imágenes, contenedores ni volúmenes para intentar repararlo.

Después de reparar/reiniciar Docker: servir resend y comprobar que peticiones sin apikey y con publishable se rechazan antes del handler, y que la clave secret default permite acceder al handler. Luego probar entrega real solo con remitente configurado y destinatario controlado. No marcar 3.2 completa hasta comprobar el acceso real.

## Verificación adicional 2026-10-26

Runtime local operativo. Comprobación HTTP real con cuerpo vacío (sin envío): sin apikey devuelve 401; publishable devuelve 401; secret default devuelve 400 INVALID_INPUT del handler. Se completa la prueba pendiente de acceso de 3.2. La configuración requerida está presente en runtime. El 502 transitorio desapareció tras la recarga del proxy/runtime.

Se corrigió una regresión posterior en index.ts: Response.json(sendInvitation(...)) serializaba el objeto Response y ocultaba su estado/cuerpo; ahora se devuelve directamente. Se restauró auth: secret y se retiró el log de la clave en la acción admin. No se efectuó entrega real a un destinatario.

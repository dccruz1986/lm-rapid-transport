## Context

La recepción existente vincula cliente, direcciones y public.moving_requests mediante intake_finalize. Una conversación abarca varias invocaciones independientes.

## Goals / Non-Goals

Capturar una solicitud con preguntas estáticas y mostrar su referencia en WhatsApp. La cotización, programación e interpretación por IA quedan fuera del alcance.

## Decisions

- Exponer whatsapp-webhook con verify_jwt desactivado únicamente para esta función. En GET comprobar modo y token configurado antes de devolver hub.challenge. En POST verificar HMAC-SHA256 sobre los bytes originales con el App Secret y comparación segura antes de interpretar JSON. Aceptar solo el Phone Number ID configurado.
- Recorrer todas las entradas, cambios y mensajes. Persistir cada ID de Meta con restricción única antes de devolver 200. Ignorar estados de entrega. Si falla la persistencia, devolver error reintentable.
- Procesar en orden por conversación (número del negocio y remitente), con bloqueo transaccional. Guardar paso, respuestas y mensaje saliente en la misma transacción. Enviar la pregunta por Cloud API desde una cola persistente con reintentos limitados y recuperación de trabajos interrumpidos.
- Un saludo abre el borrador. Preguntar por origen, destino, fecha, tamaño, nombre completo, teléfono de contacto (ofrecer el remitente validado) y correo opcional. Aplicar los validadores del formulario y su ruta para ubicaciones aproximadas o pendientes de revisión. Mostrar resumen con opciones de corregir y confirmar.
- Finalizar con clave estable por borrador y reutilizar la operación de alta que culmina en intake_finalize. Guardar el vínculo a la solicitud y encolar su referencia tras persistencia. Si el alta y el vínculo usan transacciones distintas, recuperar el mismo resultado al reintentar.

## Risks / Trade-offs

Una respuesta de envío perdida puede repetir un aviso. La cola debe distinguir fallos transitorios de permanentes y conservar el resultado del alta. Restringir tablas y operaciones al servidor. Registrar IDs y códigos técnicos sin contenido personal ni credenciales.

## Migration Plan

Aplicar primero las migraciones, configurar secretos de Meta y desplegar receptor y procesamiento. Verificar callback y suscripción messages con número de prueba antes de activar el comercial. Para revertir, pausar la suscripción y los envíos conservando los borradores y solicitudes.

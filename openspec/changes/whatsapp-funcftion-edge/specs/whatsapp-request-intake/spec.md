## ADDED Requirements

### Requirement: Autenticación del webhook

El receptor SHALL verificar el desafío GET y autenticar cada POST mediante X-Hub-Signature-256 antes de procesar datos.

#### Scenario: Alta del callback
- **WHEN** Meta presenta modo subscribe y el token de verificación configurado
- **THEN** el receptor devuelve el desafío, y rechaza un token incorrecto

#### Scenario: Firma ausente o incorrecta
- **WHEN** la firma falta o no corresponde al cuerpo recibido
- **THEN** el receptor rechaza el evento sin guardar datos ni enviar preguntas

### Requirement: Conversación guiada y recuperable

La función SHALL guardar el paso por remitente y teléfono del negocio y validar cada respuesta con las reglas de recepción existentes.

#### Scenario: Comienzo y reanudación
- **WHEN** el cliente saluda y luego envía su origen en otro mensaje
- **THEN** recibe primero la pregunta de origen y después la de destino aunque las atiendan distintas instancias

#### Scenario: Corrección de una respuesta
- **WHEN** el cliente envía un domingo como fecha preferida
- **THEN** recibe una explicación y puede repetir ese paso conservando sus ubicaciones

#### Scenario: Contacto y revisión
- **WHEN** el cliente completa ruta, fecha, tamaño, nombre y teléfono válido y omite el correo
- **THEN** recibe un resumen que puede corregir antes de confirmar

### Requirement: Procesamiento idempotente

El sistema SHALL procesar cada mensaje entrante una vez a efectos de negocio, incluso en entregas por lotes y reintentos concurrentes.

#### Scenario: Lote con repetidos y estados
- **WHEN** llegan mensajes nuevos junto con mensajes ya registrados y avisos de entrega
- **THEN** procesa todos los nuevos sin avanzar el paso por duplicados ni por estados

### Requirement: Alta confirmada

El sistema SHALL vincular cada borrador confirmado con una sola solicitud en moving_requests y comunicar su referencia tras persistirla.

#### Scenario: Confirmación seguida de fallo de envío
- **WHEN** se registra la mudanza pero falla el envío de su referencia
- **THEN** el sistema reintenta el aviso con la misma referencia y el admin ve una sola solicitud

#### Scenario: Falla la persistencia
- **WHEN** el alta falla antes de confirmarse en la base de datos
- **THEN** se conserva el borrador recuperable y el cliente no recibe un aviso de éxito

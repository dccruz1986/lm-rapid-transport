## ADDED Requirements

### Requirement: Formulario por pasos sin cuenta
El sistema SHALL permitir solicitudes anónimas mediante formulario responsive por pasos de contacto, mudanza y revisión/fotografías. SHALL validar con Zod en cliente y servidor, preservando los valores al retroceder.

#### Scenario: Cliente sin cuenta
- **WHEN** una persona completa y envía datos válidos sin sesión
- **THEN** puede crear la solicitud mediante la operación pública autorizada sin registrarse

#### Scenario: Validación evadida en el navegador
- **WHEN** un cliente envía directamente datos inválidos al endpoint
- **THEN** el servidor los rechaza sin crear una solicitud

### Requirement: Datos de contacto y teléfono estadounidense
Nombre, apellido y teléfono SHALL ser obligatorios. Email SHALL ser opcional y validarse cuando exista. El teléfono SHALL validarse como estadounidense y normalizarse a E.164, admitiendo formatos visuales distintos. Un prefijo +1 solo no SHALL considerarse validación suficiente.

#### Scenario: Solicitud sin correo
- **WHEN** se envían nombre, apellido y teléfono estadounidense válidos con email vacío
- **THEN** el contacto es válido y email se persiste como ausente

#### Scenario: Número no estadounidense
- **WHEN** se introduce un número identificado como de otro país
- **THEN** se muestra un error y no se admite la solicitud

### Requirement: Datos de la mudanza y alcance de Florida
La solicitud SHALL recoger un único origen y destino con dirección, unidad si aplica, ciudad, estado y ZIP, ambos en Florida; tipo de propiedad; dormitorios solo en viviendas; piso de origen/destino; disponibilidad de elevador en ambos; y comentarios opcionales. Superficie aproximada SHALL ser opcional con unidad ft² o m². SHALL ofrecer equipo de 2, 3 o 4 trabajadores o «No estoy seguro, necesito asesoría» para cualquier tipo de propiedad. No SHALL solicitar objetos especiales ni paradas adicionales.

#### Scenario: Oficina con equipo sin definir
- **WHEN** el cliente elige oficina, 100 m² y necesita asesoría
- **THEN** no se requieren dormitorios, se conserva la unidad de superficie y la cantidad de trabajadores queda pendiente de definición por el personal

#### Scenario: Destino fuera del área de servicio
- **WHEN** el destino tiene un estado diferente de Florida
- **THEN** la solicitud se rechaza con una explicación del alcance disponible

### Requirement: Fecha opcional y calendario de Miami
La solicitud SHALL permitir fecha deseada o «Todavía no tengo fecha definida». Si existe, SHALL ser posterior a hoy según America/New_York y de lunes a sábado. Mañana SHALL aceptarse sin exigir 24 horas completas. No SHALL pedirse una hora al cliente en el formulario inicial.

#### Scenario: Fecha flexible
- **WHEN** se selecciona que todavía no hay fecha definida
- **THEN** la solicitud puede enviarse y guarda fecha nula, no una fecha inventada

#### Scenario: Mañana con menos de 24 horas
- **WHEN** hoy es lunes por la noche y se elige martes
- **THEN** la fecha es válida

#### Scenario: Fecha no permitida
- **WHEN** se elige hoy, una fecha pasada o un domingo
- **THEN** se rechaza tanto en cliente como en servidor

### Requirement: Fotografías opcionales y privadas
La recepción SHALL aceptar cero a ocho fotografías JPG/JPEG, PNG o WebP, hasta 5 MiB (5 × 1024 × 1024 bytes) por archivo y 40 MiB por solicitud; la UI SHALL explicar el límite de 5 MB. SHALL validar tamaño, tipo real y contenido decodificable en servidor. SHALL guardar archivos en Supabase Storage privado con rutas generadas; metadatos y URLs no SHALL ser públicos.

#### Scenario: Sin fotografías
- **WHEN** el cliente no adjunta imágenes
- **THEN** puede enviar la solicitud normalmente

#### Scenario: Archivo fuera de límites
- **WHEN** se envía una novena foto, un archivo mayor que el límite, un formato no permitido o contenido no correspondiente a una imagen válida
- **THEN** el servidor lo rechaza y permite corregir la selección sin afirmar que la solicitud fue enviada

#### Scenario: Acceso no autorizado a una foto
- **WHEN** un visitante conoce o adivina una ruta de Storage
- **THEN** no puede descargarla ni listar los objetos del bucket

### Requirement: Envío atómico e idempotente
La finalización SHALL crear de forma coherente cliente/asociación, direcciones, solicitud y metadatos de adjuntos, y emitir un número único solo tras persistencia exitosa. Un reintento de la misma operación SHALL recuperar el mismo resultado sin duplicar cliente, solicitud o fotos. Los archivos provisionales abandonados SHALL tener caducidad y limpieza documentada.

#### Scenario: Reintento tras pérdida de respuesta
- **WHEN** la persistencia se completó pero la respuesta al navegador se perdió y se reintenta con la misma clave
- **THEN** se devuelve el mismo número sin crear otra solicitud

#### Scenario: Falla una fotografía o la transacción
- **WHEN** un upload o la finalización falla
- **THEN** se informa el fallo, se ofrece reintentar u omitir explícitamente la foto y no se presenta una solicitud parcial como completada

### Requirement: Superficie pública restringida
El visitante SHALL poder ejecutar solamente la recepción y carga autorizadas y acotadas a su operación. No SHALL poder leer solicitudes previas, clientes, notas, tarifas administrativas ni recursos del panel. Las operaciones SHALL tener límites persistentes contra abuso y no revelar si un teléfono ya está registrado.

#### Scenario: Intento de enumeración
- **WHEN** alguien usa la clave pública, un número de solicitud o un teléfono para consultar datos existentes
- **THEN** no recibe información privada ni confirmación de existencia del cliente

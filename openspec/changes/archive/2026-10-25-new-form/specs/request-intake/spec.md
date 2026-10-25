## MODIFIED Requirements

### Requirement: Formulario por pasos sin cuenta
El sistema SHALL permitir solicitudes anónimas mediante tres pasos responsive: Ubicación (origen/destino), Detalles (fecha y tamaño) y Contacto. SHALL validar con Zod en cliente y servidor y conservar valores al retroceder. SHALL mantener ES/EN, marca naranja/blanco, navegación por teclado, errores junto al campo e indicador de progreso. Los pasos intermedios no SHALL enviar la solicitud; el último SHALL mostrar número único solo tras persistencia exitosa.

#### Scenario: Cliente sin cuenta
- **WHEN** una persona completa y envía datos válidos sin sesión
- **THEN** puede crear la solicitud mediante la operación pública autorizada sin registrarse

#### Scenario: Validación evadida en el navegador
- **WHEN** un cliente envía directamente datos inválidos al endpoint
- **THEN** el servidor los rechaza sin crear una solicitud

#### Scenario: Regresar a ubicación
- **WHEN** el cliente retrocede desde Contacto a Ubicación
- **THEN** se conservan ubicaciones, detalles y contacto y puede corregirlos sin reiniciar el formulario

### Requirement: Datos de contacto y teléfono estadounidense
Nombre completo y teléfono SHALL ser obligatorios. Email SHALL ser opcional y validarse cuando exista. El nombre SHALL conservarse sin exigir apellido separado ni dividirlo automáticamente por espacios. El teléfono SHALL validarse como estadounidense y normalizarse a E.164, admitiendo formatos visuales distintos. Un prefijo +1 solo no SHALL considerarse validación suficiente. Los nombres/apellidos históricos SHALL seguir siendo legibles en admin.

#### Scenario: Solicitud sin correo
- **WHEN** se envían nombre completo y teléfono estadounidense válidos con email vacío
- **THEN** el contacto es válido y email se persiste como ausente

#### Scenario: Número no estadounidense
- **WHEN** se introduce un número identificado como de otro país
- **THEN** se muestra un error y no se admite la solicitud

#### Scenario: Nombre compuesto
- **WHEN** el cliente escribe un nombre compuesto en el único campo de nombre
- **THEN** se conserva íntegro sin inventar o repartir apellidos

### Requirement: Datos de la mudanza y alcance de Florida
La solicitud SHALL recoger un único origen y destino por ZIP o dirección y un tamaño: estudio, 1/2/3/4 dormitorios, 5+ dormitorios, oficina o comercial. SHALL admitir ubicaciones parciales identificadas como tales y rechazar extremos verificados fuera de Florida. Ubicación manual no verificada SHALL quedar pendiente de revisión, sin afirmarse que cumple el alcance. Calle, unidad, tipo de vivienda, pisos, elevadores, equipo y superficie no informados SHALL permanecer ausentes. SHALL conservar 5+ como categoría y no como cinco exactos. Datos adicionales opcionales SHALL estar plegados: unidad/dirección completa, propiedad, pisos/elevadores, comentarios, superficie con ft²/m² y equipo 2/3/4 o asesoría. No SHALL solicitar objetos especiales ni paradas adicionales. El admin SHALL mostrar y permitir completar datos pendientes. La aprobación interna LOCAL SHALL permitir direcciones pendientes; confirmar o programar una mudanza, y aprobar PER_MILE, SHALL exigir ambas direcciones completas y clasificación territorial revisada.

#### Scenario: Oficina con equipo sin definir
- **WHEN** el cliente elige oficina, indica opcionalmente 100 m² y necesita asesoría
- **THEN** no se requieren dormitorios, se conserva la unidad de superficie y la cantidad de trabajadores queda pendiente de definición por el personal

#### Scenario: Destino fuera del área de servicio
- **WHEN** el destino verificado tiene un estado diferente de Florida
- **THEN** la solicitud se rechaza con una explicación del alcance disponible

#### Scenario: Recepción mínima por ZIP
- **WHEN** el cliente facilita dos ZIP, estudio, fecha flexible y contacto válido sin detalles adicionales
- **THEN** se crea la solicitud con ubicaciones parciales y datos no proporcionados ausentes, sin exigir calle o inventar pisos y elevadores

#### Scenario: Vivienda grande
- **WHEN** el cliente selecciona 5+ dormitorios
- **THEN** el admin muestra esa categoría y no presupone una cantidad exacta ni que se trate de casa frente a apartamento

#### Scenario: Datos operativos incompletos
- **WHEN** se intenta confirmar, programar o aprobar PER_MILE con direcciones incompletas o clasificación pendiente
- **THEN** se indican los datos que el personal debe completar antes de continuar

#### Scenario: Aprobación interna local con datos pendientes
- **WHEN** el personal aprueba internamente una cotización LOCAL con direcciones pendientes
- **THEN** se permite la aprobación interna sin confirmar al cliente ni habilitar la programación hasta completar las direcciones y la revisión territorial

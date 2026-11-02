## ADDED Requirements

### Requirement: Formulario administrativo de nueva solicitud
Requests SHALL ofrecer Nueva solicitud y un formulario ES/EN accesible en móvil y escritorio. SHALL exigir nombre completo, teléfono estadounidense normalizado, origen, destino y tamaño de mudanza; SHALL admitir email y comentarios opcionales y fecha explícitamente indefinida. Una fecha definida SHALL cumplir las reglas vigentes de recepción: posterior a hoy en America/New_York y no domingo. SHALL validar en cliente y servidor, conservar datos al fallar y permitir cancelar sin persistir. No SHALL exigir fotos, tarifa ni aceptación del cliente para el alta.

#### Scenario: Alta mínima
- **WHEN** el personal envía nombre, teléfono, dos ZIP, tamaño y fecha por definir válidos
- **THEN** se guarda una solicitud NEW y se abre su detalle con número único para continuar el flujo operativo habitual

#### Scenario: Datos inválidos
- **WHEN** faltan campos obligatorios o son inválidos teléfono, email informado o fecha definida
- **THEN** se rechaza la creación, se muestran errores comprensibles y se conservan los campos introducidos

#### Scenario: Cancelación del formulario
- **WHEN** el personal cancela antes de guardar
- **THEN** vuelve a Requests sin crear una solicitud

### Requirement: Ubicaciones parciales en el alta administrativa
El formulario SHALL reutilizar LocationField compartido para origen y destino, mantener selecciones al rerenderizar y aceptar ZIP o direcciones manuales cuando Google no esté disponible. SHALL identificar ubicaciones parciales/no verificadas y mantener su revisión pendiente sin inventar datos o afirmar modalidad local. Solo una verificación confiable de ambos extremos en Miami-Dade SHALL permitir sugerir local por hora. SHALL rechazar extremos verificados fuera de Florida y conservar las condiciones existentes de aprobación y programación.

#### Scenario: Google no disponible
- **WHEN** el personal introduce manualmente dos ZIP válidos sin resolución de Google
- **THEN** puede crear la solicitud con ubicaciones no verificadas y revisión territorial pendiente

#### Scenario: Rerender del formulario
- **WHEN** cambia un campo de contacto después de seleccionar ubicaciones
- **THEN** se conservan las selecciones sin exigir escogerlas de nuevo

#### Scenario: Ubicación fuera del alcance
- **WHEN** se selecciona un extremo verificado fuera de Florida
- **THEN** se solicita corregirlo antes de guardar

### Requirement: Persistencia administrativa atómica e idempotente
El alta SHALL crear solicitud NEW, direcciones y asociación a cliente en una transacción, registrando usuario creador y clave de operación. SHALL reutilizar cliente por teléfono normalizado sin sobrescribir su ficha y conservar contacto recibido en la solicitud. Reintentos autorizados con misma clave, actor y contenido SHALL recuperar el mismo id y número; contenido diferente con la misma clave SHALL producir conflicto. La creación no SHALL generar cotización aprobada, comunicación, aceptación ni mudanza programada.

#### Scenario: Teléfono existente
- **WHEN** se crea una solicitud con teléfono de un cliente existente y otro nombre o email
- **THEN** la solicitud conserva lo introducido, se asocia al cliente existente y no modifica su ficha

#### Scenario: Reintento y concurrencia
- **WHEN** se reintenta o se envía simultáneamente la misma operación
- **THEN** se devuelve una sola solicitud y no se duplican sus direcciones ni el cliente

#### Scenario: Operaciones distintas para un mismo teléfono
- **WHEN** dos altas diferentes usan concurrentemente el mismo teléfono nuevo
- **THEN** se crean dos solicitudes asociadas a una sola ficha de cliente

#### Scenario: Fallo transaccional
- **WHEN** falla cualquier escritura del alta
- **THEN** no quedan registros parciales y el formulario permite corregir o reintentar sin mostrar éxito

#### Scenario: Clave reutilizada con otros datos
- **WHEN** se reenvía una clave ya guardada con contenido diferente
- **THEN** se informa conflicto sin modificar ni duplicar la solicitud anterior

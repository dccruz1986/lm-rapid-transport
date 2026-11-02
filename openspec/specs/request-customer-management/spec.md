# request-customer-management Specification

## Purpose
Definir la gestión administrativa de solicitudes y clientes, sus asociaciones, estados, notas y cambios sujetos a validación comercial.

## Requirements

### Requirement: Gestión completa de solicitudes
Requests SHALL listar número, cliente, teléfono, origen, destino, fecha deseada, estado y fecha de creación, con búsqueda, filtros básicos y paginación. El detalle SHALL mostrar todos los campos enviados, fotografías autorizadas, notas, cotización y mudanza asociada. Fecha indefinida SHALL mostrarse expresamente.

#### Scenario: Revisión de solicitud con fotos
- **WHEN** un miembro activo del personal abre una solicitud
- **THEN** ve su información completa, las fotos mediante acceso temporal autorizado y las acciones permitidas para su rol y estado

### Requirement: Estados de solicitud y cambios con condiciones
Las solicitudes SHALL usar NEW, CONTACTED, QUOTED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED y PENDING_REVIEW. SHALL validar transiciones y condiciones de negocio en servidor/DB; no aceptar asignación libre de estado que omita confirmación o mediciones.

#### Scenario: Confirmación prematura
- **WHEN** se intenta pasar una solicitud a CONFIRMED sin confirmación registrada del cliente sobre términos vigentes
- **THEN** la operación se rechaza

### Requirement: Asociación automática por teléfono
Una solicitud SHALL asociarse al cliente existente por teléfono estadounidense normalizado, o crear uno si no existe. SHALL protegerse la unicidad bajo concurrencia. Un envío anónimo no SHALL sobrescribir nombre, email u otros datos del cliente existente; SHALL conservar los valores enviados en la solicitud. Email no SHALL provocar una fusión automática de teléfonos distintos.

#### Scenario: Teléfono conocido con nombre o email distinto
- **WHEN** se recibe una solicitud con un teléfono existente y otros datos de contacto diferentes
- **THEN** se asocia al cliente existente, mantiene su ficha y guarda los datos recibidos para revisión interna sin revelar la coincidencia al visitante

#### Scenario: Dos solicitudes concurrentes
- **WHEN** dos envíos diferentes usan simultáneamente el mismo teléfono normalizado que aún no existe
- **THEN** se crean dos solicitudes asociadas a una sola ficha de cliente

### Requirement: Consulta y edición de clientes
Customers SHALL mostrar información de contacto, solicitudes anteriores y mudanzas anteriores. Los tres roles SHALL editar datos de contacto y direcciones con validación. No SHALL existir fusión de clientes ni eliminación definitiva. Las ediciones no SHALL reescribir datos históricos de otras solicitudes.

#### Scenario: Cambio a un teléfono ya registrado
- **WHEN** el personal cambia el teléfono de un cliente a uno perteneciente a otra ficha
- **THEN** se muestra un conflicto sin fusionar ni perder información

### Requirement: Notas internas editables
ADMIN, MANAGER y DISPATCHER SHALL crear, editar y eliminar cualquier nota interna, independientemente del autor. SHALL solicitar confirmación de eliminación. No SHALL exponer notas al público ni implementar historial general de sus ediciones.

#### Scenario: Nota escrita por otro usuario
- **WHEN** un DISPATCHER edita o confirma la eliminación de una nota creada por un MANAGER
- **THEN** la operación está permitida

### Requirement: Cancelación y reactivación sin borrado
Los tres roles SHALL cancelar solicitudes/mudanzas con motivo opcional y reactivarlas en PENDING_REVIEW, conservando datos, asociaciones y registro de cancelación. No SHALL restaurarse automáticamente el estado operativo anterior ni duplicarse la mudanza. No SHALL existir borrado definitivo de clientes, solicitudes o mudanzas.

#### Scenario: Cancelación sin motivo
- **WHEN** el personal confirma cancelar con el motivo vacío
- **THEN** se cancela la solicitud y, si existe, su mudanza relacionada, conservando la información

#### Scenario: Reactivación
- **WHEN** el personal reactiva una solicitud que tenía una mudanza cancelada
- **THEN** ambas quedan pendientes de revisión y se reutilizan sus identificadores antes de volver a confirmar/programar

### Requirement: Cambio de dirección con nueva modalidad
Los tres roles SHALL editar origen y destino dentro de Florida. Si cambia la clasificación LOCAL/PER_MILE, el sistema SHALL exigir revisión de cotización y nueva confirmación del cliente; SHALL impedir continuar como si los términos anteriores siguieran válidos.

#### Scenario: Destino cambia de Miami a otra ciudad de Florida
- **WHEN** una solicitud local confirmada cambia a un destino fuera del municipio de Miami
- **THEN** la tarifa y cotización se revisan en modalidad por millas y la confirmación anterior no habilita la nueva modalidad

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

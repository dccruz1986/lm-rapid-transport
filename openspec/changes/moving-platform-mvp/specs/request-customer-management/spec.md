## ADDED Requirements

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

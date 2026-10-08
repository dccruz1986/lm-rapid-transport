## ADDED Requirements

### Requirement: Acceso privado mediante Supabase Auth
El panel SHALL usar Supabase Auth con email y contraseña, sin registro público. Cada lectura/mutación SHALL verificar sesión válida, perfil activo y permiso correspondiente. Una pantalla protegida o un control oculto no SHALL sustituir la autorización server-side/DB.

#### Scenario: Personal sin sesión
- **WHEN** un visitante intenta acceder a una ruta o acción administrativa
- **THEN** se solicita autenticación o se deniega la acción sin exponer datos

#### Scenario: Sesión de un usuario desactivado
- **WHEN** un usuario desactivado conserva una sesión emitida previamente
- **THEN** no obtiene datos ni ejecuta operaciones administrativas

### Requirement: Invitación y recuperación de acceso
ADMIN y MANAGER SHALL invitar personal mediante correo de Supabase Auth, sujeto al rol autorizado. El destinatario SHALL establecer su contraseña mediante enlace válido; no se envían contraseñas por correo. SHALL existir recuperación de contraseña por email. La entrega de producción SHALL configurar SMTP y redirects permitidos.

#### Scenario: Invitación válida
- **WHEN** un MANAGER invita un DISPATCHER y el destinatario completa el enlace
- **THEN** establece contraseña y accede con los permisos de DISPATCHER asignados en servidor

#### Scenario: Invitación o recuperación inválida
- **WHEN** un enlace está vencido o es inválido
- **THEN** no se habilita acceso y se muestra un estado recuperable sin exponer tokens

### Requirement: Gestión de cuentas por rol
ADMIN SHALL gestionar cuentas ADMIN/MANAGER/DISPATCHER. MANAGER SHALL crear y desactivar cuentas MANAGER/DISPATCHER, sin gestionar cuentas ADMIN ni asignar ese rol. DISPATCHER no SHALL gestionar usuarios. Las mismas restricciones SHALL aplicarse a cambios de rol y llamadas directas.

#### Scenario: Escalada intentada por MANAGER
- **WHEN** un MANAGER intenta convertir su cuenta u otra en ADMIN o desactivar un ADMIN
- **THEN** la operación es denegada aunque se envíe directamente al servidor

### Requirement: Permisos operativos iniciales compartidos
ADMIN, MANAGER y DISPATCHER SHALL consultar todos los registros, editar contactos/direcciones/datos de solicitudes, definir equipos de 2/3/4, crear/editar/aprobar cotizaciones individuales, ajustar tarifas individuales por hora/milla, registrar comunicaciones/confirmaciones, programar/reprogramar, iniciar/completar, cancelar/reactivar y editar/eliminar cualquier nota interna. No SHALL existir restricción por asignación individual.

#### Scenario: DISPATCHER prepara y confirma una operación
- **WHEN** un DISPATCHER revisa una solicitud, fija equipo/tarifa individual y aprueba la cotización
- **THEN** puede registrar su comunicación y posterior aceptación del cliente y programar la mudanza si cumple las condiciones

### Requirement: Límites de tarifas generales y correcciones poscierre
Solo ADMIN y MANAGER SHALL modificar tarifas generales y mínimo general y corregir horas, millas o tarifas de mudanzas COMPLETED. DISPATCHER SHALL registrar/corregir tiempos y distancias y tarifas individuales antes del cierre, y consultar el historial también después del cierre.

#### Scenario: DISPATCHER intenta cambiar una configuración global
- **WHEN** un DISPATCHER intenta modificar el precio general por milla o el mínimo local
- **THEN** se deniega la operación sin modificar el tarifario

#### Scenario: DISPATCHER intenta corregir una mudanza completada
- **WHEN** un DISPATCHER modifica horas, millas o tarifa de una Move COMPLETED
- **THEN** el servidor y la DB deniegan el cambio aunque conserve permiso de edición de cotizaciones abiertas

### Requirement: Permisos extensibles por acción
El sistema SHALL resolver permisos por identificadores de acción y asignaciones a roles centralizadas, sin repartir condiciones de rol divergentes entre UI, servidor y DB. SHALL permitir cambiar esas asignaciones en futuras iteraciones sin reescribir cada operación. No SHALL incluir un editor de permisos ni conceder accesos MOVER/DRIVER en este MVP.

#### Scenario: Cambio futuro de un permiso de DISPATCHER
- **WHEN** una migración posterior retira la acción de aprobar cotizaciones del rol DISPATCHER
- **THEN** interfaz, servidor y acceso a datos respetan la retirada sin modificar la lógica de cálculo ni de la cotización

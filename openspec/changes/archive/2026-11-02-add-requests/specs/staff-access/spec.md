## ADDED Requirements

### Requirement: Permiso compartido de alta manual
ADMIN, MANAGER y DISPATCHER activos SHALL poder crear solicitudes manuales mediante el permiso centralizado `requests.create`. La ruta, la acción de servidor y la operación DB SHALL comprobar sesión, perfil activo y permiso. No SHALL habilitar alta administrativa a visitantes ni ampliar los permisos de tarifas, usuarios o correcciones poscierre.

#### Scenario: Alta por cada rol
- **WHEN** un ADMIN, MANAGER o DISPATCHER activo abre Requests
- **THEN** dispone de Nueva solicitud y puede guardar una solicitud válida

#### Scenario: Llamada directa sin autorización
- **WHEN** un visitante, usuario desactivado o usuario sin requests.create invoca directamente el alta
- **THEN** se deniega sin crear clientes, direcciones ni solicitudes y sin devolver datos de operaciones anteriores

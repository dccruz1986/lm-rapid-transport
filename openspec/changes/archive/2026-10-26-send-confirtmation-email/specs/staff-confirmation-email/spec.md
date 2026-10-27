## ADDED Requirements

### Requirement: Destinatario dinámico y plantilla de activación
La función resend SHALL recibir POST con to, action_url y operation_id validados, enviar a un único destinatario y usar una plantilla fija de confirmación/invitación con enlace válido generado por Auth. SHALL rechazar destinatario ausente/inválido y enlaces ajenos a la configuración autorizada antes de contactar Resend.

#### Scenario: Dos usuarios distintos
- **WHEN** se crean dos invitaciones con correos distintos
- **THEN** cada envío usa su propio to y enlace, sin destinatario de prueba ni envío duplicado por Auth

#### Scenario: Entrada inválida
- **WHEN** faltan datos o la URL de activación no está permitida
- **THEN** responde con error de validación sin enviar correo

### Requirement: Configuración secreta y acceso interno
La función SHALL leer RESEND_API_KEY y remitente autorizado desde configuración de servidor, restringir acceso a llamadas internas autenticadas y no exponer claves/enlaces en logs, navegador o repositorio. La acción admin SHALL verificar permiso y rol antes de generar enlaces o invocar la función.

#### Scenario: Acceso público
- **WHEN** se invoca con clave pública, sin autenticación interna o desde una cuenta sin permiso
- **THEN** no se genera ni envía una invitación

#### Scenario: Configuración incompleta
- **WHEN** falta el secreto o remitente
- **THEN** informa error controlado de configuración sin enviar ni exponer valores secretos

### Requirement: Resultado de envío y reintentos
El sistema SHALL distinguir aceptación del proveedor de entrega efectiva y de activación de usuario. SHALL manejar errores y timeout sin éxito falso; reintentos de una misma operación SHALL conservar payload y clave de idempotencia. Reenvíos explícitos SHALL autorizarse, limitarse persistentemente y conservar identidad/rol del usuario pendiente.

#### Scenario: Proveedor rechaza o no responde
- **WHEN** Resend devuelve error, cuerpo inválido o timeout
- **THEN** se informa fallo reintentable según causa y no se marca la cuenta como confirmada

#### Scenario: Reintento de transporte
- **WHEN** se repite una operación tras pérdida de respuesta
- **THEN** se reutiliza la clave de idempotencia y el payload sin generar otro usuario ni otro enlace para esa operación

#### Scenario: Reenvío de invitación pendiente
- **WHEN** un administrador autorizado solicita reenviar una invitación pendiente dentro del límite
- **THEN** se genera una nueva operación de envío para la misma cuenta y no se altera su rol

## MODIFIED Requirements

### Requirement: Invitación y recuperación de acceso
ADMIN y MANAGER SHALL invitar personal sujeto al rol autorizado mediante enlace de Supabase Auth entregado por la Edge Function resend usando Resend. El destinatario SHALL ser el correo validado de la invitación enviado como parámetro to, sin destinatarios fijos. El destinatario SHALL establecer su contraseña mediante enlace válido; no se envían contraseñas por correo. SHALL existir recuperación de contraseña por email. La entrega de producción SHALL configurar Resend para invitaciones, SMTP para recuperación ordinaria y redirects permitidos. Un fallo de envío SHALL mostrarse como invitación pendiente/reintentable, sin declarar éxito ni crear otra cuenta al reintentar.

#### Scenario: Invitación válida
- **WHEN** un MANAGER invita un DISPATCHER y el destinatario completa el enlace
- **THEN** recibe un correo Resend en su propia dirección, establece contraseña y accede con permisos de DISPATCHER asignados en servidor

#### Scenario: Invitación o recuperación inválida
- **WHEN** un enlace está vencido o es inválido
- **THEN** no se habilita acceso y se muestra un estado recuperable sin exponer tokens

#### Scenario: Fallo posterior al alta
- **WHEN** Auth crea el usuario pero Resend rechaza el envío
- **THEN** el admin informa el fallo y permite reenvío autorizado sobre la cuenta pendiente sin duplicarla ni cambiar su rol

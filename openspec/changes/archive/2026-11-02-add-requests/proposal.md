## Why

El personal necesita registrar solicitudes recibidas por teléfono o en persona sin utilizar el formulario público. Actualmente el admin permite gestionar solicitudes existentes pero no ofrece un alta manual.

## What Changes

- Añadir «Nueva solicitud» en Requests y un formulario administrativo ES/EN.
- Permitir el alta a ADMIN, MANAGER y DISPATCHER activos mediante el permiso centralizado `requests.create`.
- Capturar contacto, origen/destino por ZIP o dirección, tamaño y fecha definida o indefinida, reutilizando LocationField y validaciones existentes.
- Crear atómicamente una solicitud NEW y su asociación a cliente por teléfono normalizado, con protección contra duplicados por reintento.
- Abrir el detalle creado para continuar el flujo habitual de revisión, cotización y programación.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `request-customer-management`: alta manual autenticada, validación, asociación e idempotencia.
- `staff-access`: permiso de creación de solicitudes para los tres roles existentes.

## Impact

Admin Requests, Server Actions, paquetes compartidos de validación/datos/UI, permisos y una migración Supabase con RPC transaccional. Pruebas de autorización, integridad y formulario. No requiere dependencias nuevas, cambios en recepción pública, envíos de correo ni programación automática.

## Why

Los clientes que consultan por WhatsApp necesitan poder solicitar su mudanza en la misma conversación. El equipo debe recibir los datos en la bandeja habitual del admin.

## What Changes

- Recibir mensajes autenticados de Meta en una Edge Function.
- Guiar al cliente con preguntas fijas, validar sus respuestas y conservar su avance.
- Registrar una única solicitud confirmada aunque Meta repita entregas.

## Capabilities

### New Capabilities

- `whatsapp-request-intake` cubre recepción, conversación y alta de solicitudes desde WhatsApp.

### Modified Capabilities

## Impact

Supabase Edge Functions, Postgres, la operación de alta de solicitudes y WhatsApp Cloud API. Requiere secretos de servidor y una suscripción al evento de mensajes.

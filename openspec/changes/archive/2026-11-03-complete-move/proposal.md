## Why

El paso 4 permite guardar mediciones parciales y luego intentar completar con la finalización vacía, mostrando INVALID_INPUT sin explicar qué falta. Es necesario garantizar que los datos introducidos se persistan y se recuperen en el formulario, y distinguir un avance guardado de una mudanza lista para cerrar.

## What Changes

- Revisar el ciclo formulario, acción, RPC y refresco para conservar llegada, finalización, millas y sus instantes correctos.
- Mostrar al guardar y reabrir los últimos valores persistidos; evitar que el reset del formulario o una respuesta antigua vacíen datos.
- Mantener guardado parcial con un aviso específico de los datos pendientes.
- Validar los campos obligatorios antes de confirmar el cierre, también en servidor, sin inventar fechas ni completar automáticamente.
- Cubrir guardar, recargar y completar para modalidades local y por millas.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `move-operations`: persistencia y recuperación de mediciones, claridad del guardado parcial y validación de cierre con los valores visibles.

## Impact

- Admin: Measurements, TimeField, ConfirmedForm, recordMove y mensajes de resultado.
- Supabase: revisar record_move y añadir migración solo si el diagnóstico demuestra un defecto en persistencia; conservar permisos, versión, historial y cálculo actuales.
- Pruebas del flujo completo, validación temporal y errores por campo. Sin nuevas dependencias ni cambios de tarifas.

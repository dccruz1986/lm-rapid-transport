## Why

Al editar una cotización existente, cambiar «Trabajadores + camión» conserva la tarifa anterior porque el formulario solo carga la tarifa configurada cuando la cotización es nueva. Esto puede producir una estimación con un precio que no corresponde al equipo seleccionado.

## What Changes

- Actualizar inmediatamente la tarifa al cambiar el equipo, tanto en cotizaciones nuevas como existentes, usando el tarifario cargado desde Configuración.
- Aplicar la tarifa horaria del equipo en LOCAL y la tarifa común por milla en PER_MILE. Aplicar el mismo criterio al cambiar de modalidad para mantener coherentes las unidades.
- Recalcular la vista previa y conservar la edición manual posterior de la tarifa.
- Preservar la tarifa guardada al abrir una cotización; solo una selección explícita sustituye el valor del formulario. Persistir únicamente al guardar, con las validaciones y reconfirmación existentes.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `quote-pricing`: carga de tarifa configurada al seleccionar equipo o modalidad en el editor de cotizaciones.

## Impact

Cambio acotado al editor `QuoteEditor` en `apps/admin/src/components/workflow.tsx` y verificación de regresión del formulario. Se reutiliza `pricing_settings` ya recibido por la pantalla; no requiere migraciones, nuevas dependencias ni cambios de permisos o APIs.

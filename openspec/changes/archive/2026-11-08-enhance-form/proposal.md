## Why

El personal debe elegir manualmente la modalidad y calcular las millas estimadas aunque ya existan dos puntos en el mapa. Aprovechar esas ubicaciones reducirá trabajo y errores al preparar solicitudes fuera de Miami-Dade.

## What Changes

- Preseleccionar Por millas cuando al menos un extremo esté identificado fuera de Miami-Dade y el recorrido esté dentro de Florida; mantener casos inciertos pendientes de revisión.
- Obtener distancia aproximada por carretera de ida entre los dos puntos disponibles, incluidos puntos aproximados por ZIP, solo para recorridos no locales.
- Mostrarla como sugerencia y precargar el campo Millas estimadas de la cotización de la solicitud cuando esté vacío y sin edición manual; permitir aceptar o ajustar la sugerencia.
- Actualizar sugerencias al cambiar ubicaciones, evitando sobrescribir cantidades manuales o condiciones comerciales guardadas.
- Distinguir distancia estimada de millas reales del cierre; manejar falta de ruta o error del proveedor sin cifras ficticias.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `location-resolution`: distancia aproximada por carretera entre puntos resueltos, precisión, errores y vigencia de la sugerencia.
- `quote-pricing`: preselección territorial de modalidad y sugerencia de millas estimadas en el editor administrativo.

## Impact

Proveedor compartido de ubicaciones y mapa de admin, revisión territorial, QuoteEditor y validación de sugerencias. Integración de rutas de Google con configuración documentada. Revisar almacenamiento de estimaciones y controles de servidor, manteniendo permisos, tarifas, historial y reconfirmación comercial. Sin cálculo automático de millas reales ni cambios al formulario público en este alcance.

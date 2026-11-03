## Why

El mapa muestra el texto de las direcciones guardadas pero no recupera su ubicación seleccionada. El personal debe buscar y elegir otra vez origen y destino para ver los puntos, incluso al volver a una solicitud ya guardada.

## What Changes

- Recuperar la ubicación de cada dirección guardada al abrir la solicitud, con prioridad para su identificador de Google cuando exista.
- Conservar el vínculo entre texto, dirección estructurada e identificador seleccionado al guardar desde los formularios administrativos.
- Resolver direcciones históricas sin identificador y ZIP sin exigir volver a escribir; mostrar revisión necesaria cuando no haya una coincidencia inequívoca.
- Mantener ambos puntos en un único mapa y evitar búsquedas repetidas por rerenders, cambios de idioma o edición de campos ajenos al recorrido.
- Invalidar únicamente el extremo editado y descartar respuestas antiguas sin sobrescribir cambios recientes.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `location-resolution`: recuperación del valor seleccionado, persistencia de identidad de ubicación y estabilidad del mapa administrativo.

## Impact

LocationField compartido, RouteAddressesProvider, RouteMap, alta y edición administrativas, lectura y escritura de direcciones en Supabase, tipos y pruebas. Migración aditiva o actualización de RPC según el contrato existente. Se mantiene la autorización y la revisión territorial/comercial; cargar el mapa no confirma una cotización ni cambia tarifas.

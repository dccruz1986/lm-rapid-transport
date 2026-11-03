## Context

RouteAddressesProvider inicializa textos y componentes, pero positions siempre empieza con [null, null]. RouteMap solo ejecuta locateZip; no resuelve una dirección completa guardada. SelectedLocation contiene etiqueta, calle, ciudad y ZIP, pero no place_id. La selección y las coordenadas permanecen en memoria y se pierden al salir. addresses ya dispone de place_id y precision, que deben aprovecharse sin cambiar las condiciones comerciales.

## Goals / Non-Goals

**Goals:** recuperar automáticamente las ubicaciones guardadas, mantener consistencia entre mapa y edición y evitar reselecciones innecesarias o respuestas obsoletas.

**Non-Goals:** rutas de conducción, cálculo de distancia/precio, confirmación automática de condados, cambios de permisos o almacenamiento indiscriminado de respuestas de Google.

## Decisions

1. Definir un valor de ubicación compartido que incluya texto visible, componentes, place_id opcional y precisión. Mantener coordenadas y estado de resolución separados como datos de visualización. Un texto por sí solo no equivale a una selección resuelta. No almacenar objetos del SDK en formularios o DB.
2. Propagar place_id desde LocationField a los borradores y a las operaciones de alta/edición autorizadas. Guardar junto a la dirección en la misma transacción, invalidarlo al modificar texto/componentes y conservarlo al editar campos ajenos a la ubicación. Revisar todas las RPC de escritura administrativa afectadas para que no borren o conserven una identidad incompatible. Mantener compatibilidad con clientes/payloads existentes sin ese dato.
3. Recuperar cada extremo al abrir el detalle: resolver place_id válido con el SDK; si falta o deja de ser válido, resolver la dirección completa guardada mediante Geocoding del SDK; para un ZIP aislado, mantener resolución postal aproximada. No usar simplemente la primera sugerencia de autocompletado como dirección histórica exacta. Exigir resultado único, compatible con los componentes guardados, US/FL y sin coincidencia parcial; si hay ambigüedad, informar y permitir selección manual.
4. Mantener coordenadas en memoria y recuperar desde el identificador en una nueva visita. Evitar persistencia indefinida de coordenadas o respuestas de proveedor. Verificar la documentación vigente de Google sobre SDK, atribución y retención durante implementación; aprovechar la configuración existente de Maps JavaScript/Places/Geocoding y documentar APIs requeridas, sin nuevas claves por defecto.
5. Centralizar hidratación en el proveedor de recorrido con identidad por solicitud/extremo/valor guardado y revisión de edición. Deduplicar solicitudes en vuelo y resultados durante la sesión, incluidos efectos Strict Mode. No incluir idioma ni identidad de objetos/callbacks en la clave de consulta. Ignorar resultados si cambia la solicitud o se edita el extremo mientras esperan. Un resultado fallido solo se vuelve a consultar por reintento explícito o cambio real de ubicación.
6. Hidratar mapa y editor desde un mismo valor, sin marcar el borrador como editado ni guardar cambios al cargar. Actualizar el snapshot tras guardado exitoso sin perder cambios posteriores. Al cambiar de solicitud, reiniciar el contexto de esa solicitud; no mezclar puntos anteriores. No repetir geocodificación por un refresco con datos equivalentes.
7. Distinguir visualmente ubicación resuelta, ZIP aproximado, pendiente y error recuperable. Dos puntos ajustan encuadre; uno centra ese extremo; ninguno mantiene Miami. Hidratar el mapa no modifica territorial_reviewed, suggested_mode, estados, tarifas ni aceptación del cliente. Los metadatos del navegador siguen sin ser evidencia territorial confiable.

## Risks / Trade-offs

- Dirección antigua ambigua → no inventar selección; mantener texto y solicitar precisión solo en ese caso.
- Place ID obsoleto o ajeno a la dirección → recuperación controlada y comprobación de compatibilidad, sin sustituir silenciosamente los datos guardados.
- Coste y carreras de consultas → deduplicación, timeout, versión por extremo y pruebas de rerender/Strict Mode.
- Fallo de Google → formulario editable, datos conservados y reintento acotado; no bloquear otras operaciones del admin.
- Regresión de formulario público compartido → contrato compatible y pruebas de ambos consumidores.

## Migration Plan

Reutilizar las columnas existentes; añadir migración para las RPC que deban transportar/preservar place_id y precisión. Aplicar DB antes del frontend. Mantener columnas opcionales y sin backfill masivo de Google; resolver históricos al consultarlos. Rollback del frontend conserva datos y permisos, sin borrar direcciones ni cambiar estados.

## Open Questions

Ninguna bloqueante. «Valor real» se interpreta como identidad y ubicación resueltas, además del texto mostrado; no como una confirmación comercial automática.

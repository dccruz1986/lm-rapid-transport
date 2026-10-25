# Ubicaciones y formulario simplificado

La recepción tiene tres pasos: ubicación, detalles y contacto. Admite ZIP o dirección sin inventar calle, apellido, elevadores ni pisos. Email, fecha, equipo, detalles y fotos son opcionales. El tamaño 5+ se conserva como categoría. El admin completa direcciones y verifica condados antes de aprobar o programar.

## Activación de Google

1. Crear/seleccionar un proyecto en Google Cloud con facturación habilitada.
2. Habilitar **Maps JavaScript API**, **Places API (New)** y **Geocoding API**. No se requiere Routes API.
3. Crear una clave de navegador para Maps JavaScript API y Places API (New), restringida por sitios web (HTTP referrer), incluyendo localhost para desarrollo y el dominio de producción. Configurar `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en `apps/web/.env.local`; esta clave es pública por diseño y requiere esas restricciones. Reiniciar desarrollo o reconstruir el despliegue tras cambiarla. Crear además una clave de servidor independiente, restringida a esas APIs y, cuando el alojamiento tenga IP de salida estable, a esas IP. Es una integración de servidor, no usar restricciones HTTP referrer del navegador.
4. Configurar `GOOGLE_MAPS_SERVER_API_KEY` en `apps/web/.env.local` y en el servicio web del alojamiento; reiniciar el proceso. Nunca usar `NEXT_PUBLIC_` ni incluir valores reales en `.env.example` o Git.
5. Mantener `INTAKE_HASH_SECRET` aleatorio de al menos 32 caracteres, `WEB_URL` correcto y `TRUSTED_IP_HEADER` configurado solo si el proxy lo sobrescribe de forma confiable. El proveedor comparte los límites persistentes globales y por IP de recepción.
6. Configurar cuotas del proyecto Google y avisos de presupuesto. La aplicación limita consultas, pero no sustituye las cuotas del proveedor.

Las sugerencias se consultan directamente desde el navegador mediante `@googlemaps/js-api-loader`, `importLibrary("places")` y AutocompleteSuggestion. Al seleccionar, `fetchFields` termina la sesión de autocompletado y `/api/locations` verifica el place_id y firma la clasificación en el servidor. Son consultas de detalles independientes y pueden generar cargos adicionales. No se envían peticiones a ese endpoint por cada texto escrito. Las consultas del navegador se controlan con las restricciones y cuotas del proyecto Google; los límites persistentes de la aplicación solo cubren las peticiones al servidor.

Sin clave, ante timeout o error de Google, el formulario permite solicitud manual con ubicación pendiente de verificar. No hay resultados simulados en producción. Las sugerencias usan sesiones independientes y el servidor entrega una prueba firmada válida 15 minutos; una prueba vencida o alterada no clasifica la solicitud.

## Regla comercial

Ambos extremos en **Miami-Dade County**, incluyendo Hialeah y Miami Beach: LOCAL por hora del equipo configurado. Algún extremo fuera del condado pero dentro de Florida: PER_MILE. El nombre postal Miami y los centroides no son prueba territorial. Los ZIP generan orientación provisional; falta/ambigüedad de condado requiere revisión. El sistema no calcula duración de trabajo, distancia vial ni precio público con un ZIP. Las condiciones históricas permanecen sin cambios automáticos.

## Datos y privacidad

Los endpoints no cachean respuestas, no registran las búsquedas ni guardan respuestas completas, sugerencias, coordenadas o direcciones normalizadas del proveedor. Solo se conserva el texto aportado por el cliente, el `place_id` permitido y la decisión operativa derivada; la dirección definitiva la confirma el personal. Las respuestas normalizadas se usan transitoriamente para resolver el condado. La prueba firmada se descarta al crear la sesión de recepción. Los temporales siguen la limpieza de intake documentada en README. La interfaz muestra atribución Google Maps y enlaza privacidad/condiciones.

Referencias oficiales: [Autocomplete](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete), [Geocoding](https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding), [restricciones de claves](https://developers.google.com/maps/api-security-best-practices), [políticas de Places](https://developers.google.com/maps/documentation/places/web-service/policies).

## Despliegue y rollback

Aplicar las migraciones `20261018000100` a `20261018000400` antes de desplegar web/admin. Son aditivas y conservan nombres y direcciones históricos. Desplegar los consumidores admin junto a la nueva recepción. Para desactivar las sugerencias retirar NEXT_PUBLIC_GOOGLE_MAPS_API_KEY y reconstruir la web; para desactivar la validación retirar GOOGLE_MAPS_SERVER_API_KEY; los leads manuales siguen funcionando. Al revertir la interfaz conservar las columnas nuevas y un admin capaz de leer datos parciales; no borrar solicitudes ni revertir sus datos.

Las pruebas automatizadas usan respuestas controladas de Google. La prueba real de Google debe realizarse después de configurar una clave autorizada; no se considera realizada solo por pasar los mocks.



## Mapa en admin y aprobación local

La aprobación interna de una cotización LOCAL puede hacerse con direcciones pendientes. Confirmar con el cliente o programar sigue requiriendo direcciones completas y revisión territorial; PER_MILE conserva su validación al aprobar. Migración: 20261019000100.

El detalle de solicitud incluye un solo mapa con A (origen) y B (destino), dos búsquedas por dirección/ZIP y ajuste para mostrar ambos puntos. Es una vista de consulta: no guarda automáticamente cambios de dirección ni determina tarifas. Los ZIP son aproximados. Las direcciones se guardan desde el editor de solicitud.

Configurar NEXT_PUBLIC_GOOGLE_MAPS_API_KEY también en apps/admin/.env.local y autorizar http://localhost:3001/* en los referrers. La clave de admin necesita Maps JavaScript API y Places API (New). El mapa usa LocationField compartido en @lm/ui/location-field: selecciona una sugerencia en cada campo y pulsa Mostrar ambos puntos. Las coordenadas proceden de Place Details y no se consulta Geocoding en el admin; Geocoding sigue siendo opcionalmente utilizado por la resolución del servidor web. NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID permite usar un Map ID propio; sin él se usa DEMO_MAP_ID para desarrollo. Reconstruir el admin al cambiar variables públicas. No se guardan coordenadas ni resultados de Google en base de datos.


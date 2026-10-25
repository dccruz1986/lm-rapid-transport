# Verificación de new-form — 2026-10-18

Implementación completada: 18/18 tareas. No archivada ni desplegada.

## Comprobaciones

- Migraciones locales 20261018000100–20261018000400 aplicadas correctamente.
- `bunx supabase test db`: 126 pruebas correctas, incluyendo intake parcial y bloqueo de aprobación hasta completar/verificar direcciones.
- `bun test tests/new-form.test.ts`: 22 pruebas correctas de contratos y proveedor Google con respuestas controladas.
- `bun tests/new-form-integration.ts`: 12 comprobaciones HTTP locales correctas (recepción mínima, payload adulterado, concurrencia e idempotencia).
- `bun tests/intake-integration.ts`: 37 comprobaciones correctas de compatibilidad, adjuntos y reintentos.
- `bun run typecheck`: correcto, raíz y ambas aplicaciones.
- `bun run build`: web y admin correctos.
- `bun run lint`: queda un error de formato preexistente en apps/admin/src/app/auth/actions.ts. Los archivos del cambio no tienen errores; existen avisos informativos de concatenación de textos.

## Navegador local

- Flujo completo EN en escritorio: solicitud de prueba LM-001032, tamaño 5+, fecha/email opcionales y ZIP como ubicación parcial.
- Flujo completo ES a 390×844: solicitud de prueba LM-001039, estudio y datos opcionales vacíos. Retroceder conserva ubicaciones y tamaño.
- Admin: muestra nombre completo, ubicaciones parciales y revisión pendiente; permite borrador, bloquea aprobación incompleta. Tras completar direcciones sintéticas de Hialeah/Miami Beach y verificar ambos condados, sugiere LOCAL y permite aprobación interna. No se registró aceptación ficticia del cliente.
- Componente real LocationField montado temporalmente en un servidor aislado con respuestas simuladas: lista de sugerencias, selección mediante flecha abajo + Enter, invalidación al editar y fallback de error EN comprobados. Servidor de prueba detenido y archivo temporal retirado del árbol de aplicación.
- Captura móvil: .local/new-form-mobile.png. Viewport restaurado al finalizar.

## Límites y operación

No hay clave Google configurada: la conexión real con Google NO se ha probado. La preparación y los escenarios de error se verificaron con respuestas controladas, y el formulario real funciona en modo manual. Configuración, APIs necesarias, privacidad y rollback están en docs/google-locations.md. Antes de publicar, configurar GOOGLE_MAPS_SERVER_API_KEY y comprobar sugerencias/resolución con el proyecto Google autorizado.

ZIP/condado no generan horas, distancia vial ni total automático. Datos ambiguos quedan pendientes. Las migraciones preservan registros históricos y se deben conservar al revertir la interfaz. Las pruebas de navegador crearon registros sintéticos en Supabase local; no se modificaron solicitudes de clientes reales.

## Ajuste posterior: Google Maps JavaScript

Por petición del usuario, las sugerencias usan @googlemaps/js-api-loader 2.1.3 con AutocompleteSuggestion directamente en navegador. Se conserva la verificación firmada del condado al seleccionar. Configuración pública y privada documentada por separado. Pruebas del loader/proveedor: 25 correctas; build web y comprobación de tipos correctos. La prueba con credenciales reales sigue pendiente. La evidencia de navegador anterior corresponde a la integración original; no certifica llamadas reales del nuevo SDK.

## Ajuste 2026-10-19: aprobación local y mapa admin

Petición posterior: la aprobación interna LOCAL ya no requiere direcciones completas. Migración 20261019000100 aplicada localmente. La confirmación/programación conserva su validación. 127 pruebas SQL correctas; build admin correcto. El mapa de consulta tiene dos campos, marcadores A/B y encuadre común; no persiste automáticamente direcciones. Configuración de admin documentada en docs/google-locations.md.
Prueba en navegador: mapa base carga con la clave pública existente, pero Geocoding devuelve API no autorizada. Marcadores reales pendientes de habilitar Geocoding API y autorizarla en las restricciones de esa clave.

2026-10-23: LocationField y el cargador Google se trasladan a packages/ui. Web conserva la resolución firmada; admin usa selección de Places con coordenadas transitorias, sin /api/locations ni Geocoding. Editar texto invalida el punto y requiere seleccionar nuevamente.
Prueba real 2026-10-23 en admin: sugerencias Places para 33147 y 33016, selección de ambos resultados y mapa con marcadores A/B confirmados. Tipos, 25 pruebas y builds web/admin correctos. Captura .local/shared-location-map.png.

## Cierre 2026-10-25

Ajustes posteriores incluidos: mapa inicial centrado en Miami y puntos aproximados por ZIP; sugerencias solo tras edición del usuario; borrador de direcciones compartido entre mapa y editor con selección Google y guardado explícito, sin campos visibles duplicados de calle/ciudad/ZIP. El flujo admin se presenta en cuatro pasos (datos, aprobación interna, aceptación y programación). La aceptación exige recorrido completo/revisado; una comunicación sin aceptación admite direcciones pendientes en LOCAL. El cierre muestra importe, llegada, finalización y duración real, distinguiéndola del mínimo/redondeo facturable.

Validaciones realizadas durante estos ajustes: tipos admin/web y 25 pruebas de formulario/proveedor correctos; 130 pruebas SQL correctas tras agregar cobertura de comunicación sin aceptación y rechazo atómico. El arreglo de recordMove omite millas ausentes en LOCAL en vez de enviar cero; se verificó con fechas del caso reportado dentro de una transacción revertida. La última modificación visual del resumen pasó tipos admin; no se afirma una nueva prueba visual completa de todo el flujo.

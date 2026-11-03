# Verificación de map-value — 2026-11-02

## Completado

- Typecheck de raíz, web y admin correcto.
- Suite Bun: 56 pruebas, 138 assertions correctas. Incluye seis pruebas del resolvedor con 17 assertions: identidad, fallback histórico, ZIP, identidad obsoleta, ambigüedad, Florida, fallo de autorización y caché de promesas.
- Suite SQL existente: 160 comprobaciones correctas tras aplicar la migración local.
- Nueva prueba SQL transaccional: nueve assertions correctas para guardar identidades, conservarlas al editar contacto, invalidarlas al cambiar dirección y mantener revisión territorial pendiente.
- Navegador local: alta sintética LM-001079 con las direcciones de la captura. Al abrir el detalle se mostraron «A: Dirección recuperada», «B: Dirección recuperada» y ambos puntos visibles, sin reselección.

## Pendiente / bloqueo

- La deduplicación tiene cobertura unitaria. Falta completar la comprobación integrada de Strict Mode, cambio de idioma, edición concurrente y navegación entre solicitudes (3.3).
- Falta revisión visual móvil y recarga completa (3.4). La recarga del navegador terminó en timeout durante las verificaciones finales.
- Dos intentos iniciales de `bun run build:admin` fallaron al iniciar el worker TypeScript por falta de memoria. Resuelto en la continuación descrita debajo.
- Continuación: corregido el tipo de GeocoderGeometry del mock; typecheck completo vuelve a pasar tras el ajuste final del proveedor. Se repitieron las seis pruebas del resolvedor: todas correctas.
- Build admin completado correctamente al usar NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=4", incluyendo TypeScript y generación de rutas. Los fallos de memoria anteriores quedan resueltos para esta ejecución.
- Build web también completado con la misma configuración temporal. OpenSpec validate map-value y git diff --check correctos.
- La recuperación del navegador integrado continúa bloqueada después de reconectar la pestaña y restablecer la sesión: timeout de CDP al configurar foco. No se han marcado completas 3.3 y 3.4.

## Despliegue

- Migración `20261102000100_map_identity.sql` aplicada solamente a Supabase local. Aplicarla al remoto antes de desplegar los formularios nuevos.
- Mantener la clave pública de Google configurada con Maps JavaScript API, Places API y Geocoding API habilitadas y restricciones de referente correspondientes al dominio.
- Se conservan place_id y precisión. Las coordenadas resueltas permanecen en memoria; cargar el mapa no aprueba condiciones ni clasificación territorial.

## Referencias consultadas

- https://developers.google.com/maps/documentation/javascript/place-id
- https://developers.google.com/maps/architecture/geocoding-address-validation
- https://developers.google.com/maps/documentation/javascript/policies

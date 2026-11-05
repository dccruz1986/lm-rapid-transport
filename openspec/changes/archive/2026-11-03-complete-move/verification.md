# Verificación — 2026-11-03

## Implementado

- Campos de tiempo y millas controlados para conservar entradas ante reset o error; el snapshot persistido se recarga mediante la versión de Move tras guardar.
- Selección de offset compatible con la fecha local, conservando la selección explícita para horas ambiguas.
- Validación compartida en cliente y servidor, con errores ES/EN específicos para llegada, finalización y millas. La modalidad del servidor procede de la cotización persistida.
- Estado de las últimas mediciones guardadas con indicación de datos faltantes. Completar valida antes del diálogo; los campos y botones se bloquean durante el envío.
- Eliminado el log de FormData de recordMove.

## Evidencia

- `bun test tests/measurements.test.ts`: 4 pruebas, 18 assertions correctas. Guardar/recuperar instantes y millas, avance parcial, cierre local y por millas, campos vacíos, tiempos invertidos/futuros, offset incorrecto y cambio de hora de otoño.
- `bunx supabase test db supabase/tests/measurements.test.sql`: 20 comprobaciones correctas. Guarda y recupera finalización, registra historial, completa desde los valores persistidos, calcula total, sincroniza estados y rechaza versión obsoleta/corrección poscierre de dispatcher. Fixtures dentro de transacción revertida.
- Typecheck completo correcto y build de admin correcto con NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=4".
- La RPC existente conserva las mediciones completas: no se necesita migración ni backfill. No se ha demostrado pérdida de un horario introducido por parte de la base de datos.

## Pendiente

- 1.1: comparar visualmente el formulario antes y después del guardado; diagnóstico de RPC cubierto, ciclo visual todavía no verificado.
- 3.3: conflicto y permisos cubiertos en SQL; faltan pruebas de interacción para doble envío y conservación de borrador ante fallo.
- 3.4: typecheck y build pasan; falta revisión real de guardar/recargar/completar y mensajes ES/EN en navegador.

Se pudo acceder al navegador con la cuenta local de pruebas. La solicitud sintética inicial TEST-COMPLETE-MOVE se creó con UUID 96000000-0000-0000-0000-000000000010, que el validador de rutas rechaza; permanece como fixture local sin completar. La creación de una copia con UUID válido fue bloqueada antes de ejecutarse por el límite de uso del revisor automático de permisos. No se intentó eludir esa revisión. La mudanza del usuario no fue modificada.

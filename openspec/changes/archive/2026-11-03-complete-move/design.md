## Context

Measurements usa campos no controlados, TimeField convierte instantes a hora de Miami y el formulario se monta por versión de Move. recordMove envía start/end/miles a record_move y revalida el layout. La RPC admite finalización nula para save, pero la exige para complete. En el caso reportado, la versión 5 conserva llegada y 205 millas; el historial no contiene finalización. Esto demuestra guardado parcial, pero no demuestra que React haya perdido una fecha introducida: debe reproducirse antes de atribuir causa.

## Goals / Non-Goals

**Goals:** persistir todos los valores introducidos, recuperar el último guardado, impedir cierre incompleto con mensajes concretos y conservar borradores ante errores.

**Non-Goals:** eliminar el guardado parcial, cambiar tarifas o permisos, inventar horas, completar registros existentes o modificar la mudanza real usada para diagnosticar.

## Decisions

1. Reproducir con una solicitud sintética y comprobar payload, fila e historial. Mantener la RPC existente si persiste correctamente; una migración solo se justifica con un fallo demostrado.
2. Mantener un borrador explícito de mediciones inicializado desde Move. Tras guardar correctamente, usar el snapshot persistido y su versión; ante error conservar los valores introducidos. Coordinar campos controlados y el reinicio del formulario para que revalidación/reset no borren finalización o millas. Los rerenders de la misma versión no sobrescribirán ediciones pendientes. Mientras se envía, bloquear edición y doble envío para evitar perder cambios posteriores.
3. El guardado parcial sigue permitido. La respuesta mostrará «Avance guardado» y los campos que faltan; cuando están completos indicará que puede completarse la mudanza. No confundir guardado con cierre ni calcular total definitivo en save.
4. Completar usa los valores visibles actuales, que inicialmente son los guardados, y no exige un guardado previo. Validar llegada y finalización en ambas modalidades y millas positivas en PER_MILE. Presentar errores por campo antes del diálogo y repetir validación en servidor. Mantener validación temporal y de permisos en la RPC.
5. No rellenar silenciosamente un campo borrado con un valor antiguo en el servidor. Si el usuario borra la finalización, debe verla vacía y recibir el error específico al completar. Esto evita cerrar con información que no coincide con el formulario.
6. Derivar el offset mostrado del instante guardado en America/New_York; verificar cambios EST/EDT, cruces de medianoche y consistencia entre fecha visible y dato enviado. Conservar desambiguación explícita cuando la hora local sea ambigua.

## Risks / Trade-offs

- Reset de React o remount por versión → prueba real guardar y completar, verificando campos y base de datos.
- Snapshot concurrente sobrescribe borrador → conservar control optimista por versión, mostrar conflicto y no escribir parcialmente.
- Campos opcionales parecen completos → mensajes de avance con faltantes y errores específicos de cierre en ES/EN.
- Fecha vacía antigua → no reconstruirla ni usar hora actual; requerir entrada del operador.

## Migration Plan

Aplicar cambios de formulario/acción y pruebas. Sin backfill. Si se necesita migración, preservar firma compatible de RPC, validaciones y registros existentes; desplegarla antes del frontend. Revertir frontend si hay regresión sin borrar mediciones guardadas.

## Open Questions

Ninguna decisión de producto pendiente. La causa técnica exacta de una posible pérdida de entrada se resolverá mediante la reproducción de la primera tarea.

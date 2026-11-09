## Context

RouteAddressesProvider comparte puntos y direcciones entre mapa y edición. QuoteEditor inicializa modalidad desde la cotización o suggested_mode, pero la cantidad nueva comienza en 3 incluso al elegir millas. El editor territorial contiene selectores de condado y confirmación manual. La regla vigente considera local todo Miami-Dade, no solo la ciudad de Miami; la aprobación por millas exige revisión territorial y direcciones completas.

## Goals / Non-Goals

**Goals:** sugerir modalidad y distancia de ida desde ubicaciones disponibles, reducir entradas repetidas y evitar mezclar horas, millas estimadas y millas reales.

**Non-Goals:** cerrar mudanzas, aprobar automáticamente, cambiar tarifas existentes, clasificar por nombre de ciudad, soportar recorridos fuera de Florida o modificar el formulario público.

## Decisions

1. Condado, no distancia ni ciudad, determina modalidad. Ambos extremos en Miami-Dade sugieren LOCAL; alguno fuera y ambos en Florida sugieren PER_MILE. Un extremo resuelto fuera de Miami-Dade puede mostrar una indicación provisional aunque el otro siga pendiente; no prueba cobertura ni habilita aprobación. Si falta evidencia o hay ambigüedad se mantiene revisión pendiente. Las sugerencias del navegador no marcan automáticamente «Condado verificado» ni la casilla de revisión; la verificación autoritativa sigue en servidor o el flujo autorizado vigente.
2. Calcular recorrido por carretera de ida usando integración de rutas de Google y las ubicaciones resueltas. No usar distancia en línea recta como sustitución silenciosa. Antes de implementar, verificar en documentación oficial la API actual compatible con el SDK/proyecto, activación, restricciones, facturación y retención. Preferir SDK del navegador si está soportado por la integración instalada; si requiere llamada privada, usar endpoint autenticado con timeout y límites, nunca exponer claves privadas.
3. Distancia normalizada en millas (metros / 1609.344), mostrada y sugerida con un decimal; el cálculo monetario mantiene el redondeo vigente del servidor. Una ruta que el proveedor no devuelve, cero o fuera de los límites permitidos no se aplica. Puntos ZIP producen una estimación entre puntos aproximados y no sustituyen direcciones exactas ni mediciones reales.
4. Estado compartido de sugerencia ligado a la pareja ordenada origen/destino, sus identidades, precisión y revisión. Deduplicar consultas dentro de la vista, ignorar respuestas antiguas y permitir reintento explícito. No consultar rutas locales, incompletas o fuera de cobertura. Una sugerencia anterior deja de ser válida al editar cualquiera de los extremos.
5. En cotización nueva sin edición manual, preseleccionar la modalidad deducida y cargar la tarifa configurada correspondiente. Sustituir el valor inicial 3 por cantidad vacía al pasar a millas; las horas nunca se reutilizan como millas. Precargar millas cuando llega una sugerencia válida y el campo no tiene edición manual. Si el valor es manual o guardado, ofrecer «Usar distancia sugerida» sin reemplazarlo. Mostrar fuente aproximada y estado de cálculo en ES/EN.
6. Conservar procedencia en el estado del borrador: vacío, sugerido o manual. Al cambiar recorrido, limpiar únicamente una cantidad autogenerada obsoleta; conservar manuales y snapshots guardados con aviso para revisar. Si se detecta contradicción con modalidad guardada, proponer cambio explícito dentro del flujo de revisión de términos, no reescribirla en un efecto.
7. Persistir la cantidad aceptada mediante el guardado actual de cotización y su validación/versionado. No persistir payloads de rutas, trazados ni coordenadas adicionales. La estimación de ruta por sí misma no guarda ni aprueba condiciones comerciales; la distancia real continúa siendo entrada operativa independiente.

## Risks / Trade-offs

- ZIP que abarca condados o puntos aproximados → etiqueta provisional y revisión territorial obligatoria.
- Coste/cuota/credenciales de rutas → consulta solo para pares elegibles, deduplicación, timeout, error visible y entrada manual disponible.
- Respuesta tardía o edición manual → clave de recorrido y procedencia de cantidad; descartar resultados obsoletos.
- Cambio LOCAL/PER_MILE → separar unidades y tarifas; no convertir horas a millas ni alterar cotizaciones guardadas automáticamente.

## Migration Plan

Verificar integración Google y documentar variables/APIs necesarias antes del despliegue. Implementar estado de sugerencia y editor, validar con mocks y prueba local con Google. No se prevé migración de datos; si se detecta necesidad de campos adicionales se documentará y añadirá migración compatible sin backfill de cotizaciones. Revertir frontend deshabilita sugerencias y conserva cantidades guardadas.

## Open Questions

Ninguna aclaración funcional pendiente. La elección exacta de API/SDK de rutas se resolverá contra documentación oficial durante la primera tarea, según las APIs disponibles en el proyecto.

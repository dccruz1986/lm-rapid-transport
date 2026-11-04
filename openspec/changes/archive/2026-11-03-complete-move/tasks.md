## 1. Diagnóstico y contrato

- [ ] 1.1 Reproducir con una solicitud sintética el guardado de llegada, finalización y millas; comparar payload, fila, historial y valores mostrados tras revalidación para identificar cualquier pérdida.
- [x] 1.2 Definir validación diferenciada de avance y cierre, errores por campo y respuesta de guardado con estado de completitud; conservar requisitos temporales y comerciales.

## 2. Persistencia y formulario

- [x] 2.1 Corregir el flujo de recordMove/RPC si el diagnóstico detecta pérdida, preservando versión, permisos, historial y atomicidad; añadir migración solo si es necesaria.
- [x] 2.2 Mantener el borrador de mediciones y restaurar el snapshot guardado después del éxito y al reabrir; impedir vaciado por reset/rerender y conservar entradas ante fallo.
- [x] 2.3 Validar y conservar offsets de Miami al recuperar horarios, incluidos EST/EDT; impedir edición y doble envío mientras se guarda.
- [x] 2.4 Mostrar mensajes ES/EN de avance guardado con faltantes o mediciones listas, y errores específicos antes de confirmar cierre; completar con los valores visibles sin exigir guardar antes.

## 3. Verificación

- [x] 3.1 Probar guardar, recargar y completar en LOCAL y PER_MILE, verificando instantes, millas, versión, estado y total persistidos.
- [x] 3.2 Probar datos parciales, finalización borrada, campos ausentes, instantes invertidos/futuros, medianoche y EST/EDT; confirmar que no se inventan valores ni se cierran registros incompletos.
- [ ] 3.3 Probar conflictos, fallos de guardado, doble envío, permisos y conservación de borrador; verificar que correcciones poscierre mantienen restricciones.
- [ ] 3.4 Revisar el flujo real en navegador con mensajes ES/EN, ejecutar typecheck, pruebas afectadas y build de admin; documentar evidencia y cualquier limitación.


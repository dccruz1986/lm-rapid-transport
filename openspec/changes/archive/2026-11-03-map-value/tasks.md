## 1. Contrato y persistencia

- [x] 1.1 Extender el valor compartido de ubicación con place_id, precisión y estado de resolución, manteniendo compatibilidad con el formulario público.
- [x] 1.2 Propagar identidad seleccionada por alta/edición administrativas, validación y tipos; invalidarla solo al cambiar su ubicación.
- [x] 1.3 Añadir migración de RPC para guardar y recuperar metadatos opcionales atómicamente, conservando permisos y revisión territorial.

## 2. Recuperación y mapa

- [x] 2.1 Verificar documentación vigente de Google y configurar resolución SDK por place_id, dirección histórica y ZIP con comprobación de compatibilidad, timeout y errores.
- [x] 2.2 Implementar hidratación centralizada por solicitud/extremo con deduplicación, versiones de edición y descarte de respuestas antiguas.
- [x] 2.3 Sincronizar mapa/editor y snapshot guardado sin marcar ediciones al cargar ni perder cambios pendientes al refrescar.
- [x] 2.4 Actualizar estados ES/EN y encuadre para dos puntos, uno o ninguno; distinguir precisión postal y ofrecer reintento explícito.

## 3. Verificación

- [x] 3.1 Probar guardar/reabrir desde alta y edición, conservando identificadores al cambiar contacto e invalidándolos al cambiar ubicaciones; verificar permisos y compatibilidad histórica.
- [x] 3.2 Probar resolución por identificador, dirección histórica, ZIP, identidad obsoleta, ambigüedad, fuera de Florida y fallo de Google.
- [ ] 3.3 Probar ausencia de consultas duplicadas por rerender/Strict Mode/idioma y descarte de respuestas al editar o cambiar de solicitud.
- [ ] 3.4 Revisar en navegador móvil/escritorio el caso de la captura: abrir direcciones guardadas y ver puntos sin reselección; confirmar que no cambian condiciones comerciales.
- [x] 3.5 Ejecutar typecheck, pruebas afectadas y build; documentar resultados y requisitos de despliegue.


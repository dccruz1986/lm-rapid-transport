## 1. Contrato y persistencia

- [x] 1.1 Definir esquema compartido de alta administrativa con contacto, ubicaciones parciales, tamaño, comentarios y fecha definida/indefinida; reutilizar normalización y reglas vigentes.
- [x] 1.2 Añadir migración para requests.create en los tres roles y almacenamiento privado de autor, clave de operación y huella del contenido.
- [x] 1.3 Implementar RPC autorizada y transaccional con asociación por teléfono, direcciones, estado NEW, idempotencia y conflicto por cambio de contenido; restringir grants.
- [x] 1.4 Actualizar tipos y acceso a datos para retornar id y número de solicitud.

## 2. Alta en admin

- [x] 2.1 Añadir Server Action con requireStaff, validación, errores recuperables, revalidación y redirección al detalle.
- [x] 2.2 Añadir Nueva solicitud en Requests y ruta /requests/new protegidas por requests.create.
- [x] 2.3 Implementar formulario ES/EN responsive y accesible con contacto, ubicaciones, tamaño, fecha por definir y comentarios, cancelar y estados de envío.
- [x] 2.4 Integrar LocationField compartido conservando selección, admitiendo captura manual y mostrando precisión/revisión territorial sin depender del endpoint de web.
- [x] 2.5 Conservar datos y clave de operación en errores/reintentos e impedir doble submit; verificar continuación del flujo existente sin aprobar ni programar automáticamente.

## 3. Verificación

- [x] 3.1 Probar RPC con ADMIN, MANAGER y DISPATCHER, y rechazo para anónimo, desactivado y usuario sin permiso, incluidas llamadas directas.
- [x] 3.2 Probar atomicidad, reintentos concurrentes, conflicto de payload y dos operaciones para mismo teléfono sin duplicar ni sobrescribir cliente.
- [x] 3.3 Probar validación de teléfono/email/fechas, ZIP parciales, Google no disponible y rechazo de ubicación verificada fuera de Florida.
- [x] 3.4 Revisar en navegador móvil/escritorio y ES/EN: alta por los tres roles, errores, cancelación, persistencia al rerenderizar, detalle y aparición en lista.
- [x] 3.5 Ejecutar typecheck, build de admin y pruebas afectadas; registrar resultados y limitaciones de la verificación.




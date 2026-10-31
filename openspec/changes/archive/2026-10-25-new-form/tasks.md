## 1. Contratos y datos

- [x] 1.1 Definir payload de recepción versionado con full_name, move_size, ubicaciones parciales, precisión y estados territoriales; separar validación inicial de validación operativa, conservando compatibilidad con payload antiguo.
- [x] 1.2 Crear migración aditiva y ajustar RPC/transacción de intake, tipos DB y RLS para datos ausentes sin valores ficticios; backfill histórico seguro y conservación de idempotencia/contactos/adjuntos.
- [x] 1.3 Adaptar vistas y editores admin de solicitudes/clientes/mudanzas a nombres completos, tamaño 5+, propiedad desconocida, datos nulos y dirección pendiente.

## 2. Resolución geográfica

- [x] 2.1 Implementar adaptador servidor Places API (New)/Geocoding con clave privada opcional, timeout, campos mínimos, sesión de búsqueda y errores tipados; documentar APIs/facturación/restricciones y placeholders.
- [x] 2.2 Crear endpoints de sugerencia/resolución con validación US/FL, cuotas persistentes, límites de cuerpo y token de resolución breve ligado a datos; no confiar en modo/condado del navegador.
- [x] 2.3 Implementar clasificación Miami-Dade: LOCAL/PER_MILE/NEEDS_REVIEW, precisión postal provisional, invalidación al editar y revisión de resultados ambiguos; no deducir por ciudad postal ni centroide.
- [x] 2.4 Implementar minimización, retención permitida por Google y atribución; revisar aviso de privacidad/enlaces requeridos sin almacenar respuestas completas o registrar búsquedas en logs.

## 3. Formulario simplificado

- [x] 3.1 Crear paso Ubicación con dos campos ZIP/dirección, autocompletado accesible, debounce, rechazo de respuestas obsoletas y alternativa manual sin claves o servicio disponible.
- [x] 3.2 Crear paso Detalles con fecha flexible y tamaños acordados; conservar límites de fecha Miami y detalles/fotos opcionales plegados.
- [x] 3.3 Crear paso Contacto con nombre completo, email opcional y teléfono US; mantener datos al retroceder y envío final atómico con éxito real/reintento idempotente.
- [x] 3.4 Aplicar diseño inspirado en imágenes con naranja/blanco, ES/EN, teléfono configurado, foco/errores y responsive móvil/desktop.

## 4. Cotización y operación

- [x] 4.1 Mostrar sugerencia territorial y pendientes en admin; permitir aprobación interna LOCAL con direcciones pendientes y exigir direcciones completas/revisión antes de confirmar, programar o aprobar PER_MILE, con validación autoritativa servidor/DB.
- [x] 4.2 Precargar modalidad verificada para nuevas cotizaciones y permitir revisión explícita; preservar condiciones históricas y flujo de reconfirmación ante cambios comerciales.
- [x] 4.3 Actualizar textos/documentación/fixtures de municipio de Miami a condado Miami-Dade y explicar que ZIP no determina horas, millas de ruta ni total automático.

## 5. Validación y entrega

- [x] 5.1 Probar Google con respuestas controladas: ZIP exacto, dirección completa, Miami-Dade incluyendo Hialeah/Miami Beach, Broward, fuera de FL, sin condado, ambiguo, cuota, timeout y clave inválida/ausente.
- [x] 5.2 Probar recepción mínima y antigua, nombre compuesto, estudio/5+/oficina, fecha flexible, teléfono, nulos, privacidad, payload territorial adulterado, concurrencia e idempotencia.
- [x] 5.3 Verificar en navegador móvil/desktop ES/EN los tres pasos, teclado/sugerencias, retroceso, fallback, envío y edición/completado posterior en admin.
- [x] 5.4 Ejecutar lint, tipos, pruebas relevantes y builds web/admin; documentar resultados, migración/rollback y estado de prueba real de Google (pendiente si no hay clave), sin presentar mocks como integración real verificada.



## Context

Requests dispone de lista, detalle y edición. La recepción pública usa un flujo privilegiado con tokens, cuotas y archivos temporales; no es una API administrativa. Los roles actuales son ADMIN, MANAGER y DISPATCHER, con permisos consultados mediante `my_permissions` y comprobados en DB. Existe LocationField compartido con selección de Google y entrada manual.

## Goals / Non-Goals

**Goals:** alta manual sencilla desde Requests para los tres roles activos, validación consistente, integridad transaccional y continuación del flujo existente.

**Non-Goals:** nuevos roles, importación masiva, adjuntos durante el alta, cambios de tarifas, confirmación/programación automática, notificaciones o cambios al formulario público.

## Decisions

1. Añadir `/requests/new` dentro del layout staff y un botón «Nueva solicitud». Una página ofrece espacio y navegación móvil sin recargar el sidebar; se descarta un modal extenso. Formulario ES/EN con secciones Contacto, Ubicaciones y Detalles, submit y cancelar.
2. Añadir `requests.create` a los tres roles en la matriz DB. Usar `requireStaff('requests.create')` en ruta y Server Action, y `private.require_permission` en una RPC de creación. No reutilizar `requests.edit`: el alta merece una acción independiente. No abrir INSERT directo ni usar la recepción anónima como atajo.
3. Nombre completo y teléfono estadounidense obligatorios; email opcional. Origen/destino por ZIP o dirección y tamaño obligatorios. Fecha definida o casilla «Fecha por definir»; reutilizar reglas vigentes de fechas de recepción (futura, no domingo, America/New_York). Comentarios opcionales. Reutilizar esquemas compartidos sin inventar calle ni dividir nombres; campos operativos adicionales se completan en el detalle existente.
4. Reutilizar LocationField en modo administrativo sin depender de `/api/locations` de web. Mantener valores y selección durante rerenders. Aceptar ZIP y texto manual identificados como no verificados, nunca clasificarlos automáticamente como local. Local significa ambos extremos en Miami-Dade; ubicaciones verificadas fuera de Florida se rechazan. La creación no convierte coordenadas o etiquetas proporcionadas por el navegador en prueba de verificación; reutilizar verificación confiable existente o mantener clasificación pendiente para revisión.
5. RPC transaccional con clave UUID de operación, usuario creador y huella de payload validado. Persistir relación de idempotencia privada con unicidad por actor/clave; un mismo payload devuelve id y número previos, otro payload con esa clave produce conflicto. Revalidar permiso antes de recuperar un resultado. Resolver cliente por teléfono normalizado con unicidad y manejo concurrente, conservar datos recibidos en solicitud sin sobrescribir cliente existente. Crear direcciones y solicitud NEW en una sola transacción.
6. El formulario conserva datos en errores y bloquea submit mientras guarda; reutiliza clave en reintentos del mismo envío. Tras éxito, invalidar lista/datos afectados y redirigir al detalle con número de solicitud. NEW expresa una solicitud recién recibida, aunque tenga ubicaciones pendientes de revisión; no implica aprobación comercial.

## Risks / Trade-offs

- Doble clic o respuesta perdida → idempotencia DB, además del estado pendiente del botón.
- Coincidencias de teléfono → asociación atómica sin fusionar por email ni sobrescribir fichas existentes.
- Google indisponible → permitir datos parciales manuales y señalar revisión necesaria, conservando los bloqueos comerciales actuales.
- Payload manipulado o sesión desactivada → validación servidor/DB, grants mínimos y pruebas directas de RPC.
- Reglas de fecha pueden limitar solicitudes urgentes → mantener las vigentes; cualquier excepción operativa se trata como cambio posterior.

## Migration Plan

Aplicar migración aditiva de permiso, almacenamiento privado de idempotencia/autor y RPC; generar tipos y desplegar admin después. Validar localmente antes del despliegue. Rollback de UI mantiene solicitudes creadas; revocar nueva RPC/permiso si fuera necesario, sin borrar registros ni revertir datos.

## Open Questions

Ninguna bloqueante. El alcance inicial no incluye fotos durante el alta ni excepciones a las fechas admitidas.

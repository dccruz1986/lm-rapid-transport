## Context

La revisión del código muestra tres patrones: web usa React Hook Form con errores locales parciales; NewRequestForm conserva una lista de nombres y muestra «Revisa este campo»; la mayoría de acciones administrativas reduce Zod a FormResult `{error, success}`. ResultNotice presenta incluso PHONE_CONFLICT y MOVE_* como alertas generales. Autenticación y personal usan contratos propios; setActive lanza errores sin aviso recuperable en la fila. editRequest concatena un error de esquema al código, impidiendo traducción fiable. Los formularios contienen controles compuestos, campos ocultos y confirmaciones cuyo comportamiento debe preservarse.

## Goals / Non-Goals

**Goals:** errores específicos junto al control editable; errores generales en el aviso actual; cobertura de todos los formularios; mensajes ES/EN, foco accesible, valores conservados y servidor autoritativo.

**Non-Goals:** cambiar reglas de precios, territorio, fechas, autenticación o permisos; rediseñar pantallas; sustituir React Hook Form en web; aprobar, enviar invitaciones o cerrar mudanzas automáticamente; migrar DB para deducir errores que hoy no aporta.

## Decisions

1. Introducir un contrato serializable compartido de errores por campo, con códigos seguros y parámetros limitados, ampliando los resultados existentes de forma compatible. Conservar `error` para el error general y `success`. Adaptar Zod y códigos conocidos por operación, no analizar textos traducidos ni enviar objetos Error completos. Una alerta global única es insuficiente; duplicar cada validación a mano en cada pantalla se descarta por divergencia.
2. Definir mapas explícitos de rutas de esquema a controles visibles: `rate_cents` → `rate`, `estimated_quantity` → `quantity`, componentes de `origin`/`destination` → su LocationField. Identificadores/versiones inválidos siguen generales. PHONE_CONFLICT se asocia a teléfono solo cuando la operación identifica inequívocamente ese conflicto; no convertir cualquier 23505 en error de teléfono. INVALID_INPUT opaco permanece general.
3. Añadir primitivas de mensaje/atributos en packages/ui, con id estable por instancia, `aria-invalid`, `aria-describedby` combinado con la ayuda y estilos compartidos. Extender LocationField y fecha/hora para recibir mensajes externos. El campo compuesto de fecha incluye su offset; un final anterior al inicio se explica junto a finalización, referenciando llegada. Controles repetidos no comparten IDs.
4. Validar antes de confirmar/enviar; enfocar el primer control editable inválido del formulario enviado y abrir su paso/sección si está oculto. No robar foco por rerenders, cambio de idioma o validación mientras se escribe. Revalidar al corregir tras el primer intento y sustituir errores de cada nuevo envío; mantener errores generales hasta reintento/resultado conforme al patrón actual. Ignorar respuestas antiguas para valores editados durante una consulta; no reiniciar ubicaciones ni cantidades por cambios visuales.
5. Reutilizar esquemas y reglas vigentes, manteniendo la validación del servidor aunque exista validación de cliente. Uniformar errores required/type/range con mensajes persistentes junto al control; evitar depender exclusivamente de burbujas nativas. Desactivar validación nativa solo en formularios cuya cobertura equivalente esté implementada. Mantener controles de envío duplicado, versionado y diálogos de confirmación.
6. Preservar avisos generales en su lugar actual: conflictos de versión, permisos, sesión, transiciones, dependencias entre formularios y fallos de servicio. Un error local no duplica el mismo mensaje en ResultNotice; un error general independiente puede coexistir. Credenciales incorrectas siguen siendo un mensaje conjunto, sin revelar existencia de cuentas. Tokens, honeypot y errores internos no generan campos visibles ficticios.

## Matriz de formularios y errores

Esta matriz es el inventario inicial de código; implementación debe contrastarla con esquemas, RPC y endpoints y registrar cada caso probado o no aplicable.

| Formulario / fuente | Errores locales a revisar | Avisos generales que se conservan |
| --- | --- | --- |
| Web RequestForm, Ubicación | Origen/destino vacíos, fuera de cobertura, selección inválida y errores de resolución atribuibles al extremo | Indisponibilidad de recepción, rate limit, antispam; Google conserva alternativa manual vigente |
| Web, Detalles | Fecha, tamaño, comentarios y demás controles habilitados según esquema | Errores de operación sin campo identificable |
| Web, Contacto | Nombre, teléfono, correo y aceptación requerida si existe | Recepción/finalización no disponible, envío ya iniciado y reintento idempotente |
| Web, fotografías | Tamaño/tipo/cantidad por archivo o grupo de carga, fallo individual recuperable | Fallo global de sesión/carga/finalización; conservar archivos válidos |
| Admin NewRequestForm | Contacto, origen/destino, fecha o fecha desconocida, tamaño, comentarios; mapear origin_location/destination_location a buscadores | Permisos, concurrencia/idempotencia, indisponibilidad |
| Login | Formato de email, contraseña vacía y límites locales vigentes | INVALID_LOGIN conjunto, INACTIVE, AUTH_UNAVAILABLE |
| Recuperación | Formato de email | Servicio no disponible y respuesta neutral respecto a existencia de cuenta |
| Establecer contraseña | Longitud en password; discrepancia en confirm | LINK_INVALID, sesión o proveedor; error no clasificable no se adjudica por intuición |
| RequestEditor / CustomerEditor | Nombre/teléfono/email; dirección compuesta, unidad, condados, revisión territorial, pisos/elevadores, propiedad, dormitorios, superficie/unidad, trabajadores, fecha y comentarios | CONFLICT, FORBIDDEN, REVIEW_QUOTE_FIRST; requisitos de otro formulario |
| QuoteEditor | Modalidad, equipo, tarifa válida en USD, cantidad y límites según unidad | Conflicto de versión, transición, revisión comercial; fallo de rutas conserva aviso junto a sugerencia y entrada manual |
| QuoteApproval / reapertura | Sin entradas editables propias: no inventar campos | ROUTE_REVIEW_REQUIRED, FORBIDDEN, INVALID_TRANSITION, CONFLICT |
| CommunicationForm | Fecha/offset, medio, respuesta, aceptación si la regla vigente la exige; error cruzado de respuesta junto a respuesta | Cotización no aprobada, ruta pendiente, conflicto/permisos |
| ScheduleForm | Fecha/offset, duración, notas | Ruta/aceptación pendiente, estado y conflicto |
| MeasurementsForm / ConfirmedForm | MOVE_START_* → llegada; MOVE_END_* → finalización; MOVE_MILES_* → millas; offset junto a fecha correspondiente, según start/save/complete/correct y LOCAL/PER_MILE | Conflicto, permisos, estado; confirmación solo tras validación correcta |
| PricingSettings | Cada tarifa y mínimo conforme a límites actuales | Conflicto/permisos/servicio |
| UsersPanel invitación | Email y rol inválidos según esquema | USER_EXISTS ambiguo, FORBIDDEN, límites de envío y MAIL_*; no presentar fallos de Resend como email del destinatario inválido |
| UsersPanel activar/desactivar | Sin campo editable que corregir cuando falla identidad/acción oculta | LAST_ADMIN y FORBIDDEN junto a la acción/fila, sin lanzar error crudo de página |
| RequestActions seguimiento | Motivo demasiado largo junto a motivo | Transición/conflicto/permisos; cancelación/reactivación conserva confirmación |
| NoteForm crear/editar/borrar | Cuerpo y longitud según regla vigente | Eliminación, identidad inválida, permisos y conflictos |
| Filtros solicitudes/clientes/mudanzas y logout | Revisar fechas/rangos y cualquier validación existente; controles sin error posible se documentan N/A | Consulta o sesión fallida; no añadir restricciones nuevas a filtros |

## Risks / Trade-offs

- RPC con INVALID_INPUT genérico → conservar aviso general seguro y mapear solo causas demostrables mediante esquemas/códigos conocidos.
- Errores cruzados y controles ocultos → registro de campos visibles por formulario; nunca enfocar inputs hidden ni casillas deshabilitadas.
- Validaciones distintas en cliente y servidor → reutilizar reglas y probar límites, unidades, offsets y acciones diferenciadas.
- Errores obsoletos tras editar → asociar respuestas al envío y revalidar dependencias; no borrar cambios ni mostrar éxito falso.
- Accesibilidad ruidosa → anuncios acotados al envío, foco único y mensajes asociados, sin alertas repetidas por cada render.

## Migration Plan

Implementar contrato/primitivas compatibles, adaptar por familia y verificar la matriz. Desplegar web/admin juntos si cambia contrato de endpoints. Sin migración de DB prevista. Reversión de frontend/acciones conserva datos y reglas previas.

## Open Questions

Ninguna aclaración funcional pendiente. Los errores de proveedor sin identificación segura de campo permanecerán generales.

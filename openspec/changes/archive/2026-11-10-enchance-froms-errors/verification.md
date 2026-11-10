# Verificación — 2026-11-09

## Alcance revisado

Se contrastaron los formularios de `apps/web/src/components/request-form.tsx` y todos los formularios de `apps/admin/src/components` con sus acciones en `app/(staff)`, `app/auth/actions.ts`, esquemas de `packages/validation`, recepción de `packages/data/src/intake.ts` y funciones/constraints SQL en `supabase/migrations`.

| Familia | Clasificación y comportamiento implementado | Evidencia y límites |
| --- | --- | --- |
| Web, ubicación | Error en origen/destino; mantiene ayuda y mensajes propios de Google | Navegación por ZIP 33147/33016, sin enviar solicitud válida |
| Web, detalles | Fecha, tamaño, propiedad, superficie/unidad, pisos, elevadores, equipo y comentarios junto al control | Tamaño vacío; superficie negativa en sección cerrada abre detalles y enfoca `property_size` |
| Web, contacto | Nombre, correo y teléfono específicos; respuesta del servidor revela paso correspondiente | Tres errores simultáneos, foco en nombre, ES/EN y móvil 390×844 sin desbordamiento |
| Web, fotos | Tipo/tamaño/cantidad junto al selector; acepta archivos válidos de un lote mixto; fallo individual conserva estado por foto | PNG sintético + TXT: PNG permanece pendiente, TXT rechazado, aviso local ES/EN. No se subieron al servidor |
| Login/recuperación | Formato/requeridos locales; credenciales conjuntas, sesión y servicio generales; recuperación conserva respuesta neutral | Correo inválido + contraseña vacía; recuperación inválida sin enviar correo |
| Contraseña | Longitud en password; repetición en confirm; enlace/proveedor generales | Tipos y build; pendiente prueba completa de navegador con sesión de recuperación desechable |
| Alta manual | Campos nativos y esquema, selección de ubicación, fecha desconocida, tamaño/contacto | Envío vacío, corrección parcial sin borrar otros errores, foco y traducción; móvil sin overflow |
| Edición solicitud | Contacto, ubicaciones compuestas, unidades, condados/revisión, propiedad y demás entradas | Condados/revisión vacíos señalados; ZIP y puntos conservados. Los IDs/versiones quedan generales |
| Edición cliente | Contacto y conflicto de teléfono identificado; otros 23505 no se atribuyen al teléfono | Revisión de acción y esquema compartido; pendiente cobertura específica de navegador |
| Cotización | Tarifa en USD, cantidad/unidad, modalidad y equipo; varios errores por respuesta | Tarifa 0 y cantidad -1 señaladas simultáneamente, foco en tarifa; no se guardaron precios |
| Tarifas generales | Tarifas en unidades visibles y mínimo 1–24; conflicto general | Tarifa 0/mínimo 25 producen dos mensajes junto a los campos; no se guardaron tarifas |
| Comunicación | Fecha/offset, medio, respuesta y respuesta requerida con aceptación | Fecha futura rechazada por servidor junto a `at`; valor conservado; edición durante respuesta no recibe error obsoleto. Fecha anterior a creación de cotización: RPC opaco permanece general |
| Programación | Fecha futura y no domingo, offset, duración 1–10080 y notas | Revisión de esquema/RPC y build; pendiente ejercicio específico de navegador |
| Mediciones | Start/end/miles según acción y modalidad; validación previa a confirmar | Final anterior al inicio: mensaje en end, sin diálogo. Corregido: abre diálogo; se canceló sin modificar la mudanza. Tests cubren save/complete, LOCAL/PER_MILE, DST y recarga |
| Personal | Email/rol locales; MAIL_*, conflictos y LAST_ADMIN generales en su formulario/fila | Invitación vacía señala email sin enviar correo; no se activaron/desactivaron personas |
| Seguimiento | Motivo/límite junto a entrada; transiciones y versiones generales | Revisión de RPC y acción; confirmaciones conservadas; no se cancelaron solicitudes |
| Notas | Vacío/blancos y longitud junto a body; borrado no requiere texto | Nota vacía bloqueada y enfocada sin escritura; constraint SQL exige longitud 1–4000 tras trim |
| Filtros | Consulta GET; no hay reglas nuevas de rangos/negocio | Revisados request-list, move-list y customers; se mantiene validación nativa de fechas y tratamiento de consultas |
| Logout y botones sin entradas | N/A para errores de campo | Identidades, permisos, transiciones y errores sin causa editable no crean controles ficticios |

## Comprobaciones transversales

- `FieldErrors` serializable con códigos seguros; allowlists explícitas para excluir identidades/versión; alias para direcciones, tarifa y cantidad. Códigos opacos conservan aviso general.
- `ValidatedForm`: required/type/range/step/length, validación previa al diálogo, IDs por instancia, ayuda conservada, foco al primer error editable, apertura de details, preservación de entradas y descarte de respuestas previas a ediciones posteriores.
- React Hook Form conserva las reglas del formulario público. La recepción mantiene envoltura estricta, honeypot, guard, cuotas e idempotencia; solo amplía rutas de error de la rama V2.
- Validación de teléfono compartida entre servidor y UI; no se añadieron paquetes externos. `@lm/ui` declara su dependencia interna `@lm/validation`; lockfile conserva versiones previas.
- No hay migraciones ni cambios de permisos, precios, estados o contratos de los RPC.

## Resultados automatizados

- 75 tests pasan ejecutando las 13 suites en procesos independientes, incluyendo cinco pruebas nuevas de errores por campo.
- `bun test` en un único proceso presenta una interferencia existente entre el mock de Google Places y la importación previa desde enhance-form: `window is not defined`. La suite Google aislada pasa sus tres tests. No se modificó ese test ajeno al cambio.
- `bun run typecheck`: aprobado para web y admin.
- `bun run build`: aprobados ambos builds.
- Biome de archivos modificados: sin errores; quedan sugerencias de estilo de concatenación existentes.
- Pruebas DB: tras iniciar Docker, `bun run db:test` aprobó **189 tests / 11 archivos**, incluyendo permisos, recepción/idempotencia, operaciones, cotizaciones, precios, invitaciones, ubicaciones y mediciones. Ejecución transaccional local.

## Evidencias locales

- `.local/form-errors-web-mobile.png`: errores de contacto en móvil (captura anterior al ajuste de texto requerido del nombre).
- `.local/form-errors-auth.png`: correo inválido en recuperación.
- `.local/form-errors-files.png`: grupo de archivos con PNG conservado y TXT rechazado.

Las capturas no contienen credenciales. Las pruebas UI no enviaron solicitudes válidas, invitaciones, recuperaciones ni confirmaciones de mudanza; no cambiaron precios o acceso del personal.

## Cobertura pendiente

La matriz de navegador exhaustiva de la tarea 5.3 continúa pendiente: contraseña con sesión de recuperación de prueba, cliente, programación y repetición de cada familia en ambas resoluciones/idiomas, además de fallos reales de proveedor. No se marca como realizada por compartir componentes o por compilar. Los casos ya comprobados quedan detallados arriba.

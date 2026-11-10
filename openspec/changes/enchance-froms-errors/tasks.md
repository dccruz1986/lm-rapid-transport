## 1. Inventario y contratos

- [x] 1.1 Completar la matriz del diseño contra cada formulario, esquema, acción, RPC y endpoint: entradas visibles, rutas ocultas, causas locales/generales y casos N/A.
- [x] 1.2 Definir contrato serializable compatible de errores por campo y catálogo ES/EN; adaptar rutas Zod y códigos conocidos sin filtrar detalles internos.
- [x] 1.3 Definir mapas explícitos para ubicación, tarifa/cantidad, fechas/offsets, confirmaciones y archivos; mantener fallback general para errores opacos.

## 2. Componentes compartidos

- [x] 2.1 Implementar mensaje de campo, IDs por instancia, aria-invalid/aria-describedby y estilos consistentes, conservando ayudas y avisos generales.
- [x] 2.2 Integrar errores externos en LocationField y controles de fecha/hora sin reiniciar ubicaciones, selección o resolución.
- [x] 2.3 Implementar foco del primer error, apertura de paso/sección y ciclo de corrección/reenvío sin errores tardíos ni anuncios repetidos.

## 3. Web y acceso

- [x] 3.1 Completar errores locales del formulario público en sus tres pasos y mapear validación del servidor al paso correcto; conservar antispam, idempotencia y errores generales.
- [x] 3.2 Asociar errores de fotografías al archivo/grupo, preservar archivos válidos y distinguir fallos generales de carga/finalización.
- [x] 3.3 Adaptar login, recuperación y establecimiento de contraseña, separando formato/repetición de credenciales incorrectas, sesión y proveedor.

## 4. Formularios administrativos

- [x] 4.1 Adaptar alta manual, edición de solicitud y cliente; cubrir ubicación compuesta, condados, propiedad y contacto sin perder datos.
- [x] 4.2 Adaptar cotización y configuración de tarifas, diferenciando cantidades/unidades, límites y errores de concurrencia.
- [x] 4.3 Adaptar comunicación y programación: fecha/offset, respuesta, medio, duración y notas; preservar aceptación y requisitos entre etapas.
- [x] 4.4 Adaptar mediciones para start/save/complete/correct y LOCAL/PER_MILE; mostrar errores antes de ConfirmedForm y preservar valores guardados.
- [x] 4.5 Adaptar invitación y acceso del personal, seguimiento y notas; conservar MAIL_*, LAST_ADMIN y errores generales junto a su formulario/acción.
- [x] 4.6 Revisar filtros, logout y acciones sin campos editables; documentar N/A o cubrir validaciones existentes sin inventar restricciones.

## 5. Verificación

- [x] 5.1 Probar adaptadores y servidor: múltiples errores, campos ocultos/desconocidos, errores cruzados, valores límite y clasificación segura de códigos.
- [x] 5.2 Probar UI: corrección parcial, respuestas tardías, nuevo envío, conservación de datos, pasos cerrados, campos condicionales y confirmación posterior a validación.
- [ ] 5.3 Verificar cada familia de la matriz en navegador con teclado, ES/EN y móvil/escritorio; registrar capturas antes/después y casos generales sin cambios de ubicación.
- [x] 5.4 Ejecutar pruebas afectadas, typecheck y builds web/admin; comprobar permisos, versiones, mapas e idempotencia y registrar resultados/limitaciones por formulario.

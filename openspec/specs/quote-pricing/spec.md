# quote-pricing Specification

## Purpose
Definir las modalidades, tarifas, cálculos, aprobación y confirmación de cotizaciones, preservando condiciones comerciales e historial de cambios.

## Requirements

### Requirement: Modalidad territorial de cotización
El sistema SHALL sugerir LOCAL por hora cuando ambos extremos estén en el condado Miami-Dade, incluidas sus distintas ciudades y áreas no incorporadas; SHALL sugerir PER_MILE si al menos uno está fuera del condado y ambos están dentro de Florida. La clasificación SHALL usar resolución territorial verificada en servidor. ZIP aproximado SHALL generar solo sugerencia provisional; casos inciertos SHALL quedar pendientes de revisión. La aprobación interna LOCAL SHALL permitir direcciones pendientes. El personal SHALL confirmar las direcciones completas y resolver la clasificación antes de confirmar/programar o aprobar PER_MILE. El nombre postal Miami no SHALL usarse como prueba de pertenencia. Cambios de esta regla no SHALL alterar condiciones de cotizaciones históricas automáticamente.

#### Scenario: Origen Miami y destino otra ciudad de Florida
- **WHEN** el destino está fuera de Miami-Dade y ambos extremos están en Florida
- **THEN** la cotización usa PER_MILE y no la tarifa local por horas

#### Scenario: Otra ciudad dentro de Miami-Dade
- **WHEN** origen y destino están verificados dentro de Miami-Dade aunque uno esté en Hialeah y otro en Miami Beach
- **THEN** se sugiere LOCAL y al aprobar se usa tarifa por hora del equipo según Configuración

#### Scenario: ZIP insuficiente
- **WHEN** una solicitud solo tiene ZIP ambiguo o datos manuales sin verificar
- **THEN** queda pendiente la clasificación y no se aprueba una cotización con modalidad asignada por defecto

#### Scenario: Cotización histórica
- **WHEN** entra en vigor el alcance de todo Miami-Dade
- **THEN** una cotización existente conserva modo y tarifa; cualquier cambio explícito mantiene las reglas de reconfirmación comercial

### Requirement: Tarifas generales iniciales y alcance
El tarifario SHALL comenzar con 119 USD/h para dos trabajadores, 145 USD/h para tres y 165 USD/h para cuatro, camión incluido; PER_MILE SHALL comenzar en 4 USD/milla para cualquier equipo de 2/3/4. El mínimo local SHALL comenzar en tres horas para todos los equipos. ADMIN/MANAGER SHALL editar el tarifario y mínimo general. Las mismas reglas SHALL aplicarse a residencias, oficinas y comercios conservando su clasificación para cambios futuros.

#### Scenario: Cotización local de equipo de tres
- **WHEN** se crea una cotización local con tres trabajadores sin ajuste individual
- **THEN** se copia la tarifa de 145 USD/h y mínimo de tres horas, sin multiplicar la tarifa por tres trabajadores

### Requirement: Snapshot de condiciones y una cotización por solicitud
Cada solicitud SHALL tener como máximo una cotización vigente almacenada como entidad asociada, editable con versiones de términos. La cotización SHALL conservar equipo, modalidad, tarifa, mínimo local, cantidades estimadas y total estimado. Un cambio del tarifario general no SHALL alterar cotizaciones existentes. La cantidad de trabajadores SHALL resolverse antes de aprobar, incluso si el cliente pidió asesoría.

#### Scenario: Actualización del tarifario
- **WHEN** ADMIN cambia la tarifa general local después de una cotización creada a 119 USD/h
- **THEN** esa cotización conserva 119 USD/h y las nuevas usan la tarifa actualizada

### Requirement: Cálculo local con mínimo y redondeo
La cotización local SHALL calcular `max(minimo_copiado, ceil(segundos / 3600)) × tarifa_por_hora_del_equipo`. La estimación SHALL usar duración estimada; el cierre SHALL usar tiempo real desde llegada al origen hasta finalizar descarga, incluyendo trayecto entre viviendas y pausas, excluyendo viajes desde/hacia base. El importe SHALL calcularse en centavos enteros.

#### Scenario: Duración inferior al mínimo
- **WHEN** el trabajo de dos trabajadores dura dos horas con tarifa 119 USD/h y mínimo copiado de tres
- **THEN** se facturan tres horas y 357 USD

#### Scenario: Fracción de hora
- **WHEN** el trabajo dura tres horas y cuarenta minutos con dos trabajadores a 119 USD/h
- **THEN** se facturan cuatro horas y 476 USD

#### Scenario: Trabajo más largo que el estimado
- **WHEN** se estimaron tres horas pero el trabajo dura cinco con tarifa acordada de 145 USD/h
- **THEN** el total final es 725 USD y la estimación original permanece identificable

### Requirement: Cálculo por millas sin mínimo
PER_MILE SHALL calcular `ceil(millas_reales_de_ida) × tarifa_acordada_por_milla` para el total final y la misma fórmula sobre millas estimadas para la estimación. SHALL excluir regreso a base, no imponer mínimo de millas/importe y no variar automáticamente por cantidad de trabajadores.

#### Scenario: Millas fraccionarias
- **WHEN** se registran 125.4 millas reales de ida a 4 USD/milla
- **THEN** se facturan 126 millas y 504 USD

#### Scenario: Diferente equipo para igual recorrido
- **WHEN** dos cotizaciones por millas tienen igual distancia/tarifa pero equipos de dos y cuatro trabajadores
- **THEN** sus totales son iguales

### Requirement: Precio con impuestos incluidos y sin extras
El total SHALL resultar exclusivamente de horas o millas según modalidad. Camión, trabajadores e impuestos SHALL estar incluidos. No SHALL existir descuento, impuesto adicional, truck fee, travel fee, cargo por objetos especiales ni otros cargos en este MVP, aunque estuvieran en el requerimiento original.

#### Scenario: Intento de cargo adicional
- **WHEN** un payload de cotización intenta añadir peajes, descuento o impuesto separado
- **THEN** no se acepta como una operación válida ni se altera el total mediante ese campo

### Requirement: Aprobación y confirmación manual sin vencimiento
La cotización SHALL usar ESTIMATED, ACCEPTED, CONFIRMED y CANCELLED. Los tres roles SHALL aprobar internamente, registrar comunicación manual por teléfono/WhatsApp/email con fecha, actor, versión comunicada y respuesta del cliente, y confirmar solo tras aceptación explícita de esa versión. No SHALL caducar automáticamente ni enviar correos/SMS/WhatsApp de cotización desde el sistema.

#### Scenario: Aprobación aún no comunicada
- **WHEN** DISPATCHER aprueba internamente una cotización pero aún no registra contacto con el cliente
- **THEN** queda ACCEPTED sin considerarse enviada ni contar como pendiente de respuesta

#### Scenario: Cliente confirma lo comunicado
- **WHEN** el personal registra aceptación del cliente de la versión vigente aprobada y comunicada
- **THEN** la cotización queda CONFIRMED y habilita confirmar la solicitud

#### Scenario: Paso del tiempo
- **WHEN** pasan más de quince días sin modificación ni cancelación
- **THEN** la cotización permanece en su estado y no vence por fecha

### Requirement: Aviso de estimación y cambios de términos
Las pantallas de cotización SHALL indicar en español e inglés que el precio presentado es aproximado y sujeto a cambios según horas o millas reales. La confirmación SHALL referirse a la tarifa y condiciones, no a un total fijo. Cambiar tarifa acordada, mínimo contractual o modalidad SHALL invalidar la aceptación anterior y requerir aprobación/comunicación/confirmación de los nuevos términos. Registrar cantidades reales dentro de lo acordado no SHALL exigir otra aceptación de tarifa.

#### Scenario: Cambio de tarifa ya confirmada
- **WHEN** el personal autorizado ajusta una tarifa individual que el cliente ya confirmó
- **THEN** la confirmación anterior no valida la nueva tarifa y se requiere una nueva aceptación registrada

#### Scenario: Cambio solo de cantidad real
- **WHEN** se registran cinco horas reales en lugar de tres estimadas manteniendo tarifa y mínimo acordados
- **THEN** se recalcula el total con cinco horas sin considerar que cambió la tarifa confirmada

### Requirement: Historial limitado de cantidades y tarifas
Cambios a tiempos/horas, millas y tarifas SHALL guardar valor anterior, nuevo, actor y fecha en un historial de solo lectura visible para los tres roles. No SHALL exigirse motivo ni añadirse un historial general de estados, programación, notas, direcciones o contactos. Los cambios de instantes reales SHALL permitir reconstruir la duración antes/después.

#### Scenario: Corrección de millas
- **WHEN** un usuario autorizado corrige las millas de 125.4 a 126.2
- **THEN** se guarda el cambio con autor/fecha, se recalculan 127 millas facturables y el historial puede consultarse sin que se haya exigido motivo

### Requirement: Correcciones después de completar
Solo ADMIN/MANAGER SHALL corregir horas, millas o tarifa en mudanzas COMPLETED. Las correcciones SHALL conservar historial y recalcular el importe; cambios de tarifa SHALL requerir nueva confirmación comercial aunque el trabajo permanezca completado. El importe previamente confirmado SHALL mantenerse distinguible hasta aceptar los nuevos términos.

#### Scenario: Tarifa corregida tras finalizar
- **WHEN** ADMIN cambia la tarifa después de completar una mudanza
- **THEN** se conserva el cierre anterior, se presenta el importe revisado pendiente de confirmación y no se marca la nueva tarifa como aceptada automáticamente

### Requirement: Cálculo autoritativo y concurrencia
El servidor/DB SHALL validar cantidades/tarifas, rechazar negativos, valores no finitos o fuera de límites, recalcular subtotal/total y comprobar versión de la cotización. El frontend SHALL ofrecer vista previa con resultados equivalentes, sin autoridad sobre los importes guardados.

#### Scenario: Total adulterado u operación obsoleta
- **WHEN** el navegador envía un total manipulado o una edición basada en una versión anterior
- **THEN** el servidor ignora/rechaza el total no autoritativo y rechaza el conflicto de versión sin perder los cambios concurrentes

### Requirement: Tarifa configurada al seleccionar equipo o modalidad
El editor SHALL actualizar inmediatamente el campo de tarifa y su vista previa cuando el personal cambie «Trabajadores + camión» o modalidad, en cotizaciones nuevas y existentes. SHALL usar la configuración cargada: tarifa horaria del equipo de 2/3/4 en LOCAL y tarifa común por milla en PER_MILE, convirtiendo centavos a USD con dos decimales. La selección SHALL sustituir un ajuste manual previo y SHALL permitir editar la tarifa nuevamente. Al abrir una cotización existente, el editor SHALL conservar su tarifa guardada hasta una selección explícita o edición manual. La selección no SHALL persistir cambios hasta guardar ni alterar el mínimo copiado; al guardar SHALL mantener las validaciones, concurrencia y reconfirmación comercial existentes.

#### Scenario: Cambio de equipo en cotización existente
- **WHEN** el personal cambia una cotización LOCAL de dos a tres trabajadores y la configuración cargada define 152.50 USD/h para tres
- **THEN** el campo muestra 152.50 y la vista previa usa ese importe con la cantidad y mínimo vigentes, sin guardar todavía

#### Scenario: Todos los equipos en una cotización nueva
- **WHEN** el personal selecciona sucesivamente dos, cuatro y tres trabajadores en una cotización LOCAL nueva
- **THEN** cada selección carga respectivamente hourly_two, hourly_four y hourly_three desde Configuración, sin precios fijos en el componente

#### Scenario: Cotización por millas
- **WHEN** cambia el equipo en PER_MILE y la configuración cargada define 4.75 USD/milla
- **THEN** la tarifa muestra 4.75 con cualquier equipo y la vista previa usa las millas estimadas

#### Scenario: Cambio de modalidad
- **WHEN** cambia de LOCAL a PER_MILE o de PER_MILE a LOCAL
- **THEN** la tarifa usa respectivamente per_mile o la tarifa horaria configurada del equipo seleccionado, y se actualiza la vista previa

#### Scenario: Preservación del snapshot al abrir
- **WHEN** se abre una cotización guardada a 119 USD/h y la configuración actual indica 130 USD/h para su equipo
- **THEN** permanece 119 USD/h mientras no cambie explícitamente equipo, modalidad o tarifa

#### Scenario: Ajuste manual y nueva selección
- **WHEN** el personal introduce una tarifa manual y después cambia el equipo
- **THEN** se carga la tarifa configurada de esa selección y puede introducir otro ajuste manual antes de guardar

#### Scenario: Guardado de nuevos términos
- **WHEN** el personal guarda una selección que cambia la tarifa de una cotización confirmada
- **THEN** se guarda la tarifa mostrada conforme a validaciones y versión vigentes y se requiere la reconfirmación comercial existente

### Requirement: Preselección administrativa por territorio
En una cotización nueva sin elección manual, el editor SHALL preseleccionar PER_MILE cuando al menos un extremo esté identificado fuera de Miami-Dade y ambos estén dentro de Florida, y LOCAL cuando ambos estén en Miami-Dade. SHALL actualizar la tarifa configurada correspondiente. La evidencia postal SHALL presentarse como provisional; un extremo fuera con el otro sin resolver SHALL indicar posible modalidad por millas sin dar por validada la cobertura. No SHALL marcar verificación territorial ni aprobación automáticamente, ni sustituir condiciones guardadas o una elección manual.

#### Scenario: Un extremo fuera
- **WHEN** el origen está en Miami-Dade y el destino está identificado en otro condado de Florida
- **THEN** la nueva cotización sin edición manual muestra Por millas con la tarifa configurada por milla

#### Scenario: Ambos dentro del condado
- **WHEN** ambos extremos están en Miami-Dade aunque sus ciudades sean distintas
- **THEN** se preselecciona Local por hora sin sugerencia de millas

#### Scenario: Territorio ambiguo o incompleto
- **WHEN** un ZIP es ambiguo o el segundo extremo sigue sin resolver
- **THEN** se informa que la clasificación requiere revisión y no se habilita aprobación por una sugerencia provisional

#### Scenario: Modalidad guardada contradictoria
- **WHEN** el recorrido nuevo sugiere una modalidad distinta de la cotización existente
- **THEN** se informa la discrepancia y se conserva la modalidad guardada hasta un cambio explícito con las reglas de revisión comercial vigentes

### Requirement: Millas sugeridas en la cotización
El campo Millas estimadas SHALL precargarse con la distancia válida sugerida en una cotización nueva por millas cuando esté vacío y sin modificación manual. SHALL identificar la sugerencia y permitir editarla o aplicarla explícitamente cuando exista un valor manual o guardado. Al cambiar recorrido SHALL invalidar cantidades autogeneradas obsoletas, conservando cantidades manuales o guardadas con aviso. No SHALL reutilizar horas como millas ni rellenar millas reales al completar la mudanza. Persistir SHALL requerir guardar la cotización con validación y versión vigentes.

#### Scenario: Sugerencia disponible
- **WHEN** Google devuelve una distancia válida para la nueva cotización por millas y la cantidad no fue editada
- **THEN** se muestran millas estimadas con un decimal, aviso de aproximación y vista previa del total usando la tarifa configurada

#### Scenario: Cantidad manual durante la consulta
- **WHEN** el operador introduce 205 millas antes de recibir una sugerencia distinta
- **THEN** se mantienen las 205 millas y se ofrece aplicar la nueva sugerencia explícitamente

#### Scenario: Cambio de recorrido con cantidad autogenerada
- **WHEN** cambia un extremo tras precargarse una distancia sugerida
- **THEN** la cantidad autogenerada anterior deja de aplicarse mientras se calcula la nueva ruta

#### Scenario: Cambio de horas a millas
- **WHEN** una cotización nueva pasa de modalidad local a por millas
- **THEN** no se conserva el número de horas como distancia; se usa una sugerencia válida o se solicita introducir millas

#### Scenario: Estimación y medición real independientes
- **WHEN** se guarda una cotización con distancia sugerida
- **THEN** se persisten sus millas estimadas sin completar actual_miles, sin cerrar la mudanza y sin confirmar términos automáticamente

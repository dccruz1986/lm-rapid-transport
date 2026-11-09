## ADDED Requirements

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

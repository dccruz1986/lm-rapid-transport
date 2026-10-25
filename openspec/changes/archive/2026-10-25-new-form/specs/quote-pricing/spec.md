## MODIFIED Requirements

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


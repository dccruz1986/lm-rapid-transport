## ADDED Requirements

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

## ADDED Requirements

### Requirement: Dashboard operativo básico
El panel SHALL mostrar nuevas solicitudes, cotizaciones pendientes, mudanzas confirmadas, mudanzas de esta semana y mudanzas completadas sin analítica avanzada. SHALL usar datos reales autorizados y distinguir un error de consulta de un conteo cero.

#### Scenario: Proyecto sin registros
- **WHEN** un usuario autorizado abre el dashboard y las consultas tienen éxito sin registros
- **THEN** ve ceros y estados vacíos útiles

#### Scenario: Falla la consulta
- **WHEN** no se pueden recuperar las estadísticas
- **THEN** se muestra error y opción de reintentar, no estadísticas ficticias

### Requirement: Cotizaciones pendientes de respuesta
La métrica de cotizaciones pendientes SHALL contar únicamente cotizaciones ACCEPTED comunicadas al cliente en su versión vigente y aún sin confirmación. SHALL excluir borradores, aprobadas no comunicadas, canceladas y confirmadas.

#### Scenario: Comunicación de una versión anterior
- **WHEN** se cambia una tarifa después de comunicar la cotización y todavía no se comunica la nueva versión
- **THEN** la comunicación antigua no convierte los nuevos términos en una cotización pendiente de respuesta del cliente

### Requirement: Definiciones consistentes de métricas
Nuevas solicitudes SHALL contar NEW. Mudanzas confirmadas SHALL contar solicitudes CONFIRMED, incluidas las aún sin programación, con ayuda explicativa. Mudanzas completadas SHALL contar Moves COMPLETED. Esta semana SHALL usar fechas locales de la semana lunes-domingo de Miami, excluyendo CANCELLED/PENDING_REVIEW y sin duplicar por joins de notas o fotografías.

#### Scenario: Límite de semana y zona horaria
- **WHEN** un instante UTC cae en un día distinto según Miami
- **THEN** la inclusión semanal se decide por la fecha local de Miami

### Requirement: Navegación y consultas operativas
El panel SHALL tener navegación lateral responsive hacia Dashboard, Requests, Customers y Moves, con cotización accesible desde cada solicitud y ajustes/usuarios según permisos. Tablas SHALL ofrecer búsqueda/filtros básicos, paginación y estados de carga, vacío y error. Los tres roles SHALL ver todos los registros.

#### Scenario: Uso móvil de Requests
- **WHEN** un DISPATCHER abre Requests en móvil y busca por teléfono o número
- **THEN** puede filtrar, abrir el detalle y operar sin depender de hover ni de una pantalla ancha

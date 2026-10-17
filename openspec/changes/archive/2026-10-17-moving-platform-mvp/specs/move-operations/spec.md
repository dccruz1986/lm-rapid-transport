## ADDED Requirements

### Requirement: Conversión única desde solicitud confirmada
Una solicitud CONFIRMED SHALL poder convertirse en una única Move con cliente, origen, destino, fecha/hora programadas, estado, notas y duración estimada. SHALL verificar confirmación comercial vigente y reusar la asociación en reintentos/reactivaciones. La fecha deseada original no SHALL confundirse con una fecha programada.

#### Scenario: Conversión repetida
- **WHEN** dos operaciones intentan programar la misma solicitud confirmada
- **THEN** existe una sola Move vinculada, sin duplicación ni estados contradictorios

#### Scenario: Solicitud aún sin fecha
- **WHEN** una solicitud confirmada comercialmente aún no tiene fecha y hora acordadas
- **THEN** puede permanecer confirmada pero no se crea una Move SCHEDULED hasta introducir ambos datos

### Requirement: Programación manual sin capacidad automática
ADMIN/MANAGER/DISPATCHER SHALL programar y reprogramar de lunes a sábado a cualquier hora acordada, con zona America/New_York, fecha y hora obligatorias y validación contra citas pasadas. SHALL permitir varias mudanzas simultáneas. SHALL registrar equipo de 2/3/4, sin asignar empleados o camiones específicos. Reprogramación no SHALL exigir otra confirmación del cliente ni alterar tarifas por sí misma.

#### Scenario: Dos trabajos coincidentes
- **WHEN** se programa una segunda mudanza el mismo día y hora que otra
- **THEN** se permite guardarla sin bloqueo de disponibilidad

#### Scenario: Reprogramación sin reconfirmación
- **WHEN** DISPATCHER cambia una fecha/hora futura de lunes a sábado
- **THEN** la programación se actualiza sin exigir una nueva confirmación comercial

#### Scenario: Programación dominical
- **WHEN** se intenta programar una mudanza para domingo
- **THEN** se rechaza la programación aunque se envíe por llamada directa

### Requirement: Estados operativos sincronizados
Move SHALL usar SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED y PENDING_REVIEW. Iniciar, completar o cancelar SHALL mantener coherencia con la solicitud mediante una operación transaccional; estados no SHALL editarse libremente para evitar condiciones obligatorias. COMPLETED SHALL corresponder a trabajo terminado con mediciones y total calculados.

#### Scenario: Inicio y finalización
- **WHEN** el personal inicia una Move programada y después la completa con mediciones válidas
- **THEN** solicitud y Move pasan conjuntamente a IN_PROGRESS y luego COMPLETED con el total calculado

#### Scenario: Fallo durante cambio de estado
- **WHEN** falla una validación o escritura relacionada
- **THEN** no queda una solicitud completada con Move aún en progreso ni otro estado parcial

### Requirement: Registro de tiempo real local
Los tres roles SHALL registrar fecha/hora de llegada al origen y finalización de descarga. El sistema SHALL calcular duración real con instantes completos, sin descontar pausas ni trayecto origen-destino, y excluir traslado desde/hacia base. La finalización SHALL ser posterior al inicio. SHALL preservar el registro previo al corregir según el historial de precios y permisos poscierre.

#### Scenario: Trabajo que cruza medianoche
- **WHEN** el inicio es 23:00 y la finalización 02:30 del día siguiente en la zona indicada
- **THEN** se calculan tres horas y media reales y cuatro facturables con mínimo de tres, sin duración negativa

#### Scenario: Instantes invertidos
- **WHEN** se registra una finalización anterior o igual al inicio
- **THEN** se rechaza la medición y no se completa la mudanza

### Requirement: Registro de millas reales de ida
Los tres roles SHALL registrar y corregir millas reales antes del cierre de una mudanza PER_MILE. Solo SHALL computarse ida entre origen y destino. El cierre SHALL aplicar el redondeo y tarifa confirmada, sin contar retorno, mínimo o un cargo por trabajadores.

#### Scenario: Distancia superior a la estimada
- **WHEN** se estimaron 100 millas y se registran 110.2 reales a 4 USD/milla
- **THEN** el total final es 444 USD y la estimación original de 400 USD permanece identificable

### Requirement: Cancelación y revisión al reactivar
Los tres roles SHALL cancelar con motivo opcional y reactivar en PENDING_REVIEW. SHALL conservarse la misma Move y su asociación. No SHALL quedar programada automáticamente al reactivarse; el personal revisará cliente, dirección, términos y fecha/hora antes de programar otra vez.

#### Scenario: Reactivación con fecha pasada
- **WHEN** se reactiva una mudanza cancelada cuya fecha original ya pasó
- **THEN** queda pendiente de revisión y exige una fecha/hora válida antes de volver a SCHEDULED

### Requirement: Cierre y correcciones restringidas
Completar SHALL ser posible para los tres roles con mediciones válidas. Desde ese momento, solo ADMIN/MANAGER SHALL corregir horas, millas o tarifas. Las correcciones no SHALL reabrir automáticamente el trabajo ni borrar el historial.

#### Scenario: Permisos antes y después de completar
- **WHEN** DISPATCHER registra mediciones, completa y luego intenta corregirlas
- **THEN** las primeras operaciones están permitidas y la corrección posterior se deniega

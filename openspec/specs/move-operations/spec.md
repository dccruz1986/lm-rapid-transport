# move-operations Specification

## Purpose
Definir la conversión de solicitudes confirmadas en mudanzas, su programación, ejecución, mediciones reales y correcciones con permisos e integridad de estados.

## Requirements

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

### Requirement: Guardado y recuperación íntegra de mediciones
Guardar mediciones SHALL persistir llegada, finalización cuando esté introducida y millas aplicables con sus instantes correctos. Tras éxito, revalidación o reapertura, el formulario SHALL mostrar los últimos valores persistidos, incluida su zona de Miami. Un fallo SHALL conservar el borrador sin mostrar éxito; una versión obsoleta SHALL producir conflicto sin escrituras parciales. Un rerender de la misma versión no SHALL vaciar ni sustituir valores introducidos.

#### Scenario: Guardar y completar con mediciones completas
- **WHEN** el operador introduce llegada, finalización y millas si corresponde, guarda y después completa sin editar
- **THEN** el formulario conserva los valores guardados y el cierre los utiliza para calcular el total y completar Move y solicitud

#### Scenario: Reabrir una medición guardada
- **WHEN** se recarga o reabre una mudanza con mediciones persistidas
- **THEN** aparecen sus últimos horarios y millas, con offsets correspondientes a los instantes guardados, sin exigir introducirlos de nuevo

#### Scenario: Error o conflicto al guardar
- **WHEN** falla el guardado o la versión enviada está desactualizada
- **THEN** se informa el error, se conservan los valores introducidos y no se presenta el borrador como persistido

### Requirement: Avance parcial claramente identificado
Guardar mediciones SHALL permitir un avance sin finalización o sin millas pendientes, conservando IN_PROGRESS y sin calcular total definitivo. El resultado SHALL distinguir avance guardado de cierre e indicar los datos obligatorios que faltan para completar en ES/EN. No SHALL inventar una fecha para rellenar un valor ausente.

#### Scenario: Solo llegada y millas
- **WHEN** se guardan llegada y 205 millas sin finalización en una mudanza por millas
- **THEN** ambos valores quedan guardados, la mudanza sigue en curso y se indica que falta la fecha y hora de descarga finalizada

### Requirement: Cierre validado con los valores visibles
Completar SHALL guardar y usar las mediciones visibles actuales sin requerir un guardado previo. SHALL exigir llegada y finalización válida para LOCAL y PER_MILE, y millas positivas para PER_MILE. SHALL mostrar un error específico del campo antes de confirmar un cierre incompleto, validar nuevamente en servidor y conservar las restricciones temporales, comerciales y de permisos existentes. Un campo borrado explícitamente no SHALL reemplazarse silenciosamente con un dato anterior.

#### Scenario: Finalización vacía al completar
- **WHEN** se intenta completar con la finalización vacía, incluso si existía una finalización anterior
- **THEN** se indica que falta la fecha y hora de descarga finalizada y no se cambia estado ni total

#### Scenario: Completar directamente
- **WHEN** se introducen mediciones válidas y se pulsa completar sin guardar antes
- **THEN** las mediciones y el cierre se guardan atómicamente con el total calculado

#### Scenario: Modalidad local y por millas
- **WHEN** se intenta completar una mudanza local sin millas o una por millas sin distancia
- **THEN** la local puede cerrarse con horarios válidos y la de millas solicita la distancia sin modificar registros

#### Scenario: Horario inválido por llamada directa
- **WHEN** se envía al servidor una finalización anterior o igual a la llegada, futura o incompatible con su offset
- **THEN** se rechaza la operación y se conserva la última medición persistida

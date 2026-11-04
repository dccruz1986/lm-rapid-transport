## ADDED Requirements

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

## ADDED Requirements

### Requirement: Errores específicos junto al control editable
Todos los formularios de web y admin SHALL mostrar cada error identificable de entrada junto al control que permite corregirlo, con mensaje específico ES/EN y asociación accesible. SHALL abarcar controles de texto, número, fecha/offset, selectores, casillas, ubicaciones y archivos. Un mismo error local no SHALL repetirse como aviso general al pie. Los límites y reglas SHALL conservar los definidos por el sistema.

#### Scenario: Tarifa y cantidad inválidas
- **WHEN** se envía una cotización con tarifa y cantidad inválidas
- **THEN** cada control muestra su causa y límite correspondiente sin un único INVALID_INPUT que obligue a adivinar el campo

#### Scenario: Dirección compuesta
- **WHEN** falla un componente obligatorio de la dirección que está representada por LocationField
- **THEN** el mensaje se asocia al buscador de ese extremo y no a un input oculto ni al otro extremo

#### Scenario: Finalización inválida
- **WHEN** la descarga finalizada es anterior a la llegada
- **THEN** el error aparece junto a finalización, explica su relación con llegada y permite revisar su offset

#### Scenario: Archivo inválido
- **WHEN** una fotografía incumple los límites o formatos admitidos
- **THEN** el error identifica el archivo o grupo de carga correspondiente y conserva las selecciones válidas

### Requirement: Separación segura de errores generales y de campo
Los formularios SHALL conservar los avisos generales en su ubicación y estilo actuales cuando no exista una entrada corregible inequívoca. Permisos, conflictos, sesión, transiciones y fallos de proveedor SHALL conservar tratamiento general. La clasificación SHALL usar rutas/códigos conocidos por operación, sin mostrar errores internos, secretos ni atribuir errores opacos a campos arbitrarios. Campos de identidad, versión y antispam ocultos no SHALL convertirse en controles de corrección visibles.

#### Scenario: Conflicto de versión
- **WHEN** el servidor rechaza un guardado por CONFLICT
- **THEN** permanece el aviso general de concurrencia y ningún campo se marca incorrecto por ese motivo

#### Scenario: Credenciales y correo de invitación
- **WHEN** falla el acceso por credenciales incorrectas o el proveedor de invitaciones rechaza su configuración
- **THEN** permanece el aviso general pertinente, sin revelar existencia de cuentas ni culpar al formato del correo cuando no es la causa

#### Scenario: Error sin campo identificable
- **WHEN** un RPC devuelve INVALID_INPUT sin detalle atribuible con seguridad
- **THEN** se conserva una explicación general traducida sin exponer mensajes SQL o Zod completos

#### Scenario: Error de teléfono identificado
- **WHEN** editar un contacto devuelve un conflicto inequívoco de su teléfono
- **THEN** el mensaje aparece junto al teléfono y conserva el resto de valores

### Requirement: Corrección accesible y estable de formularios
Tras un intento inválido, la UI SHALL revelar y enfocar el primer control editable con error del formulario enviado, abrir su paso/sección cuando corresponda y asociar mensajes con IDs únicos y aria-describedby/aria-invalid sin eliminar la ayuda existente. SHALL conservar valores, selecciones, archivos válidos y errores independientes. SHALL actualizar los errores al corregir o reenviar, ignorar resultados obsoletos y evitar mover foco por cambio de idioma o rerender. La validación de servidor, los diálogos de confirmación y los controles de duplicados SHALL mantenerse.

#### Scenario: Error en paso anterior
- **WHEN** una respuesta de servidor identifica un campo inválido de un paso no visible
- **THEN** se revela ese paso y se enfoca el control sin borrar los demás datos

#### Scenario: Corrección parcial
- **WHEN** el usuario corrige un teléfono pero deja un correo inválido
- **THEN** el error del teléfono se actualiza según su validación y el del correo permanece hasta corregirse

#### Scenario: Respuesta antigua
- **WHEN** llega una respuesta de validación de valores anteriores a una edición posterior
- **THEN** no reemplaza los valores actuales ni los presenta como si fueran los que fallaron

#### Scenario: Confirmar finalización
- **WHEN** se intenta completar la mudanza con datos inválidos
- **THEN** los errores se muestran junto a los controles antes del diálogo de confirmación y no se envía la operación

### Requirement: Cobertura verificable de formularios y causas
La implementación SHALL mantener una matriz de todos los formularios y acciones de web/admin, incluyendo autenticación, personal, filtros, solicitudes, clientes, cotizaciones, comunicación, programación, mediciones, tarifas, notas y fotografías. Cada causa posible identificada en esquemas, validadores y códigos conocidos SHALL clasificarse como local, general o no aplicable con evidencia de verificación. SHALL comprobar múltiples errores, controles compuestos, estados condicionales, teclado y ES/EN en móvil y escritorio, preservando permisos y reglas vigentes.

#### Scenario: Revisión previa al cierre
- **WHEN** se completa la implementación
- **THEN** la matriz registra cobertura y pruebas de todas las familias, las limitaciones pendientes quedan explícitas y no se marca como verificado un caso no probado

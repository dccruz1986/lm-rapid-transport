# frontend-experience Specification

## Purpose
Definir una experiencia visual coherente, accesible y estable para la web pública y el panel administrativo, con formularios claros, un flujo operativo comprensible y resultados legibles.

## Requirements

### Requirement: Identidad visual compartida
Ambas aplicaciones SHALL usar el logo existente, naranja #d75523 y base blanca con tokens compartidos para controles, texto, espaciado y estados. La composición SHALL diferenciar contenido comercial y trabajo administrativo sin alterar la identidad ni inventar credenciales o testimonios.

#### Scenario: Navegación entre aplicaciones
- **WHEN** se comparan la portada pública y el dashboard
- **THEN** logo, botones y campos mantienen identidad coherente mientras cada pantalla establece su propia jerarquía de contenido

### Requirement: Solicitud pública clara
La web SHALL presentar servicios, alcance y acceso visible a solicitar cotización. El formulario SHALL conservar los tres pasos Ubicación, Detalles y Contacto, el componente compartido de localización, valores al retroceder y confirmación sin precio automático.

#### Scenario: Revisión de una solicitud en móvil
- **WHEN** el cliente vuelve al paso de ubicación y cambia de idioma
- **THEN** conserva valores y selecciones, comprende el paso actual y puede continuar sin repetir datos

### Requirement: Jerarquía del trabajo administrativo
El admin SHALL ordenar información, cotización, comunicación, aceptación y programación conforme al flujo existente, identificar estado actual y siguiente acción permitida, y explicar dependencias de acciones no disponibles. Reabrir términos SHALL tener etiqueta y contexto que expliquen sus consecuencias reales. Las acciones destructivas SHALL distinguirse de las principales.

#### Scenario: Cotización pendiente de comunicación
- **WHEN** el personal abre una solicitud con cotización aprobada pero aún no comunicada
- **THEN** identifica la comunicación como siguiente paso y entiende por qué aceptación o programación no están disponibles conforme a las reglas actuales

### Requirement: Resultados y consultas legibles
Dashboard, listas y detalles SHALL distinguir estados, datos vacíos y errores sin valores ficticios. Listas SHALL conservar filtros y paginación. Una mudanza finalizada SHALL destacar llegada, finalización, horas trabajadas e importe USD, diferenciando duración real y cantidad facturada si difieren.

#### Scenario: Consulta de mudanza finalizada
- **WHEN** se consulta una mudanza completada en móvil
- **THEN** los horarios, duración e importe se leen con sus etiquetas sin abrir formularios ni confundir horas trabajadas con mínimo facturable

### Requirement: Interacción accesible y estable
La UI SHALL funcionar a 360, 768 y 1440 px sin desbordamiento de página, permitir teclado y foco visible, respetar movimiento reducido y presentar etiquetas y errores asociados. Texto normal SHALL alcanzar contraste 4.5:1 y controles/foco 3:1. Cambios visuales SHALL preservar permisos, validaciones, datos, integración de mapas y lógica existente; cambios de idioma o renderizado no SHALL borrar direcciones ni reiniciar su selección.

#### Scenario: Corrección por teclado
- **WHEN** se envía un formulario incompleto mediante teclado
- **THEN** el error resulta localizable, los valores válidos permanecen y se puede corregir y continuar sin usar ratón

#### Scenario: Recorrido durante un rerender
- **WHEN** una actualización visual vuelve a renderizar el detalle con direcciones seleccionadas
- **THEN** las selecciones y puntos del mapa permanecen estables sin solicitar elegir otra vez las direcciones

### Requirement: Verificación visual del cambio
La implementación SHALL registrar capturas antes/después de web y admin en móvil y escritorio, revisar ES/EN y estados representativos, y corregir defectos de legibilidad, alineación, foco o controles ocultos antes de cerrar las tareas.

#### Scenario: Revisión previa al cierre
- **WHEN** se prepara la aceptación de la mejora de UI
- **THEN** existe evidencia visual de portada, formulario, lista, detalle operativo y resultado de mudanza junto con las comprobaciones funcionales realizadas y limitaciones pendientes

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

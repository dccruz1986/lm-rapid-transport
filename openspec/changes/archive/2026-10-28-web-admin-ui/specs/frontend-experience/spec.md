## ADDED Requirements

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

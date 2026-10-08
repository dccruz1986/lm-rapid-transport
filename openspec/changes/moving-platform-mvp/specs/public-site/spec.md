## ADDED Requirements

### Requirement: Sitio comercial de LM Rapid Transport
El sitio SHALL ofrecer Home, Services, About, Contact y Request a Quote para LM Rapid Transport, mostrando mudanzas residenciales, de oficinas y locales comerciales dentro de Florida. No SHALL anunciar embalaje/desembalaje, objetos especiales ni servicios aplazados.

#### Scenario: Cliente conoce los servicios
- **WHEN** un visitante abre Services
- **THEN** encuentra los tres tipos de mudanza, el alcance Florida y un enlace al formulario sin necesidad de cuenta

### Requirement: Español e inglés completos
Las aplicaciones pública y administrativa SHALL iniciar en español y permitir cambiar a inglés conservando la preferencia. Navegación, formularios, estados, avisos y errores propios SHALL estar traducidos; cantidades monetarias SHALL indicar USD.

#### Scenario: Cambio de idioma en un formulario
- **WHEN** el usuario cambia de español a inglés mientras completa una solicitud
- **THEN** se traducen etiquetas y mensajes sin perder los valores ya introducidos

### Requirement: Experiencia responsive y accesible
La interfaz SHALL funcionar en móvil y desktop con navegación por teclado, labels asociados, foco visible, contraste legible y estados loading/empty/error/success. Los formularios SHALL mostrar errores por campo y evitar envíos duplicados mientras una operación esté en curso.

#### Scenario: Corrección accesible de errores
- **WHEN** un usuario de teclado envía un paso con errores
- **THEN** puede localizar los campos inválidos, leer sus mensajes y corregirlos sin perder los demás datos

### Requirement: Identidad y contacto pendientes de producción
Logo, colores finales, teléfono, email y dominio SHALL ser configurables. Datos de desarrollo ficticios SHALL estar identificados como ejemplos; ninguna publicación de producción SHALL presentarlos como contactos reales ni inventar testimonios o credenciales de la empresa.

#### Scenario: Preparación del lanzamiento
- **WHEN** se revisa el sitio para producción
- **THEN** se comprueba que los contactos y URLs configurados sean los reales y que los contenidos pendientes estén resueltos

### Requirement: Solicitud sin precio público
El sitio SHALL recibir solicitudes sin mostrar una tarifa o total automático al enviarlas. El precio SHALL comunicarse manualmente después de la revisión del personal.

#### Scenario: Solicitud enviada
- **WHEN** se registra correctamente el formulario
- **THEN** el cliente ve confirmación, número de solicitud y un mensaje de revisión posterior, sin una cotización automática

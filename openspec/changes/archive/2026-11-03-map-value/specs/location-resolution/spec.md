## ADDED Requirements

### Requirement: Identidad de ubicación persistida en admin
El alta y la edición administrativa SHALL conservar el identificador de Google y la precisión disponibles junto con el texto y componentes de cada ubicación seleccionada, mediante guardado autorizado y atómico. Editar el texto o los componentes de un extremo SHALL invalidar su identidad anterior; editar otros campos SHALL conservarla. Los registros históricos sin identificador SHALL continuar siendo utilizables. El guardado no SHALL confiar en esos metadatos como evidencia territorial ni persistir respuestas completas del proveedor.

#### Scenario: Seleccionar guardar y volver
- **WHEN** el personal selecciona origen y destino, guarda y vuelve a abrir la solicitud
- **THEN** se recuperan sus identidades guardadas y se resuelven sus puntos sin volver a escribir ni seleccionar direcciones

#### Scenario: Cambio ajeno a la ubicación
- **WHEN** se guarda un cambio de contacto manteniendo las direcciones
- **THEN** se conservan los identificadores asociados a ambos extremos

#### Scenario: Texto cambiado
- **WHEN** se modifica el destino sin seleccionar todavía otro lugar
- **THEN** su identificador y punto previos dejan de representar ese texto y el origen se conserva

### Requirement: Recuperación automática del recorrido guardado
El mapa administrativo SHALL recuperar cada punto desde su place_id cuando sea válido, resolver direcciones históricas completas cuando exista una coincidencia inequívoca y compatible en Florida y resolver ZIP aislados como puntos aproximados. SHALL distinguir texto presente de ubicación resuelta, sin seleccionar arbitrariamente resultados ambiguos. SHALL mostrar ambos puntos en un solo mapa, centrar uno cuando solo exista uno y mostrar Miami cuando no haya ninguno.

#### Scenario: Dirección histórica sin identificador
- **WHEN** una solicitud contiene una dirección completa guardada sin place_id y Google devuelve una coincidencia única compatible
- **THEN** se muestra el punto correspondiente automáticamente sin pedir reselección ni modificar la dirección guardada

#### Scenario: Solo ZIP
- **WHEN** el extremo contiene únicamente un ZIP resoluble de Florida
- **THEN** se muestra un punto identificado como aproximado sin inventar calle ni dirección exacta

#### Scenario: Resolución incierta o proveedor no disponible
- **WHEN** la dirección es ambigua, el lugar no puede recuperarse, está fuera de Florida o falla Google
- **THEN** se conserva el texto, se informa el estado del extremo y se ofrece corrección o reintento sin mostrar un punto ficticio ni perder el otro extremo

### Requirement: Hidratación estable y separada de cambios comerciales
La recuperación SHALL compartir estado entre mapa y edición, deduplicar consultas para la misma ubicación durante la sesión y evitar búsquedas por rerenders, cambios de idioma o edición de campos no relacionados. SHALL ignorar respuestas anteriores a una edición o cambio de solicitud. Cargar o resolver la vista no SHALL marcar datos como editados, guardar automáticamente ni modificar revisión territorial, modalidad, tarifas, cotización o programación.

#### Scenario: Rerender e idioma
- **WHEN** React vuelve a renderizar el detalle, repite un efecto en Strict Mode o cambia el idioma sin cambiar ubicaciones
- **THEN** se mantienen valores y puntos y no se duplica la consulta de resolución para la misma ubicación

#### Scenario: Respuesta antigua
- **WHEN** llega una resolución inicial después de que el personal haya seleccionado otra dirección
- **THEN** la respuesta antigua no reemplaza el texto, identidad ni punto de la nueva selección

#### Scenario: Navegación entre solicitudes
- **WHEN** el personal abre otra solicitud mientras una consulta sigue pendiente
- **THEN** se recupera el recorrido de la nueva solicitud sin reutilizar ni aplicar puntos de la anterior

#### Scenario: Vista de mapa resuelta
- **WHEN** ambos puntos se recuperan correctamente al abrir el detalle
- **THEN** el mapa los muestra y las condiciones comerciales y datos persistidos permanecen intactos

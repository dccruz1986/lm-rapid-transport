## ADDED Requirements

### Requirement: Estimación de distancia del recorrido no local
El admin SHALL obtener una distancia aproximada por carretera de ida entre los puntos de origen y destino resueltos cuando el recorrido sea no local y ambos estén dentro de Florida. SHALL expresarla en millas e identificar como aproximados los recorridos que utilicen puntos ZIP. No SHALL consultar distancia para recorridos locales, incompletos o fuera de cobertura, ni presentar distancia en línea recta como recorrido por carretera.

#### Scenario: Dirección fuera de Miami-Dade
- **WHEN** ambos puntos están resueltos en Florida y alguno está fuera de Miami-Dade
- **THEN** se calcula y muestra la distancia aproximada de ida disponible como sugerencia

#### Scenario: Puntos aproximados por ZIP
- **WHEN** la ruta elegible se calcula con uno o ambos puntos de precisión postal
- **THEN** se indica que las millas son aproximadas entre puntos ZIP y no corresponden a una dirección exacta confirmada

#### Scenario: Recorrido local o sin puntos suficientes
- **WHEN** ambos extremos están en Miami-Dade o falta resolver alguno
- **THEN** no se solicita una ruta para precargar millas

### Requirement: Vigencia y fallos de la sugerencia de distancia
La sugerencia SHALL estar ligada al recorrido actual, deduplicar consultas por rerender o cambio de idioma y descartar respuestas anteriores a cambios de ubicación o solicitud. Ante falta de ruta, timeout, error de Google o distancia inválida SHALL permitir entrada manual sin inventar valores ni borrar cantidades manuales. SHALL ofrecer reintento explícito y conservar las restricciones de credenciales y minimización vigentes.

#### Scenario: Cambio mientras se calcula
- **WHEN** se edita el destino antes de recibir la respuesta de rutas
- **THEN** la respuesta antigua no se muestra ni se aplica al nuevo recorrido

#### Scenario: Proveedor no disponible
- **WHEN** Google no devuelve una ruta válida
- **THEN** se informa que no hay sugerencia disponible, sin usar cero o una distancia ficticia, y el personal puede introducir millas

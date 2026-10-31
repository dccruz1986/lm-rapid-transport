# location-resolution Specification

## Purpose
Definir la resolución de ubicaciones por ZIP o dirección, su evidencia territorial y las alternativas manuales cuando Google no esté disponible.

## Requirements

### Requirement: Ubicación por ZIP o dirección con Google
El sistema SHALL ofrecer sugerencias de origen/destino por ZIP o dirección con Google, selección accesible, atribución requerida y validación de US/FL en servidor. SHALL evitar que respuestas antiguas sustituyan la consulta actual y borrar la resolución previa al editar el texto.

#### Scenario: ZIP seleccionado
- **WHEN** el cliente introduce un ZIP de cinco dígitos y elige su resultado postal
- **THEN** se muestra la ubicación resuelta con precisión postal, sin inventar una calle

#### Scenario: Selección editada y consulta lenta
- **WHEN** el cliente cambia el texto tras seleccionar una ubicación y llega una respuesta anterior
- **THEN** se invalida la selección anterior y no se presenta esa respuesta como válida para el nuevo texto

### Requirement: Proveedor configurable y alternativa manual
La integración SHALL activarse mediante GOOGLE_MAPS_SERVER_API_KEY privada, con instrucciones de APIs/facturación/restricciones y placeholders sin secretos. Sin clave o ante fallo SHALL permitir recepción manual pendiente de revisión sin resultados ficticios. Los endpoints SHALL tener límites persistentes, timeout y validación de entradas.

#### Scenario: Sin credenciales
- **WHEN** no existe clave configurada
- **THEN** el formulario funciona con ubicación manual y registra clasificación pendiente

#### Scenario: Google no disponible
- **WHEN** Google rechaza la clave, excede cuota o vence el timeout
- **THEN** se informa la indisponibilidad sin perder campos y se ofrece continuar manualmente

### Requirement: Evidencia territorial y minimización
El servidor SHALL resolver las ubicaciones y calcular el condado sin confiar en coordenadas, condado o modo arbitrarios del cliente. SHALL distinguir ADDRESS, POSTAL_CODE y MANUAL, conservar place_id cuando corresponda y aplicar las restricciones de retención de Google. No SHALL persistir indiscriminadamente respuestas completas ni exponer claves privadas de servidor. La clave pública del SDK SHALL restringirse por HTTP referrer y APIs autorizadas.

#### Scenario: Payload territorial adulterado
- **WHEN** el cliente envía LOCAL o Miami-Dade sin evidencia válida del servidor
- **THEN** la afirmación no decide la modalidad y se recalcula o queda pendiente de revisión

#### Scenario: Resultado sin condado suficiente
- **WHEN** falta información, hay resultados contradictorios o el ZIP no permite determinar el condado inequívocamente
- **THEN** se registra NEEDS_REVIEW y no se clasifica mediante el nombre postal Miami o un centroide

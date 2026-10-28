## Why

La web pública y el admin comparten estilos, pero necesitan jerarquías distintas: el cliente debe solicitar una mudanza con facilidad y el personal debe reconocer el siguiente paso operativo. Una revisión con frontend-design permitirá unificar identidad y controles, reducir ruido visual y mejorar la lectura en móvil sin alterar los procesos existentes.

## What Changes

- Definir tokens compartidos de color, tipografía, espacio y estados, conservando el logo y el naranja #d75523 sobre blanco.
- Rediseñar navegación, portada, servicios, información y contacto de la web; mantener el formulario sencillo de tres pasos y su integración de localización.
- Organizar admin, listas y detalles con jerarquía clara, estados legibles y formularios ordenados según el flujo de trabajo; destacar horas e importes finales.
- Unificar botones, campos, mensajes y superficies; mejorar teclado, contraste, adaptación móvil y traducciones ES/EN.
- Realizar revisión visual antes/después y comprobar que las interacciones existentes conservan datos y comportamiento.

## Capabilities

### New Capabilities
- `frontend-experience`: identidad visual compartida, composición pública y administrativa, jerarquía de acciones y criterios de revisión visual.

### Modified Capabilities
Ninguna. Se conservan los requisitos funcionales de public-site, request-intake, location-resolution, operations-dashboard y los flujos administrativos existentes.

## Impact

Principalmente packages/ui/src/styles.css y componentes compartidos; layouts y componentes de apps/web y apps/admin. Se evaluará una fuente local con licencia adecuada y fallback del sistema. Sin nuevas APIs, migraciones, cambios de permisos, cálculo de precios ni servicios externos. No incluye despliegue ni creación de contenidos comerciales ficticios.

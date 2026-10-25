## 1. Actualización del editor

- [x] 1.1 Actualizar el manejador de trabajadores en QuoteEditor para cargar rateFor con el nuevo equipo en cotizaciones nuevas y existentes, conservando inicialización desde snapshot y edición manual.
- [x] 1.2 Actualizar el manejador de modalidad para cargar su tarifa configurada con el equipo vigente; conservar mínimo copiado, cantidades y persistencia exclusiva al guardar.

## 2. Verificación

- [x] 2.1 Verificar en el formulario cotizaciones nuevas y existentes con equipos 2/3/4 y tarifas configuradas distintas de las iniciales, incluyendo decimales; comprobar tarifa y vista previa.
- [x] 2.2 Verificar PER_MILE y cambios de modalidad en ambas direcciones, snapshot al abrir y ajustes manuales antes/después de seleccionar equipo.
- [x] 2.3 Guardar una cotización de prueba, recargar y comprobar equipo/tarifa persistidos; comprobar que cambiar una tarifa confirmada mantiene el flujo de reconfirmación existente.
- [x] 2.4 Ejecutar lint del archivo afectado, comprobación de tipos y build del admin; registrar resultados y resolver fallos causados por el cambio.




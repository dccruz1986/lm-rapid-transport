## Why

El formulario público pide demasiados datos para el primer contacto. Se necesita una experiencia sencilla como las cuatro imágenes aportadas: ubicaciones, detalles básicos y contacto, con búsqueda por ZIP o dirección. El usuario confirmó que el área local comprende todo Miami-Dade, no solo la ciudad de Miami.

## What Changes

- Tres pasos: Ubicación (origen/destino), Detalles (fecha flexible y tamaño), Contacto (nombre completo, email opcional y teléfono).
- Autocompletado de ZIP/dirección con Google, estados de carga/error, selección accesible y alternativa manual si faltan claves o falla el servicio.
- Mantener marca naranja #D75523/blanco, idiomas ES/EN, contacto configurado y navegación que conserva datos. Las imágenes guían estructura, no su teléfono, verde ni textos legales.
- Tamaños: estudio, 1/2/3/4 dormitorios, 5+ dormitorios, oficina y comercial. Información operativa adicional y fotos quedan opcionales y plegadas.
- **BREAKING**: ampliar recepción para ubicaciones parciales y nombre completo, sin inventar calle, apellido, tipo de vivienda, pisos, elevadores o trabajadores; adaptar contratos, DB y admin.
- **BREAKING**: sustituir la clasificación municipal por condado: ambos extremos en Miami-Dade → LOCAL por hora; cualquiera fuera del condado dentro de Florida → PER_MILE. ZIP ambiguo o no verificado → revisión, nunca precio definitivo automático.
- Preparar configuración de Google por variable de entorno, documentación de APIs, facturación y restricciones. No publicar claves ni activar servicios de pago durante esta propuesta.

## Capabilities

### New Capabilities

- `location-resolution`: búsqueda Google, resolución verificable, precisión e integración configurable.

### Modified Capabilities

- `request-intake`: formulario simplificado, contacto y datos parciales compatibles con recepción segura.
- `quote-pricing`: regla territorial Miami-Dade y clasificación automática con revisión de casos inciertos.

## Impact

RequestForm, endpoints de intake y nuevos endpoints acotados de ubicaciones; validadores compartidos, configuración, migraciones/RPC, tipos DB, vistas/editores administrativos y pruebas. Mantener RLS, cuotas, idempotencia, almacenamiento privado, cálculos y aceptación comercial. Ajustar textos públicos/admin y documentación que aún hablan del municipio. No calcular horas de trabajo ni millas de ruta a partir de ZIP en este cambio; la solicitud no devuelve precio automático.

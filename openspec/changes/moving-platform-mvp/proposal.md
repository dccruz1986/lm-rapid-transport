## Why

LM Rapid Transport necesita centralizar la recepción de solicitudes, las cotizaciones y la programación de mudanzas dentro de Florida. Este MVP sustituirá la información dispersa por un flujo sencillo, seguro y bilingüe, con costos de infraestructura contenidos.

## What Changes

- Crear un monorepo Bun/Turborepo con dos aplicaciones Next.js: sitio público y administración, y paquetes compartidos de UI, tipos, validación, configuración y acceso a datos.
- Ofrecer Home, Services, About, Contact y Request a Quote en español por defecto e inglés, adaptados a móvil y desktop.
- Recibir solicitudes sin cuenta, con teléfono estadounidense obligatorio, correo y fotografías opcionales; asociar clientes por teléfono sin sobrescribir sus datos.
- Gestionar usuarios invitados mediante Supabase Auth, roles ADMIN/MANAGER/DISPATCHER y permisos por acción extensibles.
- Cotizar en USD: local en la ciudad de Miami por hora del equipo, fuera de Miami por millas de ida, siempre dentro de Florida. Aplicar las tarifas y reglas acordadas, impuestos incluidos, sin descuentos ni cargos adicionales.
- Registrar aprobación interna, comunicación y confirmación manual del cliente; calcular el total con horas o millas reales y conservar historial de cambios monetarios y de cantidades.
- Gestionar solicitudes, clientes, notas, mudanzas, cancelación/reactivación y métricas básicas; programar de lunes a sábado sin control automático de disponibilidad.
- Entregar migraciones, RLS, Storage privado, datos ficticios, pruebas críticas y documentación para Seenode y Cloudflare.
- En esta etapa se crean únicamente artefactos OpenSpec: la implementación requiere una instrucción posterior del usuario.

## Capabilities

### New Capabilities

- `public-site`: Páginas públicas, identidad comercial, idiomas y experiencia accesible.
- `request-intake`: Formulario, validación, archivos privados y confirmación sin exposición de datos.
- `staff-access`: Invitaciones, autenticación, ciclo de usuarios y permisos por acción.
- `request-customer-management`: Solicitudes, clientes, deduplicación, notas y revisión de cancelaciones.
- `quote-pricing`: Tarifas, fórmulas, aprobación, confirmación manual e historial de correcciones.
- `move-operations`: Programación, ejecución, mediciones reales, finalización y reactivación.
- `operations-dashboard`: Estadísticas, búsqueda, filtros y navegación administrativa.
- `secure-platform-delivery`: Arquitectura, persistencia, seguridad, pruebas, seed y despliegue.

### Modified Capabilities

Ninguna: el repositorio no contiene capacidades de aplicación existentes.

## Impact

Se incorporarán Next.js App Router, React, Tailwind CSS, shadcn/ui, React Hook Form, Zod, Supabase, Biome y herramientas de prueba. PostgreSQL alojará las reglas transaccionales y Supabase Auth/Storage los accesos y archivos. Seenode alojará dos servicios y Cloudflare gestionará DNS; SMTP será necesario para invitación y recuperación de cuentas. No se implementarán NestJS, Expo, pagos, PDF, comunicaciones automáticas de cotizaciones, GPS, asignación de personal/camiones, objetos especiales, paradas adicionales, fusión de clientes ni editor de permisos. Logo, colores, contacto real y dominio quedan pendientes del lanzamiento.

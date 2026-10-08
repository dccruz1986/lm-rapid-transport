## ADDED Requirements

### Requirement: Monorepo y backend Next.js
El proyecto SHALL usar Bun, Turborepo, TypeScript strict, apps/web, apps/admin y paquetes ui/types/validation/config, con data server-only para Supabase compartido. SHALL usar Next.js App Router, Tailwind CSS, shadcn/ui, React Hook Form y Zod. No SHALL crear backend NestJS ni incorporar dependencias sin propósito en el alcance.

#### Scenario: Instalación reproducible
- **WHEN** un desarrollador instala desde el lockfile y ejecuta los comandos documentados
- **THEN** puede iniciar y compilar ambas aplicaciones usando los paquetes compartidos

### Requirement: Persistencia relacional y migraciones
PostgreSQL SHALL usar UUID, timestamps de creación/actualización en entidades mutables, foreign keys, constraints e índices adecuados. SHALL garantizar teléfono de cliente único, número de solicitud único, una cotización y una Move por solicitud, estados válidos y valores monetarios exactos. Las migraciones SHALL ser reproducibles y generar tipos TypeScript de DB.

#### Scenario: Datos incoherentes enviados directamente
- **WHEN** una escritura intenta duplicar una Move de la misma solicitud o usar una FK inexistente
- **THEN** la base rechaza la operación sin dejar registros parciales

### Requirement: RLS y autorización por operación
Todas las tablas expuestas SHALL tener RLS y grants mínimos. El acceso de personal SHALL requerir perfil activo/permiso. Las operaciones complejas SHALL validar estados, permisos y versión en DB y servidor; no SHALL existir DML directo que permita eludir estas comprobaciones. Funciones privilegiadas SHALL fijar search_path y restringir EXECUTE. Las políticas de Storage SHALL mantener fotos privadas.

#### Scenario: Intento de evadir el backend web
- **WHEN** un usuario llama REST/RPC de Supabase directamente para una operación que su rol no permite
- **THEN** obtiene denegación aunque omita la interfaz de Next.js

### Requirement: Secretos y límites de confianza
Dominios, URLs, credenciales y secretos SHALL venir de variables de entorno con `.env.example` de placeholders. Claves elevadas SHALL usarse solo en módulos server-only para recepción/provisionamiento autorizado y no en el bundle del navegador. El admin ordinario SHALL usar su sesión y RLS. La aplicación SHALL validar origen/CSRF cuando corresponda, límites de cuerpo, archivos y cuotas; no SHALL confiar ciegamente en cabeceras de IP remitidas por clientes.

#### Scenario: Inspección del build público
- **WHEN** se inspeccionan los assets públicos y el repositorio
- **THEN** no contienen claves elevadas, contraseñas, tokens SMTP ni credenciales reales hardcodeadas

### Requirement: Integridad ante concurrencia y fallos
Recepción, confirmación, conversión, cierre, cancelación y reactivación SHALL tener límites transaccionales e idempotencia apropiados. Ediciones concurrentes SHALL detectar versiones obsoletas. Archivos provisionales SHALL tener compensación/limpieza para fallos externos a DB. Historial de cantidades/tarifas SHALL escribirse junto con el cambio.

#### Scenario: Dos cambios concurrentes de tarifa
- **WHEN** dos usuarios guardan cambios basados en la misma versión
- **THEN** uno se confirma y el otro recibe conflicto para revisar, sin sobrescritura silenciosa

### Requirement: Datos de desarrollo y tarifas iniciales
El proyecto SHALL incluir aproximadamente diez clientes y quince solicitudes ficticias, diferentes estados, varias cotizaciones y mudanzas, y escenarios relevantes de fechas/tipos/equipos. Las tarifas comerciales acordadas SHALL configurarse separadamente del seed ficticio. Seed y usuarios de prueba no SHALL ejecutarse automáticamente en producción.

#### Scenario: Inicialización de desarrollo
- **WHEN** se aplican migraciones y seed en Supabase local
- **THEN** se pueden probar listas, métricas y casos de cálculo sin datos personales reales

### Requirement: Verificaciones por fase y finales
Cada fase SHALL finalizar con Biome, typecheck y pruebas relevantes corregidas antes de seguir. La entrega SHALL verificar validación, cálculo, transiciones, permisos/RLS, uploads y flujos esenciales, ejecutar todos los tests, lint, typecheck y production build de ambas aplicaciones. No SHALL afirmarse validación remota o despliegue sin haberlos ejecutado.

#### Scenario: Falla una comprobación de fase
- **WHEN** una prueba o chequeo falla
- **THEN** se corrige y verifica antes de avanzar a la fase siguiente

### Requirement: Documentación y despliegue Seenode
README SHALL documentar instalación, configuración Supabase/entorno, migraciones, seed, desarrollo, pruebas, build, bootstrap ADMIN, SMTP, limpieza de uploads y despliegue en Seenode con Cloudflare. SHALL preparar dos servicios, dominio público y subdominio admin configurables, sin depender de Vercel ni disco local persistente. Contacto, marca y dominio pendientes SHALL figurar en la lista previa al lanzamiento.

#### Scenario: Preparación de producción
- **WHEN** un operador sigue el README con sus cuentas y configuración real
- **THEN** puede construir ambos servicios, configurar puertos/URLs/TLS/SMTP y comprobar el flujo sin insertar datos ficticios de desarrollo

### Requirement: Etapa actual exclusivamente documental
Esta entrega OpenSpec SHALL contener propuesta, diseño, requisitos y tareas pendientes. No SHALL implementar aplicación, instalar dependencias del MVP, crear credenciales, enviar invitaciones ni modificar infraestructura o Supabase remoto durante esta etapa.

#### Scenario: Finalización de la propuesta
- **WHEN** todos los artefactos se validan
- **THEN** quedan listos para una futura implementación autorizada, con tareas sin marcar como realizadas

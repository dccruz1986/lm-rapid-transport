# LM Rapid Transport
Monorepo Next.js + Supabase, Bun y Turborepo. Español e inglés.

## Desarrollo
Requisitos: Bun 1.3.14, Node 24 LTS y Docker para Supabase local.

1. `bun install`.
2. `bun run db:start`, `bun run db:migrate` y `bun run env:local`.
   El primer arranque aplica las migraciones y carga `supabase/seed.sql` con
   datos ficticios. `env:local` crea los archivos ignorados de entorno sin
   sobrescribir archivos existentes. Alternativamente, copiar `.env.example`
   a `apps/web/.env.local` y `apps/admin/.env.local` y completar los valores.
3. `bun run dev`: web en localhost:3000, admin en localhost:3001.
4. `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.

El backend vive en Next.js; los módulos de datos privilegiados son server-only.
El dominio y la marca final se configuran antes de publicar.
Contacto aprobado provisionalmente: +1 (305) 981-2778 y 86adrianlopez@gmail.com.
Se configura mediante `CONTACT_PHONE` y `CONTACT_EMAIL` en el entorno de web;
puede cambiarse posteriormente sin editar componentes. Logo proporcionado en
`assets/logo.png`, servido por ambas apps desde `public/logo.png`. Paleta aprobada:
naranja `#D75523` y blanco, con texto oscuro para contraste (2026-10-15).
Los pasos de Supabase y despliegue están documentados abajo. No hay despliegue remoto automático.

Para verificar permisos SQL: `bun run db:test`. Para probar Auth, correo y
Storage vía API local: `bun run env:local` y `bun run test:integration`.
Esta última prueba rechaza URLs remotas, crea usuarios temporales ficticios
y los elimina al terminar. Requiere los diez clientes del seed local.
`bunx supabase db reset` reconstruye exclusivamente la DB local y vuelve a cargar
los fixtures: elimina datos locales existentes, usar solo si se desea reiniciar
el entorno de desarrollo. No usar seed ni reset contra producción.

Si Kong se reinicia con salida 0, comprobar primero la imagen con
`docker run --rm --entrypoint sh public.ecr.aws/supabase/kong:2.8.1 -c 'kong version'`.
Durante la implementación una imagen local dañada tenía scripts de cero bytes;
volver a descargar esa imagen resolvió el arranque. No es necesario bajar la
versión de la CLI ni desactivar las plantillas de correo.

## Acceso del personal y correo

No hay registro público. Cada usuario necesita un perfil activo y permisos en
base de datos; desactivar el perfil retira el acceso aunque su sesión siga vigente.
ADMIN gestiona todos los roles. MANAGER solo gestiona MANAGER y DISPATCHER.
El último ADMIN activo no puede desactivarse.

Para el primer ADMIN, crear una cuenta mediante Auth en el entorno autorizado
y ejecutar `select public.bootstrap_admin('UUID_DE_AUTH');` desde el SQL Editor
como propietario. El UUID debe ser el de la cuenta destinataria correcta.
Esta función no está disponible para usuarios ordinarios y deja de permitir
bootstrap cuando existe un ADMIN activo. Enviar un enlace de recuperación para
que el destinatario establezca su propia contraseña; no enviar contraseñas.
No ejecutar fixtures ni crear cuentas de prueba en producción.

Antes de publicar, configurar SMTP propio en Supabase Auth, con remitente y
dominio verificados por el proveedor elegido. Configurar Site URL con la URL
externa del admin y autorizar exactamente sus rutas `/auth/confirm` y
`/auth/set-password` como redirects. Copiar el contenido de
`supabase/templates/invite.html` y `recovery.html` en sus plantillas de Auth.
Mantener el registro público deshabilitado. Los secretos SMTP se configuran
en Supabase, nunca en variables `NEXT_PUBLIC_*` ni en el repositorio.

En local, el correo se captura en Mailpit (`http://localhost:54324`), sin
entrega a destinatarios reales. Probar allí invitación, enlace inválido,
establecimiento de contraseña, login, recuperación y desactivación.
Si el envío falla después de crear una cuenta invitada, repetir la invitación
con el mismo rol genera un enlace de recuperación para esa cuenta pendiente;
no permite cambiar su rol ni reinvitar una cuenta que ya inició sesión.
Para una cuenta ya usada, utilizar «Recuperar acceso». Las reservas que no
crearon una cuenta caducan a las 24 horas y pueden reservarse nuevamente.

## Recepción y archivos temporales

La web acepta solicitudes solo por sus endpoints `/api/intake`, desde el origen
configurado en `WEB_URL`. No habilitar acceso anónimo directo a tablas o Storage.
La sesión caduca a los 30 minutos; tras completarla, conserva la respuesta de
reintento durante 24 horas. El número de solicitud no permite consultar datos.
Fotos: máximo ocho, 5 MiB cada una, JPG/PNG/WebP, hasta 20 millones de píxeles.
El servidor decodifica y vuelve a codificar imágenes eliminando metadata.

Cuotas persistentes iniciales: 300 inicios/hora globales y 2400 operaciones/hora
globales por tipo (carga o finalización). Si `TRUSTED_IP_HEADER` está configurada,
se aplican además 10 inicios/hora y 100 operaciones/hora por IP hash. Dejarla
vacía hasta comprobar que el proxy de alojamiento reemplaza esa cabecera y
no permite al cliente falsificarla. Mantener `INTAKE_HASH_SECRET` estable y privado.

Ejecutar periódicamente (por ejemplo cada hora) el mantenimiento con el entorno
del servicio web: `bun --env-file=apps/web/.env.local scripts/cleanup-intake.ts`.
En producción inyectar las variables en el proceso en lugar de usar ese archivo
local. El comando procesa hasta 100 sesiones caducadas, con una hora adicional
de margen; borra objetos provisionales antes de sus metadatos y permite
reintentos si Storage falla. Nunca selecciona sesiones con una solicitud
confirmada en DB. Conservar la ejecución acotada a 60 segundos de los endpoints
también en Seenode; el upload a Storage debe tener un timeout menor a ese límite.

## Operación del MVP

Desde Solicitudes, revisar contacto, dirección y clasificación por condado (Miami-Dade por hora; fuera del condado por millas). Preparar
la cotización LOCAL (horas del equipo) o PER_MILE (millas de ida), aprobarla y
registrar la comunicación manual. Marcar aceptación solo cuando el cliente haya
aceptado esas condiciones. El sistema no envía cotizaciones por email/WhatsApp.
Una cotización confirmada habilita programación; después se registran llegada,
fin de descarga y, en modalidad por millas, distancia real. El servidor redondea
hacia arriba y aplica el mínimo local copiado; conserva separado el estimado.

Los tres roles operan trabajos abiertos. Solo ADMIN/MANAGER cambian tarifas
generales o corrigen trabajos completados. Cambiar condiciones requiere nueva
aceptación: una reserva se conserva pero no puede iniciarse; un trabajo completado
conserva el importe aceptado hasta confirmar el revisado. Cancelar/reactivar
reutiliza la misma mudanza y exige revisar condiciones y programación.

Los formularios operativos muestran hora de Miami y offset EDT/EST explícito.
Elegir el offset vigente para la fecha; horas inexistentes por cambio de horario
se rechazan. El offset distingue las dos ocurrencias de una hora en otoño.

## Pruebas y compilación

`bun run db:test` prueba permisos y todo el ciclo comercial/operativo mediante
transacciones con ROLLBACK. `bun test` cubre precios, validación, calendario y DST.
`bun run test:intake` requiere la web en localhost:3000 y deja solicitudes ficticias
para inspección. `bun run test:integration` comprueba Auth/Mailpit/Storage y limpia
sus cuentas temporales. Ninguna prueba usa servicios remotos.

La prueba opcional `bun tests/quote-concurrency.ts` usa la cuenta local de navegador
preparada por `bun scripts/local-staff.ts`, y elimina sus solicitudes temporales.
Al finalizar la revisión de navegador, ejecutar `bun scripts/local-staff.ts --cleanup`.
Estos comandos rechazan URLs alojadas y no sirven para crear usuarios de producción.

Compilaciones separadas: `bun run build:web` y `bun run build:admin`.
Arranque bajo Node: `npm run start:web` y `npm run start:admin`; ambos leen `PORT`
(3000 por defecto) y escuchan en `0.0.0.0`. En local asignar `PORT=3001` al admin
para ejecutar ambos simultáneamente. Conservar las URLs locales de `.env.local`.

## Seenode y Cloudflare

Preparar dos Web Services del mismo repositorio, con directorio raíz del repositorio
para que Bun encuentre todos los workspaces. Seleccionar **Node 24** y puerto **3000**
en ambos servicios; cada uno tiene su propio contenedor. La imagen Node incluye npm;
instalar Bun fijado durante el build:

| Servicio | Build command | Start command |
|---|---|---|
| Web | `npm install -g bun@1.3.14 && bun install --frozen-lockfile && bun run build:web` | `npm run start:web` |
| Admin | `npm install -g bun@1.3.14 && bun install --frozen-lockfile && bun run build:admin` | `npm run start:admin` |

Configurar variables desde `.env.example` en ambos servicios. `WEB_URL` y `ADMIN_URL`
deben ser las URLs externas HTTPS finales, sin barra final. Las variables
`NEXT_PUBLIC_*` deben existir durante el build; un cambio requiere recompilar.
Inyectar las claves privilegiadas como secretos de servidor. No copiar `.env.local`
ni `.local` al repositorio/despliegue. Las fotos persisten en Storage, no en disco.

La configuración sigue las guías oficiales de [Next.js en Seenode](https://seenode.com/docs/frameworks/javascript/nextjs),
[runtimes](https://seenode.com/docs/reference/runtimes) y [monorepos](https://seenode.com/docs/deploy/monorepo),
consultadas el 2026-10-09. El arranque local bajo Node no demuestra un despliegue en Seenode.

Añadir el dominio público al servicio web y el subdominio admin al administrativo.
Copiar los destinos DNS que entregue Seenode; no inventar CNAMEs. En Cloudflare,
mantener los registros DNS-only durante validación y emisión de TLS, conforme a la
[guía de dominios de Seenode](https://seenode.com/docs/networking/custom-domains).
Comprobar SSL Active y las redirecciones HTTPS antes de habilitar recepción.
No configurar caché pública para páginas administrativas, Auth ni `/api/intake/*`.

## Supabase de producción, respaldo y lanzamiento

Antes de tocar el proyecto alojado, verificar su identificador y obtener un respaldo
de base de datos y objetos Storage con el procedimiento disponible en esa cuenta.
Probar restauración en un proyecto separado. Con acceso autorizado, vincular la CLI
al proyecto (`bunx supabase link --project-ref <ref>`), revisar
`bunx supabase db push --dry-run` y aplicar `bunx supabase db push` sin seed.
Usar credenciales suministradas por el gestor de secretos/CLI, nunca por commits.
Las migraciones crean tablas, políticas y bucket privado; verificar RLS/Storage en
staging antes de habilitar clientes. Configurar Auth/SMTP y bootstrap como arriba.

Antes de publicar faltan decisiones manuales: logo/colores definitivos, teléfono y
email reales, dominio/subdominio, SMTP/remitente y cuentas de Seenode/Supabase.
Reemplazar los contactos de ejemplo, verificar tarifas comerciales y probar una
solicitud, login, cotización y cierre en staging. No cargar `seed.sql` en producción.
Configurar limpieza periódica de uploads, alertas de error y respaldos según el plan
de Supabase. La clave pública no autoriza migraciones ni administración del proyecto.

Guardar el commit y configuración de cada release. Ante fallo, volver al artefacto
anterior compatible con el esquema; no borrar solicitudes para revertir. Para SQL,
usar una migración correctiva después del respaldo; no asumir que el rollback de
la aplicación revierte la base. Pausar recepción si no puede garantizarse consistencia.


Formulario de tres pasos y configuración de Google: [docs/google-locations.md](docs/google-locations.md).


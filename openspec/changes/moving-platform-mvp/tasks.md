## 1. Fase 1 — Base ejecutable del monorepo

- [ ] 1.1 Revisar esta propuesta y las decisiones técnicas señaladas en design.md al recibir autorización para implementar; verificar instrucciones vigentes del repositorio y versiones compatibles del stack.
- [ ] 1.2 Crear workspaces Bun, Turborepo, lockfile y apps/web + apps/admin con Next.js App Router, sin NestJS.
- [ ] 1.3 Crear paquetes ui, types, validation, config y data; impedir imports de módulos privilegiados en cliente.
- [ ] 1.4 Configurar TypeScript strict, Biome y comandos raíz dev/lint/typecheck/test/build con tareas por aplicación.
- [ ] 1.5 Preparar Tailwind, componentes shadcn/ui, layouts públicos/administrativos y estados loading/empty/error/success accesibles.
- [ ] 1.6 Incorporar diccionarios español/inglés, selector persistido y formateo USD/fechas Miami sin perder valores de formularios.
- [ ] 1.7 Crear configuración tipada y .env.example con placeholders, gitignore y README inicial de arranque local; no copiar credenciales del chat.
- [ ] 1.8 Verificar arranque de ambas aplicaciones; ejecutar lint, typecheck, smoke/pruebas pertinentes y builds iniciales, corregir fallos antes de avanzar.

## 2. Fase 2 — Modelo, reglas base y acceso seguro

- [ ] 2.1 Configurar Supabase local y crear migraciones de perfiles, clientes, direcciones, solicitudes y adjuntos con UUID/timestamps/FK/índices.
- [ ] 2.2 Crear schema de cotizaciones, comunicaciones con snapshots, mudanzas, notas, tarifario e historial limitado a tiempos/horas/millas/tarifas.
- [ ] 2.3 Añadir unicidad de teléfono, número de solicitud, cotización/Move por solicitud, límites de cantidades y campos version para concurrencia.
- [ ] 2.4 Crear catálogo de permisos y asignaciones ADMIN/MANAGER/DISPATCHER según la matriz; sin editor de permisos ni accesos MOVER/DRIVER.
- [ ] 2.5 Aplicar RLS/grants mínimos en tablas y funciones, helpers de perfil activo/permiso y política de denegación para acceso anónimo directo.
- [ ] 2.6 Configurar bucket privado y límites de Storage; preparar tablas privadas de recepción/cuotas sin lecturas públicas.
- [ ] 2.7 Implementar schemas Zod de contacto estadounidense/email opcional, direcciones Florida, equipos, datos de propiedad, fechas y configuración monetaria.
- [ ] 2.8 Implementar funciones puras de cálculo local/por millas, tarifas iniciales 119/145/165 y 4, mínimo tres horas, redondeos y transiciones básicas con tests.
- [ ] 2.9 Generar tipos DB y clientes Supabase SSR/server-only; validar sesión y perfil activo en cada ruta/acción administrativa, sin caché compartida de datos privados.
- [ ] 2.10 Implementar login, logout, aceptación de invitación, creación de contraseña y recuperación con errores accesibles en ambos idiomas.
- [ ] 2.11 Implementar invitar/desactivar usuarios con restricciones sobre cuentas ADMIN, protección de escalada y recuperación de fallos parciales de Auth/perfil.
- [ ] 2.12 Documentar bootstrap seguro del primer ADMIN y SMTP/redirects; probar correo con entorno local de pruebas sin enviar invitaciones reales.
- [ ] 2.13 Crear seed ficticio de aproximadamente 10 clientes/15 solicitudes con cotizaciones y Moves coherentes; separar tarifas comerciales de fixtures y usuarios locales.
- [ ] 2.14 Probar RLS/Storage/REST/RPC, usuario desactivado, escalada MANAGER→ADMIN y modificación global por DISPATCHER; ejecutar lint, typecheck y pruebas relevantes, corregir antes de avanzar.

## 3. Fase 3 — Sitio y recepción pública completa

- [ ] 3.1 Crear Home, Services, About y Contact de LM Rapid Transport, con servicios aprobados y datos de ejemplo identificados; dejar logo/colores/contactos reales configurables.
- [ ] 3.2 Implementar formulario por pasos con contacto, origen/destino, tipo de propiedad, dormitorios condicionales, pisos/elevadores, superficie/unidad y comentarios.
- [ ] 3.3 Añadir selección 2/3/4 trabajadores o asesoría, fecha opcional y validación de mañana/lunes-sábado en Miami, sin pedir hora ni ofrecer precio automático.
- [ ] 3.4 Implementar sesiones breves de recepción, token hash y claves idempotentes; aplicar límites de cuerpo, origen y cuotas persistentes, sin confiar en IP arbitraria.
- [ ] 3.5 Implementar carga individual de hasta ocho imágenes opcionales, límite 5 MiB/40 MiB total, detección real/decodificación y paths aleatorios privados.
- [ ] 3.6 Crear RPC de finalización atómica con normalización/unicidad de teléfono, snapshots de contacto y asociación a cliente sin sobrescribir su ficha.
- [ ] 3.7 Mostrar número único de solicitud tras commit; resolver reintentos y recuperación de fallos sin duplicados, éxito falso ni revelación de cliente existente.
- [ ] 3.8 Implementar limpieza acotada de sesiones/objetos provisionales vencidos y documentar ejecución y reintentos sin borrar archivos asociados a solicitudes.
- [ ] 3.9 Probar envío sin email/fotos/fecha, comercial sin dormitorios, teléfono ya usado, concurrencia, hoy/domingo/mañana y rechazo de archivos/datos inválidos.
- [ ] 3.10 Revisar teclado/móvil/desktop y ambos idiomas; verificar ausencia de lecturas públicas; ejecutar lint, typecheck y pruebas relevantes y corregir antes de avanzar.

## 4. Fase 4 — Solicitudes, clientes y dashboard

- [ ] 4.1 Implementar sidebar responsive y rutas protegidas Dashboard, Requests, Customers y Moves, mostrando acciones según permisos efectivos.
- [ ] 4.2 Implementar tabla Requests con columnas acordadas, búsqueda por número/nombre/teléfono, filtros de estado/fecha, paginación y fecha indefinida explícita.
- [ ] 4.3 Implementar detalle completo de solicitud y URLs firmadas de fotos previa autorización, sin caché pública ni enlaces permanentes.
- [ ] 4.4 Implementar edición validada de contacto/direcciones/propiedad/equipo, detección de conflicto de teléfono y versión, preservando otras solicitudes históricas.
- [ ] 4.5 Implementar notas internas con edición/eliminación por cualquiera de los tres roles y confirmación de borrado, sin historial general.
- [ ] 4.6 Implementar Customers con ficha, solicitudes anteriores y mudanzas anteriores, sin fusión ni borrado definitivo.
- [ ] 4.7 Crear acciones transaccionales de contacto, cancelación con motivo opcional y reactivación PENDING_REVIEW, sincronizando solicitud/Move y conservando datos.
- [ ] 4.8 Implementar métricas con definiciones de design.md, especialmente cotizaciones comunicadas pendientes, semana Miami y estados de error distintos de cero.
- [ ] 4.9 Probar filtros/estados vacíos, aislamiento de datos, cancelación/reactivación y métricas sin duplicación; ejecutar lint, typecheck y pruebas relevantes y corregir antes de avanzar.

## 5. Fase 5 — Cotización y ejecución de mudanzas

- [ ] 5.1 Implementar pantalla de tarifas generales/mínimo solo ADMIN/MANAGER y registrar historial de cambios de tarifa sin alterar cotizaciones anteriores.
- [ ] 5.2 Implementar editor individual de cotización para los tres roles, clasificación manual Miami/PER_MILE, equipo, horas/millas estimadas y snapshots de tarifa/mínimo.
- [ ] 5.3 Implementar cálculos autoritativos SQL/servidor y vistas previas sin descuentos/cargos/impuesto adicional, con fixtures de paridad y rechazo de totales manipulados.
- [ ] 5.4 Implementar aprobación interna por los tres roles, estados ESTIMATED/ACCEPTED/CONFIRMED/CANCELLED y ausencia de vencimiento automático.
- [ ] 5.5 Implementar registro manual de comunicación/confirmación por teléfono, WhatsApp o email con fecha/actor/respuesta/versión y snapshot de términos, sin envío automático.
- [ ] 5.6 Implementar invalidación/reconfirmación ante cambios de tarifa o modalidad y distinguir reserva operativa, trabajo completado e importe pendiente de nueva aceptación.
- [ ] 5.7 Implementar conversión idempotente de solicitud confirmada a única Move con fecha/hora obligatorias, contacto/direcciones y duración estimada.
- [ ] 5.8 Implementar lista/detalle de Moves, programación/reprogramación lunes-sábado a cualquier hora, zona Miami y solapamientos permitidos sin asignaciones ni reconfirmación por horario.
- [ ] 5.9 Implementar inicio/finalización con fecha/hora completas y cálculo de duración incluyendo pausas y trayecto entre viviendas, con validación de orden/cruces de fecha.
- [ ] 5.10 Implementar registro manual de millas reales de ida, redondeo hacia arriba y cierre por los tres roles con sincronización de estados y conservación del estimado.
- [ ] 5.11 Implementar correcciones poscierre solo ADMIN/MANAGER y visualización del historial anterior/nuevo/actor/fecha para los tres roles, sin motivo obligatorio.
- [ ] 5.12 Completar revisión tras reactivación y vuelta a programación sin duplicar Move/cotización ni restaurar automáticamente condiciones canceladas.
- [ ] 5.13 Probar todos los ejemplos de cálculo, límites, ajustes de equipo/tarifa, permisos de DISPATCHER, snapshots ante cambio global y actualización concurrente de cotizaciones.
- [ ] 5.14 Probar flujo local y por millas de solicitud → aprobación → comunicación → confirmación → programación → ejecución → cierre → corrección, y cancelación/reactivación; ejecutar lint, typecheck y pruebas relevantes y corregir antes de avanzar.

## 6. Fase 6 — Verificación final y entrega preparada para desplegar

- [ ] 6.1 Revisar responsive, teclado, foco, validaciones y estados loading/empty/error/success en todos los flujos, español e inglés.
- [ ] 6.2 Ejecutar integración de RLS y llamadas directas REST/RPC, perfiles desactivados, secretos fuera del cliente, upload inválido, idempotencia y fallos parciales DB/Storage.
- [ ] 6.3 Preparar build/start filtrados para dos servicios Seenode, puertos/host adecuados y configuración de URLs web/admin por entorno; verificar compatibilidad real del runtime.
- [ ] 6.4 Completar README de instalación, Supabase, variables, migraciones, seed, usuarios, SMTP, desarrollo, pruebas, build y mantenimiento de archivos temporales.
- [ ] 6.5 Documentar despliegue Seenode/Cloudflare con dominio/subdominio pendientes, TLS, redirects, bootstrap ADMIN, respaldo/rollback y separación de datos ficticios.
- [ ] 6.6 Documentar pendientes manuales de lanzamiento: logo/colores, teléfono/email reales, dominio, SMTP y acceso autorizado a servicios; no presentar mocks como producción.
- [ ] 6.7 Ejecutar desde entorno limpio lint, typecheck, suite completa y production builds de web/admin; registrar resultados y corregir todos los fallos verificables.
- [ ] 6.8 Arrancar ambos builds de producción y verificar recepción, login y flujo operativo esencial contra entorno de prueba, sin datos reales ni cambios no autorizados en servicios remotos.
- [ ] 6.9 Revisar trazabilidad contra las ocho specs y entregar estado real, instrucciones y cualquier limitación de validación pendiente; no desplegar automáticamente por haber completado la implementación.

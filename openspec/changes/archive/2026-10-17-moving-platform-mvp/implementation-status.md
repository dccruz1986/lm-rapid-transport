# Estado de implementación

Actualizado: 2026-10-13. Cambio moving-platform-mvp, esquema spec-driven.
Progreso: **64/64 tareas**. Implementación y verificación local completadas.
No desplegado; la configuración y validación del entorno remoto siguen siendo
pasos manuales de lanzamiento. El cambio todavía no está archivado.

## Implementado en esta reanudación

- Fase 4 cerrada: fotos privadas, detalle móvil y borrado de notas verificados.
- Tarifas generales ADMIN/MANAGER, mínimo e historial; snapshots conservados.
- Cotización individual, cálculo servidor/vista previa, aprobación, comunicación
  manual con snapshot y confirmación de condiciones vigentes.
- Invalidación/reconfirmación de tarifas, conservación de reserva y distinción
  del importe aceptado frente al revisado pendiente después del cierre.
- Programación idempotente, inicio, mediciones, cierre, correcciones restringidas,
  historial y reactivación con revisión sin duplicar Move.
- Fechas Miami con offset explícito y rechazo de horas inexistentes por DST.
- Diálogo HTML para completar/corregir; confirmación, cancelación con Escape y
  devolución del foco verificadas en navegador.
- Corregidos los márgenes laterales públicos: padding-block conserva el padding
  del contenedor en secciones y encabezado móvil. Etiqueta Rol/Role traducida.
- Build separado y arranque Node, README Seenode/Cloudflare, SMTP, bootstrap,
  mantenimiento, respaldo, rollback y configuración manual de lanzamiento.

## Evidencia ejecutada

- Biome: 103 archivos sin problemas; TypeScript de raíz y ambas apps correcto.
- 17 pruebas unitarias de validación, precios, calendario y DST.
- 114 pruebas SQL en seis archivos: permisos, recepción, invitaciones, métricas,
  tarifas, cotización, ejecución, cierre y reactivación; usan ROLLBACK.
- 8 comprobaciones de concurrencia real por API: una edición gana, otra recibe
  CONFLICT y conversiones simultáneas devuelven una sola Move; fixtures limpiados.
- 24 comprobaciones de Auth/Mailpit/Storage, repetidas satisfactoriamente.
- 37 comprobaciones de recepción contra producción en puerto 3100.
- 15 comprobaciones HTTP de producción: rutas públicas y privadas, Auth,
  redirección anónima sin datos y 41 assets sin claves locales elevadas.
- Ambos builds correctos; ambos arrancaron bajo Node en 3100/3101.
- Instalación desde lockfile en copia sin node_modules ni cachés: lint, typecheck,
  17 unitarias y ambos builds correctos. Copia temporal eliminada.
- Navegador: cotización local de 357 USD, aprobación, aceptación manual,
  programación e inicio verificados. Cierre observado en 476 USD; corrección
  interactiva en producción a 4 h 40 min verificada en 595 USD e historial.
- Producción, flujo PER_MILE completo desde cotización hasta cierre: 25,2 millas
  estimadas a 4 USD = 104 USD; 27,2 reales = 112 USD. Solicitud LM-001029.
- Producción, recepción pública interactiva LM-001030: validación vacía enfoca
  primer campo; cambio ES/EN conserva datos; tres pasos y confirmación correctos;
  nueva solicitud visible en dashboard. Login, logout y error de credenciales
  inválidas comprobados; mensajes ES/EN.
- Revisión visual móvil (390 px) y escritorio: formularios públicos, detalles,
  cotización/mediciones, diálogo, tarifas, personal, clientes, agenda y resumen.
  Estados de carga, búsqueda vacía, error de acceso y éxito observados. Revisión
  de código complementaria de errores generales, aria-invalid, alert/status y
  focus-visible; los errores de infraestructura no se forzaron desde navegador.
- Tras las correcciones: Biome 103 archivos, ambos builds (incluyen TypeScript),
  arranque Node y 15 comprobaciones smoke finales correctos. No se repitieron
  las suites SQL/API sin cambios de lógica o esquema.
- Capturas locales en .local/production-reception-mobile.jpg y
  .local/services-mobile-reviewed.jpg (evidencia ignorada por Git).

## Recuperación del navegador

La revisión automática volvió a permitir operaciones de navegador. No había
diálogo JavaScript activo. Una pestaña nueva de producción permitió completar
las pruebas pendientes por las APIs autorizadas, sin eludir la revisión.

## Limpieza y servicios

Contacto provisional aprobado el 2026-10-13: +1 (305) 981-2778 y
86adrianlopez@gmail.com. Configurado en CONTACT_PHONE/CONTACT_EMAIL del entorno
local y plantilla; logo y colores finales pendientes. No configura SMTP.

La cuenta ADMIN ficticia ui-fixture@example.test fue eliminada de Auth y se
verificó respuesta 404. Sus notas/comunicaciones/historiales de prueba se retiraron
antes de borrar el perfil. Solicitudes y mudanzas ficticias locales se conservan,
con sus snapshots; es limpieza de fixtures, no un procedimiento de producción.

Docker/Supabase funcionan. Desarrollo se inició en 3000/3001 y producción en
3100/3101. No se ejecutaron migraciones remotas, invitaciones reales, despliegues
ni commits. Marca/contactos/dominio/SMTP y acceso remoto quedan como configuración
manual de lanzamiento documentada en README.

## Trazabilidad

| Spec | Evidencia | Pendiente |
|---|---|---|
| public-site | Cinco páginas, idiomas, HTTP y revisión visual | Configuración real de marca/contacto |
| request-intake | Formulario, cuotas, imágenes, 37 pruebas y recepción interactiva | Ninguno local |
| staff-access | Auth/perfiles/permisos/invitaciones SQL/API, login/logout navegador | SMTP y acceso remoto |
| request-customer-management | Listas, edición, notas y reactivación SQL/navegador | Ninguno local |
| quote-pricing | Tarifas, snapshots, cálculo, correcciones SQL/concurrencia/navegador | Ninguno local |
| move-operations | Programación, mediciones y cierre en producción local | Ninguno local |
| operations-dashboard | Métricas, filtros, vacíos y recepción reciente | Ninguno local |
| secure-platform-delivery | RLS, builds limpios, Node, assets y README | Despliegue remoto no ejecutado |

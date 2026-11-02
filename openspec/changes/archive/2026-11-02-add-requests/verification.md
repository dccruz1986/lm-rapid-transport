# Verificación de add-requests

Fecha: 2026-11-01. Entorno: Supabase local, admin localhost:3001.

## Resultados

- Typecheck de raíz, web y admin correcto; build de producción de admin correcto, incluida /requests/new.
- 50 pruebas unitarias, 121 aserciones: contacto, fechas, campos territoriales manipulados y fallback del cargador compartido cuando falta clave Google.
- Suite SQL completa: 157 comprobaciones correctas inicialmente. Se añadieron después tres comprobaciones de rollback; las 20 comprobaciones de admin-requests pasan con la versión final de la función (160 comprobaciones combinadas).
- Prueba concurrente real con seis conexiones autenticadas: mismo UUID devuelve una sola solicitud; dos UUID distintos con el mismo teléfono crean dos solicitudes y un cliente compartido.
- RPC autorizada para ADMIN/MANAGER/DISPATCHER; denegación a anónimo, perfil inactivo incluso al reintentar, y permiso revocado. Contacto previo no sobrescrito. Conflicto ante contenido diferente y rollback tras fallo inyectado posterior a crear direcciones/cliente.
- Navegador: ADMIN creó LM-001054 en español con selección Google y sin correo/fecha; DISPATCHER creó LM-001066 en inglés y móvil con ZIP manuales; MANAGER creó LM-001067. Los tres llegaron al detalle NEW con revisión territorial pendiente, sin aprobación ni programación automática.
- Lista verificada con botón Nueva solicitud y aparición de alta; cancelar vuelve a la lista sin guardar. Teléfono inválido conserva campos. Selecciones Google permanecen tras editar contacto. Selección 10001 / New York bloqueó envío; corregir a 33147 permitió continuar.
- Revisión visual desktop y móvil 390 px, ES/EN. Evidencia local ignorada: .local/ui-review/add-requests-desktop.png y add-requests-mobile.png.

## Alcance y límites

- Se reutiliza la selección Google solo para ayudar a capturar texto: no se confía en información del navegador como verificación territorial. El detalle conserva la revisión comercial existente.
- Indisponibilidad de Google comprobada mediante pruebas del cargador compartido; no se provocó una caída real del proveedor en navegador. No se realizó auditoría con lector de pantalla ni otros motores de navegador.
- Fixtures sintéticos de UI y concurrencia permanecen en la base local. La cuenta sintética está descrita en .local/manual-request-ui.json, ignorado por Git. No se enviaron correos.
- Migración aplicada únicamente localmente. Para producción, aplicar 20261101000100_admin_requests.sql antes de desplegar admin. No se hizo push, despliegue ni archivado.

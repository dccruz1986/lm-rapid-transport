# Verificación de web-admin-ui — 2026-10-27

## Implementación

Identidad naranja/blanco conservada. Tokens de color, espacio y familias de sistema; se utiliza el fallback tipográfico previsto, sin descargar ni redistribuir fuentes. Estilos de composición acotados a public-app y admin-app. Portada, navegación, pie legal, formulario, shell, dashboard, tablas, formularios administrativos y resultados finales adaptados. Navegación por etapas y acceso directo al proceso desde la cabecera de la solicitud. Sin cambios en APIs, cálculos, permisos o migraciones.

La revisión detectó que la validación anidada de ubicación no mostraba mensajes por campo. La presentación ahora reutiliza partialLocationSchema para mostrar el error asociado y conserva la validación de envío existente. Verificado en navegador: dos ubicaciones vacías muestran sus mensajes; corregir los ZIP permite avanzar.

## Comprobaciones

- 48 pruebas unitarias, 108 aserciones: correctas.
- Integración del formulario local: 12 comprobaciones correctas; crea fixture LM-001049 (datos sintéticos), que queda disponible localmente.
- Integración local de autenticación, permisos y Storage: 24 comprobaciones correctas; correo de prueba capturado en Mailpit, sin entrega externa.
- Suite SQL local: 140 pruebas correctas, incluidos permisos y workflow de cotización/mudanza.
- Typecheck raíz, web y admin: correcto. Builds de ambas aplicaciones: correctos.
- Biome en archivos modificados: sin errores ni advertencias; cuatro sugerencias informativas de template literals preexistentes en request-form.tsx.
- Contraste calculado: texto principal/blanco 16.69:1, secundario/blanco 6.75:1, acción oscura/blanco 6.53:1 y borde de control/blanco 3.91:1. Se ajustó a negro el texto pequeño sobre el naranja de la ilustración. Movimiento reducido definido en CSS.

## Revisión en navegador

- Portada: comparación visual, escritorio 1440 px y móvil 360 px.
- Formulario: pasos Ubicación/Detalles/Contacto, entradas sintéticas, retroceso con ZIP conservados, cambio ES→EN con nombre/teléfono conservados, corrección de errores; revisión a 360 y 768 px.
- Admin: dashboard/listas, tarifas y personal; detalle de cotización sintética LM-001032 y mudanza completada sintética LM-001029. Revisión a 360, 768 y 1440 px.
- Cambio de idioma del detalle conserva direcciones y ambos marcadores del mapa. No se editaron ni guardaron registros operativos existentes mediante navegador.
- Enlace a la etapa 3 lleva al formulario de comunicación; cotización aprobada señala comunicación/aceptación como siguiente etapa. Resultado final muestra importe, duración y horarios legibles en móvil y escritorio.
- Recuperación: navegación por Tab hasta la acción con foco solid visible; no se envió correo desde ese formulario.
- Services, About, Contact, Privacy, Terms, Customers y Moves: revisión móvil sin desbordamiento de página (ancho de documento 345 px dentro del viewport de 360 px). Tablas y navegación conservan desplazamiento contenido.
- Estados de carga observados durante navegación, vacíos de fotos/historial y errores de formulario revisados; éxito y restricciones de operaciones cubiertos por las pruebas existentes de integración/SQL.

## Evidencia local

Capturas en `.local/ui-review/` (ignoradas por Git para no incluir datos administrativos en el repositorio):

- `before-web-desktop.png`, `before-admin-desktop.png`, `before-admin-mobile.png`: baseline previo a la edición. El baseline web usa el ancho inicial del panel (~876 px); el archivo `before-web-mobile.png` conserva ese mismo ancho, no constituye evidencia a 360 px.
- `after-web-1440.png`, `after-web-360.png`: nueva portada.
- `after-form-360-en.png`, `after-form-768-en.png`, `after-validation-360.png`: formulario y errores.
- `after-requests-360.png`, `after-workflow-360.png`, `after-workflow-1440-en.png`: listas y proceso.
- `after-results-1440-en.png`, `after-results-360-en.png`: resultados.
- `after-settings-768.png`, `after-auth-360.png`: tarifas y recuperación.

## Ajustes posteriores solicitados antes del archivo

- Títulos públicos: Segoe UI en lugar de Arial Narrow, peso 600 y espaciado menos cerrado. Captura: `.local/ui-review/typography-updated.png`.
- Contacto del formulario: fondo naranja suave, borde y teléfono de mayor tamaño conservando tel:. Captura: `.local/ui-review/contact-highlight.png`.
- Navegación lateral: enlaces Next.js Link y loading.tsx dentro del grupo staff para conservar el layout durante la navegación; sidebar sticky con altura del viewport y desplazamiento propio. En móvil conserva altura automática acotada. Typecheck admin correcto; comprobación visual al final de una lista larga con sidebarTop=0. Captura: `.local/ui-review/admin-sticky-sidebar.png`.

## Alcance de la revisión

Revisión realizada con el navegador integrado Chromium; no se ejecutó una auditoría con lector de pantalla ni una matriz Safari/Firefox. El recorrido operativo se comprobó con fixtures e integración/SQL, sin repetir todos los envíos desde la UI ni modificar cotizaciones de personas reales. Las capturas iniciales son de portada y dashboard; los detalles tienen evidencia posterior. No se desplegó ni archivó el cambio.

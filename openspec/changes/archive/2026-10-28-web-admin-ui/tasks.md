## 1. Inventario y base visual

- [x] 1.1 Revisar frontend-design, capturar web/admin actuales e inventariar rutas, controles y estados antes de editar.
- [x] 1.2 Implementar tokens compartidos, escala tipográfica y fuentes locales con licencia verificada o fallback documentado; comprobar contraste.
- [x] 1.3 Unificar botones, campos, mensajes y estados en @lm/ui, acotando selectores públicos y administrativos sin cambiar contratos.

## 2. Web pública

- [x] 2.1 Rediseñar cabecera, navegación móvil y pie preservando logo, contacto e idioma.
- [x] 2.2 Aplicar composición de portada y adaptar Services, About y Contact con contenido real; armonizar Privacy y Terms.
- [x] 2.3 Mejorar presentación del formulario de tres pasos, validaciones y confirmación preservando LocationField, valores y ausencia de precio automático.

## 3. Administración

- [x] 3.1 Adaptar shell, navegación y pantallas de login, recuperación y contraseña con estados y foco consistentes.
- [x] 3.2 Mejorar jerarquía del dashboard y listas de solicitudes, clientes y mudanzas, conservando métricas, filtros y paginación.
- [x] 3.3 Organizar detalle de solicitud en información, cotización, comunicación, aceptación y programación, mostrando siguiente acción y contexto de reapertura según estado/permisos.
- [x] 3.4 Adaptar detalle de clientes, edición de información y recorrido sin reiniciar selecciones ni resolver de nuevo direcciones por rerenders visuales.
- [x] 3.5 Destacar horarios, horas trabajadas e importe final en detalle de mudanza, diferenciando duración y unidades facturables cuando aplique.
- [x] 3.6 Homogeneizar ajustes de tarifas y usuarios, incluidos estados de invitación y errores, preservando permisos y acciones existentes.

## 4. Verificación y crítica

- [x] 4.1 Revisar a 360/768/1440 px y en ES/EN; documentar capturas antes/después de portada, formulario, lista, detalle operativo y resultado final.
- [x] 4.2 Verificar teclado, foco, contraste, movimiento reducido y estados loading/empty/error/success; corregir desbordamientos y controles ocultos.
- [x] 4.3 Comprobar solicitud y workflow administrativo con datos sintéticos: errores, cambio de idioma, mapas estables, conservación de borradores y restricciones por estado/rol.
- [x] 4.4 Ejecutar tipos, builds de web/admin y pruebas existentes relevantes; registrar resultados y limitaciones reales en verification.md.

## Context

RequestForm recoge contacto antes que ubicaciones y exige detalles operativos. requestSchema y la transacción de intake exigen dirección completa, nombre/apellido, pisos y elevadores. Ocultar campos y enviar valores inventados no satisface la propuesta. La decisión del usuario amplía LOCAL a todo Miami-Dade; las cotizaciones actuales conservan sus condiciones.

## Goals / Non-Goals

**Goals:** tres pasos breves inspirados en las imágenes, entrada por ZIP/dirección, integración Google lista por configuración, clasificación por condado y datos parciales honestos que el admin pueda completar.

**Non-Goals:** precio público automático, estimar horas de trabajo, calcular trayectos/millas mediante Routes API, contratar Google Cloud, introducir claves reales o cambiar precios históricos automáticamente.

## Decisions

1. **Flujo visual.** Ubicación: dos campos grandes y sugerencias; Detalles: fecha opcional y tamaño; Contacto: nombre completo, email opcional y teléfono. Botones Continuar/Atrás y Solicitar cotización en el envío final; número de solicitud solo tras commit. Mantener ES/EN, logo, naranja/blanco y teléfono configurado. Datos adicionales/fotos opcionales en sección plegable del paso Detalles. No copiar marketing ni consentimientos del sitio de referencia.
2. **Modelo de recepción parcial.** Añadir full_name preservando texto del cliente; conservar first_name/last_name históricos y permitir ausencia en nueva recepción, sin dividir nombres por espacios. Lectura admin usa full_name o composición histórica. Guardar move_size explícito (STUDIO, BEDROOMS_1..4, BEDROOMS_5_PLUS, OFFICE, COMMERCIAL); 5+ no es exactamente 5. HOUSE/APARTMENT queda sin determinar cuando solo hay tamaño residencial. Hacer nulos calle/unidad, pisos, elevadores, equipo y detalles no informados; guardar ZIP/entrada del usuario, precisión ADDRESS/POSTAL_CODE/MANUAL, place_id si existe y estado de resolución. Adaptar validadores públicos separados de validación operativa del admin, RPC y tipos; nunca escribir ZIP en street ni inventar false/0.
3. **Google en navegador y verificación servidor.** Por petición del usuario, cargar Places con @googlemaps/js-api-loader y NEXT_PUBLIC_GOOGLE_MAPS_API_KEY restringida por HTTP referrer. AutocompleteSuggestion obtiene sugerencias directamente y fetchFields completa la sesión al seleccionar. El servidor conserva Place Details/Geocoding con GOOGLE_MAPS_SERVER_API_KEY privada para verificar condado y firmar el resultado. Son consultas independientes; documentar cuotas y posibles cargos adicionales. Sin claves se admite entrada manual. Habilitar Maps JavaScript API, Places API (New) y Geocoding API.
4. **Búsqueda.** Debounce aproximado de 300 ms, mínimo 3 caracteres, cancelación/identificador de última consulta; sesión de búsqueda por interacción según contrato Google, campos mínimos, timeout y cuotas persistentes globales y por origen. Sugerencias en EE. UU. sesgadas a Florida; validar US/FL al resolver, pues el sesgo no es un control territorial. Para ZIP de cinco dígitos preferir resultado postal exacto, no calles cuyo número coincide. Edición posterior invalida selección previa. Mostrar atribución Google requerida y controles accesibles de teclado. El servidor revalida place_id/resultado y firma un token breve ligado a los datos para evitar confiar en condado/modo enviados por cliente.
5. **Clasificación.** Verificar país/estado y administrative_area_level_2 en respuesta del servidor. Dos extremos inequívocos en Miami-Dade → sugerir LOCAL; uno inequívoco fuera dentro de FL → PER_MILE. ZIP es ubicación aproximada: la sugerencia se identifica como provisional y se confirma con dirección completa antes de aprobación comercial. Componentes faltantes, resultados contradictorios o ZIP que no permiten una decisión única → NEEDS_REVIEW, sin asignar LOCAL por defecto ni deducir límites de centroides. Texto postal «Miami» no decide condado. Si se requiere resolver un caso fronterizo, el personal confirma dirección/condado en el admin.
6. **Integración operativa.** Guardar sugerencia territorial, origen de la decisión y estado de revisión en solicitud, separado de quote.mode. Nueva cotización adopta sugerencia verificable; si no existe, requiere elección explícita y verificación del personal antes de aprobar. Mostrar resumen y campos pendientes en detalle/listados/clientes sin errores por nulos. Exigir ambas direcciones completas y revisión territorial resuelta antes de aprobar/programar; permitir recepción inicial por ZIP. Cambiar ubicaciones invalida resolución y exige revisar modalidad; cambios en cotizaciones existentes usan reaprobación/reconfirmación actual, nunca mutación silenciosa de snapshots.
7. **Contenido Google y privacidad.** Conservar input aportado por usuario y place_id; no almacenar respuestas completas, sugerencias ni coordenadas indefinidamente. Revisar políticas vigentes para cada dato derivado y documentar retención/expiración permitida antes de persistir; revalidar decisiones vencidas. No registrar claves, búsquedas o direcciones en logs ordinarios. Incorporar aviso de uso de Google y enlaces legales necesarios sin agregar consentimiento de marketing inventado.

## Risks / Trade-offs

- ZIP puede ser ambiguo → sugerencia provisional y revisión explícita; no prometer clasificación definitiva solo por código.
- Servicio caído, cuota o clave inválida → conservar entrada, permitir solicitud manual pendiente de verificación; rechazar ubicaciones inequívocas fuera de Florida.
- Ampliar nulos puede romper vistas/RPC → migración aditiva, adaptación de todos los consumidores y pruebas de compatibilidad con datos históricos.
- Google requiere configuración externa → documentar APIs/facturación/restricciones; «solo poner clave» significa sin cambios de código tras configurar el proyecto Google.
- Cambio de municipio a condado → actualizar textos y fixtures sin recalcular cotizaciones existentes.

## Migration Plan

1. Añadir campos/estados y flexibilizar datos solo donde la recepción parcial lo requiere; preservar direcciones y nombres históricos y RLS. Backfill full_name/move_size solo cuando se deduce sin perder significado.
2. Desplegar validadores/RPC compatibles y consumidores admin antes de activar nueva recepción; mantener payload antiguo durante transición y nuevos campos por versión explícita.
3. Integrar proveedor y flujo, documentar variables y verificar modo sin claves y con mocks. Prueba real de Google solo con clave configurada y entorno autorizado, registrando claramente si no se realizó.
4. Rollback: desactivar formulario nuevo/proveedor, conservar registros parciales y admin compatible; no revertir migraciones destruyendo solicitudes recibidas.

## Open Questions

Sin decisiones comerciales bloqueantes: el usuario confirmó todo Miami-Dade. Clave y proyecto Google se configuran al implementar/desplegar, no durante esta propuesta.

## References

- Google Autocomplete (New): https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
- Geocoding, componentes y precisión: https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding
- Restricciones de claves: https://developers.google.com/maps/api-security-best-practices
- Atribución y almacenamiento: https://developers.google.com/maps/documentation/places/web-service/policies


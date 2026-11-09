# enhance-form — integración y verificación

## Configuración de Google

Se reutiliza `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` de admin, con `@googlemaps/js-api-loader` 2.1.3, canal `weekly`, y los tipos instalados 3.66.7. Se carga `routes` bajo demanda y se llama a `Route.computeRoutes` con origen/destino resueltos, `DRIVING`, `TRAFFIC_UNAWARE` y únicamente `distanceMeters`. No se necesita una clave privada nueva ni un endpoint de rutas.

En el mismo proyecto de Google Cloud deben estar habilitadas **Maps JavaScript API y Routes API**, además de Places API (New) y Geocoding API utilizadas por los campos existentes. La clave pública debe permitir estas APIs y estar restringida por HTTP referrer a los dominios de admin y localhost de desarrollo. Recompilar tras cambiar variables `NEXT_PUBLIC_*`. El proyecto necesita facturación habilitada; cada cálculo puede consumir cuota/facturación, incluido el reintento explícito. Configurar cuotas y alertas en Cloud; no se fija un precio en el código.

La memoria de deduplicación pertenece a la vista montada y se descarta al abandonarla. No se guarda la respuesta de Google, geometría ni coordenadas adicionales en almacenamiento persistente. El botón Guardar cotización sigue guardando la cantidad comercial aceptada por el operador mediante el RPC existente; no es un caché de rutas y no actualiza mediciones reales. Mantener los avisos/atribución de Google Maps y las políticas de privacidad/términos de la aplicación conforme al acuerdo de Google del proyecto. La política de Google restringe almacenar contenido de rutas; no ampliar la persistencia sin revisar ese acuerdo.

Fuentes oficiales consultadas el 2026-11-05:
- [Configuración de Routes Library](https://developers.google.com/maps/documentation/javascript/routes/start)
- [Solicitud de rutas con coordenadas](https://developers.google.com/maps/documentation/javascript/routes/get-a-route)
- [Referencia Route](https://developers.google.com/maps/documentation/javascript/reference/route)
- [Políticas y atribución](https://developers.google.com/maps/documentation/routes/policies)

## Contrato

Solo un punto resuelto y compatible con US/FL aporta evidencia de condado. Componentes ausentes, múltiples o resultados ambiguos quedan pendientes. Los puntos ZIP son provisionales; la sugerencia no marca condados verificados ni revisión territorial. Dos Miami-Dade sugieren LOCAL, uno o dos otros condados de Florida sugieren PER_MILE. Un extremo sin resolver impide calcular rutas. La clave incluye identidades ordenadas, coordenadas, precisión, condados y revisión, y las respuestas de una vista/recorrido anterior no se aplican.

Solo se acepta distancia positiva, finita, hasta 10 000 millas y que siga siendo positiva al redondear a un decimal. Se convierte con 1609.344 metros/milla. Timeout de ocho segundos por operación. Fallos conservan entrada manual y permiten reintento; no hay sustitución por línea recta.

El borrador separa horas y millas, y distingue valores vacíos, sugeridos, manuales y guardados. Valores automáticos obsoletos se limpian; manuales/guardados se conservan con aviso. Las cotizaciones guardadas y modos/tarifas elegidos manualmente no cambian automáticamente.

## Resultados

- Typecheck de paquetes, web y admin: aprobado.
- Build de admin: aprobado.
- Pruebas focalizadas: 25 aprobadas, 88 aserciones (enhance-form, map-value, pricing, admin-request).
- Navegador real, solicitud sintética local LM-001067: ZIP 33147 + 33016 seleccionan LOCAL, 3 h, tarifa configurada 119 USD/h; cambiar destino a ZIP 33407 selecciona PER_MILE, 4 USD/milla, sin reutilizar las 3 horas. Condados verificados y revisión territorial siguen sin marcarse. Google no devolvió distancia: se mostró error/reintento y el campo siguió editable. No se guardaron cambios sobre esa solicitud.
- Banco de navegador con el hook y reconciliador reales, proveedor simulado: cambiar A:B a A:C antes de responder A:B descartó sus 100 millas; introducir 205 manuales conservó 205 cuando A:C devolvió 200. Cambiar idioma y rerender mantuvo dos consultas. Aplicar sugerencia y cambiar A:C a A:D limpió la cantidad automática. Un error mantuvo campo vacío; el reintento devolvió y precargó 300.0. El timeout se prueba separadamente en la prueba unitaria.
- Pendiente 3.4: completar el recorrido con respuesta real de Google, ajuste y guardado cuando Routes esté disponible para la clave/proyecto. No se declara validado ese tramo ni se marca la tarea como completada.
- Diagnóstico final en navegador: fallo de autorización de Google, mostrado como «Google no autoriza esta consulta de rutas». Se solicitó habilitar Routes API y permitirla en las restricciones de la clave actual.
- Integración Supabase local con usuario de pruebas existente: solicitud sintética `74f6a7ea-80cc-4b90-ba90-b952e0bd80f9`, nombre `TEST enhance-form persistence`. `save_quote` guardó 205.7 millas y se recuperó el valor; una segunda escritura con versión vigente lo cambió a 210. Estado ESTIMATED y cero filas de mudanza: sin aprobación, mediciones reales ni comunicaciones. Se conserva como fixture local.

## Cierre de verificación real — 2026-11-05

Tras habilitar Routes API, Google devolvió 69.6 millas entre ZIP 33147 y 33407 en la solicitud sintética LM-001080. La cantidad guardada de 210 no fue sobrescrita. En el navegador se pulsó Usar distancia sugerida (69.6), se ajustó manualmente a 70 y se guardó. El formulario recuperó 70 y mostró Estimación guardada: 280 USD, tarifa 4 USD/milla, con historial 210 → 70. No se aprobó ni comunicó la cotización. Queda resuelta la limitación de autorización indicada anteriormente y completada la tarea 3.4. Evidencia local: .local/enhance-form-verified.png.


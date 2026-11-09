## 1. Integración y contrato

- [x] 1.1 Verificar documentación oficial de rutas Google y compatibilidad con el SDK instalado; elegir API y documentar activación, claves, restricciones, facturación y retención.
- [x] 1.2 Definir evidencia territorial y estado de sugerencia por pareja de ubicaciones, distinguiendo resolución exacta, ZIP provisional, incertidumbre y fuera de cobertura.

## 2. Cálculo y formulario

- [x] 2.1 Implementar distancia por carretera de ida solo para pares no locales elegibles, conversión a millas, timeout, validación, deduplicación y reintento.
- [x] 2.2 Compartir sugerencia entre mapa, revisión territorial y cotización; invalidar al cambiar puntos e ignorar respuestas antiguas sin verificar territorio automáticamente.
- [x] 2.3 Preseleccionar modalidad y tarifa configurada en cotizaciones nuevas sin edición manual; preservar cotizaciones guardadas y mostrar discrepancias para revisión explícita.
- [x] 2.4 Precargar Millas estimadas cuando corresponda, permitir Usar distancia sugerida y ajustes manuales; separar horas, millas estimadas y reales.
- [x] 2.5 Mostrar precisión y estados de carga/error en ES/EN; conservar guardado, permisos, versión y reconfirmación existentes.

## 3. Verificación

- [x] 3.1 Probar ambos extremos en Miami-Dade, uno o ambos fuera dentro de Florida, ZIP ambiguo, extremo pendiente y ubicación fuera de cobertura.
- [x] 3.2 Probar distancia, conversión, límites, ausencia de ruta, fallo de credenciales/timeout, reintento y descarte de resultados tardíos.
- [x] 3.3 Probar cantidad manual durante consulta, cambios de recorrido/modo, cotización existente, tarifa configurada y separación de mediciones reales; comprobar que rerenders e idioma no duplican consultas.
- [x] 3.4 Validar en navegador el recorrido completo con sugerencia, ajuste y guardado; ejecutar typecheck, pruebas afectadas y build, y registrar resultados y configuración necesaria.

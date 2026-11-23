## 1. Persistencia

- [x] 1.1 Crear migración para conversaciones, mensajes únicos y cola de salida con acceso exclusivo del servidor.
- [x] 1.2 Implementar bloqueo por conversación y transición atómica de paso, respuestas y salida pendiente.

## 2. Webhook y preguntas

- [x] 2.1 Configurar la Edge Function, desafío GET y verificación de firma sobre bytes originales.
- [x] 2.2 Filtrar número receptor y estados, recorrer lotes y registrar mensajes duraderamente antes del acuse.
- [x] 2.3 Implementar preguntas estáticas, validaciones compartidas, repetición del paso inválido y resumen editable.
- [x] 2.4 Implementar envío mediante Cloud API y recuperación de fallos transitorios desde la cola.

## 3. Alta de la solicitud

- [ ] 3.1 Mapear respuestas al contrato de intake, conservar precisión territorial y finalizar con clave estable.
- [x] 3.2 Vincular borrador y solicitud y enviar la referencia recuperable tras confirmar el alta.

## 4. Verificación y operación

- [ ] 4.1 Probar desafío, firma alterada, lotes, estados, repetidos y concurrencia.
- [ ] 4.2 Probar flujo completo, datos inválidos, corrección, reinicio y fallos de persistencia y envío.
- [ ] 4.3 Documentar secretos, configuración de la suscripción y recuperación de la cola. Verificar con el número de prueba que la referencia recibida identifica una sola solicitud en admin.

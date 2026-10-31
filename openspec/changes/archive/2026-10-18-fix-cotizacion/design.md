## Context

Según proposal.md, el fallo ocurre en QuoteEditor: los selectores actualizan mode/workers, pero ejecutan setRate solo bajo `if (!quote)`. El formulario ya recibe pricing_settings y dispone de rateFor, conversión centavos/USD, edición manual y vista previa calculada desde rate. La inicialización usa correctamente el snapshot de quote.rate_cents.

## Goals / Non-Goals

**Goals:** actualizar tarifa y vista previa ante selección explícita de equipo o modalidad, con configuración real, preservando snapshots al abrir y validación al guardar.

**Non-Goals:** cambiar fórmulas, permisos, mínimos, estados comerciales, esquema DB o aplicar retroactivamente cambios globales a cotizaciones guardadas.

## Decisions

- Reutilizar rateFor y quitar la restricción de cotización nueva en ambos manejadores. Cada manejador usará el nuevo valor del evento y el otro selector vigente para evitar leer estado anterior. No se codificarán 119/145/165/4 como constantes.
- Mantener la inicialización desde quote.rate_cents. Se descarta un efecto reactivo general sobre settings porque podría reemplazar un snapshot o una tarifa manual sin una selección del usuario.
- La selección reemplaza cualquier ajuste manual previo; después la tarifa sigue siendo editable. PER_MILE carga settings.per_mile para cualquier equipo. Cambiar modalidad también carga la tarifa configurada correspondiente para evitar conservar un importe con unidades equivocadas.
- La selección solo cambia el formulario. Guardar utiliza saveQuote y su validación/concurrencia/reconfirmación existentes; no se añade persistencia automática ni se modifica el mínimo copiado.
- Usar la configuración recibida al cargar la pantalla. Refrescar para cargar cambios realizados en Configuración desde otra sesión; no añadir suscripciones ni llamadas por selección.

## Risks / Trade-offs

- Un cambio de equipo sustituye una tarifa personalizada → comportamiento explícito de selección; permitir editarla de nuevo antes de guardar y verificarlo en la revisión funcional.
- Un refresco de configuración podría alterar snapshots → conservar inicialización desde la cotización y evitar efectos automáticos.
- Confundir tarifa por hora con tarifa por milla → cubrir cambios de modalidad en ambas direcciones y vista previa.

## Migration Plan

Desplegar el cambio de interfaz con las comprobaciones del admin aprobadas. No requiere migración ni modificación de datos existentes. Revertir el cambio del componente permite rollback.

## Open Questions

Ninguna que bloquee la implementación.

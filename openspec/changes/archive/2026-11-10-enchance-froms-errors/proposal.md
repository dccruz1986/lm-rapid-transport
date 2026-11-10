## Why

Varios formularios administrativos muestran errores de valores al final del formulario y descartan el campo concreto que falló. El usuario debe buscar qué corregir; web y el alta manual ya ofrecen algunos mensajes locales, pero su cobertura y accesibilidad no son uniformes.

## What Changes

- Revisar todos los formularios de web y admin y registrar sus campos, validaciones, errores de servidor y errores generales.
- Mostrar cada error atribuible a una entrada junto al control correspondiente, con mensaje específico en español e inglés y asociación accesible.
- Conservar en su ubicación actual los avisos generales de permisos, sesión, conflictos, transiciones y servicios no disponibles.
- Transportar errores estructurados de campo desde validaciones y acciones sin exponer mensajes internos ni asignar un error genérico a un campo arbitrario.
- Guiar al primer campo inválido, incluso en pasos o secciones cerradas, preservar valores y retirar errores obsoletos al corregir o reenviar.
- Mantener las reglas de negocio, permisos, concurrencia, sugerencias de Google y confirmaciones existentes.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `frontend-experience`: presentación consistente de errores por campo y generales, navegación accesible, ciclo de corrección y cobertura de todos los formularios.

## Impact

Componentes de formularios de ambas aplicaciones, FormResult/ResultNotice y contratos equivalentes de autenticación y alta, acciones de servidor, adaptadores de Zod y códigos de negocio, controles compartidos LocationField/fecha-hora, estilos y traducciones de packages/ui. Revisar endpoints de recepción pública y sus respuestas de validación. No se prevén nuevas dependencias ni migración de base de datos; los errores opacos de DB conservan alternativa general segura.

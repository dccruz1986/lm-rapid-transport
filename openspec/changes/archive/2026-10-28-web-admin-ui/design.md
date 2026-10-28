## Context

Next.js sirve dos aplicaciones con React y componentes de @lm/ui. packages/ui/src/styles.css concentra reglas globales, tipografía Arial y estilos de ambas aplicaciones. marketing.tsx combina tarjetas de servicios y una ilustración de recorrido; el admin contiene componentes específicos de workflow, listas, mapa, usuarios y ajustes. Se conserva el logo existente, contacto configurado, ES/EN y todas las reglas del negocio.

## Goals / Non-Goals

**Goals:** identidad reconocible de una empresa de mudanzas de Miami, solicitud sencilla, lectura operativa rápida, controles consistentes y uso móvil/teclado completo. Aplicar frontend-design con planificación, crítica y comprobación visual.

**Non-Goals:** cambiar precios, clasificación Miami-Dade, permisos, contratos de formularios, autenticación, correo o base de datos; añadir dark mode, analítica, animaciones decorativas o testimonios ficticios.

## Decisions

### Dirección visual y tokens

Concepto: recorrido claro desde origen hasta destino. La web usa un único motivo visual de ruta; el admin emplea secuencia solo donde hay pasos reales. Logo sin recolorear ni distorsionar, fondo blanco y acentos naranjas acotados a acciones e hitos.

Paleta base de seis valores: marca #d75523, papel #ffffff, texto #281b16, texto secundario #665950, borde #ded6d1 y acción oscura #a43b15. El naranja original se mantiene en identidad; texto blanco pequeño sobre botones usa la variante oscura tras verificar contraste. Estados de éxito, advertencia y error conservan tokens semánticos independientes y siempre incluyen texto/icono.

Tipografía propuesta: Barlow Semi Condensed en títulos de marketing, evocando rotulación de transporte, y Barlow para lectura y controles. Usar archivos locales licenciados y fallback Arial/sans-serif; si no se dispone de assets adecuados, mantener fallback sin bloquear renderizado. Escala 14/16/20/24/32/48/64 px con títulos fluidos; datos operativos con números tabulares, texto de lectura menor de 80 caracteres por línea. Espacio 4/8/12/16/24/32/48/64 px; radios 6 px para controles y 12 px para contenedores destacados, no sombras en cada bloque.

### Composición y comparación

Se consideró extender la cuadrícula de tarjetas existente a todas las pantallas. Se elige una portada asimétrica y un área de trabajo administrativa porque las tarjetas iguales diluyen la prioridad entre orientación, datos y acciones. Alineación izquierda salvo confirmaciones breves.

```text
Web desktop
[Logo               Servicios Nosotros Contacto  Idioma]
[Mudanzas en Florida / texto      Ruta origen-destino  ]
[Solicitar cotización            motivo visual único  ]
[Servicios y alcance     Cómo solicitar la mudanza     ]
[Contacto y pie                                        ]

Admin desktop
[Navegación] [Título / búsqueda / estado                ]
[          ] [Información / siguiente acción            ]
[          ] [Formulario activo      Resumen y recorrido]
[          ] [Historial / acciones secundarias          ]

Móvil
[Logo / menú / idioma]
[Título / estado]
[Contenido o formulario]
[Acción principal]
[Resumen / historial]
```

Revisión frente al brief: se eliminan las etiquetas decorativas en mayúsculas, flechas repetidas y rejillas de tarjetas como recurso universal. Se mantiene el naranja solicitado aunque la skill advierta contra paletas cálidas genéricas; aquí pertenece a la marca. No se añaden fotografías de equipos o camiones que no representen a la empresa.

### Arquitectura de estilos

Definir tokens y primitivas en @lm/ui; separar selectores públicos y administrativos mediante raíces explícitas. Mantener estilos globales solo para base, fuentes y accesibilidad. Reutilizar Button, estados y LocationField; extraer únicamente patrones repetidos de campos, cabeceras, badges y resúmenes. No añadir una librería de componentes ni reescribir formularios por estética. Preservar keys, nombres de campos, server actions y estado local para evitar reinicios de mapas, direcciones o borradores al renderizar.

### Web y formulario

Cubrir Home, Services, About, Contact, Request a Quote, Privacy y Terms con navegación y pie coherentes. El formulario conserva Ubicación → Detalles → Contacto, datos al volver y Google Places compartido. Mantener confirmación con referencia sin precio automático, teléfono y correo configurables. Dar prioridad a una acción principal por paso y mensajes junto al campo.

### Admin y progresión

Cubrir login/recuperación/contraseña, dashboard, requests, customers, moves, settings y users, incluidos detalles. Organizar solicitud en información, preparación/aprobación de cotización, comunicación, aceptación y programación conforme al estado real. Las fases posteriores deben explicar su dependencia sin habilitar operaciones prohibidas. Reabrir términos se presenta junto a la cotización, con explicación de consecuencias que corresponda a la lógica actual. Acciones destructivas quedan separadas de guardar/continuar.

El detalle de mudanza destaca llegada, finalización, horas trabajadas e importe USD, distinguiendo horas reales de unidades facturables cuando difieran. Mantener ambos puntos del recorrido en un mapa y estado Miami por defecto; no disparar nuevas resoluciones por cambios visuales. Tablas conservan filtros/paginación; móvil puede presentar filas apiladas o desplazamiento contenido con etiquetas y acciones accesibles.

## Risks / Trade-offs

- CSS compartido puede provocar regresiones cruzadas → cambios por sección, selectores acotados y capturas de ambas apps.
- Reordenar formularios puede reiniciar estado → conservar identidad React y probar cambios de idioma, validaciones y rerenders.
- Marca naranja puede tener contraste insuficiente → comprobar combinaciones; usar variante oscura para texto/acciones y preservar el color de marca en acentos.
- Flujo extenso puede quedar oculto en móvil → secuencia en una columna, estados visibles y navegación por teclado sin depender de hover.
- Fuentes nuevas pueden afectar carga → archivos locales, pesos mínimos, fallback y revisión de saltos de layout.

## Migration Plan

Capturar situación inicial y registrar inventario; introducir tokens, después web y admin por secciones. Comprobar 360/768/1440 px, ES/EN y estados vacíos/error/carga/éxito con datos sintéticos. Ejecutar tipos, builds y pruebas existentes relevantes. Revertir cambios de UI para rollback; no requiere migración de datos ni despliegue en este cambio.

## Open Questions

Ninguna decisión bloqueante. La comparación visual puede ajustar tamaños y espaciados manteniendo estos criterios. Assets tipográficos y licencia se verifican durante implementación.

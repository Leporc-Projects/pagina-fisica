# Analítica y métricas

## Objetivo y alcance

Aula Física usa una instrumentación mínima para responder una pregunta de
producto: cómo se usa el sitio de forma agregada y qué superficies públicas
conviene mejorar. No busca reconstruir la actividad de una persona, evaluar a
un estudiante ni inferir aprendizaje individual.

La V1 usa el tracker web de Umami Cloud. El `website-id` público identifica el
sitio dentro del proveedor; no es una credencial y el frontend no contiene API
keys, tokens ni secretos.

## Arquitectura

```text
navegador en aulafisica.com
  → tracker Umami limitado por dominio y Do Not Track
  → Umami Cloud
  → dashboard privado de Umami
```

El script se instala una sola vez en el layout global. `data-domains` admite
solo `aulafisica.com` y `www.aulafisica.com`; localhost, `127.0.0.1` y otros
hostnames no generan datos. Query strings y hashes se excluyen. No se envían
pageviews manuales, timestamps propios ni datos de sesión personalizados.

La aplicación no depende de Umami: el wrapper es no-op durante SSR, cuando el
tracker no carga, cuando un bloqueador lo impide o cuando el proveedor falla.

## Definiciones operativas

- **Visitor** es una estimación técnica de sesiones distinguibles de Umami; no
  es una persona identificada ni un estudiante único.
- **Visit** es una agrupación técnica de actividad; no equivale a una clase.
- **Pageview** registra una consulta de página; no demuestra lectura,
  comprensión ni aprendizaje.
- **Session duration** es una duración nativa aproximada; no es tiempo puro de
  estudio y resulta especialmente imperfecta en visitas de una sola página.
- **Event count** cuenta disparos válidos; no cuenta estudiantes.
- **Bounce** sigue la definición nativa de Umami para una visita con un solo
  evento, no una evaluación editorial de la página.

## Métricas V1

Los pageviews nativos permiten consultar visitantes estimados, visitas,
pageviews, páginas de entrada, páginas principales, referencias, dispositivo,
navegador, sistema operativo, país o región aproximados cuando estén
disponibles, rebote y duración de visita según las definiciones de Umami.

Los reportes por día, día de semana, hora, semana, mes y semestre se interpretan
en la zona `America/Bogota`. No se envían nombres de días ni agrupaciones
académicas como propiedades personalizadas.

`T0` será el primer despliegue de producción que contenga el tracker. Esta rama
local no establece `T0`: no se publica, integra ni envía tráfico de prueba.

## Eventos personalizados

| Evento | Disparador | Propiedades permitidas | Datos prohibidos |
| --- | --- | --- | --- |
| `simulation_start` | Primer inicio real por carga de una de las cuatro simulaciones públicas | `simulation`, `locale` | parámetros, valores de inputs, tiempo, trayectoria |
| `practice_new_batch` | Clic explícito en “Otros 5” / “Another 5” | `unit`, `locale` | ejercicio, respuestas, filtros, texto |
| `mini_quiz_start` | Inicio explícito de un intento | `quiz`, `locale` | preguntas, opciones, attempt ID, identidad |
| `mini_quiz_complete` | Finalización real de un intento | `quiz`, `locale` | respuestas, corrección, score, porcentaje, duración |
| `language_change` | Uso del selector de idioma | `from_locale`, `to_locale`, `route_id` opcional | URL, query, hash, referrer personalizado |

El wrapper valida nombre, conjunto exacto de propiedades, tipos, locales, IDs
estables y unidad `1..7`. Rechaza propiedades adicionales. La simulación
circular/radial archivada no se instrumenta como recurso público.

## Datos explícitamente no enviados

La instrumentación propia no envía nombres, correos, teléfonos, documentos,
IDs institucionales o estudiantiles, UUIDs propios, respuestas, resultados,
aciertos, porcentajes, prompts, texto libre, contenido de Participa, valores de
formularios, query strings, hashes ni identificadores persistentes. No usa
`identify`, cookies, `localStorage`, `sessionStorage`, fingerprinting, replay de
sesiones, heatmaps, mouse tracking, scroll depth ni heartbeat.

Umami recoge automáticamente los campos técnicos descritos por su tracker,
como URL sin query/hash, título, referrer, idioma del navegador, hostname,
información de navegador/dispositivo/pantalla y el identificador del sitio. El
proveedor puede derivar una ubicación aproximada de la IP de la petición; la
documentación de Umami indica que la IP no se almacena.

## Límites de interpretación

- DNT y los bloqueadores reducen cobertura; la ausencia de evento no prueba
  ausencia de uso.
- Una misma persona puede usar varios dispositivos, y un dispositivo puede ser
  compartido.
- Una pestaña abierta no equivale a estudio activo.
- La duración nativa es incompleta para lecturas de una sola página.
- La geolocalización técnica es aproximada y no debe interpretarse como
  residencia o pertenencia institucional.
- Las métricas agregadas no equivalen a aprendizaje.
- Correlación temporal o entre páginas y eventos no demuestra causalidad.

## Fuera de alcance

Esta V1 no incluye dashboard propio, API privada server-side, proxy, auth de
administración, exportaciones automáticas, tiempo activo, cohortes, evaluación
causal, A/B tests, Web Vitals, tracking de performance ni contador público. Una
decisión futura sobre cualquiera de estas capacidades requiere un alcance y
una revisión de privacidad separados.

## Referencias del proveedor

- [Collect data](https://docs.umami.is/docs/collect-data)
- [Tracker configuration](https://docs.umami.is/docs/tracker-configuration)
- [Tracker functions](https://docs.umami.is/docs/tracker-functions)
- [Event data](https://docs.umami.is/docs/event-data)
- [Metric definitions](https://docs.umami.is/docs/metric-definitions)

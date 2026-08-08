# Arquitectura de Papilla's Physics

Este documento explica cómo se organiza el sitio y cómo fluye la información desde los datos hasta las páginas generadas. Está dirigido a quien necesite mantener el proyecto mientras aprende Astro, JavaScript y CSS.

## Visión general

Papilla's Physics es un sitio estático construido con Astro. No tiene backend, base de datos ni estado persistente. Durante la compilación, Astro transforma los archivos `.astro` de `src/pages/` en páginas HTML dentro de `dist/`.

El flujo principal es:

```text
src/data (contenido + contrato de tema)
   ↓
componentes y páginas + withBase(import.meta.env.BASE_URL)
   ↓
BaseLayout + ThemeSelector + visualizaciones SVG + global.css
   ↓
astro build → dist → GitHub Pages
```

Esta separación evita escribir varias veces el mismo dato académico y permite cambiar contenido sin mezclarlo con la estructura visual.

## Capas del proyecto

### Datos

`src/data/` contiene estructuras JavaScript exportadas:

- `course.js`: contrato académico del curso, navegación interna, siete unidades, evaluación, bibliografía y cronograma.
- `site.js`: identidad editorial, navegación global, accesos de portada y categorías generales de simulaciones.
- `notices.js`: fuente única de avisos para la portada y `/avisos`.
- `videos.js`: contrato de metadatos de la biblioteca audiovisual.
- `theme.js`: preferencias admitidas, clave de almacenamiento y colores del navegador para cada tema efectivo.
- `physics/index.js`: registro de unidades que ya tienen implementación académica.
- `physics/unit-1/`: contrato modular de la primera unidad. Separa metadatos y rutas (`unit.js`), explicación conceptual (`content.js`), fórmulas (`formulas.js`), figuras (`visualizations.js`), errores frecuentes (`common-errors.js`) y ejercicios (`exercises.js`). `math-content.js` es una capa de presentación: asocia fragmentos literales registrados con MathML sin modificar esas fuentes.

Las rutas guardadas en datos son rutas lógicas desde `/`, no URL finales de despliegue. Esto mantiene `NAV`, `HOME_LINKS` y `COURSE_NAV` independientes de GitHub Pages. Los componentes pasan cada destino interno por `withBase()` antes de renderizarlo.

Las fuentes académicas tienen una jerarquía explícita:

- El programa oficial gobierna créditos, modalidad, horas, propósito, resultados, evaluación y bibliografía.
- El plan clase a clase 2026-2 gobierna fechas, sesiones, orden concreto, repasos y evaluaciones del semestre.
- Las siete unidades se conservan como organización vigente hasta que el profesor revise cualquier diferencia entre ambas fuentes.

Los datos de navegación no deben contener destinos inexistentes. `npm run validate` compara esas rutas con los archivos reales de `src/pages/`.

### Layout

`src/layouts/BaseLayout.astro` define el documento HTML compartido:

- metadatos y título;
- enlace para saltar al contenido;
- `Header` y `Footer`;
- elemento `main`;
- carga de `global.css`.

Antes de cargar los estilos, el layout ejecuta un script inline mínimo que
resuelve la preferencia de tema. Ese orden es intencional: permite escribir
`data-theme` en el elemento `html` antes del primer render y evita un destello
claro cuando corresponde mostrar el tema oscuro.

También resuelve el favicon con el `base` activo, del mismo modo que `Header` y la portada resuelven el logotipo.

La propiedad `fullWidth` permite que la portada controle el ancho de sus propias secciones. Las demás páginas reciben automáticamente el contenedor editorial común.

### Componentes compartidos

- `Header.astro`: marca, navegación global y diálogo de menú. Su script mantiene el foco dentro del menú, permite cerrar con Escape y devuelve el foco al control que lo abrió.
- `ThemeSelector.astro`: control reutilizable para elegir claro, oscuro o sistema. Usa radios nativos, sincroniza posibles instancias del control y emite el evento `themechange` para contenido interactivo futuro.
- `Footer.astro`: identidad personal y declaración de independencia institucional.
- `PageHeader.astro`: cabecera de páginas generales como Avisos o Simulaciones.
- `SectionHeading.astro`: encabezado `h2` reutilizable. Cuando la sección padre tiene `aria-labelledby`, debe recibir el mismo `id`.
- `CoursePageHeader.astro`: cabecera de las páginas internas del curso y composición de `CourseNav`.
- `CourseNav.astro`: navegación horizontal basada exclusivamente en `COURSE_NAV`; en pantallas estrechas revela la sección activa sin desplazar la página.
- `visualization/CartesianChart.astro`: traduce dominios, series y geometría física a un SVG cartesiano accesible y responsive.
- `visualization/AcademicDiagram.astro`: compone diagramas vectoriales y geométricos con escala física isotrópica y etiquetas posicionables.
- `visualization/AcademicVisualization.astro`: resuelve una entrada del registro central como gráfica o diagrama para que temas y ejercicios no dupliquen SVG.
- `academic/UnitTopicPage.astro`: plantilla común de las siete páginas de la Unidad 1; resuelve datos, profundidad, fórmulas, figuras, comprobaciones y navegación.
- `academic/AcademicSection.astro`, `FormulaBlock.astro`, `ConceptCheck.astro` y `CommonErrors.astro`: presentan contratos académicos reutilizables sin duplicar su contenido en las rutas.
- `academic/RichText.astro` e `InlineMath.astro`: convierten el contrato mixto texto/MathML en HTML estático; nunca interpretan entrada del navegador.
- `academic/UnitLearningMap.astro`: índice visual reutilizable. Calcula la geometría desde el orden y cantidad de temas, pero conserva los enlaces en un `ol` navegable.
- `academic/UnitOneNav.astro`: navegación local compacta alimentada por `UNIT_1.topics`; usa `details` nativo para evitar una segunda barra extensa durante la lectura.
- `academic/ExerciseCard.astro`: vista pública de un ejercicio; mantiene fuera de la interfaz los metadatos editoriales del banco.
- `academic/OpenPractice.astro`: conserva el banco público en HTML y mejora la vista con tandas locales, filtros y navegación sin progreso global.
- `src/utils/paths.js`: contrato único para convertir rutas lógicas en rutas públicas mediante `import.meta.env.BASE_URL`. Conserva anclas y URL externas sin cambios.
- `src/utils/chart.js`: núcleo matemático puro para validar dominios, crear escalas cartesianas o isotrópicas, muestrear funciones, recortar geometría y producir paths SVG.
- `src/utils/exercise-batches.js`: filtra y selecciona tandas procurando variedad de tema, tipo, representación y dificultad; no conoce el DOM ni persiste actividad.
- `src/utils/mathml.js`: constructores mínimos para producir MathML estructurado, delimitadores semánticos, etiquetas accesibles y anotaciones de texto TeX solo como metadato semántico.

Un componente se justifica cuando varias páginas comparten un contrato real. Un fragmento usado una sola vez puede permanecer en la página para evitar abstracciones innecesarias.

## Flujo de datos hacia una página

Una página importa solamente las fuentes que necesita. Por ejemplo, la página de evaluación:

1. importa `COURSE` y `EVALUATION` desde `course.js`;
2. calcula el total con `reduce()`;
3. entrega título y descripción a `BaseLayout`;
4. usa `CoursePageHeader`, que a su vez incluye `CourseNav`;
5. renderiza cada componente de evaluación con `map()`;
6. recibe su apariencia desde las clases compartidas de `global.css`.

La página no mantiene una copia local de los porcentajes. Así, la portada del curso, la página de evaluación y la validación leen el mismo contrato.

## Rutas

Astro utiliza enrutamiento por archivos:

| Archivo | Ruta |
| --- | --- |
| `src/pages/index.astro` | `/` |
| `src/pages/avisos.astro` | `/avisos` |
| `src/pages/recursos.astro` | `/recursos` (redirección compatible) |
| `src/pages/simulaciones.astro` | `/simulaciones` |
| `src/pages/herramientas.astro` | `/herramientas` |
| `src/pages/actividades.astro` | `/actividades` |
| `src/pages/fisica-basica-1/index.astro` | `/fisica-basica-1` |
| `src/pages/fisica-basica-1/cronograma.astro` | `/fisica-basica-1/cronograma` |
| `src/pages/fisica-basica-1/unidades.astro` | `/fisica-basica-1/unidades` |
| `src/pages/fisica-basica-1/ejercicios.astro` | `/fisica-basica-1/ejercicios` |
| `src/pages/fisica-basica-1/videos.astro` | `/fisica-basica-1/videos` |
| `src/pages/fisica-basica-1/evaluacion.astro` | `/fisica-basica-1/evaluacion` |
| `src/pages/fisica-basica-1/recursos.astro` | `/fisica-basica-1/recursos` |
| `src/pages/fisica-basica-1/unidades/unidad-1/index.astro` | `/fisica-basica-1/unidades/unidad-1` |
| `src/pages/fisica-basica-1/unidades/unidad-1/herramientas.astro` | `/fisica-basica-1/unidades/unidad-1/herramientas` |
| `src/pages/fisica-basica-1/unidades/unidad-1/vectores.astro` | `/fisica-basica-1/unidades/unidad-1/vectores` |
| `src/pages/fisica-basica-1/unidades/unidad-1/movimiento-1d.astro` | `/fisica-basica-1/unidades/unidad-1/movimiento-1d` |
| `src/pages/fisica-basica-1/unidades/unidad-1/ecuaciones-movimiento.astro` | `/fisica-basica-1/unidades/unidad-1/ecuaciones-movimiento` |
| `src/pages/fisica-basica-1/unidades/unidad-1/movimiento-2d.astro` | `/fisica-basica-1/unidades/unidad-1/movimiento-2d` |
| `src/pages/fisica-basica-1/unidades/unidad-1/circular-relativo.astro` | `/fisica-basica-1/unidades/unidad-1/circular-relativo` |
| `src/pages/fisica-basica-1/unidades/unidad-1/coordenadas-polares.astro` | `/fisica-basica-1/unidades/unidad-1/coordenadas-polares` |
| `src/pages/fisica-basica-1/ejercicios/unidad-1.astro` | `/fisica-basica-1/ejercicios/unidad-1` |

`index.astro` representa la carpeta que lo contiene. Por eso `fisica-basica-1/index.astro` no produce `/fisica-basica-1/index`, sino `/fisica-basica-1`.

Los recursos pertenecen al curso que los selecciona. Por eso la página real
forma parte de `COURSE_NAV`; `/recursos` no mantiene contenido duplicado y
solo produce una redirección estática base-aware para enlaces anteriores.

### Arquitectura académica de la Unidad 1

La implementación distingue los metadatos estables del curso, el contenido
de cada unidad y su presentación:

```text
course.js (catálogo estable de siete unidades)
   ↓
physics/index.js → unit-1/unit.js (rutas, orden y prioridad)
   ↓
content.js ─┬─ formulas.js
            ├─ visualizations.js
            ├─ common-errors.js
            └─ exercises.js
                 ↓ math-content.js (presentación literal texto + MathML)
   ↓
componentes academic/* + visualization/*
   ↓
rutas Astro breves, estáticas y base-aware
```

Cada tema tiene una ruta explícita y delega su composición a
`UnitTopicPage.astro`. Esta decisión permite que Astro detecte las páginas sin
introducir una ruta dinámica y evita siete copias de la misma estructura. La
plantilla busca las referencias declaradas por identificador; por eso una
fórmula, figura o error puede reutilizarse sin duplicar su definición.

El contenido se ofrece con profundidad progresiva:

- `essential`: definición o relación mínima que debe quedar clara;
- `understand`: interpretación y conexiones conceptuales;
- `deepen`: condiciones, matices o desarrollo formal;
- `explore`: extensión opcional que no debe confundirse con un requisito.

`UnitTopicPage` deja visibles `essential` y `understand`. `deepen` y `explore`
usan `details` nativo; así reducen la longitud percibida sin ocultar la base
necesaria para comprender el tema. Al imprimir, CSS revela esos bloques. El
índice lateral orienta la página, pero no es sticky: el único elemento
contextual que sigue el scroll en escritorio es el resumen compacto de la
unidad.

Las coordenadas polares se registran además con prioridad `extension`. Esa
marca controla su jerarquía editorial, pero no hace afirmaciones sobre
evaluación. Las fuentes registradas en la unidad son el programa oficial
0302270 y el programa clase a clase 2026-2; el contenido original del sitio no
reproduce libros comerciales.

El banco de ejercicios también separa responsabilidades. Enunciado, pistas y
solución son contenido público sujeto al estado editorial. Estado, versión, nivel cognitivo,
modalidades, tolerancia y referencias a errores son metadatos editoriales para
filtrar, validar y evolucionar tutorías deterministas. `ExerciseCard.astro`
decide qué parte es visible; ningún resultado ni progreso estudiantil se
persiste.

`status` describe el flujo de revisión académica: `draft` es trabajo incompleto,
`review` está listo para revisión de César y `published` significa aprobación
docente final. El banco actual permanece en `review`. `purpose` separa
`learning` de un futuro banco `measurement`; `exposure` distingue `public` y
`restricted`. La página solo consume ejercicios públicos de aprendizaje que no
estén en borrador. Todavía no existe un banco de medición.

Un ejercicio puede declarar `visualizationId`. `OpenPractice` lo resuelve contra
`UNIT_1_VISUALIZATIONS` y entrega el mismo registro a
`AcademicVisualization`; `exercises.js` nunca contiene copias de SVG. Las
representaciones `graphical` y `visual` se validan contra una figura existente.

Antes de ejecutarse JavaScript, todos los ejercicios públicos permanecen en el
HTML como una lista utilizable. La mejora vanilla selecciona hasta cinco con
`selectExerciseBatch`, procura variedad y mantiene un `Set` de IDs vistos solo
durante la sesión de página. Los filtros de tema, dificultad y tipo vuelven a
calcular la tanda; si hay menos de cinco, muestra los disponibles sin repetir.
La interfaz escribe el ID estable en el hash y admite `Alt` + flecha
izquierda/derecha. No muestra el tamaño total del banco, no evalúa respuestas,
no usa `localStorage` y no recopila datos.

### Presentación matemática inline

Las fórmulas principales continúan en `formulas.js`. Para expresiones dentro de
párrafos, comprobaciones, pistas o soluciones se usa un contrato mixto:

```text
string académico registrado
   ↓ presentUnit1RichText() busca solo literales registrados
segmentos { type: "text" } / { type: "math", mathml, label, tex }
   ↓ RichText + InlineMath durante el build
texto HTML + MathML nativo, sin parser ni JavaScript cliente
```

`math-content.js` no intenta deducir una gramática de cadenas como `v_0` o
`sqrt(...)`. Cada fragmento se registra de forma explícita con constructores de
`src/utils/mathml.js`, nombre accesible y anotación semántica. Esta restricción
evita interpretaciones ambiguas y mantiene la revisión académica sobre cada
expresión. `set:html` solo recibe MathML generado por módulos internos
versionados; no debe usarse con entrada de usuarios.

Magnitud, valor absoluto y norma se construyen con `magnitude()`,
`absoluteValue()` y `norm()`. Estas utilidades generan pares de operadores
MathML con atributos `fence`, `stretchy`, `symmetric` y `form`; no se deben
recrear barras con dos llamadas sueltas a `mo("|")` ni compensarlas mediante
márgenes CSS específicos de una fórmula.

### Escalas de figuras académicas

`CartesianChart` usa `createCartesianTransform`: los dominios de x e y ocupan
el área de trazado de forma independiente. Esta flexibilidad es correcta para
gráficas como x(t), v(t) o a(t), donde una unidad horizontal no tiene que medir
lo mismo que una vertical.

`AcademicDiagram` usa por defecto `createIsotropicTransform`: toma la menor
escala disponible, centra el área física y deja letterboxing en el eje
sobrante. Así una unidad física en x ocupa lo mismo que una en y y una
circunferencia no se convierte en elipse. `scaleMode: "stretch"` queda
disponible solo para diagramas no geométricos que justifiquen explícitamente la
distorsión. `labelOffset`, `labelAnchor` y `labelPosition` permiten separar
etiquetas sin alterar las coordenadas físicas; el componente limita su ancla al
área visible.

### Mapa de aprendizaje

El índice de Unidad 1 pasa `UNIT_1.topics` a `UnitLearningMap`. El componente
deriva los puntos del número y orden de temas, dibuja conexiones decorativas en
SVG y posiciona encima enlaces HTML reales. El SVG no es la fuente de verdad ni
duplica títulos o rutas. En móvil, el mismo `ol` abandona la geometría radial y
se presenta como un camino vertical; en impresión se convierte en una lista.
La API (`unitLabel`, `unitTitle`, `topics`) permite reutilizarlo en Unidades 2–7.

### Ruta base de publicación

`astro.config.mjs` configura la Project Page provisional:

```js
site: "https://leporc-projects.github.io",
base: "/pagina-fisica",
```

`site` identifica el origen canónico y `base` indica que la aplicación no vive en la raíz del dominio. Por eso una ruta lógica como `/fisica-basica-1/videos` debe renderizarse como `/pagina-fisica/fisica-basica-1/videos`.

La función `withBase()` realiza esa conversión al renderizar. Su núcleo puro, `resolveBasePath()`, permite comprobar el comportamiento desde `validate.mjs` sin simular el entorno de Astro. La regla de mantenimiento es:

- guardar rutas internas en datos desde la raíz lógica;
- llamar `withBase()` en todo `href` o `src` interno que Astro no gestione automáticamente;
- conservar anclas como `#unidad-1` y enlaces externos como URL completas;
- no escribir `/pagina-fisica` en componentes, páginas ni datos.

Los imports CSS y los recursos generados por Astro reciben `base` durante el build. Los archivos servidos directamente desde `public/`, como el logotipo, deben pasar por `withBase()` cuando se referencian.

## Estilos

`src/styles/global.css` contiene variables y sistemas visuales compartidos. Sus bloques principales son:

- base tipográfica, color, espaciado y foco;
- cabecera, menú y portada;
- páginas generales y estados editoriales;
- estructura interna del curso;
- cronograma y unidades;
- visualizaciones SVG académicas y sus variantes responsive e imprimibles;
- breakpoints responsive y reducción de movimiento.

La navegación global es sticky. `CourseNav` conserva acceso rápido con menor
altura, permite desplazamiento horizontal y deja de ser sticky en pantallas
estrechas. Dentro de una unidad, `UnitOneNav` muestra solo el contexto actual
hasta que se abre; también deja de seguir el scroll en móvil. Las secciones
enlazables usan `scroll-margin-top` para que sus títulos no queden ocultos.

Antes de crear una clase nueva, conviene buscar si existe un patrón equivalente. Las variables de `:root` deben utilizarse en lugar de repetir colores, espacios o radios.

### Sistema global de temas

El sistema diferencia la preferencia guardada del tema efectivo:

```text
light  ───────────────→ data-theme="light"
dark   ───────────────→ data-theme="dark"
system ─→ prefers-color-scheme ─→ light o dark
```

La única configuración persistente es
`papillas-physics:theme`, almacenada en `localStorage` con uno de los valores
`light`, `dark` o `system`. No se guardan navegación, contenido académico,
respuestas ni información estudiantil. Si el navegador bloquea el
almacenamiento, la aplicación continúa en modo sistema.

Las responsabilidades se reparten así:

- `src/data/theme.js` mantiene el contrato compartido y evita que el layout y el selector diverjan.
- `BaseLayout.astro` lee la preferencia temprano, calcula el tema efectivo y actualiza también `color-scheme` y `theme-color`.
- `ThemeSelector.astro` persiste únicamente cambios explícitos, escucha cambios del sistema cuando la preferencia es `system` y sincroniza otras pestañas mediante el evento `storage`.
- `global.css` define los valores claros en `:root` y redefine únicamente los tokens dependientes del tema en `:root[data-theme="dark"]`.

Los tokens se agrupan por intención:

- contenido: `--bg`, `--surface`, `--surface-raised`, `--text`, `--text-muted`, `--border`, `--accent` y `--focus`;
- estados: familias `--status-info-*`, `--status-success-*`, `--status-warning-*` y `--status-event-*`;
- marca: familia `--brand-*`, compartida por cabecera, menú, portada y footer;
- contenido futuro: `--content-canvas`, `--formula-bg`, `--quiz-bg`, `--simulation-bg` y `--data-series-*`.

Un componente nuevo debe consumir tokens semánticos, no decidir por sí mismo
si el tema es claro u oscuro. Por ejemplo, una tarjeta usa
`background: var(--surface)` y `color: var(--text)`. Solo se justifica un
selector `data-theme` cuando cambia el tratamiento de un recurso y no solo su
color; los diagramas raster que realmente admitan inversión pueden declarar
`data-theme-adaptive="invert"`. El logotipo y las imágenes editoriales no se
invierten automáticamente.

Las fórmulas, gráficas, simulaciones y quizzes deben dibujarse sobre los
tokens de lienzo previstos. Si necesitan recalcular colores en JavaScript,
pueden escuchar `window` para el evento `themechange`; su detalle incluye la
preferencia y el tema efectivo. Esto evita acoplar cada integración a la
implementación del selector.

Los dos temas comparten este contrato, no la misma personalidad cromática. En
claro, marfil, grafito, terracota y cobre gobiernan acentos, estados y series de
datos. En oscuro permanecen grafito, blanco cálido, cian y verde. Las reglas
globales no convierten una paleta en la otra: cada bloque define sus valores y
los componentes consumen la intención semántica. Las gráficas heredan
`--data-series-*`, `--chart-*` y `--content-canvas`, por lo que no necesitan una
variante de componente.

## Infraestructura de visualizaciones

La infraestructura propia prioriza SVG porque las gráficas académicas suelen
tener un número moderado de elementos semánticos: ejes, curvas, puntos,
vectores y etiquetas. SVG conserva esos elementos en el DOM, escala mediante
`viewBox`, permanece nítido al imprimir y permite describir la figura con
`title`, `desc` y texto real. Una gráfica estática se renderiza durante el
build de Astro y no añade JavaScript al navegador.

La separación principal es:

```text
datos físicos (dominios, puntos, funciones, unidades)
   ↓ validación, muestreo y recorte — src/utils/chart.js
coordenadas físicas válidas
   ↓ createCartesianTransform()
geometría SVG (paths, líneas, marcadores)
   ↓ CartesianChart.astro o AcademicDiagram.astro
presentación (tokens, trazos, responsive) — global.css
```

Un punto `{ x: 2, y: -1 }` siempre representa el dato físico. Ninguna fuente de
contenido debe convertirlo previamente a una posición de pantalla. El
transformador mapea el dominio x al ancho útil del SVG e invierte el dominio y
porque SVG crece hacia abajo. Las líneas y áreas se recortan todavía en el
espacio físico; solo después se genera el atributo `d` del path.

### API de `CartesianChart`

| Prop | Contrato |
| --- | --- |
| `id` | Identificador único de la figura, en minúsculas y con guiones. Genera referencias ARIA, `clipPath` y hooks estables. |
| `title`, `description` | Nombre y explicación accesibles del contenido real de la gráfica. Son obligatorios. |
| `xAxis`, `yAxis` | Dominio creciente, etiqueta, unidad opcional, cantidad o lista explícita de ticks y formateador opcional. |
| `series` | Series de puntos físicos. Admiten `line`, `points`, `line-points` o `area`, marcador, patrón de línea y línea base. Un valor `null` separa ramas. |
| `functions` | Funciones evaluadas durante el build, con dominio y número de muestras opcionales. Los resultados no finitos crean cortes. |
| `references` | Líneas verticales u horizontales expresadas mediante un valor físico y una etiqueta opcional. |
| `vectors` | Pares `start`/`end` en coordenadas físicas y etiqueta opcional. |
| `annotations` | Punto físico, texto y desplazamiento visual opcional en unidades del `viewBox`. |
| `grid`, `legend` | Activan cuadrícula por eje y leyenda textual. La leyenda no depende solo del color: conserva nombre, patrón y marcador. |
| `aspectRatio` | Relación alto/ancho del `viewBox`, limitada a valores útiles entre `0.5` y `1`. |

Los estilos consumen `--chart-*` y `--data-series-*`. Esos tokens se definen
para claro y oscuro junto al sistema visual general. Una visualización nueva no
debe consultar `data-theme`, escribir colores directos ni duplicar reglas para
cada tema. El color no es la única señal: el ciclo por defecto también cambia
patrón de línea y forma del marcador.

### Interacción y gráficas sincronizadas

El componente actual es deliberadamente estático. El elemento `figure`, el SVG
y cada serie exponen `data-chart-id`, dominios, área útil y `data-series-id`.
Cuando un control externo sea necesario, un módulo vanilla podrá:

1. conservar el estado en magnitudes físicas;
2. importar las mismas utilidades de `src/utils/chart.js`;
3. recalcular solamente la geometría afectada;
4. localizar el path o marcador mediante los hooks `data-*`;
5. actualizar atributos SVG sin reescribir ejes ni estilos.

Dos gráficas sincronizadas compartirán el valor físico del cursor o del control,
pero cada una aplicará su propia transformación. Los controles deben ser HTML
nativo siempre que sea posible, conservar etiqueta visible o accesible y
responder a teclado. Esta interacción no debe guardar respuestas o datos en
`localStorage`; la única persistencia vigente sigue siendo la preferencia de
tema.

Para añadir una gráfica estática:

1. importar `CartesianChart.astro` en la página académica aprobada;
2. definir dominios, ejes y series con magnitudes y unidades verificadas;
3. asignar `id` únicos a gráfica y series;
4. redactar `title` y `description` que expliquen la información, no la decoración;
5. elegir patrones o marcadores que mantengan distinguibles las series;
6. comprobar valores límite, discontinuidades, claro/oscuro y ancho móvil;
7. ejecutar `npm run validate` y `npm run build`.

No se publica una ruta de desarrollo para visualizaciones. El contrato técnico
de la infraestructura SVG se comprueba mediante `npm run validate` y los tests
unitarios, sin exponer datos sintéticos en el sitio estable.

Canvas se reserva para simulaciones con miles de elementos, animaciones de alta
frecuencia o redibujado continuo donde el costo de muchos nodos SVG sea
significativo. Incluso en ese caso, controles, explicación y alternativa
accesible seguirán fuera del lienzo. Una curva, diagrama vectorial o gráfica
imprimible de complejidad moderada debe continuar en SVG.

## Accesibilidad

Los contratos más importantes son:

- cada página tiene un solo `h1`;
- `aria-labelledby` debe apuntar a un ID existente y único;
- los SVG decorativos usan `aria-hidden="true"`;
- el menú mantiene un ciclo de foco y responde a Escape;
- el foco visible no debe eliminarse;
- los estados no dependen solamente del color;
- las gráficas tienen `title` y `desc`, leyendas textuales y series diferenciadas por patrón o marcador;
- `prefers-reduced-motion` reduce transiciones y desplazamiento suave.
- el selector de tema conserva controles de radio navegables y una leyenda accesible;
- texto principal, secundario, acentos, estados y foco se validan contra pares de contraste semánticos.
- el mapa conserva orden DOM, enlaces reales y descripciones aunque su SVG sea decorativo;
- la práctica anuncia la posición con `aria-live`, usa controles nativos y mueve el foco al título del ejercicio activado;
- el MathML inline declara un nombre accesible y conserva texto alternativo semántico en cada expresión.

## Validaciones

`scripts/validate.mjs` no utiliza paquetes adicionales. Recorre el sistema de archivos y comprueba:

- suma de evaluación igual a 100 %;
- sesiones consecutivas y fechas ordenadas;
- ausencia de sesiones, rutas, avisos o videos duplicados;
- existencia de las rutas declaradas en `COURSE_NAV`;
- enlaces internos principales;
- funcionamiento del resolvedor con `/pagina-fisica`, anclas y URL externas;
- ausencia de `href="/..."` y `src="/..."` literales en plantillas Astro;
- existencia del recurso gráfico principal.
- existencia de los tres modos y de los tokens semánticos en ambos temas;
- ausencia de colores literales fuera de los bloques de tokens;
- contraste WCAG de texto, acentos, estados y foco;
- uso de `localStorage` limitado al arranque y al selector de tema.
- contrato SVG: transformación, recorte, hooks, tema, ausencia de Canvas y demo fuera de navegación;
- ocho pruebas unitarias con `node:test` para dominios, escalas, ticks, inversión de y, discontinuidades, recorte y paths finitos.
- contrato académico: siete temas ordenados, capas de profundidad admitidas, referencias existentes entre contenido, fórmulas, figuras y errores;
- fórmulas MathML con significado, variables, condiciones, interpretación dimensional y errores asociados;
- registro de MathML inline sin notación de teclado pendiente en el contenido visible;
- banco de entre 18 y 24 ejercicios con identificadores únicos, taxonomías válidas, unidad esperada y tolerancia para respuestas numéricas, solución y versión editorial;
- contratos de mapa, disclosure progresivo y secuencia de ejercicios sin persistencia ni dependencias nuevas;
- figuras académicas con dominios válidos, coordenadas físicas finitas y descripción accesible.

Comandos habituales:

```sh
npm run validate
npm run build
npm run verify
npm audit
git diff --check
```

`npm run verify` ejecuta primero la validación y después la compilación.

## Flujo de despliegue

`.github/workflows/deploy.yml` separa construcción y despliegue:

```text
push o workflow_dispatch
   ↓
npm ci → validate → build
   ↓
dist/ → artefacto github-pages
   ↓
entorno github-pages → URL pública
```

El trigger automático apunta a `main`. El workflow usa permisos de lectura del
repositorio, escritura de Pages e identificación OIDC para el despliegue; no
necesita secretos propios.

En desarrollo y `preview`, la página inicial está en `/pagina-fisica/`, igual que en producción. Esto hace que la prueba local cubra el mismo prefijo que GitHub Pages.

Para migrar a un dominio personalizado se debe crear `public/CNAME`, cambiar `site`, retirar `base` y configurar DNS/HTTPS en GitHub. `withBase()` pasará a devolver las rutas lógicas sin prefijo, de modo que no se reescriben los componentes.

## Cómo añadir una página

1. Determinar si es una página general o una subpágina del curso.
2. Crear el archivo `.astro` dentro de `src/pages/` en la ruta deseada.
3. Importar `BaseLayout`.
4. Usar `PageHeader` para páginas generales o `CoursePageHeader` para páginas del curso.
5. Importar los datos desde `src/data/`; no copiar arreglos académicos dentro de la página.
6. Resolver todo destino o recurso interno con `withBase()`; no añadir el prefijo de despliegue manualmente.
7. Añadir IDs estables a encabezados referenciados por `aria-labelledby`.
8. Reutilizar clases globales antes de crear estilos específicos.
9. Comprobar que todas las superficies, textos, estados y focos consuman tokens semánticos y funcionen en claro y oscuro.
10. Si la página debe aparecer en navegación, actualizar `NAV`, `HOME_LINKS` o `COURSE_NAV` según corresponda.
11. Ejecutar `npm run validate` y `npm run build`.
12. Revisar ambos temas en escritorio y móvil antes de hacer commit.

Las reglas para publicar contenido están en [CONTENT_GUIDE.md](./CONTENT_GUIDE.md).

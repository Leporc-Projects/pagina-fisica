# Arquitectura de Aula Física

Este documento explica cómo se organiza el sitio y cómo fluye la información desde los datos hasta las páginas generadas. Está dirigido a quien necesite mantener el proyecto mientras aprende Astro, JavaScript y CSS.

## Visión general

Aula Física es un sitio estático construido con Astro. No tiene backend, base de datos ni estado persistente. Durante la compilación, Astro transforma los archivos `.astro` de `src/pages/` en páginas HTML dentro de `dist/`.

El flujo principal es:

```text
src/data (contenido + catálogos + contrato de tema)
   ↓
componentes y páginas + withBase(import.meta.env.BASE_URL)
   ↓
BaseLayout + ThemeSelector + renderers SVG o p5/Canvas 2D + estilos
   ↓
astro build → dist → GitHub Pages
```

Esta separación evita escribir varias veces el mismo dato académico y permite cambiar contenido sin mezclarlo con la estructura visual.

La internacionalización añade una capa pura entre rutas/datos y presentación. `src/i18n/config.js` registra locales, `ui/` conserva diccionarios con paridad, `routes.js` relaciona IDs estables con slugs humanos y `metadata.js` deriva canonical y alternates. Español permanece en la raíz e inglés usa `/en/`; no hay detección automática ni persistencia del idioma. La cobertura completa y el procedimiento editorial viven en [I18N.md](./I18N.md).

El proyecto sigue el contrato `invariant data + localized presentation`: IDs, fechas, porcentajes, scoring, parámetros, reglas y claves de esquema se comparten; los localizadores y diccionarios proyectan únicamente texto visible. La cobertura ES/EN es completa para la superficie pública y para las herramientas docentes.

## Capas del proyecto

### Datos

`src/data/` contiene estructuras JavaScript exportadas:

- `courses.js`: registro mínimo de identidades estables, rutas y estado activo de los cursos reales.
- `course.js`: contrato académico de Física Básica I; deriva su identidad de `courses.js` y añade navegación interna, siete unidades, evaluación, bibliografía y cronograma.
- `site.js`: identidad editorial, navegación global y accesos de portada.
- `simulation-models.js`: registro confiable de modelos, parámetros, límites
  duros, capacidades de vista e identidad de renderer. No contiene funciones
  físicas, DOM ni configuración docente.
- `simulation-renderers.js`: registro cerrado que relaciona cada modelo con un
  renderer real. Impide seleccionar identificadores arbitrarios desde contenido.
- `simulation-experiences.json` y `simulation-experiences.js`: almacenamiento y
  adaptador de experiencias pedagógicas declarativas. Título, resumen, estado,
  defaults, rangos, vistas, presets, guía y contextos tienen aquí una única
  fuente de verdad.
- `simulations.js`: adaptador del catálogo público. Conserva ruta y categoría y
  deriva identidad, texto, estado, modelo y contextos de la experiencia.
- `notices.json`: almacenamiento editorial actual de avisos; puede contener los cuatro estados.
- `notices.js`: adaptador de consultas publicadas por ámbito; separa el archivo general, cada curso y la selección combinada de portada.
- `videos.js`: contrato de metadatos de la biblioteca audiovisual.
- `theme.js`: preferencias admitidas, clave de almacenamiento y colores del navegador para cada tema efectivo.
- `participation.js`: contexto académico, temas reales y opciones públicas de las tres actividades de participación.
- `physics/index.js`: registro explícito de las Unidades 1, 2, 3 y 4 desarrolladas y sus adapters de localización, contenido, fórmulas, figuras, ejemplos resueltos, errores, banco y MathML.
- `physics/exercise-schema.js` y `exercise-builder.js`: taxonomía y construcción compartidas; cada unidad fija su número y su política de elegibilidad sin duplicar enums.
- `physics/unit-1/` a `physics/unit-4/`: contratos modulares paralelos. Separan metadatos y rutas (`unit.js`), explicación conceptual (`content.js`), fórmulas (`formulas.js`), figuras (`visualizations.js`), errores frecuentes (`common-errors.js`), ejemplos resueltos, ejercicios fijos, familias y localización. Unidad 1 conserva además los Bonos y las preguntas docentes importadas; las Unidades 2, 3 y 4 no declaran Bonos.

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
- `LanguageSelector.astro`: enlaza contrapartes publicadas por ID de ruta; muestra las no disponibles como controles deshabilitados y accesibles.
- `ThemeSelector.astro`: control reutilizable para elegir claro, oscuro o sistema. Usa radios nativos, sincroniza posibles instancias del control y emite el evento `themechange` para contenido interactivo futuro.
- `Footer.astro`: identidad personal y declaración de independencia institucional.
- `PageHeader.astro`: cabecera de páginas generales como Avisos o Simulaciones.
- `SectionHeading.astro`: encabezado `h2` reutilizable. Cuando la sección padre tiene `aria-labelledby`, debe recibir el mismo `id`.
- `CoursePageHeader.astro`: cabecera de las páginas internas del curso y composición de `CourseNav`.
- `CourseNav.astro`: navegación horizontal basada exclusivamente en `COURSE_NAV`; en pantallas estrechas revela la sección activa sin desplazar la página.
- `visualization/CartesianChart.astro`: traduce dominios, series y geometría física a un SVG cartesiano accesible y responsive.
- `visualization/AcademicDiagram.astro`: compone diagramas vectoriales y geométricos con escala física isotrópica y etiquetas posicionables.
- `visualization/AcademicVisualization.astro`: resuelve una entrada del registro central como gráfica o diagrama para que temas y ejercicios no dupliquen SVG.
- `simulations/KinematicsSimulation.astro`: recibe una experiencia validada y
  compone controles editables o fijos, vistas habilitadas, reproducción, eje y
  gráficas del renderer `svg-kinematics-1d`.
- `simulations/KinematicsMotion.astro` y `KinematicsChart.astro`: renderizan el
  estado estático inicial en SVG y exponen hooks pequeños para la mejora cliente.
- `simulations/ProjectileSimulation.astro`: conserva controles, lecturas,
  descripción accesible y estado inicial en HTML; monta el renderer
  `p5-projectile-2d` sobre Canvas 2D solo cuando la experiencia lo necesita.
- `simulations/ForcesFrictionSimulation.astro` y `PulleySystemsSimulation.astro`:
  presentan escenas p5 dominantes y reservan el Canvas para la escena física.
  DCL, ecuaciones, medidores, lecturas y gráficas viven en HTML/MathML/SVG
  accesible fuera del lienzo. Sus runtimes coordinan el reloj, pero la física
  permanece en modelos puros independientes del renderer.
- `simulations/CircularRadialSimulation.astro` conserva la experiencia circular
  archivada para previsualización interna; no forma parte del catálogo ni genera
  una ruta pública.
- `simulations/SimulationFloatingPlayback.astro`: proyecta el estado del runtime
  canónico en las cuatro simulaciones públicas cuando sus controles completos
  salen del viewport; nunca aparece en previews ni posee estado físico propio.
- `simulations/SimulationExperienceRenderer.astro`: dispatcher validado que
  selecciona uno de los cinco componentes internos a partir de los registros de
  modelo y renderer; los slots ocultos del Laboratorio no inicializan runtime.
- `simulations/SimulationLab.astro`: constructor visual local de experiencias de
  cualquiera de los cinco modelos internos; usa registros reales, controles nativos y los
  mismos renderers de producción para previsualizar.

Las experiencias usan esquema `2.0.0`: los parámetros y vistas son invariantes y el texto secundario vive en `translations`. Los avisos usan esquema `3.0.0` y exigen locale explícito. Ningún adaptador aplica fallback editorial entre idiomas.
- `academic/AcademicUnitLanding.astro`, `AcademicUnitPracticePage.astro` y `UnitTopicPage.astro`: renderers multiunidad que resuelven el adapter registrado y componen landing, práctica y temas sin importar módulos de una unidad concreta.
- `academic/AcademicSection.astro`, `FormulaBlock.astro`, `ConceptCheck.astro` y `CommonErrors.astro`: presentan contratos académicos reutilizables sin duplicar su contenido en las rutas.
- `academic/RichText.astro` e `InlineMath.astro`: convierten el contrato mixto texto/MathML en HTML estático; nunca interpretan entrada del navegador.
- `academic/UnitLearningMap.astro`: índice visual reutilizable. Calcula la geometría desde el orden y cantidad de temas, pero conserva los enlaces en un `ol` navegable.
- `academic/AcademicUnitNav.astro`: navegación compacta alimentada por `unit.topics`; `UnitOneNav.astro` permanece como wrapper de compatibilidad.
- `academic/ExerciseCard.astro`: vista pública de un ejercicio; mantiene fuera de la interfaz los metadatos editoriales del banco.
- `academic/OpenPractice.astro`: conserva el banco público en HTML y mejora la vista con tandas locales, filtros y navegación sin progreso global.
- `bank/QuestionBankEditor.astro`: formulario docente local para previsualizar preguntas fijas y preparar un paquete JSON de borradores; no modifica el banco público.
- `notices/NoticeEditor.astro`: formulario local para preparar y previsualizar avisos como texto, sin publicar ni enviar datos.
- `NoticeCard.astro`: presentación pública compartida; conserva enlaces internos y HTTPS seguros también en su variante compacta.
- `teacher/TeacherToolsNav.astro`: navegación del hub y de las herramientas publicadas; deriva su lista de `src/data/teacher-tools.js`, no de un array local.
- `academic/TopicCta.astro`: gramática compartida de los CTA de cierre de tema (simulación, práctica, Participa); recibe `eyebrow`/`title`/`description`/`href`/`linkLabel` ya resueltos y no decide rutas.
- `participation/`: paso de contexto (`ParticipationContext.astro`), selector de actividad, tres formularios independientes, previsualización y acciones de exportación. Los componentes recogen o presentan campos; no definen el contrato de respuesta.
- `review/`: importación accesible, agregados descriptivos, listado paginado, revisión de propuestas, incidencias y exportación de una sesión docente local. La ruta de la herramienta los compone sin incorporar lógica de contratos.
- `results/`: importación del listado, configuración de fuentes, resumen, incidencias, consolidado y exportaciones del Organizador de resultados. Cada componente representa una etapa visible; el estado y los cálculos permanecen fuera de Astro y del DOM.
- `src/utils/paths.js`: contrato único para convertir rutas lógicas en rutas públicas mediante `import.meta.env.BASE_URL`. Conserva anclas y URL externas sin cambios.
- `src/utils/chart.js`: núcleo matemático puro para validar dominios, crear escalas cartesianas o isotrópicas, muestrear funciones, recortar geometría y producir paths SVG.
- `src/utils/diagram-layout.js`: geometría pura de colocación de etiquetas —métrica tipográfica, cajas de texto y de punta, separaciones, políticas de colocación y presets por familia—. No conoce el DOM.
- `src/utils/diagram-geometry.js`: composición completa de un diagrama a partir de sus datos físicos. Única fuente compartida por el componente y por el verificador de colisiones del build.
- `src/utils/content-scope.js`: contrato de ámbito (`global` o `course`) compartido por Avisos y Participa; valida, normaliza y produce la etiqueta localizada de un `scope`.
- `src/utils/participation-precontext.js`: traduce query params en un contexto inicial seguro para Participa, validando curso/unidad/tema contra el registro vigente y cayendo a ámbito general ante cualquier valor inválido.
- `src/data/teacher-tools.js`: registro explícito de herramientas docentes con `published`. El hub y `TeacherToolsNav` derivan su lista de ahí; una herramienta no publicada conserva su implementación pero no genera ruta.
- `src/utils/kinematics-1d.js`: modelo puro de aceleración constante; valida
  parámetros y tiempo, calcula estado, retorno, distancia por tramos, muestras,
  extremos y dominios físicos finitos.
- `src/utils/kinematics-svg.js`: frontera datos físicos → transformación →
  geometría SVG para el eje de movimiento y las tres gráficas sincronizadas.
- `src/scripts/kinematics-1d.js`: adaptación vanilla de controles y reproducción.
  Mantiene estado efímero, admite actualizar/destruir una experiencia, usa
  `requestAnimationFrame` y no reconstruye curvas durante cada frame.
- `src/utils/simulation-experience.js`: normalización, validación estricta,
  serialización, IDs, packs y merge editorial de configuraciones no confiables.
- `src/scripts/simulation-lab.js`: adapta formulario, preview y descarga al
  contrato puro; no persiste ni interpreta código.
- `src/utils/exercise-batches.js`: filtra y selecciona tandas procurando variedad de tema, tipo, representación y dificultad; no conoce el DOM ni persiste actividad.
- `src/utils/exercise-families.js`: valida familias, genera parámetros con aleatoriedad criptográfica, evita combinaciones recientes en memoria y materializa una instancia determinista.
- `src/utils/bonus-audit.js`: audita candidatos por slot y simula diversidad de tandas sin modificar blueprints.
- `src/utils/question-pack.js`: contrato versionado, normalización y validación compartida por el editor y el importador del repositorio.
- `src/utils/notices.js`: contrato canónico de avisos, estados, categorías, enlaces seguros, orden, paquetes e importación.
- `src/utils/content-scope.js`: contrato puro y reutilizable de ámbito global o curso registrado; no conoce páginas ni almacenamiento de avisos.
- `src/utils/mathml.js`: constructores mínimos para producir MathML estructurado, delimitadores semánticos, etiquetas accesibles y anotaciones de texto TeX solo como metadato semántico.
- `src/utils/participation.js`: núcleo puro para crear, validar y serializar una respuesta. No conoce formularios ni nodos del DOM y es la única fuente para TXT, JSON y CSV.
- `src/scripts/participation.js`: adaptación pequeña entre formularios y contrato. Conserva una sola respuesta en memoria, controla la previsualización, descarga archivos, copia texto y abre la impresión nativa.
- `src/utils/review.js`: valida cada JSON contra los contratos públicos vigentes, deduplica, agrega y serializa sin conocer el DOM. Conserva el objeto importado separado de la revisión docente.
- `src/scripts/review-center.js`: adaptación cliente para File API, filtros, paginación, notas locales, descargas e impresión; no usa red ni almacenamiento del navegador.
- `src/utils/results-csv.js`: parser CSV determinista con BOM, comillas, celdas multilínea y CRLF/LF; no separa filas o campos con `split()`.
- `src/utils/results-organizer.js`: normaliza roster, correo, puntuaciones y timestamps; crea incidencias, aplica políticas explícitas, concilia y consolida sin conocer el DOM.
- `src/utils/results-export.js`: proyecta un único consolidado hacia XLSX, tres CSV, TXT e impresión. Neutraliza prefijos de fórmulas en texto importado.
- `src/scripts/results-organizer.js`: mantiene la sesión en memoria, conecta File API y controles, y carga el adaptador XLSX solo al leer o exportar un libro.

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
| `src/pages/simulaciones/cinematica-1d.astro` | `/simulaciones/cinematica-1d` |
| `src/pages/simulaciones/proyectil-2d.astro` | `/simulaciones/proyectil-2d` |
| `src/pages/simulaciones/fuerzas-friccion.astro` | `/simulaciones/fuerzas-friccion` |
| `src/pages/simulaciones/poleas.astro` | `/simulaciones/poleas` |
| `src/pages/participa.astro` | `/participa` |
| `src/pages/actividades.astro` | `/actividades` |
| `src/pages/fisica-basica-1/index.astro` | `/fisica-basica-1` |
| `src/pages/fisica-basica-1/avisos.astro` | `/fisica-basica-1/avisos` |
| `src/pages/fisica-basica-1/cronograma.astro` | `/fisica-basica-1/cronograma` |
| `src/pages/fisica-basica-1/unidades.astro` | `/fisica-basica-1/unidades` |
| `src/pages/fisica-basica-1/ejercicios.astro` | `/fisica-basica-1/ejercicios` |
| `src/pages/fisica-basica-1/videos.astro` | `/fisica-basica-1/videos` |
| `src/pages/fisica-basica-1/evaluacion.astro` | `/fisica-basica-1/evaluacion` |
| `src/pages/fisica-basica-1/recursos.astro` | `/fisica-basica-1/recursos` |
| `src/pages/fisica-basica-1/participa.astro` | `/fisica-basica-1/participa` |
| `src/pages/fisica-basica-1/herramientas/index.astro` | `/fisica-basica-1/herramientas` |
| `src/pages/fisica-basica-1/unidades/unidad-1/index.astro` | `/fisica-basica-1/unidades/unidad-1` |
| `src/pages/fisica-basica-1/unidades/unidad-1/herramientas.astro` | `/fisica-basica-1/unidades/unidad-1/herramientas` |
| `src/pages/fisica-basica-1/unidades/unidad-1/vectores.astro` | `/fisica-basica-1/unidades/unidad-1/vectores` |
| `src/pages/fisica-basica-1/unidades/unidad-1/movimiento-1d.astro` | `/fisica-basica-1/unidades/unidad-1/movimiento-1d` |
| `src/pages/fisica-basica-1/unidades/unidad-1/ecuaciones-movimiento.astro` | `/fisica-basica-1/unidades/unidad-1/ecuaciones-movimiento` |
| `src/pages/fisica-basica-1/unidades/unidad-1/movimiento-2d.astro` | `/fisica-basica-1/unidades/unidad-1/movimiento-2d` |
| `src/pages/fisica-basica-1/unidades/unidad-1/circular-relativo.astro` | `/fisica-basica-1/unidades/unidad-1/circular-relativo` |
| `src/pages/fisica-basica-1/unidades/unidad-1/coordenadas-polares.astro` | `/fisica-basica-1/unidades/unidad-1/coordenadas-polares` |
| `src/pages/fisica-basica-1/ejercicios/unidad-1.astro` | `/fisica-basica-1/ejercicios/unidad-1` |
| `src/pages/fisica-basica-1/bonos/index.astro` | `/fisica-basica-1/bonos` |
| `src/pages/fisica-basica-1/bonos/[slug].astro` | `/fisica-basica-1/bonos/<slug>` |
| `src/pages/fisica-basica-1/herramientas/avisos.astro` | `/fisica-basica-1/herramientas/avisos` |
| `src/pages/fisica-basica-1/herramientas/notas.astro` | `/fisica-basica-1/herramientas/notas` |

`index.astro` representa la carpeta que lo contiene. Por eso `fisica-basica-1/index.astro` no produce `/fisica-basica-1/index`, sino `/fisica-basica-1`.

Banco de preguntas, Laboratorio de simulaciones y Centro de revisión no tienen
wrapper de página en `src/pages/fisica-basica-1/herramientas/` ni en su
contraparte inglesa: `published: false` en `src/data/teacher-tools.js` retira
su ruta pública sin tocar su implementación. Ver
«[Recopilación controlada y revisión docente](#recopilación-controlada-y-revisión-docente)».

Los recursos pertenecen al curso que los selecciona. Por eso la página real
forma parte de `COURSE_NAV`; `/recursos` no mantiene contenido duplicado y
solo produce una redirección estática base-aware para enlaces anteriores.

`Participa` también pertenece a `COURSE_NAV`, pero declara
`includeInGlobalMenu: false`. `CourseNav` presenta la lista completa dentro de
Física Básica I y `site.js` filtra esa entrada al construir el submenú global.
Así la ruta de curso permanece en el contexto del curso y no se duplica en el
menú general. Además de esa ruta, `ROUTE_IDS.PARTICIPATE` registra una
identidad **global** (`/participa`, `/en/participate`) que sí forma parte de
`NAV`, como quinta sección tras Avisos. Las dos rutas renderizan la misma
composición (`ParticipationPage.astro`) con un `scope` inicial distinto; ninguna
sustituye a la otra.

### Participación y exportación local

La participación aplica mejora progresiva sobre dos pasos y tres formularios
HTML independientes. El primer paso (`ParticipationContext.astro`) elige el
ámbito —Aula Física en general o un curso— y, si el curso tiene unidades
desarrolladas, la unidad y el tema opcionales, agrupados por unidad. El
segundo paso (`ParticipationChooser.astro`) elige una de las tres actividades
y revela únicamente su formulario. Preparar una respuesta crea un solo objeto
en memoria y oculta los controles durante la previsualización; editar vuelve a
los formularios sin almacenar una copia.

```text
contexto compartido (ámbito, curso, unidad, tema) + campos del formulario activo
   ↓ src/scripts/participation.js
createParticipationResponse()
   ↓ valida esquema, scope, enums, requeridos, ID y fecha
objeto único de respuesta en memoria
   ├─ participationSummary() → previsualización
   ├─ toParticipationText() → copiar / TXT
   ├─ toParticipationJSON() → JSON completo
   ├─ toParticipationCSV() → fila tabular UTF-8
   └─ CSS @media print + window.print() → impresión / Guardar como PDF
```

El generador público emite el contrato `1.2.0`, que contiene `schemaVersion`,
`responseId`, `activityType`, `scope`, `course`/`unit`/`topic`, `createdAt`,
`purpose`, `collection`, `privacy`, `submissionTarget` y `payload`. `scope`
reutiliza `src/utils/content-scope.js` (`{ type: "global" }` o
`{ type: "course", courseId }`); bajo ámbito general, `course`/`unit`/`topic`
son `null`. Bajo ámbito de curso, `course` siempre existe y `unit`/`topic` son
contexto académico opcional con el invariante `topic !== null ⇒ unit !== null`.
Unidad y tema se resuelven contra el registro académico genérico
(`getDevelopedAcademicUnitsForCourse`), nunca contra una unidad importada
directamente. `createdAt` se conserva en ISO 8601 y solo se presenta con el
locale del navegador; no se registra la zona horaria como campo. `responseId`
representa 128 bits generados con `crypto.getRandomValues()` y solo identifica
el archivo, sin IP, user-agent ni datos del dispositivo.

Los esquemas `1.0.0` y `1.1.0` predatan `scope`: fijaban Física Básica I y la
Unidad 1 con tema obligatorio. Sus respuestas ya existentes se siguen
validando contra ese contrato histórico congelado —no contra el registro
académico vigente—, así que un cambio editorial futuro en la Unidad 1 no
invalida archivos que un estudiante ya exportó. `1.1.0` añade
`helpfulSupportOther`, que `1.2.0` conserva: solo existe y es obligatorio
cuando `helpfulSupport` vale `other`; la normalización lo elimina al elegir
otra opción. El Centro de revisión acepta las tres versiones sin migrar
archivos del disco. Preview, TXT, JSON y CSV parten del mismo objeto validado;
`participationContextLabel()` resuelve la etiqueta mostrada del más específico
al más general —tema, unidad, curso, ámbito general— y vuelve a localizar
contra el registro vigente cuando el slug o número siguen existiendo, en vez de
depender solo del texto guardado en la respuesta.

Los propósitos de participación son `learning`, `feedback` y `contribution`.
No incluyen `research` ni `measurement`. `collection` es únicamente `local`,
`privacy` es `anonymous` y `submissionTarget` permanece `null` en las dos
rutas. Un adaptador de entrega futuro deberá recibir el mismo objeto después de
definir propósito, consentimiento y flujo docente; no debe reescribir el
contrato desde el DOM.

Cada tema académico cierra con tres CTA de la misma gramática
(`TopicCta.astro`): simulación relacionada cuando aplica, práctica de la
unidad y, siempre después de práctica, Participa. El enlace de Participa
apunta a la ruta **global**, no a la de curso, y precontextualiza curso, unidad
y tema mediante query string (`scope`, `courseId`, `unit`, `topic`); la página
de destino vuelve a validar esos parámetros contra el registro y cae a ámbito
general ante cualquier valor inválido o manipulado.

Las propuestas estudiantiles poseen un subcontrato propio con fuente
`student`, estado `unreviewed`, identificador de ejercicio académico nulo y
dificultad editorial nula. La dificultad opcional se guarda como
`studentDifficultyEstimate` con su propia escala. Por tanto, ninguna propuesta
entra en `UNIT_1_EXERCISES` ni hereda la dificultad oficial por el hecho de ser
preparada o exportada.

El CSV escribe siempre las mismas columnas y una fila, encierra todos los
campos entre comillas, duplica comillas internas y conserva comas, saltos de
línea, Unicode y textos largos. Incluye columnas específicas por actividad y
`payload_json` para preservar el contenido completo al combinar archivos
posteriormente. `1.2.0` añade `scope_type`, `course_id` y `course_name` al
final de `PARTICIPATION_CSV_COLUMNS`, sin reordenar ni renombrar ninguna
columna anterior: una hoja que ya combinaba exportaciones `1.0.0`/`1.1.0` sigue
alineando sus columnas históricas. El prefijo BOM facilita que lectores
tabulares reconozcan UTF-8.

La impresión elimina cabecera, navegación, formularios, botones y decoración;
conserva marca, tipo, tema, respuesta, campos presentes, ID y fecha. No existe
una biblioteca de PDF: “Imprimir / PDF” abre la capacidad nativa del navegador.

La documentación de minimización, categorías de datos y conexión futura está
en [DATA_AND_PRIVACY.md](./DATA_AND_PRIVACY.md).

### Recopilación controlada y revisión docente

El Centro de revisión (`src/components/review/`, servido por
`ReviewCenterPage.astro`) conserva su implementación completa, pero
`published: false` en `src/data/teacher-tools.js` retira su wrapper de página:
`/fisica-basica-1/herramientas/revision` y `/en/basic-physics-1/tools/review`
no existen en `dist`, no aparecen en el hub ni en `TeacherToolsNav`, y no están
enlazadas desde ninguna superficie pública. Reactivarla exige solo volver a
crear el wrapper (`import ReviewCenterPage from "…/ReviewCenterPage.astro"`) y
marcar `published: true`; el componente, sus scripts y sus tests no cambian.
Publicada, tampoco representaría un área privada: no tiene autenticación,
backend ni control de acceso. Todo el procesamiento ocurre en la pestaña
mediante File API.

El flujo canónico usa los archivos JSON exportados por Participa. Un formulario
externo, cuando el equipo docente decida utilizarlo, sirve únicamente como
canal manual para recibir esos archivos; el sitio no integra proveedores,
endpoints ni APIs. TXT, CSV y PDF siguen siendo salidas de lectura o trabajo,
no formatos arbitrarios de importación.

```text
archivos JSON seleccionados por el docente
   ↓ lectura local + validación independiente por archivo
válido / advertencia / inválido
   ↓ deduplicación por tipo e ID
registros canónicos en memoria
   ├─ conteos descriptivos separados por actividad
   ├─ búsqueda, filtros y paginación
   ├─ consulta básica de intentos de Bonos
   └─ propuesta original inmutable + revisión docente local
          ↓
      JSON / CSV / TXT / impresión de la sesión
```

La sesión de revisión usa esquema `1.0.0`. Cada elemento exportado conserva el
objeto original, los archivos fuente y, solo para propuestas, una capa
independiente con estado, nota y fecha de revisión. Los estados son `pending`,
`interesting`, `needs-adjustments`, `discard` y `bank-candidate`. “Candidata al
banco” no crea ni modifica un ejercicio: el paso al banco académico continúa
requiriendo corrección y aprobación explícitas.

Los duplicados producen una advertencia, registran todos los nombres de archivo
y aportan una sola instancia a los agregados. Un archivo inválido no bloquea
los demás. Los intentos de Bonos se reconocen por esquema, ID, Bono y versión.
El Centro distingue copias anónimas e identificadas, muestra el correo
únicamente cuando existe y permite filtrar o buscar ese dato; no consolida por
estudiante, calificaciones ni infiere dominio.
Todos los conteos son descriptivos y no constituyen diagnóstico, puntuación de
satisfacción, analítica, clasificación automática ni investigación.

El límite es 5 MB por archivo y las listas abiertas se paginan para mantener un
comportamiento razonable con cientos de archivos. Limpiar la sesión requiere
confirmación y elimina de memoria los archivos y notas de la pestaña. Las
salidas son editables, no están firmadas y no autentican su contenido.

### Organizador docente de resultados

`/fisica-basica-1/herramientas/notas` concilia un listado con fuentes tabulares
y resultados identificados de Bonos. Es una herramienta local sin
autenticación, backend, persistencia ni conexión a proveedores. No sustituye
el sistema institucional ni modifica los cinco componentes oficiales de
evaluación.

La fuente de verdad es un objeto JavaScript de sesión. El DOM solo representa
su estado:

```text
archivos y hojas sin modificar
   ↓ mapping visible y editable
roster + submissions normalizados (raw conservado)
   ↓ conciliación por correo institucional normalizado
matched / unknown / invalid / anonymous / missing
   ↓ política explícita de duplicados y faltantes
consolidado trazable + resumen descriptivo
   ├─ XLSX: Consolidado / Incidencias / Resumen
   ├─ CSV UTF-8 con BOM por cada tabla
   ├─ TXT de resumen
   └─ vista de impresión / Guardar como PDF
```

El correo se normaliza con Unicode NFKC, `trim` y minúsculas. No se eliminan
puntos o aliases `+`, no se inventa un dominio y siempre se conserva
`rawEmail`. Una identidad duplicada en el roster no se fusiona. Un correo
desconocido no crea un estudiante. `missing` es un estado y no equivale a cero.

Cada puntuación separa `rawScore`, `earnedPoints`, `possiblePoints` y
`percentage`. Una fracción puede aportar su máximo; una fuente también puede
usar una columna o un máximo fijo configurado. Un número sin máximo conserva
su valor crudo y no se convierte a 0–5, 0–10 o porcentaje. Conflictos de
escala, rangos y valores no finitos producen incidencias, no correcciones.

Las políticas de duplicados son revisión pendiente, primero, último, mayor y
promedio. Primero/último exigen timestamps válidos; mayor/promedio exigen
porcentajes o una escala explícitamente comparable. La política y todas las
submissions originales permanecen en el detalle. Para el promedio descriptivo,
los faltantes quedan sin resolver por defecto; excluirlos o tratarlos como cero
requiere una decisión visible. No existen ponderaciones ni conversión a escala
0–5 en este bloque.

Los JSON de Bonos se validan con su contrato público. El organizador consume el
`summary` canónico y comprueba su consistencia con la suma de preguntas sin
recalificar pregunta por pregunta. Un intento anónimo se reconoce, pero no se
concilia.

`read-excel-file@9.3.4` y `write-excel-file@4.1.1` son dependencias MIT
específicas para OOXML. El adaptador `results-xlsx-browser.js` usa `import()`;
Vite produce chunks separados que solo referencia el script de esta ruta. La
lectura obtiene valores de celda y no ejecuta macros ni fórmulas como código.
La escritura usa tipos explícitos; cualquier string importado que comience por
`=`, `+`, `-` o `@` se neutraliza antes de salir a XLSX o CSV.

Los límites vigentes son 15 MB por archivo, 10 000 filas, 250 columnas y seis
filas de preview. CSV y XLSX son entradas tabulares; `.xls` muestra una
instrucción para guardar como `.xlsx` o `.csv`. No se incorpora ningún archivo
real de estudiantes al repositorio.

### Bonos y autodiagnóstico local

Los Bonos son actividades públicas de aprendizaje, no un banco de medición.
El contrato editorial usa `modality: "bonus"`, `purpose: "learning"` y
`exposure: "public"`. La modalidad anterior `quiz` se retiró antes de existir
persistencia o integración externa. `measurement` conserva su significado y
permanece separado.

Las definiciones viven en `physics/unit-1/bonuses.js` y el registro transversal
en `data/bonuses/index.js`. Cada Bono declara ID, slug, versión, título, temas,
cantidad, tiempo, política de feedback y blueprint. La ruta dinámica
`bonos/[slug].astro` usa `getStaticPaths()` para generar una página por registro
y solo incluye el pool elegible de sus temas.

```text
definición del Bono + ítems fijos + familias públicas elegibles
   ↓ selectBonusQuestions() satisface ranuras sin repetir IDs
selección + materialización determinista + orden de opciones concretos
   ↓ createBonusAttempt()
objeto único de intento en memoria
   ↓ respuestas locales
completeBonusAttempt()
   ├─ scoring por pregunta y por tema
   ├─ recomendaciones por errores de la tanda
   ├─ TXT / JSON / CSV
   └─ CSS de impresión + window.print()
```

Una ranura puede filtrar `topic`, `subtopic`, `type`, `representation` y
`difficulty`. El selector usa `crypto.getRandomValues()`, backtracking y orden
aleatorio de candidatos: satisface primero el blueprint y registra los IDs
exactos; no depende de `Math.random()` ni promete reconstrucción por semilla.
`validate.mjs` comprueba que cada blueprint puede resolverse y que cada ranura
alcanza su mínimo editorial de candidatos. Las pruebas simulan 100 intentos por
Bono para observar combinaciones y frecuencias sin convertirlas en analítica de
uso.

La auto-corrección requiere `bonusEligible: true` y `interaction`. Los tipos
vigentes son `singleChoice`, `number` y `multiNumber`. Un `answer.kind: "text"`
solo entra mediante opciones explícitas aprobadas. Las respuestas numéricas
aceptan coma o punto decimal, notación científica y fracciones simples
`número/número`; nunca se evalúa texto como código. La tolerancia es absoluta y
un campo de `answer.values` puede sobreescribir la tolerancia general.

Cada pregunta vale un punto. `singleChoice` y `number` son todo o nada;
`multiNumber` reparte el punto por igual entre sus campos. El resultado canónico
conserva `pointsEarned`, `pointsPossible`, `percentage`, desglose por tema y
recomendaciones limitadas a lo observado en la tanda. No produce categorías de
aprobación, niveles ni estimaciones globales de dominio.

El contrato de intento `1.1.0` incluye `attemptId` aleatorio de 128 bits,
versiones del Bono y de los ejercicios, timestamps ISO, orden, orden de
opciones, snapshot de título/enunciado/respuesta esperada, parámetros y versión
de familia cuando corresponde, respuestas, corrección, puntos, resumen y
privacidad local. El modo inicial es `identity: { mode: "anonymous" }`. Tras
finalizar, “Preparar entrega” puede producir una copia separada con
`institutionalEmail`; el intento formativo original sigue anónimo. No registra
tiempos por pregunta, navegación ni dispositivo. Un nuevo intento reemplaza el
anterior en memoria. El validador mantiene compatibilidad de lectura con `1.0.0`.

JSON conserva el contrato completo, TXT ofrece el reporte legible y CSV genera
una fila por pregunta. El serializador CSV compartido con Participa duplica
comillas, preserva saltos de línea y Unicode, añade BOM y neutraliza en campos
de entrada los prefijos `=`, `+`, `-` y `@` para reducir formula injection al
abrir una hoja de cálculo. Los archivos siguen siendo editables: no son una
prueba de autenticidad, firma ni certificación.

### Banco fijo, familias y autoría docente

`UNIT_1_EXERCISES` contiene únicamente ítems fijos. Las familias de
`UNIT_1_EXERCISE_FAMILIES` son definiciones de código revisadas con
`generateParameters()` y `build()`; nunca se guardan como copias estáticas ni se
editan desde el navegador. `UNIT_1_BANK_ITEMS` es la composición explícita que
consumen Práctica y Bonos.

Las Unidades 2, 3 y 4 conservan composiciones separadas en `UNIT_2_BANK_ITEMS`,
`UNIT_3_BANK_ITEMS` y `UNIT_4_BANK_ITEMS`. El runtime de
Práctica consulta `physics/family-registry.js`, un registro ligero y explícito
que materializa familias de las seis unidades sin cargar el resto del contenido
académico ni acoplar el componente a Unidad 1. Solo el banco de Unidad 1 entra
en Bonos, porque las Unidades 2, 3, 4, 5 y 6 no publican blueprints de Bono.

Una instancia parametrizada recibe un ID derivado de su familia y de los
parámetros, pero la interfaz no presenta el `familyId`. En Práctica se genera al
entrar en una tanda. En Bono se materializa antes de crear el intento, y el
snapshot conserva enunciado, respuesta, parámetros, versión e ID de instancia;
la corrección y las exportaciones nunca regeneran la pregunta.

El Editor de banco (`src/components/bank/QuestionBankEditor.astro`) sigue sin
ruta pública —`published: false` en `src/data/teacher-tools.js`—, pero
conserva su implementación intacta. No es administración ni tiene
autenticación ficticia: previsualiza `singleChoice`, `number` y `multiNumber`,
mantiene borradores en memoria y exporta `aula-fisica-question-pack-*.json` con
Question Pack `2.0.0`, `authorSource: "teacher"` y `status: "draft"`. Cada Question 2.0 conserva una sola identidad, interacción y calificación, junto a `presentations.es` y `presentations.en`; la proyección pública deriva texto localizado sin cambiar IDs, unidades, tolerancias ni respuestas. Contenido
con `requiresEditorialMath: true` queda fuera de Bonos hasta composición y
revisión editorial.

El comando `npm run import:questions -- ruta/paquete.json` acepta solo JSON,
valida IDs, paridad ES/EN, respuestas basadas en IDs y duplicados, rechaza esquemas `1.x` con un error explícito y combina los borradores en
`teacher-questions.json`. No ejecuta el archivo, no publica y no cambia el
estado a `review` o `published`. El flujo sigue siendo:

```text
editor local → paquete docente JSON → importador del repositorio
             → borrador separado → revisión/corrección → aprobación/publicación
```

### Avisos y flujo editorial

`notices.json` conserva los datos y `notices.js` oculta su representación física.
El esquema vigente `3.0.0` exige `locale` explícito y un `scope` validado por el contrato compartido:

```json
{ "type": "global" }
{ "type": "course", "courseId": "fisica-basica-1" }
```

`courseId` siempre se resuelve contra `courses.js`. Un ámbito global no admite
esa propiedad y no existe inferencia por categoría, enlace o ubicación del
editor. Las páginas consumen `getGlobalNotices()` o
`getCourseNotices(courseId)`. `getPublishedNotices()` conserva la frontera de
todos los publicados y `getHomepageNotices()` combina globales con cursos
activos, prioriza destacados, deduplica y devuelve como máximo tres. `/avisos`
es el archivo general; cada curso puede tener su archivo contextual, hoy
`/fisica-basica-1/avisos`, ambos con estado vacío válido.

El Editor de avisos genera ID, versiones y estado `draft`, obtiene los destinos
del registro canónico, muestra contenido y ámbito en la previsualización y
exporta `aula-fisica-notice-pack-*.json` con esquema `2.0.0`. El importador
acepta solo JSON, valida ámbito, fechas, categorías, duplicados, texto y enlaces,
y fuerza `review`:

```text
editor local → notice pack (draft) → npm run import:notices
             → notices.json (review) → aprobación en repo → published → build/deploy
```

`publishedAt` es metadato editorial, no un programador. En un sitio estático un
cambio de disponibilidad requiere un build. La transición completa es `draft →
review → published → archived`; en esta fase, cambiar de `review` a `published`
es una acción editorial revisada en el repositorio.

Los paquetes `1.x` se rechazan de forma explícita. Carecen de ámbito y el
importador no intenta deducirlo; cada aviso debe abrirse en el editor vigente,
recibir un destino y volver a pasar por revisión.

La revisión de fuentes afines conserva fronteras pequeñas: videos ofrece
`getVideos*()`, Bonos ofrece `getBonuses*()`, y las preguntas docentes entran al
banco mediante `UNIT_1_EXERCISES`/`UNIT_1_BANK_ITEMS`. No se introduce un
repositorio genérico. El reemplazo por un CMS se describe en
[`CMS_ROADMAP.md`](./CMS_ROADMAP.md).

### Arquitectura académica multiunidad

La implementación distingue los metadatos estables del curso, el contenido
de cada unidad y su presentación:

```text
course.js (catálogo estable de siete unidades)
   ↓
physics/index.js → adapter explícito → unit-1/, unit-2/, unit-3/ o unit-4/
   ↓                                ├─ metadata + rutas
renderer académico común             ├─ contenido + fórmulas
                                    ├─ figuras + ejemplos + errores
                                    └─ banco + presenter MathML
   ↓
componentes academic/* + visualization/*
   ↓
rutas Astro breves, estáticas y base-aware
```

Cada tema tiene una ruta explícita y delega su composición a
`UnitTopicPage.astro`. Las rutas de las Unidades 2, 3 y 4 son wrappers estáticos breves, de
modo que Astro detecta cada página sin una ruta dinámica ni copias del renderer. La
plantilla busca las referencias declaradas por identificador; por eso una
fórmula, figura o error puede reutilizarse sin duplicar su definición.

El contenido se ofrece con profundidad progresiva:

- `essential`: definición o relación mínima que debe quedar clara;
- `understand`: interpretación y conexiones conceptuales;
- `deepen`: condiciones, matices o desarrollo formal;
- `explore`: extensión opcional que no debe confundirse con un requisito.

`AcademicSection` deja visible solo `essential`. `understand`, `deepen` y
`explore` usan `details` nativo; así reducen la longitud percibida sin ocultar
la base necesaria para comprender el tema. Al imprimir, CSS revela esos bloques. El
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

La modalidad `bonus` indica compatibilidad con los Bonos. No cambia el
propósito del ejercicio ni lo mueve al banco `measurement`. La elegibilidad se
declara además con `bonusEligible` y una `interaction` auto-calificable; esta
separación impide asumir que todo ejercicio público puede puntuarse.

`status` describe el flujo de revisión académica: `draft` es trabajo incompleto,
`review` está listo para revisión de César y `published` significa aprobación
docente final. Los ítems editoriales actuales permanecen en `review`; los
paquetes docentes importados permanecen en `draft` hasta una decisión
explícita. `purpose` separa
`learning` de un futuro banco `measurement`; `exposure` distingue `public` y
`restricted`. La página solo consume ejercicios públicos de aprendizaje que no
estén en borrador. Todavía no existe un banco de medición.

Un ejercicio puede declarar `visualizationId`. El adapter de la unidad lo
resuelve contra su registro y `OpenPractice` entrega la misma figura a
`AcademicVisualization`; `exercises.js` nunca contiene copias de SVG. Las
representaciones `graphical` y `visual` se validan contra una figura existente.

Antes de ejecutarse JavaScript, todos los ejercicios fijos públicos permanecen
en el HTML como una lista utilizable. Las instancias parametrizadas requieren
la mejora vanilla, que selecciona hasta cinco con
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
distorsión.

### Composición de un diagrama académico

`AcademicDiagram.astro` solo pinta. La composición completa —validación del
contrato, encuadre y colocación de cada etiqueta— vive en
`src/utils/diagram-geometry.js`, y la geometría pura de etiquetado en
`src/utils/diagram-layout.js`. Esa separación existe para que `validate.mjs`
reproduzca durante el build exactamente lo que se va a publicar:

```text
figura registrada (familia + dominio + primitivas físicas)
   ↓ prepareDiagram() — chart.js para la transformación
geometría SVG + caja de cada etiqueta
   ├─ AcademicDiagram.astro → SVG accesible
   └─ validate.mjs → verificador de colisiones ES/EN × escritorio/móvil
```

Cada figura declara una `family` obligatoria: `vector-geometry`,
`system-boundary`, `free-body`, `motion-sketch`, `concept-map` o `force-sum`.
La familia fija relación de aspecto sugerida, respiro del área de trazado,
política de colocación por primitiva y estilos por defecto; no contiene lógica
de transformación. Una figura puede sobrescribir `aspectRatio` cuando su
composición lo exige, como las circulares y la secuencia estroboscópica.

Las primitivas son `vectors`, `segments`, `curves`, `circles`, `rectangles`,
`points`, `annotations` y `grid`. `rectangles` describe regiones con la esquina
inferior izquierda en coordenadas físicas; su etiqueta va dentro cuando cabe y
sobre el borde cuando no, y esa decisión es del renderer. Un segmento es una
línea real —plano, cuerda, eje— salvo que declare `lineStyle: "dashed"`.

`labelPosition` elige entre `above`, `below`, `left`, `right`, `normal`,
`beyond-tip` e `inside`; `labelAnchor` y `labelOffset` quedan como anulaciones
editoriales explícitas. Una prop, un estilo o una colocación fuera del contrato
detienen el build: el fallo silencioso anterior mantuvo doce figuras publicando
menos de lo que declaraban.

Las familias `free-body` y `system-boundary` no admiten anotaciones en prosa
dentro del SVG. Una explicación pertenece al campo `explanation` del grupo de
figura, que ya se localiza y se lee en impresión.

La métrica tipográfica de las etiquetas se declara una sola vez en
`diagram-layout.js`; el componente la publica como variables CSS para que
global.css no conserve una copia. El ancho estimado de una etiqueta se deriva
del tamaño de fuente efectivo, de modo que la comprobación vale también con la
métrica mayor de móvil.

### Mapa de aprendizaje

Cada landing pasa `unit.topics` a `UnitLearningMap`. El componente
deriva los puntos del número y orden de temas, dibuja conexiones decorativas en
SVG y posiciona encima enlaces HTML reales. El SVG no es la fuente de verdad ni
duplica títulos o rutas. En móvil, el mismo `ol` abandona la geometría radial y
se presenta como un camino vertical; en impresión se convierte en una lista.
La API (`unitLabel`, `unitTitle`, `topics`) ya se comparte entre las Unidades 1, 2, 3 y 4 y queda disponible para unidades registradas posteriormente.

### Dominio y rutas de publicación

`astro.config.mjs` configura el origen canónico vigente:

```js
site: "https://aulafisica.com",
```

No se declara `base`, de modo que una ruta lógica como
`/fisica-basica-1/videos` se publica con esa misma ruta bajo
`https://aulafisica.com`.

La función `withBase()` realiza esa conversión al renderizar. Su núcleo puro, `resolveBasePath()`, permite comprobar el comportamiento desde `validate.mjs` sin simular el entorno de Astro. La regla de mantenimiento es:

- guardar rutas internas en datos desde la raíz lógica;
- llamar `withBase()` en todo `href` o `src` interno que Astro no gestione automáticamente;
- conservar anclas como `#unidad-1` y enlaces externos como URL completas;
- no escribir el dominio ni un prefijo histórico en componentes, páginas o datos.

Los imports CSS y los recursos generados por Astro reciben `base` durante el build. Los archivos servidos directamente desde `public/`, como el logotipo, deben pasar por `withBase()` cuando se referencian.

## Estilos

`src/styles/global.css` contiene variables y sistemas visuales compartidos. Sus bloques principales son:

- base tipográfica, color, espaciado y foco;
- cabecera, menú y portada;
- páginas generales y estados editoriales;
- estructura interna del curso;
- cronograma y unidades;
- visualizaciones SVG académicas y sus variantes responsive e imprimibles;
- simulación 1D en `kinematics-simulation.css`, separada de las figuras académicas estáticas;
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
`aula-fisica:theme`, almacenada en `localStorage` con uno de los valores
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
- contenido interactivo: `--content-canvas`, `--formula-bg`, `--bonus-bg`, `--simulation-bg` y `--data-series-*`.

Un componente nuevo debe consumir tokens semánticos, no decidir por sí mismo
si el tema es claro u oscuro. Por ejemplo, una tarjeta usa
`background: var(--surface)` y `color: var(--text)`. Solo se justifica un
selector `data-theme` cuando cambia el tratamiento de un recurso y no solo su
color; los diagramas raster que realmente admitan inversión pueden declarar
`data-theme-adaptive="invert"`. El logotipo y las imágenes editoriales no se
invierten automáticamente.

Las fórmulas, gráficas, simulaciones y Bonos deben dibujarse sobre los
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
`role="img"`, nombre ARIA, `desc` asociado y texto real. Una gráfica estática se renderiza durante el
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

### Simulación de cinemática 1D

La primera simulación concreta separa cinco responsabilidades:

```text
kinematics-1d.js                    modelo físico confiable y versionado
   ↓ resultados físicos
simulation-models.js               definición, límites y renderer permitido
   ↓ valida capacidades
simulation-experiences.json        experiencia pedagógica sin código
   ↓
kinematics-svg.js + chart.js       renderer SVG: geometría finita
   ↓
KinematicsSimulation.astro + runtime cliente (interacción y DOM)
```

El modelo físico implementa `x(t)`, `v(t)`, `a(t)`, desplazamiento, distancia y
cambio de sentido; no conoce SVG ni la experiencia. La definición
`kinematics-1d` expone `x0`, `v0`, `a` y `T`, con límites duros respectivos
`[-50,50]`, `[-20,20]`, `[-10,10]` y `[1,20]`, y señala únicamente el renderer
permitido `svg-kinematics-1d`. La experiencia `kinematics-1d` usa esquema
`2.0.0` y configura rangos pedagógicos, defaults, bloqueo, vistas, presets,
observaciones y contextos; no admite funciones, HTML, CSS, URL, fórmulas ni
propiedades silenciosas.

`x₀`, `v₀`, `a` y `T` se validan antes de modificar el estado. Una entrada
inválida pausa la reproducción, marca el campo y conserva la última geometría
válida; no puede enviar `NaN` o `Infinity` al SVG. El cambio de un parámetro
reconstruye muestras, dominios, ticks y curvas una sola vez. Un frame de
reproducción actualiza únicamente lecturas, cursor temporal, puntos y marcador
de posición.

La reproducción nunca empieza automáticamente. Al terminar el intervalo,
cambiar parámetros, mover manualmente el tiempo o perder visibilidad se cancela
el frame pendiente. `pagehide` también limpia el bucle. No se utiliza red,
`localStorage`, `sessionStorage`, Canvas ni HTML dinámico; los nodos SVG que
cambian se crean con `createElementNS` y el texto con `textContent`.

La experiencia declara la simulación como recurso global publicado y relaciona
sus contextos con `movimiento-1d` y `ecuaciones-movimiento`; el catálogo añade
solo la ruta y categoría. `UnitTopicPage` consulta
esa metadata y muestra el CTA solo donde corresponde; no contiene la ruta de la
simulación ni una lista paralela de temas.

### Simulación de proyectil 2D

La segunda familia conserva la misma separación y cambia únicamente el modelo y
el renderer:

```text
projectile-2d.js                    modelo físico puro y casos límite
   ↓ estado, resumen y muestras
projectile-canvas.js                proyección visual sin ecuaciones nuevas
   ↓
p5-projectile-renderer.js           ciclo mount/update/destroy en modo instancia
   ↓
ProjectileSimulation.astro          controles, lecturas y alternativa accesible
```

El modelo calcula posición, velocidad, aceleración, tiempo de vuelo, alcance,
altura máxima, vértice, impacto y muestras de trayectoria para `y₀`, `v₀`,
`θ` y `g`. Cubre lanzamientos oblicuos, horizontales, verticales y el contacto
inmediato degenerado sin emitir `NaN`, `Infinity` ni puntos bajo el suelo.

`p5-projectile-renderer.js` importa p5.js 2.3.1 de forma dinámica solo al
montarse. Usa `new p5(...)` en modo instancia y Canvas 2D; no crea funciones
globales ni usa `WEBGL`. El runtime mantiene el único `requestAnimationFrame` y
p5 permanece en `noLoop()`, de modo que cambiar parámetros o tamaño no duplica
bucles. `ResizeObserver` redimensiona el lienzo sin reiniciar la física, el evento
`themechange` vuelve a leer tokens CSS y `destroy()` desconecta observadores,
listeners, frames y el canvas.

El Canvas tiene descripción estática mediante p5 y una tabla de lecturas HTML
equivalente. Los controles, mensajes, presets y explicaciones permanecen fuera
del lienzo y son utilizables aunque el renderer visual falle. La dependencia se
sirve desde el bundle local, sin CDN, y se atribuye en
`THIRD_PARTY_NOTICES.md`.

### Autoría declarativa de simulaciones

El Laboratorio de simulaciones (`src/components/simulations/SimulationLab.astro`,
servido por `SimulationLabPage.astro`) es el primer constructor visual seguro,
aunque `published: false` retira su wrapper de página mientras no se decida
publicarlo. Presenta los modelos reales registrados y obtiene límites,
etiquetas, vistas y renderer desde metadata. Título, resumen, parámetros,
bloqueo, hasta cinco presets, hasta seis observaciones y contextos de las
unidades registradas se mantienen en memoria. Recargar descarta la sesión.

```text
formulario docente
   ↓ createSimulationExperienceDraft() + validación estricta
experiencia draft
   ├─ dispatcher → renderer real del modelo seleccionado
   └─ simulation pack 2.0.0 → descarga JSON explícita
                                  ↓
                     npm run import:simulations
                                  ↓ fuerza review
                     revisión humana en Git → published → build
```

La preview no inserta JSON en un script ejecutable ni usa `innerHTML`: Astro
escapa el atributo de datos inicial, el contrato rechaza marcado y el cliente
crea nodos con `createElement`, `textContent` y `replaceChildren`. Cada cambio
válido reconstruye la geometría una vez. El runtime mantiene un solo
`requestAnimationFrame`, lo cancela al pausar y expone `destroy()` para abandonar
la herramienta sin dejar listeners o animaciones activos.

El pack y la experiencia usan esquemas separados `2.0.0`. El pack declara ID
aleatorio, `createdAt`, `source: teacher` y experiencias `draft`; no incluye
cuentas, cookies, almacenamiento, dispositivo ni datos estudiantiles. El
importador solo lee JSON, valida el registro completo, rechaza IDs existentes y
escribe mediante archivo temporal con estado `review`.

El diseño registra un renderer SVG y tres renderers p5/Canvas 2D. Añadir otra
familia requiere modelo puro, metadata, renderer con ciclo de vida, experiencia
validada y pruebas; el contenido no puede inyectar un renderer arbitrario.
No existe editor de código o p5, parser de fórmulas, WebGL, sandbox, CMS, backend,
autenticación ni publicación directa. Un futuro modo avanzado con código
requerirá un sandbox y un modelo de seguridad distintos.

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

Canvas se usa en el proyectil porque la escena animada necesita redibujado
continuo, vectores y una trayectoria responsive. Controles, explicación y
alternativa accesible siguen fuera del lienzo. Una curva, diagrama vectorial o
gráfica imprimible de complejidad moderada debe continuar en SVG.

## Accesibilidad

Los contratos más importantes son:

- cada página tiene un solo `h1`;
- `aria-labelledby` debe apuntar a un ID existente y único;
- los SVG decorativos usan `aria-hidden="true"`;
- el menú mantiene un ciclo de foco y responde a Escape;
- el foco visible no debe eliminarse;
- los estados no dependen solamente del color;
- las gráficas y diagramas usan `role="img"`, `aria-label` y `desc` asociado para conservar nombre y descripción sin activar tooltips nativos; las series se diferencian también por patrón o marcador;
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
- contrato de avisos, filtro público por estado, categorías y rutas del hub docente;
- existencia de las rutas declaradas en `COURSE_NAV`;
- tres modos de participación, temas reales, contrato local/anónimo y ausencia de `research` o `measurement` públicos;
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
- catálogo de simulaciones, ruta publicada, contextos académicos reales y
  núcleo cinemático con casos límite, retorno, distancia por tramos y geometría finita;
- contrato académico: siete temas ordenados, capas de profundidad admitidas, referencias existentes entre contenido, fórmulas, figuras y errores;
- fórmulas MathML con significado, variables, condiciones, interpretación dimensional y errores asociados;
- registro de MathML inline sin notación de teclado pendiente en el contenido visible;
- banco vigente de 55 ejercicios fijos y 15 familias parametrizadas con identificadores únicos, taxonomías válidas, unidad esperada, tolerancia, solución y versión editorial;
- doce pruebas de participación para esquema, IDs, requeridos, enums, opcionales y serialización TXT/JSON/CSV con Unicode y saltos de línea;
- contratos de mapa, disclosure progresivo y secuencia de ejercicios sin persistencia ni dependencias nuevas;
- figuras académicas con dominios válidos, coordenadas físicas finitas y descripción accesible.
- Organizador de resultados: CSV robusto, correo y puntuaciones estrictos, incidencias, conciliación, políticas de duplicados/faltantes, consolidación y XLSX de tres hojas; los fixtures son sintéticos.

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

En desarrollo y `preview`, la página inicial está en `/`, igual que bajo el
dominio personalizado de producción. `withBase()` conserva la disciplina de
rutas lógicas y permite validar el resolvedor también con prefijos hipotéticos
sin introducirlos en el contenido.

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

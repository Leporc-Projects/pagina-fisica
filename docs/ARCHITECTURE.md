# Arquitectura de Aula Física

Este documento explica cómo se organiza el sitio y cómo fluye la información desde los datos hasta las páginas generadas. Está dirigido a quien necesite mantener el proyecto mientras aprende Astro, JavaScript y CSS.

## Visión general

Aula Física es un sitio estático construido con Astro. No tiene backend, base de datos ni estado persistente. Durante la compilación, Astro transforma los archivos `.astro` de `src/pages/` en páginas HTML dentro de `dist/`.

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
- `notices.json`: almacenamiento editorial actual de avisos; puede contener los cuatro estados.
- `notices.js`: adaptador de consultas; `getPublishedNotices()` es la frontera que consumen portada y `/avisos`.
- `videos.js`: contrato de metadatos de la biblioteca audiovisual.
- `theme.js`: preferencias admitidas, clave de almacenamiento y colores del navegador para cada tema efectivo.
- `participation.js`: contexto académico, temas reales y opciones públicas de las tres actividades de participación.
- `physics/index.js`: registro de unidades que ya tienen implementación académica.
- `physics/unit-1/`: contrato modular de la primera unidad. Separa metadatos y rutas (`unit.js`), explicación conceptual (`content.js`), fórmulas (`formulas.js`), figuras (`visualizations.js`), errores frecuentes (`common-errors.js`) y ejercicios fijos (`exercises.js` y `additional-exercises.js`). `families.js` contiene generadores parametrizados auditables, `teacher-questions.json` conserva borradores importados y `bank.js` compone esas fuentes sin confundirlas. `math-content.js` es una capa de presentación: asocia fragmentos literales registrados con MathML sin modificar esas fuentes.

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
- `bank/QuestionBankEditor.astro`: formulario docente local para previsualizar preguntas fijas y preparar un paquete JSON de borradores; no modifica el banco público.
- `notices/NoticeEditor.astro`: formulario local para preparar y previsualizar avisos como texto, sin publicar ni enviar datos.
- `teacher/TeacherToolsNav.astro`: navegación común del hub, los dos editores, el Centro de revisión y el Organizador.
- `participation/`: selector de actividad, tres formularios independientes, previsualización y acciones de exportación. Los componentes recogen o presentan campos; no definen el contrato de respuesta.
- `review/`: importación accesible, agregados descriptivos, listado paginado, revisión de propuestas, incidencias y exportación de una sesión docente local. La ruta de la herramienta los compone sin incorporar lógica de contratos.
- `results/`: importación del listado, configuración de fuentes, resumen, incidencias, consolidado y exportaciones del Organizador de resultados. Cada componente representa una etapa visible; el estado y los cálculos permanecen fuera de Astro y del DOM.
- `src/utils/paths.js`: contrato único para convertir rutas lógicas en rutas públicas mediante `import.meta.env.BASE_URL`. Conserva anclas y URL externas sin cambios.
- `src/utils/chart.js`: núcleo matemático puro para validar dominios, crear escalas cartesianas o isotrópicas, muestrear funciones, recortar geometría y producir paths SVG.
- `src/utils/exercise-batches.js`: filtra y selecciona tandas procurando variedad de tema, tipo, representación y dificultad; no conoce el DOM ni persiste actividad.
- `src/utils/exercise-families.js`: valida familias, genera parámetros con aleatoriedad criptográfica, evita combinaciones recientes en memoria y materializa una instancia determinista.
- `src/utils/bonus-audit.js`: audita candidatos por slot y simula diversidad de tandas sin modificar blueprints.
- `src/utils/question-pack.js`: contrato versionado, normalización y validación compartida por el editor y el importador del repositorio.
- `src/utils/notices.js`: contrato canónico de avisos, estados, categorías, enlaces seguros, orden, paquetes e importación.
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
| `src/pages/herramientas.astro` | `/herramientas` |
| `src/pages/actividades.astro` | `/actividades` |
| `src/pages/fisica-basica-1/index.astro` | `/fisica-basica-1` |
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
| `src/pages/fisica-basica-1/herramientas/revision.astro` | `/fisica-basica-1/herramientas/revision` |
| `src/pages/fisica-basica-1/herramientas/banco.astro` | `/fisica-basica-1/herramientas/banco` |
| `src/pages/fisica-basica-1/herramientas/avisos.astro` | `/fisica-basica-1/herramientas/avisos` |
| `src/pages/fisica-basica-1/herramientas/notas.astro` | `/fisica-basica-1/herramientas/notas` |

`index.astro` representa la carpeta que lo contiene. Por eso `fisica-basica-1/index.astro` no produce `/fisica-basica-1/index`, sino `/fisica-basica-1`.

Los recursos pertenecen al curso que los selecciona. Por eso la página real
forma parte de `COURSE_NAV`; `/recursos` no mantiene contenido duplicado y
solo produce una redirección estática base-aware para enlaces anteriores.

`Participa` también pertenece a `COURSE_NAV`, pero declara
`includeInGlobalMenu: false`. `CourseNav` presenta la lista completa dentro de
Física Básica I y `site.js` filtra esa entrada al construir el submenú global.
Así la ruta permanece en el contexto del curso y no aparece en portada ni como
sección general del sitio.

### Participación y exportación local

La participación aplica mejora progresiva sobre tres formularios HTML
independientes. Elegir una actividad revela únicamente su formulario; preparar
una respuesta crea un solo objeto en memoria y oculta los controles durante la
previsualización. Editar vuelve al formulario sin almacenar una copia.

```text
campos del formulario activo
   ↓ src/scripts/participation.js
createParticipationResponse()
   ↓ valida esquema, enums, requeridos, tema, ID y fecha
objeto único de respuesta en memoria
   ├─ participationSummary() → previsualización
   ├─ toParticipationText() → copiar / TXT
   ├─ toParticipationJSON() → JSON completo
   ├─ toParticipationCSV() → fila tabular UTF-8
   └─ CSS @media print + window.print() → impresión / Guardar como PDF
```

El contrato público `1.0.0` contiene `schemaVersion`, `responseId`,
`activityType`, contexto de curso/unidad/tema, `createdAt`, `purpose`,
`collection`, `privacy`, `submissionTarget` y `payload`. `createdAt` se conserva
en ISO 8601 y solo se presenta con el locale del navegador; no se registra la
zona horaria como campo. `responseId` representa 128 bits generados con
`crypto.getRandomValues()` y solo identifica el archivo, sin IP, user-agent ni
datos del dispositivo.

Los propósitos de participación son `learning`, `feedback` y `contribution`.
No incluyen `research` ni `measurement`. `collection` es únicamente `local`,
`privacy` es `anonymous` y `submissionTarget` permanece `null`. Un adaptador de
entrega futuro deberá recibir el mismo objeto después de definir propósito,
consentimiento y flujo docente; no debe reescribir el contrato desde el DOM.

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
posteriormente. El prefijo BOM facilita que lectores tabulares reconozcan UTF-8.

La impresión elimina cabecera, navegación, formularios, botones y decoración;
conserva marca, tipo, tema, respuesta, campos presentes, ID y fecha. No existe
una biblioteca de PDF: “Imprimir / PDF” abre la capacidad nativa del navegador.

La documentación de minimización, categorías de datos y conexión futura está
en [DATA_AND_PRIVACY.md](./DATA_AND_PRIVACY.md).

### Recopilación controlada y revisión docente

`/fisica-basica-1/herramientas/revision` es una herramienta docente discreta,
enlazada desde Recursos pero ausente de `COURSE_NAV` y de la navegación global.
No representa un área privada: no tiene autenticación, backend ni control de
acceso. Todo el procesamiento ocurre en la pestaña mediante File API.

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

Una instancia parametrizada recibe un ID derivado de su familia y de los
parámetros, pero la interfaz no presenta el `familyId`. En Práctica se genera al
entrar en una tanda. En Bono se materializa antes de crear el intento, y el
snapshot conserva enunciado, respuesta, parámetros, versión e ID de instancia;
la corrección y las exportaciones nunca regeneran la pregunta.

`/fisica-basica-1/herramientas/banco` no es administración ni tiene
autenticación ficticia. Previsualiza `singleChoice`, `number` y `multiNumber`,
mantiene borradores en memoria y exporta `aula-fisica-question-pack-*.json` con
esquema versionado, `authorSource: "teacher"` y `status: "draft"`. Contenido
con `requiresEditorialMath: true` queda fuera de Bonos hasta composición y
revisión editorial.

El comando `npm run import:questions -- ruta/paquete.json` acepta solo JSON,
valida IDs, temas, respuestas y duplicados, y combina los borradores en
`teacher-questions.json`. No ejecuta el archivo, no publica y no cambia el
estado a `review` o `published`. El flujo sigue siendo:

```text
editor local → paquete docente JSON → importador del repositorio
             → borrador separado → revisión/corrección → aprobación/publicación
```

### Avisos y flujo editorial

`notices.json` conserva los datos y `notices.js` oculta su representación física.
Las páginas solo llaman `getPublishedNotices()` o `getHomepageNotices()`; una
fuente futura puede sustituir el JSON sin cambiar consumidores. La portada
prioriza los destacados y desaparece por completo cuando la consulta está
vacía. `/avisos` conserva un estado vacío compacto.

El Editor de avisos genera ID, versiones y estado `draft`, muestra el contenido
con las mismas clases públicas y exporta `aula-fisica-notice-pack-*.json`. El
importador acepta solo JSON, valida fechas, categorías, duplicados, texto y
enlaces, y fuerza `review`:

```text
editor local → notice pack (draft) → npm run import:notices
             → notices.json (review) → aprobación en repo → published → build/deploy
```

`publishedAt` es metadato editorial, no un programador. En un sitio estático un
cambio de disponibilidad requiere un build. La transición completa es `draft →
review → published → archived`; en esta fase, cambiar de `review` a `published`
es una acción editorial revisada en el repositorio.

La revisión de fuentes afines conserva fronteras pequeñas: videos ofrece
`getVideos*()`, Bonos ofrece `getBonuses*()`, y las preguntas docentes entran al
banco mediante `UNIT_1_EXERCISES`/`UNIT_1_BANK_ITEMS`. No se introduce un
repositorio genérico. El reemplazo por un CMS se describe en
[`CMS_ROADMAP.md`](./CMS_ROADMAP.md).

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

Un ejercicio puede declarar `visualizationId`. `OpenPractice` lo resuelve contra
`UNIT_1_VISUALIZATIONS` y entrega el mismo registro a
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

# Guía de contenidos

Esta guía describe cómo incorporar contenido sin romper las fuentes académicas, la privacidad o los derechos de autor del proyecto.

## Principios editoriales

- Publicar solamente información real, revisada y pertinente.
- Mantener separados los datos académicos centrales y el contenido editorial del sitio.
- No asumir que el programa oficial y el plan clase a clase organizan los temas de forma equivalente.
- No publicar contacto, oficina, horario de atención ni información del profesor del taller.
- No incorporar todavía el cronograma del taller sin una decisión académica explícita.
- La interfaz pública no muestra etiquetas de novedad, versiones de desarrollo ni estados internos. Los estados visibles describen disponibilidad o acciones reales del usuario.

## Añadir un aviso

Los avisos se almacenan en `src/data/notices.json`. Las páginas no leen ese
archivo: consumen las consultas de `src/data/notices.js`, que entregan solo
registros `published`. La portada muestra hasta tres y prioriza `featured`;
`/avisos` ordena el archivo público por fecha descendente.

Cada aviso admite:

```json
{
  "schemaVersion": "3.0.0",
  "id": "notice-AAAA-MM-DD-sufijo",
  "version": 1,
  "locale": "es",
  "title": "Título verificado",
  "summary": "Resumen público",
  "content": "Detalle del aviso",
  "category": "Curso",
  "publishedAt": "AAAA-MM-DD",
  "featured": false,
  "href": "/ruta-interna-opcional",
  "status": "review"
}
```

Reglas:

- El editor genera `schemaVersion`, `id`, `version` y el estado inicial `draft`.
- `publishedAt` usa una fecha ISO real `AAAA-MM-DD`; no programa la publicación.
- Las categorías admitidas son `Curso`, `Evaluación`, `Material`, `Horario` y `General`.
- Los estados siguen `draft → review → published → archived`; solo `published` es público.
- `locale` es obligatorio. Un aviso solo puede aparecer en páginas del mismo idioma; no se traduce ni se reutiliza automáticamente bajo otra URL.
- `href` se omite cuando el aviso no necesita destino. Una ruta interna se
  guarda desde la raíz lógica, sin escribir `/pagina-fisica`; la página de
  avisos añade el `base` activo. Enlaces externos deben usar HTTPS.
- `title`, `summary` y `content` son texto. No se admite HTML ni scripts.
- No se inventan cambios de clase, exámenes o eventos académicos.
- `Próximamente`, `En preparación` y `Sin material publicado` solo describen
  una disponibilidad real; no se usan etiquetas de novedad o proceso interno.

El flujo normal es preparar el paquete en
`/fisica-basica-1/herramientas/avisos`, descargarlo e importar:

```sh
npm run import:notices -- ruta/al/paquete.json
```

El importador fuerza `review` y nunca publica. Después se revisa el JSON, se
cambia explícitamente a `published` si corresponde y se ejecutan validación,
build y despliegue.

## Añadir o traducir contenido público

La cobertura y el flujo están definidos en [I18N.md](./I18N.md). No se crea una ruta inglesa hasta que toda la página, navegación local, metadata, estados vacíos y contenido asociado estén revisados. La ausencia de traducción se representa con `null` en el mapa de rutas y con el selector deshabilitado; nunca con contenido español bajo `/en/`.

Los textos comunes de interfaz usan claves en los diccionarios `src/i18n/ui/`. Las magnitudes, parámetros, unidades, ecuaciones y límites físicos permanecen compartidos. Las experiencias de simulación añaden texto por locale dentro de su contrato y conservan una única configuración numérica.

Toda nueva feature core se desarrolla en ES y EN desde el inicio y no se integra con traducción faltante. El contenido editorial que sea realmente específico de un idioma declara `locale` explícitamente y no usa fallback silencioso. La cobertura estudiantil y docente actual es completa en ambos idiomas.

## Registrar un video mediante enlace

Los videos se registran en `src/data/videos.js` cuando exista una publicación real y aprobada. El repositorio almacena metadatos y enlaces; no debe almacenar archivos de video pesados.

Contrato de un registro:

```js
{
  id: "unidad-1-identificador-estable",
  title: "Título aprobado por el docente",
  description: "Descripción revisada",
  unit: 1,
  duration: "Duración verificada",
  date: "AAAA-MM-DD",
  url: "Enlace público aprobado",
  language: "es",
  thumbnail: "Ruta o enlace opcional aprobado",
  status: "disponible",
}
```

No se deben añadir títulos, fechas, miniaturas o URL provisionales para completar visualmente la página. Mientras no existan registros reales, `VIDEOS` permanece vacío y la página muestra su estado editorial.

`language` es obligatorio. La interfaz puede indicar, por ejemplo, “Language: Spanish” sin afirmar que el audio o el título oficial existe en otro idioma. La URL, el título oficial y la atribución no se traducen arbitrariamente.

Antes de publicar un enlace externo, comprobar que:

- corresponde al material descrito;
- es accesible públicamente;
- no apunta a una copia no autorizada;
- su publicación fue aprobada;
- no expone datos personales.

## Añadir o modificar una unidad

Las unidades se encuentran en `UNITS`, dentro de `src/data/course.js`. Cada registro contiene número, título, capítulos, descripción y temas.

Una modificación requiere:

1. revisar el programa oficial y el plan clase a clase;
2. identificar si la diferencia es de contenido estable o de desarrollo semestral;
3. no asumir equivalencia entre organizaciones temáticas distintas;
4. solicitar aprobación de César Barrero antes de cambiar las siete unidades vigentes;
5. conservar números únicos y consecutivos;
6. revisar curso, unidades, ejercicios y videos, porque todas esas páginas consumen `UNITS`.

Cuando una unidad pase de catálogo a contenido desarrollado, debe tener su
propio módulo bajo `src/data/physics/` y registrarse en
`src/data/physics/index.js`. Las Unidades 1, 2, 3 y 4 implementan el mismo contrato;
una unidad nueva debe reutilizarlo:

```text
unit.js          rutas, orden, fuentes y prioridad editorial
content.js       explicación organizada por tema y profundidad
formulas.js      expresiones MathML y condiciones de uso
visualizations.js datos físicos y descripciones de figuras
examples.js       ejemplos resueltos estáticos, sin grading ni estado estudiantil
common-errors.js errores reutilizables
exercises.js     banco original y metadatos editoriales
math-content.js  presentación literal de expresiones inline con MathML
localize.js      proyección ES/EN de teoría, fórmulas, figuras y errores
bank.js          composición de ejercicios fijos y familias
```

Los ejemplos resueltos se referencian por ID desde `content.js` y se localizan
sin cambiar sus referencias a fórmulas o visualizaciones. Son exposición
académica: no declaran respuesta calificable, feedback, intento, progreso ni
estado estudiantil.

La ley de Hooke aparece en una fuente de organización posterior, pero no forma
parte del alcance autorizado de la Unidad 3. La reconciliación de esa
discrepancia queda registrada para la revisión académica transversal del
Bloque 9; no se añade como tema ni como deuda de implementación de esta unidad.

Para añadir un tema a una unidad ya implementada:

1. registrarlo en `unit.js` con `order`, `slug`, título, ruta y prioridad;
2. crear su entrada en `content.js` usando el mismo `slug`;
3. añadir una ruta Astro breve por locale que delegue en el renderer académico común;
4. referenciar fórmulas, figuras y errores por sus identificadores existentes;
5. crear un identificador nuevo solo cuando el contrato realmente sea distinto;
6. ejecutar las validaciones para detectar referencias huérfanas, orden o rutas inválidas.

El índice visual recibe `topics` directamente: no se añaden nodos, posiciones
ni conexiones manuales a `UnitLearningMap.astro`. Un tema nuevo con orden y
ruta válidos entra tanto al mapa de escritorio como al camino móvil.

No debe declararse una prioridad de evaluación, obligatoriedad o exclusión a
partir de la ubicación visual. La clasificación `extension` es metadato
editorial interno: orienta el orden de trabajo del equipo docente, pero no se
proyecta en ninguna superficie pública mediante color, insignia, eyebrow o
aviso especial. `coordenadas-polares` (Unidad 1) usa `priority: "extension"`
y se presenta con el mismo fondo, borde, forma y jerarquía que sus hermanos en
`AcademicUnitNav`, `UnitLearningMap` y `UnitTopicPage`.

## Profundidad progresiva del contenido

Cada sección académica core desarrolla un solo concepto mediante cuatro capas
obligatorias:

- `essential`: qué significa físicamente, con lenguaje accesible y sin exigir
  formalismo previo;
- `understand`: cómo funciona, cómo reconocerlo y cómo aplicarlo en casos
  básicos;
- `deepen`: formulación matemática, condiciones, deducciones y análisis
  dimensional cuando aporten al concepto;
- `explore`: generalizaciones, límites del modelo, conexiones o situaciones no
  ideales que amplían ese mismo concepto.

Las cuatro capas no son cuatro temas distintos. Deben responder a una misma
pregunta conceptual con profundidad creciente. Esencial usa frases directas,
define términos antes de emplearlos y ofrece primero una imagen física; no
infantiliza ni sacrifica precisión. La dificultad conceptual no debe provenir
de redacción ambigua. Las comprobaciones conceptuales se añaden en `checks`
cuando ayudan a detectar una confusión concreta; no simulan calificaciones.

`Esencial` permanece visible. `Comprende`, `Profundiza` y `Explora` usan
disclosure nativo cerrado inicialmente para que cada estudiante decida la
profundidad. En impresión, todo el contenido debe quedar disponible. Una
definición o condición indispensable permanece en Esencial; no se oculta solo
para acortar visualmente la página.

Las matemáticas inline conservan MathML semántico y deben alinearse con el
baseline del texto sin hacks por fórmula. Las expresiones display mantienen su
propio bloque y scroll local cuando lo necesitan.

## Añadir materiales propios

Los apuntes y guías pueden incorporarse cuando sean propios, estén revisados y tengan una ubicación clara en el curso.

- Los metadatos académicos centrales permanecen en `course.js`.
- Si surge un catálogo amplio de materiales, conviene crear un archivo específico en `src/data/` en vez de aumentar indefinidamente `course.js`.
- Los archivos públicos livianos pueden vivir en `public/` cuando exista autorización para publicarlos.
- No se suben libros, capítulos escaneados, solucionarios comerciales ni materiales cuya licencia no permita redistribución.

## Añadir un ejercicio

Cada unidad mantiene sus ítems fijos en `exercises.js`, sus familias
parametrizadas en `families.js` y la composición pública en `bank.js`. Unidad 1
conserva además `additional-exercises.js` y los borradores importados en
`teacher-questions.json`. Los enums viven una sola vez en
`src/data/physics/exercise-schema.js`; `exercise-builder.js` contiene los
defaults compartidos y cada unidad lo envuelve fijando su número. Los ejercicios son originales o parten
de semillas expresamente aprobadas; no se copian bancos ni solucionarios
comerciales. Cada registro usa un identificador estable y declara:

- ubicación: `unit`, `topic` y `subtopic`;
- uso pedagógico: `modalities` (`review`, `practice`, `selfAssessment`,
  `tutoring` o `bonus`);
- forma: `type` y `representation`;
- complejidad: `cognitiveLevel`, `difficulty`, prerrequisitos, objetivos y
  tiempo estimado;
- respuesta: tipo, valor esperado, unidad y tolerancia cuando sea numérica;
- acompañamiento: pistas, solución por pasos, errores frecuentes y
  retroalimentaciones aprobadas;
- edición: `status`, `version`, `purpose`, `exposure` y si el ejercicio es parametrizable;
- figura opcional: `visualizationId`, que debe existir en el registro central.

Un ejercicio que pueda entrar a Bonos declara `bonusEligible: true` y una
`interaction` compatible. `number` corresponde a `answer.kind: "number"`;
`multiNumber`, a `answer.kind: "values"`; `singleChoice` exige IDs de opción
únicos y un único `correctOptionId`. Una respuesta editorial de texto no se
vuelve auto-calificable sin opciones explícitamente revisadas.

Los Bonos se registran en `src/data/physics/<unidad>/bonuses.js`. Cada blueprint
se compone de ranuras con cantidad y filtros académicos. Al editar un blueprint
se debe comprobar que el banco público de aprendizaje puede satisfacer todas
las ranuras sin repetir ejercicios. No se añaden distractores o ejercicios
solo para completar una cuota técnica.

Una familia parametrizada es código editorial, no una plantilla de texto con
`eval`. Debe declarar restricciones, generar parámetros finitos y derivar de
ellos una instancia determinista. Sus fórmulas, signos, redondeo, unidades y
tolerancias requieren tests con cientos de generaciones. Práctica puede
materializarla al seleccionar una tanda; Bono debe guardar la instancia exacta
en su snapshot antes de mostrarla. Ningún exportador vuelve a generar valores.

Los identificadores de tema, subtema y error deben existir en los archivos de
la unidad. Un ejercicio numérico requiere unidad esperada y tolerancia; estos
campos no deben inferirse en el navegador. Al modificar un enunciado o su
respuesta se incrementa `version`, conservando el `id` si sigue siendo el mismo
ejercicio conceptual.

La página pública puede mostrar enunciado, pistas y solución. Campos como
estado editorial, versión, nivel cognitivo o tolerancia pertenecen al contrato
de autoría y no necesitan exponerse al estudiante. No deben añadirse intentos,
notas, nombres ni historiales al banco.

El feedback admite `correct`, `incorrect` y un mapa `commonErrors` para mensajes
asociados a errores identificados. El fallback debe ser neutral porque una
actividad puede ser conceptual, gráfica o numérica. Esta estructura no implica
un motor adaptativo ni autoriza generar retroalimentación durante el uso.

La práctica de cada unidad desarrollada consume ítems fijos e instancias parametrizadas mediante
`OpenPractice.astro`. JavaScript selecciona una tanda de hasta cinco ejercicios
con variedad razonable y permite filtrar por tema, dificultad y tipo. El hash
usa el `id` estable para volver a un ejercicio y el HTML conserva todos los
ítems fijos como fallback. Sets de IDs y combinaciones reducen repeticiones mientras la
página permanece abierta; se descarta al recargar. No se muestra `N de M` del
banco, no existe una meta de finalización y no se guardan progreso, respuestas,
historial ni filtros.

### Autoría docente mediante paquetes

El Editor de banco crea solo preguntas fijas `singleChoice`, `number` o
`multiNumber` con Question `2.0.0`. Genera el ID provisional, exige presentaciones completas ES/EN, muestra una previsualización seleccionable y exporta
un Question Pack `2.0.0`. La identidad, los IDs de opción o campo, las unidades, las tolerancias y la respuesta se escriben una sola vez; el texto vive en `presentations.es` y `presentations.en`. No debe simular autenticación, modificar el sitio ni
presentar un borrador como publicado. La dificultad introducida aquí sí es
editorial porque procede de autoría/revisión docente; nunca se toma de
`studentDifficultyEstimate`.

Todo paquete usa `authorSource: "teacher"` y `status: "draft"`. Si
`requiresEditorialMath` es verdadero, `bonusEligible` debe ser falso hasta que
se compongan y revisen MathML o figuras. Para incorporarlo se ejecuta:

```sh
npm run import:questions -- ruta/al/paquete.json
```

El importador solo lee JSON, rechaza IDs repetidos, temas, paridad o respuestas inválidas y rechaza paquetes/preguntas `1.x`
y escribe en el archivo docente separado. Después se revisan contenido,
notación, dificultad, errores frecuentes y estado mediante un cambio normal del
repositorio. Nunca se ejecuta JS suministrado ni se publica automáticamente.

Para un ejercicio cuya interpretación depende de una figura:

1. registrar datos físicos y descripción accesible en `visualizations.js`;
2. asignar su `id` a `visualizationId` en el ejercicio;
3. marcar `requiresVisualization: true` cuando la intención no pueda cumplirse sin la figura;
4. no copiar SVG, dominios ni series dentro de `exercises.js`;
5. comprobar que la figura no revele mediante etiquetas aquello que se pide deducir.

Las tutorías interactivas deben ser progresivas y deterministas. Las rutas de
ayuda, tolerancias, respuestas y retroalimentaciones serán definidas por el
equipo docente. Está prohibido integrar inteligencia artificial para
generarlas, evaluarlas o modificarlas durante el uso.

## Participación y propuestas estudiantiles

`/fisica-basica-1/participa` permite preparar localmente una dificultad, una
propuesta o una mejora. Los temas visibles deben proceder de `UNIT_1.topics` y
las opciones de interfaz viven en `src/data/participation.js`; no se copian
listas temáticas dentro de los formularios.

Reglas editoriales:

- no pedir nombre, correo, documento, ID institucional, grupo ni nota;
- no añadir campos sobre dispositivo, navegador, tiempo, clics, edición o uso;
- no guardar respuestas en cookies, `localStorage` ni servicios externos;
- no presentar “enviado” cuando el resultado solo está preparado en memoria;
- no añadir `research` o `measurement` como propósito de una respuesta pública;
- no usar estrellas, puntuaciones de satisfacción ni recompensas;
- conservar los campos opcionales como opcionales también en el contrato;
- alimentar toda representación desde el mismo objeto validado.

Las respuestas nuevas usan el esquema `1.1.0`. Si `helpfulSupport` es `other`,
`helpfulSupportOther` contiene obligatoriamente la explicación libre; para
cualquier otra opción ese campo se omite. El Centro de revisión conserva
compatibilidad de lectura con respuestas válidas `1.0.0`.

Una propuesta estudiantil no es un ejercicio. Su flujo editorial futuro es:

```text
propuesta estudiantil
   → revisión docente
   → corrección, si corresponde
   → aprobación explícita
   → creación separada de un ejercicio académico
```

Preparar, copiar o exportar una propuesta no avanza ese flujo. Solo después de
aprobación docente puede crearse manualmente un registro nuevo conforme al
contrato de `UNIT_1_EXERCISES`. La estimación de dificultad estudiantil nunca se
copia a `difficulty`; el equipo editorial debe asignar su propia dificultad en
la revisión académica.

Para añadir una actividad pública se debe ampliar explícitamente el enum, su
propósito, normalización, validación, resumen y columnas CSV. También requiere
pruebas de requeridos, opcionales, Unicode y serialización. No se añade un modo
mediante condicionales sueltos en el DOM.

Un mecanismo futuro de envío se conectará en la frontera que hoy ocupa
`submissionTarget: null`, después de definir privacidad, consentimiento y flujo
docente. No se debe introducir un proveedor o endpoint desde los componentes.
Ver [DATA_AND_PRIVACY.md](./DATA_AND_PRIVACY.md).

### Entrega de archivos y revisión docente

JSON es el formato canónico para trasladar una respuesta de Participa al Centro
de revisión. Si un curso utiliza Google Forms, Microsoft Forms u otro canal
externo, este solo recibe manualmente el archivo que el estudiante decide
adjuntar. Aula Física no llama su API, no incrusta un endpoint y no
presenta la preparación local como un envío. La instrucción al estudiante debe
ser concreta: exportar JSON y entregarlo por el canal indicado por el docente.

El Centro de revisión acepta cada archivo de forma independiente. Un error de
formato se describe sin descartar los demás y un ID repetido se marca como
duplicado, sin sugerir fraude ni contar dos veces la respuesta. No se importan
TXT o CSV arbitrarios porque perderían parte del contrato y harían ambigua su
validación.

El texto importado es contenido no confiable: se presenta como texto, nunca se
interpreta como HTML o código. La revisión no modifica el objeto original. Para
una propuesta se mantiene una capa local con uno de estos estados:

- pendiente;
- interesante;
- necesita ajustes;
- descartar;
- candidata al banco.

“Candidata al banco” es una decisión de clasificación docente, no una
aprobación académica. El paso posterior sigue siendo manual: revisar el
contenido, corregirlo, asignar metadatos editoriales y crear un registro nuevo
en `UNIT_1_EXERCISES` solo tras aprobación explícita. La nota docente y la
dificultad estimada por quien propone no deben copiarse como contenido o
dificultad editorial oficial.

Los resúmenes muestran conteos observables por actividad, tema u opción. No se
redactan diagnósticos, índices de satisfacción, perfiles, inferencias causales
ni conclusiones sobre todo el grupo. Los intentos de Bonos se consultan como
archivos individuales anónimos o identificados; el correo solo se muestra si el
archivo lo contiene y no se usa para consolidar notas o vincular intentos.

### Organizar resultados docentes

El Organizador de resultados recibe tablas genéricas: no se redacta lógica que
dependa de una posición fija o de que el archivo proceda de Google Forms o
Microsoft Forms. Cada fuente debe mostrar y permitir cambiar hoja, fila de
encabezado, columnas, escala y política de duplicados. Una sugerencia de
mapping ayuda a empezar, pero nunca sustituye la revisión docente.

Reglas editoriales y de datos:

- conservar el valor original y su referencia de archivo/fila;
- no corregir correos, completar dominios, fusionar identidades ni añadir
  desconocidos al listado;
- no llamar “nota oficial” a un resultado o promedio descriptivo;
- no convertir un número a porcentaje sin máximo conocido;
- tratar `missing` como estado; solo una política explícita puede usar cero en
  el promedio descriptivo;
- no aplicar Bonos a examen o taller sin una regla académica posterior;
- escribir cualquier texto importado como texto seguro en CSV/XLSX;
- utilizar únicamente listados y resultados manifiestamente sintéticos en
  pruebas, capturas y documentación del repositorio.

La corrección se realiza sobre el archivo o el mapping. No se añade una tabla
editable que permita reemplazar notas sin trazabilidad. Si en otro bloque se
introducen ponderaciones, escala 0–5 o correcciones manuales, deben ser
decisiones explícitas, auditables y seguir separadas de la nota oficial.

## Catálogo público de simulaciones

El catálogo presenta únicamente simulaciones `published`. Sus categorías se
derivan de esos recursos: una categoría vacía no se muestra como promesa de
trabajo futuro. Las simulaciones terminadas tampoco llevan badges
`Disponible`, `Available`, `Nuevo` o `New`; existen, se describen y se abren.
Los estados editoriales internos permanecen intactos.

## Añadir una fórmula

Las fórmulas de cada unidad desarrollada viven en su `formulas.js` y se referencian desde el
contenido por `id`. Cada registro debe incluir:

- MathML nativo con la expresión, sin convertirla en imagen;
- significado físico y definición de variables;
- condiciones bajo las que el modelo es válido;
- interpretación, dimensiones y errores frecuentes relacionados.

`FormulaBlock.astro` inserta el MathML con `set:html` porque procede
exclusivamente de módulos internos versionados. Nunca debe usarse ese flujo
para contenido introducido por usuarios o recuperado de una fuente externa sin
sanitización. Las ecuaciones deben revisarse semántica y dimensionalmente,
además de comprobar su presentación en móvil y en ambos temas.

### Matemáticas dentro de texto

Una expresión incrustada en un párrafo, pista, solución o comprobación no debe
publicarse con notación de teclado como `v_0`, `8^4` o `sqrt(...)`. La Unidad 1
registra cada literal editorial en `math-content.js` mediante los constructores
de `src/utils/mathml.js`. El registro aporta:

- el fragmento exacto que aparece en la fuente;
- un nombre comprensible para tecnología de asistencia;
- una anotación TeX como representación semántica, no como entrada a un parser;
- el árbol MathML construido con `mi`, `mn`, `sub`, `sup`, `frac`, `sqrt` y demás utilidades pequeñas.

No se añade una regla genérica para interpretar guiones bajos, exponentes o
paréntesis. Cada unidad mantiene sus literales en `math-content.js`; si aparece una expresión nueva, se registra de forma explícita y se
revisa junto con su significado. `RichText.astro` la renderiza durante el
build; no añade MathJax, KaTeX ni JavaScript cliente.

Las barras de magnitud, valor absoluto o norma se crean con las abstracciones
de `mathml.js`. No se escriben como operadores verticales independientes ni se
ajustan con CSS para un caso concreto: los delimitadores semánticos deben poder
envolver vectores con flecha, subíndices, potencias y contenido compuesto.

## Registrar un error frecuente

`common-errors.js` conserva confusiones reutilizables con un `id`, tema, título,
explicación y corrección. El texto debe explicar por qué falla el razonamiento
y cómo revisarlo; no debe etiquetar ni juzgar al estudiante. Contenidos y
ejercicios enlazan esos identificadores para que una corrección conceptual no
se duplique en varios archivos.

## Estados de contenido

El contenido académico usa un flujo editorial independiente:

```text
draft → review → published
```

- `draft`: el registro está incompleto y no debe entrar a la práctica pública;
- `review`: está preparado para revisión, pero no tiene aprobación académica final;
- `published`: César Barrero aprobó académicamente esa versión.

Un ejercicio añadido directamente por el equipo editorial comienza en `review`
si está completo; un paquete del editor docente comienza siempre en `draft`.
No se debe usar `published` como sinónimo de
“compila” o “es visible técnicamente”. `purpose: "learning"` identifica el
banco de aprendizaje; `purpose: "measurement"` queda reservado para un banco
futuro. `exposure: "public"` permite exposición y `restricted` la impide. Esta
clasificación no debe mostrarse necesariamente al estudiante.

Los estados generales de recursos continúan siendo:

- `en-preparacion`: existe la estructura, pero el material aún no es utilizable.
- `proximamente`: existe una decisión de publicación, pero todavía no se ofrece el recurso.
- `disponible`: el recurso real fue revisado y puede utilizarse.

Un estado no debe anunciar disponibilidad si faltan el archivo, enlace o revisión académica correspondiente.

## Contenido compatible con ambos temas

Todo material nuevo debe revisarse en claro y oscuro. El contenido HTML no
debe escribir colores directos: debe usar los tokens documentados en
`global.css`, como `--surface`, `--text`, `--text-muted`, `--border` y
`--accent`. Los estados conservan texto o iconografía además del color para
que su significado no dependa de la percepción cromática.

El claro usa una identidad marfil/grafito con acento terracota y secundario
cobre; el oscuro conserva grafito, blanco cálido, cian y verde. No se debe
elegir un color pensando que tendrá el mismo valor en ambos temas: se elige el
token por su función y se comprueba contraste sobre la superficie real.

Para formatos que se incorporarán después:

- fórmulas y demostraciones usan `--formula-bg`;
- gráficas usan `--content-canvas` y las series `--data-series-*`;
- simulaciones usan `--simulation-bg`;
- Bonos y ejercicios interactivos usan `--bonus-bg` y las familias de estado semánticas;
- SVG propios deben preferir `currentColor` o variables CSS cuando necesiten adaptarse.

Una imagen raster no se invierte de forma global porque puede contener
fotografías, códigos de color académicos o una identidad visual propia. Solo
un diagrama preparado y verificado para esa transformación puede declarar
`data-theme-adaptive="invert"`. Las imágenes complejas pueden ofrecer en el
futuro variantes claras y oscuras sin cambiar el contrato de los componentes.

El sistema de tema persiste exclusivamente la configuración visual
`aula-fisica:theme`. Ningún Bono, diagnóstico, ejercicio, simulación o
tutoría debe reutilizar `localStorage` para guardar respuestas o datos de
estudiantes sin una decisión arquitectónica y de privacidad posterior.

## Añadir una gráfica o diagrama académico

El contenido académico consume
`src/components/visualization/CartesianChart.astro` para gráficas y
`AcademicDiagram.astro` para construcciones vectoriales o geométricas. La
fuente académica debe entregar magnitudes físicas; los componentes y
`src/utils/chart.js` se encargan de transformarlas y recortarlas para SVG.

Usar `CartesianChart` cuando x e y son ejes científicos independientes: por
ejemplo tiempo frente a posición. Usar `AcademicDiagram` cuando la geometría es
parte del significado: vectores, ángulos, circunferencias o trayectorias en un
plano físico. El segundo usa escala isotrópica por defecto, centra el área útil
y conserva una unidad física con el mismo tamaño en ambos ejes. No se debe
activar `scaleMode: "stretch"` en una figura cuya forma sea evidencia física.

Las etiquetas pueden declarar `labelOffset`, `labelAnchor` y `labelPosition`.
Estos valores desplazan únicamente la presentación del texto en unidades del
`viewBox`; nunca modifican el vector, punto o trayectoria física. Deben usarse
con moderación y revisarse en claro, oscuro y tamaños estrechos.

Los contratos de las figuras viven en `src/data/physics/<unidad>/visualizations.js`.
Una sección solo guarda el `id` de
la figura que necesita. Así, datos físicos, transformación, geometría SVG y
presentación visual permanecen en capas distintas.

Ejemplo estrictamente estructural:

```astro
---
import CartesianChart from "../../components/visualization/CartesianChart.astro";

const points = [
  { x: 0, y: 1 },
  { x: 1, y: 2 },
  { x: 2, y: 1.5 },
];
---

<CartesianChart
  id="identificador-de-la-figura"
  title="Título académico aprobado"
  description="Descripción de la relación que debe interpretar el lector."
  xAxis={{ domain: [0, 2], label: "Magnitud x", unit: "unidad" }}
  yAxis={{ domain: [0, 3], label: "Magnitud y", unit: "unidad" }}
  series={[{
    id: "serie-principal",
    label: "Nombre de la serie",
    points,
    mode: "line-points",
  }]}
/>
```

El ejemplo muestra la API, no propone contenido para ninguna unidad. Antes de
publicar una gráfica real:

- verificar fuente, dominio, unidades, convención de signos y precisión;
- conservar los puntos, vectores y referencias en coordenadas físicas;
- usar `null` para separar ramas que no deben unirse;
- redactar `title` y `description` con significado académico;
- dar nombre textual a todas las series;
- no escribir coordenadas SVG, tamaños de pantalla ni colores en los datos;
- no usar el color como única diferencia entre curvas;
- revisar claro, oscuro, impresión y móvil;
- no incluir datos reales de estudiantes en series, etiquetas o anotaciones.

Las funciones suministradas mediante `functions` se muestrean durante el build.
Para datos experimentales o discretos debe preferirse `series`. Una línea de
referencia, vector o anotación se registra en su prop específica para conservar
su semántica y permitir estilos o accesibilidad coherentes.

Una interacción posterior debe usar controles HTML etiquetados y JavaScript
vanilla. El control conserva valores físicos y reutiliza las utilidades de
transformación; no debe almacenar respuestas, diagnósticos ni progreso. Si dos
gráficas se sincronizan, comparten el valor físico y no una posición SVG.

### Añadir o relacionar una simulación

Una simulación pública se compone de cuatro fuentes con responsabilidades
distintas:

- `simulation-models.js` registra el modelo disponible, sus parámetros, límites
  duros, capacidades y renderer permitido;
- `simulation-renderers.js` registra la relación cerrada entre modelo y renderer;
- `simulation-experiences.json` conserva la configuración pedagógica versionada;
- `simulations.js` añade únicamente la ruta lógica y la categoría del catálogo.

No se repiten ID, título, descripción, modelId o contextos entre esas fuentes.
No se añaden tarjetas, modelos o categorías con recursos ficticios. `published`
es el único estado que puede aparecer como disponible.

Una experiencia usa esquema `1.0.0`, solo referencia un `modelId` existente y
debe contener los parámetros completos. Sus mínimos y máximos permanecen dentro
de los límites duros, `minimum < maximum`, el default pertenece al rango y el
paso es positivo. Un parámetro con `editable: false` conserva su valor en todos
los presets, pero el estudiante no puede modificarlo. Al menos una vista marcada
como visual por el modelo debe estar activa. La validación no debe depender de
nombres de vistas propios de Cinemática 1D.

Los contextos relacionan un recurso global con `courseId`, número de unidad y
slugs de temas existentes. No son un ámbito de contenido ni una copia de la
navegación. Las páginas temáticas deben resolver la relación mediante
`getSimulationsForCourseTopic()`; no deben escribir la ruta de una simulación ni
repetir una condición por slug dentro de la plantilla.

Antes de publicar una experiencia interactiva:

- separar modelo físico, datos muestreados, transformación y actualización DOM;
- probar valores negativos, cero, límites, instantes extremos y dominios constantes;
- renderizar contenido explicativo y un estado inicial útil durante el build;
- usar controles nativos etiquetados, foco visible y mensajes de error asociados;
- evitar anuncios `aria-live` en cada frame; reservarlos para acciones y errores;
- no iniciar animación automáticamente y respetar `prefers-reduced-motion`;
- cancelar bucles al pausar, terminar, ocultar o abandonar la página;
- comprobar claro y oscuro a 1440, 1024, 768, 390 y 320 px;
- no usar red, persistencia, HTML dinámico, evaluación de código ni datos estudiantiles.

El Laboratorio local de `/fisica-basica-1/herramientas/simulaciones` prepara una
experiencia sin código. Su sesión existe solo en memoria y la preview usa el
mismo renderer/runtime de producción. Exporta un paquete `1.0.0` con fuente
`teacher` y estado `draft`. Para incorporarlo:

```sh
npm run import:simulations -- ruta/al/paquete.json
```

El importador rechaza esquemas, modelos, propiedades, rangos, vistas, presets,
textos, contextos o IDs inválidos y fuerza `review`. Después deben revisarse la
intención académica, unidades, límites, accesibilidad y comportamiento; solo una
edición explícita en el repositorio puede cambiar a `published`.

El texto de título, resumen, labels y guía es texto plano: no admite HTML ni se
interpreta como Markdown. Una experiencia no puede contener JavaScript,
funciones, CSS, renderer arbitrario, URL o expresiones matemáticas ejecutables.
El constructor actual no es un editor p5 ni un IDE.

No se aceptan capturas raster de gráficas que puedan generarse con esta
infraestructura. SVG preserva texto, nitidez y posibilidad de impresión. El
renderer de proyectiles usa p5.js en modo instancia sobre Canvas 2D porque la
escena animada requiere redibujado frecuente. Un nuevo renderer Canvas debe:

1. recibir resultados del modelo puro, sin duplicar ecuaciones físicas;
2. usar el ciclo `mount/update/destroy` y limpiar canvas, observers y frames;
3. mantener controles, lecturas y descripción accesible en HTML;
4. responder a tamaño, densidad de píxel, tema y movimiento reducido;
5. cargar su dependencia local de forma diferida y nunca desde CDN;
6. declarar dependencia, versión y licencia en `THIRD_PARTY_NOTICES.md`.

Para una tercera familia se añaden primero el modelo y sus tests; después su
metadata de parámetros/vistas, el registro del renderer, una experiencia válida,
el dispatcher y las pruebas del Laboratorio. Cambiar de modelo debe reconstruir
el borrador desde esa metadata y destruir la preview anterior, sin arrastrar
parámetros ni vistas incompatibles.

## Metadatos públicos y editoriales

No todo dato versionado debe mostrarse. Títulos, explicaciones, condiciones de
las fórmulas, enunciados, pistas y soluciones aprobadas forman parte del
contenido público. Estado, versión, taxonomía cognitiva, tolerancias internas y
referencias de validación permiten mantener ese contenido y pueden permanecer
editoriales. Esta separación facilita futuras herramientas sin convertir el
sitio en un sistema de seguimiento estudiantil.

No hay una ruta pública de desarrollo para visualizaciones. Los datos
sintéticos de comprobación no se publican; la infraestructura se valida con la
batería automatizada del proyecto.

## Privacidad y datos estudiantiles

Está prohibido incorporar al repositorio o mostrar públicamente:

- nombres de estudiantes;
- correos, documentos de identidad o códigos personales;
- notas individuales;
- listas de grupo;
- archivos reales usados para consolidar evaluaciones;
- capturas de plataformas académicas con información identificable.

La participación y las herramientas docentes actuales procesan datos
localmente en el navegador, no envían respuestas a servidores y no conservan
información al cerrar o recargar la página. La única persistencia
vigente es la preferencia visual, que no debe mezclarse con datos estudiantiles.

Las categorías, límites y decisiones pendientes se documentan en
[DATA_AND_PRIVACY.md](./DATA_AND_PRIVACY.md). Ese documento es una guía técnica
y editorial interna, no una política legal.

Los ejemplos de interfaz deben utilizar datos manifiestamente ficticios y no deben parecer registros reales. Cuando un ejemplo no sea necesario, es preferible omitirlo.

## Derechos de autor

- La bibliografía se publica como referencia, no como descarga.
- No se enlazan copias no autorizadas de libros comerciales.
- No se suben capítulos, escaneos, solucionarios o bancos de preguntas protegidos.
- Un recurso externo debe enlazar su fuente pública legítima.
- Las miniaturas, imágenes y documentos necesitan una licencia o autorización compatible con su publicación.

## Lista de comprobación antes de publicar

1. Confirmar la fuente y aprobación del contenido.
2. Revisar que no haya datos personales.
3. Revisar licencias y derechos de autor.
4. Confirmar que los estados editoriales sean honestos.
5. Comprobar enlaces y rutas.
6. Revisar legibilidad, estados y foco en tema claro y oscuro.
7. Ejecutar:

```sh
npm run validate
npm run verify
npm run build
npm audit
git diff --check
```

La estructura técnica del proyecto se explica en [ARCHITECTURE.md](./ARCHITECTURE.md).

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

Los avisos se registran en `src/data/notices.js`. La portada toma los tres más recientes y `/avisos` muestra el archivo completo ordenado por fecha.

Cada aviso admite:

```js
{
  id: "identificador-estable",
  date: "AAAA-MM-DD",
  category: "Categoría",
  title: "Título verificado",
  summary: "Resumen público",
  content: "Detalle opcional",
  featured: false,
  href: "/ruta-interna-opcional",
}
```

Reglas:

- `id` usa minúsculas, números y guiones; no debe cambiar después de publicarse.
- `date` usa formato ISO `AAAA-MM-DD`.
- `href` se omite cuando el aviso no necesita destino. Una ruta interna se
  guarda desde la raíz lógica, sin escribir `/pagina-fisica`; la página de
  avisos añade el `base` activo mediante `withBase()`.
- No se inventan cambios de clase, exámenes o eventos académicos.
- Sí puede informarse honestamente que una página o material está en desarrollo.

Después de añadirlo, ejecutar `npm run validate` para comprobar su identificador y cualquier enlace interno.

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
  thumbnail: "Ruta o enlace opcional aprobado",
  status: "disponible",
}
```

No se deben añadir títulos, fechas, miniaturas o URL provisionales para completar visualmente la página. Mientras no existan registros reales, `VIDEOS` permanece vacío y la página muestra su estado editorial.

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
`src/data/physics/index.js`. La Unidad 1 sirve como contrato de referencia:

```text
unit.js          rutas, orden, fuentes y prioridad editorial
content.js       explicación organizada por tema y profundidad
formulas.js      expresiones MathML y condiciones de uso
visualizations.js datos físicos y descripciones de figuras
common-errors.js errores reutilizables
exercises.js     banco original y metadatos editoriales
math-content.js  presentación literal de expresiones inline con MathML
```

Para añadir un tema a una unidad ya implementada:

1. registrarlo en `unit.js` con `order`, `slug`, título, ruta y prioridad;
2. crear su entrada en `content.js` usando el mismo `slug`;
3. añadir una ruta Astro breve que delegue en la plantilla de la unidad;
4. referenciar fórmulas, figuras y errores por sus identificadores existentes;
5. crear un identificador nuevo solo cuando el contrato realmente sea distinto;
6. ejecutar las validaciones para detectar referencias huérfanas, orden o rutas inválidas.

El índice visual recibe `topics` directamente: no se añaden nodos, posiciones
ni conexiones manuales a `UnitLearningMap.astro`. Un tema nuevo con orden y
ruta válidos entra tanto al mapa de escritorio como al camino móvil.

No debe declararse una prioridad de evaluación, obligatoriedad o exclusión a
partir de la ubicación visual. La clasificación `extension` solo comunica una
menor prioridad expositiva dentro del sitio.

## Profundidad progresiva del contenido

Cada sección académica puede usar cuatro capas. No es obligatorio llenar las
cuatro si la explicación no lo necesita:

- `essential`: definiciones, convenciones y relaciones indispensables;
- `understand`: interpretación física y conexiones entre representaciones;
- `deepen`: condiciones del modelo, matices y desarrollo formal;
- `explore`: ampliaciones opcionales claramente diferenciadas.

Los bloques deben avanzar en comprensión, no repetir el mismo párrafo con más
palabras. Las comprobaciones conceptuales se añaden en `checks` cuando ayudan a
detectar una confusión concreta; no se usan para simular calificaciones.

`Esencial` y `Comprende` deben poder leerse sin abrir controles. `Profundiza` y
`Explora` admiten disclosure nativo cuando son capas genuinamente opcionales.
No se debe mover una definición, condición indispensable o instrucción
necesaria a un bloque cerrado solo para acortar visualmente la página.

## Añadir materiales propios

Los apuntes y guías pueden incorporarse cuando sean propios, estén revisados y tengan una ubicación clara en el curso.

- Los metadatos académicos centrales permanecen en `course.js`.
- Si surge un catálogo amplio de materiales, conviene crear un archivo específico en `src/data/` en vez de aumentar indefinidamente `course.js`.
- Los archivos públicos livianos pueden vivir en `public/` cuando exista autorización para publicarlos.
- No se suben libros, capítulos escaneados, solucionarios comerciales ni materiales cuya licencia no permita redistribución.

## Añadir un ejercicio

La Unidad 1 mantiene los ítems fijos en `exercises.js` y
`additional-exercises.js`, las familias parametrizadas en `families.js` y los
borradores importados en `teacher-questions.json`. `bank.js` compone esas
fuentes para los consumidores. Los ejercicios son originales o parten
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

La práctica de Unidad 1 consume ítems fijos e instancias parametrizadas mediante
`OpenPractice.astro`. JavaScript selecciona una tanda de hasta cinco ejercicios
con variedad razonable y permite filtrar por tema, dificultad y tipo. El hash
usa el `id` estable para volver a un ejercicio y el HTML conserva todos los
ítems fijos como fallback. Sets de IDs y combinaciones reducen repeticiones mientras la
página permanece abierta; se descarta al recargar. No se muestra `N de M` del
banco, no existe una meta de finalización y no se guardan progreso, respuestas,
historial ni filtros.

### Autoría docente mediante paquetes

El Editor de banco crea solo preguntas fijas `singleChoice`, `number` o
`multiNumber`. Genera el ID provisional, muestra una previsualización y exporta
un paquete JSON versionado. No debe simular autenticación, modificar el sitio ni
presentar un borrador como publicado. La dificultad introducida aquí sí es
editorial porque procede de autoría/revisión docente; nunca se toma de
`studentDifficultyEstimate`.

Todo paquete usa `authorSource: "teacher"` y `status: "draft"`. Si
`requiresEditorialMath` es verdadero, `bonusEligible` debe ser falso hasta que
se compongan y revisen MathML o figuras. Para incorporarlo se ejecuta:

```sh
npm run import:questions -- ruta/al/paquete.json
```

El importador solo lee JSON, rechaza IDs repetidos, temas o respuestas inválidas
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
adjuntar. Papilla's Physics no llama su API, no incrusta un endpoint y no
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

## Añadir una fórmula

Las fórmulas de la Unidad 1 viven en `formulas.js` y se referencian desde el
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
paréntesis. Si aparece una expresión nueva, se registra de forma explícita y se
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
`papillas-physics:theme`. Ningún Bono, diagnóstico, ejercicio, simulación o
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

En la Unidad 1, los contratos de las figuras viven en
`src/data/physics/unit-1/visualizations.js`. Una sección solo guarda el `id` de
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

No se aceptan capturas raster de gráficas que puedan generarse con esta
infraestructura. SVG preserva texto, nitidez y posibilidad de impresión. Canvas
solo se evaluará para simulaciones densas o animadas cuya carga de elementos y
frecuencia de actualización lo justifique técnicamente.

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

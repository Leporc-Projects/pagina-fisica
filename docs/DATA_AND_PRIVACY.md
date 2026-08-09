# Datos y privacidad

Este documento registra decisiones técnicas y editoriales internas de
Papilla's Physics. No pretende ser una política legal ni sustituye una revisión
institucional cuando exista recopilación o investigación.

## Estado actual

El sitio es estático y no tiene backend, base de datos, analítica ni servicio de
envío. La participación de Física Básica I crea una respuesta únicamente en la
memoria de la pestaña. Prepararla no transmite ni guarda nada. Solo una acción
explícita del estudiante puede copiar el texto, descargar TXT/JSON/CSV o abrir
el diálogo de impresión para guardar un PDF.

Los Bonos también operan únicamente en memoria. Crean un intento local y
anónimo, calculan el resultado en el navegador y permiten copiar o exportar
después de finalizar. Solo si el estudiante elige “Preparar entrega” se crea
una copia separada con el correo institucional escrito en ese momento. El sitio
no la envía ni la persiste. Recargar o cerrar elimina ambos objetos; no existe
historial local.

El Centro de revisión docente lee los JSON que una persona selecciona desde su
equipo. La selección no carga archivos a Papilla's Physics ni a un tercero: se
validan y presentan en la memoria de esa pestaña. Sus filtros, notas y estados
de revisión tampoco persisten. La acción “Limpiar sesión” requiere confirmación
y descarta ese estado en memoria.

El Organizador de resultados puede procesar localmente un roster con nombre,
correo institucional, identificación y grupo, además de archivos CSV/XLSX y
Bonos JSON. Esos datos permanecen en la memoria de la pestaña: no se escriben
en `localStorage` o IndexedDB, no se envían por red y desaparecen al recargar,
cerrar o confirmar “Limpiar sesión”. Solo una exportación iniciada por el
docente crea archivos en su equipo.

La configuración visual claro/oscuro/sistema es la única preferencia persistida
por el sitio. Usa `localStorage` bajo `papillas-physics:theme` y no contiene
respuestas, contenido escrito, progreso ni identidad. No debe reutilizarse esa
clave o ese mecanismo para participación.

## Datos de una respuesta preparada

El objeto local puede contener:

- versión del esquema e ID aleatorio del archivo/respuesta;
- tipo de actividad;
- curso, unidad y tema seleccionado;
- fecha ISO 8601 de preparación;
- propósito, modo de recopilación y nivel de privacidad;
- contenido escrito y opciones escogidas para la actividad;
- `submissionTarget: null` como punto de extensión sin entrega configurada.

No contiene nombre, correo, documento, ID institucional, grupo, nota, IP,
user-agent, dispositivo, navegador, tamaño de pantalla ni zona horaria como
campo independiente. El ID aleatorio no identifica al estudiante y no se
combina con señales del dispositivo. Solo permite distinguir el archivo.

Como existe texto libre, la interfaz pide no escribir datos personales. El
contrato y el formulario no pueden impedir que una persona los incluya por
iniciativa propia; cualquier mecanismo futuro de recepción deberá considerar
esa posibilidad en su minimización y revisión.

Tampoco se mide tiempo de escritura, cambios, clics, scroll o permanencia. Que
el navegador permita observar una interacción no constituye un propósito para
recopilarla.

## Datos de un intento de Bono

Un intento puede contener:

- versión del esquema, ID aleatorio y versión del Bono;
- curso, unidad, fecha de inicio y fecha de finalización;
- IDs, versiones, orden y snapshot de título/enunciado de las preguntas;
- orden mostrado de opciones cuando corresponda;
- respuesta, corrección y puntos por pregunta;
- resultado total, porcentaje y desglose por tema de la tanda;
- subtemas que podría convenir repasar a partir de errores observados;
- `collection: local` e identidad anónima por defecto;
- para una copia de entrega opcional, `identity: { mode: "institutionalEmail", email }` y fecha local de preparación.

El intento anónimo no contiene identidad, IP, user-agent, pantalla, zona horaria independiente,
tiempo por pregunta, clics, scroll ni fingerprint. `startedAt` y `completedAt`
describen el intento, pero no se interpretan como indicador pedagógico.

El archivo exportado incluye snapshots y versiones para comprender qué recibió
el estudiante aunque el banco cambie. Puede editarse después de descargarlo y
no constituye una prueba de autenticidad, firma o certificación. El CSV
neutraliza prefijos que una hoja de cálculo podría interpretar como fórmulas;
esa protección no convierte el archivo en inmutable.

## Datos de una sesión de revisión

Una sesión docente puede contener los originales importados, nombres de
archivos fuente, resultados de validación, IDs duplicados, conteos descriptivos
y una capa local de revisión para propuestas. Esa capa puede incluir estado,
nota docente opcional y fecha ISO 8601 de la decisión. El original permanece
separado e inmutable durante la sesión.

El JSON de revisión conserva Participa, Bonos e incidencias. El CSV contiene una
fila por respuesta de Participa; TXT e impresión resumen los conteos y pueden
incluir respuestas abiertas cuando el docente lo decide. Todas las salidas son
archivos locales editables: no prueban autenticidad, identidad ni integridad y
no constituyen un registro institucional.

Los nombres de archivo podrían haber sido elegidos por sus autores y, por
tanto, no deben interpretarse como identidad. El Centro no extrae metadatos del
dispositivo, ruta local, IP, user-agent ni huella. Tampoco registra tiempo de
revisión, clics, navegación o tamaño de pantalla.

El reconocimiento básico de un intento de Bono comprueba su contrato, Bono y
versión, y permite consultar su resultado. Distingue anónimo/identificado,
muestra el correo solo cuando existe y permite filtrarlo, pero no crea una planilla de notas, no
vincula intentos entre sí y no estima dominio individual o grupal.

## Datos de una sesión del Organizador

La sesión puede contener:

- filas originales del roster y sus mappings;
- nombre, correo institucional, identificación y grupo si el docente los cargó;
- archivos fuente, hoja y fila de encabezado;
- valor original y normalizado de correo, score y timestamp;
- máximo configurado y porcentaje calculado cuando la escala es conocida;
- intentos de Bono identificados o anónimos y sus resúmenes validados;
- incidencias, políticas de duplicados/faltantes y valores resueltos;
- consolidado y estadísticas descriptivas por fuente.

El email normalizado es una llave de conciliación, no un identificador para
tracking. Se conserva `rawEmail`; no se eliminan puntos o aliases, no se
autocorrigen errores y no se recopila IP, user-agent, dispositivo, pantalla,
clics, scroll o tiempo en página. Los desconocidos no se incorporan al roster y
dos filas del roster con el mismo correo no se fusionan.

El flujo mantiene datos originales, normalizados, resoluciones y consolidado
como capas separadas. `missing` no significa cero y una escala desconocida no
se infiere. Los promedios, media, mediana, mínimo y máximo son descripciones de
porcentajes válidos; no son inferencia estadística, diagnóstico ni nota
oficial. La herramienta no modifica Examen 1–4 o Taller y no aplica Bonos a una
calificación.

El XLSX y los CSV pueden contener información identificable. El docente decide
descargarlos y es responsable de guardarlos en un lugar adecuado. Los textos
importados se neutralizan contra formula injection, pero los archivos siguen
siendo editables y no ofrecen autenticidad, firma, cifrado o control de acceso.
No se exporta ni reimporta una sesión completa en JSON en este bloque.

## Categorías y propósitos

Las categorías deben permanecer separadas:

| Categoría | Uso actual o previsto | Efecto automático |
| --- | --- | --- |
| `learning` | Material académico público, reflexión y Bonos locales | Puede calcular un resultado local; no registra progreso ni modifica calificaciones |
| `feedback` | Sugerencia sobre contenido o experiencia | No se envía en esta versión |
| `contribution` | Propuesta estudiantil sin revisar | No entra al banco académico |
| `measurement` | Banco futuro separado para instrumentos definidos | No participa en este flujo público |

El banco académico conserva `purpose: learning` o `purpose: measurement` y
`exposure: public` o `exposure: restricted`. Feedback no se convierte en
`measurement`. Una contribución no se convierte en `learning` por prepararse o
exportarse. `research` no es un propósito admitido por el contrato público de
participación.

## Anónimo, pseudónimo e identificado

- Anónimo: el registro no contiene ni enlaza un identificador de persona. Las
  respuestas locales actuales se diseñan en esta categoría.
- Pseudónimo: un código estable permite vincular registros entre sí o con una
  tabla separada, aunque el nombre no aparezca. El sitio no lo implementa.
- Identificado: el registro contiene o puede asociarse directamente con nombre,
  correo, documento u otro identificador personal. La copia opcional de entrega
  de un Bono y una sesión local del Organizador pueden pertenecer a esta
  categoría.

El correo es un dato personal. En Bonos identifica el archivo que el estudiante
decide preparar para entrega; en el Organizador es la llave explícita para
conciliar roster y resultados. Vive en memoria, puede entrar en exportaciones
identificadas y no se usa para analítica, medición, investigación, perfiles o
seguimiento. `acceptedDomains` es configuración editorial opcional de Bonos:
vacío significa validar solo sintaxis, no asumir un dominio. Un canal que ya
autentique al estudiante podrá desactivar el correo incrustado.

## Paquetes de autoría docente

El Editor de banco conserva en memoria enunciados, respuestas y metadatos
académicos escritos por el docente. El paquete exportado no pide ni incluye
nombre o correo del autor; registra solo `authorSource: teacher`, ID del paquete,
fecha y preguntas en borrador. El importador del repositorio procesa JSON como
datos, no código. Esta autoría académica es distinta de datos estudiantiles y no
convierte el editor en un servicio remoto.

Un ID aleatorio por respuesta no vuelve pseudónima la respuesta porque no se
reutiliza como identidad ni existe una tabla de correspondencia. Esta condición
deberá reevaluarse si un envío futuro asocia el archivo con una sesión, cuenta o
canal identificable.

## Minimización

El principio del proyecto es recopilar únicamente información con un propósito
explícito. Cada campo nuevo requiere documentar:

1. propósito concreto;
2. necesidad frente a alternativas menos intrusivas;
3. quién lo recibe y revisa;
4. tiempo y lugar de conservación;
5. forma de informar y obtener consentimiento cuando corresponda;
6. mecanismo para excluirlo de usos no previstos.

La conveniencia técnica, una futura posibilidad analítica o la facilidad de
añadir un campo no justifican recopilarlo.

## Propuestas estudiantiles

Una propuesta exportada conserva fuente `student`, revisión `unreviewed`,
`academicExerciseId: null` y `editorialDifficulty: null`. La dificultad que
estima el estudiante usa `studentDifficultyEstimate` y una escala distinta.

El flujo futuro requiere acciones docentes explícitas:

```text
propuesta → revisión docente → corrección → aprobación → ejercicio académico
```

La aprobación no debe mutar silenciosamente el archivo original. Debe producir
un registro académico separado, con autoría editorial, versión, propósito,
exposición y dificultad revisados conforme al banco.

## Consentimiento futuro

Antes de habilitar entrega o investigación deben definirse al menos:

- propósito y base institucional del flujo;
- datos exactos y campos opcionales;
- carácter anónimo, pseudónimo o identificado;
- destinatarios y responsabilidades docentes;
- conservación, eliminación y control de acceso;
- texto comprensible mostrado antes de enviar;
- acción afirmativa cuando se requiera consentimiento;
- alternativa pedagógica cuando participar no deba ser obligatorio;
- separación entre aprendizaje, feedback, medición e investigación.

No debe redactarse una aceptación genérica para cubrir finalidades todavía no
definidas.

## Mecanismo futuro de entrega

El contrato ya reserva `submissionTarget`, que permanece `null`. Un futuro
adaptador de entrega debería recibir el objeto validado que hoy usan los
exportadores. La secuencia prevista es:

```text
formulario → contrato validado → revisión local
                              → exportación local (actual)
                              → consentimiento → adaptador de entrega (futuro)
```

El adaptador no debe leer campos directamente del DOM ni reconstruir un modelo
paralelo. Antes de configurar proveedor, endpoint o credenciales deben cerrarse
las decisiones de privacidad, consentimiento, conservación y revisión docente.
No hay proveedor preseleccionado en esta versión.

### Canal manual antes de un adaptador

Un formulario externo puede utilizarse como buzón manual para que el estudiante
adjunte el JSON que exportó deliberadamente. En ese flujo el servicio externo,
no Papilla's Physics, recibe y conserva el archivo conforme a la configuración
que adopte el curso. El sitio no incrusta formularios, no llama APIs y no conoce
la URL del canal.

Antes de activar ese procedimiento deben definirse instrucciones, responsables,
acceso, retención y eliminación en el servicio elegido. También debe aclararse
si ese canal añade identidad por inicio de sesión, correo o metadatos, porque un
archivo diseñado como anónimo podría dejar de serlo al asociarse con la cuenta
que lo entrega.

Un backend futuro sería una arquitectura distinta y no una extensión silenciosa
del Centro local. Requeriría autenticación y autorización reales cuando
corresponda, validación en servidor, almacenamiento, auditoría de acceso,
retención y consentimiento definidos. No debe simularse privacidad mediante una
ruta poco visible o una etiqueta de interfaz.

# Datos y privacidad

Este documento registra decisiones técnicas y editoriales internas de
Aula Física. No pretende ser una política legal ni sustituye una revisión
institucional cuando exista recopilación o investigación.

## Estado actual

El sitio es estático y no tiene backend propio, base de datos propia ni servicio
de envío de respuestas. Usa Umami Cloud para pageviews agregados y cinco eventos
académicos mínimos; esa instrumentación no recibe respuestas, puntuaciones,
texto escrito ni identidad académica. Su contrato, límites y metodología se
documentan en [ANALYTICS_AND_METRICS.md](ANALYTICS_AND_METRICS.md). La
participación de Física Básica I crea una respuesta únicamente en la
memoria de la pestaña. Prepararla no transmite ni guarda nada. Solo una acción
explícita del estudiante puede copiar el texto, descargar TXT/JSON/CSV o abrir
el diálogo de impresión para guardar un PDF.

Los Mini quices también operan únicamente en memoria. Crean un intento local y
anónimo, calculan el resultado en el navegador y permiten copiar o exportar
después de finalizar. Solo si el estudiante elige “Preparar entrega” se crea
una copia separada con el correo institucional escrito en ese momento. El sitio
no la envía ni la persiste. Recargar o cerrar elimina ambos objetos; no existe
historial local.

El Editor de avisos vive al final del archivo público de avisos y opera solo en
memoria. No solicita identidad, no envía el borrador y solo crea un archivo
local cuando la persona activa explícitamente la exportación.

La configuración visual claro/oscuro/sistema es la única preferencia persistida
por Aula Física en el navegador. Usa `localStorage` bajo `aula-fisica:theme` y no contiene
respuestas, contenido escrito, progreso ni identidad. No debe reutilizarse esa
clave o ese mecanismo para participación o analítica.

## Datos de una respuesta preparada

El objeto local puede contener:

- versión del esquema e ID aleatorio del archivo/respuesta;
- tipo de actividad;
- ámbito (general o de un curso registrado) y, cuando el ámbito es de curso,
  el curso y, opcionalmente, la unidad y el tema seleccionados — nunca un
  tema sin unidad;
- fecha ISO 8601 de preparación;
- propósito, modo de recopilación y nivel de privacidad;
- contenido escrito y opciones escogidas para la actividad;
- `submissionTarget: null` como punto de extensión sin entrega configurada.

Desde el esquema 1.2.0, Participa existe en una ruta general (`/participa`)
además de la ruta de curso. Una respuesta preparada desde la ruta general
declara ámbito general y no lleva curso, unidad ni tema; una preparada desde
la ruta de curso, o desde la ruta general con un curso elegido explícitamente,
declara ese curso y, si el estudiante lo precisa, la unidad y el tema. Ningún
flujo envía ni guarda la respuesta automáticamente en ninguna de las dos
rutas: la preparación, la copia, la descarga y la impresión siguen siendo
acciones explícitas del estudiante.

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

## Datos de un intento de Mini quiz

Un intento puede contener:

- versión del esquema, ID aleatorio y versión del Mini quiz;
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

## Categorías y propósitos

Las categorías deben permanecer separadas:

| Categoría | Uso actual o previsto | Efecto automático |
| --- | --- | --- |
| `learning` | Material académico público, reflexión y Mini quices locales | Puede calcular un resultado local; no registra progreso ni modifica calificaciones |
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
  de un Mini quiz puede pertenecer a esta categoría.

El correo es un dato personal. En Mini quices identifica el archivo que el estudiante
decide preparar para entrega. Vive en memoria, puede entrar en esa exportación
identificada y no se usa para analítica, medición, investigación, perfiles o
seguimiento. `acceptedDomains` es configuración editorial opcional de Mini quices:
vacío significa validar solo sintaxis, no asumir un dominio. Un canal que ya
autentique al estudiante podrá desactivar el correo incrustado.

## Paquetes editoriales

Question Pack `2.0.0` permanece como contrato de importación para el almacén de
preguntas que alimenta la práctica pública. El paquete no incluye identidad del
autor y el importador procesa JSON como datos, no código. No existe un editor de
banco en el producto público.

El Editor de avisos tampoco recopila datos de estudiantes ni identidad del
autor. Conserva en memoria título, resumen, contenido, categoría, fecha,
destacado y enlace opcional; el paquete declara únicamente `source: teacher`,
ID, versión y fecha técnica de creación. El importador interpreta JSON como
datos, rechaza contenido o enlaces no permitidos y deja cada aviso en `review`.
No existe envío, persistencia en navegador ni publicación automática.

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
no Aula Física, recibe y conserva el archivo conforme a la configuración
que adopte el curso. El sitio no incrusta formularios, no llama APIs y no conoce
la URL del canal.

Antes de activar ese procedimiento deben definirse instrucciones, responsables,
acceso, retención y eliminación en el servicio elegido. También debe aclararse
si ese canal añade identidad por inicio de sesión, correo o metadatos, porque un
archivo diseñado como anónimo podría dejar de serlo al asociarse con la cuenta
que lo entrega.

Un backend futuro sería una arquitectura distinta y no una extensión silenciosa
del flujo local. Requeriría autenticación y autorización reales cuando
corresponda, validación en servidor, almacenamiento, auditoría de acceso,
retención y consentimiento definidos. No debe simularse privacidad mediante una
ruta poco visible o una etiqueta de interfaz.

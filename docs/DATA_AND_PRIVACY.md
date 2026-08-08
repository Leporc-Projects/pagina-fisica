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

## Categorías y propósitos

Las categorías deben permanecer separadas:

| Categoría | Uso actual o previsto | Efecto automático |
| --- | --- | --- |
| `learning` | Material académico público y reflexión conceptual local | No califica ni registra progreso |
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
  correo, documento u otro identificador personal. El sitio no lo implementa.

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

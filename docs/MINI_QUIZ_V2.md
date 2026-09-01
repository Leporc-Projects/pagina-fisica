# Mini Quiz V2

## Propósito y alcance

Mini Quiz V2 es evaluación formativa local. Da una tanda breve, calificación contenida, retroalimentación después del intento y rutas de repaso. No infiere dominio, confianza, diagnóstico clínico ni un perfil del estudiante. No añade identidad, persistencia remota ni envío automático.

`CONTENT_GUIDE.md` sigue siendo el contrato de autoría académica; `DATA_AND_PRIVACY.md` gobierna datos y privacidad; `I18N.md` gobierna la paridad ES/EN. Este documento solo fija la arquitectura propia de Mini Quiz V2.

## Independencia respecto de Practice

Cada ítem fijo y cada familia parametrizada V2 es un registro creado para Mini Quiz, con fuente `miniQuizV2`, modalidad `miniQuiz`, unidad e ID propios. Un banco V2 no puede registrar ni importar preguntas o familias de Practice. Se comparten únicamente infraestructura y fuentes canónicas como temas, errores comunes, visualizaciones, localización, calificación y oráculos físicos.

La independencia académica no se demuestra cambiando números o contexto superficial: requiere revisión humana del razonamiento que evalúa cada pregunta. No se duplica el banco de Practice para aparentar separación.

Los cuatro Mini Quizzes actuales de Unidad 1 son la excepción transitoria `legacy-v1`: conservan su banco compartido, IDs, rutas, blueprints, contenido y esquema de intento 1.x hasta que exista una sustitución V2 verificada.

## Bancos, familias y blueprints

Hay un registro V2 explícito por unidad, de 1 a 7. Cada banco separa `items`, `families` y `blueprints`, valida unidad y unicidad de IDs, y rechaza registros de Practice. Los blueprints fijan primero la cobertura; la selección aleatoria solo elige entre candidatos V2 que satisfacen cada slot.

La identidad académica, los parámetros, las respuestas, las tolerancias y los IDs son invariantes entre ES y EN. La localización sustituye presentación y retroalimentación, no los datos de calificación. Una familia V2 posee su propio generador determinista y no reutiliza una familia de Practice.

## Distractores diagnósticos

Una opción incorrecta `singleChoice` puede declarar:

```js
diagnostic: {
  commonErrorId: "stable-common-error-id",
  feedback: { es: "…", en: "…" },
}
```

El metadato es opcional. Al seleccionar ese distractor, la retroalimentación específica puede describir la interpretación representada por la opción; nunca afirma conocer el estado mental del estudiante. Si falta un diagnóstico válido se usa la retroalimentación incorrecta genérica. La opción correcta mantiene el flujo normal. `commonErrorId` no cambia entre idiomas.

## Resultados y recomendaciones

La puntuación conserva el criterio actual y no se convierte en una afirmación de dominio. Solo una pregunta perdida o parcialmente correcta produce evidencia de repaso. La resolución usa, en orden:

1. la ruta canónica precisa del error común diagnosticado o relevante;
2. la ruta canónica del subtema de la pregunta;
3. la ruta segura del tema y, como último resguardo, la unidad.

Las rutas se reciben del adaptador académico de la unidad. Las recomendaciones se deduplican por ruta conservando el primer orden de evidencia. No hay confianza inventada, historial ni perfil estudiantil.

## Runtime y compatibilidad

La página prepara una configuración serializable con curso, unidad, temas, subtemas, errores comunes y el ID del adaptador de familias. El runtime genérico consume esa configuración; no importa metadatos de una unidad ni carga las siete unidades en el navegador. La compatibilidad U1 V1 vive en un adaptador legado cargado bajo demanda.

El esquema de intento permanece en 1.1 porque el diagnóstico es metadato opcional dentro de una pregunta completada y los lectores 1.0/1.1 existentes siguen siendo válidos. Los nombres históricos `bonus` permanecen en el motor y en exportaciones 1.x para no ampliar el riesgo de migración.

## Verificación y migración

Cada banco V2 requiere revisión independiente de física, respuestas, tolerancias, soluciones, traducción y rutas de recomendación, además de las puertas de `PREPUBLICATION_VERIFICATION.md`. Los distractores diagnósticos exigen revisión semántica ES/EN y vinculación a un error común canónico.

La migración editorial avanza Unidad 1 → Unidad 7. Cada unidad reemplaza su excepción o ausencia solo cuando el banco, sus familias, blueprints, localización, pruebas y QA humano están completos. Ningún banco vacío publica una experiencia incompleta.

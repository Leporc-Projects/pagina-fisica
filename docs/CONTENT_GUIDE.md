# Guía de contenidos

Esta guía describe cómo incorporar contenido sin romper las fuentes académicas, la privacidad o los derechos de autor del proyecto.

## Principios editoriales

- Publicar solamente información real, revisada y pertinente.
- Mantener separados los datos académicos centrales y el contenido editorial del sitio.
- No asumir que el programa oficial y el plan clase a clase organizan los temas de forma equivalente.
- No publicar contacto, oficina, horario de atención ni información del profesor del taller.
- No incorporar todavía el cronograma del taller sin una decisión académica explícita.

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

## Añadir materiales propios

Los apuntes y guías pueden incorporarse cuando sean propios, estén revisados y tengan una ubicación clara en el curso.

- Los metadatos académicos centrales permanecen en `course.js`.
- Si surge un catálogo amplio de materiales, conviene crear un archivo específico en `src/data/` en vez de aumentar indefinidamente `course.js`.
- Los archivos públicos livianos pueden vivir en `public/` cuando exista autorización para publicarlos.
- No se suben libros, capítulos escaneados, solucionarios comerciales ni materiales cuya licencia no permita redistribución.

## Añadir ejercicios posteriormente

La página `/fisica-basica-1/ejercicios` es por ahora una hoja de ruta. No contiene bancos de preguntas.

Cuando existan ejercicios aprobados, primero debe definirse un contrato de datos estable, por ejemplo con:

- identificador único;
- unidad;
- tipo: diagnóstico, práctica guiada, ejercicio, reto o tutoría;
- título y enunciado aprobados;
- estado editorial;
- solución, pistas y retroalimentaciones definidas por el docente.

Si el catálogo crece, debe crearse un archivo como `src/data/exercises.js`. No se deben escribir siete copias manuales del mismo patrón dentro de la página.

Las tutorías interactivas deben ser progresivas y deterministas. Las rutas de ayuda, tolerancias, respuestas y retroalimentaciones serán definidas por el equipo docente. Está prohibido integrar inteligencia artificial para generarlas, evaluarlas o modificarlas durante el uso.

## Estados de contenido

- `en-preparacion`: existe la estructura, pero el material aún no es utilizable.
- `proximamente`: existe una decisión de publicación, pero todavía no se ofrece el recurso.
- `disponible`: el recurso real fue revisado y puede utilizarse.

Un estado no debe anunciar disponibilidad si faltan el archivo, enlace o revisión académica correspondiente.

## Privacidad y datos estudiantiles

Está prohibido incorporar al repositorio o mostrar públicamente:

- nombres de estudiantes;
- correos, documentos de identidad o códigos personales;
- notas individuales;
- listas de grupo;
- archivos reales usados para consolidar evaluaciones;
- capturas de plataformas académicas con información identificable.

Las futuras herramientas de evaluación procesarán archivos localmente en el navegador, no enviarán datos a servidores y no conservarán información al cerrar o recargar la página.

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
6. Ejecutar:

```sh
npm run validate
npm run build
npm audit
git diff --check
```

La estructura técnica del proyecto se explica en [ARCHITECTURE.md](./ARCHITECTURE.md).

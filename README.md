# Papilla's Physics

Sitio docente personal e independiente de César Barrero para organizar información académica, materiales propios y recursos relacionados con la enseñanza de la física. No constituye un sitio oficial de la Universidad de Antioquia.

El primer curso desarrollado es Física Básica I. Los datos académicos estables provienen del programa oficial y el cronograma del semestre 2026-2 se organiza a partir del plan clase a clase.

## Principios del proyecto

- El sitio no publica datos personales ni calificaciones individuales de estudiantes.
- No se deben incorporar archivos reales de estudiantes al repositorio.
- No se publican copias de libros comerciales ni otros materiales protegidos.
- Los ejercicios, soluciones, pistas y retroalimentaciones se publican solamente después de revisión docente.
- Las tutorías son deterministas y diseñadas por el docente; no utilizan inteligencia artificial.
- El sitio mantiene un carácter académico, sobrio, accesible y responsive.

## Stack

- Astro 7 con generación estática.
- HTML semántico, CSS y JavaScript.
- Node.js 22.12 o posterior y npm.
- Sin framework de interfaz, backend, base de datos o dependencias de estilos.

## Estructura principal

```text
pagina-fisica/
├── public/                 Archivos públicos e imágenes
├── scripts/                Validaciones internas sin dependencias
├── src/
│   ├── components/         Componentes Astro compartidos
│   ├── data/               Datos del curso, avisos y catálogos
│   ├── layouts/            Estructura común de las páginas
│   ├── pages/              Rutas generadas por Astro
│   └── styles/             Sistema visual global
├── astro.config.mjs
├── package.json
└── README.md
```

## Documentación

- [Arquitectura y flujo técnico](docs/ARCHITECTURE.md)
- [Guía para incorporar contenidos](docs/CONTENT_GUIDE.md)

## Rutas actuales

- `/`: portada y avisos recientes.
- `/fisica-basica-1`: información general del curso.
- `/fisica-basica-1/cronograma`: sesiones del semestre 2026-2.
- `/fisica-basica-1/unidades`: siete unidades y sus temas.
- `/fisica-basica-1/ejercicios`: catálogo futuro de práctica y tutorías.
- `/fisica-basica-1/videos`: biblioteca audiovisual por unidades.
- `/fisica-basica-1/evaluacion`: evaluación oficial y política de privacidad.
- `/avisos`: archivo público de avisos.
- `/recursos`: guías, bibliografía y recursos externos.
- `/simulaciones`: catálogo futuro de simulaciones.
- `/herramientas`: espacio futuro para utilidades docentes locales.
- `/actividades`: ruta de compatibilidad hacia ejercicios y tutorías.

## Desarrollo local

Después de instalar las dependencias declaradas en el proyecto:

```sh
npm run dev
```

La compilación estática se genera con:

```sh
npm run build
```

## Validación

La validación interna comprueba la evaluación, el cronograma, los identificadores, las rutas y los enlaces internos principales:

```sh
npm run validate
```

Para ejecutar la validación y compilar en una sola secuencia:

```sh
npm run verify
```

La revisión completa antes de publicar cambios también debe incluir:

```sh
npm audit
git diff --check
git status
```

## Incorporación de contenidos

### Avisos

Los avisos se registran en `src/data/notices.js`. Cada registro debe tener un identificador estable y único, fecha ISO, categoría, título y resumen. La portada y `/avisos` consumen esa misma fuente.

### Videos

Los videos se registran en `src/data/videos.js` únicamente cuando exista una publicación real y aprobada. No deben añadirse títulos, fechas, miniaturas o direcciones web provisionales.

### Recursos y bibliografía

La bibliografía académica se mantiene en `src/data/course.js`. Los recursos externos deben ser públicos, verificables y pertinentes; nunca deben enlazar copias no autorizadas de materiales comerciales.

### Datos académicos

`src/data/course.js` concentra los datos estables del curso y el cronograma. Cualquier diferencia entre el programa oficial y el plan clase a clase debe revisarse con el profesor antes de modificar la organización temática.

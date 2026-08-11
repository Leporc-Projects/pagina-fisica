# Aula Física

Sitio docente personal e independiente de César Barrero para organizar información académica, materiales propios y recursos relacionados con la enseñanza de la física. No constituye un sitio oficial de la Universidad de Antioquia.

El primer curso desarrollado es Física Básica I. Los datos académicos estables provienen del programa oficial y el cronograma del semestre 2026-2 se organiza a partir del plan clase a clase.

Sitio publicado: [https://aulafisica.com](https://aulafisica.com)

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
├── .github/workflows/       Automatización de GitHub Pages
├── public/                 Archivos públicos e imágenes
├── scripts/                Validaciones internas sin dependencias
├── src/
│   ├── components/         Componentes Astro compartidos
│   ├── data/               Datos del curso, avisos y catálogos
│   ├── layouts/            Estructura común de las páginas
│   ├── pages/              Rutas generadas por Astro
│   ├── styles/             Sistema visual global
│   └── utils/              Resolución compartida de rutas públicas
├── astro.config.mjs
├── package.json
└── README.md
```

## Documentación

- [Arquitectura y flujo técnico](docs/ARCHITECTURE.md)
- [Guía para incorporar contenidos](docs/CONTENT_GUIDE.md)

## Rutas actuales

Las rutas siguientes son rutas lógicas del proyecto y se publican desde la raíz de `https://aulafisica.com`.

- `/`: portada y avisos recientes.
- `/fisica-basica-1`: información general del curso.
- `/fisica-basica-1/avisos`: avisos publicados específicamente para el curso.
- `/fisica-basica-1/cronograma`: sesiones del semestre 2026-2.
- `/fisica-basica-1/unidades`: siete unidades y sus temas.
- `/fisica-basica-1/ejercicios`: catálogo futuro de práctica y tutorías.
- `/fisica-basica-1/videos`: biblioteca audiovisual por unidades.
- `/fisica-basica-1/evaluacion`: evaluación oficial y política de privacidad.
- `/fisica-basica-1/recursos`: guías, bibliografía y recursos externos del curso.
- `/fisica-basica-1/herramientas`: hub de herramientas docentes locales.
- `/fisica-basica-1/herramientas/avisos`: editor local de avisos.
- `/avisos`: archivo público de avisos.
- `/recursos`: compatibilidad; redirige a los recursos de Física Básica I.
- `/simulaciones`: catálogo futuro de simulaciones.
- `/herramientas`: acceso de compatibilidad al hub docente del curso.
- `/actividades`: ruta de compatibilidad hacia ejercicios y tutorías.

## Desarrollo local

Después de instalar las dependencias declaradas en el proyecto con `npm ci`:

```sh
npm run dev
```

El sitio se sirve por defecto en `http://localhost:4321/`. La configuración usa el dominio personalizado y no añade un prefijo `base`.

La compilación estática se genera con:

```sh
npm run build
```

Para revisar localmente el resultado de `dist/`:

```sh
npm run preview
```

La vista previa también se abre desde `/`.

## Rutas internas y `base`

`astro.config.mjs` define actualmente:

```js
site: "https://aulafisica.com",
```

Las estructuras de datos conservan destinos legibles desde la raíz lógica, como `/fisica-basica-1/recursos`. Los componentes convierten esos valores al `base` activo mediante `withBase()` de `src/utils/paths.js`, que usa `import.meta.env.BASE_URL`. No se debe escribir `/pagina-fisica` dentro de páginas o componentes.

Al añadir un enlace o recurso interno desde una plantilla Astro:

```astro
---
import { withBase } from "../utils/paths.js";
---

<a href={withBase("/avisos")}>Avisos</a>
<img src={withBase(SITE.logoPath)} alt="" />
```

Las anclas (`#contenido`) y las URL externas no necesitan el prefijo. `withBase()` las conserva si se usa con ellas.

## Despliegue en GitHub Pages

`.github/workflows/deploy.yml` construye y publica el sitio con GitHub Actions. En cada push a `main`, o al ejecutarlo manualmente, el workflow:

1. descarga el repositorio;
2. prepara Node.js 24 y la caché de npm;
3. configura GitHub Pages;
4. ejecuta `npm ci`, `npm run validate` y `npm run build`;
5. sube `dist/` como artefacto de Pages;
6. despliega el artefacto en el entorno `github-pages`.

Para habilitar la primera publicación, en GitHub hay que abrir **Settings → Pages → Build and deployment → Source** y seleccionar **GitHub Actions**. Después puede ejecutarse manualmente el workflow **Deploy to GitHub Pages** desde la pestaña **Actions**, o hacerse un nuevo push a `main`.

### Dominio personalizado

La publicación vigente usa `https://aulafisica.com`, declarado como `site` en
`astro.config.mjs` y configurado en GitHub Pages. No existe un `base` adicional.
Los componentes continúan resolviendo enlaces con `import.meta.env.BASE_URL`
para conservar rutas lógicas portables sin escribir el dominio en cada página.

## Validación

La validación interna comprueba la evaluación, el cronograma, los identificadores, las rutas, los enlaces internos principales y que las plantillas no introduzcan `href` o `src` literales incompatibles con `base`:

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

Los avisos se almacenan en `src/data/notices.json` con esquema `2.0.0` y un ámbito obligatorio: `{ "type": "global" }` o `{ "type": "course", "courseId": "fisica-basica-1" }`. El registro canónico de cursos vive en `src/data/courses.js`; no se deben inventar IDs o rutas en el contenido.

`src/data/notices.js` expone consultas separadas para todos los publicados, los generales, los de un curso y la selección de portada. `/avisos` muestra solo avisos generales; `/fisica-basica-1/avisos` muestra solo los del curso; la portada combina ambos ámbitos para los cursos activos, prioriza destacados y limita la salida a tres registros sin duplicados.

El editor local obtiene sus destinos del registro de cursos. Sus paquetes también usan esquema `2.0.0`. Los borradores se importan con `npm run import:notices -- archivo.json` y quedan en `review` hasta su aprobación editorial. Los paquetes `1.x` se rechazan porque no declaran ámbito; deben regenerarse y revisarse, nunca se infiere su destino.

### Videos

Los videos se registran en `src/data/videos.js` únicamente cuando exista una publicación real y aprobada. No deben añadirse títulos, fechas, miniaturas o direcciones web provisionales.

### Recursos y bibliografía

La bibliografía académica se mantiene en `src/data/course.js` y sus recursos se publican dentro de la ruta del curso correspondiente. Los recursos externos deben ser públicos, verificables y pertinentes; nunca deben enlazar copias no autorizadas de materiales comerciales.

### Datos académicos

`src/data/course.js` concentra los datos estables del curso y el cronograma. Cualquier diferencia entre el programa oficial y el plan clase a clase debe revisarse con el profesor antes de modificar la organización temática.

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
- p5.js 2.3.1, fijado localmente y cargado solo por el renderer de proyectiles.
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
│   ├── styles/             Sistema visual global y estilos de experiencias
│   └── utils/              Rutas, modelos físicos y geometría SVG pura
├── astro.config.mjs
├── package.json
└── README.md
```

## Documentación

- [Arquitectura y flujo técnico](docs/ARCHITECTURE.md)
- [Guía para incorporar contenidos](docs/CONTENT_GUIDE.md)
- [Internacionalización y cobertura bilingüe](docs/I18N.md)

## Rutas actuales

Las rutas siguientes son rutas lógicas del proyecto y se publican desde la raíz de `https://aulafisica.com`.

La cobertura actual está completa en español e inglés, tanto para el recorrido estudiantil como para las herramientas docentes. Las rutas inglesas equivalentes viven bajo `/en/`; las seis rutas docentes comparten implementación y conservan datos, IDs y claves de máquina entre idiomas.

- `/`: portada y avisos recientes.
- `/fisica-basica-1`: información general del curso.
- `/fisica-basica-1/avisos`: avisos publicados específicamente para el curso.
- `/fisica-basica-1/cronograma`: sesiones del semestre 2026-2.
- `/fisica-basica-1/unidades`: catálogo de siete unidades; las Unidades 1, 2 y 3 tienen contenido académico completo ES/EN.
- `/fisica-basica-1/ejercicios`: catálogo de práctica; abre los bancos de las Unidades 1, 2 y 3.
- `/fisica-basica-1/unidades/unidad-2`: Leyes de Newton, con siete temas y práctica propia.
- `/fisica-basica-1/unidades/unidad-3`: Fuerzas y ecuaciones de movimiento, con ocho temas y práctica propia.
- `/fisica-basica-1/videos`: biblioteca audiovisual por unidades.
- `/fisica-basica-1/evaluacion`: evaluación oficial y política de privacidad.
- `/fisica-basica-1/recursos`: guías, bibliografía y recursos externos del curso.
- `/fisica-basica-1/herramientas`: hub de herramientas docentes locales.
- `/fisica-basica-1/herramientas/banco`: editor bilingüe de preguntas fijas Question 2.0.
- `/fisica-basica-1/herramientas/avisos`: editor local de avisos.
- `/fisica-basica-1/herramientas/simulaciones`: Laboratorio local para configurar, previsualizar y exportar experiencias declarativas.
- `/fisica-basica-1/herramientas/revision`: Centro local de revisión.
- `/fisica-basica-1/herramientas/notas`: Organizador local de resultados.
- `/avisos`: archivo público de avisos.
- `/recursos`: compatibilidad; redirige a los recursos de Física Básica I.
- `/simulaciones`: catálogo canónico cuyas categorías se derivan de las simulaciones publicadas.
- `/simulaciones/cinematica-1d`: simulación propia de movimiento unidimensional con aceleración constante.
- `/simulaciones/proyectil-2d`: simulación propia de movimiento parabólico en Canvas 2D.
- `/en/`: portada y recorrido público completo en inglés.
- `/en/simulations`: catálogo completo de simulaciones en inglés.
- `/en/simulations/kinematics-1d`: Cinemática 1D en inglés.
- `/en/simulations/projectile-2d`: Proyectil 2D en inglés.
- `/en/basic-physics-1/tools`: hub docente y contrapartes inglesas completas de las cinco herramientas.
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

La validación interna comprueba la evaluación, el cronograma, los identificadores,
las rutas, los enlaces internos principales, el catálogo y los contextos de las
simulaciones, la infraestructura SVG y que las plantillas no introduzcan `href`
o `src` literales incompatibles con `base`:

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

## Simulaciones publicadas

Las experiencias interactivas comparten un contrato declarativo, pero cada
modelo conserva su renderer. Cinemática 1D usa SVG y el proyectil 2D usa p5.js
en modo instancia sobre Canvas 2D. Los modelos físicos puros viven en
`src/utils/kinematics-1d.js` y `src/utils/projectile-2d.js`; sus parámetros,
límites y vistas se registran en `src/data/simulation-models.js`; la relación
cerrada modelo/renderer vive en `src/data/simulation-renderers.js`; y la
configuración pedagógica publicada vive en
`src/data/simulation-experiences.json`. `src/data/simulations.js` es el adaptador
del catálogo y conserva solo ruta y categoría.

El contrato de experiencia y el de paquete usan esquema `2.0.0`. Una experiencia
solo contiene datos: defaults y rangos pedagógicos, parámetros editables o
bloqueados, vistas, hasta cinco casos de estudio, guía en texto plano y
contextos académicos opcionales. Los renderers reales son
`svg-kinematics-1d` y `p5-projectile-2d`. Ambos reciben estado ya calculado por
los modelos puros: el dibujo no incorpora ecuaciones físicas nuevas.

Los tres casos publicados son movimiento uniforme (`x₀=-6`, `v₀=2,5`, `a=0`,
`T=6`), parte del reposo (`x₀=-4`, `v₀=0`, `a=1,5`, `T=6`) y frena y regresa
(`x₀=-4`, `v₀=6`, `a=-2`, `T=6`). La experiencia no reproduce automáticamente,
no persiste parámetros o progreso, no usa red y conserva contenido y gráficas
iniciales útiles cuando JavaScript está desactivado.

El Laboratorio de simulaciones funciona completamente en memoria, no usa red,
`localStorage` ni identidad docente. Previsualiza mediante el mismo componente y
runtime que producción para cualquiera de los dos modelos registrados y descarga
un `simulation experience pack` en estado `draft`. Al cambiar de modelo reinicia
parámetros, vistas, presets y contextos incompatibles. Para incorporarlo al
almacenamiento editorial:

```sh
npm run import:simulations -- ruta/al/paquete.json
```

El importador acepta únicamente JSON, valida modelos, límites, vistas, presets,
texto y contextos, rechaza duplicados y fuerza `review`; nunca publica.

p5.js está fijado en la versión 2.3.1, se distribuye desde el paquete local y se
carga de forma diferida únicamente al montar el renderer de proyectiles; no hay
CDN ni globals `setup`/`draw`. Su atribución y licencia LGPL-2.1 están documentadas
en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Incorporación de contenidos

### Avisos

Los avisos se almacenan en `src/data/notices.json` con esquema `3.0.0`, locale explícito y un ámbito obligatorio: `{ "type": "global" }` o `{ "type": "course", "courseId": "fisica-basica-1" }`. Los avisos actuales tienen registros editoriales explícitos en ambos locales; nunca existe fallback o traducción en runtime entre ellos.

`src/data/notices.js` expone consultas separadas para todos los publicados, los generales, los de un curso y la selección de portada. `/avisos` muestra solo avisos generales; `/fisica-basica-1/avisos` muestra solo los del curso; la portada combina ambos ámbitos para los cursos activos, prioriza destacados y limita la salida a tres registros sin duplicados.

El editor local obtiene sus destinos del registro de cursos. Sus paquetes también usan esquema `3.0.0`. Los borradores se importan con `npm run import:notices -- archivo.json` y quedan en `review` hasta su aprobación editorial. Los paquetes anteriores se rechazan porque no declaran todos los campos obligatorios; deben regenerarse y revisarse, nunca se infiere su destino o idioma.

## Métricas LOC

`npm run stats:loc` cuenta líneas físicas determinísticamente y separa aplicación, tooling, tests, datos editoriales y documentación. Excluye dependencias, builds, caches, binarios, imágenes y `package-lock.json`. Puede medir cualquier commit sin cambiar el checkout:

```sh
npm run stats:loc
npm run stats:loc -- --ref HEAD
```

### Videos

Los videos se registran en `src/data/videos.js` únicamente cuando exista una publicación real y aprobada. Cada registro declara su idioma; no deben añadirse títulos, fechas, miniaturas o direcciones web provisionales.

### Recursos y bibliografía

La bibliografía académica se mantiene en `src/data/course.js` y sus recursos se publican dentro de la ruta del curso correspondiente. Los recursos externos deben ser públicos, verificables y pertinentes; nunca deben enlazar copias no autorizadas de materiales comerciales.

### Datos académicos

`src/data/course.js` concentra los datos estables del curso y el cronograma. Cualquier diferencia entre el programa oficial y el plan clase a clase debe revisarse con el profesor antes de modificar la organización temática.

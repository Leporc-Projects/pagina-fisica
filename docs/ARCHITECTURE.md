# Arquitectura de Papilla's Physics

Este documento explica cómo se organiza el sitio y cómo fluye la información desde los datos hasta las páginas generadas. Está dirigido a quien necesite mantener el proyecto mientras aprende Astro, JavaScript y CSS.

## Visión general

Papilla's Physics es un sitio estático construido con Astro. No tiene backend, base de datos ni estado persistente. Durante la compilación, Astro transforma los archivos `.astro` de `src/pages/` en páginas HTML dentro de `dist/`.

El flujo principal es:

```text
src/data
   ↓
componentes Astro
   ↓
src/pages
   ↓
BaseLayout + global.css
   ↓
astro build → dist
```

Esta separación evita escribir varias veces el mismo dato académico y permite cambiar contenido sin mezclarlo con la estructura visual.

## Capas del proyecto

### Datos

`src/data/` contiene estructuras JavaScript exportadas:

- `course.js`: contrato académico del curso, navegación interna, siete unidades, evaluación, bibliografía y cronograma.
- `site.js`: identidad editorial, navegación global, accesos de portada y categorías generales de simulaciones.
- `notices.js`: fuente única de avisos para la portada y `/avisos`.
- `videos.js`: contrato de metadatos de la biblioteca audiovisual.

Las fuentes académicas tienen una jerarquía explícita:

- El programa oficial gobierna créditos, modalidad, horas, propósito, resultados, evaluación y bibliografía.
- El plan clase a clase 2026-2 gobierna fechas, sesiones, orden concreto, repasos y evaluaciones del semestre.
- Las siete unidades se conservan como organización vigente hasta que el profesor revise cualquier diferencia entre ambas fuentes.

Los datos de navegación no deben contener destinos inexistentes. `npm run validate` compara esas rutas con los archivos reales de `src/pages/`.

### Layout

`src/layouts/BaseLayout.astro` define el documento HTML compartido:

- metadatos y título;
- enlace para saltar al contenido;
- `Header` y `Footer`;
- elemento `main`;
- carga de `global.css`.

La propiedad `fullWidth` permite que la portada controle el ancho de sus propias secciones. Las demás páginas reciben automáticamente el contenedor editorial común.

### Componentes compartidos

- `Header.astro`: marca, navegación global y diálogo de menú. Su script mantiene el foco dentro del menú, permite cerrar con Escape y devuelve el foco al control que lo abrió.
- `Footer.astro`: identidad personal y declaración de independencia institucional.
- `PageHeader.astro`: cabecera de páginas generales como Recursos o Avisos.
- `SectionHeading.astro`: encabezado `h2` reutilizable. Cuando la sección padre tiene `aria-labelledby`, debe recibir el mismo `id`.
- `CoursePageHeader.astro`: cabecera de las páginas internas del curso y composición de `CourseNav`.
- `CourseNav.astro`: navegación horizontal del curso basada exclusivamente en `COURSE_NAV`.

Un componente se justifica cuando varias páginas comparten un contrato real. Un fragmento usado una sola vez puede permanecer en la página para evitar abstracciones innecesarias.

## Flujo de datos hacia una página

Una página importa solamente las fuentes que necesita. Por ejemplo, la página de evaluación:

1. importa `COURSE` y `EVALUATION` desde `course.js`;
2. calcula el total con `reduce()`;
3. entrega título y descripción a `BaseLayout`;
4. usa `CoursePageHeader`, que a su vez incluye `CourseNav`;
5. renderiza cada componente de evaluación con `map()`;
6. recibe su apariencia desde las clases compartidas de `global.css`.

La página no mantiene una copia local de los porcentajes. Así, la portada del curso, la página de evaluación y la validación leen el mismo contrato.

## Rutas

Astro utiliza enrutamiento por archivos:

| Archivo | Ruta |
| --- | --- |
| `src/pages/index.astro` | `/` |
| `src/pages/avisos.astro` | `/avisos` |
| `src/pages/recursos.astro` | `/recursos` |
| `src/pages/simulaciones.astro` | `/simulaciones` |
| `src/pages/herramientas.astro` | `/herramientas` |
| `src/pages/actividades.astro` | `/actividades` |
| `src/pages/fisica-basica-1/index.astro` | `/fisica-basica-1` |
| `src/pages/fisica-basica-1/cronograma.astro` | `/fisica-basica-1/cronograma` |
| `src/pages/fisica-basica-1/unidades.astro` | `/fisica-basica-1/unidades` |
| `src/pages/fisica-basica-1/ejercicios.astro` | `/fisica-basica-1/ejercicios` |
| `src/pages/fisica-basica-1/videos.astro` | `/fisica-basica-1/videos` |
| `src/pages/fisica-basica-1/evaluacion.astro` | `/fisica-basica-1/evaluacion` |

`index.astro` representa la carpeta que lo contiene. Por eso `fisica-basica-1/index.astro` no produce `/fisica-basica-1/index`, sino `/fisica-basica-1`.

## Estilos

`src/styles/global.css` contiene variables y sistemas visuales compartidos. Sus bloques principales son:

- base tipográfica, color, espaciado y foco;
- cabecera, menú y portada;
- páginas generales y estados editoriales;
- estructura interna del curso;
- cronograma y unidades;
- breakpoints responsive y reducción de movimiento.

La navegación global y `CourseNav` son sticky. En pantallas estrechas, `CourseNav` conserva el ancho legible de sus enlaces y permite desplazamiento horizontal dentro del propio componente. Las secciones enlazables usan `scroll-margin-top` para que sus títulos no queden ocultos detrás de esas barras.

Antes de crear una clase nueva, conviene buscar si existe un patrón equivalente. Las variables de `:root` deben utilizarse en lugar de repetir colores, espacios o radios.

## Accesibilidad

Los contratos más importantes son:

- cada página tiene un solo `h1`;
- `aria-labelledby` debe apuntar a un ID existente y único;
- los SVG decorativos usan `aria-hidden="true"`;
- el menú mantiene un ciclo de foco y responde a Escape;
- el foco visible no debe eliminarse;
- los estados no dependen solamente del color;
- `prefers-reduced-motion` reduce transiciones y desplazamiento suave.

## Validaciones

`scripts/validate.mjs` no utiliza paquetes adicionales. Recorre el sistema de archivos y comprueba:

- suma de evaluación igual a 100 %;
- sesiones consecutivas y fechas ordenadas;
- ausencia de sesiones, rutas, avisos o videos duplicados;
- existencia de las rutas declaradas en `COURSE_NAV`;
- enlaces internos principales;
- existencia del recurso gráfico principal.

Comandos habituales:

```sh
npm run validate
npm run build
npm run verify
npm audit
git diff --check
```

`npm run verify` ejecuta primero la validación y después la compilación.

## Cómo añadir una página

1. Determinar si es una página general o una subpágina del curso.
2. Crear el archivo `.astro` dentro de `src/pages/` en la ruta deseada.
3. Importar `BaseLayout`.
4. Usar `PageHeader` para páginas generales o `CoursePageHeader` para páginas del curso.
5. Importar los datos desde `src/data/`; no copiar arreglos académicos dentro de la página.
6. Añadir IDs estables a encabezados referenciados por `aria-labelledby`.
7. Reutilizar clases globales antes de crear estilos específicos.
8. Si la página debe aparecer en navegación, actualizar `NAV`, `HOME_LINKS` o `COURSE_NAV` según corresponda.
9. Ejecutar `npm run validate` y `npm run build`.
10. Revisar escritorio y móvil antes de hacer commit.

Las reglas para publicar contenido están en [CONTENT_GUIDE.md](./CONTENT_GUIDE.md).

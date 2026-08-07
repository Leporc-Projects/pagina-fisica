// Validación estructural sin dependencias externas.
// Compara los contratos de datos con el enrutamiento por archivos de Astro y
// acumula todos los problemas para corregirlos en una sola ejecución.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COURSE,
  COURSE_NAV,
  EVALUATION,
  SCHEDULE,
  UNITS,
} from "../src/data/course.js";
import { HOME_LINKS, NAV, SITE } from "../src/data/site.js";
import { NOTICES } from "../src/data/notices.js";
import { VIDEOS } from "../src/data/videos.js";
import {
  THEME_COLORS,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
} from "../src/data/theme.js";
import { resolveBasePath } from "../src/utils/paths.js";
import { ACADEMIC_UNITS } from "../src/data/physics/index.js";
import { UNIT_1_CONTENT } from "../src/data/physics/unit-1/content.js";
import { UNIT_1_COMMON_ERRORS } from "../src/data/physics/unit-1/common-errors.js";
import {
  EXERCISE_COGNITIVE_LEVELS,
  EXERCISE_MODALITIES,
  EXERCISE_REPRESENTATIONS,
  EXERCISE_STATUSES,
  EXERCISE_TYPES,
  UNIT_1_EXERCISES,
} from "../src/data/physics/unit-1/exercises.js";
import { UNIT_1_FORMULAS } from "../src/data/physics/unit-1/formulas.js";
import {
  presentUnit1RichText,
  UNIT_1_INLINE_MATH_TOKENS,
} from "../src/data/physics/unit-1/math-content.js";
import { UNIT_1 } from "../src/data/physics/unit-1/unit.js";
import { UNIT_1_VISUALIZATIONS } from "../src/data/physics/unit-1/visualizations.js";

const projectRoot = fileURLToPath(
  new URL("../", import.meta.url)
);

const failures = [];

// Registra cada contrato sin interrumpir la ejecución en el primer error.
const check = (condition, message) => {
  if (condition) {
    console.log(`[ok] ${message}`);
  } else {
    failures.push(message);
    console.error(`[error] ${message}`);
  }
};

// Devuelve cada valor repetido una sola vez para producir mensajes legibles.
const duplicates = (values) =>
  [...new Set(
    values.filter(
      (value, index) => values.indexOf(value) !== index
    )
  )];

// Recorre directorios porque Astro puede representar rutas mediante carpetas.
const walkFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory()
        ? walkFiles(target)
        : [target];
    });

// Extrae un bloque plano de CSS para validar tokens sin incorporar un parser.
const extractCssBlock = (source, selector) => {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) return "";

  const contentStart = source.indexOf("{", start) + 1;
  const end = source.indexOf("\n}", contentStart);
  return end === -1 ? "" : source.slice(contentStart, end);
};

const cssHexTokens = (block) =>
  Object.fromEntries(
    [...block.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)]
      .map((match) => [match[1], match[2]])
  );

// WCAG compara luminancias relativas; 4.5:1 cubre texto normal y 3:1 foco.
const relativeLuminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    );

  return (
    0.2126 * channels[0] +
    0.7152 * channels[1] +
    0.0722 * channels[2]
  );
};

const contrastRatio = (first, second) => {
  const lighter = Math.max(
    relativeLuminance(first),
    relativeLuminance(second)
  );
  const darker = Math.min(
    relativeLuminance(first),
    relativeLuminance(second)
  );

  return (lighter + 0.05) / (darker + 0.05);
};

// Unifica rutas con slash final, query o hash antes de compararlas.
const normalizeRoute = (route) => {
  const cleanRoute = route.split(/[?#]/, 1)[0];

  if (cleanRoute === "/") return cleanRoute;
  return cleanRoute.replace(/\/$/, "");
};

const pageRoot = path.join(projectRoot, "src/pages");
const pageFiles = walkFiles(pageRoot)
  .filter((file) => file.endsWith(".astro"));

// Reproduce la convención de Astro: index.astro representa la carpeta que lo contiene.
const routes = new Set(
  pageFiles.map((file) => {
    let route = path.relative(pageRoot, file)
      .split(path.sep)
      .join("/")
      .replace(/\.astro$/, "")
      .replace(/\/index$/, "");

    if (route === "index") route = "";
    return normalizeRoute(`/${route}`);
  })
);

const evaluationTotal = EVALUATION.reduce(
  (total, item) => total + item.percentage,
  0
);

check(
  evaluationTotal === 100,
  "La evaluación suma 100 %."
);

check(
  SCHEDULE.every(
    (entry, index) => entry.session === index + 1
  ),
  "Las sesiones tienen numeración consecutiva."
);

check(
  SCHEDULE.every(
    (entry, index) =>
      index === 0 ||
      SCHEDULE[index - 1].date <= entry.date
  ),
  "Las fechas del cronograma están ordenadas."
);

check(
  duplicates(SCHEDULE.map((entry) => entry.session)).length === 0,
  "No hay identificadores de sesión duplicados."
);

check(
  duplicates(COURSE_NAV.map((item) => item.href)).length === 0,
  "COURSE_NAV no contiene rutas duplicadas."
);

check(
  NAV.map((item) => item.label).join("|") ===
    ["Inicio", COURSE.name, "Simulaciones", "Avisos"].join("|"),
  "La navegación global contiene solo las cuatro secciones vigentes."
);

check(
  COURSE_NAV.map((item) => item.label).join("|") ===
    [
      "Curso",
      "Cronograma",
      "Unidades y apuntes",
      "Ejercicios y tutorías",
      "Videos",
      "Evaluación y notas",
      "Recursos",
    ].join("|") &&
    COURSE_NAV.at(-1)?.href === "/fisica-basica-1/recursos",
  "La navegación del curso incluye Recursos como última sección."
);

check(
  HOME_LINKS.map((item) => `${item.number}|${item.label}|${item.href}`)
    .join("\n") ===
    [
      `01|${COURSE.name}|/fisica-basica-1`,
      "02|Simulaciones|/simulaciones",
    ].join("\n"),
  "La portada destaca solo el curso y Simulaciones."
);

const missingCourseRoutes = COURSE_NAV
  .map((item) => normalizeRoute(item.href))
  .filter((route) => !routes.has(route));

check(
  missingCourseRoutes.length === 0,
  missingCourseRoutes.length === 0
    ? "Todas las rutas de COURSE_NAV existen en src/pages."
    : `Faltan rutas de COURSE_NAV: ${missingCourseRoutes.join(", ")}`
);

check(
  routes.has("/recursos"),
  "La ruta anterior de Recursos se conserva como compatibilidad."
);

check(
  duplicates(NOTICES.map((notice) => notice.id)).length === 0,
  "Los avisos tienen identificadores únicos."
);

check(
  NOTICES.every((notice) => /^[a-z0-9-]+$/.test(notice.id)),
  "Los identificadores de avisos son estables."
);

check(
  duplicates(VIDEOS.map((video) => video.id)).length === 0,
  "Los videos tienen identificadores únicos."
);

check(
  resolveBasePath("/avisos", "/pagina-fisica/") ===
    "/pagina-fisica/avisos" &&
    resolveBasePath("/", "/pagina-fisica/") ===
      "/pagina-fisica/" &&
    resolveBasePath("/pagina-fisica/avisos", "/pagina-fisica/") ===
      "/pagina-fisica/avisos" &&
    resolveBasePath("#contenido", "/pagina-fisica/") ===
      "#contenido" &&
    resolveBasePath("https://example.com", "/pagina-fisica/") ===
      "https://example.com",
  "El resolvedor respeta la ruta base, las anclas y los enlaces externos."
);

// Los enlaces literales y los declarados en datos forman juntos el contrato navegable.
const sourceFiles = walkFiles(path.join(projectRoot, "src"))
  .filter((file) => file.endsWith(".astro"));

const sourceInternalLinks = sourceFiles.flatMap((file) => {
  const source = fs.readFileSync(file, "utf8");
  const literalLinks = [
    ...source.matchAll(/\bhref\s*=\s*["'](\/[^"']*)["']/g),
  ].map((match) => match[1]);
  const resolvedLinks = [
    ...source.matchAll(/\bwithBase\(\s*["'](\/[^"']*)["']\s*\)/g),
  ].map((match) => match[1]);

  return [...literalLinks, ...resolvedLinks];
});

// Un atributo literal desde `/` omite `base` y se rompe en una Project Page.
const unsafeRootAttributes = sourceFiles.flatMap((file) => {
  const source = fs.readFileSync(file, "utf8");
  return [
    ...source.matchAll(
      /\b(?:href|src)\s*=\s*(?:\{\s*)?["']\/(?!\/)[^"']*["'](?:\s*\})?/g
    ),
  ].map((match) =>
    `${path.relative(projectRoot, file)}: ${match[0]}`
  );
});

check(
  unsafeRootAttributes.length === 0,
  unsafeRootAttributes.length === 0
    ? "Las plantillas no contienen href o src literales que omitan BASE_URL."
    : `Atributos incompatibles con base: ${unsafeRootAttributes.join(", ")}`
);

const dataInternalLinks = [
  ...NAV.flatMap((item) => [
    item.href,
    ...(item.children ?? []).map((child) => child.href),
  ]),
  ...HOME_LINKS.map((item) => item.href),
  ...NOTICES.map((notice) => notice.href).filter(Boolean),
  ...ACADEMIC_UNITS.flatMap((unit) => [
    unit.route,
    unit.practiceRoute,
    ...unit.topics.map((topic) => topic.route),
  ]),
];

const internalLinks = [
  ...sourceInternalLinks,
  ...dataInternalLinks,
]
  .filter((href) => href.startsWith("/"))
  .map(normalizeRoute);

const missingInternalRoutes = [
  ...new Set(
    internalLinks.filter((route) => !routes.has(route))
  ),
];

check(
  missingInternalRoutes.length === 0,
  missingInternalRoutes.length === 0
    ? "Los enlaces internos principales apuntan a rutas existentes."
    : `Hay enlaces internos sin ruta: ${missingInternalRoutes.join(", ")}`
);

const logoFile = path.join(
  projectRoot,
  "public",
  SITE.logoPath.replace(/^\//, "")
);

check(
  fs.existsSync(logoFile),
  "El recurso gráfico principal existe en public."
);

// El tema es un contrato transversal: datos, arranque temprano, control y CSS.
const themeValues = THEME_PREFERENCES.map((option) => option.value);
check(
  themeValues.join(",") === "light,dark,system" &&
    duplicates(themeValues).length === 0,
  "Las preferencias de tema son claro, oscuro y sistema."
);

check(
  THEME_STORAGE_KEY === "papillas-physics:theme",
  "La preferencia visual utiliza una clave local estable."
);

const globalCssFile = path.join(projectRoot, "src/styles/global.css");
const globalCss = fs.readFileSync(globalCssFile, "utf8");
const lightThemeBlock = extractCssBlock(globalCss, ":root");
const darkThemeBlock = extractCssBlock(
  globalCss,
  ':root[data-theme="dark"]'
);
const lightTokens = cssHexTokens(lightThemeBlock);
const darkTokens = {
  ...lightTokens,
  ...cssHexTokens(darkThemeBlock),
};

const requiredThemeTokens = [
  "--bg",
  "--surface-subtle",
  "--surface",
  "--surface-raised",
  "--text",
  "--text-muted",
  "--border",
  "--border-strong",
  "--accent",
  "--accent-secondary",
  "--focus",
  "--home-hero-bg",
  "--home-hero-surface",
  "--home-hero-text",
  "--home-hero-text-soft",
  "--home-hero-muted",
  "--home-hero-border",
  "--home-hero-control-border",
  "--home-hero-mark-border",
  "--home-hero-accent",
  "--home-hero-accent-secondary",
  "--home-hero-on-accent",
  "--home-hero-grid",
  "--home-hero-glow-ring",
  "--home-hero-glow",
  "--home-hero-orb-opacity",
  "--home-hero-grid-opacity",
  "--content-canvas",
  "--formula-bg",
  "--quiz-bg",
  "--simulation-bg",
  "--chart-bg",
  "--chart-grid",
  "--chart-axis",
  "--chart-label",
  "--chart-reference",
  "--chart-vector",
  "--chart-annotation-halo",
  "--chart-area-opacity",
];

check(
  requiredThemeTokens.every((token) => lightThemeBlock.includes(`${token}:`)),
  "El tema claro define todos los tokens semánticos requeridos."
);

check(
  requiredThemeTokens.every((token) => darkThemeBlock.includes(`${token}:`)),
  "El tema oscuro redefine todos los tokens semánticos requeridos."
);

const colorTokenBlocksRemoved = globalCss
  .replace(`:root {${lightThemeBlock}\n}`, "")
  .replace(`:root[data-theme="dark"] {${darkThemeBlock}\n}`, "");

check(
  !/(?:#[0-9a-f]{3,8}\b|\brgba?\s*\()/i.test(colorTokenBlocksRemoved),
  "Los componentes CSS consumen tokens en lugar de colores literales."
);

check(
  !/(?:^|[\s,{])\.dark(?:[\s.:#\[\]>+~]|$)/m.test(globalCss),
  "El tema no depende de reglas individuales con la clase .dark."
);

check(
  lightTokens["--bg"] === THEME_COLORS.light &&
    darkTokens["--bg"] === THEME_COLORS.dark,
  "theme-color coincide con el fondo efectivo de cada tema."
);

const contrastPairs = [
  ["--text", "--bg", 4.5],
  ["--text-muted", "--bg", 4.5],
  ["--accent", "--bg", 4.5],
  ["--accent-secondary", "--bg", 4.5],
  ["--nav-active-text", "--nav-active-bg", 4.5],
  ["--status-info-text", "--status-info-bg", 4.5],
  ["--status-success-text", "--status-success-bg", 4.5],
  ["--status-warning-text", "--status-warning-bg", 4.5],
  ["--status-event-text", "--status-event-bg", 4.5],
  ["--focus", "--bg", 3],
  ["--border-strong", "--bg", 3],
  ["--text", "--surface", 4.5],
  ["--text-muted", "--surface", 4.5],
  ["--accent", "--surface", 4.5],
  ["--focus", "--surface", 3],
  ["--data-series-1", "--content-canvas", 3],
  ["--data-series-2", "--content-canvas", 3],
  ["--data-series-3", "--content-canvas", 3],
];

const contrastFailures = [
  ["claro", lightTokens],
  ["oscuro", darkTokens],
].flatMap(([theme, tokens]) =>
  contrastPairs
    .filter(([foreground, background, minimum]) =>
      !tokens[foreground] ||
      !tokens[background] ||
      contrastRatio(tokens[foreground], tokens[background]) < minimum
    )
    .map(([foreground, background, minimum]) =>
      `${theme}: ${foreground} sobre ${background} (< ${minimum}:1)`
    )
);

const brandContrastPairs = [
  ["--brand-text", "--brand-surface", 4.5],
  ["--brand-muted", "--brand-surface", 4.5],
  ["--brand-accent", "--brand-surface", 4.5],
  ["--brand-accent-secondary", "--brand-surface", 4.5],
  ["--brand-border-strong", "--brand-surface", 3],
];

contrastFailures.push(
  ...brandContrastPairs
    .filter(([foreground, background, minimum]) =>
      !lightTokens[foreground] ||
      !lightTokens[background] ||
      contrastRatio(
        lightTokens[foreground],
        lightTokens[background]
      ) < minimum
    )
    .map(([foreground, background, minimum]) =>
      `marca: ${foreground} sobre ${background} (< ${minimum}:1)`
    )
);

check(
  contrastFailures.length === 0,
  contrastFailures.length === 0
    ? "Los pares semánticos principales cumplen contraste WCAG."
    : `Contraste insuficiente: ${contrastFailures.join(", ")}`
);

check(
  lightTokens["--accent"] === "#94382f" &&
    lightTokens["--accent-secondary"] === "#87501f" &&
    darkTokens["--accent"] === "#47d5f4" &&
    darkTokens["--accent-secondary"] === "#65ef82",
  "Claro usa terracota/cobre y oscuro conserva su identidad cian/verde."
);

const allSourceFiles = walkFiles(path.join(projectRoot, "src"))
  .filter((file) => /\.(?:astro|js|css)$/.test(file));
const localStorageFiles = allSourceFiles
  .filter((file) => fs.readFileSync(file, "utf8").includes("localStorage"))
  .map((file) => path.relative(projectRoot, file));

check(
  localStorageFiles.length === 2 &&
    localStorageFiles.includes("src/layouts/BaseLayout.astro") &&
    localStorageFiles.includes("src/components/ThemeSelector.astro"),
  "localStorage se limita al arranque y al selector del tema."
);

const baseLayoutSource = fs.readFileSync(
  path.join(projectRoot, "src/layouts/BaseLayout.astro"),
  "utf8"
);
const themeSelectorSource = fs.readFileSync(
  path.join(projectRoot, "src/components/ThemeSelector.astro"),
  "utf8"
);

check(
  baseLayoutSource.includes("is:inline") &&
    baseLayoutSource.includes("prefers-color-scheme: dark") &&
    baseLayoutSource.includes("localStorage.getItem"),
  "El layout aplica la preferencia antes del primer render."
);

check(
  themeSelectorSource.includes('type="radio"') &&
    themeSelectorSource.includes('systemTheme.addEventListener("change"') &&
    themeSelectorSource.includes("localStorage.setItem") &&
    themeSelectorSource.includes('new CustomEvent("themechange"'),
  "El selector mantiene teclado, persistencia y respuesta al sistema."
);

// Contratos editoriales de contenido académico: estructura, taxonomía y rutas.
check(
  duplicates(ACADEMIC_UNITS.map((unit) => unit.number)).length === 0 &&
    duplicates(ACADEMIC_UNITS.map((unit) => unit.slug)).length === 0,
  "Las unidades académicas tienen números y slugs únicos."
);

check(
  ACADEMIC_UNITS.every((academicUnit) =>
    UNITS.some((courseUnit) => courseUnit.number === academicUnit.number)
  ),
  "Cada unidad académica desarrolla una unidad registrada en course.js."
);

const unit1TopicSlugs = UNIT_1.topics.map((topic) => topic.slug);
const unit1TopicRoutes = UNIT_1.topics.map((topic) => topic.route);
const unit1SectionIds = Object.values(UNIT_1_CONTENT)
  .flatMap((topic) => topic.sections.map((section) => section.id));

check(
  duplicates(unit1TopicSlugs).length === 0 &&
    duplicates(unit1TopicRoutes).length === 0,
  "Los temas de Unidad 1 tienen slugs y rutas únicas."
);

check(
  UNIT_1.topics.every((topic, index) => topic.order === index + 1),
  "Los temas de Unidad 1 conservan un orden consecutivo."
);

check(
  Object.keys(UNIT_1_CONTENT).sort().join("|") ===
    [...unit1TopicSlugs].sort().join("|"),
  "Cada tema de Unidad 1 tiene un único bloque de contenido."
);

check(
  Object.values(UNIT_1_CONTENT).every((topic) =>
    topic.sections.length > 0 &&
    topic.sections.every((section) =>
      section.essential?.length > 0 &&
      section.understand?.length > 0 &&
      section.deepen?.length > 0
    )
  ),
  "Cada sección contiene Esencial, Comprende y Profundiza."
);

check(
  UNIT_1.topics.find((topic) => topic.slug === "coordenadas-polares")
    ?.priority === "extension",
  "Coordenadas polares se conserva como ampliación de menor prioridad."
);

const referencedFormulaIds = Object.values(UNIT_1_CONTENT)
  .flatMap((topic) => topic.sections)
  .flatMap((section) => section.formulas ?? []);
const referencedVisualizationIds = Object.values(UNIT_1_CONTENT)
  .flatMap((topic) => topic.sections)
  .flatMap((section) => section.visualizations ?? []);

check(
  referencedFormulaIds.every((id) => UNIT_1_FORMULAS[id]) &&
    Object.entries(UNIT_1_FORMULAS).every(([id, item]) =>
      item.id === id &&
      item.mathml.includes("<math") &&
      item.mathml.includes("<semantics>") &&
      item.represents
    ),
  "Las fórmulas referenciadas existen y usan MathML con contexto."
);

const visibleAcademicStrings = [
  ...Object.values(UNIT_1_CONTENT).flatMap((topic) =>
    topic.sections.flatMap((section) => [
      ...section.essential,
      ...section.understand,
      ...section.deepen,
      ...(section.explore ?? []),
      ...(section.checks ?? []).flatMap((item) => [
        item.question,
        ...(item.options ?? []),
        item.answer,
      ]),
    ])
  ),
  ...UNIT_1_EXERCISES.flatMap((exercise) => [
    exercise.prompt,
    ...exercise.hints,
    ...exercise.solution.map((item) => item.text),
  ]),
  ...UNIT_1_COMMON_ERRORS.flatMap((error) => [
    error.description,
    error.feedback,
  ]),
  ...Object.values(UNIT_1_FORMULAS).flatMap((item) => [
    item.represents,
    item.interpretation,
    item.dimensions,
    ...item.conditions,
    ...item.commonErrors,
    ...item.variables.flatMap((variable) => [
      variable.symbol,
      variable.meaning,
      variable.unit ?? "",
    ]),
  ]),
].filter(Boolean);

const keyboardMathPattern = /(?:\b[A-Za-z]+_[A-Za-záéíóú0-9/]+|\bsqrt\s*\(|\^[{(]?\d)/;
const unresolvedKeyboardMath = visibleAcademicStrings.filter((source) => {
  const presentation = presentUnit1RichText(source);
  const remainingText = typeof presentation === "string"
    ? presentation
    : presentation
      .filter((segment) => segment.type === "text")
      .map((segment) => segment.value)
      .join("");
  return keyboardMathPattern.test(remainingText);
});

check(
  UNIT_1_INLINE_MATH_TOKENS.length > 0 &&
    UNIT_1_INLINE_MATH_TOKENS.every((item) =>
      item.literal &&
      item.segment?.type === "math" &&
      item.segment.mathml.includes('<math') &&
      item.segment.mathml.includes('display="inline"') &&
      item.segment.mathml.includes("<semantics>")
    ) &&
    unresolvedKeyboardMath.length === 0,
  unresolvedKeyboardMath.length === 0
    ? "El contenido mixto usa un registro estructurado de MathML inline."
    : `Queda notación de teclado sin presentar: ${unresolvedKeyboardMath.join(" | ")}`
);

check(
  Object.values(UNIT_1_VISUALIZATIONS).every((visualization) =>
    (visualization.props?.vectors ?? []).every((item) =>
      !item.label.includes("_") || (item.mathLabel && item.ariaLabel)
    )
  ),
  "Las etiquetas SVG con subíndices tienen presentación y nombre accesible."
);

check(
  referencedVisualizationIds.every((id) => UNIT_1_VISUALIZATIONS[id]) &&
    Object.entries(UNIT_1_VISUALIZATIONS).every(([id, item]) =>
      item.id === id &&
      ["cartesian", "diagram"].includes(item.kind) &&
      item.explanation &&
      item.props?.title &&
      item.props?.description
    ),
  "Las visualizaciones tienen ID, explicación y descripción accesible."
);

check(
  UNIT_1_EXERCISES.length >= 18 && UNIT_1_EXERCISES.length <= 24,
  "El banco inicial contiene entre 18 y 24 ejercicios."
);

check(
  duplicates(UNIT_1_EXERCISES.map((exercise) => exercise.id)).length === 0,
  "Los ejercicios de Unidad 1 tienen IDs únicos."
);

const invalidExerciseTaxonomy = UNIT_1_EXERCISES.filter((exercise) =>
  exercise.unit !== UNIT_1.number ||
  !unit1TopicSlugs.includes(exercise.topic) ||
  !UNIT_1_CONTENT[exercise.topic]?.sections
    .some((section) => section.id === exercise.subtopic) ||
  !exercise.modalities?.every((item) => EXERCISE_MODALITIES.includes(item)) ||
  !EXERCISE_TYPES.includes(exercise.type) ||
  !EXERCISE_REPRESENTATIONS.includes(exercise.representation) ||
  !EXERCISE_COGNITIVE_LEVELS.includes(exercise.cognitiveLevel) ||
  !EXERCISE_STATUSES.includes(exercise.status) ||
  !Number.isInteger(exercise.difficulty) ||
  exercise.difficulty < 1 ||
  exercise.difficulty > 5
);

check(
  invalidExerciseTaxonomy.length === 0,
  invalidExerciseTaxonomy.length === 0
    ? "La taxonomía y dificultad de los ejercicios son válidas."
    : `Ejercicios con taxonomía inválida: ${invalidExerciseTaxonomy.map((item) => item.id).join(", ")}`
);

const invalidNumericalExercises = UNIT_1_EXERCISES.filter((exercise) =>
  exercise.type === "numerical" &&
  (!exercise.expectedUnit ||
    !Number.isFinite(exercise.tolerance) ||
    exercise.tolerance < 0)
);

check(
  invalidNumericalExercises.length === 0,
  invalidNumericalExercises.length === 0
    ? "Los ejercicios numéricos declaran unidad y tolerancia."
    : `Ejercicios numéricos incompletos: ${invalidNumericalExercises.map((item) => item.id).join(", ")}`
);

check(
  UNIT_1_EXERCISES.every((exercise) =>
    exercise.prompt &&
    exercise.objectives?.length > 0 &&
    exercise.solution?.length > 0 &&
    exercise.version >= 1
  ),
  "Cada ejercicio tiene enunciado, objetivos, solución y versión."
);

const commonErrorIds = UNIT_1_COMMON_ERRORS.map((error) => error.id);
check(
  duplicates(commonErrorIds).length === 0 &&
    UNIT_1_COMMON_ERRORS.every((error) =>
      error.description &&
      error.feedback &&
      unit1SectionIds.includes(error.subtopic)
    ),
  "Los errores conceptuales tienen IDs únicos y subtemas existentes."
);

check(
  UNIT_1_EXERCISES.every((exercise) =>
    exercise.commonErrors.every((id) => commonErrorIds.includes(id))
  ),
  "Los ejercicios solo referencian errores conceptuales existentes."
);

// La UX académica debe seguir derivándose de los contratos, no de copias visuales.
const learningMapSource = fs.readFileSync(
  path.join(projectRoot, "src/components/academic/UnitLearningMap.astro"),
  "utf8"
);
const unitIndexSource = fs.readFileSync(
  path.join(
    projectRoot,
    "src/pages/fisica-basica-1/unidades/unidad-1/index.astro"
  ),
  "utf8"
);

check(
  learningMapSource.includes("topics.map") &&
    learningMapSource.includes("<ol") &&
    learningMapSource.includes("<svg") &&
    learningMapSource.includes("withBase(topic.route)") &&
    UNIT_1.topics.every((topic) =>
      !learningMapSource.includes(topic.route)
    ) &&
    unitIndexSource.includes("topics={UNIT_1.topics}"),
  "El mapa deriva nodos y rutas de UNIT_1.topics sin duplicarlos."
);

const topicPageSource = fs.readFileSync(
  path.join(projectRoot, "src/components/academic/UnitTopicPage.astro"),
  "utf8"
);
const academicSectionSource = fs.readFileSync(
  path.join(projectRoot, "src/components/academic/AcademicSection.astro"),
  "utf8"
);

check(
  topicPageSource.includes("present={presentUnit1RichText}") &&
    academicSectionSource.includes("academic-layer--essential") &&
    academicSectionSource.includes("academic-layer--understand") &&
    academicSectionSource.includes("<details") &&
    globalCss.includes("details:not([open])>*:not(summary)") &&
    globalCss.includes("@media (prefers-reduced-motion: reduce)"),
  "La lectura mantiene lo esencial visible y revela disclosures al imprimir."
);

const exerciseSequenceSource = fs.readFileSync(
  path.join(projectRoot, "src/components/academic/ExerciseSequence.astro"),
  "utf8"
);
const exerciseSequenceScript = fs.readFileSync(
  path.join(projectRoot, "src/scripts/exercise-sequence.js"),
  "utf8"
);

check(
  exerciseSequenceSource.includes("exercises.map") &&
    exerciseSequenceSource.includes("<progress") &&
    exerciseSequenceSource.includes("<noscript") &&
    exerciseSequenceScript.includes("window.location.hash") &&
    exerciseSequenceScript.includes("history.pushState") &&
    exerciseSequenceScript.includes('event.altKey') &&
    exerciseSequenceScript.includes("progress.textContent") &&
    !exerciseSequenceScript.includes("localStorage"),
  "La práctica secuencial conserva fallback, hash, teclado y progreso sin persistencia."
);

// La biblioteca de gráficas conserva separadas matemática, SVG y presentación.
const chartUtilityFile = path.join(projectRoot, "src/utils/chart.js");
const chartComponentFile = path.join(
  projectRoot,
  "src/components/visualization/CartesianChart.astro"
);
const chartDemoRoute = "/dev/visualizaciones";
const chartUtilitySource = fs.existsSync(chartUtilityFile)
  ? fs.readFileSync(chartUtilityFile, "utf8")
  : "";
const chartComponentSource = fs.existsSync(chartComponentFile)
  ? fs.readFileSync(chartComponentFile, "utf8")
  : "";

check(
  chartUtilitySource.includes("createCartesianTransform") &&
    chartUtilitySource.includes("clipSegmentToDomain") &&
    chartUtilitySource.includes("segmentsToSvgPath"),
  "La capa matemática expone transformación, recorte y geometría SVG."
);

check(
  chartComponentSource.includes("<svg") &&
    chartComponentSource.includes("viewBox=") &&
    chartComponentSource.includes('role="img"') &&
    chartComponentSource.includes("<title") &&
    chartComponentSource.includes("<desc") &&
    chartComponentSource.includes("clipPath") &&
    !chartComponentSource.includes("<canvas"),
  "CartesianChart genera SVG responsive, descrito y recortado."
);

check(
  chartComponentSource.includes("data-chart-id") &&
    chartComponentSource.includes("data-series-id") &&
    chartComponentSource.includes("data-x-min") &&
    chartComponentSource.includes("data-plot-width"),
  "Las gráficas exponen hooks estables para controles y sincronización futuros."
);

const chartSvgCssBlock = extractCssBlock(globalCss, ".academic-chart__svg");
const chartFigureCssBlock = extractCssBlock(globalCss, ".academic-chart");

check(
  chartSvgCssBlock.includes("width: 100%;") &&
    chartSvgCssBlock.includes("height: auto;") &&
    chartSvgCssBlock.includes("overflow: hidden;") &&
    chartFigureCssBlock.includes("overflow: clip;") &&
    globalCss.includes("var(--data-series-1)") &&
    globalCss.includes("var(--chart-bg)"),
  "La presentación SVG es responsive, recortada y consume tokens temáticos."
);

const publicNavigationRoutes = [
  ...NAV.flatMap((item) => [
    item.href,
    ...(item.children ?? []).map((child) => child.href),
  ]),
  ...COURSE_NAV.map((item) => item.href),
  ...HOME_LINKS.map((item) => item.href),
];

check(
  routes.has(chartDemoRoute) &&
    !publicNavigationRoutes.some((route) => route.startsWith("/dev")),
  "El laboratorio de visualizaciones existe sin entrar en la navegación pública."
);

const packageData = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
);
const packageNames = [
  ...Object.keys(packageData.dependencies ?? {}),
  ...Object.keys(packageData.devDependencies ?? {}),
];
const chartLibraries = ["chart.js", "plotly.js", "d3", "echarts", "highcharts"];

check(
  chartLibraries.every((library) => !packageNames.includes(library)),
  "La infraestructura de gráficas no incorpora dependencias de visualización."
);

if (failures.length > 0) {
  console.error(`\nValidación fallida: ${failures.length} problema(s).`);
  process.exitCode = 1;
} else {
  console.log("\nValidación interna completada sin errores.");
}

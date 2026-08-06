import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COURSE_NAV,
  EVALUATION,
  SCHEDULE,
} from "../src/data/course.js";
import { HOME_LINKS, NAV, SITE } from "../src/data/site.js";
import { NOTICES } from "../src/data/notices.js";
import { VIDEOS } from "../src/data/videos.js";

const projectRoot = fileURLToPath(
  new URL("../", import.meta.url)
);

const failures = [];

const check = (condition, message) => {
  if (condition) {
    console.log(`[ok] ${message}`);
  } else {
    failures.push(message);
    console.error(`[error] ${message}`);
  }
};

const duplicates = (values) =>
  [...new Set(
    values.filter(
      (value, index) => values.indexOf(value) !== index
    )
  )];

const walkFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory()
        ? walkFiles(target)
        : [target];
    });

const normalizeRoute = (route) => {
  const cleanRoute = route.split(/[?#]/, 1)[0];

  if (cleanRoute === "/") return cleanRoute;
  return cleanRoute.replace(/\/$/, "");
};

const pageRoot = path.join(projectRoot, "src/pages");
const pageFiles = walkFiles(pageRoot)
  .filter((file) => file.endsWith(".astro"));

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

const sourceFiles = walkFiles(path.join(projectRoot, "src"))
  .filter((file) => file.endsWith(".astro"));

const literalInternalLinks = sourceFiles.flatMap((file) => {
  const source = fs.readFileSync(file, "utf8");
  return [...source.matchAll(/\bhref\s*=\s*["'](\/[^"']*)["']/g)]
    .map((match) => match[1]);
});

const dataInternalLinks = [
  ...NAV.flatMap((item) => [
    item.href,
    ...(item.children ?? []).map((child) => child.href),
  ]),
  ...HOME_LINKS.map((item) => item.href),
  ...NOTICES.map((notice) => notice.href).filter(Boolean),
];

const internalLinks = [
  ...literalInternalLinks,
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

if (failures.length > 0) {
  console.error(`\nValidación fallida: ${failures.length} problema(s).`);
  process.exitCode = 1;
} else {
  console.log("\nValidación interna completada sin errores.");
}

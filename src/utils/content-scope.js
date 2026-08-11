import { getCourseById } from "../data/courses.js";
import { localizeCourseData } from "../data/course-localize.js";

export const CONTENT_SCOPE_TYPES = Object.freeze(["global", "course"]);

export const validateContentScope = (scope) => {
  const errors = [];
  const require = (condition, message) => {
    if (!condition) errors.push(message);
  };

  require(
    scope !== null && typeof scope === "object" && !Array.isArray(scope),
    "El ámbito debe ser un objeto."
  );

  const type = scope?.type;
  require(
    CONTENT_SCOPE_TYPES.includes(type),
    "El tipo de ámbito debe ser global o course."
  );

  if (type === "global") {
    require(
      Object.keys(scope).length === 1,
      "El ámbito global solo admite la propiedad type."
    );
    require(
      !Object.hasOwn(scope, "courseId"),
      "El ámbito global no admite courseId."
    );
  }

  if (type === "course") {
    require(
      Object.keys(scope).length === 2 &&
        Object.keys(scope).every((key) => key === "type" || key === "courseId"),
      "El ámbito de curso solo admite type y courseId."
    );
    require(
      typeof scope?.courseId === "string" && scope.courseId.length > 0,
      "El ámbito de curso requiere courseId."
    );
    require(
      typeof scope?.courseId !== "string" || scope.courseId === scope.courseId.trim(),
      "courseId no admite espacios al inicio o al final."
    );
    require(
      Boolean(getCourseById(scope?.courseId)),
      "courseId no corresponde a un curso registrado."
    );
  }

  return { valid: errors.length === 0, errors };
};

export const normalizeContentScope = (scope) => {
  const validation = validateContentScope(scope);
  if (!validation.valid) throw new TypeError(validation.errors.join(" "));

  return scope.type === "global"
    ? { type: "global" }
    : { type: "course", courseId: scope.courseId };
};

export const contentScopeLabel = (scope, locale = "es") => {
  const normalized = normalizeContentScope(scope);
  if (normalized.type === "global") return "Aula Física";
  if (normalized.courseId === "fisica-basica-1") return localizeCourseData(locale).COURSE.name;
  return getCourseById(normalized.courseId).name;
};

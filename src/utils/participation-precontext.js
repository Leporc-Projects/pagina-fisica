import { getCourseById } from "../data/courses.js";
import { getDevelopedAcademicUnitsForCourse } from "../data/physics/index.js";

const EMPTY_CONTEXT = Object.freeze({ scope: "global", courseId: null, unitNumber: null, topicSlug: null });

/**
 * Traduce parámetros de consulta en un contexto inicial seguro para Participa.
 * Nunca confía ciegamente en el query string: valida curso, unidad (por slug,
 * invariante entre locales) y tema contra los registros vigentes, y descarta
 * en silencio cualquier combinación que no exista en lugar de lanzar o
 * bloquear la página. `forceCourseId` fija el curso para la ruta de curso,
 * que no depende del parámetro `courseId` ni admite ámbito general.
 */
export const resolveParticipationPrecontext = (searchParams, locale, { forceCourseId } = {}) => {
  const rawCourseId = forceCourseId ?? searchParams.get("courseId");
  const scope = forceCourseId ? "course" : (searchParams.get("scope") === "course" ? "course" : "global");
  if (scope !== "course") return EMPTY_CONTEXT;

  const course = rawCourseId ? getCourseById(rawCourseId) : null;
  if (!course) return EMPTY_CONTEXT;

  const rawUnitSlug = searchParams.get("unit");
  if (!rawUnitSlug) return { scope: "course", courseId: course.id, unitNumber: null, topicSlug: null };

  const unit = getDevelopedAcademicUnitsForCourse(course.id, locale)
    .find((candidate) => candidate.slug === rawUnitSlug);
  if (!unit) return { scope: "course", courseId: course.id, unitNumber: null, topicSlug: null };

  const rawTopicSlug = searchParams.get("topic");
  const topic = rawTopicSlug ? unit.topics.find((candidate) => candidate.slug === rawTopicSlug) : undefined;

  return {
    scope: "course",
    courseId: course.id,
    unitNumber: unit.number,
    topicSlug: topic?.slug ?? null,
  };
};

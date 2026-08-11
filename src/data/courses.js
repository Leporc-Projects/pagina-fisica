// Registro mínimo de cursos publicados por Aula Física.
// La identidad y la ruta viven aquí para que contenido, navegación y futuras
// fuentes editoriales usen los mismos identificadores estables.

export const COURSE_IDS = Object.freeze({
  PHYSICS_BASIC_1: "fisica-basica-1",
});

export const COURSES = Object.freeze([
  Object.freeze({
    id: COURSE_IDS.PHYSICS_BASIC_1,
    name: "Física Básica I",
    href: "/fisica-basica-1",
    active: true,
  }),
]);

export const getCourseById = (courseId) =>
  COURSES.find((course) => course.id === courseId);

export const getActiveCourses = () =>
  COURSES.filter((course) => course.active);

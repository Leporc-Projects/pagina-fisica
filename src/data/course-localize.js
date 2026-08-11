import { assertSupportedLocale } from "../i18n/config.js";
import { ROUTE_IDS, getLocalizedPath } from "../i18n/routes.js";
import { BIBLIOGRAPHY, COURSE, EVALUATION, SCHEDULE, SCHEDULE_TYPES, UNITS } from "./course.js";

const EN_COURSE = Object.freeze({
  name: "Basic Physics I",
  modality: "In person",
  summary: "An introductory course in Newtonian mechanics focused on the study of motion, forces, and conservation laws.",
  purpose: "Develop a solid understanding of the fundamental laws of Newtonian mechanics and strengthen the ability to analyse and solve physics problems through elementary calculus, vector geometry, and first-principles reasoning.",
  methodology: [
    "Argument-based presentation of fundamental concepts.",
    "Problem solving and discussion.",
    "Workshop work and feedback.",
    "Use of videos, simulations, and demonstrations when they contribute to physical analysis.",
    "Independent study supported by the main textbook and course materials.",
  ],
  learningGoals: [
    "Understand Newton's three laws and the law of universal gravitation.",
    "Apply Newton's second law correctly.",
    "Formulate and solve equations of motion.",
    "Analyse systems of particles.",
    "Understand the conservation laws for energy and momentum.",
    "Apply conservation laws in mechanics problems.",
  ],
});

const EN_UNITS = Object.freeze([
  ["Vectors and kinematics", "Chapters 1, 2 and 3", "Foundations of measurement, vector algebra, and descriptions of motion in one, two, and three dimensions."],
  ["Newton's laws", "Chapter 4", "Study of mechanical interactions and of the laws relating force, mass, and motion."],
  ["Forces and equations of motion", "Chapter 5", "Application of Newton's laws to particles in equilibrium and motion."],
  ["Work and energy", "Chapters 6 and 7", "Energy formulation of mechanics and analysis of conservative and non-conservative forces."],
  ["Linear momentum and systems of particles", "Chapter 8", "Description of systems of particles through linear momentum, impulse, and centre of mass."],
  ["Rotation and angular momentum", "Chapters 9 and 10", "Kinematics and dynamics of rotating rigid bodies."],
  ["Gravitation and periodic motion", "Chapters 13 and 14", "Applications of Newtonian mechanics to gravitational and oscillatory systems."],
]);

const EN_EVALUATION = Object.freeze([
  ["First examination", "Chapters 1, 2 and 3"],
  ["Second examination", "Chapters 4, 5 and 6"],
  ["Third examination", "Chapters 7, 8 and 9"],
  ["Fourth examination", "Chapters 10, 13 and 14"],
  ["Workshop", "Activities and problem solving"],
]);

const EN_BIBLIOGRAPHY_ROLES = Object.freeze(["Main textbook", "Supplementary text", "Supplementary text", "Supplementary text"]);
const EN_SCHEDULE_TYPES = Object.freeze({
  class: { label: "Class" }, review: { label: "Review" }, exam: { label: "Assessment" }, event: { label: "Event" },
});

// Academic invariants remain in course.js. These projections replace only
// human-facing text, so dates, percentages, identifiers, and course workload
// have one canonical source regardless of locale.
export const localizeCourseData = (locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") return { COURSE, UNITS, EVALUATION, BIBLIOGRAPHY, SCHEDULE, SCHEDULE_TYPES };
  return {
    COURSE: { ...COURSE, ...EN_COURSE, href: getLocalizedPath(ROUTE_IDS.COURSE, locale) },
    UNITS: UNITS.map((unit, index) => ({ ...unit, title: EN_UNITS[index][0], chapters: EN_UNITS[index][1], description: EN_UNITS[index][2] })),
    EVALUATION: EVALUATION.map((item, index) => ({ ...item, name: EN_EVALUATION[index][0], content: EN_EVALUATION[index][1] })),
    BIBLIOGRAPHY: BIBLIOGRAPHY.map((book, index) => ({ ...book, role: EN_BIBLIOGRAPHY_ROLES[index] })),
    SCHEDULE,
    SCHEDULE_TYPES: EN_SCHEDULE_TYPES,
  };
};

// Registro explícito de herramientas docentes. `published` decide si la
// herramienta tiene ruta pública y aparece en el hub y en TeacherToolsNav; una
// herramienta no publicada conserva intacta su implementación (componentes,
// scripts, estilos, contratos y tests) para reactivarla más adelante sin
// reescribirla. `id` nombra las claves i18n (`teacher.nav.${id}`,
// `teacher.hub.${id}Description`); `currentId` es el segmento español que ya
// usa cada `TeacherToolShell` en su prop `current`.
import { ROUTE_IDS } from "../i18n/routes.js";

export const TEACHER_TOOLS = Object.freeze([
  Object.freeze({ id: "bank", currentId: "banco", routeId: ROUTE_IDS.COURSE_TOOL_QUESTION_BANK, published: false }),
  Object.freeze({ id: "notices", currentId: "avisos", routeId: ROUTE_IDS.COURSE_TOOL_NOTICES, published: true }),
  Object.freeze({ id: "simulations", currentId: "simulaciones", routeId: ROUTE_IDS.COURSE_TOOL_SIMULATION_LAB, published: false }),
  Object.freeze({ id: "review", currentId: "revision", routeId: ROUTE_IDS.COURSE_TOOL_REVIEW, published: false }),
  Object.freeze({ id: "results", currentId: "notas", routeId: ROUTE_IDS.COURSE_TOOL_RESULTS, published: true }),
]);

export const getPublishedTeacherTools = () => TEACHER_TOOLS.filter((tool) => tool.published);
export const getTeacherToolById = (id) => TEACHER_TOOLS.find((tool) => tool.id === id) ?? null;

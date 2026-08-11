import assert from "node:assert/strict";
import test from "node:test";

import { COURSE } from "../src/data/course.js";
import {
  COURSES,
  COURSE_IDS,
  getActiveCourses,
  getCourseById,
} from "../src/data/courses.js";
import {
  CONTENT_SCOPE_TYPES,
  contentScopeLabel,
  normalizeContentScope,
  validateContentScope,
} from "../src/utils/content-scope.js";

test("el registro canónico resuelve la identidad estable del curso real", () => {
  assert.equal(COURSES.length, 1);
  assert.equal(COURSE_IDS.PHYSICS_BASIC_1, "fisica-basica-1");
  assert.deepEqual(getCourseById("fisica-basica-1"), {
    id: "fisica-basica-1",
    name: "Física Básica I",
    href: "/fisica-basica-1",
    active: true,
  });
  assert.equal(getCourseById("curso-inventado"), undefined);
  assert.deepEqual(getActiveCourses().map((course) => course.id), ["fisica-basica-1"]);
  assert.equal(COURSE.id, getCourseById(COURSE.id).id);
  assert.equal(COURSE.name, getCourseById(COURSE.id).name);
  assert.equal(COURSE.href, getCourseById(COURSE.id).href);
});

test("el ámbito admite solo global exacto o un curso registrado", () => {
  assert.deepEqual(CONTENT_SCOPE_TYPES, ["global", "course"]);
  assert.equal(validateContentScope({ type: "global" }).valid, true);
  assert.equal(validateContentScope({ type: "course", courseId: "fisica-basica-1" }).valid, true);
  assert.equal(validateContentScope({ type: "site" }).valid, false);
  assert.equal(validateContentScope({ type: "global", courseId: "fisica-basica-1" }).valid, false);
  assert.equal(validateContentScope({ type: "global", extra: true }).valid, false);
  assert.equal(validateContentScope({ type: "course" }).valid, false);
  assert.equal(validateContentScope({ type: "course", courseId: "curso-inventado" }).valid, false);
  assert.equal(validateContentScope({ type: "course", courseId: "fisica-basica-1", extra: true }).valid, false);
  assert.equal(validateContentScope({ type: "course", courseId: " fisica-basica-1 " }).valid, false);
  assert.equal(validateContentScope(null).valid, false);
});

test("la normalización no infiere ámbitos y produce objetos mínimos", () => {
  assert.deepEqual(normalizeContentScope({ type: "global" }), { type: "global" });
  assert.deepEqual(
    normalizeContentScope({ type: "course", courseId: "fisica-basica-1" }),
    { type: "course", courseId: "fisica-basica-1" }
  );
  assert.throws(() => normalizeContentScope({}), /tipo de ámbito/);
  assert.throws(() => normalizeContentScope({ type: "course", courseId: "otro" }), /registrado/);
  assert.equal(contentScopeLabel({ type: "global" }), "Aula Física");
  assert.equal(
    contentScopeLabel({ type: "course", courseId: "fisica-basica-1" }),
    "Física Básica I"
  );
});

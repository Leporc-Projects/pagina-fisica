import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import { createAcademicMiniQuizRuntime } from "../src/data/mini-quizzes/academic-adapter.js";
import { MINI_QUIZZES_BY_UNIT } from "../src/data/mini-quizzes/index.js";
import { createMiniQuizRuntimeConfig } from "../src/data/mini-quizzes/runtime-config.js";
import {
  MINI_QUIZ_V2_BANKS_BY_UNIT,
  MINI_QUIZ_V2_SCHEMA_VERSION,
  MINI_QUIZ_V2_SOURCE_KIND,
  createMiniQuizV2Bank,
  localizeMiniQuizV2Record,
  selectMiniQuizV2Questions,
  validateMiniQuizV2Record,
} from "../src/data/mini-quizzes/v2.js";
import { UNIT_1_BONUSES } from "../src/data/physics/unit-1/bonuses.js";
import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import { UNIT_1_EXERCISE_FAMILIES } from "../src/data/physics/unit-1/families.js";
import { generateLocalizedUnit1FamilyInstance, getLocalizedUnit1Exercises } from "../src/data/physics/unit-1/exercise-localize.js";
import { getLocalizedUnit1Bonuses } from "../src/data/physics/unit-1/localize.js";
import { getMiniQuizNavigationState } from "../src/utils/mini-quiz-navigation.js";
import { completeBonusAttempt, createBonusAttempt, gradeExerciseResponse } from "../src/utils/bonus.js";
import { t } from "../src/i18n/index.js";

const localized = (es, en) => ({ es, en });
const baseV2Item = (overrides = {}) => ({
  schemaVersion: MINI_QUIZ_V2_SCHEMA_VERSION,
  source: { kind: MINI_QUIZ_V2_SOURCE_KIND },
  modality: "miniQuiz",
  itemKind: "fixed",
  id: "mq-v2-u2-force-choice",
  version: 1,
  unit: 2,
  topic: "segunda-ley",
  subtopic: "fuerza-neta-y-aceleracion",
  title: localized("Fuerza neta", "Net force"),
  prompt: localized("Selecciona.", "Choose."),
  interaction: {
    kind: "singleChoice",
    correctOptionId: "b",
    options: [
      {
        id: "a",
        content: localized("La velocidad", "Velocity"),
        diagnostic: {
          commonErrorId: "acceleration-follows-velocity",
          feedback: localized(
            "Esta opción hace coincidir aceleración y velocidad; compara la aceleración con la fuerza neta.",
            "This option aligns acceleration with velocity; compare acceleration with net force.",
          ),
        },
      },
      { id: "b", content: localized("La fuerza neta", "Net force") },
      { id: "c", content: localized("La masa", "Mass") },
    ],
  },
  feedback: { correct: "Correcta", incorrect: "Retroalimentación general" },
  answer: { kind: "text", value: "b" },
  solution: [],
  ...overrides,
});

const deterministicCrypto = {
  value: 0,
  getRandomValues(array) {
    for (let index = 0; index < array.length; index += 1) array[index] = this.value++;
    return array;
  },
};

test("los bancos V2 son propios, vacíos por unidad y U1 V1 queda marcado como legado", () => {
  assert.deepEqual(MINI_QUIZ_V2_BANKS_BY_UNIT.map((bank) => bank.unit), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(MINI_QUIZ_V2_BANKS_BY_UNIT.every((bank) => bank.sourceKind === "miniQuizV2" && bank.items.length === 0 && bank.families.length === 0), true);
  assert.equal(MINI_QUIZZES_BY_UNIT[0].generation, "legacy-v1");
  assert.equal(MINI_QUIZZES_BY_UNIT[0].familyAdapterId, "legacy-u1");
});

test("el registro V2 rechaza Practice, unidades inválidas e IDs duplicados", () => {
  const practice = baseV2Item({ source: { kind: "practice" }, modality: "practice", modalities: ["practice"] });
  assert.equal(validateMiniQuizV2Record(practice).valid, false);
  assert.throws(() => createMiniQuizV2Bank({ unit: 0 }), /unidad/);
  const item = baseV2Item();
  assert.throws(() => createMiniQuizV2Bank({ unit: 2, items: [item, { ...item }] }), /únicos/);
  assert.throws(() => createMiniQuizV2Bank({ unit: 1, items: [item] }), /unidad/);
  assert.throws(() => createMiniQuizV2Bank({ unit: 2, families: [item] }), /separados/);
  assert.throws(() => createMiniQuizV2Bank({ unit: 2, items: [item], blueprints: [{ id: item.id }] }), /únicos/);
});

test("el selector V2 satisface blueprints con ítems y familias V2 independientes", () => {
  const item = baseV2Item();
  const family = {
    ...baseV2Item({
      id: "mq-v2-u2-family",
      itemKind: "parameterizedFamily",
      interaction: undefined,
      constraints: { value: "finite" },
      generateParameters: () => ({ value: 2 }),
      localizeInstance: (instance, locale) => ({ ...instance, title: locale === "es" ? "Familia" : "Family" }),
      build: ({ value }) => ({
        title: "Familia",
        prompt: `${value}`,
        interaction: { kind: "number", field: { id: "value", label: "v" } },
        answer: { kind: "number", value },
        feedback: { correct: "Correcta", incorrect: "Incorrecta" },
        solution: [],
        topic: "segunda-ley",
        subtopic: "fuerza-neta-y-aceleracion",
      }),
    }),
  };
  const bank = createMiniQuizV2Bank({ unit: 2, items: [item], families: [family] });
  const blueprint = {
    id: "mq-v2-u2-synthetic",
    questionCount: 2,
    blueprint: [
      { id: "fixed", count: 1, criteria: { itemKind: ["fixed"] } },
      { id: "family", count: 1, criteria: { itemKind: ["parameterizedFamily"] } },
    ],
  };
  const selections = selectMiniQuizV2Questions(blueprint, bank, deterministicCrypto, { locale: "en" });
  assert.equal(selections.length, 2);
  assert.deepEqual(selections.map((selection) => selection.sourceItemId), [item.id, family.id]);
  assert.equal(selections[1].exercise.itemKind, "parameterizedInstance");
  assert.equal(selections[1].exercise.title, "Family");
});

test("diagnóstico localizado conserva identidad y la calificación usa fallback seguro", () => {
  const source = baseV2Item();
  const es = localizeMiniQuizV2Record(source, "es");
  const en = localizeMiniQuizV2Record(source, "en");
  assert.equal(es.interaction.options[0].diagnostic.commonErrorId, en.interaction.options[0].diagnostic.commonErrorId);
  assert.match(gradeExerciseResponse(es, "a").feedback, /aceleración y velocidad/);
  assert.match(gradeExerciseResponse(en, "a").feedback, /acceleration with velocity/);
  assert.equal(gradeExerciseResponse(es, "c").feedback, "Retroalimentación general");
  assert.equal(gradeExerciseResponse(es, "b").feedback, "Correcta");
});

test("el validador rechaza diagnósticos sin identidad o sin par ES/EN", () => {
  const invalidId = baseV2Item();
  invalidId.interaction.options[0].diagnostic.commonErrorId = "";
  assert.equal(validateMiniQuizV2Record(invalidId).valid, false);
  const incomplete = baseV2Item();
  incomplete.interaction.options[0].diagnostic.feedback = { es: "Solo ES" };
  assert.throws(() => createMiniQuizV2Bank({ unit: 2, items: [incomplete] }), /ES\/EN/);
});

const syntheticRuntime = (unitNumber) => createMiniQuizRuntimeConfig({
  locale: "es",
  course: { code: "0302270", slug: "fisica-basica-1", title: "Física Básica I" },
  unit: { number: unitNumber, slug: `unidad-${unitNumber}`, title: `Unidad ${unitNumber}`, route: `/unidad-${unitNumber}` },
  familyAdapterId: `synthetic-u${unitNumber}`,
  topics: [{ id: "topic", title: "Tema", shortTitle: "Tema", route: `/unidad-${unitNumber}/tema` }],
  subtopics: [{ id: "topic:section", title: "Sección", route: `/unidad-${unitNumber}/tema#section` }],
  commonErrors: [{ id: "misconception", title: "Idea precisa", route: `/unidad-${unitNumber}/tema#precisa` }],
});

const attemptDefinition = { id: "synthetic", version: 2, title: "Sintético", modality: "bonus", purpose: "learning", exposure: "public", feedbackPolicy: "afterAttempt" };
const syntheticExercise = (id, { diagnostic, subtopic = "section" } = {}) => ({
  id,
  version: 1,
  itemKind: "fixed",
  topic: "topic",
  subtopic,
  interaction: {
    kind: "singleChoice",
    correctOptionId: "ok",
    options: [
      { id: "ok", content: "Correcta" },
      { id: "wrong", content: "Incorrecta", ...(diagnostic ? { diagnostic: { commonErrorId: diagnostic, feedback: "Específica" } } : {}) },
    ],
  },
  feedback: { correct: "Correcta", incorrect: "General" },
  answer: { kind: "text", value: "ok" },
  title: id,
  prompt: id,
  solution: [],
});

test("dos unidades usan las mismas utilidades sin metadata U1 implícita", () => {
  [1, 2].forEach((unitNumber) => {
    const runtime = syntheticRuntime(unitNumber);
    const exercise = syntheticExercise(`item-u${unitNumber}`);
    const attempt = createBonusAttempt(attemptDefinition, [{ exercise, slotId: "one" }], {
      runtime,
      attemptId: `attempt_${String(unitNumber).padStart(32, "0")}`,
      startedAt: "2026-08-08T12:00:00.000Z",
    });
    assert.equal(attempt.unit.number, unitNumber);
    assert.equal(attempt.course.code, "0302270");
  });
  const runtime1 = createAcademicMiniQuizRuntime(1, "es", { familyAdapterId: "legacy-u1" });
  const runtime2 = createAcademicMiniQuizRuntime(2, "en", { familyAdapterId: "future-u2" });
  assert.notEqual(runtime1.unit.number, runtime2.unit.number);
  assert.match(runtime2.unit.title, /Newton/);
  const browserRuntime = fs.readFileSync(new URL("../src/scripts/bonus.js", import.meta.url), "utf8");
  assert.doesNotMatch(browserRuntime, /physics\/unit-1|Unit1|UNIT_1/);
  assert.match(browserRuntime, /loadMiniQuizFamilyAdapter/);
});

test("las recomendaciones priorizan diagnóstico, luego subtema y deduplican por ruta", () => {
  const runtime = syntheticRuntime(2);
  const diagnostic = syntheticExercise("diagnostic", { diagnostic: "misconception" });
  const duplicate = syntheticExercise("duplicate", { diagnostic: "misconception" });
  const fallback = syntheticExercise("fallback");
  const correct = syntheticExercise("correct");
  const exercises = [diagnostic, duplicate, fallback, correct];
  const attempt = createBonusAttempt(attemptDefinition, exercises.map((exercise) => ({ exercise, slotId: exercise.id })), {
    runtime,
    attemptId: "attempt_1234567890abcdef1234567890abcdef",
    startedAt: "2026-08-08T12:00:00.000Z",
  });
  const completed = completeBonusAttempt({
    attempt,
    exercises,
    responses: { diagnostic: "wrong", duplicate: "wrong", fallback: "wrong", correct: "ok" },
    completedAt: "2026-08-08T12:05:00.000Z",
    runtime,
  });
  assert.deepEqual(
    completed.summary.reviewRecommendations.map(({ title, route }) => [title, route]),
    [["Idea precisa", "/unidad-2/tema#precisa"], ["Sección", "/unidad-2/tema#section"]],
  );
  assert.equal(completed.summary.reviewRecommendations.some((item) => item.title === "correct"), false);
});

test("la navegación final reemplaza Review, elimina Next y conserva review tras completar", () => {
  const intermediate = getMiniQuizNavigationState({ currentIndex: 0, questionCount: 3 });
  const last = getMiniQuizNavigationState({ currentIndex: 2, questionCount: 3 });
  const completedLast = getMiniQuizNavigationState({ currentIndex: 2, questionCount: 3, completed: true });
  assert.deepEqual(intermediate, { lastQuestion: false, showNext: true, reviewLabelKey: "bonus.reviewAttempt", mode: "intermediate" });
  assert.deepEqual(last, { lastQuestion: true, showNext: false, reviewLabelKey: "bonus.finish", mode: "last" });
  assert.equal(t("es", last.reviewLabelKey), "Finalizar intento");
  assert.equal(t("en", last.reviewLabelKey), "Finish attempt");
  assert.equal(completedLast.reviewLabelKey, "bonus.reviewAttempt");
  const source = fs.readFileSync(new URL("../src/scripts/bonus.js", import.meta.url), "utf8");
  assert.match(source, /reviewButton.*navigation\.reviewLabelKey/s);
  assert.match(source, /else next\.remove\(\)/);
  assert.match(source, /\[data-bonus-review\]"\)\?\.addEventListener\("click", renderReview\)/);
  assert.equal((source.match(/trackMiniQuizComplete\(/g) ?? []).length, 1);
});

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
};
const seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
};

test("la huella académica y de rutas U1 V1 permanece exacta", () => {
  const fixed = Object.fromEntries(["es", "en"].map((locale) => [locale,
    getLocalizedUnit1Exercises(locale).filter((item) => item.bonusEligible).map((item) => ({
      id: item.id, title: item.title, prompt: item.prompt, answer: item.answer,
      tolerance: item.tolerance, solution: item.solution, interaction: item.interaction,
    })),
  ]));
  const families = Object.fromEntries(["es", "en"].map((locale) => [locale,
    UNIT_1_EXERCISE_FAMILIES.flatMap((family) => [17, 41].map((seed) => {
      const item = generateLocalizedUnit1FamilyInstance(family, locale, { random: seededRandom(seed) });
      return {
        id: family.id, version: family.version, seed, topic: item.topic, subtopic: item.subtopic,
        title: item.title, prompt: item.prompt, answer: item.answer, tolerance: item.tolerance,
        solution: item.solution, interaction: item.interaction,
      };
    })),
  ]));
  const quizzes = Object.fromEntries(["es", "en"].map((locale) => [locale,
    getLocalizedUnit1Bonuses(locale).map(({ id, slug, title, description, estimatedMinutes, topics, blueprint }) => ({ id, slug, title, description, estimatedMinutes, topics, blueprint })),
  ]));
  const payload = JSON.stringify(stable({
    definitions: UNIT_1_BONUSES.map(({ id, slug, estimatedMinutes, topics, blueprint }) => ({ id, slug, estimatedMinutes, topics, blueprint })),
    fixed,
    families,
    quizzes,
  }));
  assert.equal(crypto.createHash("sha256").update(payload).digest("hex"), "15e312a10a6930cc2157815879d524e5e9d375a930756ec58e18b3ba86c32e51");
  assert.deepEqual(UNIT_1_BONUSES.map(({ id, slug }) => [id, slug]), [
    ["bonus-u1-tools-vectors", "herramientas-vectores"],
    ["bonus-u1-kinematics", "cinematica"],
    ["bonus-u1-motion-2d-circular-relative", "movimiento-2d-circular-relativo"],
    ["bonus-u1-review", "repaso-unidad-1"],
  ]);
});

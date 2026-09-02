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
import { UNIT_1_COMMON_ERRORS } from "../src/data/physics/unit-1/common-errors.js";
import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import { UNIT_1_EXERCISE_FAMILIES } from "../src/data/physics/unit-1/families.js";
import { generateLocalizedUnit1FamilyInstance, getLocalizedUnit1Exercises } from "../src/data/physics/unit-1/exercise-localize.js";
import { getLocalizedUnit1Bonuses } from "../src/data/physics/unit-1/localize.js";
import { createMiniQuizStartGuard, getMiniQuizNavigationState } from "../src/utils/mini-quiz-navigation.js";
import {
  BONUS_ATTEMPT_SCHEMA_VERSION,
  completeBonusAttempt,
  createBonusAttempt,
  gradeExerciseResponse,
  validateCompletedBonusAttempt,
} from "../src/utils/bonus.js";
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
  assessmentSlot: "synthetic-slot",
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
  feedback: {
    correct: localized("Correcta", "Correct"),
    incorrect: localized("Retroalimentación general", "General feedback"),
  },
  answer: { kind: "text", value: "b" },
  solution: [{
    title: localized("Relaciona la fuerza", "Relate the force"),
    text: localized("La aceleración sigue la fuerza neta.", "Acceleration follows the net force."),
  }],
  ...overrides,
});

const numberV2Item = () => baseV2Item({
  id: "mq-v2-u2-number",
  title: localized("Rapidez medida", "Measured speed"),
  prompt: localized("Escribe la rapidez.", "Enter the speed."),
  interaction: {
    kind: "number",
    field: {
      id: "speed",
      label: localized("Rapidez", "Speed"),
      unit: "m/s",
      unitLabel: localized("metros por segundo", "metres per second"),
    },
  },
  feedback: {
    correct: localized("Rapidez correcta", "Correct speed"),
    incorrect: localized("Revisa la rapidez", "Review the speed"),
  },
  answer: { kind: "number", value: 12.5, unit: "m/s" },
  tolerance: 0.05,
  expectedUnit: "m/s",
  solution: [{
    title: localized("Calcula la magnitud", "Calculate the magnitude"),
    text: localized("La rapidez es 12,5 m/s.", "The speed is 12.5 m/s."),
  }],
});

const multiNumberV2Item = () => baseV2Item({
  id: "mq-v2-u2-multi-number",
  title: localized("Estado cinemático", "Kinematic state"),
  prompt: localized("Completa posición y tiempo.", "Complete position and time."),
  interaction: {
    kind: "multiNumber",
    fields: [
      { id: "position", label: localized("Posición", "Position"), unit: "m" },
      { id: "time", label: localized("Tiempo", "Time"), unit: "s", unitLabel: localized("segundos", "seconds") },
    ],
  },
  feedback: {
    correct: localized("Estado correcto", "Correct state"),
    incorrect: localized("Revisa el estado", "Review the state"),
  },
  answer: {
    kind: "values",
    values: [
      { symbol: "x", value: 3, unit: "m" },
      { symbol: "t", value: 2, unit: "s", tolerance: 0.02 },
    ],
  },
  tolerance: 0.1,
  expectedUnit: "mixed",
  solution: [{
    title: localized("Lee ambos valores", "Read both values"),
    text: localized("La posición es 3 m y el tiempo es 2 s.", "Position is 3 m and time is 2 s."),
  }],
});

const deterministicCrypto = {
  value: 0,
  getRandomValues(array) {
    for (let index = 0; index < array.length; index += 1) array[index] = this.value++;
    return array;
  },
};

const selectOnlyFixedV2Item = (source, locale) => {
  const bank = createMiniQuizV2Bank({ unit: source.unit, items: [source] });
  return selectMiniQuizV2Questions({
    id: `${source.id}-selection`,
    questionCount: 1,
    blueprint: [{ id: "fixed", count: 1, criteria: { itemKind: ["fixed"] } }],
  }, bank, { ...deterministicCrypto, value: 0 }, { locale })[0].exercise;
};

test("los bancos V2 son propios, U1 contiene sus anclas y V1 sigue marcado como legado", () => {
  assert.deepEqual(MINI_QUIZ_V2_BANKS_BY_UNIT.map((bank) => bank.unit), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(MINI_QUIZ_V2_BANKS_BY_UNIT.every((bank) => bank.sourceKind === "miniQuizV2"), true);
  assert.deepEqual(
    MINI_QUIZ_V2_BANKS_BY_UNIT.map(({ items, families, blueprints }) => [items.length, families.length, blueprints.length]),
    [[35, 0, 5], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
  );
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

test("la selección V2 localiza el ítem fijo completo en ES y EN sin cambiar grading", () => {
  const source = baseV2Item();

  for (const locale of ["es", "en"]) {
    const selected = selectOnlyFixedV2Item(source, locale);
    const options = Object.fromEntries(selected.interaction.options.map((option) => [option.id, option]));
    assert.equal(selected.title, locale === "es" ? "Fuerza neta" : "Net force");
    assert.equal(selected.prompt, locale === "es" ? "Selecciona." : "Choose.");
    assert.deepEqual(
      selected.interaction.options.map(({ id, content }) => [id, content]),
      locale === "es"
        ? [["a", "La velocidad"], ["b", "La fuerza neta"], ["c", "La masa"]]
        : [["a", "Velocity"], ["b", "Net force"], ["c", "Mass"]],
    );
    assert.equal(
      options.a.diagnostic.feedback,
      locale === "es"
        ? "Esta opción hace coincidir aceleración y velocidad; compara la aceleración con la fuerza neta."
        : "This option aligns acceleration with velocity; compare acceleration with net force.",
    );
    assert.equal(selected.interaction.correctOptionId, "b");
    assert.equal(options.a.diagnostic.commonErrorId, "acceleration-follows-velocity");
    assert.equal(selected.feedback.correct, locale === "es" ? "Correcta" : "Correct");
    assert.equal(selected.feedback.incorrect, locale === "es" ? "Retroalimentación general" : "General feedback");
    assert.deepEqual(selected.solution, [{
      title: locale === "es" ? "Relaciona la fuerza" : "Relate the force",
      text: locale === "es" ? "La aceleración sigue la fuerza neta." : "Acceleration follows the net force.",
    }]);
    assert.equal(selected.answer, source.answer);
  }

  assert.deepEqual(source.title, localized("Fuerza neta", "Net force"));
  assert.deepEqual(source.interaction.options[0].content, localized("La velocidad", "Velocity"));
});

test("number y multiNumber localizan campos, feedback y solución sin tocar invariantes", () => {
  for (const locale of ["es", "en"]) {
    const numberSource = numberV2Item();
    const number = selectOnlyFixedV2Item(numberSource, locale);
    assert.equal(number.title, locale === "es" ? "Rapidez medida" : "Measured speed");
    assert.equal(number.prompt, locale === "es" ? "Escribe la rapidez." : "Enter the speed.");
    assert.equal(number.interaction.field.label, locale === "es" ? "Rapidez" : "Speed");
    assert.equal(number.interaction.field.unitLabel, locale === "es" ? "metros por segundo" : "metres per second");
    assert.equal(number.interaction.field.id, "speed");
    assert.equal(number.interaction.field.unit, "m/s");
    assert.equal(number.feedback.correct, locale === "es" ? "Rapidez correcta" : "Correct speed");
    assert.equal(number.feedback.incorrect, locale === "es" ? "Revisa la rapidez" : "Review the speed");
    assert.deepEqual(number.solution, [{
      title: locale === "es" ? "Calcula la magnitud" : "Calculate the magnitude",
      text: locale === "es" ? "La rapidez es 12,5 m/s." : "The speed is 12.5 m/s.",
    }]);
    assert.equal(number.answer, numberSource.answer);
    assert.equal(number.tolerance, numberSource.tolerance);
    assert.equal(number.expectedUnit, numberSource.expectedUnit);
    assert.deepEqual(
      { id: number.id, topic: number.topic, subtopic: number.subtopic },
      { id: numberSource.id, topic: numberSource.topic, subtopic: numberSource.subtopic },
    );
    assert.deepEqual(numberSource.interaction.field.label, localized("Rapidez", "Speed"));

    const multiSource = multiNumberV2Item();
    const multi = selectOnlyFixedV2Item(multiSource, locale);
    assert.deepEqual(
      multi.interaction.fields.map(({ id, label, unit, unitLabel }) => ({ id, label, unit, unitLabel })),
      locale === "es"
        ? [
            { id: "position", label: "Posición", unit: "m", unitLabel: undefined },
            { id: "time", label: "Tiempo", unit: "s", unitLabel: "segundos" },
          ]
        : [
            { id: "position", label: "Position", unit: "m", unitLabel: undefined },
            { id: "time", label: "Time", unit: "s", unitLabel: "seconds" },
          ],
    );
    assert.equal(multi.feedback.correct, locale === "es" ? "Estado correcto" : "Correct state");
    assert.equal(multi.feedback.incorrect, locale === "es" ? "Revisa el estado" : "Review the state");
    assert.deepEqual(multi.solution, [{
      title: locale === "es" ? "Lee ambos valores" : "Read both values",
      text: locale === "es" ? "La posición es 3 m y el tiempo es 2 s." : "Position is 3 m and time is 2 s.",
    }]);
    assert.equal(multi.answer, multiSource.answer);
    assert.equal(multi.tolerance, multiSource.tolerance);
    assert.equal(multi.expectedUnit, multiSource.expectedUnit);
    assert.deepEqual(
      { id: multi.id, topic: multi.topic, subtopic: multi.subtopic },
      { id: multiSource.id, topic: multiSource.topic, subtopic: multiSource.subtopic },
    );
    assert.deepEqual(multiSource.interaction.fields[1].label, localized("Tiempo", "Time"));
  }
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

test("el validador V2 cubre la estructura mínima segura de autoría", () => {
  for (const version of [undefined, 0, -1, 1.5]) {
    assert.equal(validateMiniQuizV2Record(baseV2Item({ version })).valid, false);
  }
  assert.equal(validateMiniQuizV2Record(baseV2Item({ assessmentSlot: "INVALID SLOT" })).valid, false);

  const familyBase = baseV2Item({
    id: "mq-v2-u2-family-validation",
    itemKind: "parameterizedFamily",
    interaction: undefined,
    generateParameters: () => ({ value: 1 }),
    build: ({ value }) => ({ value }),
    localizeInstance: (instance) => instance,
  });
  assert.equal(validateMiniQuizV2Record(familyBase).valid, false);
  assert.equal(validateMiniQuizV2Record({ ...familyBase, constraints: [] }).valid, false);
  assert.equal(validateMiniQuizV2Record({ ...familyBase, constraints: { finite: true } }).valid, true);

  const missingId = baseV2Item();
  delete missingId.interaction.options[0].id;
  assert.equal(validateMiniQuizV2Record(missingId).valid, false);
  const duplicateId = baseV2Item();
  duplicateId.interaction.options[1].id = "a";
  assert.equal(validateMiniQuizV2Record(duplicateId).valid, false);
  const unknownCorrect = baseV2Item();
  unknownCorrect.interaction.correctOptionId = "missing";
  assert.equal(validateMiniQuizV2Record(unknownCorrect).valid, false);
  const incompleteOption = baseV2Item();
  incompleteOption.interaction.options[2].content = { es: "Solo ES" };
  assert.equal(validateMiniQuizV2Record(incompleteOption).valid, false);

  const incompleteFeedback = baseV2Item();
  incompleteFeedback.feedback.incorrect = { es: "Solo ES" };
  assert.equal(validateMiniQuizV2Record(incompleteFeedback).valid, false);
  const incompleteSolution = baseV2Item();
  incompleteSolution.solution[0].text = { es: "Solo ES" };
  assert.equal(validateMiniQuizV2Record(incompleteSolution).valid, false);
  const incompleteNumber = numberV2Item();
  incompleteNumber.interaction.field.label = { es: "Solo ES" };
  assert.equal(validateMiniQuizV2Record(incompleteNumber).valid, false);
  const incompleteNumberUnitLabel = numberV2Item();
  incompleteNumberUnitLabel.interaction.field.unitLabel = "m/s";
  assert.equal(validateMiniQuizV2Record(incompleteNumberUnitLabel).valid, false);
  const incompleteMultiNumber = multiNumberV2Item();
  incompleteMultiNumber.interaction.fields[1].label = { en: "English only" };
  assert.equal(validateMiniQuizV2Record(incompleteMultiNumber).valid, false);
  const incompleteMultiUnitLabel = multiNumberV2Item();
  incompleteMultiUnitLabel.interaction.fields[1].unitLabel = { es: "Solo ES" };
  assert.equal(validateMiniQuizV2Record(incompleteMultiUnitLabel).valid, false);
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

test("el runtime académico resuelve errores U1 mediante errorTopics en ES y EN", () => {
  const expectedRoutes = {
    es: "/fisica-basica-1/unidades/unidad-1/herramientas#conversion-y-cifras",
    en: "/en/basic-physics-1/units/unit-1/measurement-tools#conversion-y-cifras",
  };
  for (const locale of ["es", "en"]) {
    const runtime = createAcademicMiniQuizRuntime(1, locale, { familyAdapterId: "legacy-u1" });
    assert.deepEqual(
      Object.keys(runtime.commonErrors).sort(),
      UNIT_1_COMMON_ERRORS.map(({ id }) => id).sort(),
    );
    UNIT_1_COMMON_ERRORS.forEach(({ id }) => {
      const runtimeError = runtime.commonErrors[id];
      const topic = runtime.topics[runtimeError.topicId];
      const subtopic = runtime.subtopics[`${runtimeError.topicId}:${runtimeError.subtopicId}`];
      assert.ok(topic, `${locale} ${id} no resolvió tema canónico.`);
      assert.ok(subtopic, `${locale} ${id} no resolvió subtema canónico.`);
      assert.equal(runtimeError.route, subtopic.route, `${locale} ${id} no usa la ruta canónica.`);
      assert.equal(runtimeError.title, subtopic.title, `${locale} ${id} no usa el título canónico.`);
    });
    const error = runtime.commonErrors["units-drop-during-work"];
    assert.deepEqual(
      { topicId: error.topicId, subtopicId: error.subtopicId, route: error.route },
      { topicId: "herramientas", subtopicId: "conversion-y-cifras", route: expectedRoutes[locale] },
    );
    assert.equal(error.title, runtime.subtopics["herramientas:conversion-y-cifras"].title);
  }
});

test("el routing común conserva destinos canónicos para Unidades 2 a 7", () => {
  for (const locale of ["es", "en"]) {
    for (let unit = 2; unit <= 7; unit += 1) {
      const runtime = createAcademicMiniQuizRuntime(unit, locale);
      Object.values(runtime.commonErrors).forEach((error) => {
        const subtopic = runtime.subtopics[`${error.topicId}:${error.subtopicId}`];
        assert.ok(subtopic, `${locale} U${unit} ${error.id}`);
        assert.equal(error.route, subtopic.route, `${locale} U${unit} ${error.id}`);
      });
    }
  }
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

test("el guard de inicio colapsa activaciones concurrentes y permite reintentar", async () => {
  const pendingStates = [];
  const runStart = createMiniQuizStartGuard((pending) => pendingStates.push(pending));
  let release;
  const loading = new Promise((resolve) => { release = resolve; });
  let starts = 0;
  const first = runStart(async () => {
    starts += 1;
    await loading;
  });
  const duplicate = await runStart(async () => { starts += 1; });
  assert.equal(duplicate, false);
  assert.equal(starts, 1);
  release();
  assert.equal(await first, true);

  await assert.rejects(runStart(async () => { throw new Error("adapter failed"); }), /adapter failed/);
  assert.equal(await runStart(async () => { starts += 1; }), true);
  assert.equal(starts, 2);
  assert.deepEqual(pendingStates, [true, false, true, false, true, false]);

  const source = fs.readFileSync(new URL("../src/scripts/bonus.js", import.meta.url), "utf8");
  assert.match(source, /createMiniQuizStartGuard/);
  assert.match(source, /\[data-bonus-start\], \[data-another-attempt\]/);
  assert.match(source, /aria-busy/);
});

test("un intento completado 1.x conserva wire bonus aunque los ítems V2 usen miniQuiz", () => {
  const v2Source = baseV2Item();
  const runtime = syntheticRuntime(2);
  const exercise = syntheticExercise("legacy-wire-item");
  const attempt = createBonusAttempt(attemptDefinition, [{ exercise, slotId: "one" }], {
    runtime,
    attemptId: "attempt_abcdefabcdefabcdefabcdefabcdefab",
    startedAt: "2026-08-08T12:00:00.000Z",
  });
  const completed = completeBonusAttempt({
    attempt,
    exercises: [exercise],
    responses: { "legacy-wire-item": "ok" },
    completedAt: "2026-08-08T12:01:00.000Z",
    runtime,
  });

  assert.equal(v2Source.modality, "miniQuiz");
  assert.equal(completed.schemaVersion, BONUS_ATTEMPT_SCHEMA_VERSION);
  assert.equal(completed.modality, "bonus");
  assert.equal(completed.bonusId, attemptDefinition.id);
  assert.equal(Object.hasOwn(completed, "miniQuizId"), false);
  assert.equal(validateCompletedBonusAttempt(completed).valid, true);
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

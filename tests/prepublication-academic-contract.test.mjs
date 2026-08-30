import assert from "node:assert/strict";
import test from "node:test";

import { ACADEMIC_UNITS, getAcademicUnitAdapter } from "../src/data/physics/index.js";
import { localizeAcademicUnitLabel } from "../src/data/physics/localize-unit-label.js";

const EXPECTED_TOTALS = Object.freeze({
  topics: 57,
  sections: 215,
  formulas: 100,
  visualizations: 104,
  checks: 113,
  errors: 144,
  examples: 44,
  exercises: 292,
  families: 77,
});

const invariantAnswer = (answer) => answer.kind === "values"
  ? { kind: answer.kind, values: answer.values.map(({ id, value }) => ({ id, value })) }
  : { kind: answer.kind, value: answer.value };

test("el corpus prepublicación conserva inventario y superficies académicas completas", () => {
  const observed = Object.fromEntries(Object.keys(EXPECTED_TOTALS).map((key) => [key, 0]));
  const exerciseIds = new Set();

  for (const { number } of ACADEMIC_UNITS) {
    const adapter = getAcademicUnitAdapter(number);
    const esContent = adapter.getContent("es");
    const enContent = adapter.getContent("en");
    const esTopics = Object.values(esContent);
    const enTopics = Object.values(enContent);
    const esSections = esTopics.flatMap(({ sections }) => sections);
    const enSections = enTopics.flatMap(({ sections }) => sections);
    const formulaIds = new Set(esSections.flatMap(({ formulas = [] }) => formulas
      .map((formula) => typeof formula === "string" ? formula : formula.id)));
    const exampleIds = new Set(esSections.flatMap(({ examples = [] }) => examples));
    const errorTopics = [...new Set(esTopics.flatMap(({ errorTopics = [] }) => errorTopics))];
    const esErrors = adapter.getErrors(errorTopics, "es");
    const enErrors = adapter.getErrors(errorTopics, "en");
    const esExercises = adapter.getFixedExercises("es");
    const enExercises = adapter.getFixedExercises("en");
    const families = adapter.getBankItems("es")
      .filter(({ itemKind }) => itemKind === "parameterizedFamily");

    assert.equal(enTopics.length, esTopics.length, `U${number}: topics ES/EN`);
    assert.equal(enSections.length, esSections.length, `U${number}: sections ES/EN`);
    assert.equal(enErrors.length, esErrors.length, `U${number}: errors ES/EN`);
    assert.equal(enExercises.length, esExercises.length, `U${number}: exercises ES/EN`);

    esSections.forEach((section, index) => {
      const enSection = enSections[index];
      for (const layer of ["essential", "understand", "deepen", "explore"]) {
        assert.ok(section[layer]?.length, `U${number}:${section.id}:${layer}:es`);
        assert.equal(enSection[layer]?.length, section[layer].length, `U${number}:${section.id}:${layer}:en`);
      }
      for (const check of section.checks ?? []) {
        assert.ok(check.question?.trim(), `U${number}:${section.id}:check question`);
        assert.ok(check.answer?.trim(), `U${number}:${section.id}:check answer`);
      }
      assert.equal(enSection.checks?.length ?? 0, section.checks?.length ?? 0, `U${number}:${section.id}:checks`);
    });

    for (const formulaId of formulaIds) {
      const es = adapter.getFormula(formulaId, "es");
      const en = adapter.getFormula(formulaId, "en");
      for (const [locale, formula] of [["es", es], ["en", en]]) {
        assert.ok(formula.label?.trim(), `${formulaId}:${locale}:label`);
        assert.match(formula.mathml, /<math[^>]+aria-label="[^"]+"/u, `${formulaId}:${locale}:aria`);
        assert.match(formula.mathml, /<semantics>[\s\S]*<annotation encoding="application\/x-tex">/u, `${formulaId}:${locale}:semantics`);
        assert.ok(formula.represents?.trim(), `${formulaId}:${locale}:represents`);
        assert.ok(formula.conditions?.length, `${formulaId}:${locale}:conditions`);
        assert.ok(formula.interpretation?.trim(), `${formulaId}:${locale}:interpretation`);
        assert.ok(formula.dimensions?.trim(), `${formulaId}:${locale}:dimensions`);
        assert.ok(formula.variables?.every(({ symbol, meaning, unit }) => symbol && meaning && unit), `${formulaId}:${locale}:variables`);
      }
      assert.deepEqual(
        en.variables.map(({ symbol, unit }) => ({ symbol, unit })),
        es.variables.map(({ symbol, unit }) => ({ symbol, unit: localizeAcademicUnitLabel(unit, "en") })),
        `${formulaId}: invariant symbols and units`,
      );
    }

    if (adapter.getExample) {
      for (const exampleId of exampleIds) {
        const es = adapter.getExample(exampleId, "es");
        const en = adapter.getExample(exampleId, "en");
        assert.ok(es.steps?.length, `${exampleId}:steps`);
        assert.equal(en.steps.length, es.steps.length, `${exampleId}:steps ES/EN`);
        assert.ok(es.conclusion?.trim() && en.conclusion?.trim(), `${exampleId}:conclusion`);
        assert.equal("answer" in es || "interaction" in es || "feedback" in es, false, `${exampleId}:static`);
      }
    }

    esErrors.forEach((error, index) => {
      assert.ok(error.id && error.description?.trim() && error.feedback?.trim(), `U${number}:error:${index}`);
      assert.equal(enErrors[index].id, error.id, `U${number}:${error.id}:id`);
      assert.ok(enErrors[index].description?.trim() && enErrors[index].feedback?.trim(), `U${number}:${error.id}:en`);
    });

    esExercises.forEach((exercise, index) => {
      const en = enExercises[index];
      assert.equal(exerciseIds.has(exercise.id), false, exercise.id);
      exerciseIds.add(exercise.id);
      assert.equal(en.id, exercise.id, `${exercise.id}:locale identity`);
      assert.deepEqual(invariantAnswer(en.answer), invariantAnswer(exercise.answer), `${exercise.id}:answer invariant`);
      assert.equal(en.expectedUnit, localizeAcademicUnitLabel(exercise.expectedUnit, "en"), `${exercise.id}:unit invariant`);
      assert.equal(en.tolerance, exercise.tolerance, `${exercise.id}:tolerance invariant`);
      assert.ok(exercise.prompt?.trim() && en.prompt?.trim(), `${exercise.id}:prompt`);
      assert.ok(exercise.solution?.length && en.solution?.length, `${exercise.id}:solution`);
      assert.ok(exercise.solution.every(({ text }) => text?.trim()), `${exercise.id}:solution text`);
      if (exercise.answer.kind === "number") {
        assert.ok(Number.isFinite(exercise.answer.value), `${exercise.id}:finite answer`);
        assert.ok(Number.isFinite(exercise.tolerance) && exercise.tolerance >= 0, `${exercise.id}:tolerance`);
      }
      if (exercise.answer.kind === "values") {
        assert.ok(exercise.answer.values.length, `${exercise.id}:values`);
        assert.ok(exercise.answer.values.every(({ value }) => Number.isFinite(value)), `${exercise.id}:finite values`);
      }
      if (exercise.interaction?.kind === "singleChoice") {
        const ids = exercise.interaction.options.map(({ id }) => id);
        const options = exercise.interaction.options.map(({ content }) => content.trim().toLocaleLowerCase("es"));
        assert.equal(new Set(ids).size, ids.length, `${exercise.id}:option ids`);
        assert.equal(new Set(options).size, options.length, `${exercise.id}:option text`);
        assert.equal(ids.filter((id) => id === exercise.interaction.correctOptionId).length, 1, `${exercise.id}:one correct option`);
      }
    });

    observed.topics += esTopics.length;
    observed.sections += esSections.length;
    observed.formulas += formulaIds.size;
    observed.visualizations += adapter.visualizationIds.length;
    observed.checks += esSections.reduce((sum, { checks = [] }) => sum + checks.length, 0);
    observed.errors += esErrors.length;
    observed.examples += exampleIds.size;
    observed.exercises += esExercises.length;
    observed.families += families.length;
  }

  assert.deepEqual(observed, EXPECTED_TOTALS);
  assert.equal(exerciseIds.size, EXPECTED_TOTALS.exercises);
});

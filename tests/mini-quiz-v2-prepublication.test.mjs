import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { MINI_QUIZZES_BY_UNIT } from "../src/data/mini-quizzes/index.js";
import { createMiniQuizPageData } from "../src/data/mini-quizzes/page-adapter.js";
import { UNIT_1_MINI_QUIZ_V2_ACTIVITIES } from "../src/data/mini-quizzes/unit-1-catalog.js";
import {
  UNIT_1_MINI_QUIZ_V2_MATH_OVERRIDE_LITERALS,
  UNIT_1_MINI_QUIZ_V2_VISUAL_BY_SLOT,
  getUnit1MiniQuizV2Visualizations,
  presentUnit1MiniQuizV2RichText,
} from "../src/data/mini-quizzes/unit-1-presentation.js";
import { getMiniQuizV2BankByUnit, selectMiniQuizV2Questions } from "../src/data/mini-quizzes/v2.js";
import { UNIT_1_BONUSES } from "../src/data/physics/unit-1/bonuses.js";
import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import { UNIT_1_EXERCISE_FAMILIES } from "../src/data/physics/unit-1/families.js";
import { getLocalizedPath, getRouteCounterpart } from "../src/i18n/routes.js";
import { DIAGRAM_LABEL_METRICS } from "../src/utils/diagram-layout.js";
import { prepareDiagram } from "../src/utils/diagram-geometry.js";

const bank = getMiniQuizV2BankByUnit(1);
const bySlot = Object.fromEntries(bank.items.map((item) => [item.assessmentSlot, item]));

const deterministicCrypto = () => ({
  value: 0,
  getRandomValues(array) {
    for (let index = 0; index < array.length; index += 1) array[index] = this.value++;
    return array;
  },
});

const allPresentationStrings = (record) => [
  record.title.es, record.title.en, record.prompt.es, record.prompt.en,
  ...record.interaction.options.flatMap((option) => [
    option.content.es,
    option.content.en,
    option.diagnostic?.feedback?.es,
    option.diagnostic?.feedback?.en,
  ]),
  record.feedback.correct.es, record.feedback.correct.en,
  record.feedback.incorrect.es, record.feedback.incorrect.en,
  ...record.solution.flatMap((step) => [step.title.es, step.title.en, step.text.es, step.text.en]),
].filter(Boolean);

const visibleLabels = (visualization) => {
  const props = visualization.props;
  return [
    visualization.relationLabel,
    ...(props.series ?? []).map(({ label }) => label),
    ...(props.functions ?? []).map(({ label }) => label),
    ...(props.references ?? []).map(({ label }) => label),
    ...(props.vectors ?? []).map(({ label }) => label),
    ...(props.segments ?? []).map(({ label }) => label),
    ...(props.curves ?? []).map(({ label }) => label),
    ...(props.circles ?? []).map(({ label }) => label),
    ...(props.points ?? []).map(({ label }) => label),
    ...(props.annotations ?? []).map(({ label }) => label),
  ].filter(Boolean).join(" ");
};

test("el catálogo público U1 V2 contiene seis actividades y metadatos canónicos", () => {
  assert.deepEqual(UNIT_1_MINI_QUIZ_V2_ACTIVITIES.map((activity) => [
    activity.id,
    activity.slug,
    activity.questionCount,
    activity.estimatedMinutes,
    activity.title.es,
    activity.shortTitle.es,
  ]), [
    ["mq-v2-u1-tools-vectors", "herramientas-vectores", 6, 15, "Mini quiz de herramientas y vectores", "Herramientas y vectores"],
    ["mq-v2-u1-kinematics-1d", "cinematica", 7, 18, "Mini quiz de cinemática en una dimensión", "Cinemática en una dimensión"],
    ["mq-v2-u1-models-projectiles", "modelos-proyectiles", 7, 18, "Mini quiz de modelos y proyectiles", "Modelos y proyectiles"],
    ["mq-v2-u1-motion-2d-circular-relative", "movimiento-2d-circular-relativo", 6, 16, "Mini quiz de movimiento 2D, circular y relativo", "Movimiento 2D, circular y relativo"],
    ["mq-v2-u1-review", "repaso-unidad-1", 9, 22, "Mini quiz de repaso de Unidad 1", "Repaso de Unidad 1"],
    ["mq-v2-u1-polar-coordinates", "coordenadas-polares", 6, 16, "Mini quiz de coordenadas polares", "Coordenadas polares"],
  ]);
  assert.deepEqual(
    UNIT_1_MINI_QUIZ_V2_ACTIVITIES.map(({ id, blueprintId }) => [id, blueprintId]),
    UNIT_1_MINI_QUIZ_V2_ACTIVITIES.map(({ id }) => [id, id]),
  );
  assert.equal(new Set(UNIT_1_MINI_QUIZ_V2_ACTIVITIES.map(({ id }) => id)).size, 6);
  assert.equal(new Set(UNIT_1_MINI_QUIZ_V2_ACTIVITIES.map(({ slug }) => slug)).size, 6);
  assert.equal(UNIT_1_MINI_QUIZ_V2_ACTIVITIES.every(({ supportsRetake }) => supportsRetake === false), true);
});

test("las seis rutas bilingües preservan cuatro slugs y agregan dos sin /es/", () => {
  assert.deepEqual(UNIT_1_MINI_QUIZ_V2_ACTIVITIES.map(({ slug }) => slug), [
    "herramientas-vectores", "cinematica", "modelos-proyectiles",
    "movimiento-2d-circular-relativo", "repaso-unidad-1", "coordenadas-polares",
  ]);
  for (const activity of UNIT_1_MINI_QUIZ_V2_ACTIVITIES) {
    const es = getLocalizedPath(activity.routeId, "es");
    const en = getLocalizedPath(activity.routeId, "en");
    assert.equal(es, `/fisica-basica-1/mini-quices/${activity.slug}`);
    assert.equal(en, `/en/basic-physics-1/mini-quizzes/${activity.slug}`);
    assert.equal(getRouteCounterpart(es, "en"), en);
    assert.equal(es.startsWith("/es/"), false);
  }
});

test("la generación pública selecciona las 41 anclas por el selector V2 en ES y EN", async () => {
  const group = MINI_QUIZZES_BY_UNIT[0];
  assert.equal(group.generation, "v2");
  assert.equal(group.familyAdapterId, "v2-u1");
  assert.equal(group.supportsRetake, false);
  const reached = new Set();
  for (const locale of ["es", "en"]) {
    for (const activity of UNIT_1_MINI_QUIZ_V2_ACTIVITIES) {
      const sourceSelection = selectMiniQuizV2Questions(activity, bank, deterministicCrypto(), { locale });
      const page = createMiniQuizPageData({ unitNumber: 1, sourceMiniQuiz: activity, locale });
      const adapter = await import("../src/data/mini-quizzes/runtime/v2-u1.js");
      const selected = adapter.selectMiniQuizQuestions({
        miniQuiz: page.miniQuiz,
        pool: page.exercises,
        cryptoApi: deterministicCrypto(),
        locale,
        seenItemIds: new Set(),
        recentParameterKeys: new Set(),
      });
      assert.deepEqual(selected.map(({ exercise }) => exercise.id), sourceSelection.map(({ exercise }) => exercise.id));
      assert.deepEqual(selected.map(({ slotId }) => slotId), activity.blueprint.map(({ id }) => id));
      assert.equal(selected.every(({ exercise }) => exercise.modality === "miniQuiz" && exercise.practiceEligible === false), true);
      if (locale === "es") selected.forEach(({ exercise }) => reached.add(exercise.id));
    }
  }
  assert.equal(reached.size, 41);
});

test("la migración no reutiliza Practice y conserva el origen V1 en fuente", () => {
  const practiceIds = new Set([...UNIT_1_EXERCISES, ...UNIT_1_EXERCISE_FAMILIES].map(({ id }) => id));
  assert.equal(bank.items.some(({ id }) => practiceIds.has(id)), false);
  assert.deepEqual(UNIT_1_BONUSES.map(({ slug }) => slug), [
    "herramientas-vectores", "cinematica", "movimiento-2d-circular-relativo", "repaso-unidad-1",
  ]);
  assert.equal(UNIT_1_BONUSES.every(({ modality }) => modality === "bonus"), true);
});

test("exactamente nueve slots graphical/visual resuelven figuras bilingües estables", () => {
  const required = ["c1-5", "c1-6", "c1-7", "mp-1", "r-4", "mc-4", "r-6", "cp-1", "cp-4"];
  assert.deepEqual(bank.items.filter(({ representation }) => representation === "graphical").map(({ assessmentSlot }) => assessmentSlot), ["c1-5", "c1-6", "c1-7", "mp-1", "r-4"]);
  assert.deepEqual(bank.items.filter(({ representation }) => representation === "visual").map(({ assessmentSlot }) => assessmentSlot), ["mc-4", "r-6", "cp-1", "cp-4"]);
  assert.deepEqual(Object.keys(UNIT_1_MINI_QUIZ_V2_VISUAL_BY_SLOT).sort(), [...required].sort());
  assert.equal(new Set(Object.values(UNIT_1_MINI_QUIZ_V2_VISUAL_BY_SLOT)).size, 9);

  for (const locale of ["es", "en"]) {
    const registry = getUnit1MiniQuizV2Visualizations(locale);
    assert.equal(Object.keys(registry).length, 9);
    for (const slot of required) {
      const id = UNIT_1_MINI_QUIZ_V2_VISUAL_BY_SLOT[slot];
      const visual = registry[id];
      assert.ok(visual, `${locale}:${slot}`);
      assert.equal(visual.id, id);
      assert.equal(typeof visual.props.title, "string");
      assert.equal(typeof visual.props.description, "string");
      assert.equal(typeof visual.explanation, "string");
      if (visual.kind === "diagram") {
        for (const metrics of Object.values(DIAGRAM_LABEL_METRICS)) {
          assert.doesNotThrow(() => prepareDiagram({ props: { ...visual.props, family: visual.family }, fontSize: metrics.fontSize }));
        }
      }
    }
  }

  assert.equal(bank.items.filter(({ assessmentSlot }) => !required.includes(assessmentSlot))
    .every(({ assessmentSlot }) => UNIT_1_MINI_QUIZ_V2_VISUAL_BY_SLOT[assessmentSlot] === undefined), true);
  assert.equal(required.every((slot) => !/(figura|figure|gráfica mostrada|graph shown)/i.test(bySlot[slot].prompt.es + bySlot[slot].prompt.en)), true);
});

test("las figuras protegen los datos exactos y no adelantan las respuestas", () => {
  for (const locale of ["es", "en"]) {
    const registry = getUnit1MiniQuizV2Visualizations(locale);
    const visual = (slot) => registry[UNIT_1_MINI_QUIZ_V2_VISUAL_BY_SLOT[slot]];
    assert.deepEqual(visual("c1-7").props.series[0].points, [{ x: 0, y: 6 }, { x: 4, y: -2 }]);
    assert.deepEqual(visual("mp-1").props.series[0].points, [{ x: 0, y: 2 }, { x: 4, y: 2 }, { x: 8, y: 6 }]);
    assert.deepEqual(visual("r-4").props.series[0].points, [{ x: 0, y: 4 }, { x: 4, y: -4 }]);
    assert.doesNotMatch(visibleLabels(visual("c1-5")), /v\s*=\s*[−-]3/i);
    assert.doesNotMatch(visibleLabels(visual("c1-6")), /speed increasing|rapidez aumenta|v\s*<\s*0|a\s*<\s*0/i);
    assert.doesNotMatch(visibleLabels(visual("c1-7")), /increases then decreases|aumenta y luego disminuye|a\s*=\s*[−-]2/i);
    assert.doesNotMatch(visibleLabels(visual("mp-1")), /valid|válid/i);
    assert.doesNotMatch(visibleLabels(visual("r-4")), /distance|distancia|displacement|desplazamiento|[+−-]4/i);
    for (const slot of ["mc-4", "r-6"]) {
      assert.equal(visual(slot).props.vectors.length, 1);
      assert.equal(visual(slot).props.vectors[0].label, "v");
      assert.doesNotMatch(visibleLabels(visual(slot)), /acceleration|aceleración|a_r|a_t/i);
    }
    assert.doesNotMatch(JSON.stringify(visual("cp-1")), /dr̂\/dt|d r̂\/dt|derivative points|derivada apunta/i);
    assert.doesNotMatch(visibleLabels(visual("cp-4")), /[−-]3\s*î?\s*\+\s*2\s*ĵ?|resultant velocity|velocidad resultante/i);
  }
});

test("las cinco gráficas cartesianas mantienen todos sus puntos dentro del dominio", () => {
  for (const locale of ["es", "en"]) {
    const charts = Object.values(getUnit1MiniQuizV2Visualizations(locale))
      .filter(({ kind }) => kind === "cartesian");
    assert.equal(charts.length, 5);

    for (const chart of charts) {
      const [xStart, xEnd] = chart.props.xAxis.domain;
      const [yStart, yEnd] = chart.props.yAxis.domain;
      const xMin = Math.min(xStart, xEnd);
      const xMax = Math.max(xStart, xEnd);
      const yMin = Math.min(yStart, yEnd);
      const yMax = Math.max(yStart, yEnd);

      for (const series of chart.props.series) {
        assert.ok(series.points.length > 0, `${locale}:${chart.id}:${series.id}`);
        for (const point of series.points) {
          assert.ok(
            point.x >= xMin && point.x <= xMax,
            `${locale}:${chart.id}:${series.id}: x=${point.x} fuera de [${xMin}, ${xMax}]`,
          );
          assert.ok(
            point.y >= yMin && point.y <= yMax,
            `${locale}:${chart.id}:${series.id}: y=${point.y} fuera de [${yMin}, ${yMax}]`,
          );
        }
      }
    }
  }
});

test("la presentación V2 convierte el inventario explícito a MathML sin mutar las fuentes", () => {
  const sourceBefore = JSON.stringify(bank.items);
  const corpus = bank.items.flatMap(allPresentationStrings).join("\n");
  assert.equal(UNIT_1_MINI_QUIZ_V2_MATH_OVERRIDE_LITERALS.every((literal) => corpus.includes(literal)), true);
  for (const literal of UNIT_1_MINI_QUIZ_V2_MATH_OVERRIDE_LITERALS) {
    const es = presentUnit1MiniQuizV2RichText(literal, "es");
    const en = presentUnit1MiniQuizV2RichText(literal, "en");
    assert.equal(Array.isArray(es) && es.some(({ type }) => type === "math"), true, literal);
    assert.equal(Array.isArray(en) && en.some(({ type }) => type === "math"), true, literal);
    const esMath = es.find(({ type }) => type === "math").mathml.replace(/aria-label="[^"]*"/, "");
    const enMath = en.find(({ type }) => type === "math").mathml.replace(/aria-label="[^"]*"/, "");
    assert.equal(esMath, enMath, literal);
  }
  assert.equal(JSON.stringify(bank.items), sourceBefore);
});

test("las 82 presentaciones localizadas conservan grading y exponen rich text estático", () => {
  for (const locale of ["es", "en"]) {
    const allPages = UNIT_1_MINI_QUIZ_V2_ACTIVITIES.map((activity) =>
      createMiniQuizPageData({ unitNumber: 1, sourceMiniQuiz: activity, locale }));
    const page = allPages[0];
    assert.equal(page.exercises.length, 41);
    assert.equal(page.runtime.capabilities.retake, false);
    for (const exercise of page.exercises) {
      const source = bank.items.find(({ id }) => id === exercise.id);
      assert.equal(exercise.interaction.correctOptionId, source.interaction.correctOptionId);
      assert.deepEqual(exercise.interaction.options.map(({ id }) => id), source.interaction.options.map(({ id }) => id));
      assert.ok(exercise.presentation.prompt);
      assert.equal(Object.keys(exercise.presentation.options).length, 4);
      assert.equal(exercise.presentation.solution.length, exercise.solution.length);
    }
    if (locale === "en") {
      const labels = [];
      const collectMathLabels = (value) => {
        if (Array.isArray(value)) value.forEach(collectMathLabels);
        else if (value && typeof value === "object") {
          if (value.type === "math") labels.push(value.label);
          Object.values(value).forEach(collectMathLabels);
        }
      };
      collectMathLabels(page.exercises.map(({ presentation }) => presentation));
      assert.ok(labels.length > 0);
      assert.doesNotMatch(
        labels.join("\n"),
        /metros|cuadrado|cubo|derivada|posición|velocidad|producto|eje|menos|punto|unitario|respecto|de cero|de t/i,
      );
    }
  }
});

test("la presentación V2 localiza los nombres MathML heredados sin cambiar su geometría", () => {
  const es = presentUnit1MiniQuizV2RichText("v_y, m/s y dx/dt", "es");
  const en = presentUnit1MiniQuizV2RichText("v_y, m/s and dx/dt", "en");
  const math = (segments) => segments.filter(({ type }) => type === "math");

  assert.deepEqual(math(es).map(({ label }) => label), [
    "v sub y",
    "metros por segundo",
    "derivada de x respecto a t",
  ]);
  assert.deepEqual(math(en).map(({ label }) => label), [
    "v sub y",
    "metres per second",
    "derivative of x with respect to t",
  ]);
  assert.deepEqual(
    math(es).map(({ mathml }) => mathml.replace(/aria-label="[^"]*"/, "")),
    math(en).map(({ mathml }) => mathml.replace(/aria-label="[^"]*"/, "")),
  );
});

test("el runtime suprime el reintento V2 por capacidad y conserva la ruta V1", () => {
  const attemptSource = fs.readFileSync(new URL("../src/components/bonus/BonusAttempt.astro", import.meta.url), "utf8");
  const clientSource = fs.readFileSync(new URL("../src/scripts/bonus.js", import.meta.url), "utf8");
  assert.match(attemptSource, /runtime\.capabilities\?\.retake/);
  assert.match(clientSource, /familyAdapter\.selectMiniQuizQuestions/);
  assert.match(clientSource, /selectBonusQuestions/);
  assert.equal((clientSource.match(/trackMiniQuizStart\(/g) ?? []).length, 1);
});

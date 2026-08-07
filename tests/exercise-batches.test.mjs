import assert from "node:assert/strict";
import test from "node:test";

import {
  filterExercises,
  selectExerciseBatch,
} from "../src/utils/exercise-batches.js";

const exercises = [
  { id: "a", topic: "uno", difficulty: 1, type: "conceptual", representation: "verbal" },
  { id: "b", topic: "uno", difficulty: 1, type: "conceptual", representation: "verbal" },
  { id: "c", topic: "dos", difficulty: 2, type: "graphical", representation: "graphical" },
  { id: "d", topic: "tres", difficulty: 3, type: "numerical", representation: "numerical" },
  { id: "e", topic: "cuatro", difficulty: 4, type: "application", representation: "visual" },
  { id: "f", topic: "cinco", difficulty: 2, type: "symbolic", representation: "symbolic" },
];

test("aplica simultáneamente tema, dificultad y tipo", () => {
  assert.deepEqual(
    filterExercises(exercises, { topic: "uno", difficulty: "1", type: "conceptual" })
      .map((item) => item.id),
    ["a", "b"]
  );
});

test("devuelve los disponibles sin duplicar cuando hay menos de cinco", () => {
  const batch = selectExerciseBatch({
    exercises,
    filters: { topic: "uno" },
    size: 5,
  });

  assert.deepEqual(batch.map((item) => item.id), ["a", "b"]);
});

test("prioriza variedad y ejercicios no vistos", () => {
  const batch = selectExerciseBatch({
    exercises,
    seenIds: new Set(["a", "c"]),
    size: 5,
  });

  assert.equal(batch.length, 5);
  assert.equal(new Set(batch.map((item) => item.id)).size, 5);
  assert.ok(batch.slice(0, 4).every((item) => !["a", "c"].includes(item.id)));
  assert.ok(new Set(batch.map((item) => item.topic)).size >= 4);
});

test("incluye un ID enlazado cuando cumple los filtros", () => {
  const batch = selectExerciseBatch({
    exercises,
    includeId: "c",
    size: 3,
  });

  assert.equal(batch[0].id, "c");
});

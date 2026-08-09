// Mejora progresiva mínima: selecciona tandas, filtra y navega. El Set de IDs
// vistos vive solo mientras esta página permanece abierta y nunca se persiste.
import { selectExerciseBatch } from "../utils/exercise-batches.js";
import { UNIT_1_EXERCISE_FAMILIES } from "../data/physics/unit-1/families.js";
import {
  createCryptoRandom,
  generateFamilyInstance,
} from "../utils/exercise-families.js";

const TYPE_LABELS = {
  conceptual: "Conceptual",
  numerical: "Numérico",
  graphical: "Gráfico",
  symbolic: "Simbólico",
  estimation: "Estimación",
  application: "Aplicación",
  integrative: "Integrador",
};

const element = (tag, text, className) => {
  const target = document.createElement(tag);
  if (text !== undefined) target.textContent = text;
  if (className) target.className = className;
  return target;
};

const renderGeneratedCard = (target, exercise) => {
  const card = element("article", undefined, "exercise-card");
  const titleId = `${exercise.instanceId}-practice-title`;
  card.setAttribute("aria-labelledby", titleId);
  const header = element("header", undefined, "exercise-card__header");
  const heading = element("div");
  heading.append(element("p", "Ejercicio para explorar", "academic-label"));
  const title = element("h3", exercise.title);
  title.id = titleId;
  title.tabIndex = -1;
  heading.append(title);
  const metadata = element("dl", undefined, "exercise-card__meta");
  [
    ["Tipo", TYPE_LABELS[exercise.type] ?? exercise.type],
    ["Dificultad", `${exercise.difficulty}/5`],
    ["Tiempo", `${exercise.estimatedMinutes} min`],
  ].forEach(([label, value]) => {
    const group = element("div");
    group.append(element("dt", label), element("dd", value));
    metadata.append(group);
  });
  header.append(heading, metadata);
  card.append(header, element("p", exercise.prompt, "exercise-card__prompt"));

  if (exercise.hints.length > 0) {
    const hints = element("details", undefined, "exercise-card__hint");
    hints.append(element("summary", "Solicitar una pista"));
    const list = element("ul", undefined, "academic-bullet-list");
    exercise.hints.forEach((hint) => list.append(element("li", hint)));
    hints.append(list);
    card.append(hints);
  }

  const solution = element("details", undefined, "exercise-card__solution");
  solution.append(element("summary", "Revisar solución"));
  const steps = element("ol");
  exercise.solution.forEach((step) => {
    const item = element("li");
    item.append(element("strong", step.title), element("p", step.text));
    steps.append(item);
  });
  solution.append(steps);
  card.append(solution);
  target.replaceChildren(card);
};

const createBatchButton = (index, select) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = String(index + 1);
  button.setAttribute("aria-label", `Ir al ejercicio ${index + 1} de esta tanda`);
  button.addEventListener("click", () => select(index, { updateHash: true, focus: true }));
  return button;
};

export const initializeOpenPractice = () => {
  document.querySelectorAll("[data-open-practice]").forEach((practice) => {
    if (!(practice instanceof HTMLElement) || practice.dataset.enhanced === "true") return;

    const slides = [...practice.querySelectorAll("[data-exercise-slide]")]
      .filter((slide) => slide instanceof HTMLElement);
    const previous = practice.querySelector("[data-practice-previous]");
    const next = practice.querySelector("[data-practice-next]");
    const newBatch = practice.querySelector("[data-practice-new-batch]");
    const status = practice.querySelector("[data-practice-status]");
    const batchNav = practice.querySelector("[data-batch-nav]");
    const filterElements = [...practice.querySelectorAll("[data-practice-filter]")]
      .filter((element) => element instanceof HTMLSelectElement);

    if (
      slides.length === 0 ||
      !(previous instanceof HTMLButtonElement) ||
      !(next instanceof HTMLButtonElement) ||
      !(newBatch instanceof HTMLButtonElement) ||
      !(batchNav instanceof HTMLElement)
    ) return;

    const exercises = slides.map((slide) => ({
      id: slide.dataset.exerciseId,
      itemKind: slide.dataset.exerciseKind ?? "fixed",
      topic: slide.dataset.exerciseTopic,
      type: slide.dataset.exerciseType,
      difficulty: Number(slide.dataset.exerciseDifficulty),
      representation: slide.dataset.exerciseRepresentation,
      slide,
    }));
    const seenIds = new Set();
    const recentParameterKeys = new Set();
    const familyMap = new Map(UNIT_1_EXERCISE_FAMILIES.map((family) => [family.id, family]));
    const random = createCryptoRandom();
    let batch = [];
    let activeIndex = 0;
    let rotation = 0;

    const materialize = (exercise) => {
      if (exercise.itemKind !== "parameterizedFamily") return;
      if (exercise.generatedForRotation === rotation) return;
      const family = familyMap.get(exercise.id);
      const target = exercise.slide.querySelector("[data-generated-practice-card]");
      if (!family || !(target instanceof HTMLElement)) return;
      const instance = generateFamilyInstance(family, { random, recentParameterKeys });
      recentParameterKeys.add(`${family.id}:${instance.parameterKey}`);
      renderGeneratedCard(target, instance);
      exercise.generatedForRotation = rotation;
    };

    const getFilters = () => Object.fromEntries(
      filterElements.map((element) => [element.dataset.practiceFilter, element.value])
    );

    const show = (requestedIndex, { updateHash = false, focus = false } = {}) => {
      if (batch.length === 0) return;
      activeIndex = Math.min(batch.length - 1, Math.max(0, requestedIndex));
      const current = batch[activeIndex];
      materialize(current);

      slides.forEach((slide) => {
        slide.hidden = slide !== current.slide;
      });
      [...batchNav.querySelectorAll("button")].forEach((button, index) => {
        button.setAttribute("aria-current", index === activeIndex ? "step" : "false");
      });
      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex === batch.length - 1;

      if (status) {
        status.textContent = `Ejercicio ${activeIndex + 1} de esta tanda`;
      }
      if (updateHash && current.id) {
        history.pushState({ exerciseId: current.id }, "", `#${current.id}`);
      }
      if (focus) {
        current.slide.querySelector("h3")?.focus({ preventScroll: true });
        practice.scrollIntoView({ block: "start" });
      }
    };

    const renderBatch = (
      includeId = null,
      { updateHash = false, focus = false } = {}
    ) => {
      batch = selectExerciseBatch({
        exercises,
        filters: getFilters(),
        seenIds,
        size: 5,
        rotation,
        includeId,
      });
      rotation += 1;
      batch.forEach((exercise) => seenIds.add(exercise.id));
      slides.forEach((slide) => {
        slide.hidden = true;
        slide.dataset.inBatch = "false";
      });
      batch.forEach((exercise) => {
        exercise.slide.dataset.inBatch = "true";
      });
      batchNav.replaceChildren();
      batch.forEach((_, index) => batchNav.append(createBatchButton(index, show)));

      if (batch.length === 0) {
        if (status) status.textContent = "No hay ejercicios para esta combinación de filtros.";
        previous.disabled = true;
        next.disabled = true;
        return;
      }

      const includedIndex = includeId
        ? batch.findIndex((exercise) => exercise.id === includeId)
        : 0;
      show(Math.max(0, includedIndex), { updateHash, focus });
    };

    previous.addEventListener("click", () => show(activeIndex - 1, { updateHash: true, focus: true }));
    next.addEventListener("click", () => show(activeIndex + 1, { updateHash: true, focus: true }));
    newBatch.addEventListener("click", () =>
      renderBatch(null, { updateHash: true, focus: true })
    );
    filterElements.forEach((element) => element.addEventListener("change", () =>
      renderBatch(null, { updateHash: true })
    ));
    practice.querySelectorAll("[data-focus-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.getAttribute("data-focus-filter");
        practice.querySelector(`[data-practice-filter="${name}"]`)?.focus();
      });
    });
    practice.addEventListener("keydown", (event) => {
      if (!event.altKey || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      show(activeIndex + (event.key === "ArrowRight" ? 1 : -1), {
        updateHash: true,
        focus: true,
      });
    });
    window.addEventListener("popstate", () => {
      const exerciseId = window.location.hash.slice(1);
      const index = batch.findIndex((exercise) => exercise.id === exerciseId);
      if (index >= 0) show(index);
      else if (exercises.some((exercise) => exercise.id === exerciseId)) {
        filterElements.forEach((element) => { element.value = "all"; });
        renderBatch(exerciseId);
      }
    });

    practice.dataset.enhanced = "true";
    const initialId = window.location.hash.slice(1);
    renderBatch(exercises.some((exercise) => exercise.id === initialId) ? initialId : null);
  });
};

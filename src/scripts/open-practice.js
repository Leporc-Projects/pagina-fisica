// Mejora progresiva mínima: selecciona tandas, filtra y navega. El Set de IDs
// vistos vive solo mientras esta página permanece abierta y nunca se persiste.
import { selectExerciseBatch } from "../utils/exercise-batches.js";

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
      topic: slide.dataset.exerciseTopic,
      type: slide.dataset.exerciseType,
      difficulty: Number(slide.dataset.exerciseDifficulty),
      representation: slide.dataset.exerciseRepresentation,
      slide,
    }));
    const seenIds = new Set();
    let batch = [];
    let activeIndex = 0;
    let rotation = 0;

    const getFilters = () => Object.fromEntries(
      filterElements.map((element) => [element.dataset.practiceFilter, element.value])
    );

    const show = (requestedIndex, { updateHash = false, focus = false } = {}) => {
      if (batch.length === 0) return;
      activeIndex = Math.min(batch.length - 1, Math.max(0, requestedIndex));
      const current = batch[activeIndex];

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

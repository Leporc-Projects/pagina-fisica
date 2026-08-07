// Mejora progresiva local: no evalúa respuestas, no persiste estado y solo
// sincroniza ejercicio visible, controles y hash de la URL.
export const initializeExerciseSequences = () => {
  document.querySelectorAll("[data-exercise-sequence]").forEach((sequence) => {
    if (!(sequence instanceof HTMLElement) || sequence.dataset.enhanced === "true") {
      return;
    }

    const slides = [...sequence.querySelectorAll("[data-exercise-slide]")]
      .filter((slide) => slide instanceof HTMLElement);
    const previous = sequence.querySelector("[data-exercise-previous]");
    const next = sequence.querySelector("[data-exercise-next]");
    const status = sequence.querySelector("[data-exercise-status]");
    const progress = sequence.querySelector("[data-exercise-progress]");
    const picker = sequence.querySelector("[data-exercise-picker]");

    if (
      slides.length === 0 ||
      !(previous instanceof HTMLButtonElement) ||
      !(next instanceof HTMLButtonElement) ||
      !(progress instanceof HTMLProgressElement) ||
      !(picker instanceof HTMLSelectElement)
    ) return;

    let activeIndex = Math.max(
      0,
      slides.findIndex((slide) => `#${slide.id || slide.dataset.exerciseId}` === window.location.hash)
    );

    const show = (requestedIndex, { updateHash = false, focus = false } = {}) => {
      activeIndex = Math.min(slides.length - 1, Math.max(0, requestedIndex));

      slides.forEach((slide, index) => {
        slide.hidden = index !== activeIndex;
      });

      const current = slides[activeIndex];
      const exerciseId = current.dataset.exerciseId;
      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex === slides.length - 1;
      progress.value = activeIndex + 1;
      progress.textContent = `${activeIndex + 1} de ${slides.length}`;
      picker.value = exerciseId ?? "";

      if (status) {
        status.textContent = `Ejercicio ${activeIndex + 1} de ${slides.length}`;
      }

      if (updateHash && exerciseId) {
        history.pushState({ exerciseId }, "", `#${exerciseId}`);
      }

      if (focus) {
        current.querySelector("h3")?.focus({ preventScroll: true });
        sequence.scrollIntoView({ block: "start" });
      }
    };

    const indexFromHash = () => slides.findIndex(
      (slide) => `#${slide.dataset.exerciseId}` === window.location.hash
    );

    previous.addEventListener("click", () => {
      show(activeIndex - 1, { updateHash: true, focus: true });
    });

    next.addEventListener("click", () => {
      show(activeIndex + 1, { updateHash: true, focus: true });
    });

    picker.addEventListener("change", () => {
      const index = slides.findIndex(
        (slide) => slide.dataset.exerciseId === picker.value
      );
      if (index >= 0) show(index, { updateHash: true, focus: true });
    });

    sequence.addEventListener("keydown", (event) => {
      if (!event.altKey || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      show(activeIndex + (event.key === "ArrowRight" ? 1 : -1), {
        updateHash: true,
        focus: true,
      });
    });

    window.addEventListener("popstate", () => {
      const index = indexFromHash();
      if (index >= 0) show(index);
    });

    sequence.dataset.enhanced = "true";
    show(activeIndex);
  });
};

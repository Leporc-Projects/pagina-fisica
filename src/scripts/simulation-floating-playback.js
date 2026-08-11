import { t } from "../i18n/index.js";

// The capsule never owns physical state. It only projects the canonical
// runtime state while the full playback section is outside the viewport.
export const shouldShowFloatingPlayback = (playbackVisible, simulationVisible) =>
  playbackVisible === false && simulationVisible === true;

export const initializeSimulationFloatingPlayback = ({
  root,
  playbackSection,
  locale,
  onToggle,
  onReset,
}) => {
  if (!(root instanceof HTMLElement) ||
      !(playbackSection instanceof HTMLElement) ||
      root.dataset.preview === "true") return null;

  const capsule = root.querySelector("[data-floating-playback]");
  const toggleButton = root.querySelector("[data-floating-toggle]");
  const resetButton = root.querySelector("[data-floating-reset]");
  const icon = root.querySelector("[data-floating-icon]");
  const label = root.querySelector("[data-floating-label]");
  const timeOutput = root.querySelector("[data-floating-time]");
  if (!(capsule instanceof HTMLElement) ||
      !(toggleButton instanceof HTMLButtonElement) ||
      !(resetButton instanceof HTMLButtonElement) ||
      !icon || !label || !timeOutput) return null;

  const abortController = new AbortController();
  const listenerOptions = { signal: abortController.signal };
  let playbackVisible = true;
  let simulationVisible = true;

  const updateVisibility = () => {
    capsule.hidden = !shouldShowFloatingPlayback(playbackVisible, simulationVisible);
  };

  // Observing the simulation root too keeps the capsule from following readers
  // beyond the simulation itself, even if its canonical controls remain above them.
  const observer = typeof IntersectionObserver === "undefined"
    ? null
    : new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === playbackSection) playbackVisible = entry.isIntersecting;
        if (entry.target === root) simulationVisible = entry.intersectionRatio >= 0.1;
      });
      updateVisibility();
    }, { threshold: [0.01, 0.1] });

  observer?.observe(playbackSection);
  observer?.observe(root);
  toggleButton.addEventListener("click", onToggle, listenerOptions);
  resetButton.addEventListener("click", onReset, listenerOptions);

  return {
    sync({ playing, timeText, disabled = false }) {
      const playingNow = playing === true;
      toggleButton.disabled = disabled;
      toggleButton.setAttribute("aria-pressed", String(playingNow));
      toggleButton.setAttribute(
        "aria-label",
        t(locale, playingNow ? "simulation.pauseSimulation" : "simulation.playSimulation")
      );
      icon.textContent = playingNow ? "❚❚" : "▶";
      label.textContent = playingNow ? t(locale, "simulation.pause") : t(locale, "simulation.play");
      timeOutput.textContent = timeText;
      timeOutput.setAttribute("aria-label", t(locale, "simulation.currentTime", { time: timeText }));
    },
    destroy() {
      observer?.disconnect();
      abortController.abort();
      capsule.hidden = true;
    },
  };
};

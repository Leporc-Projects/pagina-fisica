import { trackLanguageChange } from "../utils/analytics.js";

export const initializeLanguageAnalytics = () => {
  document.querySelectorAll("[data-language-change]").forEach((link) => {
    if (!(link instanceof HTMLAnchorElement) || link.dataset.analyticsReady === "true") return;
    link.dataset.analyticsReady = "true";
    link.addEventListener("click", () => {
      trackLanguageChange(
        link.dataset.fromLocale,
        link.dataset.toLocale,
        link.dataset.routeId
      );
    });
  });
};

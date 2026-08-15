import {
  createParticipationResponse,
  participationFilename,
  participationSummary,
  toParticipationCSV,
  toParticipationJSON,
  toParticipationText,
} from "../utils/participation.js";
import { getLocaleConfig } from "../i18n/config.js";
import { t } from "../i18n/index.js";
import { copyLocalText, downloadLocalFile } from "./local-export.js";

const app = document.querySelector("[data-participation-app]");

if (app instanceof HTMLElement) {
  const locale = app.dataset.locale === "en" ? "en" : "es";
  const intlLocale = getLocaleConfig(locale).intlLocale;
  const chooser = app.querySelector("[data-activity-chooser]");
  const choices = [...app.querySelectorAll("[data-activity-choice]")];
  const panels = [...app.querySelectorAll("[data-activity-panel]")];
  const preview = app.querySelector("[data-response-preview]");
  const status = app.querySelector("[data-participation-status]");
  let currentResponse = null;
  let currentForm = null;

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  const selectedActivity = () =>
    choices.find((choice) => choice instanceof HTMLInputElement && choice.checked)?.value;

  const showSelectedPanel = () => {
    const activityType = selectedActivity();

    panels.forEach((panel) => {
      if (!(panel instanceof HTMLElement)) return;
      panel.hidden = panel.dataset.activityPanel !== activityType;
    });
  };

  const syncHelpfulSupportOther = (form) => {
    const field = form.querySelector("[data-helpful-support-other]");
    const input = form.elements.namedItem("helpfulSupportOther");
    const selected = form.querySelector('input[name="helpfulSupport"]:checked');
    const active = selected instanceof HTMLInputElement && selected.value === "other";
    if (field instanceof HTMLElement) field.hidden = !active;
    if (input instanceof HTMLTextAreaElement) {
      input.required = active;
      if (!active) input.value = "";
    }
  };

  const clearPreviewEntries = (target) => {
    if (!target) return;
    while (target.firstChild) target.firstChild.remove();
  };

  const renderEntries = (target, entries) => {
    if (!target) return;
    clearPreviewEntries(target);

    entries.forEach(([label, value]) => {
      const group = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      group.append(term, description);
      target.append(group);
    });
  };

  const setPreviewText = (selector, value) => {
    const target = app.querySelector(selector);
    if (target) target.textContent = value;
  };

  const renderPreview = (response) => {
    if (!(preview instanceof HTMLElement)) return;
    const summary = participationSummary(response, locale);
    const details = summary.details ?? [];
    const optional = summary.optional ?? [];
    const detailsTarget = preview.querySelector("[data-preview-details]");
    const optionalTarget = preview.querySelector("[data-preview-optional]");
    const noOptional = preview.querySelector("[data-preview-no-optional]");

    setPreviewText("[data-preview-type]", summary.type);
    setPreviewText("[data-preview-topic]", summary.topic);
    setPreviewText("[data-preview-response]", summary.response);
    setPreviewText("[data-preview-id]", response.responseId);
    setPreviewText(
      "[data-preview-date]",
      new Intl.DateTimeFormat(intlLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(response.createdAt))
    );

    renderEntries(detailsTarget, details);
    if (detailsTarget instanceof HTMLElement) detailsTarget.hidden = details.length === 0;
    renderEntries(optionalTarget, optional);
    if (noOptional instanceof HTMLElement) noOptional.hidden = optional.length > 0;

    if (chooser instanceof HTMLElement) chooser.hidden = true;
    panels.forEach((panel) => {
      if (panel instanceof HTMLElement) panel.hidden = true;
    });
    preview.hidden = false;

    const title = preview.querySelector("#response-preview-title");
    if (title instanceof HTMLElement) {
      title.focus({ preventScroll: true });
      title.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

  const stringValue = (formData, name) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };

  // El contexto académico (ámbito, curso, unidad, tema) vive en un único paso
  // compartido antes de las tres actividades, no dentro de cada formulario.
  const readSharedContext = () => {
    const context = app.querySelector("[data-participation-context]");
    if (!(context instanceof HTMLElement)) return { scope: { type: "global" } };

    const scopeInput = context.querySelector('[data-context-scope]:checked');
    if (!(scopeInput instanceof HTMLInputElement) || scopeInput.value !== "course") {
      return { scope: { type: "global" } };
    }

    const courseSelect = context.querySelector("[data-context-course]");
    const courseId = courseSelect instanceof HTMLSelectElement ? courseSelect.value : "";
    if (!courseId) return { scope: { type: "global" } };

    const unitTopicSelect = context.querySelector(
      `[data-context-unittopic][data-context-for-course="${courseId}"]`
    );
    const raw = unitTopicSelect instanceof HTMLSelectElement ? unitTopicSelect.value : "";

    if (raw.startsWith("topic:")) {
      const [, unitNumber, topicSlug] = raw.split(":");
      return { scope: { type: "course", courseId }, unitNumber: Number(unitNumber), topicSlug };
    }

    if (raw.startsWith("unit:")) {
      return { scope: { type: "course", courseId }, unitNumber: Number(raw.slice(5)) };
    }

    return { scope: { type: "course", courseId } };
  };

  const responseInputFromForm = (form) => {
    const formData = new FormData(form);
    const activityType = form.dataset.activityForm;
    const common = {
      activityType,
      ...readSharedContext(),
    };

    if (activityType === "concept-difficulty") {
      return {
        ...common,
        payload: {
          unclearPoint: stringValue(formData, "unclearPoint"),
          helpfulSupport: stringValue(formData, "helpfulSupport"),
          helpfulSupportOther: stringValue(formData, "helpfulSupportOther"),
        },
      };
    }

    if (activityType === "student-question-proposal") {
      return {
        ...common,
        payload: {
          proposalType: stringValue(formData, "proposalType"),
          statement: stringValue(formData, "statement"),
          intendedConcept: stringValue(formData, "intendedConcept"),
          expectedAnswer: stringValue(formData, "expectedAnswer"),
          answerExplanation: stringValue(formData, "answerExplanation"),
          studentDifficultyEstimate: stringValue(formData, "studentDifficultyEstimate"),
        },
      };
    }

    return {
      ...common,
      payload: {
        area: stringValue(formData, "area"),
        improvement: stringValue(formData, "improvement"),
        helpfulness: stringValue(formData, "helpfulness"),
      },
    };
  };

  choices.forEach((choice) => {
    choice.addEventListener("change", () => {
      currentResponse = null;
      currentForm = null;
      if (preview instanceof HTMLElement) preview.hidden = true;
      if (chooser instanceof HTMLElement) chooser.hidden = false;
      showSelectedPanel();
      announce(t(locale, "participation.status.selected"));
    });
  });

  app.querySelectorAll("[data-activity-form]").forEach((form) => {
    if (form instanceof HTMLFormElement && form.dataset.activityForm === "concept-difficulty") {
      form.querySelectorAll('input[name="helpfulSupport"]').forEach((option) => {
        option.addEventListener("change", () => syncHelpfulSupportOther(form));
      });
      syncHelpfulSupportOther(form);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!(form instanceof HTMLFormElement)) return;

      try {
        currentResponse = createParticipationResponse(responseInputFromForm(form), { locale });
        currentForm = form;
        renderPreview(currentResponse);
        announce(t(locale, "participation.status.prepared"));
      } catch (error) {
        announce(error instanceof Error ? error.message : t(locale, "participation.status.failed"));
      }
    });
  });

  app.querySelector("[data-edit-response]")?.addEventListener("click", () => {
    if (!(preview instanceof HTMLElement)) return;
    preview.hidden = true;
    if (chooser instanceof HTMLElement) chooser.hidden = false;
    showSelectedPanel();
    const firstControl = currentForm?.querySelector("select, textarea, input");
    if (firstControl instanceof HTMLElement) firstControl.focus();
    announce(t(locale, "participation.status.edit"));
  });

  const download = (contents, mimeType, extension) => {
    if (!currentResponse) return;
    downloadLocalFile({
      contents,
      mimeType,
      filename: participationFilename(currentResponse, extension),
    });
  };

  app.querySelectorAll("[data-export]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!currentResponse || !(button instanceof HTMLButtonElement)) return;

      try {
        const action = button.dataset.export;

        if (action === "copy") {
          await copyLocalText(toParticipationText(currentResponse, locale));
          announce(t(locale, "participation.status.copied"));
          return;
        }

        if (action === "txt") {
          download(toParticipationText(currentResponse, locale), "text/plain;charset=utf-8", "txt");
          announce(t(locale, "participation.status.download", { format: "TXT" }));
          return;
        }

        if (action === "json") {
          download(toParticipationJSON(currentResponse), "application/json;charset=utf-8", "json");
          announce(t(locale, "participation.status.download", { format: "JSON" }));
          return;
        }

        if (action === "csv") {
          download(toParticipationCSV(currentResponse), "text/csv;charset=utf-8", "csv");
          announce(t(locale, "participation.status.download", { format: "CSV" }));
          return;
        }

        if (action === "print") {
          announce(t(locale, "participation.status.print"));
          window.print();
        }
      } catch {
        announce(t(locale, "participation.status.actionFailed"));
      }
    });
  });
}

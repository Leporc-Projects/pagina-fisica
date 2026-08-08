import {
  createParticipationResponse,
  participationFilename,
  participationSummary,
  toParticipationCSV,
  toParticipationJSON,
  toParticipationText,
} from "../utils/participation.js";

const app = document.querySelector("[data-participation-app]");

if (app instanceof HTMLElement) {
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
    const summary = participationSummary(response);
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
      new Intl.DateTimeFormat(undefined, {
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

  const responseInputFromForm = (form) => {
    const formData = new FormData(form);
    const activityType = form.dataset.activityForm;
    const common = {
      activityType,
      topicSlug: stringValue(formData, "topicSlug"),
    };

    if (activityType === "concept-difficulty") {
      return {
        ...common,
        payload: {
          unclearPoint: stringValue(formData, "unclearPoint"),
          helpfulSupport: stringValue(formData, "helpfulSupport"),
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
      announce("Actividad seleccionada. La respuesta todavía no ha sido preparada.");
    });
  });

  app.querySelectorAll("[data-activity-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!(form instanceof HTMLFormElement)) return;

      try {
        currentResponse = createParticipationResponse(responseInputFromForm(form));
        currentForm = form;
        renderPreview(currentResponse);
        announce("Respuesta preparada localmente. No se ha enviado ni guardado.");
      } catch (error) {
        announce(error instanceof Error ? error.message : "No fue posible preparar la respuesta.");
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
    announce("Puedes editar los campos y preparar una nueva versión.");
  });

  const download = (contents, type, extension) => {
    if (!currentResponse) return;
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = participationFilename(currentResponse, extension);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  app.querySelectorAll("[data-export]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!currentResponse || !(button instanceof HTMLButtonElement)) return;

      try {
        const action = button.dataset.export;

        if (action === "copy") {
          await navigator.clipboard.writeText(toParticipationText(currentResponse));
          announce("Respuesta copiada al portapapeles.");
          return;
        }

        if (action === "txt") {
          download(toParticipationText(currentResponse), "text/plain;charset=utf-8", "txt");
          announce("Archivo TXT preparado para descargar.");
          return;
        }

        if (action === "json") {
          download(toParticipationJSON(currentResponse), "application/json;charset=utf-8", "json");
          announce("Archivo JSON preparado para descargar.");
          return;
        }

        if (action === "csv") {
          download(toParticipationCSV(currentResponse), "text/csv;charset=utf-8", "csv");
          announce("Archivo CSV preparado para descargar.");
          return;
        }

        if (action === "print") {
          announce("Se abrirá el diálogo del navegador para imprimir o guardar como PDF.");
          window.print();
        }
      } catch {
        announce("El navegador no pudo completar esta acción. Inténtalo de nuevo.");
      }
    });
  });
}

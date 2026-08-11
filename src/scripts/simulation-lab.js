import { getSimulationModelById } from "../data/simulation-models.js";
import {
  SIMULATION_EXPERIENCE_LIMITS,
  createSimulationExperienceDraft,
  createSimulationExperiencePack,
  simulationExperiencePackFilename,
  toSimulationExperiencePackJSON,
  validateSimulationExperience,
  validateSimulationExperiencePack,
} from "../utils/simulation-experience.js";
import {
  destroyKinematicsSimulation,
  initializeKinematicsSimulation,
} from "./kinematics-1d.js";
import { downloadLocalFile } from "./local-export.js";

const create = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};

const readInitialExperience = (root) => {
  try {
    return JSON.parse(root.dataset.initialExperience ?? "");
  } catch {
    return null;
  }
};

export const initializeSimulationLab = () => {
  const root = document.querySelector("[data-simulation-lab]");
  if (!(root instanceof HTMLElement) || root.dataset.initialized === "true") return;
  const form = root.querySelector("[data-simulation-lab-form]");
  const errorPanel = root.querySelector("[data-simulation-lab-errors]");
  const status = root.querySelector("[data-simulation-lab-status]");
  const exportButton = root.querySelector("[data-export-simulation]");
  const previewHeading = root.querySelector("[data-preview-title]");
  const previewSummary = root.querySelector("[data-preview-summary]");
  const previewGuide = root.querySelector("[data-preview-guide]");
  const previewObservations = root.querySelector("[data-preview-observations]");
  const simulationRoot = root.querySelector("[data-kinematics-simulation]");
  const initialExperience = readInitialExperience(root);
  if (
    !(form instanceof HTMLFormElement) ||
    !(errorPanel instanceof HTMLElement) ||
    !(exportButton instanceof HTMLButtonElement) ||
    !(simulationRoot instanceof HTMLElement) ||
    !initialExperience
  ) return;

  const model = getSimulationModelById("kinematics-1d");
  const parameterKeys = Object.keys(model.parameters);
  let presets = structuredClone(initialExperience.presets);
  let observations = [...initialExperience.observations];
  let currentId;
  let nextPresetNumber = presets.length + 1;

  root.querySelectorAll("input, textarea, select").forEach((control) => {
    control.dataset.baseDescribedBy = control.getAttribute("aria-describedby") ?? "";
  });

  const parameterConfigFromForm = () => Object.fromEntries(
    [...root.querySelectorAll("[data-lab-parameter]")].map((fieldset) => {
      const key = fieldset.dataset.labParameter;
      const value = (property) => fieldset.querySelector(
        `[data-parameter-property="${property}"]`
      )?.valueAsNumber;
      return [key, {
        default: value("default"),
        minimum: value("minimum"),
        maximum: value("maximum"),
        step: value("step"),
        editable: fieldset.querySelector("[data-parameter-editable]")?.checked === true,
      }];
    })
  );

  const readPresets = () => [...root.querySelectorAll("[data-lab-preset]")]
    .map((fieldset) => ({
      id: fieldset.dataset.presetId,
      label: String(fieldset.querySelector("[data-preset-label]")?.value ?? "").trim(),
      parameters: Object.fromEntries(parameterKeys.map((key) => [
        key,
        fieldset.querySelector(`[data-preset-parameter="${key}"]`)?.valueAsNumber,
      ])),
    }));

  const readObservations = () => [...root.querySelectorAll("[data-lab-observation]")]
    .map((entry) => String(entry.querySelector("textarea")?.value ?? "").trim());

  const collectFields = () => {
    presets = readPresets();
    observations = readObservations();
    const topics = [...form.querySelectorAll('input[name="context-topic"]:checked')]
      .map((input) => input.value);
    return {
      modelId: "kinematics-1d",
      title: String(form.elements.namedItem("title")?.value ?? "").trim(),
      summary: String(form.elements.namedItem("summary")?.value ?? "").trim(),
      parameters: parameterConfigFromForm(),
      views: {
        motion: form.elements.namedItem("view-motion")?.checked === true,
        readings: form.elements.namedItem("view-readings")?.checked === true,
        positionGraph: form.elements.namedItem("view-positionGraph")?.checked === true,
        velocityGraph: form.elements.namedItem("view-velocityGraph")?.checked === true,
        accelerationGraph: form.elements.namedItem("view-accelerationGraph")?.checked === true,
        turningPoint: form.elements.namedItem("view-turningPoint")?.checked === true,
      },
      presets,
      observations,
      contexts: topics.length === 0 ? [] : [{
        courseId: "fisica-basica-1",
        unit: 1,
        topics,
      }],
    };
  };

  const currentDraft = () => {
    const draft = createSimulationExperienceDraft(collectFields(), { id: currentId });
    currentId = draft.id;
    return draft;
  };

  const clearIssueAssociations = () => {
    root.querySelectorAll('[aria-invalid="true"]').forEach((control) => {
      control.removeAttribute("aria-invalid");
      const base = control.dataset.baseDescribedBy ?? "";
      if (base) control.setAttribute("aria-describedby", base);
      else control.removeAttribute("aria-describedby");
    });
  };

  const controlsForIssue = (entry) => {
    if (entry.path === "title" || entry.path === "summary") {
      return [form.elements.namedItem(entry.path)].filter(Boolean);
    }
    const parameterMatch = entry.path.match(/^parameters\.([^.]+)(?:\.([^.]+))?/);
    if (parameterMatch) {
      const fieldset = root.querySelector(`[data-lab-parameter="${parameterMatch[1]}"]`);
      const property = parameterMatch[2];
      return property
        ? [fieldset?.querySelector(`[data-parameter-property="${property}"]`)].filter(Boolean)
        : [...(fieldset?.querySelectorAll("input") ?? [])];
    }
    if (entry.path.startsWith("views")) {
      return [...root.querySelectorAll("[data-lab-views] input")];
    }
    const presetMatch = entry.path.match(/^presets\[(\d+)\](?:\.label|\.parameters\.([^.]+))?/);
    if (presetMatch) {
      const fieldset = root.querySelectorAll("[data-lab-preset]")[Number(presetMatch[1])];
      const parameter = presetMatch[2];
      return [parameter
        ? fieldset?.querySelector(`[data-preset-parameter="${parameter}"]`)
        : fieldset?.querySelector("[data-preset-label]")].filter(Boolean);
    }
    const observationMatch = entry.path.match(/^observations\[(\d+)\]/);
    if (observationMatch) {
      return [root.querySelectorAll("[data-lab-observation] textarea")[Number(observationMatch[1])]].filter(Boolean);
    }
    if (entry.path.startsWith("contexts")) {
      return [...form.querySelectorAll('input[name="context-topic"]')];
    }
    return [];
  };

  const renderErrors = (issues) => {
    clearIssueAssociations();
    errorPanel.replaceChildren();
    if (issues.length === 0) {
      errorPanel.hidden = true;
      return;
    }
    errorPanel.append(create("strong", "Revisa la configuración:"));
    const list = create("ul");
    issues.forEach((entry) => {
      list.append(create("li", entry.message));
      controlsForIssue(entry).forEach((control) => {
        control.setAttribute("aria-invalid", "true");
        const base = control.dataset.baseDescribedBy ?? "";
        control.setAttribute(
          "aria-describedby",
          [base, errorPanel.id].filter(Boolean).join(" ")
        );
      });
    });
    errorPanel.append(list);
    errorPanel.hidden = false;
  };

  const evaluate = ({ showErrors = false } = {}) => {
    try {
      const experience = currentDraft();
      const validation = validateSimulationExperience(experience);
      if (showErrors) renderErrors(validation.issues);
      exportButton.disabled = !validation.valid;
      return { ...validation, experience };
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible preparar la experiencia.";
      const issues = [{ path: "experience", code: "creation-error", message }];
      if (showErrors) renderErrors(issues);
      exportButton.disabled = true;
      return { valid: false, issues, errors: [message], experience: null };
    }
  };

  const renderPresets = () => {
    const container = root.querySelector("[data-lab-presets]");
    const addButton = root.querySelector("[data-add-lab-preset]");
    if (!(container instanceof HTMLElement)) return;
    container.replaceChildren(...presets.map((preset, index) => {
      const fieldset = create("fieldset", undefined, "simulation-lab__collection-item");
      fieldset.dataset.labPreset = "";
      fieldset.dataset.presetId = preset.id;
      fieldset.append(create("legend", `Caso ${index + 1}`));
      const remove = create("button", "Eliminar caso", "simulation-lab__remove");
      remove.type = "button";
      remove.dataset.removeLabPreset = String(index);
      fieldset.append(remove);

      const label = create("label");
      label.append(create("span", "Nombre"));
      const labelInput = create("input");
      labelInput.type = "text";
      labelInput.required = true;
      labelInput.maxLength = SIMULATION_EXPERIENCE_LIMITS.maximumPresetLabelLength;
      labelInput.value = preset.label;
      labelInput.dataset.presetLabel = "";
      label.append(labelInput);
      fieldset.append(label);

      const grid = create("div", undefined, "simulation-lab__preset-grid");
      parameterKeys.forEach((key) => {
        const definition = model.parameters[key];
        const parameter = parameterConfigFromForm()[key];
        const inputLabel = create("label");
        inputLabel.append(create("span", `${definition.symbol} (${definition.unit})`));
        const input = create("input");
        input.type = "number";
        input.inputMode = "decimal";
        input.required = true;
        input.min = String(definition.hardMinimum);
        input.max = String(definition.hardMaximum);
        input.step = "any";
        input.value = String(preset.parameters[key]);
        input.disabled = !parameter.editable;
        input.dataset.presetParameter = key;
        inputLabel.append(input);
        grid.append(inputLabel);
      });
      fieldset.append(grid);
      return fieldset;
    }));
    if (addButton instanceof HTMLButtonElement) {
      addButton.disabled = presets.length >= SIMULATION_EXPERIENCE_LIMITS.maximumPresets;
    }
  };

  const renderObservations = () => {
    const container = root.querySelector("[data-lab-observations]");
    const addButton = root.querySelector("[data-add-lab-observation]");
    if (!(container instanceof HTMLElement)) return;
    container.replaceChildren(...observations.map((observation, index) => {
      const entry = create("div", undefined, "simulation-lab__observation");
      entry.dataset.labObservation = "";
      const label = create("label");
      label.append(create("span", `Observación ${index + 1}`));
      const textarea = create("textarea");
      textarea.rows = 3;
      textarea.required = true;
      textarea.maxLength = SIMULATION_EXPERIENCE_LIMITS.maximumObservationLength;
      textarea.value = observation;
      label.append(textarea);
      const remove = create("button", "Eliminar observación", "simulation-lab__remove");
      remove.type = "button";
      remove.dataset.removeLabObservation = String(index);
      entry.append(label, remove);
      return entry;
    }));
    if (addButton instanceof HTMLButtonElement) {
      addButton.disabled = observations.length >= SIMULATION_EXPERIENCE_LIMITS.maximumObservations;
    }
  };

  const syncLockedParameter = (fieldset) => {
    const key = fieldset.dataset.labParameter;
    const editable = fieldset.querySelector("[data-parameter-editable]")?.checked === true;
    const defaultValue = fieldset.querySelector('[data-parameter-property="default"]')?.value;
    root.querySelectorAll(`[data-preset-parameter="${key}"]`).forEach((input) => {
      input.disabled = !editable;
      if (!editable) input.value = defaultValue;
    });
  };

  root.querySelector("[data-add-lab-preset]")?.addEventListener("click", () => {
    presets = readPresets();
    if (presets.length >= SIMULATION_EXPERIENCE_LIMITS.maximumPresets) return;
    const parameters = parameterConfigFromForm();
    presets.push({
      id: `case-study-${nextPresetNumber}`,
      label: `Caso ${nextPresetNumber}`,
      parameters: Object.fromEntries(parameterKeys.map((key) => [key, parameters[key].default])),
    });
    nextPresetNumber += 1;
    renderPresets();
    evaluate({ showErrors: !errorPanel.hidden });
    if (status) status.textContent = "Caso de estudio añadido a la sesión local.";
  });

  root.querySelector("[data-lab-presets]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-lab-preset]");
    if (!(button instanceof HTMLButtonElement)) return;
    presets = readPresets().filter((_, index) => index !== Number(button.dataset.removeLabPreset));
    renderPresets();
    evaluate({ showErrors: !errorPanel.hidden });
    if (status) status.textContent = "Caso de estudio eliminado de la sesión local.";
  });

  root.querySelector("[data-add-lab-observation]")?.addEventListener("click", () => {
    observations = readObservations();
    if (observations.length >= SIMULATION_EXPERIENCE_LIMITS.maximumObservations) return;
    observations.push("");
    renderObservations();
    evaluate({ showErrors: !errorPanel.hidden });
    root.querySelector("[data-lab-observation]:last-child textarea")?.focus();
    if (status) status.textContent = "Observación añadida a la sesión local.";
  });

  root.querySelector("[data-lab-observations]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-lab-observation]");
    if (!(button instanceof HTMLButtonElement)) return;
    observations = readObservations().filter((_, index) =>
      index !== Number(button.dataset.removeLabObservation)
    );
    renderObservations();
    evaluate({ showErrors: !errorPanel.hidden });
    if (status) status.textContent = "Observación eliminada de la sesión local.";
  });

  form.addEventListener("input", (event) => {
    const editable = event.target.closest("[data-parameter-editable]");
    if (editable) syncLockedParameter(editable.closest("[data-lab-parameter]"));
    evaluate({ showErrors: !errorPanel.hidden });
  });

  root.querySelector("[data-preview-simulation]")?.addEventListener("click", () => {
    const result = evaluate({ showErrors: true });
    if (!result.valid) {
      errorPanel.focus();
      if (status) status.textContent = "La configuración necesita ajustes antes de previsualizarse.";
      return;
    }
    const runtime = initializeKinematicsSimulation(simulationRoot);
    runtime?.updateExperience(result.experience);
    if (previewHeading) previewHeading.textContent = result.experience.title;
    if (previewSummary) previewSummary.textContent = result.experience.summary;
    if (previewObservations) {
      previewObservations.replaceChildren(...result.experience.observations.map((observation) =>
        create("li", observation)
      ));
    }
    if (previewGuide instanceof HTMLElement) {
      previewGuide.hidden = result.experience.observations.length === 0;
    }
    previewHeading?.focus({ preventScroll: true });
    if (status) status.textContent = "Previsualización actualizada con la configuración válida.";
  });

  exportButton.addEventListener("click", () => {
    const result = evaluate({ showErrors: true });
    if (!result.valid) {
      errorPanel.focus();
      return;
    }
    const pack = createSimulationExperiencePack([result.experience]);
    const validation = validateSimulationExperiencePack(pack);
    if (!validation.valid) {
      renderErrors(validation.issues);
      errorPanel.focus();
      return;
    }
    downloadLocalFile({
      contents: toSimulationExperiencePackJSON(pack),
      mimeType: "application/json;charset=utf-8",
      filename: simulationExperiencePackFilename(pack),
    });
    if (status) status.textContent = "Paquete descargado como borrador. No se publicó ni se envió.";
  });

  renderPresets();
  renderObservations();
  root.querySelectorAll("[data-lab-parameter]").forEach(syncLockedParameter);
  evaluate();
  root.dataset.initialized = "true";
  window.addEventListener("pagehide", () => destroyKinematicsSimulation(simulationRoot), { once: true });
};

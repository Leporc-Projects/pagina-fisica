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
import { createSimulationLabBaseConfiguration } from "../utils/simulation-authoring.js";
import {
  destroySimulationExperienceRenderer,
  mountSimulationExperienceRenderer,
} from "./simulation-renderer-runtime.js";
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

export const initializeSimulationLab = async () => {
  const root = document.querySelector("[data-simulation-lab]");
  if (!(root instanceof HTMLElement) || root.dataset.initialized === "true") return;
  const form = root.querySelector("[data-simulation-lab-form]");
  const modelSelect = form?.elements.namedItem("model");
  const errorPanel = root.querySelector("[data-simulation-lab-errors]");
  const status = root.querySelector("[data-simulation-lab-status]");
  const exportButton = root.querySelector("[data-export-simulation]");
  const previewHeading = root.querySelector("[data-preview-title]");
  const previewSummary = root.querySelector("[data-preview-summary]");
  const previewGuide = root.querySelector("[data-preview-guide]");
  const previewObservations = root.querySelector("[data-preview-observations]");
  const rendererRoot = root.querySelector("[data-simulation-experience-renderer]");
  const initialExperience = readInitialExperience(root);
  if (!(form instanceof HTMLFormElement) ||
      !(modelSelect instanceof HTMLSelectElement) ||
      !(errorPanel instanceof HTMLElement) ||
      !(exportButton instanceof HTMLButtonElement) ||
      !(rendererRoot instanceof HTMLElement) ||
      !initialExperience) return;

  let model = getSimulationModelById(initialExperience.modelId);
  let parameterKeys = Object.keys(model.parameters);
  let presets = structuredClone(initialExperience.presets);
  let observations = [...initialExperience.observations];
  let translations = structuredClone(initialExperience.translations);
  let currentId;
  let nextPresetNumber = presets.length + 1;

  const registerDescribedBy = (scope = root) => {
    scope.querySelectorAll("input, textarea, select").forEach((control) => {
      if (control.dataset.baseDescribedBy === undefined) {
        control.dataset.baseDescribedBy = control.getAttribute("aria-describedby") ?? "";
      }
    });
  };

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

  const readPresets = () => [...root.querySelectorAll("[data-lab-preset]")].map((fieldset) => ({
    id: fieldset.dataset.presetId,
    label: String(fieldset.querySelector("[data-preset-label]")?.value ?? "").trim(),
    parameters: Object.fromEntries(parameterKeys.map((key) => [
      key,
      fieldset.querySelector(`[data-preset-parameter="${key}"]`)?.valueAsNumber,
    ])),
  }));

  const readObservations = () => [...root.querySelectorAll("[data-lab-observation]")]
    .map((entry) => String(entry.querySelector("textarea[data-observation-es]")?.value ?? "").trim());

  const readEnglishPresetLabels = () => Object.fromEntries(
    [...root.querySelectorAll("[data-lab-preset]")].map((fieldset) => [
      fieldset.dataset.presetId,
      String(fieldset.querySelector("[data-preset-label-en]")?.value ?? "").trim(),
    ])
  );

  const readEnglishObservations = () => [...root.querySelectorAll("[data-lab-observation]")]
    .map((entry) => String(entry.querySelector("textarea[data-observation-en]")?.value ?? "").trim());

  const collectFields = () => {
    presets = readPresets();
    observations = readObservations();
    translations = {
      en: {
        title: String(form.elements.namedItem("title-en")?.value ?? "").trim(),
        summary: String(form.elements.namedItem("summary-en")?.value ?? "").trim(),
        presetLabels: readEnglishPresetLabels(),
        observations: readEnglishObservations(),
      },
    };
    const topics = [...form.querySelectorAll('input[name="context-topic"]:checked')]
      .map((input) => input.value);
    return {
      modelId: model.id,
      title: String(form.elements.namedItem("title")?.value ?? "").trim(),
      summary: String(form.elements.namedItem("summary")?.value ?? "").trim(),
      translations,
      parameters: parameterConfigFromForm(),
      views: Object.fromEntries(
        [...root.querySelectorAll("[data-lab-view]")].map((input) => [
          input.dataset.labView,
          input.checked === true,
        ])
      ),
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
      return parameterMatch[2]
        ? [fieldset?.querySelector(`[data-parameter-property="${parameterMatch[2]}"]`)].filter(Boolean)
        : [...(fieldset?.querySelectorAll("input") ?? [])];
    }
    if (entry.path.startsWith("views")) return [...root.querySelectorAll("[data-lab-view]")];
    const presetMatch = entry.path.match(/^presets\[(\d+)\](?:\.label|\.parameters\.([^.]+))?/);
    if (presetMatch) {
      const fieldset = root.querySelectorAll("[data-lab-preset]")[Number(presetMatch[1])];
      return [presetMatch[2]
        ? fieldset?.querySelector(`[data-preset-parameter="${presetMatch[2]}"]`)
        : fieldset?.querySelector("[data-preset-label]")].filter(Boolean);
    }
    const observationMatch = entry.path.match(/^observations\[(\d+)\]/);
    if (observationMatch) {
      return [root.querySelectorAll("[data-lab-observation] textarea")[Number(observationMatch[1])]].filter(Boolean);
    }
    if (entry.path.startsWith("contexts")) return [...form.querySelectorAll('input[name="context-topic"]')];
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
        control.setAttribute("aria-describedby", [base, errorPanel.id].filter(Boolean).join(" "));
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

  const renderParameters = (experience) => {
    const container = root.querySelector("[data-lab-parameters]");
    if (!(container instanceof HTMLElement)) return;
    container.replaceChildren(...parameterKeys.map((key) => {
      const definition = model.parameters[key];
      const config = experience.parameters[key];
      const fieldset = create("fieldset", undefined, "simulation-lab__parameter");
      fieldset.dataset.labParameter = key;
      const legend = create("legend", `${definition.label} `);
      legend.append(create("span", definition.symbol));
      fieldset.append(legend);
      const grid = create("div", undefined, "simulation-lab__parameter-grid");
      for (const [property, label] of [["default", "Valor inicial"], ["minimum", "Mínimo"], ["maximum", "Máximo"], ["step", "Paso"]]) {
        const wrapper = create("label");
        wrapper.append(create("span", label));
        const input = create("input");
        input.type = "number";
        input.inputMode = "decimal";
        input.required = true;
        input.step = "any";
        input.min = property === "step" ? "0.0001" : String(definition.hardMinimum);
        input.max = property === "step"
          ? String(definition.hardMaximum - definition.hardMinimum)
          : String(definition.hardMaximum);
        input.value = String(config[property]);
        input.dataset.parameterProperty = property;
        wrapper.append(input);
        grid.append(wrapper);
      }
      fieldset.append(grid);
      const check = create("label", undefined, "simulation-lab__check");
      const editable = create("input");
      editable.type = "checkbox";
      editable.checked = config.editable;
      editable.dataset.parameterEditable = "";
      check.append(editable, create("span", `El estudiante puede modificar ${definition.symbol}`));
      fieldset.append(check, create(
        "small",
        `Límite del modelo: ${definition.hardMinimum} a ${definition.hardMaximum} ${definition.unit}.`
      ));
      return fieldset;
    }));
    registerDescribedBy(container);
  };

  const renderViews = (experience) => {
    const container = root.querySelector("[data-lab-view-options]");
    if (!(container instanceof HTMLElement)) return;
    container.replaceChildren(...Object.entries(model.views).map(([key, definition]) => {
      const label = create("label", undefined, "simulation-lab__check");
      const input = create("input");
      input.type = "checkbox";
      input.checked = experience.views[key] === true;
      input.dataset.labView = key;
      label.append(input, create("span", `${definition.label}${definition.visual ? " · visual principal" : ""}`));
      return label;
    }));
    registerDescribedBy(container);
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
      const englishLabel = create("label");
      englishLabel.append(create("span", "Name in English"));
      const englishLabelInput = create("input");
      englishLabelInput.type = "text";
      englishLabelInput.required = true;
      englishLabelInput.maxLength = SIMULATION_EXPERIENCE_LIMITS.maximumPresetLabelLength;
      englishLabelInput.value = translations.en.presetLabels[preset.id] ?? "";
      englishLabelInput.dataset.presetLabelEn = "";
      englishLabel.append(englishLabelInput);
      fieldset.append(englishLabel);
      const grid = create("div", undefined, "simulation-lab__preset-grid");
      const parameters = parameterConfigFromForm();
      parameterKeys.forEach((key) => {
        const definition = model.parameters[key];
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
        input.disabled = !parameters[key].editable;
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
    registerDescribedBy(container);
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
      textarea.dataset.observationEs = "";
      label.append(textarea);
      const englishLabel = create("label");
      englishLabel.append(create("span", `Observation ${index + 1} in English`));
      const englishTextarea = create("textarea");
      englishTextarea.rows = 3;
      englishTextarea.required = true;
      englishTextarea.maxLength = SIMULATION_EXPERIENCE_LIMITS.maximumObservationLength;
      englishTextarea.value = translations.en.observations[index] ?? "";
      englishTextarea.dataset.observationEn = "";
      englishLabel.append(englishTextarea);
      const remove = create("button", "Eliminar observación", "simulation-lab__remove");
      remove.type = "button";
      remove.dataset.removeLabObservation = String(index);
      entry.append(label, englishLabel, remove);
      return entry;
    }));
    if (addButton instanceof HTMLButtonElement) {
      addButton.disabled = observations.length >= SIMULATION_EXPERIENCE_LIMITS.maximumObservations;
    }
    registerDescribedBy(container);
  };

  const renderContexts = (experience) => {
    const selected = new Set(experience.contexts.flatMap((context) => context.topics));
    form.querySelectorAll('input[name="context-topic"]').forEach((input) => {
      input.checked = selected.has(input.value);
    });
  };

  const syncLockedParameter = (fieldset) => {
    if (!(fieldset instanceof HTMLElement)) return;
    const key = fieldset.dataset.labParameter;
    const editable = fieldset.querySelector("[data-parameter-editable]")?.checked === true;
    const defaultValue = fieldset.querySelector('[data-parameter-property="default"]')?.value;
    root.querySelectorAll(`[data-preset-parameter="${key}"]`).forEach((input) => {
      input.disabled = !editable;
      if (!editable) input.value = defaultValue;
    });
  };

  const renderPreview = async (experience) => {
    await mountSimulationExperienceRenderer(rendererRoot, experience);
    if (previewHeading) previewHeading.textContent = experience.title;
    if (previewSummary) previewSummary.textContent = experience.summary;
    if (previewObservations) {
      previewObservations.replaceChildren(...experience.observations.map((observation) => create("li", observation)));
    }
    if (previewGuide instanceof HTMLElement) previewGuide.hidden = experience.observations.length === 0;
  };

  const switchModel = async (modelId) => {
    const nextModel = getSimulationModelById(modelId);
    const source = createSimulationLabBaseConfiguration(modelId);
    if (!nextModel || !source) return;
    modelSelect.disabled = true;
    if (status) status.textContent = `Cargando ${nextModel.name}…`;
    model = nextModel;
    parameterKeys = Object.keys(model.parameters);
    presets = structuredClone(source.presets);
    observations = [...source.observations];
    translations = structuredClone(source.translations);
    currentId = undefined;
    nextPresetNumber = presets.length + 1;
    form.elements.namedItem("title").value = source.title;
    form.elements.namedItem("summary").value = source.summary;
    form.elements.namedItem("title-en").value = source.translations.en.title;
    form.elements.namedItem("summary-en").value = source.translations.en.summary;
    renderParameters(source);
    renderViews(source);
    renderPresets();
    renderObservations();
    renderContexts(source);
    const result = evaluate({ showErrors: true });
    try {
      if (result.valid) await renderPreview(result.experience);
      if (status) status.textContent = `${nextModel.name} está listo para editar y previsualizar.`;
    } catch {
      if (status) status.textContent = "El renderer no pudo cargarse; revisa el mensaje localizado en la previsualización.";
    } finally {
      modelSelect.disabled = false;
    }
  };

  root.querySelector("[data-add-lab-preset]")?.addEventListener("click", () => {
    presets = readPresets();
    translations.en.presetLabels = readEnglishPresetLabels();
    if (presets.length >= SIMULATION_EXPERIENCE_LIMITS.maximumPresets) return;
    const parameters = parameterConfigFromForm();
    const id = `case-study-${nextPresetNumber}`;
    presets.push({
      id,
      label: `Caso ${nextPresetNumber}`,
      parameters: Object.fromEntries(parameterKeys.map((key) => [key, parameters[key].default])),
    });
    translations.en.presetLabels[id] = "";
    nextPresetNumber += 1;
    renderPresets();
    evaluate({ showErrors: !errorPanel.hidden });
    if (status) status.textContent = "Caso de estudio añadido a la sesión local.";
  });
  root.querySelector("[data-lab-presets]")?.addEventListener("click", (event) => {
    const button = event.target instanceof Element
      ? event.target.closest("[data-remove-lab-preset]")
      : null;
    if (!(button instanceof HTMLButtonElement)) return;
    const currentPresets = readPresets();
    translations.en.presetLabels = readEnglishPresetLabels();
    const removed = currentPresets[Number(button.dataset.removeLabPreset)];
    presets = currentPresets.filter((_, index) => index !== Number(button.dataset.removeLabPreset));
    if (removed) delete translations.en.presetLabels[removed.id];
    renderPresets();
    evaluate({ showErrors: !errorPanel.hidden });
  });
  root.querySelector("[data-add-lab-observation]")?.addEventListener("click", () => {
    observations = readObservations();
    translations.en.observations = readEnglishObservations();
    if (observations.length >= SIMULATION_EXPERIENCE_LIMITS.maximumObservations) return;
    observations.push("");
    translations.en.observations.push("");
    renderObservations();
    evaluate({ showErrors: !errorPanel.hidden });
    root.querySelector("[data-lab-observation]:last-child textarea")?.focus();
  });
  root.querySelector("[data-lab-observations]")?.addEventListener("click", (event) => {
    const button = event.target instanceof Element
      ? event.target.closest("[data-remove-lab-observation]")
      : null;
    if (!(button instanceof HTMLButtonElement)) return;
    const removedIndex = Number(button.dataset.removeLabObservation);
    observations = readObservations().filter((_, index) => index !== removedIndex);
    translations.en.observations = readEnglishObservations().filter((_, index) => index !== removedIndex);
    renderObservations();
    evaluate({ showErrors: !errorPanel.hidden });
  });
  modelSelect.addEventListener("change", () => { switchModel(modelSelect.value); });
  form.addEventListener("input", (event) => {
    if (!(event.target instanceof Element) || event.target === modelSelect) return;
    const editable = event.target.closest("[data-parameter-editable]");
    if (editable) syncLockedParameter(editable.closest("[data-lab-parameter]"));
    evaluate({ showErrors: !errorPanel.hidden });
  });
  root.querySelector("[data-preview-simulation]")?.addEventListener("click", async () => {
    const result = evaluate({ showErrors: true });
    if (!result.valid) {
      errorPanel.focus();
      if (status) status.textContent = "La configuración necesita ajustes antes de previsualizarse.";
      return;
    }
    try {
      await renderPreview(result.experience);
      previewHeading?.focus({ preventScroll: true });
      if (status) status.textContent = "Previsualización actualizada con la configuración válida.";
    } catch {
      if (status) status.textContent = "No fue posible actualizar el renderer seleccionado.";
    }
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

  registerDescribedBy();
  renderPresets();
  renderObservations();
  root.querySelectorAll("[data-lab-parameter]").forEach(syncLockedParameter);
  evaluate();
  await mountSimulationExperienceRenderer(rendererRoot, initialExperience);
  root.dataset.initialized = "true";
  window.addEventListener("pagehide", () => {
    destroySimulationExperienceRenderer(rendererRoot);
  }, { once: true });
};

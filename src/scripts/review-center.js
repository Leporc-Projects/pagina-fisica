import {
  ACTIVITY_OPTIONS,
  HELPFULNESS_OPTIONS,
  IMPROVEMENT_AREAS,
  PARTICIPATION_TOPICS,
  PROPOSAL_TYPES,
  STUDENT_DIFFICULTY_ESTIMATES,
  SUPPORT_OPTIONS,
} from "../data/participation.js";
import { REVIEW_STATUSES } from "../data/review.js";
import { downloadLocalFile } from "./local-export.js";
import {
  addReviewImportEntries,
  aggregateReviewSession,
  createReviewExport,
  createReviewSession,
  filterParticipationRecords,
  getProposalRecords,
  participationMainText,
  proposalReviewFor,
  REVIEW_LABELS,
  reviewFilename,
  reviewTopicTitle,
  toReviewCSV,
  toReviewJSON,
  toReviewText,
  updateProposalReview,
} from "../utils/review.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const PROPOSALS_PER_PAGE = 10;
const INCIDENTS_PER_PAGE = 25;

const createElement = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};

const appendCell = (row, text, { status } = {}) => {
  const cell = createElement("td", text);
  if (status) cell.dataset.status = status;
  row.append(cell);
  return cell;
};

const formatDate = (iso) => new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(iso));

const optionLabels = (options) => Object.fromEntries(options);
const proposalTypeLabels = optionLabels(PROPOSAL_TYPES);
const studentDifficultyLabels = optionLabels(STUDENT_DIFFICULTY_ESTIMATES);

const truncateText = (value, maximum) => {
  const text = String(value ?? "");
  return text.length > maximum ? `${text.slice(0, maximum - 1).trimEnd()}…` : text;
};

export const initializeReviewCenter = () => {
  const center = document.querySelector("[data-review-center]");
  if (!(center instanceof HTMLElement) || center.dataset.initialized === "true") return;
  center.dataset.initialized = "true";

  const fileInput = center.querySelector("[data-review-files]");
  const dropzone = center.querySelector("[data-review-dropzone]");
  const live = center.querySelector("[data-review-live]");
  const empty = center.querySelector("[data-review-empty]");
  const workspace = center.querySelector("[data-review-workspace]");
  const clearArea = center.querySelector("[data-review-clear-area]");
  const clearConfirmation = center.querySelector("[data-review-clear-confirmation]");
  const filterForm = center.querySelector("[data-review-filters]");
  let session = createReviewSession();
  let reviews = {};
  let responsePage = 1;
  let proposalPage = 1;
  let incidentPage = 1;
  let readingFiles = false;

  const announce = (message) => {
    if (live) live.textContent = message;
  };

  const replaceTableRows = (target, entries, labels, emptyMessage) => {
    if (!(target instanceof HTMLElement)) return;
    target.replaceChildren();
    const rows = entries
      .map(([key, count]) => [labels[key] ?? key, count])
      .filter(([, count]) => count > 0)
      .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0], "es"));
    if (rows.length === 0) {
      const row = createElement("tr");
      const cell = createElement("td", emptyMessage);
      cell.colSpan = 2;
      row.append(cell);
      target.append(row);
      return;
    }
    rows.forEach(([label, count]) => {
      const row = createElement("tr");
      appendCell(row, label);
      appendCell(row, String(count));
      target.append(row);
    });
  };

  const renderTopicChart = (counts) => {
    const svg = center.querySelector("[data-review-topic-chart]");
    if (!(svg instanceof SVGElement)) return;
    svg.replaceChildren();
    const entries = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((first, second) => second[1] - first[1]);
    const height = Math.max(72, entries.length * 42 + 18);
    svg.setAttribute("viewBox", `0 0 640 ${height}`);
    if (entries.length === 0) {
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", "8");
      text.setAttribute("y", "36");
      text.textContent = "Sin respuestas de dificultad conceptual.";
      svg.append(text);
      return;
    }
    const maximum = Math.max(...entries.map(([, count]) => count));
    entries.forEach(([topic, count], index) => {
      const y = index * 42 + 8;
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", "0");
      label.setAttribute("y", String(y + 20));
      label.setAttribute("class", "review-bar-chart__label");
      label.textContent = truncateText(reviewTopicTitle(topic), 31);
      const bar = document.createElementNS(SVG_NS, "rect");
      bar.setAttribute("x", "270");
      bar.setAttribute("y", String(y));
      bar.setAttribute("width", String((count / maximum) * 300));
      bar.setAttribute("height", "26");
      bar.setAttribute("rx", "4");
      bar.setAttribute("class", "review-bar-chart__bar");
      const value = document.createElementNS(SVG_NS, "text");
      value.setAttribute("x", String(280 + (count / maximum) * 300));
      value.setAttribute("y", String(y + 20));
      value.setAttribute("class", "review-bar-chart__value");
      value.textContent = String(count);
      svg.append(label, bar, value);
    });
  };

  const renderSummary = () => {
    const summary = aggregateReviewSession(session);
    const counts = center.querySelector("[data-review-counts]");
    if (counts) {
      counts.replaceChildren();
      [
        ["Archivos", summary.files],
        ["Válidos", summary.incidents.valid],
        ["Advertencias", summary.incidents.warning],
        ["Inválidos", summary.incidents.invalid],
        ["Duplicados", summary.duplicates],
        ["Registros únicos", summary.uniqueRecords],
        ["Respuestas de Participa", summary.participation],
        ["Intentos de Bonos", summary.bonuses],
      ].forEach(([label, value]) => {
        const group = createElement("div");
        group.append(createElement("dt", label), createElement("dd", String(value)));
        counts.append(group);
      });
    }
    replaceTableRows(
      center.querySelector("[data-review-activity-counts]"),
      ACTIVITY_OPTIONS.map((option) => [option.value, summary.activity[option.value] ?? 0]),
      REVIEW_LABELS.activity,
      "Sin respuestas de Participa."
    );
    const topicLabels = Object.fromEntries(PARTICIPATION_TOPICS.map((topic) => [topic.slug, topic.title]));
    replaceTableRows(
      center.querySelector("[data-review-topic-counts]"),
      PARTICIPATION_TOPICS.map((topic) => [topic.slug, summary.difficultyTopics[topic.slug] ?? 0]),
      topicLabels,
      "Sin dificultades declaradas."
    );
    replaceTableRows(
      center.querySelector("[data-review-support-counts]"),
      SUPPORT_OPTIONS.map(([value]) => [value, summary.requestedSupport[value] ?? 0]),
      REVIEW_LABELS.support,
      "Sin tipo de ayuda declarado."
    );
    replaceTableRows(
      center.querySelector("[data-review-improvement-counts]"),
      IMPROVEMENT_AREAS.map(([value]) => [value, summary.improvementAreas[value] ?? 0]),
      REVIEW_LABELS.improvementArea,
      "Sin mejoras de página."
    );
    replaceTableRows(
      center.querySelector("[data-review-helpfulness-counts]"),
      HELPFULNESS_OPTIONS.map(([value]) => [value, summary.helpfulness[value] ?? 0]),
      REVIEW_LABELS.helpfulness,
      "Sin valoración opcional."
    );
    renderTopicChart(summary.difficultyTopics);
  };

  const responseDetails = (response) => {
    if (response.activityType === "concept-difficulty") {
      return response.payload.helpfulSupport
        ? [["Podría ayudar", REVIEW_LABELS.support[response.payload.helpfulSupport]]]
        : [];
    }
    if (response.activityType === "student-question-proposal") {
      return [["Tipo", proposalTypeLabels[response.payload.proposal.kind]]];
    }
    return [
      ["Categoría", REVIEW_LABELS.improvementArea[response.payload.area]],
      response.payload.helpfulness && [
        "Valoración opcional",
        REVIEW_LABELS.helpfulness[response.payload.helpfulness],
      ],
    ].filter(Boolean);
  };

  const renderResponses = () => {
    const values = filterForm instanceof HTMLFormElement
      ? Object.fromEntries(new FormData(filterForm))
      : {};
    const result = filterParticipationRecords(session, {
      query: values.query,
      topic: values.topic,
      activityType: values.activityType,
      page: responsePage,
    });
    responsePage = result.page;
    const summary = center.querySelector("[data-review-response-summary]");
    if (summary) {
      summary.textContent = result.total === 1
        ? "1 respuesta encontrada."
        : `${result.total} respuestas encontradas.`;
    }
    const list = center.querySelector("[data-review-response-list]");
    if (list) {
      list.replaceChildren();
      if (result.records.length === 0) {
        list.append(createElement("p", "No hay respuestas que coincidan con los filtros.", "review-inline-empty"));
      }
      result.records.forEach((record) => {
        const response = record.original;
        const article = createElement("article", undefined, "review-response");
        const header = createElement("header");
        const title = createElement("h3", REVIEW_LABELS.activity[response.activityType]);
        const meta = createElement(
          "p",
          `${response.topic.title} · ${formatDate(response.createdAt)}`,
          "review-response__meta"
        );
        header.append(title, meta);
        const excerpt = createElement(
          "p",
          truncateText(participationMainText(response), 280),
          "review-response__excerpt"
        );
        const details = createElement("details");
        const detailsSummary = createElement("summary", "Ver datos completos");
        const fullText = createElement("p", participationMainText(response));
        const facts = createElement("dl", undefined, "review-response__facts");
        [
          ["ID de respuesta", response.responseId],
          ...responseDetails(response),
          ["Archivo", record.sourceFiles.join(", ")],
        ].forEach(([label, value]) => {
          const group = createElement("div");
          group.append(createElement("dt", label), createElement("dd", value));
          facts.append(group);
        });
        details.append(detailsSummary, fullText, facts);
        article.append(header, excerpt, details);
        list.append(article);
      });
    }
    const page = center.querySelector("[data-review-response-page]");
    if (page) page.textContent = `Página ${result.page} de ${result.pageCount}`;
    const previous = center.querySelector("[data-review-response-previous]");
    const next = center.querySelector("[data-review-response-next]");
    if (previous instanceof HTMLButtonElement) previous.disabled = result.page <= 1;
    if (next instanceof HTMLButtonElement) next.disabled = result.page >= result.pageCount;
  };

  const addProposalFact = (list, label, value) => {
    if (!value) return;
    const group = createElement("div");
    group.append(createElement("dt", label), createElement("dd", value));
    list.append(group);
  };

  const saveProposalReview = (responseId, card) => {
    const select = card.querySelector("select");
    const note = card.querySelector("textarea");
    if (!(select instanceof HTMLSelectElement) || !(note instanceof HTMLTextAreaElement)) return;
    reviews = updateProposalReview(reviews, responseId, {
      status: select.value,
      note: note.value,
    });
    announce("Revisión local actualizada. El archivo original no fue modificado.");
  };

  const renderProposals = () => {
    const proposals = getProposalRecords(session);
    const pageCount = Math.max(1, Math.ceil(proposals.length / PROPOSALS_PER_PAGE));
    proposalPage = Math.min(Math.max(1, proposalPage), pageCount);
    const visible = proposals.slice(
      (proposalPage - 1) * PROPOSALS_PER_PAGE,
      proposalPage * PROPOSALS_PER_PAGE
    );
    const summary = center.querySelector("[data-review-proposal-summary]");
    if (summary) summary.textContent = `${proposals.length} ${proposals.length === 1 ? "propuesta anónima" : "propuestas anónimas"}.`;
    const list = center.querySelector("[data-review-proposal-list]");
    if (list) {
      list.replaceChildren();
      if (visible.length === 0) {
        list.append(createElement("p", "No se importaron propuestas estudiantiles.", "review-inline-empty"));
      }
      visible.forEach((record) => {
        const response = record.original;
        const proposal = response.payload.proposal;
        const review = proposalReviewFor(reviews, response.responseId);
        const article = createElement("article", undefined, "review-proposal");
        const header = createElement("header");
        header.append(
          createElement("p", "Propuesta anónima", "academic-label"),
          createElement("h3", proposal.statement),
          createElement("p", `${response.topic.title} · ${formatDate(response.createdAt)}`, "review-response__meta")
        );
        const facts = createElement("dl", undefined, "review-proposal__facts");
        addProposalFact(facts, "Tipo", proposalTypeLabels[proposal.kind]);
        addProposalFact(facts, "Concepto que pretende evaluar", proposal.intendedConcept);
        addProposalFact(facts, "Respuesta esperada", proposal.expectedAnswer);
        addProposalFact(facts, "Explicación", proposal.answerExplanation);
        addProposalFact(
          facts,
          "Dificultad estimada por quien propone",
          studentDifficultyLabels[proposal.studentDifficultyEstimate?.value]
        );
        const controls = createElement("div", undefined, "review-proposal__controls");
        const selectLabel = createElement("label", "Estado de revisión local");
        const select = createElement("select");
        REVIEW_STATUSES.forEach(([value, label]) => {
          const option = createElement("option", label);
          option.value = value;
          option.selected = review.status === value;
          select.append(option);
        });
        selectLabel.append(select);
        const noteLabel = createElement("label", "Nota docente opcional");
        const note = createElement("textarea");
        note.rows = 3;
        note.value = review.note ?? "";
        noteLabel.append(note);
        controls.append(selectLabel, noteLabel);
        select.addEventListener("change", () => saveProposalReview(response.responseId, article));
        note.addEventListener("change", () => saveProposalReview(response.responseId, article));
        article.append(header, facts, controls);
        list.append(article);
      });
    }
    const page = center.querySelector("[data-review-proposal-page]");
    if (page) page.textContent = `Página ${proposalPage} de ${pageCount}`;
    const previous = center.querySelector("[data-review-proposal-previous]");
    const next = center.querySelector("[data-review-proposal-next]");
    if (previous instanceof HTMLButtonElement) previous.disabled = proposalPage <= 1;
    if (next instanceof HTMLButtonElement) next.disabled = proposalPage >= pageCount;
  };

  const renderBonuses = () => {
    const target = center.querySelector("[data-review-bonus-records]");
    if (!target) return;
    target.replaceChildren();
    const records = session.records.filter((record) => record.kind === "bonus");
    if (records.length === 0) {
      const row = createElement("tr");
      const cell = createElement("td", "No se importaron intentos de Bonos.");
      cell.colSpan = 4;
      row.append(cell);
      target.append(row);
      return;
    }
    records.forEach((record) => {
      const attempt = record.original;
      const row = createElement("tr");
      appendCell(row, record.sourceFiles.join(", "));
      appendCell(row, `Intento anónimo · ${attempt.bonusTitle}`);
      appendCell(
        row,
        `${attempt.summary.pointsEarned} / ${attempt.summary.pointsPossible} (${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(attempt.summary.percentage)} %)`
      );
      appendCell(row, formatDate(attempt.completedAt));
      target.append(row);
    });
  };

  const renderIncidents = () => {
    const pageCount = Math.max(1, Math.ceil(session.incidents.length / INCIDENTS_PER_PAGE));
    incidentPage = Math.min(Math.max(1, incidentPage), pageCount);
    const visible = session.incidents.slice(
      (incidentPage - 1) * INCIDENTS_PER_PAGE,
      incidentPage * INCIDENTS_PER_PAGE
    );
    const target = center.querySelector("[data-review-incidents]");
    if (target) {
      target.replaceChildren();
      visible.forEach((incident) => {
        const row = createElement("tr");
        appendCell(row, incident.file);
        appendCell(row, {
          valid: "Válido",
          warning: "Advertencia",
          invalid: "Inválido",
        }[incident.status], { status: incident.status });
        const reason = appendCell(row, incident.reason);
        if (incident.status === "warning" && incident.key) {
          const record = session.records.find((item) => item.key === incident.key);
          if (record) {
            const details = createElement("details");
            details.append(createElement("summary", "Ver archivos con el mismo ID"));
            const list = createElement("ul");
            record.sourceFiles.forEach((file) => list.append(createElement("li", file)));
            details.append(list);
            reason.append(details);
          }
        }
        target.append(row);
      });
    }
    const page = center.querySelector("[data-review-incident-page]");
    if (page) page.textContent = `Página ${incidentPage} de ${pageCount}`;
    const previous = center.querySelector("[data-review-incident-previous]");
    const next = center.querySelector("[data-review-incident-next]");
    if (previous instanceof HTMLButtonElement) previous.disabled = incidentPage <= 1;
    if (next instanceof HTMLButtonElement) next.disabled = incidentPage >= pageCount;
  };

  const render = () => {
    const hasFiles = session.incidents.length > 0;
    if (empty instanceof HTMLElement) empty.hidden = hasFiles;
    if (workspace instanceof HTMLElement) workspace.hidden = !hasFiles;
    if (clearArea instanceof HTMLElement) clearArea.hidden = !hasFiles;
    const label = center.querySelector("[data-review-file-label]");
    if (label) label.textContent = hasFiles ? "Añadir archivos" : "Seleccionar archivos";
    if (!hasFiles) return;
    renderSummary();
    renderResponses();
    renderProposals();
    renderBonuses();
    renderIncidents();
  };

  const handleFiles = async (files) => {
    if (readingFiles || files.length === 0) return;
    readingFiles = true;
    if (fileInput instanceof HTMLInputElement) fileInput.disabled = true;
    announce(`Leyendo ${files.length} ${files.length === 1 ? "archivo" : "archivos"} en este navegador…`);
    const entries = await Promise.all(files.map(async (file) => {
      try {
        return { name: file.name, size: file.size, text: await file.text() };
      } catch {
        return { name: file.name, size: file.size, text: null };
      }
    }));
    session = addReviewImportEntries(session, entries);
    responsePage = 1;
    proposalPage = 1;
    incidentPage = Math.max(1, Math.ceil(session.incidents.length / INCIDENTS_PER_PAGE));
    render();
    readingFiles = false;
    if (fileInput instanceof HTMLInputElement) {
      fileInput.disabled = false;
      fileInput.value = "";
    }
    const latest = entries.length;
    announce(`${latest} ${latest === 1 ? "archivo procesado" : "archivos procesados"}. Nada se envió.`);
  };

  fileInput?.addEventListener("change", () => {
    if (fileInput instanceof HTMLInputElement) handleFiles([...fileInput.files]);
  });
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      if (dropzone instanceof HTMLElement) dropzone.dataset.dragging = "true";
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      if (dropzone instanceof HTMLElement) delete dropzone.dataset.dragging;
    });
  });
  dropzone?.addEventListener("drop", (event) => {
    const files = event.dataTransfer?.files ? [...event.dataTransfer.files] : [];
    handleFiles(files);
  });

  filterForm?.addEventListener("input", () => {
    responsePage = 1;
    renderResponses();
  });
  center.querySelector("[data-review-filter-reset]")?.addEventListener("click", () => {
    if (filterForm instanceof HTMLFormElement) filterForm.reset();
    responsePage = 1;
    renderResponses();
  });
  center.querySelector("[data-review-response-previous]")?.addEventListener("click", () => {
    responsePage -= 1;
    renderResponses();
  });
  center.querySelector("[data-review-response-next]")?.addEventListener("click", () => {
    responsePage += 1;
    renderResponses();
  });
  center.querySelector("[data-review-proposal-previous]")?.addEventListener("click", () => {
    proposalPage -= 1;
    renderProposals();
  });
  center.querySelector("[data-review-proposal-next]")?.addEventListener("click", () => {
    proposalPage += 1;
    renderProposals();
  });
  center.querySelector("[data-review-incident-previous]")?.addEventListener("click", () => {
    incidentPage -= 1;
    renderIncidents();
  });
  center.querySelector("[data-review-incident-next]")?.addEventListener("click", () => {
    incidentPage += 1;
    renderIncidents();
  });

  center.querySelector("[data-review-clear]")?.addEventListener("click", () => {
    if (clearConfirmation instanceof HTMLElement) clearConfirmation.hidden = false;
  });
  center.querySelector("[data-review-clear-cancel]")?.addEventListener("click", () => {
    if (clearConfirmation instanceof HTMLElement) clearConfirmation.hidden = true;
  });
  center.querySelector("[data-review-clear-confirm]")?.addEventListener("click", () => {
    session = createReviewSession();
    reviews = {};
    responsePage = 1;
    proposalPage = 1;
    incidentPage = 1;
    if (filterForm instanceof HTMLFormElement) filterForm.reset();
    if (clearConfirmation instanceof HTMLElement) clearConfirmation.hidden = true;
    render();
    announce("Sesión limpiada. Los archivos y notas desaparecieron de esta pestaña.");
  });

  const renderPrintResponses = () => {
    const target = center.querySelector("[data-review-print-response-list]");
    if (!target) return;
    target.replaceChildren();
    session.records
      .filter((record) => record.kind === "participation")
      .forEach((record, index) => {
        const response = record.original;
        const article = createElement("article");
        article.append(
          createElement("h3", `${index + 1}. ${REVIEW_LABELS.activity[response.activityType]}`),
          createElement("p", `${response.topic.title} · ${response.responseId}`),
          createElement("p", participationMainText(response))
        );
        target.append(article);
      });
  };

  center.querySelectorAll("[data-review-export]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!(button instanceof HTMLButtonElement)) return;
      try {
        const exported = createReviewExport(session, reviews);
        const action = button.dataset.reviewExport;
        if (action === "print") {
          const includeOpen = center.querySelector("[data-review-print-open]");
          center.dataset.printOpen = String(
            includeOpen instanceof HTMLInputElement && includeOpen.checked
          );
          if (center.dataset.printOpen === "true") renderPrintResponses();
          announce("Se abrirá el diálogo para imprimir o guardar como PDF.");
          window.print();
          return;
        }
        const exporters = {
          txt: [toReviewText, "text/plain;charset=utf-8"],
          csv: [toReviewCSV, "text/csv;charset=utf-8"],
          json: [toReviewJSON, "application/json;charset=utf-8"],
        };
        const exporter = exporters[action];
        if (!exporter) return;
        downloadLocalFile({
          contents: exporter[0](exported),
          mimeType: exporter[1],
          filename: reviewFilename(exported, action),
        });
        announce(`Archivo ${action.toUpperCase()} preparado localmente.`);
      } catch {
        announce("No fue posible preparar el archivo. La sesión sigue disponible en esta pestaña.");
      }
    });
  });

  render();
};

import { localizeReviewData } from "../data/review-localize.js";
import { LOCALES } from "../i18n/config.js";
import { t } from "../i18n/index.js";
import { attemptIdentity } from "../utils/bonus.js";
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
  reviewFilename,
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

const formatDate = (iso, locale) => new Intl.DateTimeFormat(LOCALES[locale].intlLocale, {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(iso));

const truncateText = (value, maximum) => {
  const text = String(value ?? "");
  return text.length > maximum ? `${text.slice(0, maximum - 1).trimEnd()}…` : text;
};

export const initializeReviewCenter = () => {
  const center = document.querySelector("[data-review-center]");
  if (!(center instanceof HTMLElement) || center.dataset.initialized === "true") return;
  center.dataset.initialized = "true";
  const locale = center.dataset.locale ?? "es";
  const localized = localizeReviewData(locale);
  const labels = localized.labels;

  const fileInput = center.querySelector("[data-review-files]");
  const dropzone = center.querySelector("[data-review-dropzone]");
  const live = center.querySelector("[data-review-live]");
  const empty = center.querySelector("[data-review-empty]");
  const workspace = center.querySelector("[data-review-workspace]");
  const clearArea = center.querySelector("[data-review-clear-area]");
  const clearConfirmation = center.querySelector("[data-review-clear-confirmation]");
  const filterForm = center.querySelector("[data-review-filters]");
  const bonusFilterForm = center.querySelector("[data-review-bonus-filters]");
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
      .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0], locale));
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
      text.textContent = t(locale, "teacher.review.chartEmpty");
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
      label.textContent = truncateText(labels.topic[topic] ?? topic, 31);
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
        [t(locale, "teacher.review.metric.files"), summary.files],
        [t(locale, "teacher.review.metric.valid"), summary.incidents.valid],
        [t(locale, "teacher.review.metric.warning"), summary.incidents.warning],
        [t(locale, "teacher.review.metric.invalid"), summary.incidents.invalid],
        [t(locale, "teacher.review.metric.duplicates"), summary.duplicates],
        [t(locale, "teacher.review.metric.unique"), summary.uniqueRecords],
        [t(locale, "teacher.review.metric.participation"), summary.participation],
        [t(locale, "teacher.review.metric.bonuses"), summary.bonuses],
        [t(locale, "teacher.review.metric.anonymous"), summary.bonusIdentity.anonymous],
        [t(locale, "teacher.review.metric.identified"), summary.bonusIdentity.institutionalEmail],
      ].forEach(([label, value]) => {
        const group = createElement("div");
        group.append(createElement("dt", label), createElement("dd", String(value)));
        counts.append(group);
      });
    }
    replaceTableRows(
      center.querySelector("[data-review-activity-counts]"),
      localized.activityOptions.map((option) => [option.value, summary.activity[option.value] ?? 0]),
      labels.activity,
      t(locale, "teacher.review.none.participation")
    );
    replaceTableRows(
      center.querySelector("[data-review-topic-counts]"),
      localized.topics.map((topic) => [topic.slug, summary.difficultyTopics[topic.slug] ?? 0]),
      labels.topic,
      t(locale, "teacher.review.none.difficulties")
    );
    replaceTableRows(
      center.querySelector("[data-review-support-counts]"),
      localized.supportOptions.map(([value]) => [value, summary.requestedSupport[value] ?? 0]),
      labels.support,
      t(locale, "teacher.review.none.support")
    );
    replaceTableRows(
      center.querySelector("[data-review-improvement-counts]"),
      localized.improvementAreas.map(([value]) => [value, summary.improvementAreas[value] ?? 0]),
      labels.improvementArea,
      t(locale, "teacher.review.none.improvements")
    );
    replaceTableRows(
      center.querySelector("[data-review-helpfulness-counts]"),
      localized.helpfulnessOptions.map(([value]) => [value, summary.helpfulness[value] ?? 0]),
      labels.helpfulness,
      t(locale, "teacher.review.none.rating")
    );
    renderTopicChart(summary.difficultyTopics);
  };

  const responseDetails = (response) => {
    if (response.activityType === "concept-difficulty") {
      return [
        response.payload.helpfulSupport && [
          t(locale, "teacher.review.detail.support"),
          labels.support[response.payload.helpfulSupport],
        ],
        response.payload.helpfulSupportOther && [
          t(locale, "teacher.review.detail.supportOther"),
          response.payload.helpfulSupportOther,
        ],
      ].filter(Boolean);
    }
    if (response.activityType === "student-question-proposal") {
      return [[t(locale, "teacher.review.detail.type"), labels.proposalType[response.payload.proposal.kind]]];
    }
    return [
      [t(locale, "teacher.review.detail.category"), labels.improvementArea[response.payload.area]],
      response.payload.helpfulness && [
        t(locale, "teacher.review.detail.rating"),
        labels.helpfulness[response.payload.helpfulness],
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
        ? t(locale, "teacher.review.response.one")
        : t(locale, "teacher.review.response.many", { count: result.total });
    }
    const list = center.querySelector("[data-review-response-list]");
    if (list) {
      list.replaceChildren();
      if (result.records.length === 0) {
        list.append(createElement("p", t(locale, "teacher.review.response.none"), "review-inline-empty"));
      }
      result.records.forEach((record) => {
        const response = record.original;
        const article = createElement("article", undefined, "review-response");
        const header = createElement("header");
        const title = createElement("h3", labels.activity[response.activityType]);
        const meta = createElement(
          "p",
          `${response.topic.title} · ${formatDate(response.createdAt, locale)}`,
          "review-response__meta"
        );
        header.append(title, meta);
        const excerpt = createElement(
          "p",
          truncateText(participationMainText(response), 280),
          "review-response__excerpt"
        );
        const details = createElement("details");
        const detailsSummary = createElement("summary", t(locale, "teacher.review.details"));
        const fullText = createElement("p", participationMainText(response));
        const facts = createElement("dl", undefined, "review-response__facts");
        [
          [t(locale, "teacher.review.detail.id"), response.responseId],
          ...responseDetails(response),
          [t(locale, "teacher.review.detail.file"), record.sourceFiles.join(", ")],
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
    if (page) page.textContent = t(locale, "teacher.review.page", { page: result.page, pages: result.pageCount });
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
    announce(t(locale, "teacher.review.reviewSaved"));
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
    if (summary) summary.textContent = proposals.length === 1
      ? t(locale, "teacher.review.proposal.one")
      : t(locale, "teacher.review.proposal.many", { count: proposals.length });
    const list = center.querySelector("[data-review-proposal-list]");
    if (list) {
      list.replaceChildren();
      if (visible.length === 0) {
        list.append(createElement("p", t(locale, "teacher.review.proposal.none"), "review-inline-empty"));
      }
      visible.forEach((record) => {
        const response = record.original;
        const proposal = response.payload.proposal;
        const review = proposalReviewFor(reviews, response.responseId);
        const article = createElement("article", undefined, "review-proposal");
        const header = createElement("header");
        header.append(
          createElement("p", t(locale, "teacher.review.proposal.anonymous"), "academic-label"),
          createElement("h3", proposal.statement),
          createElement("p", `${response.topic.title} · ${formatDate(response.createdAt, locale)}`, "review-response__meta")
        );
        const facts = createElement("dl", undefined, "review-proposal__facts");
        addProposalFact(facts, t(locale, "teacher.review.detail.type"), labels.proposalType[proposal.kind]);
        addProposalFact(facts, t(locale, "teacher.review.proposal.concept"), proposal.intendedConcept);
        addProposalFact(facts, t(locale, "teacher.review.proposal.expected"), proposal.expectedAnswer);
        addProposalFact(facts, t(locale, "teacher.review.proposal.explanation"), proposal.answerExplanation);
        addProposalFact(
          facts,
          t(locale, "teacher.review.proposal.difficulty"),
          labels.studentDifficulty[proposal.studentDifficultyEstimate?.value]
        );
        const controls = createElement("div", undefined, "review-proposal__controls");
        const selectLabel = createElement("label", t(locale, "teacher.review.proposal.status"));
        const select = createElement("select");
        localized.reviewStatuses.forEach(([value, label]) => {
          const option = createElement("option", label);
          option.value = value;
          option.selected = review.status === value;
          select.append(option);
        });
        selectLabel.append(select);
        const noteLabel = createElement("label", t(locale, "teacher.review.proposal.note"));
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
    if (page) page.textContent = t(locale, "teacher.review.page", { page: proposalPage, pages: pageCount });
    const previous = center.querySelector("[data-review-proposal-previous]");
    const next = center.querySelector("[data-review-proposal-next]");
    if (previous instanceof HTMLButtonElement) previous.disabled = proposalPage <= 1;
    if (next instanceof HTMLButtonElement) next.disabled = proposalPage >= pageCount;
  };

  const renderBonuses = () => {
    const target = center.querySelector("[data-review-bonus-records]");
    if (!target) return;
    target.replaceChildren();
    const filters = bonusFilterForm instanceof HTMLFormElement
      ? Object.fromEntries(new FormData(bonusFilterForm))
      : {};
    const records = session.records.filter((record) => {
      if (record.kind !== "bonus") return false;
      const identity = attemptIdentity(record.original);
      const modeMatches = !filters.identityMode || identity.mode === filters.identityMode;
      const emailMatches = !filters.email || (
        identity.mode === "institutionalEmail" &&
        identity.email.toLocaleLowerCase("es").includes(
          String(filters.email).trim().toLocaleLowerCase("es")
        )
      );
      return modeMatches && emailMatches;
    });
    const summary = center.querySelector("[data-review-bonus-summary]");
    if (summary) {
      summary.textContent = records.length === 1
        ? t(locale, "teacher.review.attempt.one")
        : t(locale, "teacher.review.attempt.many", { count: records.length });
    }
    if (records.length === 0) {
      const row = createElement("tr");
      const cell = createElement("td", t(locale, "teacher.review.attempt.none"));
      cell.colSpan = 6;
      row.append(cell);
      target.append(row);
      return;
    }
    records.forEach((record) => {
      const attempt = record.original;
      const identity = attemptIdentity(attempt);
      const row = createElement("tr");
      appendCell(row, record.sourceFiles.join(", "));
      appendCell(row, attempt.bonusTitle);
      appendCell(row, identity.mode === "institutionalEmail"
        ? t(locale, "teacher.review.identified")
        : t(locale, "teacher.review.anonymous"));
      appendCell(row, identity.mode === "institutionalEmail" ? identity.email : "—");
      appendCell(
        row,
        `${attempt.summary.pointsEarned} / ${attempt.summary.pointsPossible} (${new Intl.NumberFormat(LOCALES[locale].intlLocale, { maximumFractionDigits: 1 }).format(attempt.summary.percentage)} %)`
      );
      appendCell(row, formatDate(attempt.completedAt, locale));
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
        appendCell(row, t(locale, `teacher.review.incident.${incident.status}`), { status: incident.status });
        const reason = appendCell(row, t(locale, `teacher.review.reason.${incident.reasonCode}`));
        if (incident.status === "warning" && incident.key) {
          const record = session.records.find((item) => item.key === incident.key);
          if (record) {
            const details = createElement("details");
            details.append(createElement("summary", t(locale, "teacher.review.sameId")));
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
    if (page) page.textContent = t(locale, "teacher.review.page", { page: incidentPage, pages: pageCount });
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
    if (label) label.textContent = hasFiles
      ? t(locale, "teacher.review.addFiles")
      : t(locale, "teacher.review.selectFiles");
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
    announce(files.length === 1
      ? t(locale, "teacher.review.reading.one")
      : t(locale, "teacher.review.reading.many", { count: files.length }));
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
    announce(latest === 1
      ? t(locale, "teacher.review.processed.one")
      : t(locale, "teacher.review.processed.many", { count: latest }));
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
  bonusFilterForm?.addEventListener("input", renderBonuses);
  center.querySelector("[data-review-bonus-reset]")?.addEventListener("click", () => {
    if (bonusFilterForm instanceof HTMLFormElement) bonusFilterForm.reset();
    renderBonuses();
  });
  center.querySelector("[data-review-filter-reset]")?.addEventListener("click", () => {
    if (filterForm instanceof HTMLFormElement) filterForm.reset();
    if (bonusFilterForm instanceof HTMLFormElement) bonusFilterForm.reset();
    responsePage = 1;
    renderResponses();
    renderBonuses();
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
    announce(t(locale, "teacher.review.cleared"));
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
          createElement("h3", `${index + 1}. ${labels.activity[response.activityType]}`),
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
          announce(t(locale, "teacher.review.printing"));
          window.print();
          return;
        }
        const exporters = {
          txt: [(value) => toReviewText(value, locale), "text/plain;charset=utf-8"],
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
        announce(t(locale, "teacher.review.exported", { format: action.toUpperCase() }));
      } catch {
        announce(t(locale, "teacher.review.exportError"));
      }
    });
  });

  render();
};

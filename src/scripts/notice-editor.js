import {
  createNoticeDraft,
  createNoticePack,
  noticeHrefForRender,
  noticePackFilename,
  toNoticePackJSON,
  validateNotice,
  validateNoticePack,
} from "../utils/notices.js";
import { SITE } from "../data/site.js";
import { withBase } from "../utils/paths.js";
import { downloadLocalFile } from "./local-export.js";

const fieldValue = (form, name) => String(form.elements.namedItem(name)?.value ?? "").trim();
const create = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};

const readDraft = (form, id) => createNoticeDraft({
  title: fieldValue(form, "title"),
  summary: fieldValue(form, "summary"),
  content: fieldValue(form, "content"),
  category: fieldValue(form, "category"),
  publishedAt: fieldValue(form, "publishedAt"),
  featured: form.elements.namedItem("featured")?.checked === true,
  href: fieldValue(form, "href"),
}, { id });

const renderErrors = (target, errors) => {
  target.replaceChildren();
  if (errors.length === 0) return;
  target.append(create("strong", "Revisa estos campos:"));
  const list = create("ul");
  errors.forEach((error) => list.append(create("li", error)));
  target.append(list);
};

const renderPreview = (panel, notice) => {
  const card = panel.querySelector("[data-notice-preview-card]");
  if (!(card instanceof HTMLElement)) return;
  card.replaceChildren();

  const meta = create("div", undefined, "notice-meta");
  meta.append(create("span", notice.category));
  const time = create("time", new Date(`${notice.publishedAt}T00:00:00`).toLocaleDateString(SITE.locale, {
    day: "2-digit", month: "long", year: "numeric",
  }));
  time.dateTime = notice.publishedAt;
  meta.append(time);

  const heading = create("div", undefined, "notice-entry__heading");
  const title = create("h3", notice.title);
  title.id = "notice-editor-preview-card-title";
  heading.append(title);
  if (notice.featured) heading.append(create("span", "Destacado", "status-label status-label--featured"));

  card.setAttribute("aria-labelledby", title.id);
  card.append(meta, heading, create("p", notice.summary));
  const content = create("p", notice.content, "notice-entry__content");
  card.append(content);

  const href = noticeHrefForRender(notice.href, withBase);
  if (href) {
    const link = create("a", "Consultar información →", "text-link");
    link.href = href;
    if (href.startsWith("https://")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    card.append(link);
  }
  panel.hidden = false;
  panel.querySelector("h2")?.focus({ preventScroll: true });
};

export const initializeNoticeEditor = () => {
  const root = document.querySelector("[data-notice-editor]");
  if (!(root instanceof HTMLElement) || root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";
  const form = root.querySelector("[data-notice-form]");
  const errors = root.querySelector("[data-notice-errors]");
  const preview = root.querySelector("[data-notice-preview]");
  const list = root.querySelector("[data-notice-pack-list]");
  const empty = root.querySelector("[data-notice-pack-empty]");
  const exportButton = root.querySelector("[data-export-notice-pack]");
  const status = root.querySelector("[data-notice-status]");
  if (!(form instanceof HTMLFormElement) || !(errors instanceof HTMLElement) ||
      !(preview instanceof HTMLElement) || !(list instanceof HTMLElement)) return;

  let notices = [];
  let currentId;
  let idDate;

  const currentDraft = () => {
    const date = fieldValue(form, "publishedAt");
    if (!currentId || idDate !== date) {
      currentId = undefined;
      idDate = date;
    }
    const draft = readDraft(form, currentId);
    currentId = draft.id;
    return draft;
  };

  const validateCurrent = () => {
    try {
      const notice = currentDraft();
      const validation = validateNotice(notice, { existingIds: notices.map((entry) => entry.id) });
      renderErrors(errors, validation.errors);
      return { ...validation, notice };
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible preparar el aviso.";
      renderErrors(errors, [message]);
      return { valid: false, notice: null };
    }
  };

  const renderPack = () => {
    list.replaceChildren();
    notices.forEach((notice, index) => {
      const item = create("li");
      item.append(create("span", `${notice.title} · ${notice.category}`));
      const remove = create("button", "Quitar");
      remove.type = "button";
      remove.addEventListener("click", () => {
        notices = notices.filter((_, noticeIndex) => noticeIndex !== index);
        renderPack();
      });
      item.append(remove);
      list.append(item);
    });
    if (empty instanceof HTMLElement) empty.hidden = notices.length > 0;
    if (exportButton instanceof HTMLButtonElement) exportButton.disabled = notices.length === 0;
  };

  root.querySelector("[data-preview-notice]")?.addEventListener("click", () => {
    const result = validateCurrent();
    if (result.valid) renderPreview(preview, result.notice);
  });
  root.querySelector("[data-add-notice]")?.addEventListener("click", () => {
    const result = validateCurrent();
    if (!result.valid) return;
    renderPreview(preview, result.notice);
    notices = [...notices, result.notice];
    renderPack();
    currentId = undefined;
    if (status) status.textContent = "Aviso añadido como borrador al paquete local.";
  });
  exportButton?.addEventListener("click", () => {
    const pack = createNoticePack(notices);
    const validation = validateNoticePack(pack);
    if (!validation.valid) {
      renderErrors(errors, validation.errors);
      return;
    }
    downloadLocalFile({
      contents: toNoticePackJSON(pack),
      mimeType: "application/json;charset=utf-8",
      filename: noticePackFilename(pack),
    });
    if (status) status.textContent = "Paquete preparado para descargar. No se publicó ni se envió.";
  });
  renderPack();
};

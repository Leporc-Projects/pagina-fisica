import {
  normalizeContentScope,
  validateContentScope,
} from "./content-scope.js";
import { DEFAULT_LOCALE, isSupportedLocale } from "../i18n/config.js";

export const NOTICE_SCHEMA_VERSION = "3.0.0";
export const NOTICE_PACK_SCHEMA_VERSION = "3.0.0";
export const NOTICE_STATUSES = ["draft", "review", "published", "archived"];
export const NOTICE_CATEGORIES = [
  "Curso",
  "Evaluación",
  "Material",
  "Horario",
  "General",
];

const validText = (value) => typeof value === "string" && value.trim().length > 0;
const hasControlCharacters = (value) => /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value);
const hasHtmlMarkup = (value) => /<\s*\/?\s*[a-z][^>]*>/iu.test(value) || /<!--|-->/u.test(value);
const bytesToHex = (bytes) => [...bytes]
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("");

export const isIsoDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
};

export const validateNoticeHref = (href) => {
  if (href === undefined || href === null || href === "") {
    return { valid: true, kind: "none", value: undefined };
  }
  if (typeof href !== "string" || href !== href.trim() || hasControlCharacters(href)) {
    return { valid: false, error: "El enlace contiene caracteres no permitidos." };
  }
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) {
    return { valid: true, kind: "internal", value: href };
  }
  try {
    const url = new URL(href);
    if (url.protocol !== "https:") {
      return { valid: false, error: "Los enlaces externos deben usar HTTPS." };
    }
    return { valid: true, kind: "external", value: url.href };
  } catch {
    return { valid: false, error: "El enlace no es una ruta interna ni una URL HTTPS válida." };
  }
};

export const noticeHrefForRender = (href, baseResolver) => {
  const validation = validateNoticeHref(href);
  if (!validation.valid || validation.kind === "none") return undefined;
  return validation.kind === "internal" ? baseResolver(validation.value) : validation.value;
};

export const createNoticeId = (
  publishedAt,
  cryptoApi = globalThis.crypto
) => {
  if (!isIsoDate(publishedAt)) throw new TypeError("La fecha del aviso debe ser ISO.");
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("No está disponible la generación criptográfica del ID.");
  }
  return `notice-${publishedAt}-${bytesToHex(cryptoApi.getRandomValues(new Uint8Array(6)))}`;
};

export const createNoticeDraft = (
  fields,
  { cryptoApi = globalThis.crypto, id } = {}
) => normalizeNotice({
  ...fields,
  id: id ?? createNoticeId(String(fields?.publishedAt ?? "").trim(), cryptoApi),
  version: 1,
  status: "draft",
});

export const normalizeNotice = (notice, { status = notice?.status ?? "draft" } = {}) => ({
  schemaVersion: NOTICE_SCHEMA_VERSION,
  id: String(notice?.id ?? "").trim(),
  version: Number.isInteger(notice?.version) ? notice.version : 1,
  locale: String(notice?.locale ?? DEFAULT_LOCALE).trim(),
  scope: normalizeContentScope(notice?.scope),
  title: String(notice?.title ?? "").trim(),
  summary: String(notice?.summary ?? "").trim(),
  content: String(notice?.content ?? "").trim(),
  category: String(notice?.category ?? "").trim(),
  publishedAt: String(notice?.publishedAt ?? "").trim(),
  featured: notice?.featured === true,
  ...(String(notice?.href ?? "").trim() ? { href: String(notice.href).trim() } : {}),
  status,
});

export const validateNotice = (notice, { existingIds = [] } = {}) => {
  const errors = [];
  const issues = [];
  const require = (condition, code, message, path = code) => {
    if (!condition) { issues.push({ code, path, params: {} }); errors.push(message); }
  };
  require(notice?.schemaVersion === NOTICE_SCHEMA_VERSION, "invalid-schema", "schemaVersion de aviso inválida.", "schemaVersion");
  require(/^notice-\d{4}-\d{2}-\d{2}-[0-9a-f]{12}$/.test(notice?.id ?? ""), "invalid-id", "ID de aviso inválido.", "id");
  require(!new Set(existingIds).has(notice?.id), "duplicate-id", "El ID del aviso ya existe.", "id");
  require(Number.isInteger(notice?.version) && notice.version >= 1, "invalid-version", "La versión debe ser un entero positivo.", "version");
  require(isSupportedLocale(notice?.locale), "invalid-locale", "El locale del aviso no está soportado.", "locale");
  const scopeValidation = validateContentScope(notice?.scope);
  scopeValidation.errors.forEach((error) => errors.push(`Ámbito: ${error}`));
  if (!scopeValidation.valid) issues.push({ code: "invalid-scope", path: "scope", params: {} });
  require(validText(notice?.title), "missing-title", "Falta el título.", "title");
  require(validText(notice?.summary), "missing-summary", "Falta el resumen.", "summary");
  require(validText(notice?.content), "missing-content", "Falta el contenido.", "content");
  require(NOTICE_CATEGORIES.includes(notice?.category), "invalid-category", "La categoría no está permitida.", "category");
  require(isIsoDate(notice?.publishedAt), "invalid-date", "publishedAt debe ser una fecha ISO válida (AAAA-MM-DD).", "publishedAt");
  require(typeof notice?.featured === "boolean", "invalid-featured", "featured debe ser booleano.", "featured");
  require(NOTICE_STATUSES.includes(notice?.status), "invalid-status", "El estado editorial no está permitido.", "status");
  ["title", "summary", "content"].forEach((field) => {
    const entry = notice?.[field];
    require(typeof entry !== "string" || !hasControlCharacters(entry), "control-characters", `${field} contiene caracteres de control.`, field);
    require(typeof entry !== "string" || !hasHtmlMarkup(entry), "html-not-allowed", `${field} no admite HTML.`, field);
  });
  const hrefValidation = validateNoticeHref(notice?.href);
  require(hrefValidation.valid, "invalid-href", hrefValidation.error ?? "El enlace no es válido.", "href");
  return { valid: errors.length === 0, errors, issues };
};

export const sortNoticesByDate = (notices) => [...notices].sort((first, second) =>
  second.publishedAt.localeCompare(first.publishedAt) || first.id.localeCompare(second.id)
);

export const selectHomepageNotices = (notices, limit = 3) => {
  const sorted = sortNoticesByDate(notices);
  const unique = [...new Map(sorted.map((notice) => [notice.id, notice])).values()];
  return [
    ...unique.filter((notice) => notice.featured),
    ...unique.filter((notice) => !notice.featured),
  ].slice(0, Number.isInteger(limit) ? Math.max(0, limit) : 0);
};

export const createNoticePack = (
  notices,
  {
    cryptoApi = globalThis.crypto,
    createdAt = new Date().toISOString(),
  } = {}
) => {
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("No está disponible la generación criptográfica del paquete.");
  }
  return {
    schemaVersion: NOTICE_PACK_SCHEMA_VERSION,
    packageId: `notice-pack-${bytesToHex(cryptoApi.getRandomValues(new Uint8Array(8)))}`,
    createdAt,
    source: "teacher",
    notices: notices.map((notice) => normalizeNotice(notice, { status: "draft" })),
  };
};

export const validateNoticePack = (pack, { existingIds = [] } = {}) => {
  const errors = [];
  const issues = [];
  const require = (condition, code, message, path = code) => { if (!condition) { issues.push({ code, path, params: {} }); errors.push(message); } };
  const isLegacyPack = typeof pack?.schemaVersion === "string" && /^[12](?:\.|$)/.test(pack.schemaVersion);
  require(
    pack?.schemaVersion === NOTICE_PACK_SCHEMA_VERSION,
    isLegacyPack ? "legacy-pack-schema" : "invalid-pack-schema",
    isLegacyPack
      ? "Los paquetes anteriores a 3.x no son compatibles: deben regenerarse con ámbito y locale explícitos."
      : "schemaVersion de paquete inválida.",
    "schemaVersion"
  );
  require(/^notice-pack-[0-9a-f]{16}$/.test(pack?.packageId ?? ""), "invalid-package-id", "packageId inválido.", "packageId");
  const createdDate = new Date(pack?.createdAt);
  require(validText(pack?.createdAt) && !Number.isNaN(createdDate.valueOf()) &&
    createdDate.toISOString() === pack.createdAt, "invalid-created-at", "createdAt debe usar ISO 8601.", "createdAt");
  require(pack?.source === "teacher", "invalid-source", "La fuente del paquete debe ser teacher.", "source");
  require(Array.isArray(pack?.notices) && pack.notices.length > 0, "empty-pack", "El paquete no contiene avisos.", "notices");
  const ids = Array.isArray(pack?.notices)
    ? pack.notices.map((notice) => notice.id)
    : [];
  require(new Set(ids).size === ids.length, "duplicate-pack-ids", "El paquete contiene IDs duplicados.", "notices");
  if (Array.isArray(pack?.notices)) pack.notices.forEach((notice, index) => {
    const validation = validateNotice(notice, { existingIds });
    validation.errors.forEach((error) => errors.push(`Aviso ${index + 1}: ${error}`));
    validation.issues.forEach((entry) => issues.push({ ...entry, path: `notices.${index}.${entry.path}` }));
    require(notice?.status === "draft", "invalid-pack-status", `Aviso ${index + 1}: el paquete solo admite estado draft.`, `notices.${index}.status`);
  });
  return { valid: errors.length === 0, errors, issues };
};

export const mergeNoticePack = (pack, currentNotices) => {
  if (!Array.isArray(currentNotices)) throw new TypeError("El almacenamiento de avisos debe ser una lista.");
  const validation = validateNoticePack(pack, {
    existingIds: currentNotices.map((notice) => notice.id),
  });
  if (!validation.valid) throw new TypeError(validation.errors.join(" "));
  const imported = pack.notices.map((notice) => normalizeNotice(notice, { status: "review" }));
  return { notices: [...currentNotices, ...imported], imported, packageId: pack.packageId };
};

export const noticePackFilename = (pack) =>
  `aula-fisica-notice-pack-${pack.createdAt.slice(0, 10)}-${pack.packageId.slice(-8)}.json`;

export const toNoticePackJSON = (pack) => `${JSON.stringify(pack, null, 2)}\n`;

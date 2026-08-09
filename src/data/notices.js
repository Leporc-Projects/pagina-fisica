// Adaptador editorial de avisos. Los consumidores usan estas consultas y no
// dependen de que el almacenamiento actual sea un archivo JSON.
import storedNotices from "./notices.json" with { type: "json" };
import {
  selectHomepageNotices,
  sortNoticesByDate,
} from "../utils/notices.js";

export const NOTICES = storedNotices;

export const getPublishedNotices = (notices = NOTICES) =>
  sortNoticesByDate(notices.filter((notice) => notice.status === "published"));

export const getHomepageNotices = (limit = 3, notices = NOTICES) =>
  selectHomepageNotices(getPublishedNotices(notices), limit);

// Adaptador editorial de avisos. Los consumidores usan estas consultas y no
// dependen de que el almacenamiento actual sea un archivo JSON.
import storedNotices from "./notices.json" with { type: "json" };
import {
  selectHomepageNotices,
  sortNoticesByDate,
} from "../utils/notices.js";
import { validateContentScope } from "../utils/content-scope.js";
import { getActiveCourses, getCourseById } from "./courses.js";

export const NOTICES = storedNotices;

export const getPublishedNotices = (notices = NOTICES) =>
  sortNoticesByDate(notices.filter((notice) => notice.status === "published"));

export const getGlobalNotices = (notices = NOTICES) =>
  getPublishedNotices(notices).filter(
    (notice) => validateContentScope(notice.scope).valid && notice.scope.type === "global"
  );

export const getCourseNotices = (courseId, notices = NOTICES) => {
  if (!getCourseById(courseId)) {
    throw new RangeError(`Curso no registrado: ${String(courseId)}`);
  }

  return getPublishedNotices(notices).filter(
    (notice) => validateContentScope(notice.scope).valid &&
      notice.scope.type === "course" &&
      notice.scope.courseId === courseId
  );
};

export const getHomepageNotices = (limit = 3, notices = NOTICES) =>
  selectHomepageNotices(
    getPublishedNotices(notices).filter((notice) => {
      if (!validateContentScope(notice.scope).valid) return false;
      if (notice.scope?.type === "global") return true;
      if (notice.scope?.type !== "course") return false;
      return getActiveCourses().some((course) => course.id === notice.scope.courseId);
    }),
    Math.min(3, Number.isInteger(limit) ? limit : 0)
  );

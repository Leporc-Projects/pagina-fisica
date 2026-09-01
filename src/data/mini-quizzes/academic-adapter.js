import { localizeCourseData } from "../course-localize.js";
import { getAcademicUnitAdapter } from "../physics/index.js";
import { createMiniQuizRuntimeConfig } from "./runtime-config.js";

const courseRuntime = (locale) => {
  const course = localizeCourseData(locale).COURSE;
  return { code: course.code, slug: "fisica-basica-1", title: course.name };
};

export const createAcademicMiniQuizRuntime = (
  unitNumber,
  locale,
  { familyAdapterId = `unit-${unitNumber}` } = {},
) => {
  const adapter = getAcademicUnitAdapter(unitNumber);
  if (!adapter) throw new RangeError(`No existe adaptador académico para la Unidad ${unitNumber}.`);
  const unit = adapter.localizeUnit(locale);
  const content = adapter.getContent(locale);
  const topics = unit.topics.map((topic) => ({
    id: topic.slug,
    title: topic.title,
    shortTitle: topic.shortTitle,
    route: topic.route,
  }));
  const topicMap = new Map(topics.map((topic) => [topic.id, topic]));
  const subtopics = Object.entries(content).flatMap(([topicId, topicContent]) =>
    topicContent.sections.map((section) => ({
      id: `${topicId}:${section.id}`,
      topicId,
      subtopicId: section.id,
      title: section.title,
      route: `${topicMap.get(topicId)?.route ?? unit.route}#${section.id}`,
    })),
  );
  const subtopicMap = new Map(subtopics.map((subtopic) => [subtopic.id, subtopic]));
  const commonErrors = adapter.getErrors(unit.topics.map((topic) => topic.slug), locale)
    .map((error) => {
      const subtopic = subtopicMap.get(`${error.topic}:${error.subtopic}`);
      const topic = topicMap.get(error.topic);
      return {
        id: error.id,
        title: subtopic?.title ?? topic?.title ?? error.description,
        route: subtopic?.route ?? topic?.route ?? unit.route,
        topicId: error.topic,
        subtopicId: error.subtopic,
      };
    });

  return createMiniQuizRuntimeConfig({
    locale,
    course: courseRuntime(locale),
    unit: { number: unit.number, slug: unit.slug, title: unit.title, route: unit.route },
    familyAdapterId,
    topics,
    subtopics,
    commonErrors,
  });
};

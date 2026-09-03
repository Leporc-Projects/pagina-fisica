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
  { familyAdapterId = `unit-${unitNumber}`, supportsRetake = true } = {},
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
  const errorTopicOwners = new Map();
  const subtopics = Object.entries(content).flatMap(([topicId, topicContent]) => {
    (topicContent.errorTopics ?? [topicId]).forEach((errorTopic) => {
      const owners = errorTopicOwners.get(errorTopic) ?? [];
      errorTopicOwners.set(errorTopic, [...owners, topicId]);
    });
    return topicContent.sections.map((section) => ({
      id: `${topicId}:${section.id}`,
      topicId,
      subtopicId: section.id,
      title: section.title,
      route: `${topicMap.get(topicId)?.route ?? unit.route}#${section.id}`,
    }));
  });
  const subtopicMap = new Map(subtopics.map((subtopic) => [subtopic.id, subtopic]));
  const commonErrors = adapter.getErrors([...errorTopicOwners.keys()], locale)
    .map((error) => {
      const topicId = (errorTopicOwners.get(error.topic) ?? [])
        .find((candidate) => subtopicMap.has(`${candidate}:${error.subtopic}`))
        ?? errorTopicOwners.get(error.topic)?.[0]
        ?? error.topic;
      const subtopic = subtopicMap.get(`${topicId}:${error.subtopic}`);
      const topic = topicMap.get(topicId);
      return {
        id: error.id,
        title: subtopic?.title ?? topic?.title ?? error.description,
        route: subtopic?.route ?? topic?.route ?? unit.route,
        topicId,
        subtopicId: error.subtopic,
      };
    });

  return createMiniQuizRuntimeConfig({
    locale,
    course: courseRuntime(locale),
    unit: { number: unit.number, slug: unit.slug, title: unit.title, route: unit.route },
    familyAdapterId,
    capabilities: { retake: supportsRetake },
    topics,
    subtopics,
    commonErrors,
  });
};

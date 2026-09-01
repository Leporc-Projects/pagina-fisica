export const getMiniQuizNavigationState = ({ currentIndex, questionCount, completed = false }) => {
  if (!Number.isInteger(currentIndex) || !Number.isInteger(questionCount) || questionCount < 1 || currentIndex < 0 || currentIndex >= questionCount) {
    throw new RangeError("Estado de navegación de Mini Quiz inválido.");
  }
  const lastQuestion = currentIndex === questionCount - 1;
  return Object.freeze({
    lastQuestion,
    showNext: !lastQuestion,
    reviewLabelKey: lastQuestion && !completed ? "bonus.finish" : "bonus.reviewAttempt",
    mode: lastQuestion ? "last" : "intermediate",
  });
};

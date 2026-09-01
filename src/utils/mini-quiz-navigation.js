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

export const createMiniQuizStartGuard = (setPending = () => {}) => {
  if (typeof setPending !== "function") throw new TypeError("El indicador de inicio debe ser una función.");
  let pending = false;

  return async (start) => {
    if (pending) return false;
    if (typeof start !== "function") throw new TypeError("El inicio de Mini Quiz debe ser una función.");
    pending = true;
    try {
      setPending(true);
      await start();
      return true;
    } finally {
      pending = false;
      setPending(false);
    }
  };
};

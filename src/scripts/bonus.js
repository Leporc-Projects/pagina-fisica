import {
  bonusCompactSummary,
  bonusFilename,
  bonusQuestionResponseText,
  completeBonusAttempt,
  createBonusAttempt,
  formatBonusPercentage,
  formatBonusPoints,
  parseBonusNumber,
  selectBonusQuestions,
  toBonusCSV,
  toBonusJSON,
  toBonusText,
} from "../utils/bonus.js";
import { withBase } from "../utils/paths.js";
import { copyLocalText, downloadLocalFile } from "./local-export.js";

const createElement = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};

export const initializeBonus = () => {
  const app = document.querySelector("[data-bonus-app]");
  if (!(app instanceof HTMLElement) || app.dataset.initialized === "true") return;
  app.dataset.initialized = "true";

  const dataElement = app.querySelector("[data-bonus-data]");
  if (!(dataElement instanceof HTMLScriptElement)) return;

  let data;
  try {
    data = JSON.parse(dataElement.textContent ?? "");
  } catch {
    return;
  }

  const bonus = data.bonus;
  const pool = data.exercises;
  const exerciseMap = new Map(pool.map((exercise) => [exercise.id, exercise]));
  const questionElements = new Map(
    [...app.querySelectorAll("[data-bonus-question]")]
      .filter((element) => element instanceof HTMLElement)
      .map((element) => [element.dataset.exerciseId, element])
  );
  const introduction = app.querySelector("[data-bonus-introduction]");
  const session = app.querySelector("[data-bonus-session]");
  const reviewPanel = app.querySelector("[data-bonus-review-panel]");
  const resultPanel = app.querySelector("[data-bonus-result]");
  const status = app.querySelector("[data-bonus-status]");
  const nav = app.querySelector("[data-question-nav]");
  const progress = app.querySelector("[data-bonus-progress]");
  const previous = app.querySelector("[data-question-previous]");
  const next = app.querySelector("[data-question-next]");
  const backToResult = app.querySelector("[data-back-to-result]");
  let attempt = null;
  let completedAttempt = null;
  let selections = [];
  let responses = {};
  let currentIndex = 0;

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  const selectedQuestion = (index = currentIndex) => attempt?.questions[index];

  const rawResponseFor = (exerciseId) => {
    const exercise = exerciseMap.get(exerciseId);
    const question = questionElements.get(exerciseId);
    if (!exercise || !question) return null;

    if (exercise.interaction.kind === "singleChoice") {
      const checked = question.querySelector("[data-bonus-response]:checked");
      return checked instanceof HTMLInputElement ? checked.value : null;
    }

    if (exercise.interaction.kind === "number") {
      const input = question.querySelector("[data-bonus-response]");
      return input instanceof HTMLInputElement ? input.value : "";
    }

    return [...question.querySelectorAll("[data-bonus-response]")]
      .filter((input) => input instanceof HTMLInputElement)
      .map((input) => ({ fieldId: input.dataset.fieldId, raw: input.value }));
  };

  const validateNumericInputs = (question) => {
    let valid = true;
    question.querySelectorAll("[data-bonus-response][inputmode='decimal']")
      .forEach((control) => {
        if (!(control instanceof HTMLInputElement)) return;
        const raw = control.value.trim();
        const invalid = raw !== "" && parseBonusNumber(raw) === null;
        control.setAttribute("aria-invalid", String(invalid));
        const field = control.closest(".bonus-number-field");
        const error = field?.querySelector("[data-field-error]");
        if (error) {
          error.textContent = invalid
            ? "Escribe un número con coma o punto, notación científica o una fracción simple."
            : "";
        }
        if (invalid) valid = false;
      });
    return valid;
  };

  const captureResponse = (exerciseId) => {
    const question = questionElements.get(exerciseId);
    if (!question || completedAttempt) return;
    responses = { ...responses, [exerciseId]: rawResponseFor(exerciseId) };
    validateNumericInputs(question);
  };

  const responseStatus = (question) => {
    const element = questionElements.get(question.exerciseId);
    if (element && !validateNumericInputs(element)) return "invalid";
    const response = responses[question.exerciseId];
    if (response === null || response === undefined || response === "") return "unanswered";
    if (Array.isArray(response) && response.every((item) => item.raw.trim() === "")) {
      return "unanswered";
    }
    return "answered";
  };

  const statusLabel = (question) => {
    if (completedAttempt) {
      const graded = completedAttempt.questions.find(
        (item) => item.exerciseId === question.exerciseId
      );
      if (!graded?.answered) return "Sin respuesta";
      if (graded.correct) return "Correcta";
      if (graded.pointsEarned > 0) return "Parcial";
      return "Incorrecta";
    }
    const state = responseStatus(question);
    if (state === "invalid") return "Revisar formato";
    return state === "answered" ? "Respondida" : "Sin responder";
  };

  const answeredCount = () => attempt?.questions.filter(
    (question) => responseStatus(question) === "answered"
  ).length ?? 0;

  const renderNav = () => {
    if (!nav || !attempt) return;
    nav.replaceChildren();
    attempt.questions.forEach((question, index) => {
      const button = createElement("button");
      button.type = "button";
      button.dataset.questionIndex = String(index);
      button.dataset.state = completedAttempt
        ? (completedAttempt.questions[index].correct ? "correct" : "incorrect")
        : responseStatus(question);
      if (index === currentIndex) {
        button.dataset.current = "true";
        button.setAttribute("aria-current", "step");
      }
      const number = createElement("span", String(index + 1), "bonus-question-nav__number");
      const label = createElement("span", statusLabel(question), "bonus-question-nav__state");
      button.append(number, label);
      button.setAttribute(
        "aria-label",
        `Pregunta ${index + 1}: ${statusLabel(question)}${index === currentIndex ? ", actual" : ""}`
      );
      button.addEventListener("click", () => showQuestion(index));
      nav.append(button);
    });
  };

  const updateProgress = () => {
    if (!attempt || !progress) return;
    progress.textContent = completedAttempt
      ? `Revisión · pregunta ${currentIndex + 1} de ${attempt.questions.length}`
      : `Pregunta ${currentIndex + 1} de ${attempt.questions.length} · ${answeredCount()} respondidas`;
  };

  const showQuestion = (index, { focus = true } = {}) => {
    if (!attempt || index < 0 || index >= attempt.questions.length) return;
    const active = selectedQuestion();
    if (active && !completedAttempt) captureResponse(active.exerciseId);
    currentIndex = index;
    attempt.questions.forEach((question, questionIndex) => {
      const element = questionElements.get(question.exerciseId);
      if (element) element.hidden = questionIndex !== currentIndex;
    });
    if (previous instanceof HTMLButtonElement) previous.disabled = currentIndex === 0;
    if (next instanceof HTMLButtonElement) {
      next.disabled = currentIndex === attempt.questions.length - 1;
    }
    renderNav();
    updateProgress();
    if (focus) {
      const title = questionElements.get(selectedQuestion()?.exerciseId)
        ?.querySelector("h2");
      if (title instanceof HTMLElement) title.focus({ preventScroll: true });
    }
  };

  const reorderOptions = (question, optionOrder) => {
    const element = questionElements.get(question.exerciseId);
    const container = element?.querySelector("[data-bonus-options]");
    if (!container || !Array.isArray(optionOrder)) return;
    const options = new Map(
      [...container.querySelectorAll("[data-option-id]")]
        .map((option) => [option.dataset.optionId, option])
    );
    optionOrder.forEach((optionId) => {
      const option = options.get(optionId);
      if (option) container.append(option);
    });
  };

  const resetQuestionElements = () => {
    questionElements.forEach((question) => {
      question.hidden = true;
      delete question.dataset.selected;
      question.querySelectorAll("[data-bonus-response]").forEach((control) => {
        if (!(control instanceof HTMLInputElement)) return;
        control.disabled = false;
        control.checked = false;
        control.value = control.type === "radio" ? control.value : "";
        control.removeAttribute("aria-invalid");
      });
      question.querySelectorAll("[data-field-error]").forEach((error) => {
        error.textContent = "";
      });
      const feedback = question.querySelector("[data-question-feedback]");
      if (feedback instanceof HTMLElement) feedback.hidden = true;
      const solution = question.querySelector("[data-feedback-solution]");
      if (solution instanceof HTMLDetailsElement) solution.open = false;
    });
  };

  const startAttempt = () => {
    try {
      selections = selectBonusQuestions(bonus, pool);
      attempt = createBonusAttempt(bonus, selections);
    } catch (error) {
      announce(error instanceof Error ? error.message : "No fue posible iniciar el Bono.");
      return;
    }

    responses = {};
    completedAttempt = null;
    currentIndex = 0;
    app.dataset.completed = "false";
    app.classList.remove("is-reviewing-results");
    resetQuestionElements();
    attempt.questions.forEach((question, index) => {
      const element = questionElements.get(question.exerciseId);
      if (!element) return;
      element.dataset.selected = "true";
      const counter = element.querySelector("[data-question-counter]");
      if (counter) counter.textContent = `Pregunta ${index + 1} de ${attempt.questions.length}`;
      reorderOptions(question, question.optionOrder);
    });

    if (introduction instanceof HTMLElement) introduction.hidden = true;
    if (reviewPanel instanceof HTMLElement) reviewPanel.hidden = true;
    if (resultPanel instanceof HTMLElement) resultPanel.hidden = true;
    if (session instanceof HTMLElement) session.hidden = false;
    if (backToResult instanceof HTMLButtonElement) backToResult.hidden = true;
    showQuestion(0);
    announce("Bono iniciado. El intento permanece local y no se ha enviado.");
  };

  const renderReview = () => {
    if (!attempt) return;
    const active = selectedQuestion();
    if (active) captureResponse(active.exerciseId);
    if (session instanceof HTMLElement) session.hidden = true;
    if (resultPanel instanceof HTMLElement) resultPanel.hidden = true;
    if (reviewPanel instanceof HTMLElement) reviewPanel.hidden = false;
    const summary = app.querySelector("[data-review-summary]");
    const unanswered = attempt.questions.filter(
      (question) => responseStatus(question) === "unanswered"
    ).length;
    if (summary) {
      summary.textContent = unanswered === 0
        ? "Todas las preguntas tienen una respuesta. Puedes volver a cualquiera antes de finalizar."
        : `Quedan ${unanswered} ${unanswered === 1 ? "pregunta" : "preguntas"} sin responder.`;
    }
    const list = app.querySelector("[data-review-list]");
    if (list) {
      list.replaceChildren();
      attempt.questions.forEach((question, index) => {
        const item = createElement("li");
        const button = createElement("button");
        button.type = "button";
        button.dataset.state = responseStatus(question);
        button.append(
          createElement("span", `${index + 1}. ${question.snapshot.title}`),
          createElement("strong", statusLabel(question))
        );
        button.addEventListener("click", () => {
          if (reviewPanel instanceof HTMLElement) reviewPanel.hidden = true;
          if (session instanceof HTMLElement) session.hidden = false;
          showQuestion(index);
        });
        item.append(button);
        list.append(item);
      });
    }
    const confirmation = app.querySelector("[data-unanswered-confirmation]");
    if (confirmation instanceof HTMLElement) confirmation.hidden = true;
    const title = app.querySelector("#bonus-review-title");
    if (title instanceof HTMLElement) title.focus?.({ preventScroll: true });
    announce("Revisión del intento preparada. No se muestran respuestas correctas antes de finalizar.");
  };

  const firstInvalidQuestionIndex = () => attempt?.questions.findIndex((question) => {
    const element = questionElements.get(question.exerciseId);
    return element ? !validateNumericInputs(element) : false;
  }) ?? -1;

  const requestFinish = () => {
    if (!attempt) return;
    const invalidIndex = firstInvalidQuestionIndex();
    if (invalidIndex >= 0) {
      if (reviewPanel instanceof HTMLElement) reviewPanel.hidden = true;
      if (session instanceof HTMLElement) session.hidden = false;
      showQuestion(invalidIndex);
      const invalid = questionElements.get(selectedQuestion()?.exerciseId)
        ?.querySelector("[aria-invalid='true']");
      if (invalid instanceof HTMLElement) invalid.focus();
      announce("Revisa el formato numérico señalado antes de finalizar.");
      return;
    }
    const unanswered = attempt.questions.filter(
      (question) => responseStatus(question) === "unanswered"
    ).length;
    if (unanswered > 0) {
      const confirmation = app.querySelector("[data-unanswered-confirmation]");
      const message = app.querySelector("[data-unanswered-message]");
      if (message) {
        message.textContent = `Quedan ${unanswered} ${unanswered === 1 ? "pregunta" : "preguntas"} sin responder.`;
      }
      if (confirmation instanceof HTMLElement) confirmation.hidden = false;
      announce("Puedes volver a revisar o finalizar de todos modos.");
      return;
    }
    finishAttempt();
  };

  const renderQuestionFeedback = (question) => {
    const element = questionElements.get(question.exerciseId);
    if (!element) return;
    element.querySelectorAll("[data-bonus-response]").forEach((control) => {
      if (control instanceof HTMLInputElement) control.disabled = true;
    });
    const feedback = element.querySelector("[data-question-feedback]");
    if (feedback instanceof HTMLElement) feedback.hidden = false;
    const statusTarget = element.querySelector("[data-feedback-status]");
    const responseTarget = element.querySelector("[data-feedback-response]");
    const expectedTarget = element.querySelector("[data-feedback-expected]");
    const messageTarget = element.querySelector("[data-feedback-message]");
    const partial = question.pointsEarned > 0 && !question.correct;
    if (statusTarget) {
      statusTarget.textContent = !question.answered
        ? "Sin respuesta"
        : question.correct
          ? "Correcta"
          : partial
            ? "Parcialmente correcta"
            : "Incorrecta";
      statusTarget.dataset.result = question.correct
        ? "correct"
        : partial
          ? "partial"
          : "incorrect";
    }
    if (responseTarget) responseTarget.textContent = bonusQuestionResponseText(question);
    if (expectedTarget) expectedTarget.textContent = question.expectedResponse;
    if (messageTarget) messageTarget.textContent = question.feedback;
  };

  const renderResult = () => {
    if (!completedAttempt) return;
    const score = app.querySelector("[data-result-score]");
    if (score) {
      score.textContent = `${formatBonusPoints(completedAttempt.summary.pointsEarned)} / ${formatBonusPoints(completedAttempt.summary.pointsPossible)} puntos · ${formatBonusPercentage(completedAttempt.summary.percentage)} %`;
    }
    const id = app.querySelector("[data-result-id]");
    if (id) id.textContent = completedAttempt.attemptId;
    const date = app.querySelector("[data-result-date]");
    if (date) {
      date.textContent = new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(completedAttempt.completedAt));
    }
    const topics = app.querySelector("[data-result-topics]");
    if (topics) {
      topics.replaceChildren();
      completedAttempt.summary.byTopic.forEach((topic) => {
        const group = createElement("div");
        group.append(
          createElement("dt", topic.title),
          createElement(
            "dd",
            `${formatBonusPoints(topic.pointsEarned)} / ${formatBonusPoints(topic.pointsPossible)}`
          )
        );
        topics.append(group);
      });
    }
    const recommendations = app.querySelector("[data-result-recommendations]");
    if (recommendations) {
      recommendations.replaceChildren();
      if (completedAttempt.summary.reviewRecommendations.length === 0) {
        recommendations.append(createElement(
          "p",
          "No se detectaron errores en esta tanda. Puedes intentar otro Bono o continuar con los ejercicios abiertos."
        ));
      } else {
        recommendations.append(createElement("p", "Podría convenirte repasar:"));
        const list = createElement("ul");
        completedAttempt.summary.reviewRecommendations.forEach((item) => {
          const entry = createElement("li");
          const link = createElement("a", item.title);
          link.href = withBase(item.route);
          entry.append(link);
          list.append(entry);
        });
        recommendations.append(list);
      }
    }
  };

  const finishAttempt = () => {
    if (!attempt) return;
    const confirmation = app.querySelector("[data-unanswered-confirmation]");
    if (confirmation instanceof HTMLElement) confirmation.hidden = true;
    attempt.questions.forEach((question) => captureResponse(question.exerciseId));
    completedAttempt = completeBonusAttempt({
      attempt,
      exercises: pool,
      responses,
    });
    completedAttempt.questions.forEach(renderQuestionFeedback);
    app.dataset.completed = "true";
    renderResult();
    if (session instanceof HTMLElement) session.hidden = true;
    if (reviewPanel instanceof HTMLElement) reviewPanel.hidden = true;
    if (resultPanel instanceof HTMLElement) resultPanel.hidden = false;
    const title = app.querySelector("#bonus-result-title");
    if (title instanceof HTMLElement) title.focus({ preventScroll: true });
    announce("Resultado calculado localmente. No se ha enviado ni registrado.");
  };

  const reviewAnswers = () => {
    if (!completedAttempt) return;
    if (resultPanel instanceof HTMLElement) resultPanel.hidden = true;
    if (session instanceof HTMLElement) session.hidden = false;
    if (backToResult instanceof HTMLButtonElement) backToResult.hidden = false;
    app.classList.add("is-reviewing-results");
    currentIndex = 0;
    showQuestion(0);
    announce("Revisión de respuestas. Ya puedes ver el resultado y la solución de cada pregunta.");
  };

  const returnToResult = () => {
    if (session instanceof HTMLElement) session.hidden = true;
    if (resultPanel instanceof HTMLElement) resultPanel.hidden = false;
    app.classList.remove("is-reviewing-results");
    const title = app.querySelector("#bonus-result-title");
    if (title instanceof HTMLElement) title.focus({ preventScroll: true });
  };

  app.querySelector("[data-bonus-start]")?.addEventListener("click", startAttempt);
  previous?.addEventListener("click", () => showQuestion(currentIndex - 1));
  next?.addEventListener("click", () => showQuestion(currentIndex + 1));
  app.querySelector("[data-bonus-review]")?.addEventListener("click", renderReview);
  app.querySelector("[data-review-return]")?.addEventListener("click", () => {
    if (reviewPanel instanceof HTMLElement) reviewPanel.hidden = true;
    if (session instanceof HTMLElement) session.hidden = false;
    showQuestion(currentIndex);
  });
  app.querySelector("[data-finish-attempt]")?.addEventListener("click", requestFinish);
  app.querySelector("[data-unanswered-return]")?.addEventListener("click", () => {
    const confirmation = app.querySelector("[data-unanswered-confirmation]");
    if (confirmation instanceof HTMLElement) confirmation.hidden = true;
    announce("Puedes revisar las preguntas antes de finalizar.");
  });
  app.querySelector("[data-finish-anyway]")?.addEventListener("click", finishAttempt);
  app.querySelector("[data-review-answers]")?.addEventListener("click", reviewAnswers);
  backToResult?.addEventListener("click", returnToResult);
  app.querySelector("[data-another-attempt]")?.addEventListener("click", startAttempt);

  app.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.matches("[data-bonus-response]")) return;
    const question = target.closest("[data-bonus-question]");
    if (!(question instanceof HTMLElement) || !question.dataset.exerciseId) return;
    captureResponse(question.dataset.exerciseId);
    renderNav();
    updateProgress();
  });

  app.querySelectorAll("[data-bonus-export]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!completedAttempt || !(button instanceof HTMLButtonElement)) return;
      try {
        const action = button.dataset.bonusExport;
        if (action === "copy") {
          await copyLocalText(bonusCompactSummary(completedAttempt));
          announce("Resumen copiado al portapapeles.");
          return;
        }
        if (action === "print") {
          announce("Se abrirá el diálogo para imprimir o guardar como PDF.");
          window.print();
          return;
        }
        const exporters = {
          txt: [toBonusText, "text/plain;charset=utf-8"],
          json: [toBonusJSON, "application/json;charset=utf-8"],
          csv: [toBonusCSV, "text/csv;charset=utf-8"],
        };
        const exporter = exporters[action];
        if (!exporter) return;
        downloadLocalFile({
          contents: exporter[0](completedAttempt),
          mimeType: exporter[1],
          filename: bonusFilename(bonus, completedAttempt, action),
        });
        announce(`Archivo ${action.toUpperCase()} preparado para descargar.`);
      } catch {
        announce("El navegador no pudo completar la acción. Inténtalo de nuevo.");
      }
    });
  });
};

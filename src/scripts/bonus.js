import {
  bonusCompactSummary,
  bonusFilename,
  bonusQuestionResponseText,
  completeBonusAttempt,
  createBonusAttempt,
  formatBonusPercentage,
  formatBonusPoints,
  parseBonusNumber,
  prepareDeliveryAttempt,
  selectBonusQuestions,
  toBonusCSV,
  toBonusJSON,
  toBonusText,
} from "../utils/bonus.js";
import { loadMiniQuizFamilyAdapter } from "../data/mini-quizzes/family-adapters.js";
import { BONUS_DELIVERY_CONFIG } from "../data/delivery.js";
import { getLocaleConfig } from "../i18n/config.js";
import { t } from "../i18n/index.js";
import { withBase } from "../utils/paths.js";
import { trackMiniQuizComplete, trackMiniQuizStart } from "../utils/analytics.js";
import { createMiniQuizStartGuard, getMiniQuizNavigationState } from "../utils/mini-quiz-navigation.js";
import { copyLocalText, downloadLocalFile } from "./local-export.js";

const createElement = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};

// Los segmentos provienen exclusivamente de la capa editorial estática que el
// build serializa junto con el ítem. No se interpreta texto del estudiante.
const renderRichContent = (target, content) => {
  if (!target) return;
  if (!Array.isArray(content)) {
    target.textContent = content ?? "";
    return;
  }
  const nodes = content.map((segment) => {
    if (segment?.type !== "math") return document.createTextNode(segment?.value ?? "");
    const wrapper = createElement("span", undefined, "inline-math");
    const parsed = new DOMParser().parseFromString(segment.mathml, "application/xml");
    wrapper.append(document.importNode(parsed.documentElement, true));
    return wrapper;
  });
  target.replaceChildren(...nodes);
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
  const locale = data.locale === "en" ? "en" : "es";
  const intlLocale = getLocaleConfig(locale).intlLocale;
  const topicLabels = data.topicLabels ?? {};
  const runtime = data.runtime;
  let pool = data.exercises;
  const exerciseMap = new Map();
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
  const reviewButton = app.querySelector("[data-bonus-review]");
  const controls = app.querySelector("[data-bonus-controls]");
  const backToResult = app.querySelector("[data-back-to-result]");
  let attempt = null;
  let completedAttempt = null;
  let deliveryAttempt = null;
  let selections = [];
  let responses = {};
  let currentIndex = 0;
  let analyticsCompletedForAttempt = false;
  const seenItemIds = new Set();
  const recentParameterKeys = new Set();
  const startControls = [...app.querySelectorAll("[data-bonus-start], [data-another-attempt]")]
    .filter((control) => control instanceof HTMLButtonElement);
  const runStartAttempt = createMiniQuizStartGuard((pending) => {
    if (pending) app.setAttribute("aria-busy", "true");
    else app.removeAttribute("aria-busy");
    startControls.forEach((control) => { control.disabled = pending; });
  });

  const appendNumberField = (container, exercise, field) => {
    const wrapper = createElement("div", undefined, "bonus-number-field");
    const inputId = `${exercise.id}-${field.id}`;
    const label = createElement("label", field.label);
    label.htmlFor = inputId;
    const control = createElement("div", undefined, "bonus-number-field__control");
    const input = createElement("input");
    input.id = inputId;
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.dataset.bonusResponse = "";
    input.dataset.fieldId = field.id;
    const errorId = `${inputId}-error`;
    input.setAttribute("aria-describedby", errorId);
    control.append(input);
    if (field.unitLabel ?? field.unit) control.append(createElement("span", field.unitLabel ?? field.unit));
    const error = createElement("small", undefined, "bonus-field-error");
    error.id = errorId;
    error.dataset.fieldError = "";
    wrapper.append(label, control, error);
    container.append(wrapper);
  };

  const createGeneratedQuestion = (exercise) => {
    const article = createElement("article", undefined, "bonus-question");
    article.dataset.bonusQuestion = "";
    article.dataset.exerciseId = exercise.id;
    article.dataset.generatedQuestion = "true";
    article.hidden = true;
    const titleId = `${exercise.id}-bonus-title`;
    article.setAttribute("aria-labelledby", titleId);
    const header = createElement("header", undefined, "bonus-question__header");
    const headingGroup = createElement("div");
    const counter = createElement("p", t(locale, "bonus.question"), "bonus-question__counter");
    counter.dataset.questionCounter = "";
    const heading = createElement("h2", exercise.title);
    heading.id = titleId;
    heading.tabIndex = -1;
    headingGroup.append(counter, heading);
    header.append(
      headingGroup,
      createElement("p", topicLabels[exercise.topic] ?? exercise.topic, "bonus-question__topic")
    );
    const content = createElement("div", undefined, "bonus-question__content");
    content.append(createElement("p", exercise.prompt, "bonus-question__prompt"));
    article.append(header, content);

    if (exercise.interaction.kind === "singleChoice") {
      const fieldset = createElement("fieldset", undefined, "bonus-question__interaction bonus-question__choice");
      fieldset.append(createElement("legend", t(locale, "bonus.chooseAnswer")));
      const choices = createElement("div", undefined, "bonus-choice-list");
      choices.dataset.bonusOptions = "";
      exercise.interaction.options.forEach((option) => {
        const label = createElement("label", undefined, "bonus-choice");
        label.dataset.optionId = option.id;
        const input = createElement("input");
        input.type = "radio";
        input.name = `response-${exercise.id}`;
        input.value = option.id;
        input.dataset.bonusResponse = "";
        const marker = createElement("span", undefined, "bonus-choice__marker");
        marker.setAttribute("aria-hidden", "true");
        label.append(input, marker, createElement("span", option.content));
        choices.append(label);
      });
      fieldset.append(choices);
      article.append(fieldset);
    } else if (exercise.interaction.kind === "number") {
      const interaction = createElement("div", undefined, "bonus-question__interaction");
      appendNumberField(interaction, exercise, exercise.interaction.field);
      interaction.append(createElement("small", t(locale, "bonus.numberHelp")));
      article.append(interaction);
    } else {
      const fieldset = createElement("fieldset", undefined, "bonus-question__interaction bonus-multi-number");
      fieldset.append(createElement("legend", t(locale, "bonus.completeValues")));
      const fields = createElement("div", undefined, "bonus-multi-number__fields");
      exercise.interaction.fields.forEach((field) => appendNumberField(fields, exercise, field));
      fieldset.append(fields, createElement("small", t(locale, "bonus.numberHelp")));
      article.append(fieldset);
    }

    const feedback = createElement("section", undefined, "bonus-question__feedback");
    feedback.dataset.questionFeedback = "";
    feedback.hidden = true;
    feedback.setAttribute("aria-live", "polite");
    const feedbackStatus = createElement("p", undefined, "bonus-question__feedback-status");
    feedbackStatus.dataset.feedbackStatus = "";
    const facts = createElement("dl");
    [[t(locale, "bonus.yourAnswer"), "feedbackResponse"], [t(locale, "bonus.expectedAnswer"), "feedbackExpected"]]
      .forEach(([label, key]) => {
        const group = createElement("div");
        const value = createElement("dd");
        value.dataset[key] = "";
        group.append(createElement("dt", label), value);
        facts.append(group);
      });
    const message = createElement("p");
    message.dataset.feedbackMessage = "";
    feedback.append(feedbackStatus, facts, message);
    if (exercise.solution?.length) {
      const details = createElement("details", undefined, "bonus-question__solution");
      details.dataset.feedbackSolution = "";
      details.append(createElement("summary", t(locale, "bonus.reviewSolution")));
      const list = createElement("ol");
      exercise.solution.forEach((step) => {
        const item = createElement("li");
        item.append(createElement("strong", step.title), createElement("p", step.text));
        list.append(item);
      });
      details.append(list);
      feedback.append(details);
    }
    article.append(feedback);
    return article;
  };

  const registerGeneratedSelections = () => {
    const stage = app.querySelector("[data-question-stage]");
    if (!stage) return;
    [...stage.querySelectorAll("[data-generated-question]")].forEach((element) => {
      questionElements.delete(element.dataset.exerciseId);
      exerciseMap.delete(element.dataset.exerciseId);
      element.remove();
    });
    selections.forEach(({ exercise }) => {
      exerciseMap.set(exercise.id, exercise);
      if (exercise.itemKind !== "parameterizedInstance") return;
      const element = createGeneratedQuestion(exercise);
      stage.append(element);
      questionElements.set(exercise.id, element);
    });
  };

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
            ? t(locale, "bonus.invalidNumber")
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
      if (!graded?.answered) return t(locale, "bonus.status.unanswered");
      if (graded.correct) return t(locale, "bonus.status.correct");
      if (graded.pointsEarned > 0) return t(locale, "bonus.status.partial");
      return t(locale, "bonus.status.incorrect");
    }
    const state = responseStatus(question);
    if (state === "invalid") return t(locale, "bonus.status.format");
    return state === "answered" ? t(locale, "bonus.status.answered") : t(locale, "bonus.status.unansweredShort");
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
        `${t(locale, "bonus.question")} ${index + 1}: ${statusLabel(question)}${index === currentIndex ? `, ${t(locale, "bonus.status.current")}` : ""}`
      );
      button.addEventListener("click", () => showQuestion(index));
      nav.append(button);
    });
  };

  const updateProgress = () => {
    if (!attempt || !progress) return;
    progress.textContent = completedAttempt
      ? t(locale, "bonus.progress.review", { current: currentIndex + 1, total: attempt.questions.length })
      : t(locale, "bonus.progress.answering", { current: currentIndex + 1, total: attempt.questions.length, answered: answeredCount() });
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
    const navigation = getMiniQuizNavigationState({
      currentIndex,
      questionCount: attempt.questions.length,
      completed: Boolean(completedAttempt),
    });
    if (reviewButton instanceof HTMLButtonElement) {
      reviewButton.textContent = t(locale, navigation.reviewLabelKey);
    }
    if (controls instanceof HTMLElement) controls.dataset.navigationMode = navigation.mode;
    if (next instanceof HTMLButtonElement && controls instanceof HTMLElement) {
      if (navigation.showNext) controls.append(next);
      else next.remove();
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

  const startAttempt = () => runStartAttempt(async () => {
    const familyAdapter = await loadMiniQuizFamilyAdapter(runtime.familyAdapterId);
    pool = familyAdapter.hydrateMiniQuizPool(data.exercises);
    exerciseMap.clear();
    pool.forEach((exercise) => exerciseMap.set(exercise.id, exercise));
    selections = typeof familyAdapter.selectMiniQuizQuestions === "function"
      ? familyAdapter.selectMiniQuizQuestions({
          miniQuiz: bonus,
          pool,
          cryptoApi: globalThis.crypto,
          locale,
          seenItemIds,
          recentParameterKeys,
        })
      : selectBonusQuestions(bonus, pool, globalThis.crypto, {
          seenItemIds,
          recentParameterKeys,
          generateInstance: (family, options) => familyAdapter.generateMiniQuizFamilyInstance(family, locale, options),
        });
    selections.forEach((selection) => {
      seenItemIds.add(selection.sourceItemId);
      if (selection.parameterKey) {
        recentParameterKeys.add(`${selection.sourceItemId}:${selection.parameterKey}`);
      }
    });
    registerGeneratedSelections();
    attempt = createBonusAttempt(bonus, selections, { runtime });

    responses = {};
    analyticsCompletedForAttempt = false;
    completedAttempt = null;
    deliveryAttempt = null;
    currentIndex = 0;
    app.dataset.completed = "false";
    app.classList.remove("is-reviewing-results");
    resetQuestionElements();
    attempt.questions.forEach((question, index) => {
      const element = questionElements.get(question.exerciseId);
      if (!element) return;
      element.dataset.selected = "true";
      const counter = element.querySelector("[data-question-counter]");
      if (counter) counter.textContent = t(locale, "bonus.progress.question", { current: index + 1, total: attempt.questions.length });
      reorderOptions(question, question.optionOrder);
    });

    if (introduction instanceof HTMLElement) introduction.hidden = true;
    if (reviewPanel instanceof HTMLElement) reviewPanel.hidden = true;
    if (resultPanel instanceof HTMLElement) resultPanel.hidden = true;
    if (session instanceof HTMLElement) session.hidden = false;
    if (backToResult instanceof HTMLButtonElement) backToResult.hidden = true;
    showQuestion(0);
    trackMiniQuizStart(bonus.id, locale);
    announce(t(locale, "bonus.status.started"));
  }).catch((error) => {
    announce(locale === "es" && error instanceof Error ? error.message : t(locale, "bonus.status.startFailed"));
  });

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
        ? t(locale, "bonus.review.complete")
        : t(locale, "bonus.review.unanswered", { count: unanswered, questions: t(locale, unanswered === 1 ? "bonus.review.questionSingular" : "bonus.review.questionPlural") });
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
    announce(t(locale, "bonus.status.reviewReady"));
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
      announce(t(locale, "bonus.status.fixNumber"));
      return;
    }
    const unanswered = attempt.questions.filter(
      (question) => responseStatus(question) === "unanswered"
    ).length;
    if (unanswered > 0) {
      const confirmation = app.querySelector("[data-unanswered-confirmation]");
      const message = app.querySelector("[data-unanswered-message]");
      if (message) {
        message.textContent = t(locale, "bonus.review.unanswered", { count: unanswered, questions: t(locale, unanswered === 1 ? "bonus.review.questionSingular" : "bonus.review.questionPlural") });
      }
      if (confirmation instanceof HTMLElement) confirmation.hidden = false;
      announce(t(locale, "bonus.status.finishChoice"));
      return;
    }
    finishAttempt();
  };

  const renderQuestionFeedback = (question) => {
    const element = questionElements.get(question.exerciseId);
    if (!element) return;
    const exercise = exerciseMap.get(question.exerciseId);
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
        ? t(locale, "bonus.status.unanswered")
        : question.correct
          ? t(locale, "bonus.status.correct")
          : partial
            ? t(locale, "bonus.status.partiallyCorrect")
            : t(locale, "bonus.status.incorrect");
      statusTarget.dataset.result = question.correct
        ? "correct"
        : partial
          ? "partial"
          : "incorrect";
    }
    const selectedOptionId = question.response?.kind === "singleChoice"
      ? question.response.optionId
      : null;
    const selectedPresentation = selectedOptionId
      ? exercise?.presentation?.options?.[selectedOptionId]?.content
      : null;
    const expectedPresentation = exercise?.interaction?.kind === "singleChoice"
      ? exercise.presentation?.options?.[exercise.interaction.correctOptionId]?.content
      : null;
    const diagnosticPresentation = selectedOptionId
      ? exercise?.presentation?.options?.[selectedOptionId]?.diagnosticFeedback
      : null;
    const feedbackPresentation = question.correct
      ? exercise?.presentation?.feedback?.correct
      : diagnosticPresentation ?? exercise?.presentation?.feedback?.incorrect;
    renderRichContent(responseTarget, selectedPresentation ?? bonusQuestionResponseText(question, locale));
    renderRichContent(expectedTarget, expectedPresentation ?? question.expectedResponse);
    renderRichContent(messageTarget, feedbackPresentation ?? question.feedback);
  };

  const renderResult = () => {
    if (!completedAttempt) return;
    const score = app.querySelector("[data-result-score]");
    if (score) {
      score.textContent = t(locale, "bonus.points", { earned: formatBonusPoints(completedAttempt.summary.pointsEarned, locale), possible: formatBonusPoints(completedAttempt.summary.pointsPossible, locale), percentage: formatBonusPercentage(completedAttempt.summary.percentage, locale) });
    }
    const id = app.querySelector("[data-result-id]");
    if (id) id.textContent = completedAttempt.attemptId;
    const date = app.querySelector("[data-result-date]");
    if (date) {
      date.textContent = new Intl.DateTimeFormat(intlLocale, {
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
            `${formatBonusPoints(topic.pointsEarned, locale)} / ${formatBonusPoints(topic.pointsPossible, locale)}`
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
          t(locale, "bonus.noErrors")
        ));
      } else {
        recommendations.append(createElement("p", t(locale, "bonus.reviewRecommendation")));
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
    const deliveryForm = app.querySelector("[data-delivery-form]");
    const deliveryPrepared = app.querySelector("[data-delivery-prepared]");
    const deliveryError = app.querySelector("[data-delivery-error]");
    const emailRow = app.querySelector("[data-result-email-row]");
    if (deliveryForm instanceof HTMLFormElement) {
      deliveryForm.hidden = true;
      deliveryForm.reset();
    }
    if (deliveryPrepared instanceof HTMLElement) deliveryPrepared.hidden = true;
    if (deliveryError) deliveryError.textContent = "";
    if (emailRow instanceof HTMLElement) emailRow.hidden = true;
    deliveryAttempt = null;
  };

  const finishAttempt = () => {
    if (!attempt) return;
    const confirmation = app.querySelector("[data-unanswered-confirmation]");
    if (confirmation instanceof HTMLElement) confirmation.hidden = true;
    attempt.questions.forEach((question) => captureResponse(question.exerciseId));
    completedAttempt = completeBonusAttempt({
      attempt,
      exercises: [...exerciseMap.values()],
      responses,
      runtime,
    });
    if (!analyticsCompletedForAttempt) {
      analyticsCompletedForAttempt = true;
      trackMiniQuizComplete(bonus.id, locale);
    }
    completedAttempt.questions.forEach(renderQuestionFeedback);
    app.dataset.completed = "true";
    renderResult();
    if (session instanceof HTMLElement) session.hidden = true;
    if (reviewPanel instanceof HTMLElement) reviewPanel.hidden = true;
    if (resultPanel instanceof HTMLElement) resultPanel.hidden = false;
    const title = app.querySelector("#bonus-result-title");
    if (title instanceof HTMLElement) title.focus({ preventScroll: true });
    announce(t(locale, "bonus.status.completed"));
  };

  const reviewAnswers = () => {
    if (!completedAttempt) return;
    if (resultPanel instanceof HTMLElement) resultPanel.hidden = true;
    if (session instanceof HTMLElement) session.hidden = false;
    if (backToResult instanceof HTMLButtonElement) backToResult.hidden = false;
    app.classList.add("is-reviewing-results");
    currentIndex = 0;
    showQuestion(0);
    announce(t(locale, "bonus.status.reviewAnswers"));
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
    announce(t(locale, "bonus.status.reviewBeforeFinish"));
  });
  app.querySelector("[data-finish-anyway]")?.addEventListener("click", finishAttempt);
  app.querySelector("[data-review-answers]")?.addEventListener("click", reviewAnswers);
  backToResult?.addEventListener("click", returnToResult);
  app.querySelector("[data-another-attempt]")?.addEventListener("click", startAttempt);
  app.querySelector("[data-show-delivery]")?.addEventListener("click", () => {
    const form = app.querySelector("[data-delivery-form]");
    if (!(form instanceof HTMLFormElement)) return;
    form.hidden = false;
    const input = form.elements.namedItem("email");
    if (input instanceof HTMLInputElement) input.focus();
  });
  app.querySelector("[data-delivery-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!completedAttempt || !(event.currentTarget instanceof HTMLFormElement)) return;
    const input = event.currentTarget.elements.namedItem("email");
    const errorTarget = app.querySelector("[data-delivery-error]");
    if (!(input instanceof HTMLInputElement)) return;
    try {
      deliveryAttempt = prepareDeliveryAttempt(
        completedAttempt,
        input.value,
        BONUS_DELIVERY_CONFIG
      );
      input.setAttribute("aria-invalid", "false");
      if (errorTarget) errorTarget.textContent = "";
      const prepared = app.querySelector("[data-delivery-prepared]");
      const email = app.querySelector("[data-delivery-email]");
      if (email) email.textContent = deliveryAttempt.privacy.identity.email;
      if (prepared instanceof HTMLElement) prepared.hidden = false;
      announce(t(locale, "bonus.status.filePrepared"));
    } catch (error) {
      input.setAttribute("aria-invalid", "true");
      if (errorTarget) {
        errorTarget.textContent = error instanceof Error
          ? (locale === "es" ? error.message : t(locale, "bonus.emailInvalid"))
          : t(locale, "bonus.emailInvalid");
      }
      input.focus();
    }
  });

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
        const exportAttempt = button.dataset.exportMode === "identified"
          ? deliveryAttempt
          : completedAttempt;
        if (!exportAttempt) {
          announce(t(locale, "bonus.prepareIdentifiedFirst"));
          return;
        }
        const action = button.dataset.bonusExport;
        if (action === "copy") {
          await copyLocalText(bonusCompactSummary(exportAttempt, locale));
          announce(t(locale, "bonus.status.summaryCopied"));
          return;
        }
        if (action === "print") {
          const emailRow = app.querySelector("[data-result-email-row]");
          const emailTarget = app.querySelector("[data-result-email]");
          const identified = button.dataset.exportMode === "identified";
          if (emailRow instanceof HTMLElement) emailRow.hidden = !identified;
          if (emailTarget) {
            emailTarget.textContent = identified
              ? exportAttempt.privacy.identity.email
              : "";
          }
          announce(t(locale, "bonus.status.print"));
          window.print();
          return;
        }
        const exporters = {
          txt: [(attempt) => toBonusText(attempt, locale), "text/plain;charset=utf-8"],
          json: [toBonusJSON, "application/json;charset=utf-8"],
          csv: [(attempt) => toBonusCSV(attempt, { locale }), "text/csv;charset=utf-8"],
        };
        const exporter = exporters[action];
        if (!exporter) return;
        downloadLocalFile({
          contents: exporter[0](exportAttempt),
          mimeType: exporter[1],
          filename: bonusFilename(bonus, exportAttempt, action, locale),
        });
        announce(t(locale, "bonus.status.download", { format: action.toUpperCase() }));
      } catch {
        announce(t(locale, "bonus.status.actionFailed"));
      }
    });
  });
};

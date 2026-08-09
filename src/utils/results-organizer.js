import {
  DUPLICATE_POLICIES,
  INCIDENT_SEVERITIES,
  INCIDENT_TYPES,
  MISSING_POLICIES,
  RESULTS_LIMITS,
} from "../data/results-organizer.js";
import { attemptIdentity, validateCompletedBonusAttempt } from "./bonus.js";

const EPSILON = 1e-9;
const duplicatePolicyValues = DUPLICATE_POLICIES.map(([value]) => value);
const missingPolicyValues = MISSING_POLICIES.map(([value]) => value);

const cellText = (value) => value instanceof Date
  ? value.toISOString()
  : value === null || value === undefined
    ? ""
    : String(value);

const normalizeLookup = (value) => cellText(value)
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("es")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export const normalizeEmail = (value) => {
  const rawEmail = cellText(value);
  const normalizedEmail = rawEmail.normalize("NFKC").trim().toLocaleLowerCase("en");
  const valid = normalizedEmail.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail);
  return {
    rawEmail,
    normalizedEmail,
    valid,
    empty: normalizedEmail === "",
  };
};

const HEADER_TERMS = Object.freeze({
  email: ["correo", "correo electronico", "email", "email address", "e mail"],
  name: ["nombre", "name", "student", "student name", "nombre estudiante"],
  id: ["id", "identificacion", "student id", "documento"],
  group: ["grupo", "group"],
  score: ["nota", "score", "points", "puntuacion", "total points", "calificacion", "resultado"],
  possible: ["maximo", "maximum", "possible points", "points possible", "puntaje maximo"],
  timestamp: ["timestamp", "marca temporal", "start time", "completion time", "completed at", "fecha"],
});

export const suggestColumns = (headers, fields) => Object.fromEntries(
  fields.map((field) => {
    const terms = HEADER_TERMS[field] ?? [];
    const normalized = headers.map(normalizeLookup);
    const exactMatches = normalized
      .map((header, index) => ({ header, index }))
      .filter(({ header }) => terms.includes(header));
    if (exactMatches.length === 1) return [field, exactMatches[0].index];
    if (exactMatches.length > 1) return [field, null];
    const partialMatches = normalized
      .map((header, index) => ({ header, index }))
      .filter(({ header }) => terms.some((term) => header.includes(term) || term.includes(header)));
    return [field, partialMatches.length === 1 ? partialMatches[0].index : null];
  })
);

export const tableHeaders = (data, headerRow = 1) => {
  if (!Number.isInteger(headerRow) || headerRow < 1 || headerRow > data.length) return [];
  const width = Math.max(0, ...data.map((row) => row.length));
  return Array.from({ length: width }, (_, index) => {
    const value = cellText(data[headerRow - 1]?.[index]).trim();
    return value || `Columna ${index + 1}`;
  });
};

const simpleNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const source = cellText(value).trim();
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(source)) return null;
  if (source.includes(".") && source.includes(",")) return null;
  const number = Number(source.replace(",", "."));
  return Number.isFinite(number) ? number : null;
};

export const parseScore = (rawScore, configuration = {}, rawPossible = null) => {
  const source = cellText(rawScore).trim();
  if (source === "") return { valid: false, reason: "empty", rawScore: cellText(rawScore) };

  let earnedPoints;
  let cellMaximum = null;
  const fraction = source.match(/^([^/]+)\/([^/]+)$/);
  if (fraction) {
    earnedPoints = simpleNumber(fraction[1].trim());
    cellMaximum = simpleNumber(fraction[2].trim());
  } else {
    earnedPoints = simpleNumber(rawScore);
  }
  if (earnedPoints === null) {
    return { valid: false, reason: "invalid", rawScore: cellText(rawScore) };
  }

  const mode = configuration.maximumMode ?? "unknown";
  const configuredMaximum = mode === "fixed"
    ? simpleNumber(configuration.fixedMaximum)
    : mode === "column"
      ? simpleNumber(rawPossible)
      : null;
  let possiblePoints = cellMaximum;
  let scaleConflict = false;

  if (configuredMaximum !== null) {
    if (cellMaximum !== null && Math.abs(cellMaximum - configuredMaximum) > EPSILON) {
      scaleConflict = true;
    } else {
      possiblePoints = configuredMaximum;
    }
  }
  if (mode === "cell" && cellMaximum === null) possiblePoints = null;
  if (mode === "unknown" && cellMaximum === null) possiblePoints = null;

  if (mode === "fixed" && configuredMaximum === null) {
    return { valid: false, reason: "invalid_maximum", rawScore: cellText(rawScore), earnedPoints };
  }
  if (mode === "column" && configuredMaximum === null) {
    return { valid: false, reason: "invalid_maximum", rawScore: cellText(rawScore), earnedPoints };
  }
  if (scaleConflict) {
    return {
      valid: false,
      reason: "scale_conflict",
      rawScore: cellText(rawScore),
      earnedPoints,
      possiblePoints: cellMaximum,
      configuredMaximum,
    };
  }
  if (possiblePoints !== null && possiblePoints <= 0) {
    return { valid: false, reason: "invalid_maximum", rawScore: cellText(rawScore), earnedPoints, possiblePoints };
  }
  if (possiblePoints !== null && earnedPoints > possiblePoints) {
    return { valid: false, reason: "out_of_range", rawScore: cellText(rawScore), earnedPoints, possiblePoints };
  }

  return {
    valid: true,
    rawScore: cellText(rawScore),
    earnedPoints,
    possiblePoints,
    percentage: possiblePoints === null ? null : (earnedPoints / possiblePoints) * 100,
  };
};

export const parseTimestamp = (value) => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString();
  const source = cellText(value).trim();
  if (source === "") return null;
  const date = new Date(source);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
};

let incidentSequence = 0;
const incident = (input) => {
  if (!INCIDENT_TYPES.includes(input.type)) throw new TypeError(`Tipo de incidencia desconocido: ${input.type}`);
  if (!INCIDENT_SEVERITIES.includes(input.severity)) throw new TypeError(`Severidad desconocida: ${input.severity}`);
  incidentSequence += 1;
  return {
    id: `incident_${incidentSequence}`,
    resolution: "open",
    sourceId: null,
    source: "",
    fileName: "",
    row: null,
    email: "",
    student: "",
    value: "",
    policy: "",
    ...input,
  };
};

const assertTableSize = (data) => {
  if (!Array.isArray(data)) throw new TypeError("La hoja no contiene filas.");
  if (data.length > RESULTS_LIMITS.maxRows) throw new RangeError(`La hoja supera ${RESULTS_LIMITS.maxRows} filas.`);
  if (data.some((row) => !Array.isArray(row) || row.length > RESULTS_LIMITS.maxColumns)) {
    throw new RangeError(`La hoja supera ${RESULTS_LIMITS.maxColumns} columnas o contiene una fila inválida.`);
  }
};

const rowHasValue = (row) => row.some((value) => cellText(value).trim() !== "");

export const normalizeRoster = ({ data, headerRow = 1, mapping = {}, fileName = "" }) => {
  assertTableSize(data);
  if (!Number.isInteger(mapping.email) || mapping.email < 0) {
    throw new TypeError("Selecciona la columna de correo del listado.");
  }
  const students = [];
  const incidents = [];
  data.slice(headerRow).forEach((row, offset) => {
    if (!rowHasValue(row)) return;
    const email = normalizeEmail(row[mapping.email]);
    const student = {
      rosterId: `roster_${offset + headerRow + 1}`,
      row: offset + headerRow + 1,
      rawEmail: email.rawEmail,
      normalizedEmail: email.normalizedEmail,
      emailValid: email.valid,
      name: Number.isInteger(mapping.name) ? cellText(row[mapping.name]).trim() : "",
      studentId: Number.isInteger(mapping.id) ? cellText(row[mapping.id]).trim() : "",
      group: Number.isInteger(mapping.group) ? cellText(row[mapping.group]).trim() : "",
      fileName,
    };
    students.push(student);
    if (!email.valid) {
      incidents.push(incident({
        severity: "error",
        type: "invalid_email",
        source: "Listado de estudiantes",
        fileName,
        row: student.row,
        student: student.name,
        value: student.rawEmail,
        message: "El correo del listado no tiene una sintaxis válida.",
      }));
    }
  });

  const byEmail = new Map();
  students.filter((student) => student.emailValid).forEach((student) => {
    const entries = byEmail.get(student.normalizedEmail) ?? [];
    entries.push(student);
    byEmail.set(student.normalizedEmail, entries);
  });
  byEmail.forEach((entries, email) => {
    if (entries.length < 2) return;
    entries.forEach((student) => {
      incidents.push(incident({
        severity: "error",
        type: "duplicate_roster_identity",
        source: "Listado de estudiantes",
        fileName,
        row: student.row,
        email,
        student: student.name,
        value: student.rawEmail,
        message: "Este correo aparece más de una vez en el listado y no se fusionó.",
      }));
    });
  });
  return { students, incidents };
};

const scoreIncident = (score, context) => {
  const type = score.reason === "scale_conflict"
    ? "scale_conflict"
    : score.reason === "out_of_range"
      ? "score_out_of_range"
      : "invalid_score";
  const messages = {
    scale_conflict: "El máximo de la celda no coincide con la configuración de la fuente.",
    score_out_of_range: "La puntuación obtenida supera el máximo.",
    invalid_score: "La puntuación no pudo interpretarse con seguridad.",
  };
  return incident({ severity: "error", type, ...context, message: messages[type] });
};

export const normalizeGenericSource = (source) => {
  const { data, config } = source;
  assertTableSize(data);
  const mapping = config.mapping ?? {};
  if (!Number.isInteger(mapping.email) || !Number.isInteger(mapping.score)) {
    throw new TypeError("Selecciona las columnas de correo y puntuación.");
  }
  if (!duplicatePolicyValues.includes(config.duplicatePolicy)) {
    throw new TypeError("Política de duplicados inválida.");
  }
  const submissions = [];
  const incidents = [];
  data.slice(config.headerRow).forEach((row, offset) => {
    if (!rowHasValue(row)) return;
    const rowNumber = offset + config.headerRow + 1;
    const email = normalizeEmail(row[mapping.email]);
    const score = parseScore(
      row[mapping.score],
      config.scoreConfiguration,
      Number.isInteger(mapping.possible) ? row[mapping.possible] : null
    );
    const rawTimestamp = Number.isInteger(mapping.timestamp) ? row[mapping.timestamp] : null;
    const timestamp = parseTimestamp(rawTimestamp);
    const context = {
      sourceId: source.id,
      source: source.label,
      fileName: source.fileName,
      row: rowNumber,
      email: email.normalizedEmail,
      value: cellText(row[mapping.score]),
    };
    if (!email.valid) {
      incidents.push(incident({
        severity: "error",
        type: "invalid_email",
        ...context,
        value: email.rawEmail,
        message: "El correo del resultado no tiene una sintaxis válida.",
      }));
    }
    if (!score.valid) incidents.push(scoreIncident(score, context));
    if (rawTimestamp !== null && cellText(rawTimestamp).trim() && timestamp === null) {
      incidents.push(incident({
        severity: "warning",
        type: "invalid_timestamp",
        ...context,
        value: cellText(rawTimestamp),
        message: "La fecha no pudo interpretarse; no se usará para ordenar intentos.",
      }));
    }
    if (score.valid && score.possiblePoints === null) {
      incidents.push(incident({
        severity: "warning",
        type: "missing_scale",
        ...context,
        message: "La puntuación se conserva, pero falta una escala para calcular porcentaje.",
      }));
    }
    submissions.push({
      submissionId: `${source.id}:row:${rowNumber}`,
      sourceId: source.id,
      sourceLabel: source.label,
      fileName: source.fileName,
      row: rowNumber,
      rawEmail: email.rawEmail,
      normalizedEmail: email.normalizedEmail,
      emailValid: email.valid,
      identityMode: "institutionalEmail",
      score,
      rawTimestamp: cellText(rawTimestamp),
      timestamp,
      provider: "generic-table",
    });
  });
  return { ...source, submissions, incidents };
};

const approximatelyEqual = (first, second) => Math.abs(first - second) <= 1e-7;

export const normalizeBonusSource = (source) => {
  if (!duplicatePolicyValues.includes(source.config.duplicatePolicy)) {
    throw new TypeError("Política de duplicados inválida.");
  }
  const submissions = [];
  const incidents = [];
  source.documents.forEach((document, index) => {
    const documentFileName = source.documentFileNames?.[index] ?? source.fileName;
    const validation = validateCompletedBonusAttempt(document);
    const reference = document?.attemptId || `${source.fileName}#${index + 1}`;
    if (!validation.valid) {
      incidents.push(incident({
        severity: "error",
        type: "invalid_file",
        sourceId: source.id,
        source: source.label,
        fileName: documentFileName,
        value: reference,
        message: validation.errors.join(" "),
      }));
      return;
    }
    const identity = attemptIdentity(document);
    const email = identity.mode === "institutionalEmail"
      ? normalizeEmail(identity.email)
      : { rawEmail: "", normalizedEmail: "", valid: false };
    const questionEarned = document.questions.reduce((sum, question) => sum + question.pointsEarned, 0);
    const questionPossible = document.questions.reduce((sum, question) => sum + question.pointsPossible, 0);
    const expectedPercentage = questionPossible > 0
      ? (questionEarned / questionPossible) * 100
      : 0;
    if (!approximatelyEqual(questionEarned, document.summary.pointsEarned) ||
      !approximatelyEqual(questionPossible, document.summary.pointsPossible) ||
      !approximatelyEqual(expectedPercentage, document.summary.percentage)) {
      incidents.push(incident({
        severity: "error",
        type: "bonus_summary_mismatch",
        sourceId: source.id,
        source: source.label,
        fileName: documentFileName,
        value: reference,
        message: "El resumen del Bono no coincide con la suma de sus preguntas.",
      }));
    }
    if (identity.mode === "anonymous") {
      incidents.push(incident({
        severity: "info",
        type: "anonymous_attempt",
        sourceId: source.id,
        source: source.label,
        fileName: documentFileName,
        value: reference,
        message: "El intento es anónimo y no puede conciliarse con el listado.",
      }));
    }
    const score = {
      valid: true,
      rawScore: `${document.summary.pointsEarned}/${document.summary.pointsPossible}`,
      earnedPoints: document.summary.pointsEarned,
      possiblePoints: document.summary.pointsPossible,
      percentage: document.summary.percentage,
    };
    submissions.push({
      submissionId: document.attemptId,
      attemptId: document.attemptId,
      bonusId: document.bonusId,
      bonusVersion: document.bonusVersion,
      sourceId: source.id,
      sourceLabel: source.label,
      fileName: documentFileName,
      row: null,
      rawEmail: email.rawEmail,
      normalizedEmail: email.normalizedEmail,
      emailValid: email.valid,
      identityMode: identity.mode,
      score,
      rawTimestamp: document.completedAt,
      timestamp: document.completedAt,
      provider: "papillas-bonus",
    });
  });
  return { ...source, submissions, incidents };
};

const resolutionFailure = (reason) => ({ resolved: false, reason, score: null, submissions: [] });

export const resolveDuplicateSubmissions = (submissions, policy) => {
  const usable = submissions.filter((submission) => submission.score.valid);
  if (usable.length === 0) return resolutionFailure("no_valid_score");
  if (usable.length === 1) return { resolved: true, score: usable[0].score, submission: usable[0], submissions: usable, policy: "single" };
  if (policy === "unresolved") return { ...resolutionFailure("unresolved_duplicate"), submissions: usable, policy };
  if (["first", "last"].includes(policy)) {
    if (usable.some((submission) => !submission.timestamp)) {
      return { ...resolutionFailure("timestamp_required"), submissions: usable, policy };
    }
    const ordered = [...usable].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const submission = policy === "first" ? ordered[0] : ordered.at(-1);
    return { resolved: true, score: submission.score, submission, submissions: usable, policy };
  }
  if (policy === "highest") {
    const allPercentages = usable.every((submission) => submission.score.percentage !== null);
    const scales = new Set(usable.map((submission) => submission.score.possiblePoints));
    if (!allPercentages && (scales.size !== 1 || scales.has(null))) {
      return { ...resolutionFailure("comparable_scale_required"), submissions: usable, policy };
    }
    const metric = (submission) => allPercentages
      ? submission.score.percentage
      : submission.score.earnedPoints;
    const submission = usable.reduce((best, current) => metric(current) > metric(best) ? current : best);
    return { resolved: true, score: submission.score, submission, submissions: usable, policy };
  }
  if (policy === "average") {
    const allPercentages = usable.every((submission) => submission.score.percentage !== null);
    const scales = new Set(usable.map((submission) => submission.score.possiblePoints));
    if (!allPercentages && (scales.size !== 1 || scales.has(null))) {
      return { ...resolutionFailure("comparable_scale_required"), submissions: usable, policy };
    }
    if (allPercentages) {
      const percentage = mean(usable.map((submission) => submission.score.percentage));
      return {
        resolved: true,
        score: { valid: true, rawScore: `Promedio de ${usable.length} intentos`, earnedPoints: null, possiblePoints: null, percentage },
        submission: null,
        submissions: usable,
        policy,
      };
    }
    const possiblePoints = usable[0].score.possiblePoints;
    const earnedPoints = mean(usable.map((submission) => submission.score.earnedPoints));
    return {
      resolved: true,
      score: { valid: true, rawScore: `Promedio de ${usable.length} intentos`, earnedPoints, possiblePoints, percentage: (earnedPoints / possiblePoints) * 100 },
      submission: null,
      submissions: usable,
      policy,
    };
  }
  throw new TypeError("Política de duplicados inválida.");
};

export const mean = (values) => values.length === 0
  ? null
  : values.reduce((sum, value) => sum + value, 0) / values.length;

export const median = (values) => {
  if (values.length === 0) return null;
  const ordered = [...values].sort((first, second) => first - second);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
};

export const descriptiveStats = (values) => {
  const valid = values.filter(Number.isFinite);
  return {
    n: valid.length,
    mean: mean(valid),
    median: median(valid),
    min: valid.length ? Math.min(...valid) : null,
    max: valid.length ? Math.max(...valid) : null,
  };
};

export const calculateResultMean = (entries, missingPolicy = "unresolved") => {
  if (!missingPolicyValues.includes(missingPolicy)) throw new TypeError("Política de faltantes inválida.");
  const unresolved = entries.filter((entry) => entry.status !== "resolved");
  const percentages = entries
    .filter((entry) => entry.status === "resolved")
    .map((entry) => entry.score.percentage);
  if (percentages.some((value) => value === null)) return { value: null, reason: "missing_scale" };
  if (missingPolicy === "unresolved" && unresolved.length) return { value: null, reason: "missing_results" };
  if (missingPolicy === "zero") percentages.push(...unresolved.map(() => 0));
  return percentages.length ? { value: mean(percentages), reason: null } : { value: null, reason: "no_results" };
};

export const consolidateResults = ({ roster, sources, missingPolicy = "unresolved" }) => {
  if (!missingPolicyValues.includes(missingPolicy)) throw new TypeError("Política de faltantes inválida.");
  const incidents = [...roster.incidents, ...sources.flatMap((source) => source.incidents)];
  const rosterByEmail = new Map();
  roster.students.filter((student) => student.emailValid).forEach((student) => {
    const values = rosterByEmail.get(student.normalizedEmail) ?? [];
    values.push(student);
    rosterByEmail.set(student.normalizedEmail, values);
  });
  const rows = roster.students.map((student) => ({ student, results: {}, mean: null }));
  const rowByRosterId = new Map(rows.map((row) => [row.student.rosterId, row]));

  sources.forEach((source) => {
    const matchedByRoster = new Map();
    source.submissions.forEach((submission) => {
      if (submission.identityMode === "anonymous" || !submission.emailValid) return;
      const matches = rosterByEmail.get(submission.normalizedEmail) ?? [];
      if (matches.length === 0) {
        incidents.push(incident({
          severity: "warning",
          type: "unknown_student",
          sourceId: source.id,
          source: source.label,
          fileName: submission.fileName,
          row: submission.row,
          email: submission.normalizedEmail,
          value: submission.rawEmail,
          message: "El correo es válido, pero no pertenece al listado.",
        }));
        return;
      }
      if (matches.length > 1) return;
      const entries = matchedByRoster.get(matches[0].rosterId) ?? [];
      entries.push(submission);
      matchedByRoster.set(matches[0].rosterId, entries);
    });

    roster.students.forEach((student) => {
      const target = rowByRosterId.get(student.rosterId);
      const submissions = matchedByRoster.get(student.rosterId) ?? [];
      if (submissions.length > 1) {
        incidents.push(incident({
          severity: "warning",
          type: "duplicate_submission",
          sourceId: source.id,
          source: source.label,
          fileName: source.fileName,
          email: student.normalizedEmail,
          student: student.name,
          value: String(submissions.length),
          policy: source.config.duplicatePolicy,
          message: "Hay varios resultados para el mismo estudiante en esta fuente.",
        }));
      }
      const resolution = resolveDuplicateSubmissions(submissions, source.config.duplicatePolicy);
      if (!resolution.resolved) {
        const hasSubmissions = submissions.length > 0;
        if (hasSubmissions && submissions.length > 1) {
          incidents.push(incident({
            severity: "error",
            type: "unresolved_duplicate",
            sourceId: source.id,
            source: source.label,
            fileName: source.fileName,
            email: student.normalizedEmail,
            student: student.name,
            value: resolution.reason,
            policy: source.config.duplicatePolicy,
            message: resolution.reason === "timestamp_required"
              ? "La política temporal requiere fechas válidas en todos los intentos."
              : resolution.reason === "comparable_scale_required"
                ? "La política requiere porcentajes o una escala explícita comparable."
                : "Los resultados duplicados requieren una política explícita.",
          }));
        }
        incidents.push(incident({
          severity: "info",
          type: "missing_submission",
          sourceId: source.id,
          source: source.label,
          fileName: source.fileName,
          email: student.normalizedEmail,
          student: student.name,
          message: hasSubmissions
            ? "No hay un resultado utilizable mientras la incidencia siga abierta."
            : "No se encontró un resultado válido para este estudiante.",
        }));
        target.results[source.id] = {
          status: hasSubmissions ? "unresolved" : "missing",
          score: null,
          submissions,
          policy: source.config.duplicatePolicy,
          reason: resolution.reason,
        };
      } else {
        target.results[source.id] = {
          status: "resolved",
          score: resolution.score,
          submissions: resolution.submissions,
          selectedSubmission: resolution.submission,
          policy: resolution.policy,
          reason: null,
        };
      }
    });
  });

  rows.forEach((row) => {
    row.mean = calculateResultMean(sources.map((source) => row.results[source.id]), missingPolicy);
  });

  const sourceSummaries = sources.map((source) => {
    const entries = rows.map((row) => row.results[source.id]);
    const resolved = entries.filter((entry) => entry.status === "resolved");
    const percentages = resolved.map((entry) => entry.score.percentage).filter(Number.isFinite);
    const unknown = incidents.filter((item) => item.sourceId === source.id && item.type === "unknown_student").length;
    const duplicates = incidents.filter((item) => item.sourceId === source.id && item.type === "duplicate_submission").length;
    const invalid = incidents.filter((item) =>
      item.sourceId === source.id && item.severity === "error"
    ).length;
    return {
      sourceId: source.id,
      label: source.label,
      fileName: source.fileName,
      participants: resolved.length,
      missing: entries.filter((entry) => entry.status !== "resolved").length,
      participation: roster.students.length ? (resolved.length / roster.students.length) * 100 : 0,
      unknown,
      duplicates,
      invalid,
      stats: descriptiveStats(percentages),
      duplicatePolicy: source.config.duplicatePolicy,
      scale: source.kind === "bonus"
        ? "Resumen validado del Bono"
        : source.config.scoreConfiguration?.maximumMode ?? "unknown",
    };
  });

  return {
    roster,
    sources,
    rows,
    incidents,
    missingPolicy,
    summary: {
      students: roster.students.length,
      sources: sources.length,
      validResults: sourceSummaries.reduce((sum, source) => sum + source.participants, 0),
      missing: incidents.filter((item) => item.type === "missing_submission").length,
      unknown: incidents.filter((item) => item.type === "unknown_student").length,
      duplicates: incidents.filter((item) => item.type === "duplicate_submission").length,
      invalid: incidents.filter((item) => item.severity === "error").length,
      sourceSummaries,
    },
  };
};

export const sourceFromTable = ({ id, label, fileName, format, sheet, data, headerRow = 1 }) => {
  const headers = tableHeaders(data, headerRow);
  const mapping = suggestColumns(headers, ["email", "score", "possible", "timestamp"]);
  return {
    id,
    kind: "table",
    label,
    fileName,
    format,
    sheet,
    data,
    config: {
      headerRow,
      mapping,
      scoreConfiguration: { maximumMode: "unknown", fixedMaximum: null },
      duplicatePolicy: "unresolved",
    },
  };
};

export const sourceFromBonusDocuments = ({ id, label, fileName, documents }) => ({
  id,
  kind: "bonus",
  label,
  fileName,
  format: "json",
  sheet: null,
  documents,
  config: { duplicatePolicy: "unresolved" },
});

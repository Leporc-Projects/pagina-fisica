// Constructores mínimos de MathML para contenido editorial controlado. Separan
// la semántica matemática de los componentes Astro y no interpretan strings.

export const escapeMathText = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

export const mi = (value) => `<mi>${escapeMathText(value)}</mi>`;
export const mn = (value) => `<mn>${escapeMathText(value)}</mn>`;
export const mo = (value) => `<mo>${escapeMathText(value)}</mo>`;
export const mtext = (value) => `<mtext>${escapeMathText(value)}</mtext>`;
export const row = (...values) => `<mrow>${values.join("")}</mrow>`;
export const sub = (base, index) => `<msub>${base}${index}</msub>`;
export const sup = (base, exponent) => `<msup>${base}${exponent}</msup>`;
export const subsup = (base, index, exponent) =>
  `<msubsup>${base}${index}${exponent}</msubsup>`;
export const frac = (numerator, denominator) =>
  `<mfrac>${numerator}${denominator}</mfrac>`;
export const sqrt = (value) => `<msqrt>${value}</msqrt>`;
export const mover = (base, accent) => `<mover>${base}${accent}</mover>`;
export const mspace = (width = "1em") =>
  `<mspace width="${escapeMathText(width)}"></mspace>`;
export const integral = (lower, upper) =>
  subsup(mo("∫"), lower, upper);
export const vector = (value) => mover(mi(value), mo("→"));
export const unitVector = (value) => mover(mi(value), mo("^"));

// Los delimitadores declaran su función a MathML para que el navegador calcule
// una pareja simétrica alrededor de contenido simple o compuesto. Los espacios
// pertenecen al operador, no a una corrección CSS ligada a una fórmula concreta.
const fenceOperator = (value, form) => {
  const prefix = form === "prefix";
  return `<mo fence="true" stretchy="true" symmetric="true" form="${form}" lspace="${prefix ? "0" : "0.14em"}" rspace="${prefix ? "0.14em" : "0"}">${escapeMathText(value)}</mo>`;
};

export const fenced = (
  value,
  { open = "(", close = ")" } = {}
) => row(
  fenceOperator(open, "prefix"),
  value,
  fenceOperator(close, "postfix")
);

export const magnitude = (value) => fenced(value, { open: "|", close: "|" });
export const absoluteValue = (value) => fenced(value, { open: "|", close: "|" });
export const norm = (value) => fenced(value, { open: "‖", close: "‖" });

const mathDocument = ({ label, tex, body, display }) => `
  <math xmlns="http://www.w3.org/1998/Math/MathML" display="${display}" aria-label="${escapeMathText(label)}">
    <semantics>
      ${body}
      <annotation encoding="application/x-tex">${escapeMathText(tex)}</annotation>
    </semantics>
  </math>
`;

export const blockMath = (label, tex, body) =>
  mathDocument({ label, tex, body, display: "block" });

export const inlineMath = (label, tex, body) =>
  mathDocument({ label, tex, body, display: "inline" });

// Un fragmento rico alterna texto y expresiones ya estructuradas. Los
// componentes renderizan este contrato en build, sin parser ni runtime cliente.
export const textSegment = (value) => ({ type: "text", value });

export const mathSegment = ({ label, tex, body }) => ({
  type: "math",
  label,
  tex,
  mathml: inlineMath(label, tex, body),
});

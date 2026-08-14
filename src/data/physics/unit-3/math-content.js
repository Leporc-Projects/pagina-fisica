import { mathSegment, mi, mn, mo, row, sub, textSegment, vector } from "../../../utils/mathml.js";

const token = (literal, label, tex, body) => ({ literal, segment: mathSegment({ label, tex, body }) });
const simple = (literal, label, tex, body) => token(literal, label, tex, body);
export const UNIT_3_INLINE_MATH_TOKENS = [
  simple("ΣF_hacia-centro = m v²/R", "suma de fuerzas hacia el centro igual a masa por velocidad al cuadrado sobre radio", "\\sum F_{centro}=mv^2/R", row(mo("Σ"), sub(mi("F"), mi("centro")), mo("="), mi("m"), mi("v"), mo("²"), mo("/"), mi("R"))),
  simple("ΣF_ext = ma", "suma de fuerzas externas igual a masa por aceleración", "\\sum\\vec F_{ext}=m\\vec a", row(mo("Σ"), sub(vector("F"), mi("ext")), mo("="), mi("m"), vector("a"))),
  simple("ΣF_ext = 0", "suma de fuerzas externas igual a cero", "\\sum\\vec F_{ext}=0", row(mo("Σ"), sub(vector("F"), mi("ext")), mo("="), mn("0"))),
  simple("ΣF_x = 0", "suma de fuerzas x igual a cero", "\\sum F_x=0", row(mo("Σ"), sub(mi("F"), mi("x")), mo("="), mn("0"))),
  simple("ΣF_y = 0", "suma de fuerzas y igual a cero", "\\sum F_y=0", row(mo("Σ"), sub(mi("F"), mi("y")), mo("="), mn("0"))),
  simple("|f_s| ≤ μ_sN", "magnitud de fricción estática menor o igual que mu sub s por normal", "|f_s|\\leq\\mu_sN", row(mo("|"), sub(mi("f"), mi("s")), mo("|"), mo("≤"), sub(mi("μ"), mi("s")), mi("N"))),
  simple("f_k = μ_kN", "fricción cinética igual a mu sub k por normal", "f_k=\\mu_kN", row(sub(mi("f"), mi("k")), mo("="), sub(mi("μ"), mi("k")), mi("N"))),
  simple("N - mg = ma_y", "normal menos peso igual a masa por aceleración y", "N-mg=ma_y", row(mi("N"), mo("−"), mi("m"), mi("g"), mo("="), mi("m"), sub(mi("a"), mi("y")))),
  simple("N = m(g + a_y)", "normal igual a masa por g más aceleración y", "N=m(g+a_y)", row(mi("N"), mo("="), mi("m"), mo("("), mi("g"), mo("+"), sub(mi("a"), mi("y")), mo(")"))),
  simple("N ≥ 0", "normal mayor o igual que cero", "N\\geq0", row(mi("N"), mo("≥"), mn("0"))),
  simple("v²/R", "velocidad al cuadrado sobre radio", "v^2/R", row(mi("v"), mo("²"), mo("/"), mi("R"))),
].sort((a, b) => b.literal.length - a.literal.length);

export const presentUnit3RichText = (source) => {
  if (typeof source !== "string" || !source) return source;
  let segments = [textSegment(source)];
  for (const entry of UNIT_3_INLINE_MATH_TOKENS) segments = segments.flatMap((segment) => segment.type !== "text" || !segment.value.includes(entry.literal) ? segment : segment.value.split(entry.literal).flatMap((part, index) => [...(index ? [entry.segment] : []), ...(part ? [textSegment(part)] : [])]));
  return segments.length === 1 && segments[0].type === "text" ? source : segments;
};

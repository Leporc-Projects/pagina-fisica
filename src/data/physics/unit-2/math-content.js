import { frac, mathSegment, mi, mn, mo, mspace, mtext, row, sub, textSegment, vector } from "../../../utils/mathml.js";

const token = (literal, label, tex, body) => ({ literal, segment: mathSegment({ label, tex, body }) });
const unit = (top, bottom) => frac(mtext(top), mtext(bottom));

export const UNIT_2_INLINE_MATH_TOKENS = [
  token("ΣF_ext = dp/dt", "suma de fuerzas externas igual a derivada del momento respecto al tiempo", "\\sum\\vec F_{ext}=d\\vec p/dt", row(mo("Σ"), sub(vector("F"), mi("ext")), mo("="), frac(row(mi("d"), vector("p")), row(mi("d"), mi("t"))))),
  token("ΣF_ext = ma", "suma de fuerzas externas igual a masa por aceleración", "\\sum\\vec F_{ext}=m\\vec a", row(mo("Σ"), sub(vector("F"), mi("ext")), mo("="), mi("m"), vector("a"))),
  token("ΣF = ma", "suma de fuerzas igual a masa por aceleración", "\\sum\\vec F=m\\vec a", row(mo("Σ"), vector("F"), mo("="), mi("m"), vector("a"))),
  token("ΣF = 0", "suma de fuerzas igual a cero", "\\sum\\vec F=0", row(mo("Σ"), vector("F"), mo("="), mn("0"))),
  token("ΣFₓ = maₓ", "suma de fuerzas x igual a masa por aceleración x", "\\sum F_x=ma_x", row(mo("Σ"), sub(mi("F"), mi("x")), mo("="), mi("m"), sub(mi("a"), mi("x")))),
  token("ΣFᵧ = maᵧ", "suma de fuerzas y igual a masa por aceleración y", "\\sum F_y=ma_y", row(mo("Σ"), sub(mi("F"), mi("y")), mo("="), mi("m"), sub(mi("a"), mi("y")))),
  token("ΣF_z = ma_z", "suma de fuerzas z igual a masa por aceleración z", "\\sum F_z=ma_z", row(mo("Σ"), sub(mi("F"), mi("z")), mo("="), mi("m"), sub(mi("a"), mi("z")))),
  token("F⃗_A→B = −F⃗_B→A", "fuerza de A sobre B igual a menos fuerza de B sobre A", "\\vec F_{A\\to B}=-\\vec F_{B\\to A}", row(sub(vector("F"), mi("A→B")), mo("="), mo("−"), sub(vector("F"), mi("B→A")))),
  token("W⃗ = m g⃗", "peso vectorial igual a masa por campo gravitacional", "\\vec W=m\\vec g", row(vector("W"), mo("="), mi("m"), vector("g"))),
  token("W = mg", "peso igual a masa por campo gravitacional", "W=mg", row(mi("W"), mo("="), mi("m"), mi("g"))),
  token("r' = r − Vt", "r prima igual a r menos V por t", "\\vec r'=\\vec r-\\vec Vt", row(vector("r"), mo("′"), mo("="), vector("r"), mo("−"), vector("V"), mi("t"))),
  token("v' = v − V", "v prima igual a v menos V", "\\vec v'=\\vec v-\\vec V", row(vector("v"), mo("′"), mo("="), vector("v"), mo("−"), vector("V"))),
  token("a' = a", "a prima igual a a", "\\vec a'=\\vec a", row(vector("a"), mo("′"), mo("="), vector("a"))),
  token("1 N = 1 kg·m/s²", "un newton igual a un kilogramo metro por segundo cuadrado", "1\\,N=1\\,kg\\,m/s^2", row(mn("1"), mtext(" N"), mo("="), mn("1"), mtext(" kg"), mo("·"), unit("m", "s²"))),
  token("9,8 m/s²", "nueve coma ocho metros por segundo cuadrado", "9.8\\,m/s^2", row(mn("9,8"), mspace("0.2em"), unit("m", "s²"))),
  token("9.8 m/s²", "nine point eight metres per second squared", "9.8\\,m/s^2", row(mn("9.8"), mspace("0.2em"), unit("m", "s²"))),
  token("1,6 m/s²", "uno coma seis metros por segundo cuadrado", "1.6\\,m/s^2", row(mn("1,6"), mspace("0.2em"), unit("m", "s²"))),
  token("1.6 m/s²", "one point six metres per second squared", "1.6\\,m/s^2", row(mn("1.6"), mspace("0.2em"), unit("m", "s²"))),
  token("N/kg", "newtons por kilogramo", "N/kg", unit("N", "kg")),
  token("m/s²", "metros por segundo cuadrado", "m/s^2", unit("m", "s²")),
].sort((a, b) => b.literal.length - a.literal.length);

export const presentUnit2RichText = (source) => {
  if (typeof source !== "string" || !source) return source;
  let segments = [textSegment(source)];
  for (const entry of UNIT_2_INLINE_MATH_TOKENS) {
    segments = segments.flatMap((segment) => {
      if (segment.type !== "text" || !segment.value.includes(entry.literal)) return segment;
      return segment.value.split(entry.literal).flatMap((part, index) => [
        ...(index ? [entry.segment] : []), ...(part ? [textSegment(part)] : []),
      ]);
    });
  }
  return segments.length === 1 && segments[0].type === "text" ? source : segments;
};

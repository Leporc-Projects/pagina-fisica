import { frac, mathSegment, mi, mn, mo, row, sqrt, sub, sup, textSegment } from "../../../utils/mathml.js";

const token = (literal, es, en, tex, body) => ({ literal, segment: (locale) => mathSegment({ label: locale === "en" ? en : es, tex, body }) });
const squared = (symbol) => sup(mi(symbol), mn("2"));

export const UNIT_4_INLINE_MATH_TOKENS = [
  token("Δ(K+U)=W_other", "cambio de energía cinética más potencial igual al trabajo de otras fuerzas", "change in kinetic plus potential energy equals work by other forces", "\\Delta(K+U)=W_{other}", row(mi("Δ"), mo("("), mi("K"), mo("+"), mi("U"), mo(")"), mo("="), sub(mi("W"), mi("other")))),
  token("K_i+U_i=K_f+U_f", "energía cinética más potencial inicial igual a energía cinética más potencial final", "initial kinetic plus potential energy equals final kinetic plus potential energy", "K_i+U_i=K_f+U_f", row(sub(mi("K"), mi("i")), mo("+"), sub(mi("U"), mi("i")), mo("="), sub(mi("K"), mi("f")), mo("+"), sub(mi("U"), mi("f")))),
  token("F_x=-dU/dx", "fuerza en x igual a menos la derivada de la energía potencial respecto a x", "force x equals negative derivative of potential energy with respect to x", "F_x=-dU/dx", row(sub(mi("F"), mi("x")), mo("="), mo("−"), frac(row(mi("d"), mi("U")), row(mi("d"), mi("x"))))),
  token("W_net=ΔK", "trabajo neto igual al cambio de energía cinética", "net work equals change in kinetic energy", "W_{net}=\\Delta K", row(sub(mi("W"), mi("net")), mo("="), mi("Δ"), mi("K"))),
  token("W_c=-ΔU", "trabajo conservativo igual a menos el cambio de energía potencial", "conservative work equals negative change in potential energy", "W_c=-\\Delta U", row(sub(mi("W"), mi("c")), mo("="), mo("−"), mi("Δ"), mi("U"))),
  token("P=F·v", "potencia igual a fuerza punto velocidad", "power equals force dot velocity", "P=\\vec F\\cdot\\vec v", row(mi("P"), mo("="), mi("F"), mo("·"), mi("v"))),
  token("K=(1/2)mv²", "energía cinética igual a un medio de la masa por la rapidez al cuadrado", "kinetic energy equals one half mass times speed squared", "K=\\frac12mv^2", row(mi("K"), mo("="), frac(mn("1"), mn("2")), mi("m"), squared("v"))),
  token("U_s=(1/2)kx²", "energía potencial elástica igual a un medio de k por x al cuadrado", "elastic potential energy equals one half k x squared", "U_s=\\frac12kx^2", row(sub(mi("U"), mi("s")), mo("="), frac(mn("1"), mn("2")), mi("k"), squared("x"))),
  token("ΔU_g=mgΔy", "cambio de energía potencial gravitacional igual a masa por g por cambio en y", "change in gravitational potential energy equals mass times g times change in y", "\\Delta U_g=mg\\Delta y", row(mi("Δ"), sub(mi("U"), mi("g")), mo("="), mi("m"), mi("g"), mi("Δ"), mi("y"))),
  token("K=E-U", "energía cinética igual a energía mecánica menos energía potencial", "kinetic energy equals mechanical energy minus potential energy", "K=E-U", row(mi("K"), mo("="), mi("E"), mo("−"), mi("U"))),
  token("U≤E", "energía potencial menor o igual que energía mecánica", "potential energy less than or equal to mechanical energy", "U\\le E", row(mi("U"), mo("≤"), mi("E"))),
  token("v(x)=sqrt(2[E-U(x)]/m)", "rapidez en función de la posición igual a raíz de dos por E menos U de x sobre la masa", "speed as a function of position equals square root of two times E minus U of x over mass", "v(x)=\\sqrt{2[E-U(x)]/m}", row(mi("v"), mo("("), mi("x"), mo(")"), mo("="), sqrt(frac(row(mn("2"), mo("["), mi("E"), mo("−"), mi("U"), mo("("), mi("x"), mo(")"), mo("]")), mi("m"))))),
].sort((a, b) => b.literal.length - a.literal.length);

export const presentUnit4RichText = (source, locale = "es") => {
  if (typeof source !== "string" || !source) return source;
  let segments = [textSegment(source)];
  for (const entry of UNIT_4_INLINE_MATH_TOKENS) {
    segments = segments.flatMap((segment) => segment.type !== "text" || !segment.value.includes(entry.literal)
      ? segment
      : segment.value.split(entry.literal).flatMap((part, index) => [...(index ? [entry.segment(locale)] : []), ...(part ? [textSegment(part)] : [])]));
  }
  return segments.length === 1 && segments[0].type === "text" ? source : segments;
};

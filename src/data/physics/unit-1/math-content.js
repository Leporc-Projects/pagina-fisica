// Capa de presentación matemática de la Unidad 1. Conserva intactas las
// fuentes académicas y sustituye únicamente fragmentos declarados de forma
// explícita por MathML estructurado durante el build.
import {
  absoluteValue,
  frac,
  integral,
  magnitude,
  mathSegment,
  mi,
  mn,
  mo,
  mover,
  mspace,
  mtext,
  row,
  sqrt,
  sub,
  sup,
  textSegment,
  unitVector,
  vector,
} from "../../../utils/mathml.js";

const token = (literal, label, tex, body) => ({
  literal,
  segment: mathSegment({ label, tex, body }),
});

const identifier = (literal, base, index, label = literal) =>
  token(literal, label, `${base}_{${index}}`, sub(mi(base), mtext(index)));

const functionOf = (name, argument) => {
  const argumentNode = /^\d+(?:[,.]\d+)?$/.test(argument)
    ? mn(argument)
    : mi(argument);
  return row(mi(name), mo("("), argumentNode, mo(")"));
};

const unitFraction = (numerator, denominator, exponent = null) =>
  frac(
    mtext(numerator),
    exponent
      ? sup(mtext(denominator), mn(exponent))
      : mtext(denominator)
  );

// Los tokens largos se procesan primero. No existe una gramática implícita:
// cada expresión visible que requiere tipografía matemática está declarada.
export const UNIT_1_INLINE_MATH_TOKENS = [
  token(
    "a(t) = (2,0 m/s³)t",
    "a de t igual a dos coma cero metros por segundo cúbico por t",
    "a(t)=(2.0\\,\\mathrm{m/s^3})t",
    row(
      functionOf("a", "t"), mo("="), mo("("), mn("2,0"), mspace("0.25em"),
      unitFraction("m", "s", "3"), mo(")"), mi("t")
    )
  ),
  token(
    "v(0) = 3,0 m/s",
    "v de cero igual a tres coma cero metros por segundo",
    "v(0)=3.0\\,\\mathrm{m/s}",
    row(
      functionOf("v", "0"), mo("="), mn("3,0"), mspace("0.25em"),
      unitFraction("m", "s")
    )
  ),
  token(
    "v(t) = 3,0 m/s + (1,0 m/s³)t²",
    "v de t igual a tres coma cero metros por segundo más uno coma cero metros por segundo cúbico por t al cuadrado",
    "v(t)=3.0\\,\\mathrm{m/s}+(1.0\\,\\mathrm{m/s^3})t^2",
    row(
      functionOf("v", "t"), mo("="), mn("3,0"), mspace("0.25em"), unitFraction("m", "s"),
      mo("+"), mo("("), mn("1,0"), mspace("0.25em"), unitFraction("m", "s", "3"), mo(")"),
      sup(mi("t"), mn("2"))
    )
  ),
  token(
    "r(t) = [(2,0 m/s)t]i + [(1,0 m/s²)t² − 1,0 m]j",
    "vector r de t igual a dos coma cero metros por segundo por t en i más uno coma cero metros por segundo cuadrado por t cuadrado menos uno coma cero metros en j",
    "\\vec r(t)=[(2.0\\,\\mathrm{m/s})t]\\hat i+[(1.0\\,\\mathrm{m/s^2})t^2-1.0\\,\\mathrm m]\\hat j",
    row(
      vector("r"), mo("("), mi("t"), mo(")"), mo("="), mo("["), mo("("), mn("2,0"), mspace("0.25em"),
      unitFraction("m", "s"), mo(")"), mi("t"), mo("]"), unitVector("i"), mo("+"),
      mo("["), mo("("), mn("1,0"), mspace("0.25em"), unitFraction("m", "s", "2"), mo(")"),
      sup(mi("t"), mn("2")), mo("−"), mn("1,0"), mtext(" m"), mo("]"), unitVector("j")
    )
  ),
  token(
    "r(t) = [(2,0 m/s)t]i + [(4,0 m/s)t − (1,0 m/s²)t²]j",
    "vector r de t igual a dos coma cero metros por segundo por t en i más cuatro coma cero metros por segundo por t menos uno coma cero metros por segundo cuadrado por t cuadrado en j",
    "\\vec r(t)=[(2.0\\,\\mathrm{m/s})t]\\hat i+[(4.0\\,\\mathrm{m/s})t-(1.0\\,\\mathrm{m/s^2})t^2]\\hat j",
    row(
      vector("r"), mo("("), mi("t"), mo(")"), mo("="), mo("["), mo("("), mn("2,0"), mspace("0.25em"),
      unitFraction("m", "s"), mo(")"), mi("t"), mo("]"), unitVector("i"), mo("+"),
      mo("["), mo("("), mn("4,0"), mspace("0.25em"), unitFraction("m", "s"), mo(")"), mi("t"), mo("−"),
      mo("("), mn("1,0"), mspace("0.25em"), unitFraction("m", "s", "2"), mo(")"),
      sup(mi("t"), mn("2")), mo("]"), unitVector("j")
    )
  ),
  token(
    "x = vt + at",
    "x igual a v por t más a por t",
    "x=vt+at",
    row(mi("x"), mo("="), mi("v"), mi("t"), mo("+"), mi("a"), mi("t"))
  ),
  token(
    "[v][t]",
    "dimensión de v por dimensión de t",
    "[v][t]",
    row(mo("["), mi("v"), mo("]"), mo("["), mi("t"), mo("]"))
  ),
  token(
    "[a][t]",
    "dimensión de a por dimensión de t",
    "[a][t]",
    row(mo("["), mi("a"), mo("]"), mo("["), mi("t"), mo("]"))
  ),
  token(
    "[vt] = (L/T)T = L",
    "dimensión de v t igual a longitud sobre tiempo por tiempo igual a longitud",
    "[vt]=(L/T)T=L",
    row(
      mo("["), mi("v"), mi("t"), mo("]"), mo("="),
      mo("("), frac(mi("L"), mi("T")), mo(")"), mi("T"), mo("="), mi("L")
    )
  ),
  token(
    "[at] = (L/T²)T = L/T",
    "dimensión de a t igual a longitud sobre tiempo al cuadrado por tiempo igual a longitud sobre tiempo",
    "[at]=(L/T^2)T=L/T",
    row(
      mo("["), mi("a"), mi("t"), mo("]"), mo("="),
      mo("("), frac(mi("L"), sup(mi("T"), mn("2"))), mo(")"), mi("T"), mo("="), frac(mi("L"), mi("T"))
    )
  ),
  token(
    "72,0 km/h × (1000 m/1 km) × (1 h/3600 s)",
    "setenta y dos coma cero kilómetros por hora por mil metros sobre un kilómetro por una hora sobre tres mil seiscientos segundos",
    "72.0\\,\\frac{km}{h}\\left(\\frac{1000\\,m}{1\\,km}\\right)\\left(\\frac{1\\,h}{3600\\,s}\\right)",
    row(
      mn("72,0"), unitFraction("km", "h"), mo("×"), mo("("),
      frac(row(mn("1000"), mtext(" m")), row(mn("1"), mtext(" km"))), mo(")"), mo("×"), mo("("),
      frac(row(mn("1"), mtext(" h")), row(mn("3600"), mtext(" s"))), mo(")")
    )
  ),
  token(
    "Δx = Δr cos 32,0° y Δy = Δr sin 32,0°",
    "delta x igual a delta r coseno de treinta y dos grados y delta y igual a delta r seno de treinta y dos grados",
    "\\Delta x=\\Delta r\\cos32.0^\\circ,\\quad\\Delta y=\\Delta r\\sin32.0^\\circ",
    row(
      mo("Δ"), mi("x"), mo("="), mo("Δ"), mi("r"), mi("cos"), sup(mn("32,0"), mo("°")), mtext(" y "),
      mo("Δ"), mi("y"), mo("="), mo("Δ"), mi("r"), mi("sin"), sup(mn("32,0"), mo("°"))
    )
  ),
  token(
    "Δx ≈ 6,36 m y Δy ≈ 3,97 m",
    "delta x aproximadamente seis coma treinta y seis metros y delta y aproximadamente tres coma noventa y siete metros",
    "\\Delta x\\approx6.36\\,m,\\quad\\Delta y\\approx3.97\\,m",
    row(
      mo("Δ"), mi("x"), mo("≈"), mn("6,36"), mtext(" m"), mtext(" y "),
      mo("Δ"), mi("y"), mo("≈"), mn("3,97"), mtext(" m")
    )
  ),
  token(
    "A·B = 2(3) + λ(−2) + (−1)(4) = 2−2λ",
    "A producto punto B igual a dos por tres más lambda por menos dos más menos uno por cuatro igual a dos menos dos lambda",
    "\\vec A\\cdot\\vec B=2(3)+\\lambda(-2)+(-1)(4)=2-2\\lambda",
    row(
      vector("A"), mo("·"), vector("B"), mo("="), mn("2"), mo("("), mn("3"), mo(")"), mo("+"),
      mi("λ"), mo("("), mo("−"), mn("2"), mo(")"), mo("+"), mo("("), mo("−"), mn("1"), mo(")"), mo("("), mn("4"), mo(")"),
      mo("="), mn("2"), mo("−"), mn("2"), mi("λ")
    )
  ),
  token(
    "2−2λ = 0",
    "dos menos dos lambda igual a cero",
    "2-2\\lambda=0",
    row(mn("2"), mo("−"), mn("2"), mi("λ"), mo("="), mn("0"))
  ),
  token(
    "A·B = 3a−2 = 0",
    "A producto punto B igual a tres a menos dos igual a cero",
    "\\vec A\\cdot\\vec B=3a-2=0",
    row(vector("A"), mo("·"), vector("B"), mo("="), mn("3"), mi("a"), mo("−"), mn("2"), mo("="), mn("0"))
  ),
  token(
    "x = −20 m",
    "x igual a menos veinte metros",
    "x=-20\\,m",
    row(mi("x"), mo("="), mo("−"), mn("20"), mtext(" m"))
  ),
  token(
    "v < 0 y a < 0",
    "v menor que cero y a menor que cero",
    "v<0,\\quad a<0",
    row(mi("v"), mo("<"), mn("0"), mtext(" y "), mi("a"), mo("<"), mn("0"))
  ),
  token(
    "v = (−4−2)/(3−0) = −6/3 = −2 m/s",
    "v igual a menos cuatro menos dos sobre tres menos cero igual a menos seis tercios igual a menos dos metros por segundo",
    "v=\\frac{-4-2}{3-0}=\\frac{-6}{3}=-2\\,m/s",
    row(
      mi("v"), mo("="), frac(row(mo("−"), mn("4"), mo("−"), mn("2")), row(mn("3"), mo("−"), mn("0"))),
      mo("="), frac(row(mo("−"), mn("6")), mn("3")), mo("="), mo("−"), mn("2"), unitFraction("m", "s")
    )
  ),
  token(
    "Δx = 4 m − 0 m = +4 m",
    "delta x igual a cuatro metros menos cero metros igual a más cuatro metros",
    "\\Delta x=4\\,m-0\\,m=+4\\,m",
    row(mo("Δ"), mi("x"), mo("="), mn("4"), mtext(" m"), mo("−"), mn("0"), mtext(" m"), mo("="), mo("+"), mn("4"), mtext(" m"))
  ),
  token(
    "0 = 12−3t",
    "cero igual a doce menos tres t",
    "0=12-3t",
    row(mn("0"), mo("="), mn("12"), mo("−"), mn("3"), mi("t"))
  ),
  token(
    "v(6) = 12−18 = −6 m/s",
    "v de seis igual a doce menos dieciocho igual a menos seis metros por segundo",
    "v(6)=12-18=-6\\,m/s",
    row(functionOf("v", "6"), mo("="), mn("12"), mo("−"), mn("18"), mo("="), mo("−"), mn("6"), unitFraction("m", "s"))
  ),
  token(
    "v(t) = 3+t² m/s",
    "v de t igual a tres más t al cuadrado metros por segundo",
    "v(t)=3+t^2\\,m/s",
    row(functionOf("v", "t"), mo("="), mn("3"), mo("+"), sup(mi("t"), mn("2")), unitFraction("m", "s"))
  ),
  token(
    "0 = 11,25−½(10)t²",
    "cero igual a once coma veinticinco menos un medio por diez por t al cuadrado",
    "0=11.25-\\frac12(10)t^2",
    row(mn("0"), mo("="), mn("11,25"), mo("−"), frac(mn("1"), mn("2")), mo("("), mn("10"), mo(")"), sup(mi("t"), mn("2")))
  ),
  token(
    "Δx = vₓt = 6,0(1,5) = 9,0 m",
    "delta x igual a v sub x por t igual a seis por uno coma cinco igual a nueve metros",
    "\\Delta x=v_xt=6.0(1.5)=9.0\\,m",
    row(
      mo("Δ"), mi("x"), mo("="), sub(mi("v"), mi("x")), mi("t"), mo("="),
      mn("6,0"), mo("("), mn("1,5"), mo(")"), mo("="), mn("9,0"), mtext(" m")
    )
  ),
  token(
    "a_c = (3,0)²/1,5 = 6,0 m/s²",
    "a sub c igual a tres al cuadrado sobre uno coma cinco igual a seis metros por segundo al cuadrado",
    "a_c=\\frac{(3.0)^2}{1.5}=6.0\\,m/s^2",
    row(
      sub(mi("a"), mi("c")), mo("="), frac(sup(row(mo("("), mn("3,0"), mo(")")), mn("2")), mn("1,5")),
      mo("="), mn("6,0"), unitFraction("m", "s", "2")
    )
  ),
  token(
    "B×A = −(A×B)",
    "B producto cruz A igual a menos A producto cruz B",
    "\\vec B\\times\\vec A=-(\\vec A\\times\\vec B)",
    row(vector("B"), mo("×"), vector("A"), mo("="), mo("−"), mo("("), vector("A"), mo("×"), vector("B"), mo(")"))
  ),
  token(
    "Δx = x_f − x_i",
    "delta x igual a x final menos x inicial",
    "\\Delta x=x_f-x_i",
    row(mo("Δ"), mi("x"), mo("="), sub(mi("x"), mi("f")), mo("−"), sub(mi("x"), mi("i")))
  ),
  token(
    "v = dr/dt",
    "vector velocidad igual a derivada del vector posición respecto al tiempo",
    "\\vec v=d\\vec r/dt",
    row(vector("v"), mo("="), frac(row(mi("d"), vector("r")), row(mi("d"), mi("t"))))
  ),
  token(
    "a = dv/dt",
    "vector aceleración igual a derivada del vector velocidad respecto al tiempo",
    "\\vec a=d\\vec v/dt",
    row(vector("a"), mo("="), frac(row(mi("d"), vector("v")), row(mi("d"), mi("t"))))
  ),
  token(
    "r = r r̂",
    "vector r igual a coordenada r por unitario radial",
    "\\vec r=r\\hat r",
    row(vector("r"), mo("="), mi("r"), unitVector("r"))
  ),
  token(
    "v_persona/suelo = v_persona/banda + v_banda/suelo",
    "velocidad de la persona respecto al suelo igual a velocidad de la persona respecto a la banda más velocidad de la banda respecto al suelo",
    "v_{persona/suelo}=v_{persona/banda}+v_{banda/suelo}",
    row(
      sub(mi("v"), mtext("persona/suelo")), mo("="),
      sub(mi("v"), mtext("persona/banda")), mo("+"),
      sub(mi("v"), mtext("banda/suelo"))
    )
  ),
  token(
    "v_A/C = v_A/B + v_B/C",
    "velocidad de A respecto a C igual a velocidad de A respecto a B más velocidad de B respecto a C",
    "v_{A/C}=v_{A/B}+v_{B/C}",
    row(
      sub(mi("v"), mtext("A/C")), mo("="),
      sub(mi("v"), mtext("A/B")), mo("+"),
      sub(mi("v"), mtext("B/C"))
    )
  ),
  token(
    "dr̂/dt = θ̇ θ̂ y dθ̂/dt = −θ̇ r̂",
    "derivada del unitario radial igual a theta punto por unitario theta y derivada del unitario theta igual a menos theta punto por unitario radial",
    "d\\hat r/dt=\\dot\\theta\\hat\\theta,\\quad d\\hat\\theta/dt=-\\dot\\theta\\hat r",
    row(
      frac(row(mi("d"), unitVector("r")), row(mi("d"), mi("t"))), mo("="),
      mover(mi("θ"), mo("˙")), unitVector("θ"), mtext(" y "),
      frac(row(mi("d"), unitVector("θ")), row(mi("d"), mi("t"))), mo("="), mo("−"),
      mover(mi("θ"), mo("˙")), unitVector("r")
    )
  ),
  token(
    "A = Aₓ i + Aᵧ j + A_z k",
    "vector A igual a A sub x i más A sub y j más A sub z k",
    "\\vec A=A_x\\hat i+A_y\\hat j+A_z\\hat k",
    row(
      vector("A"), mo("="), sub(mi("A"), mi("x")), unitVector("i"), mo("+"),
      sub(mi("A"), mi("y")), unitVector("j"), mo("+"),
      sub(mi("A"), mi("z")), unitVector("k")
    )
  ),
  token(
    "A = 2i + λj − k y B = 3i − 2j + 4k",
    "vector A igual a dos i más lambda j menos k y vector B igual a tres i menos dos j más cuatro k",
    "\\vec A=2\\hat i+\\lambda\\hat j-\\hat k,\\quad\\vec B=3\\hat i-2\\hat j+4\\hat k",
    row(
      vector("A"), mo("="), mn("2"), unitVector("i"), mo("+"), mi("λ"), unitVector("j"), mo("−"), unitVector("k"),
      mtext(" y "), vector("B"), mo("="), mn("3"), unitVector("i"), mo("−"), mn("2"), unitVector("j"), mo("+"), mn("4"), unitVector("k")
    )
  ),
  token(
    "A = a i + 2j y B = 3i − j",
    "vector A igual a a i más dos j y vector B igual a tres i menos j",
    "\\vec A=a\\hat i+2\\hat j,\\quad\\vec B=3\\hat i-\\hat j",
    row(
      vector("A"), mo("="), mi("a"), unitVector("i"), mo("+"), mn("2"), unitVector("j"),
      mtext(" y "), vector("B"), mo("="), mn("3"), unitVector("i"), mo("−"), unitVector("j")
    )
  ),
  token(
    "r(t) = (2t)i + (t²−1)j",
    "vector posición de t igual a dos t i más t al cuadrado menos uno j",
    "\\vec r(t)=2t\\hat i+(t^2-1)\\hat j",
    row(
      vector("r"), mo("("), mi("t"), mo(")"), mo("="), mn("2"), mi("t"), unitVector("i"), mo("+"),
      mo("("), sup(mi("t"), mn("2")), mo("−"), mn("1"), mo(")"), unitVector("j")
    )
  ),
  token(
    "v(t) = v(0)+∫₀ᵗ(2,0 m/s³)τ dτ",
    "velocidad de t igual a velocidad de cero más integral desde cero hasta t de dos coma cero metros por segundo cúbico por tau diferencial de tau",
    "v(t)=v(0)+\\int_0^t(2.0\\,\\mathrm{m/s^3})\\tau\\,d\\tau",
    row(
      functionOf("v", "t"), mo("="), functionOf("v", "0"), mo("+"),
      integral(mn("0"), mi("t")), mo("("), mn("2,0"), mspace("0.25em"),
      unitFraction("m", "s", "3"), mo(")"), mi("τ"), mi("dτ")
    )
  ),
  token(
    "x = x₀+v₀t+½at²",
    "x igual a x sub cero más v sub cero por t más un medio a t al cuadrado",
    "x=x_0+v_0t+\\frac12at^2",
    row(
      mi("x"), mo("="), sub(mi("x"), mn("0")), mo("+"), sub(mi("v"), mn("0")), mi("t"), mo("+"),
      frac(mn("1"), mn("2")), mi("a"), sup(mi("t"), mn("2"))
    )
  ),
  token(
    "v = v₀+at",
    "v igual a v sub cero más a por t",
    "v=v_0+at",
    row(mi("v"), mo("="), sub(mi("v"), mn("0")), mo("+"), mi("a"), mi("t"))
  ),
  token(
    "a_r = −(v²/R) r̂",
    "a sub r igual a menos v al cuadrado sobre R por unitario radial",
    "a_r=-(v^2/R)\\hat r",
    row(
      sub(mi("a"), mi("r")), mo("="), mo("−"),
      frac(sup(mi("v"), mn("2")), mi("R")), unitVector("r")
    )
  ),
  token(
    "a_t = dv/dt y a_r = v²/R",
    "a sub t igual a derivada de v respecto a t y a sub r igual a v al cuadrado sobre R",
    "a_t=dv/dt,\\quad a_r=v^2/R",
    row(
      sub(mi("a"), mi("t")), mo("="), frac(row(mi("d"), mi("v")), row(mi("d"), mi("t"))),
      mtext(" y "), sub(mi("a"), mi("r")), mo("="), frac(sup(mi("v"), mn("2")), mi("R"))
    )
  ),
  token(
    "−rθ̇² r̂",
    "menos r theta punto al cuadrado por unitario radial",
    "-r\\dot\\theta^2\\hat r",
    row(mo("−"), mi("r"), sup(mover(mi("θ"), mo("˙")), mn("2")), unitVector("r"))
  ),
  token(
    "−Rω² r̂",
    "menos R omega al cuadrado por unitario radial",
    "-R\\omega^2\\hat r",
    row(mo("−"), mi("R"), sup(mi("ω"), mn("2")), unitVector("r"))
  ),
  token(
    "√(6,36²+3,97²)",
    "raíz cuadrada de seis coma treinta y seis al cuadrado más tres coma noventa y siete al cuadrado",
    "\\sqrt{6.36^2+3.97^2}",
    sqrt(row(sup(mn("6,36"), mn("2")), mo("+"), sup(mn("3,97"), mn("2"))))
  ),
  token(
    "|A+B|²−|A−B|²",
    "magnitud de A más B al cuadrado menos magnitud de A menos B al cuadrado",
    "|A+B|^2-|A-B|^2",
    row(
      sup(magnitude(row(vector("A"), mo("+"), vector("B"))), mn("2")), mo("−"),
      sup(magnitude(row(vector("A"), mo("−"), vector("B"))), mn("2"))
    )
  ),
  token(
    "|A+B| = |A−B|",
    "magnitud de A más B igual a magnitud de A menos B",
    "|A+B|=|A-B|",
    row(
      magnitude(row(vector("A"), mo("+"), vector("B"))),
      mo("="),
      magnitude(row(vector("A"), mo("−"), vector("B")))
    )
  ),
  token(
    "Aₓ = A cos θ y Aᵧ = A sin θ",
    "A sub x igual a A coseno theta y A sub y igual a A seno theta",
    "A_x=A\\cos\\theta,\\quad A_y=A\\sin\\theta",
    row(
      sub(mi("A"), mi("x")), mo("="), mi("A"), mi("cos"), mi("θ"), mtext(" y "),
      sub(mi("A"), mi("y")), mo("="), mi("A"), mi("sin"), mi("θ"))
  ),
  token(
    "v_B/A = −v_A/B",
    "velocidad de B respecto a A igual a menos velocidad de A respecto a B",
    "v_{B/A}=-v_{A/B}",
    row(sub(mi("v"), mtext("B/A")), mo("="), mo("−"), sub(mi("v"), mtext("A/B")))
  ),
  token(
    "aₓ = 0 y aᵧ = −g",
    "a sub x igual a cero y a sub y igual a menos g",
    "a_x=0,\\quad a_y=-g",
    row(sub(mi("a"), mi("x")), mo("="), mn("0"), mtext(" y "), sub(mi("a"), mi("y")), mo("="), mo("−"), mi("g"))
  ),
  token(
    "vᵧ = 0 y aᵧ = −g",
    "v sub y igual a cero y a sub y igual a menos g",
    "v_y=0,\\quad a_y=-g",
    row(sub(mi("v"), mi("y")), mo("="), mn("0"), mtext(" y "), sub(mi("a"), mi("y")), mo("="), mo("−"), mi("g"))
  ),
  token(
    "ṙ = r̈ = 0 y θ̈ = 0",
    "r punto igual a r dos puntos igual a cero y theta dos puntos igual a cero",
    "\\dot r=\\ddot r=0,\\quad\\ddot\\theta=0",
    row(
      mover(mi("r"), mo("˙")), mo("="), mover(mi("r"), mo("¨")), mo("="), mn("0"),
      mtext(" y "), mover(mi("θ"), mo("¨")), mo("="), mn("0")
    )
  ),
  token(
    "ṙ = r̈ = θ̈ = 0",
    "r punto igual a r dos puntos igual a theta dos puntos igual a cero",
    "\\dot r=\\ddot r=\\ddot\\theta=0",
    row(mover(mi("r"), mo("˙")), mo("="), mover(mi("r"), mo("¨")), mo("="), mover(mi("θ"), mo("¨")), mo("="), mn("0"))
  ),
  token("m/s³", "metros por segundo al cubo", "\\mathrm{m/s^3}", unitFraction("m", "s", "3")),
  token("m/s²", "metros por segundo al cuadrado", "\\mathrm{m/s^2}", unitFraction("m", "s", "2")),
  token("km/h", "kilómetros por hora", "\\mathrm{km/h}", unitFraction("km", "h")),
  token("m/s", "metros por segundo", "\\mathrm{m/s}", unitFraction("m", "s")),
  token("s/m", "segundos por metro", "\\mathrm{s/m}", unitFraction("s", "m")),
  token("L/T²", "longitud sobre tiempo al cuadrado", "L/T^2", frac(mi("L"), sup(mi("T"), mn("2")))),
  token("L/T", "longitud sobre tiempo", "L/T", frac(mi("L"), mi("T"))),
  token("Δx/Δt", "delta x sobre delta t", "\\Delta x/\\Delta t", frac(row(mo("Δ"), mi("x")), row(mo("Δ"), mi("t")))),
  token("dx/dt", "derivada de x respecto a t", "dx/dt", frac(row(mi("d"), mi("x")), row(mi("d"), mi("t")))),
  token("dy/dt", "derivada de y respecto a t", "dy/dt", frac(row(mi("d"), mi("y")), row(mi("d"), mi("t")))),
  token("dv/dt", "derivada de v respecto a t", "dv/dt", frac(row(mi("d"), mi("v")), row(mi("d"), mi("t")))),
  token("dvₓ/dt", "derivada de v sub x respecto a t", "dv_x/dt", frac(row(mi("d"), sub(mi("v"), mi("x"))), row(mi("d"), mi("t")))),
  token("dvᵧ/dt", "derivada de v sub y respecto a t", "dv_y/dt", frac(row(mi("d"), sub(mi("v"), mi("y"))), row(mi("d"), mi("t")))),
  token("(v₀+v)/2", "v sub cero más v sobre dos", "(v_0+v)/2", frac(row(sub(mi("v"), mn("0")), mo("+"), mi("v")), mn("2"))),
  token("v²/R", "v al cuadrado sobre R", "v^2/R", frac(sup(mi("v"), mn("2")), mi("R"))),
  token("2/3", "dos tercios", "2/3", frac(mn("2"), mn("3"))),
  token("10⁴", "diez a la cuarta", "10^4", sup(mn("10"), mn("4"))),
  token("10³", "diez al cubo", "10^3", sup(mn("10"), mn("3"))),
  token("t²", "t al cuadrado", "t^2", sup(mi("t"), mn("2"))),
  token("v²", "v al cuadrado", "v^2", sup(mi("v"), mn("2"))),
  token("ω²", "omega al cuadrado", "\\omega^2", sup(mi("ω"), mn("2"))),
  token("½", "un medio", "1/2", frac(mn("1"), mn("2"))),
  token("|v|", "magnitud de v", "|v|", absoluteValue(mi("v"))),
  token("A·B", "A producto punto B", "\\vec A\\cdot\\vec B", row(vector("A"), mo("·"), vector("B"))),
  token("A×B", "A producto cruz B", "\\vec A\\times\\vec B", row(vector("A"), mo("×"), vector("B"))),
  token("B×A", "B producto cruz A", "\\vec B\\times\\vec A", row(vector("B"), mo("×"), vector("A"))),
  token("−B", "menos vector B", "-\\vec B", row(mo("−"), vector("B"))),
  token("+x", "eje x positivo", "+x", row(mo("+"), mi("x"))),
  token("−x", "eje x negativo", "-x", row(mo("−"), mi("x"))),
  identifier("v_persona/suelo", "v", "persona/suelo"),
  identifier("v_persona/banda", "v", "persona/banda"),
  identifier("v_banda/suelo", "v", "banda/suelo"),
  identifier("t_detención", "t", "detención", "tiempo de detención"),
  identifier("v_A/B", "v", "A/B", "velocidad de A respecto a B"),
  identifier("v_A/C", "v", "A/C", "velocidad de A respecto a C"),
  identifier("v_B/C", "v", "B/C", "velocidad de B respecto a C"),
  identifier("v_B/A", "v", "B/A", "velocidad de B respecto a A"),
  identifier("A_z", "A", "z", "A sub z"),
  identifier("x_f", "x", "f", "posición final"),
  identifier("x_i", "x", "i", "posición inicial"),
  identifier("v_f", "v", "f", "velocidad final"),
  identifier("v_i", "v", "i", "velocidad inicial"),
  identifier("t_f", "t", "f", "tiempo final"),
  identifier("t_i", "t", "i", "tiempo inicial"),
  identifier("a_c", "a", "c", "aceleración centrípeta"),
  identifier("a_r", "a", "r", "aceleración radial"),
  identifier("a_t", "a", "t", "aceleración tangencial"),
  identifier("Aₓ", "A", "x"),
  identifier("Aᵧ", "A", "y"),
  identifier("aₓ", "a", "x"),
  identifier("aᵧ", "a", "y"),
  identifier("vₓ", "v", "x"),
  identifier("vᵧ", "v", "y"),
  identifier("v₀", "v", "0"),
  identifier("x₀", "x", "0"),
  token("Δx", "delta x", "\\Delta x", row(mo("Δ"), mi("x"))),
  token("Δt", "delta t", "\\Delta t", row(mo("Δ"), mi("t"))),
  token("Δv", "delta v", "\\Delta v", row(mo("Δ"), mi("v"))),
  token("r̂", "unitario radial", "\\hat r", unitVector("r")),
  token("θ̂", "unitario theta", "\\hat\\theta", unitVector("θ")),
  token("ṙ", "r punto", "\\dot r", mover(mi("r"), mo("˙"))),
  token("r̈", "r dos puntos", "\\ddot r", mover(mi("r"), mo("¨"))),
  token("θ̇", "theta punto", "\\dot\\theta", mover(mi("θ"), mo("˙"))),
  token("θ̈", "theta dos puntos", "\\ddot\\theta", mover(mi("θ"), mo("¨"))),
  token("x(t)", "x de t", "x(t)", functionOf("x", "t")),
  token("v(t)", "v de t", "v(t)", functionOf("v", "t")),
  token("a(t)", "a de t", "a(t)", functionOf("a", "t")),
  token("r(t)", "vector r de t", "\\vec r(t)", row(vector("r"), mo("("), mi("t"), mo(")"))),
  token("v(0)", "v de cero", "v(0)", functionOf("v", "0")),
  token("v(6)", "v de seis", "v(6)", functionOf("v", "6")),
  token("atan2(Aᵧ,Aₓ)", "atan dos de A sub y y A sub x", "\\operatorname{atan2}(A_y,A_x)", row(mi("atan2"), mo("("), sub(mi("A"), mi("y")), mo(","), sub(mi("A"), mi("x")), mo(")"))),
  token("arctan(Aᵧ/Aₓ)", "arco tangente de A sub y sobre A sub x", "\\arctan(A_y/A_x)", row(mi("arctan"), mo("("), frac(sub(mi("A"), mi("y")), sub(mi("A"), mi("x"))), mo(")"))),
].sort((first, second) => second.literal.length - first.literal.length);

// La sustitución es deliberadamente literal y se ejecuta en Astro. No intenta
// comprender LaTeX ni inferir fórmulas a partir de texto editorial.
export const presentUnit1RichText = (source) => {
  if (typeof source !== "string" || source.length === 0) return source;

  let segments = [textSegment(source)];

  UNIT_1_INLINE_MATH_TOKENS.forEach((entry) => {
    segments = segments.flatMap((segment) => {
      if (segment.type !== "text" || !segment.value.includes(entry.literal)) {
        return segment;
      }

      const parts = segment.value.split(entry.literal);
      return parts.flatMap((part, index) => [
        ...(index > 0 ? [entry.segment] : []),
        ...(part ? [textSegment(part)] : []),
      ]);
    });
  });

  return segments.length === 1 && segments[0].type === "text"
    ? source
    : segments;
};

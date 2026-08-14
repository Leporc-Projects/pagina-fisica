import { absoluteValue, blockMath, frac, mi, mn, mo, row, sqrt, sub, sup, vector } from "../../../utils/mathml.js";

const formula = ({ id, label, tex, body, represents, variables, conditions, interpretation, dimensions, commonErrors = [], related = [] }) => ({
  id, label, mathml: blockMath(label, tex, body), represents, variables, conditions, interpretation, dimensions, commonErrors, related,
});
const sigma = (axis = null) => row(mo("Σ"), axis ? sub(mi("F"), mi(axis)) : sub(vector("F"), mi("ext")));
const sq = (value) => sup(mi(value), mn("2"));

export const UNIT_3_FORMULAS = {
  "equilibrium-vector": formula({
    id: "equilibrium-vector", label: "Condición vectorial de equilibrio traslacional", tex: "\\sum\\vec F_{ext}=0",
    body: row(sigma(), mo("="), vector("0")), represents: "La condición de aceleración traslacional cero en un marco inercial.",
    variables: [{ symbol: "ΣF⃗_ext", meaning: "suma de fuerzas externas sobre el sistema", unit: "N" }],
    conditions: ["El marco es inercial.", "La frontera del sistema está declarada."], interpretation: "Reposo y movimiento rectilíneo con velocidad constante son compatibles.",
    dimensions: "Todos los términos tienen dimensión de fuerza.", commonErrors: ["Confundir equilibrio con reposo.", "Concluir que no actúa ninguna fuerza."], related: ["equilibrium-components"],
  }),
  "equilibrium-components": formula({
    id: "equilibrium-components", label: "Equilibrio por componentes cartesianas", tex: "\\sum F_x=0,\\quad\\sum F_y=0,\\quad\\sum F_z=0",
    body: row(sigma("x"), mo("="), mn("0"), mo(","), sigma("y"), mo("="), mn("0"), mo(","), sigma("z"), mo("="), mn("0")),
    represents: "Las proyecciones cartesianas de una sola condición vectorial de equilibrio.",
    variables: [{ symbol: "ΣF_i", meaning: "componente i de la fuerza neta", unit: "N" }], conditions: ["Todas las fuerzas usan la misma base cartesiana.", "Los signos están declarados."],
    interpretation: "Cada componente independiente debe anularse.", dimensions: "Cada ecuación suma fuerzas en newtons.", commonErrors: ["Verificar solo una componente."], related: ["equilibrium-vector"],
  }),
  "normal-incline-special": formula({
    id: "normal-incline-special", label: "Normal en un plano inclinado bajo condiciones específicas", tex: "N=mg\\cos\\theta",
    body: row(mi("N"), mo("="), mi("m"), mi("g"), mi("cos"), mi("θ")), represents: "La normal especial de un bloque sin aceleración perpendicular al plano.",
    variables: [{ symbol: "N", meaning: "fuerza normal", unit: "N" }, { symbol: "m", meaning: "masa", unit: "kg" }, { symbol: "g", meaning: "campo gravitacional local", unit: "m/s²" }, { symbol: "θ", meaning: "ángulo del plano", unit: "rad o °" }],
    conditions: ["El contacto se mantiene.", "La aceleración perpendicular es cero.", "Ninguna otra fuerza posee componente perpendicular al plano."], interpretation: "No es una fórmula universal para la normal.",
    dimensions: "N = kg·m/s².", commonErrors: ["Usar N=mg en todo contacto.", "Aplicar N=mg cosθ con otras fuerzas perpendiculares."],
  }),
  "elevator-normal": formula({
    id: "elevator-normal", label: "Normal en movimiento vertical", tex: "N-mg=ma_y\\Rightarrow N=m(g+a_y)",
    body: row(mi("N"), mo("−"), mi("m"), mi("g"), mo("="), mi("m"), sub(mi("a"), mi("y")), mo("⇒"), mi("N"), mo("="), mi("m"), row(mo("("), mi("g"), mo("+"), sub(mi("a"), mi("y")), mo(")"))),
    represents: "El balance vertical de un cuerpo apoyado en un soporte horizontal.", variables: [{ symbol: "N", meaning: "fuerza de soporte", unit: "N" }, { symbol: "a_y", meaning: "aceleración vertical con +y hacia arriba", unit: "m/s²" }],
    conditions: ["El contacto con el soporte horizontal se mantiene.", "+y apunta hacia arriba."], interpretation: "N es el peso aparente, no la masa.", dimensions: "Todos los términos son fuerzas.", commonErrors: ["Interpretar la lectura cambiante como cambio de masa.", "Suponer siempre N=mg."],
  }),
  "static-friction-range": formula({
    id: "static-friction-range", label: "Intervalo de fricción estática", tex: "|f_s|\\leq\\mu_sN",
    body: row(absoluteValue(sub(mi("f"), mi("s"))), mo("≤"), sub(mi("μ"), mi("s")), mi("N")), represents: "El intervalo de valores que la fricción estática puede adoptar antes del deslizamiento.",
    variables: [{ symbol: "f_s", meaning: "fricción estática requerida", unit: "N" }, { symbol: "μ_s", meaning: "coeficiente de fricción estática", unit: "adimensional" }, { symbol: "N", meaning: "normal", unit: "N" }],
    conditions: ["No existe deslizamiento relativo.", "Se usa el modelo de fricción seca de Coulomb."], interpretation: "La fricción real se ajusta hasta un máximo; la igualdad solo vale al umbral.", dimensions: "Ambos lados tienen unidad N.", commonErrors: ["Sustituir siempre f_s=μ_sN."],
  }),
  "kinetic-friction-model": formula({
    id: "kinetic-friction-model", label: "Modelo de fricción cinética", tex: "f_k=\\mu_kN",
    body: row(sub(mi("f"), mi("k")), mo("="), sub(mi("μ"), mi("k")), mi("N")), represents: "La magnitud aproximada de la fricción cuando las superficies deslizan.",
    variables: [{ symbol: "f_k", meaning: "magnitud de la fricción cinética", unit: "N" }, { symbol: "μ_k", meaning: "coeficiente cinético", unit: "adimensional" }, { symbol: "N", meaning: "normal", unit: "N" }],
    conditions: ["Las superficies están deslizando.", "Se usa la aproximación introductoria de fricción seca."], interpretation: "Su dirección es opuesta a la velocidad relativa de deslizamiento.", dimensions: "N en ambos lados.", commonErrors: ["Oponerla a la velocidad respecto al suelo.", "Ajustarla como fricción estática."],
  }),
  "linear-drag": formula({
    id: "linear-drag", label: "Modelo lineal de arrastre", tex: "\\vec F_D=-b\\vec v_{rel}",
    body: row(sub(vector("F"), mi("D")), mo("="), mo("−"), mi("b"), sub(vector("v"), mi("rel"))), represents: "Una fuerza de arrastre lineal opuesta a la velocidad relativa al fluido.",
    variables: [{ symbol: "F⃗_D", meaning: "fuerza de arrastre", unit: "N" }, { symbol: "b", meaning: "coeficiente lineal", unit: "kg/s" }, { symbol: "v⃗_rel", meaning: "velocidad respecto al fluido", unit: "m/s" }],
    conditions: ["Se ha declarado un régimen donde la aproximación lineal es válida."], interpretation: "El signo menos fija dirección opuesta a la velocidad relativa.", dimensions: "(kg/s)(m/s)=N.", commonErrors: ["Usar velocidad respecto al suelo.", "Tratar una ley de arrastre como universal."],
  }),
  "quadratic-drag": formula({
    id: "quadratic-drag", label: "Modelo cuadrático de arrastre", tex: "\\vec F_D=-c|\\vec v_{rel}|\\vec v_{rel}",
    body: row(sub(vector("F"), mi("D")), mo("="), mo("−"), mi("c"), absoluteValue(sub(vector("v"), mi("rel"))), sub(vector("v"), mi("rel"))), represents: "Una fuerza de magnitud cv_rel² opuesta a la velocidad relativa.",
    variables: [{ symbol: "c", meaning: "coeficiente cuadrático", unit: "kg/m" }, { symbol: "v⃗_rel", meaning: "velocidad respecto al fluido", unit: "m/s" }],
    conditions: ["Se ha declarado un régimen donde la aproximación cuadrática es válida."], interpretation: "El factor |v_rel| produce dependencia cuadrática sin perder la dirección vectorial.", dimensions: "(kg/m)(m²/s²)=N.", commonErrors: ["Usar velocidad respecto al suelo.", "Tratar una ley de arrastre como universal."],
  }),
  "terminal-speed-linear": formula({
    id: "terminal-speed-linear", label: "Rapidez terminal con arrastre lineal", tex: "v_t=\\frac{mg}{b}",
    body: row(sub(mi("v"), mi("t")), mo("="), frac(row(mi("m"), mi("g")), mi("b"))), represents: "La magnitud de rapidez terminal bajo arrastre lineal.",
    variables: [{ symbol: "v_t", meaning: "rapidez terminal", unit: "m/s" }, { symbol: "b", meaning: "coeficiente lineal", unit: "kg/s" }],
    conditions: ["Caída vertical.", "Arrastre lineal.", "Flotación despreciada.", "Estado terminal con a=0."], interpretation: "La gravedad sigue actuando y el arrastre la balancea.", dimensions: "(kg·m/s²)/(kg/s)=m/s.", commonErrors: ["Afirmar que desaparece la gravedad."], related: ["linear-drag"],
  }),
  "terminal-speed-quadratic": formula({
    id: "terminal-speed-quadratic", label: "Rapidez terminal con arrastre cuadrático", tex: "v_t=\\sqrt{\\frac{mg}{c}}",
    body: row(sub(mi("v"), mi("t")), mo("="), sqrt(frac(row(mi("m"), mi("g")), mi("c")))), represents: "La magnitud de rapidez terminal bajo arrastre cuadrático.",
    variables: [{ symbol: "v_t", meaning: "rapidez terminal", unit: "m/s" }, { symbol: "c", meaning: "coeficiente cuadrático", unit: "kg/m" }],
    conditions: ["Caída vertical.", "Arrastre cuadrático.", "Flotación despreciada.", "Estado terminal con a=0."], interpretation: "La raíz surge del balance mg=cv_t².", dimensions: "La cantidad bajo la raíz tiene dimensión m²/s².", commonErrors: ["Afirmar que desaparece la gravedad."], related: ["quadratic-drag"],
  }),
  "radial-newton": formula({
    id: "radial-newton", label: "Segunda ley en dirección radial", tex: "\\sum F_{in}=m\\frac{v^2}{R}",
    body: row(sigma("in"), mo("="), mi("m"), frac(sq("v"), mi("R"))), represents: "La segunda ley proyectada hacia el centro de una trayectoria circular.",
    variables: [{ symbol: "ΣF_in", meaning: "resultante radial hacia el centro", unit: "N" }, { symbol: "v", meaning: "rapidez instantánea", unit: "m/s" }, { symbol: "R", meaning: "radio local", unit: "m" }],
    conditions: ["La trayectoria es circular localmente.", "La convención radial está declarada."], interpretation: "Centrípeta describe la resultante radial, no una interacción nueva.", dimensions: "kg·(m²/s²)/m=N.", commonErrors: ["Añadir una fuerza centrípeta extra.", "Tratar la dirección radial como eje global fijo."],
  }),
  "flat-curve-limit": formula({
    id: "flat-curve-limit", label: "Límite ideal de rapidez en una curva plana", tex: "v_{max}=\\sqrt{\\mu_sgR}",
    body: row(sub(mi("v"), mi("max")), mo("="), sqrt(row(sub(mi("μ"), mi("s")), mi("g"), mi("R")))), represents: "La rapidez umbral antes de deslizar en el modelo simple de curva plana.",
    variables: [{ symbol: "v_max", meaning: "rapidez máxima ideal", unit: "m/s" }, { symbol: "μ_s", meaning: "coeficiente estático", unit: "adimensional" }, { symbol: "R", meaning: "radio", unit: "m" }],
    conditions: ["Curva horizontal sin peralte.", "La fricción estática proporciona toda la fuerza radial horizontal.", "No hay aceleración vertical.", "Se usa el modelo de Coulomb."], interpretation: "La masa se cancela en este modelo ideal.", dimensions: "gR tiene dimensión m²/s².", related: ["static-friction-range", "radial-newton"],
  }),
  "frictionless-bank": formula({
    id: "frictionless-bank", label: "Curva peraltada ideal sin fricción", tex: "\\tan\\theta=\\frac{v^2}{Rg}",
    body: row(mi("tan"), mi("θ"), mo("="), frac(sq("v"), row(mi("R"), mi("g")))), represents: "La relación entre peralte y rapidez de diseño sin fricción.",
    variables: [{ symbol: "θ", meaning: "ángulo de peralte", unit: "rad o °" }, { symbol: "v", meaning: "rapidez de diseño", unit: "m/s" }, { symbol: "R", meaning: "radio", unit: "m" }],
    conditions: ["La fricción es despreciable.", "La trayectoria circular es horizontal.", "La aceleración vertical es cero."], interpretation: "La componente horizontal de la normal aporta la resultante radial.", dimensions: "Ambos lados son adimensionales.", commonErrors: ["Suponer que el ángulo depende de la masa."], related: ["radial-newton"],
  }),
};

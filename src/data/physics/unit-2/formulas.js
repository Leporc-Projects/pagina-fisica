import { blockMath, frac, mi, mn, mo, row, sub, sup, vector } from "../../../utils/mathml.js";

const formula = ({ id, label, tex, body, represents, variables = [], conditions = [], interpretation = "", dimensions = "", commonErrors = [], related = [] }) => ({
  id, label, mathml: blockMath(label, tex, body), represents, variables, conditions, interpretation, dimensions, commonErrors, related,
});
const sigmaF = (index = null) => row(mo("Σ"), index ? sub(vector("F"), mi(index)) : vector("F"));

export const UNIT_2_FORMULAS = {
  "net-force-sum": formula({
    id: "net-force-sum", label: "Fuerza neta como suma vectorial", tex: "\\sum\\vec F_{ext}=\\vec F_1+\\vec F_2+\\cdots",
    body: row(sigmaF("ext"), mo("="), sub(vector("F"), mn("1")), mo("+"), sub(vector("F"), mn("2")), mo("+"), mo("⋯")),
    represents: "La resultante de todas las fuerzas externas sobre el sistema elegido.",
    variables: [{ symbol: "F⃗_i", meaning: "fuerza externa individual sobre el sistema", unit: "N" }],
    conditions: ["La frontera del sistema y el marco de referencia están declarados.", "Todas las fuerzas se expresan en la misma base."],
    interpretation: "La suma reemplaza el efecto conjunto, pero no constituye una interacción adicional.",
    dimensions: "Cada término tiene dimensión M·L/T².", commonErrors: ["Sumar magnitudes sin considerar dirección.", "Dibujar la resultante como una fuerza adicional."],
  }),
  "newton-unit": formula({
    id: "newton-unit", label: "Definición dimensional del newton", tex: "1\\,N=1\\,kg\\,m\\,s^{-2}",
    body: row(mn("1"), mi("N"), mo("="), mn("1"), mi("kg"), mo("·"), frac(mi("m"), sup(mi("s"), mn("2")))),
    represents: "La unidad SI de fuerza derivada de masa y aceleración.",
    variables: [{ symbol: "N", meaning: "newton, unidad SI de fuerza", unit: "kg·m/s²" }],
    conditions: ["Se emplean unidades base coherentes del SI."], interpretation: "Un newton produce 1 m/s² en una masa de 1 kg cuando es la fuerza neta.",
    dimensions: "M·L/T².", commonErrors: ["Expresar una fuerza en kilogramos."],
  }),
  "first-law-balance": formula({
    id: "first-law-balance", label: "Primera ley en un marco inercial", tex: "\\sum\\vec F=0\\Rightarrow\\vec a=0\\Rightarrow\\vec v=\\mathrm{constante}",
    body: row(sigmaF(), mo("="), vector("0"), mo("⇒"), vector("a"), mo("="), vector("0"), mo("⇒"), vector("v"), mo("="), mi("constante")),
    represents: "La conservación de la velocidad vectorial cuando la fuerza neta es cero.",
    variables: [{ symbol: "ΣF⃗", meaning: "fuerza neta", unit: "N" }, { symbol: "a⃗", meaning: "aceleración", unit: "m/s²" }, { symbol: "v⃗", meaning: "velocidad", unit: "m/s" }],
    conditions: ["La descripción se realiza en un marco inercial."], interpretation: "Incluye reposo y movimiento rectilíneo uniforme.",
    dimensions: "Cada igualdad compara cantidades de la misma clase.", commonErrors: ["Concluir que la velocidad debe ser cero.", "Concluir que no actúa ninguna fuerza."],
  }),
  "newton-second-law": formula({
    id: "newton-second-law", label: "Segunda ley de Newton para masa constante", tex: "\\sum\\vec F_{ext}=m\\vec a",
    body: row(sigmaF("ext"), mo("="), mi("m"), vector("a")),
    represents: "La relación entre fuerza neta externa y aceleración del mismo sistema.",
    variables: [{ symbol: "m", meaning: "masa inercial del sistema", unit: "kg" }, { symbol: "a⃗", meaning: "aceleración del sistema", unit: "m/s²" }],
    conditions: ["La masa es constante.", "Fuerzas y aceleración se describen en un marco inercial."],
    interpretation: "La aceleración es paralela a la fuerza neta y su magnitud vale F_net/m.",
    dimensions: "N = kg·m/s².", commonErrors: ["Igualar una fuerza individual con ma.", "Suponer que aceleración y velocidad deben ser paralelas."],
  }),
  "newton-second-law-components": formula({
    id: "newton-second-law-components", label: "Segunda ley por componentes cartesianas", tex: "\\sum F_x=ma_x,\\quad\\sum F_y=ma_y,\\quad\\sum F_z=ma_z",
    body: row(mo("Σ"), sub(mi("F"), mi("x")), mo("="), mi("m"), sub(mi("a"), mi("x")), mo(","), mo("Σ"), sub(mi("F"), mi("y")), mo("="), mi("m"), sub(mi("a"), mi("y")), mo(","), mo("Σ"), sub(mi("F"), mi("z")), mo("="), mi("m"), sub(mi("a"), mi("z"))),
    represents: "Tres proyecciones escalares de una única ecuación vectorial.",
    variables: [{ symbol: "ΣFᵢ", meaning: "componente i de la fuerza neta", unit: "N" }, { symbol: "aᵢ", meaning: "componente i de la aceleración", unit: "m/s²" }, { symbol: "m", meaning: "masa inercial", unit: "kg" }],
    conditions: ["Las componentes usan la misma base y convención de signos."], interpretation: "Cada eje puede resolverse por separado sin crear fuerzas adicionales.",
    dimensions: "Cada componente se expresa en N.", commonErrors: ["Tratar componentes como fuerzas nuevas."], related: ["newton-second-law"],
  }),
  "weight-near-surface": formula({
    id: "weight-near-surface", label: "Peso cerca de una superficie planetaria", tex: "\\vec W=m\\vec g",
    body: row(vector("W"), mo("="), mi("m"), vector("g")),
    represents: "La fuerza gravitacional sobre una masa en una región donde g puede tratarse como uniforme.",
    variables: [{ symbol: "W⃗", meaning: "peso", unit: "N" }, { symbol: "g⃗", meaning: "campo gravitacional local", unit: "m/s² o N/kg" }],
    conditions: ["La variación espacial de g es despreciable en la región."], interpretation: "La masa permanece; el peso cambia si cambia g.",
    dimensions: "kg·m/s² = N.", commonErrors: ["Confundir masa con peso.", "Usar kg como unidad de peso.", "Tratar 9,8 como valor universal exacto."],
  }),
  "third-law-pair": formula({
    id: "third-law-pair", label: "Par de fuerzas de la tercera ley", tex: "\\vec F_{A\\to B}=-\\vec F_{B\\to A}",
    body: row(sub(vector("F"), mi("A→B")), mo("="), mo("−"), sub(vector("F"), mi("B→A"))),
    represents: "Las dos fuerzas simultáneas de una misma interacción entre A y B.",
    variables: [{ symbol: "F⃗_A→B", meaning: "fuerza ejercida por A sobre B", unit: "N" }, { symbol: "F⃗_B→A", meaning: "fuerza ejercida por B sobre A", unit: "N" }],
    conditions: ["Cada fuerza actúa sobre un cuerpo diferente.", "Ambas se expresan en el mismo sistema de coordenadas."],
    interpretation: "Tienen igual magnitud y sentidos opuestos; no se cancelan en el DCL de un solo cuerpo.",
    dimensions: "Ambas tienen unidad N.", commonErrors: ["Colocar el par completo en un mismo DCL.", "Inferir aceleraciones iguales."],
  }),
  "galilean-position": formula({
    id: "galilean-position", label: "Transformación galileana de posición", tex: "\\vec r'=\\vec r-\\vec Vt",
    body: row(vector("r"), mo("′"), mo("="), vector("r"), mo("−"), vector("V"), mi("t")),
    represents: "La posición en S' cuando S' se mueve con velocidad constante V⃗ respecto a S.",
    variables: [{ symbol: "r⃗", meaning: "posición medida en S", unit: "m" }, { symbol: "r⃗'", meaning: "posición medida en S'", unit: "m" }, { symbol: "V⃗", meaning: "velocidad de S' respecto a S", unit: "m/s" }, { symbol: "t", meaning: "tiempo común clásico", unit: "s" }],
    conditions: ["Los orígenes coinciden en t = 0.", "V⃗ es constante."], interpretation: "Los observadores asignan posiciones diferentes al mismo evento.",
    dimensions: "Cada término tiene dimensión de longitud.", related: ["galilean-velocity"],
  }),
  "galilean-velocity": formula({
    id: "galilean-velocity", label: "Transformación galileana de velocidad", tex: "\\vec v'=\\vec v-\\vec V",
    body: row(vector("v"), mo("′"), mo("="), vector("v"), mo("−"), vector("V")),
    represents: "La velocidad medida desde un marco que se traslada con velocidad constante V⃗.",
    variables: [{ symbol: "v⃗", meaning: "velocidad medida en S", unit: "m/s" }, { symbol: "v⃗'", meaning: "velocidad medida en S'", unit: "m/s" }, { symbol: "V⃗", meaning: "velocidad de S' respecto a S", unit: "m/s" }],
    conditions: ["V⃗ es constante y se usa tiempo común clásico."], interpretation: "Las velocidades dependen del marco aunque ambos marcos sean inerciales.",
    dimensions: "Cada término tiene dimensión L/T.", related: ["galilean-position", "galilean-acceleration"],
  }),
  "galilean-acceleration": formula({
    id: "galilean-acceleration", label: "Invariancia galileana de la aceleración", tex: "\\vec a'=\\vec a",
    body: row(vector("a"), mo("′"), mo("="), vector("a")),
    represents: "La misma aceleración medida por marcos con velocidad relativa constante.",
    variables: [{ symbol: "a⃗", meaning: "aceleración medida en S", unit: "m/s²" }, { symbol: "a⃗'", meaning: "aceleración medida en S'", unit: "m/s²" }],
    conditions: ["La velocidad relativa V⃗ entre marcos es constante."], interpretation: "La forma de la segunda ley se conserva entre marcos inerciales galileanos.",
    dimensions: "Ambos lados tienen dimensión L/T².", commonErrors: ["Aplicarla entre marcos con aceleración relativa."], related: ["galilean-velocity"],
  }),
};

const example = (id, topic, title, context, givens, target, steps, conclusion, commonErrors = []) => ({
  id, topic, title, context, givens, target, steps, conclusion, commonErrors,
});
const steps = (...items) => items.map(([title, text, refs = {}], index) => ({ step: index + 1, title, text, ...refs }));

export const UNIT_3_WORKED_EXAMPLES = {
  "equilibrio-dos-cables": example(
    "equilibrio-dos-cables", "equilibrio", "Lámpara sostenida por dos cables simétricos",
    "Una lámpara de 120 N cuelga en equilibrio de dos cables idénticos, cada uno a 35° sobre la horizontal.",
    ["Peso de la lámpara: 120 N", "Ángulo de cada cable: 35° sobre la horizontal"], "Hallar la tensión de cada cable.",
    steps(
      ["Sistema y DCL", "El sistema es la lámpara: el peso actúa hacia abajo y las dos tensiones siguen los cables.", { visualizationId: "equilibrium-two-cables" }],
      ["Simetría", "Las componentes horizontales de las tensiones se cancelan."],
      ["Balance vertical", "La condición de equilibrio es 2T sin35° - 120 = 0.", { formulaId: "equilibrium-components" }],
      ["Cálculo", "T = 120/(2 sin35°) ≈ 104,6 N."],
    ),
    "Cada cable soporta una tensión aproximada de 105 N. La tensión es menor que 120 N porque los dos cables comparten la componente vertical.",
  ),
  "dos-bloques-contacto": example(
    "dos-bloques-contacto", "dinamica-particulas", "Dos bloques acelerados juntos",
    "Dos bloques de 2 kg y 3 kg están en contacto sobre una superficie horizontal sin fricción. Una fuerza de 20 N empuja el primero hacia el segundo.",
    ["m1 = 2 kg", "m2 = 3 kg", "F = 20 N"], "Hallar la aceleración común y la fuerza de contacto sobre m2.",
    steps(
      ["Sistema completo", "Para ambos bloques, a = 20/(2+3) = 4 m/s².", { visualizationId: "two-block-system-boundary" }],
      ["Aislar m2", "Sobre m2 la única fuerza horizontal es el contacto C."],
      ["Segunda ley", "C = m2 a = 3(4) = 12 N."],
      ["Par de interacción", "La fuerza de tercera ley sobre m1 tiene magnitud 12 N y sentido opuesto."],
    ),
    "La aceleración común es 4 m/s² y la fuerza de contacto sobre m2 es 12 N.",
  ),
  "ascensor-normal": example(
    "ascensor-normal", "fuerza-normal", "Lectura de una balanza en un ascensor",
    "Una persona de 60 kg está sobre una balanza mientras el ascensor acelera 1,5 m/s² hacia arriba.",
    ["m = 60 kg", "a_y = +1,5 m/s²", "g = 9,8 m/s²"], "Calcular la fuerza normal medida por la balanza.",
    steps(
      ["Convención y fuerzas", "+y apunta hacia arriba; N actúa arriba y mg abajo.", { visualizationId: "elevator-scale" }],
      ["Segunda ley", "N - mg = ma_y.", { formulaId: "elevator-normal" }],
      ["Cálculo", "N = m(g+a_y) = 60(9,8+1,5) = 678 N."],
      ["Comparación", "El peso es mg = 588 N, menor que la normal durante esta aceleración."],
    ),
    "La balanza mide una normal de 678 N, mayor que el peso porque la aceleración es hacia arriba.",
  ),
  "atwood-ideal": example(
    "atwood-ideal", "tension", "Máquina de Atwood ideal",
    "Dos masas están unidas por una cuerda ideal sobre una polea ideal; m1 = 2 kg y m2 = 3 kg.",
    ["m1 = 2 kg", "m2 = 3 kg", "g = 9,8 m/s²"], "Hallar la magnitud de la aceleración y la tensión.",
    steps(
      ["Convenciones", "Se toma positivo hacia arriba para m1 y hacia abajo para m2.", { visualizationId: "ideal-rope-pulley" }],
      ["Ecuaciones", "m2g - T = m2a y T - m1g = m1a."],
      ["Aceleración", "Al sumar: (m2-m1)g = (m1+m2)a, de donde a = 1,96 m/s²."],
      ["Tensión", "T = m1(g+a) = 2(11,76) = 23,52 N."],
    ),
    "La aceleración tiene magnitud 1,96 m/s² y la tensión es aproximadamente 23,5 N.",
  ),
  "friccion-estatica-no-maxima": example(
    "friccion-estatica-no-maxima", "friccion", "La fricción estática no siempre vale μ_sN",
    "Un bloque de 10 kg reposa en un piso horizontal con μ_s = 0,50 y recibe una fuerza horizontal de 20 N.",
    ["m = 10 kg", "μ_s = 0,50", "F_app = 20 N", "g = 9,8 m/s²"], "Determinar si permanece en reposo y la fricción estática real.",
    steps(
      ["Normal", "Como no hay aceleración vertical, N = mg = 98 N."],
      ["Máximo disponible", "f_s,max = μ_sN = 49 N.", { formulaId: "static-friction-range", visualizationId: "static-friction-response" }],
      ["Valor requerido", "El equilibrio solo requiere 20 N de fricción opuesta al empuje."],
      ["Comprobación", "Como 20 ≤ 49, el bloque permanece en reposo y f_s = 20 N."],
    ),
    "La fricción estática real es 20 N, no 49 N. 49 N es solo el máximo disponible.", ["static-friction-always-max"],
  ),
  "terminal-cuadratico": example(
    "terminal-cuadratico", "resistencia-fluidos", "Rapidez terminal con arrastre cuadrático",
    "Un cuerpo de 0,20 kg cae con arrastre cuadrático de magnitud cv², con c = 0,050 kg/m. Se ignora la flotación.",
    ["m = 0,20 kg", "c = 0,050 kg/m", "g = 9,8 m/s²"], "Hallar la magnitud de la rapidez terminal.",
    steps(
      ["Estado terminal", "A rapidez terminal la aceleración es cero."],
      ["Balance", "mg - cv_t² = 0.", { formulaId: "terminal-speed-quadratic", visualizationId: "terminal-speed-force-balance" }],
      ["Despeje", "v_t = sqrt(mg/c)."],
      ["Cálculo", "v_t = sqrt(0,20·9,8/0,050) = sqrt(39,2) ≈ 6,26 m/s."],
    ),
    "La rapidez terminal tiene magnitud aproximada de 6,3 m/s hacia abajo.", ["terminal-means-no-gravity"],
  ),
  "curva-plana": example(
    "curva-plana", "dinamica-circular", "Rapidez máxima en una curva plana ideal",
    "Una curva plana tiene radio 50 m y coeficiente de fricción estática 0,40.",
    ["R = 50 m", "μ_s = 0,40", "g = 9,8 m/s²"], "Hallar la rapidez máxima antes de deslizar.",
    steps(
      ["Balance vertical", "N = mg."],
      ["Dirección radial", "La fricción estática proporciona la fuerza radial requerida mv²/R.", { visualizationId: "flat-curve-fbd" }],
      ["Umbral", "En el límite, μ_smg = mv²/R.", { formulaId: "flat-curve-limit" }],
      ["Cálculo", "v_max = sqrt(μ_sgR) = sqrt(0,40·9,8·50) = 14,0 m/s."],
    ),
    "La rapidez máxima ideal es aproximadamente 14 m/s; la masa se cancela en este modelo.", ["centripetal-extra-force"],
  ),
  "clasificar-fuerzas": example(
    "clasificar-fuerzas", "fuerzas-fundamentales", "De una fuerza cotidiana a su origen físico",
    "Se clasifican gravedad, normal, fricción y tensión como interacciones fundamentales o fuerzas efectivas.",
    [], "Relacionar cada fuerza con la escala física apropiada.",
    steps(
      ["Gravedad", "La gravedad es una interacción fundamental.", { visualizationId: "fundamental-forces-map" }],
      ["Normal", "La normal es una fuerza de contacto macroscópica efectiva, principalmente de origen electromagnético."],
      ["Fricción", "La fricción es un modelo efectivo de contacto con origen electromagnético y microscópico."],
      ["Tensión", "La tensión es una fuerza efectiva transmitida por un material y emerge de interacciones microscópicas."],
    ),
    "En mecánica usamos fuerzas efectivas porque son la escala correcta para el problema, aunque su origen microscópico sea más profundo.", ["fundamental-vs-effective"],
  ),
};

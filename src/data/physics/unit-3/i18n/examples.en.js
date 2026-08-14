export default {
  "equilibrio-dos-cables": {
    title: "Lamp supported by two symmetric cables", context: "A 120 N lamp hangs in equilibrium from two identical cables, each 35° above the horizontal.",
    givens: ["Lamp weight: 120 N", "Angle of each cable: 35° above horizontal"], target: "Find the tension in each cable.",
    steps: [
      ["System and FBD", "The lamp is the system: weight acts downward and the two tensions follow the cables."],
      ["Symmetry", "The horizontal components of tension cancel."],
      ["Vertical balance", "The equilibrium condition is 2T sin35° - 120 = 0."],
      ["Calculation", "T = 120/(2 sin35°) ≈ 104.6 N."],
    ], conclusion: "Each cable carries about 105 N of tension. The tension is less than 120 N because the two cables share the vertical load.",
  },
  "dos-bloques-contacto": {
    title: "Two blocks accelerating together", context: "Two 2 kg and 3 kg blocks touch on a frictionless horizontal surface. A 20 N force pushes the first block toward the second.",
    givens: ["m1 = 2 kg", "m2 = 3 kg", "F = 20 N"], target: "Find the common acceleration and the contact force on m2.",
    steps: [["Combined system", "For both blocks, a = 20/(2+3) = 4 m/s²."], ["Isolate m2", "The only horizontal force on m2 is contact C."], ["Second law", "C = m2a = 3(4) = 12 N."], ["Interaction pair", "The third-law force on m1 has magnitude 12 N in the opposite direction."]],
    conclusion: "The common acceleration is 4 m/s² and the contact force on m2 is 12 N.",
  },
  "ascensor-normal": {
    title: "Scale reading in an elevator", context: "A 60 kg person stands on a scale while the elevator accelerates upward at 1.5 m/s².",
    givens: ["m = 60 kg", "a_y = +1.5 m/s²", "g = 9.8 m/s²"], target: "Find the normal force measured by the scale.",
    steps: [["Convention and forces", "+y is upward; N acts upward and mg downward."], ["Second law", "N - mg = ma_y."], ["Calculation", "N = m(g+a_y) = 60(9.8+1.5) = 678 N."], ["Comparison", "Weight is mg = 588 N, less than the normal force during this acceleration."]],
    conclusion: "The scale measures a 678 N normal force, greater than weight because acceleration is upward.",
  },
  "atwood-ideal": {
    title: "Ideal Atwood machine", context: "Two masses are connected by an ideal rope over an ideal pulley; m1 = 2 kg and m2 = 3 kg.",
    givens: ["m1 = 2 kg", "m2 = 3 kg", "g = 9.8 m/s²"], target: "Find the acceleration magnitude and tension.",
    steps: [["Conventions", "Take upward as positive for m1 and downward as positive for m2."], ["Equations", "m2g - T = m2a and T - m1g = m1a."], ["Acceleration", "Adding gives (m2-m1)g = (m1+m2)a, so a = 1.96 m/s²."], ["Tension", "T = m1(g+a) = 2(11.76) = 23.52 N."]],
    conclusion: "The acceleration magnitude is 1.96 m/s² and the tension is about 23.5 N.",
  },
  "friccion-estatica-no-maxima": {
    title: "Static friction is not always μ_sN", context: "A 10 kg block rests on a horizontal floor with μ_s = 0.50 while a 20 N horizontal force is applied.",
    givens: ["m = 10 kg", "μ_s = 0.50", "F_app = 20 N", "g = 9.8 m/s²"], target: "Determine whether it remains at rest and find the actual static friction.",
    steps: [["Normal force", "With no vertical acceleration, N = mg = 98 N."], ["Available maximum", "f_s,max = μ_sN = 49 N."], ["Required value", "Equilibrium requires only 20 N of friction opposite the push."], ["Check", "Because 20 ≤ 49, the block remains at rest and f_s = 20 N."]],
    conclusion: "The actual static friction is 20 N, not 49 N. 49 N is only the available maximum.",
  },
  "terminal-cuadratico": {
    title: "Terminal speed with quadratic drag", context: "A 0.20 kg body falls with quadratic drag magnitude cv², where c = 0.050 kg/m. Buoyancy is ignored.",
    givens: ["m = 0.20 kg", "c = 0.050 kg/m", "g = 9.8 m/s²"], target: "Find the terminal-speed magnitude.",
    steps: [["Terminal state", "At terminal speed acceleration is zero."], ["Balance", "mg - cv_t² = 0."], ["Solve", "v_t = sqrt(mg/c)."], ["Calculation", "v_t = sqrt(0.20·9.8/0.050) = sqrt(39.2) ≈ 6.26 m/s."]],
    conclusion: "Terminal speed has magnitude about 6.3 m/s downward.",
  },
  "curva-plana": {
    title: "Maximum speed on an ideal flat curve", context: "A flat curve has radius 50 m and static-friction coefficient 0.40.",
    givens: ["R = 50 m", "μ_s = 0.40", "g = 9.8 m/s²"], target: "Find the maximum speed before sliding.",
    steps: [["Vertical balance", "N = mg."], ["Radial direction", "Static friction supplies the required radial force mv²/R."], ["Threshold", "At the limit, μ_smg = mv²/R."], ["Calculation", "v_max = sqrt(μ_sgR) = sqrt(0.40·9.8·50) = 14.0 m/s."]],
    conclusion: "The ideal maximum speed is about 14 m/s; mass cancels in this model.",
  },
  "clasificar-fuerzas": {
    title: "From an everyday force to its physical origin", context: "Classify gravity, normal force, friction, and tension as fundamental interactions or effective forces.",
    givens: [], target: "Relate each force to the appropriate physical scale.",
    steps: [["Gravity", "Gravity is a fundamental interaction."], ["Normal force", "Normal force is an effective macroscopic contact force, mainly electromagnetic in origin."], ["Friction", "Friction is an effective contact model with electromagnetic and microscopic origins."], ["Tension", "Tension is an effective force transmitted through material and emerges from microscopic interactions."]],
    conclusion: "Mechanics uses effective forces because they are the right scale for the problem even when their microscopic origin is deeper.",
  },
};

const error = (id, topic, subtopic, description, feedback) => ({ id, topic, subtopic, description, feedback });

export const UNIT_3_COMMON_ERRORS = [
  error("equilibrium-means-rest", "equilibrio", "condicion-de-equilibrio", "Confundir equilibrio con reposo.", "Equilibrio traslacional significa a=0; la velocidad puede ser constante y no nula."),
  error("equilibrium-means-no-forces", "equilibrio", "condicion-de-equilibrio", "Concluir que ΣF=0 implica ausencia de fuerzas.", "Fuerzas no nulas pueden compensarse vectorialmente."),
  error("equilibrium-components-incomplete", "equilibrio", "condicion-de-equilibrio", "Verificar solo una componente y declarar equilibrio.", "Todas las componentes independientes de la resultante deben ser cero."),
  error("mixed-system-equations", "dinamica-particulas", "del-dcl-a-la-ecuacion", "Mezclar en una ecuación fuerzas y aceleraciones de cuerpos diferentes.", "Cada segunda ley debe referirse a un sistema declarado."),
  error("constraint-guessed", "dinamica-particulas", "restricciones-de-movimiento", "Memorizar una relación de aceleraciones de polea sin derivarla de la cuerda.", "Escribe la longitud constante y deriva la restricción."),
  error("normal-always-mg", "fuerza-normal", "significado-de-normal", "Usar N=mg en cualquier contacto.", "N se obtiene del balance perpendicular y depende de otras fuerzas y aceleración."),
  error("normal-incline-used-blindly", "fuerza-normal", "normal-en-superficie-inclinada", "Usar N=mg cosθ aunque exista otra fuerza perpendicular al plano.", "Reescribe ΣF_perp=ma_perp incluyendo todas las componentes."),
  error("scale-measures-mass-directly", "fuerza-normal", "normal-en-sistemas-acelerados", "Interpretar una lectura cambiante de balanza como cambio de masa.", "La balanza responde a la fuerza de soporte; la masa puede permanecer constante."),
  error("tension-always-mg", "tension", "que-es-la-tension", "Suponer T=mg en cualquier cuerda vertical.", "T=mg solo bajo condiciones particulares, como equilibrio de ese cuerpo."),
  error("tension-same-with-massive-rope", "tension", "cuerda-y-polea-ideales", "Extender «misma T» a una cuerda con masa o a una polea con inercia.", "La igualdad de tensiones pertenece al modelo ideal."),
  error("friction-opposes-ground-velocity", "friccion", "direccion-de-friccion", "Elegir fricción opuesta a la velocidad respecto al suelo.", "Analiza el movimiento relativo o su tendencia entre las superficies en contacto."),
  error("static-friction-always-max", "friccion", "friccion-estatica", "Sustituir siempre f_s=μ_sN.", "Primero calcula la fricción requerida; μ_sN es solo el máximo."),
  error("kinetic-friction-adjusts-like-static", "friccion", "friccion-cinetica", "Ajustar f_k para imponer equilibrio.", "En el modelo cinético su magnitud se aproxima por μ_kN."),
  error("friction-coefficient-has-units", "friccion", "friccion-estatica", "Dar unidades a μ.", "Es un cociente de fuerzas en este modelo y es adimensional."),
  error("drag-uses-ground-speed", "resistencia-fluidos", "fuerza-de-arrastre", "Usar velocidad respecto al suelo cuando el fluido se mueve.", "Usa la velocidad relativa del cuerpo respecto al fluido."),
  error("one-drag-law-universal", "resistencia-fluidos", "modelo-y-realidad", "Aplicar bv o cv² sin declarar el régimen.", "La ley de arrastre es una aproximación dependiente del régimen."),
  error("terminal-means-no-gravity", "resistencia-fluidos", "rapidez-terminal", "Afirmar que a rapidez terminal no actúa gravedad.", "La gravedad sigue actuando; la resultante se anula por balance de fuerzas."),
  error("centripetal-extra-force", "dinamica-circular", "fuerza-radial-neta", "Añadir una fuerza centrípeta además de tensión, normal o fricción.", "«Centrípeta» describe la resultante radial necesaria, no una interacción adicional."),
  error("radial-direction-fixed", "dinamica-circular", "circulo-vertical", "Tratar la dirección radial como un eje fijo global.", "La dirección hacia el centro cambia con la posición sobre la trayectoria."),
  error("fundamental-vs-effective", "fuerzas-fundamentales", "fuerzas-cotidianas-emergentes", "Clasificar normal, tensión o fricción como interacciones fundamentales independientes.", "Son modelos efectivos macroscópicos; su origen microscópico es principalmente electromagnético."),
];

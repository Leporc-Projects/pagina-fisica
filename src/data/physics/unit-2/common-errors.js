const error = (id, topic, subtopic, description, feedback) => ({ id, topic, subtopic, description, feedback });

export const UNIT_2_COMMON_ERRORS = [
  error("force-required-for-motion", "primera-ley", "inercia", "Suponer que todo objeto en movimiento necesita una fuerza neta hacia adelante.", "Se necesita fuerza neta para cambiar la velocidad; una velocidad constante puede mantenerse con fuerza neta cero."),
  error("zero-net-force-means-no-forces", "primera-ley", "fuerza-neta-cero", "Interpretar fuerza neta cero como ausencia de fuerzas individuales.", "Haz el inventario completo y suma vectores: fuerzas no nulas pueden equilibrarse."),
  error("acceleration-follows-velocity", "segunda-ley", "fuerza-neta-y-aceleracion", "Forzar la aceleración a apuntar en la dirección de la velocidad.", "La aceleración apunta con la fuerza neta; compárala con v solo para interpretar cómo cambia el movimiento."),
  error("use-one-force-instead-of-net-force", "segunda-ley", "fuerza-neta-y-aceleracion", "Aplicar ma a una fuerza individual ignorando las demás.", "Elige el sistema, suma todas las fuerzas externas y aplica la segunda ley a la resultante."),
  error("mass-equals-weight", "masa-peso", "peso", "Usar masa y peso como sinónimos.", "La masa mide inercia en kg; el peso es una fuerza gravitacional en N."),
  error("weight-measured-in-kg", "masa-peso", "peso", "Expresar el peso en kilogramos.", "El kilogramo mide masa. Calcula o mide el peso y repórtalo en newtons."),
  error("g-always-exactly-9-8", "masa-peso", "masa-constante-peso-variable", "Tratar g = 9,8 m/s² como valor universal exacto.", "Usa el campo declarado para el lugar y reconoce 9,8 m/s² como aproximación terrestre local."),
  error("third-law-same-body", "tercera-ley", "pares-de-interaccion", "Dibujar ambas fuerzas de un par de tercera ley sobre el mismo cuerpo.", "Nombra agente y receptor: una fuerza actúa sobre A y la otra sobre B."),
  error("third-law-pair-cancels", "tercera-ley", "por-que-no-se-cancelan", "Cancelar un par de tercera ley dentro del DCL de un cuerpo.", "Las fuerzas del par actúan sobre cuerpos diferentes; solo pueden ser internas al elegir un sistema que contenga ambos."),
  error("third-law-equal-acceleration", "tercera-ley", "igual-magnitud-direccion-opuesta", "Inferir aceleraciones iguales a partir de fuerzas de interacción iguales.", "Aplica la segunda ley por separado: las masas y las demás fuerzas pueden diferir."),
  error("include-velocity-in-fbd", "diagramas-cuerpo-libre", "inventario-de-fuerzas", "Incluir la velocidad como una flecha de fuerza.", "Un DCL contiene interacciones sobre el sistema; muestra velocidad en un diagrama cinemático separado."),
  error("include-ma-as-force", "diagramas-cuerpo-libre", "inventario-de-fuerzas", "Añadir ma como si fuera una fuerza.", "ma representa el resultado dinámico de la suma, no una interacción adicional."),
  error("include-reaction-force-in-same-fbd", "diagramas-cuerpo-libre", "inventario-de-fuerzas", "Añadir la fuerza que el sistema ejerce sobre otro cuerpo.", "Dibuja únicamente fuerzas que actúan sobre el sistema aislado."),
  error("components-as-extra-forces", "diagramas-cuerpo-libre", "ejes-y-componentes", "Contar una fuerza y sus componentes como fuerzas simultáneas.", "Usa el vector original o sus componentes para sumar, pero no ambos inventarios a la vez."),
  error("forget-system-boundary", "fuerzas-interacciones", "sistema-y-entorno", "Enumerar fuerzas sin definir qué cuerpo o conjunto es el sistema.", "Traza primero la frontera; entonces cada interacción que la cruza determina una fuerza externa."),
  error("non-inertial-frame-used-as-inertial", "marcos-inerciales", "marcos-no-inerciales", "Aplicar la forma estándar de Newton desde un marco acelerado sin reconocerlo.", "Comprueba el marco con la primera ley o analiza desde un marco inercial antes de introducir fuerzas aparentes."),
];

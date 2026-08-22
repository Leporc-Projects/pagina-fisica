const error=(id,topic,subtopic,description,feedback)=>({id,topic,subtopic,description,feedback});
export const UNIT_5_COMMON_ERRORS=[
  error("momentum-as-speed","momento-lineal","definicion-vectorial","Tratar p como masa por rapidez e ignorar la dirección.","p=m v es vector; cada componente conserva el signo de la velocidad."),
  error("negative-momentum-impossible","momento-lineal","cambio-de-momento","Pensar que una componente de p no puede ser negativa.","El signo depende del eje elegido y de la componente de velocidad."),
  error("impulse-force-times-time-always","impulso","teorema-impulso-momento","Usar J=FΔt con cualquier valor de una fuerza variable.","Usa J=∫Fdt o una fuerza media correctamente definida."),
  error("impulse-absolute-area","impulso","area-con-signo","Sumar áreas absolutas bajo F(t).","El impulso por componente es el área algebraica."),
  error("conservation-means-zero","conservacion-momento","condicion-de-conservacion","Creer que conservar P implica P=0.","P puede ser no nulo y constante."),
  error("internal-forces-break-conservation","conservacion-momento","frontera-del-sistema","Afirmar que las fuerzas internas impiden conservar P total.","El cambio de P total depende del impulso externo."),
  error("every-collision-conserves-kinetic-energy","colisiones","tipos-de-colision","Conservar K en cualquier choque.","K solo se conserva en un choque elástico; P puede conservarse también en inelásticos."),
  error("inelastic-loses-momentum","colisiones","choque-totalmente-inelastico","Decir que un choque inelástico pierde momento.","En un sistema aislado se conserva P; parte de K cambia de forma."),
  error("momentum-magnitude-only-2d","colisiones","colisiones-2d","Conservar solo |P| en dos dimensiones.","Conserva por separado P_x y P_y."),
  error("equal-mass-swap-universal","colisiones","choque-elastico-1d","Aplicar el intercambio de velocidades a cualquier choque.","Es un caso particular elástico 1D con masas iguales."),
  error("cm-must-be-material-point","centro-masa","posicion-ponderada","Exigir que r_cm esté dentro del material.","Es un promedio ponderado y puede estar en una región vacía."),
  error("internal-forces-accelerate-cm","centro-masa","fuerza-externa-y-cm","Atribuir a fuerzas internas el cambio de P total.","Para masa constante, F_ext=M a_cm."),
  error("variable-mass-naive-fma","masa-variable","frontera-abierta","Usar F=ma sobre una porción de masa variable sin flujo de momento.","Contabiliza la masa que cruza la frontera y su velocidad."),
  error("mass-flow-speed-reference","masa-variable","flujo-estacionario","Mezclar velocidades de marcos distintos en un balance.","Expresa v_in y v_out de forma coherente en un marco declarado."),
  error("rocket-pushes-air","propulsion-cohete","origen-del-empuje","Afirmar que el cohete necesita aire para impulsarse.","El empuje proviene de expulsar momento."),
  error("rocket-exhaust-ground-speed","propulsion-cohete","velocidad-relativa-del-escape","Usar como u_e la velocidad del escape respecto al suelo.","En la ecuación ideal u_e es relativa al cohete."),
];

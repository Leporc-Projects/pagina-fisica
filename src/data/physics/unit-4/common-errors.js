const error = (id, topic, subtopic, description, feedback) => ({ id, topic, subtopic, description, feedback });

export const UNIT_4_COMMON_ERRORS = [
  error("work-effort-confusion","trabajo","significado-del-trabajo","Confundir esfuerzo humano con trabajo mecánico.","El trabajo sobre el cuerpo depende de fuerza y desplazamiento; sostenerlo inmóvil produce W=0 sobre él."),
  error("work-uses-full-force","trabajo","angulo-y-componentes","Usar W=FΔr sin considerar el ángulo.","En general W=FΔr cosθ; la forma sin coseno exige fuerza paralela en el mismo sentido."),
  error("work-energy-single-force","energia-cinetica","trabajo-neto","Igualar el trabajo de una fuerza arbitraria con ΔK.","El teorema usa el trabajo neto de todas las fuerzas."),
  error("negative-kinetic-energy","energia-cinetica","energia-del-movimiento","Aceptar K<0 o asociarla con movimiento hacia -x.","K=(1/2)mv²≥0; el sentido está en la velocidad, no en K."),
  error("variable-work-average-force-blind","fuerza-variable","acumulacion-local","Elegir sin justificación una fuerza promedio y multiplicarla por Δx.","Usa la integral o una suma de áreas equivalente; un promedio simple solo sirve en casos específicos."),
  error("force-area-absolute","fuerza-variable","area-con-signo","Sumar valores absolutos de las áreas bajo F_x(x).","El trabajo es área con signo."),
  error("power-is-energy","potencia","energia-y-potencia","Confundir potencia con energía.","Potencia es energía por unidad de tiempo; watt y joule miden magnitudes distintas."),
  error("power-force-times-speed-always","potencia","potencia-instantanea","Usar P=Fv ignorando el ángulo.","En general P=F·v=Fv cosθ."),
  error("potential-belongs-to-particle","energia-potencial","energia-de-configuracion","Decir que la energía potencial está dentro de una partícula aislada.","Es una propiedad de la configuración del sistema que interactúa."),
  error("potential-zero-physical","energia-potencial","referencia-del-potencial","Creer que cambiar el cero de U cambia la física.","Añadir una constante a U no cambia ΔU, la fuerza ni las predicciones."),
  error("mechanical-equals-total-energy","conservacion-energia","energia-interna-y-friccion","Usar energía mecánica y total como sinónimos con disipación.","K+U puede cambiar mientras la energía total del sistema se conserva."),
  error("friction-destroys-energy","conservacion-energia","trabajo-no-incluido","Decir que la fricción destruye energía.","La energía mecánica puede convertirse en energía interna u otras formas."),
  error("force-same-sign-as-slope","fuerza-potencial","pendiente-y-fuerza","Tomar F_x=dU/dx.","La fuerza conservativa es F_x=-dU/dx."),
  error("every-flat-point-stable","fuerza-potencial","puntos-de-equilibrio","Clasificar cualquier punto con dU/dx=0 como estable.","Examina la forma local: mínimo estable, máximo inestable y región plana neutral."),
  error("energy-diagram-speed-from-height","diagramas-energia","rapidez-desde-el-diagrama","Leer la altura U(x) como rapidez.","La rapidez depende de K=E-U, la separación vertical entre E y U."),
  error("barrier-crossing-with-negative-k","diagramas-energia","regiones-permitidas","Permitir que una partícula atraviese U>E con el mismo E.","Eso exigiría K<0; la región es inaccesible en el modelo clásico conservativo."),
];

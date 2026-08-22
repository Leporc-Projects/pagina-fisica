const SUBTOPICS={
  "angular-every-point-same-linear-speed":"coordenada-angular","degrees-directly-in-s-r-theta":"frecuencia-y-vueltas","tangential-radial-same-role":"aceleracion-total","no-acceleration-constant-speed":"aceleracion-radial","inertia-only-mass":"definicion-discreta","parallel-axis-wrong-sign":"ejes-paralelos","rotational-energy-no-axis":"energia-de-giro","rolling-energy-double-count":"traslacion-mas-rotacion","torque-rf-always":"producto-vectorial","torque-joules":"unidad-y-origen","tau-ialpha-universal-vector":"limite-del-modelo","pulley-tensions-always-equal":"sistemas-acoplados","rolling-friction-max":"friccion-estatica","rolling-contact-means-no-motion":"restriccion-sin-deslizamiento","work-torque-times-angle-always":"trabajo-de-torca","power-is-torque":"potencia-instantanea","angular-momentum-origin-independent":"origen-y-brazo","l-always-parallel-omega":"cuerpo-rigido-axial","angular-conservation-means-omega-constant":"conservar-l","precession-torque-zero":"torca-y-direccion",
};
const error=(id,topic,description,feedback)=>({id,topic,subtopic:SUBTOPICS[id],description,feedback});
export const UNIT_6_COMMON_ERRORS=[
  error("angular-every-point-same-linear-speed","cinematica-angular","Creer que todos los puntos de un cuerpo rígido tienen la misma rapidez lineal.","Comparten ω; v=rω depende de r."),
  error("degrees-directly-in-s-r-theta","cinematica-angular","Usar grados directamente en s=rθ.","La forma directa requiere θ en radianes."),
  error("tangential-radial-same-role","relaciones-lineal-angular","Confundir a_t y a_r.","a_t cambia rapidez; a_r cambia dirección."),
  error("no-acceleration-constant-speed","relaciones-lineal-angular","Afirmar que ω constante implica aceleración lineal cero.","a_r puede ser no nula."),
  error("inertia-only-mass","momento-inercia","Tratar I como función solo de M.","Depende también de la distribución y del eje."),
  error("parallel-axis-wrong-sign","momento-inercia","Usar I=I_cm-Md².","Para ejes paralelos, I=I_cm+Md²."),
  error("rotational-energy-no-axis","energia-rotacional","Usar un valor de I sin especificar el eje.","I y K_rot deben corresponder al mismo eje."),
  error("rolling-energy-double-count","energia-rotacional","Usar I respecto al contacto y sumar además la traslación sin justificar.","La descomposición estándar usa I_cm y la traslación del CM."),
  error("torque-rf-always","torca","Usar τ=rF para cualquier ángulo.","Usa τ=rFsinφ=Fℓ."),
  error("torque-joules","torca","Nombrar joules a los N·m de torca.","La dimensión coincide, pero la torca no es energía."),
  error("tau-ialpha-universal-vector","dinamica-rotacional","Presentar Στ=Iα como ecuación vectorial universal 3D.","Úsala en la forma axial apropiada al eje y modelo."),
  error("pulley-tensions-always-equal","dinamica-rotacional","Igualar tensiones en una polea con I y α no nulos.","La diferencia de tensiones puede producir la torca neta."),
  error("rolling-friction-max","rodadura","Imponer f_s=μ_sN en toda rodadura.","La fricción estática se ajusta hasta su máximo si es necesaria."),
  error("rolling-contact-means-no-motion","rodadura","Concluir que toda la rueda está quieta porque el contacto instantáneo está en reposo.","El CM se traslada mientras la rueda rota."),
  error("work-torque-times-angle-always","trabajo-potencia-rotacion","Usar W=τΔθ con torca variable.","En general W=∫τdθ."),
  error("power-is-torque","trabajo-potencia-rotacion","Confundir torca con potencia.","En el caso axial, P=τω."),
  error("angular-momentum-origin-independent","momento-angular","Afirmar que L de una partícula no depende del origen.","L=r×p depende de r respecto al origen."),
  error("l-always-parallel-omega","momento-angular","Afirmar que L siempre es paralelo a ω en cualquier rotación 3D.","L_z=I_zω es una relación axial bajo condiciones específicas."),
  error("angular-conservation-means-omega-constant","conservacion-precesion","Suponer que conservar L obliga a mantener ω constante.","I puede cambiar y entonces ω cambia."),
  error("precession-torque-zero","conservacion-precesion","Explicar la precesión diciendo que no hay torca.","Una torca aproximadamente perpendicular a L cambia su dirección; Ω≈τ/L solo en precesión lenta."),
];

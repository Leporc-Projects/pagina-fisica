const SUBTOPICS={
  "gravity-force-asymmetric":"accion-reaccion","inverse-square-linear":"ley-inversa-cuadrado","g-universal-9-8":"campo-gravitacional","orbit-zero-gravity":"caida-libre","universal-mgh":"aproximacion-mgh","gravitational-u-positive":"referencia-infinito","orbit-force-balance-zero":"orbita-circular","escape-gravity-off":"rapidez-escape","kepler-radius-instantaneous":"tercera-ley","black-hole-newtonian-proof":"contexto-schwarzschild","periodic-equals-shm":"periodico-no-mas","angular-frequency-rotation":"periodo-frecuencia","shm-acceleration-same-direction":"relacion-restauradora","spring-frequency-amplitude":"masa-resorte","shm-energy-negative":"energia-total","energy-fixes-velocity-sign":"rapidez-desde-posicion","pendulum-period-any-angle":"angulo-pequeno","physical-pendulum-point-mass":"pendulo-fisico","damping-destroys-energy":"oscilador-amortiguado","resonance-infinite":"respuesta-forzada",
};
const error=(id,topic,description,feedback)=>({id,topic,subtopic:SUBTOPICS[id],description,feedback});
export const UNIT_7_COMMON_ERRORS=[
  error("gravity-force-asymmetric","gravitacion-universal","Creer que la masa mayor ejerce una fuerza mayor sobre la pequeña.","Los módulos son iguales; las aceleraciones difieren por las masas."),
  error("inverse-square-linear","gravitacion-universal","Duplicar r y dividir F por dos.","F∝1/r²: duplicar r divide F por cuatro."),
  error("g-universal-9-8","campo-peso","Tratar 9,8 m/s² como valor universal de g.","g depende de M y r."),
  error("orbit-zero-gravity","campo-peso","Explicar ingravidez orbital diciendo que la gravedad desaparece.","Nave y ocupantes comparten caída libre en un campo no nulo."),
  error("universal-mgh","energia-gravitacional","Usar U=mgh a escala planetaria.","Usa U=−GMm/r; mgh es aproximación local."),
  error("gravitational-u-positive","energia-gravitacional","Con U(∞)=0, asignar U=+GMm/r.","La referencia exige U=−GMm/r."),
  error("orbit-force-balance-zero","orbitas-satelites","Decir que la fuerza neta orbital circular es cero.","La fuerza radial no nula produce aceleración centrípeta."),
  error("escape-gravity-off","orbitas-satelites","Interpretar escape como salir de una región sin gravedad.","La gravedad actúa hasta infinito; v_esc surge de energía."),
  error("kepler-radius-instantaneous","kepler-limites","Usar r instantáneo en T²∝r³ para una elipse.","La tercera ley usa el semieje mayor a."),
  error("black-hole-newtonian-proof","kepler-limites","Presentar r_s como demostración newtoniana de agujeros negros.","r_s es resultado de GR; la analogía de escape es heurística."),
  error("periodic-equals-shm","oscilaciones","Confundir cualquier movimiento periódico con MAS.","MAS requiere a∝−x."),
  error("angular-frequency-rotation","oscilaciones","Creer que ω de una oscilación exige rotación física.","ω describe la tasa de fase."),
  error("shm-acceleration-same-direction","movimiento-armonico-simple","Poner a con el mismo signo que x.","En MAS a=−ω₀²x."),
  error("spring-frequency-amplitude","movimiento-armonico-simple","Hacer depender ω₀ de A en el resorte lineal ideal.","ω₀=sqrt(k/m), independiente de A en ese modelo."),
  error("shm-energy-negative","energia-oscilador","Aceptar K o U elástica negativas con cero en equilibrio.","K y U son no negativas; E es constante idealmente."),
  error("energy-fixes-velocity-sign","energia-oscilador","Obtener un único signo de v solo con energía.","La energía determina |v|; el signo requiere fase o sentido."),
  error("pendulum-period-any-angle","pendulos","Usar T=2πsqrt(L/g) como fórmula exacta para cualquier amplitud.","Es una aproximación de ángulo pequeño."),
  error("physical-pendulum-point-mass","pendulos","Tratar automáticamente un péndulo físico como masa puntual.","Usa I_p del cuerpo completo y la distancia d."),
  error("damping-destroys-energy","amortiguamiento-resonancia","Decir que el amortiguamiento destruye energía.","Reduce energía mecánica y la transfiere a otras formas."),
  error("resonance-infinite","amortiguamiento-resonancia","Afirmar que resonancia implica amplitud infinita.","Con b>0 la amplitud estacionaria es finita y el pico depende de b."),
];

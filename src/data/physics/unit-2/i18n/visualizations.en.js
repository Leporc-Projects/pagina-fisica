// Reemplazos exactos para texto visible; geometría, datos y funciones no cambian.
export default Object.freeze({
  "interaction-system-map": {
    "La frontera identifica la caja como sistema. La mano y la Tierra pertenecen al entorno, y cada interacción que cruza la frontera aporta una fuerza externa.": "The boundary identifies the box as the system. The hand and Earth belong to the surroundings, and each interaction crossing the boundary contributes an external force.",
    "Sistema, entorno e interacciones sobre una caja": "System, surroundings, and interactions on a box",
    "Una caja dentro de una frontera recibe una fuerza de una mano hacia la derecha y una fuerza gravitacional de la Tierra hacia abajo.": "A box inside a boundary receives a rightward force from a hand and a downward gravitational force from Earth.",
    "sistema: caja": "system: box", "mano → caja": "hand → box", "Tierra → caja": "Earth → box", mano: "hand", Tierra: "Earth",
  },
  "net-force-vector-sum": {
    "Las fuerzas de 7 N y 3 N actúan sobre el mismo sistema en sentidos opuestos. Su suma es 4 N hacia +x; la resultante se muestra como cálculo, no como una tercera interacción.": "The 7 N and 3 N forces act on the same system in opposite directions. Their sum is 4 N toward +x; the resultant is shown as a calculation, not a third interaction.",
    "Suma de fuerzas colineales": "Addition of collinear forces",
    "Dos vectores de fuerza opuestos producen una resultante de cuatro newtons hacia la derecha.": "Two opposite force vectors produce a resultant of four newtons to the right.",
  },
  "first-law-constant-velocity": {
    "x(t) con velocidad constante": "x(t) at constant velocity",
    "La recta tiene pendiente constante: el objeto cambia de posición sin aceleración ni fuerza neta.": "The line has constant slope: the object changes position without acceleration or net force.",
    "Movimiento con fuerza neta cero": "Motion with zero net force",
    "Gráfica lineal de posición frente al tiempo para un objeto con velocidad constante positiva.": "Linear position-time graph for an object with constant positive velocity.",
    Tiempo: "Time", Posición: "Position",
  },
  "net-force-acceleration-direction": {
    "La fuerza neta y la aceleración apuntan al norte. La velocidad instantánea puede apuntar al este: la fuerza cambia el vector velocidad.": "Net force and acceleration point north. Instantaneous velocity may point east: force changes the velocity vector.",
    "Velocidad, fuerza neta y aceleración": "Velocity, net force, and acceleration",
    "Desde una partícula, la velocidad apunta a la derecha mientras la fuerza neta y la aceleración apuntan hacia arriba.": "From a particle, velocity points right while net force and acceleration point upward.",
    sistema: "system",
  },
  "force-acceleration": {
    "a frente a F_net para m = 2 kg": "a against F_net for m = 2 kg",
    "La recta pasa por el origen y tiene pendiente 1/m = 0,5 kg⁻¹: duplicar F_net duplica a.": "The line passes through the origin with slope 1/m = 0.5 kg⁻¹: doubling F_net doubles a.",
    "Aceleración frente a fuerza neta": "Acceleration against net force",
    "Recta de aceleración igual a fuerza neta dividida por dos kilogramos.": "Line of acceleration equal to net force divided by two kilograms.",
    "Fuerza neta": "Net force", Aceleración: "Acceleration",
  },
  "mass-acceleration": {
    "a frente a m para F_net = 12 N": "a against m for F_net = 12 N",
    "La curva inversa muestra que aumentar la masa reduce la aceleración cuando la fuerza neta permanece fija.": "The inverse curve shows that increasing mass reduces acceleration when net force remains fixed.",
    "Aceleración frente a masa": "Acceleration against mass",
    "Curva decreciente de aceleración igual a doce newtons divididos por la masa.": "Decreasing curve of acceleration equal to twelve newtons divided by mass.",
    Masa: "Mass", Aceleración: "Acceleration",
  },
  "mass-vs-weight": {
    "La masa de 10 kg es la misma en ambos lugares. Con g = 9,8 m/s² el peso es 98 N; con g = 1,6 m/s² es 16 N.": "The 10 kg mass is the same in both places. With g = 9.8 m/s² weight is 98 N; with g = 1.6 m/s² it is 16 N.",
    "La misma masa en dos campos gravitacionales": "The same mass in two gravitational fields",
    "Dos cuerpos idénticos de diez kilogramos muestran flechas de peso diferentes para dos valores de campo gravitacional.": "Two identical ten-kilogram bodies show different weight arrows for two gravitational-field values.",
  },
  "third-law-pair": {
    "Cada flecha está aplicada a un cuerpo distinto. Las fuerzas son simultáneas, de igual magnitud y sentidos opuestos.": "Each arrow is applied to a different body. The forces are simultaneous, equal in magnitude, and opposite in direction.",
    "Par de interacción entre A y B": "Interaction pair between A and B",
    "Dos cuerpos separados reciben fuerzas de igual longitud y direcciones opuestas, cada una causada por el otro cuerpo.": "Two separate bodies receive equal-length forces in opposite directions, each caused by the other body.",
  },
  "third-law-system-boundary": {
    "Con A como sistema, solo aparece la fuerza de B sobre A. Con A+B como sistema, el par es interno y no pertenece a la suma de fuerzas externas.": "With A as the system, only the force of B on A appears. With A+B as the system, the pair is internal and does not enter the external-force sum.",
    "Frontera individual y frontera combinada": "Individual and combined boundaries",
    "Dos cuerpos aparecen dentro de una frontera conjunta y una frontera individual resalta que solo una fuerza del par actúa sobre A.": "Two bodies appear within a combined boundary, while an individual boundary highlights that only one force of the pair acts on A.",
    "sistema A+B": "system A+B", "sistema A": "system A", "B sobre A": "B on A", "A sobre B": "A on B",
  },
  "free-body-correct": {
    "El DCL contiene la fuerza de soporte hacia arriba, el peso hacia abajo y la fuerza de la mano hacia +x. No contiene velocidad, ma ni la reacción sobre la mano.": "The FBD contains the upward support force, downward weight, and the hand's force toward +x. It contains neither velocity, ma, nor the reaction on the hand.",
    "Diagrama de cuerpo libre correcto de una caja": "Correct free-body diagram for a box",
    "Una caja aislada recibe tres flechas: soporte hacia arriba, peso hacia abajo y empuje hacia la derecha.": "An isolated box has three arrows: support upward, weight downward, and a push to the right.",
    caja: "box", soporte: "support", peso: "weight", "mano sobre caja": "hand on box",
  },
  "free-body-components": {
    "Fₓ y Fᵧ son proyecciones de la misma fuerza F sobre los ejes elegidos. Las guías punteadas muestran la descomposición sin sumar interacciones.": "Fₓ and Fᵧ are projections of the same force F onto the chosen axes. The dotted guides show decomposition without adding interactions.",
    "Componentes de una fuerza": "Components of a force",
    "Una fuerza diagonal desde el origen se descompone en una componente horizontal y otra vertical.": "A diagonal force from the origin is decomposed into horizontal and vertical components.",
  },
  "inertial-frames": {
    "Los marcos S y S' se trasladan con velocidad relativa constante V. Comparan velocidades distintas, pero la misma aceleración.": "Frames S and S' translate at constant relative velocity V. They compare different velocities but the same acceleration.",
    "Dos marcos inerciales en traslación relativa": "Two inertial frames in relative translation",
    "Dos sistemas de ejes paralelos muestran que S prima se mueve hacia la derecha con velocidad constante V respecto a S.": "Two parallel coordinate systems show S prime moving right at constant velocity V relative to S.",
    "V constante": "constant V",
  },
});

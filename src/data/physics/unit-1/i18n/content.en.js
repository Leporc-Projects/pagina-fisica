// English presentation indexed by the stable topic and section IDs in content.js.
export default Object.freeze({
  herramientas: {
    introduction: "Physics relates measurements through models. Before calculating, identify what is measured, the unit used, and the precision supported by the data.",
    sections: {
      "magnitudes-y-si": {
        title: "Physical quantities, units, and the International System",
        essential: [
          "A physical quantity is a property that can be measured, such as time, length, or mass. Communicating a measurement requires a number and a unit: 4.2 does not mean the same thing as 4.2 s.",
          "The International System uses seven base units. This unit mainly uses the metre (m), kilogram (kg), and second (s); other units are built by combining them.",
        ],
        understand: [
          "A physical equation does not change when it is expressed in compatible units. The numerical representation changes, not the measured quantity.",
          "Writing the unit throughout a calculation helps detect incompatible sums and results without physical meaning.",
        ],
        deepen: [
          "Derived quantities are defined from base quantities. For example, velocity has the dimension of length divided by time and is expressed in m/s in the SI.",
          "A physical equality requires equal dimensions on both sides, although dimensional equality alone does not prove that a model is correct.",
        ],
        explore: ["In a real measurement, the unit makes results from different instruments comparable. Traceability connects each result to standards and procedures that other people can reproduce."],
      },
      "conversion-y-cifras": {
        title: "Unit conversion and significant figures",
        essential: [
          "Converting a unit means multiplying by factors equal to one. Units cancel algebraically and the physical quantity remains unchanged.",
          "Significant figures communicate the resolution of the data. A result should not suggest precision that the input measurements do not have.",
        ],
        understand: [
          "Write each conversion factor with the unit to be eliminated in the denominator. The notation then shows whether the conversion chain is oriented correctly.",
          "In products and quotients, the number of significant figures is usually limited by the datum with the fewest significant figures. In sums and differences, the least precise decimal place matters.",
        ],
        deepen: [
          "Round at the end to avoid accumulating error. Guard digits may be kept during the work before reporting the result with consistent precision.",
          "Exact numbers, such as a unit definition or a count, do not limit significant figures.",
        ],
        explore: ["Science and engineering also convert units to compare scales and data sources. A correct conversion preserves the measurement's relative uncertainty; it does not create more precise information."],
        checks: [{
          question: "What must remain unchanged during a correct unit conversion?",
          options: ["The written number", "The represented physical quantity", "The unit symbol"],
          answer: "The represented physical quantity. The number and symbol may change together.",
        }],
      },
      "dimensiones-y-estimaciones": {
        title: "Dimensional analysis, orders of magnitude, and estimates",
        essential: [
          "Dimensional analysis checks whether an expression combines compatible quantities. Only terms with the same dimension may be added.",
          "An order of magnitude places a quantity near a power of ten. An estimate seeks a reasonable scale before demanding fine precision.",
        ],
        understand: [
          "Estimating requires explicit assumptions and helps reveal factor-of-ten, unit, or typing errors. It does not replace a measurement; it establishes a plausible range.",
          "Dimensional homogeneity is necessary for a physical equation, but two dimensionally correct expressions may describe different models.",
        ],
        deepen: ["If a proposed relation contains dimensionless constants, the analysis can determine possible exponents. By itself it cannot determine numerical factors or additive dependencies."],
        explore: ["Fermi estimates break a broad question into simpler quantities. Their quality depends on stating assumptions and checking the result's sensitivity."],
      },
    },
  },
  vectores: {
    introduction: "Vectors represent quantities whose description requires magnitude and direction. Their components depend on the chosen basis; the physical vector does not.",
    sections: {
      "escalar-vector": {
        title: "Scalars and vectors",
        essential: [
          "A vector is a quantity with magnitude and direction. Its sense distinguishes the two possible orientations along the same direction.",
          "A scalar is described by a value and its unit. Temperature, time, and mass are scalars; displacement and velocity are vectors.",
        ],
        understand: [
          "Two vectors are equal when they have the same magnitude, direction, and sense, even if they are drawn at different locations.",
          "A vector's magnitude is never negative. A component may be negative because it compares the vector with the positive sense of an axis.",
        ],
        deepen: ["A geometric vector can be represented in different bases. Components change with the basis, while magnitudes and geometric relations remain invariant."],
        explore: ["This independence from the basis allows the same displacement to be described with different axes. Choosing a convenient basis simplifies the calculation but does not change the physical vector."],
        checks: [{
          question: "Which option completely describes a velocity?",
          options: ["25 m/s", "25 m north", "25 m/s north", "25 s/m"],
          answer: "25 m/s north: it includes magnitude, unit, and direction.",
        }],
      },
      "componentes-y-base": {
        title: "Cartesian components, unit vectors, and bases",
        essential: [
          "Cartesian components indicate how much of a vector points along each axis. Their signs depend on the chosen positive directions.",
          "The unit vectors i, j, and k provide reference directions for the x, y, and z axes.",
        ],
        understand: [
          "In a three-dimensional Cartesian basis, A = Aₓ i + Aᵧ j + A_z k. If θ is measured from +x in the plane, Aₓ = A cos θ and Aᵧ = A sin θ; geometry and quadrant determine the signs.",
          "The function atan2(Aᵧ,Aₓ) preserves quadrant information; using only arctan(Aᵧ/Aₓ) can produce an incorrect direction.",
        ],
        deepen: ["Magnitude follows from the extended Pythagorean theorem. Recovering direction requires combining the components with their signs."],
        explore: ["Components are projections onto a basis. Reconstruction is still possible in a nonorthogonal basis, but the Pythagorean theorem can no longer be applied directly to the components."],
      },
      "suma-y-resta": {
        title: "Vector addition and subtraction",
        essential: [
          "To add vectors, add corresponding components. Geometrically, place the second vector at the tip of the first; the resultant runs from the initial origin to the final tip.",
          "Subtracting B is equivalent to adding the opposite vector −B.",
        ],
        understand: [
          "Vector addition is commutative and associative. Construction order may change the intermediate drawing, but not the resultant.",
          "A small resultant does not mean the vectors are small: they may have large magnitudes and nearly opposite senses.",
        ],
        deepen: ["The component method works in any dimension and does not depend on drawing scale. A diagram remains useful for anticipating signs and approximate direction."],
        explore: ["Adding many vectors can be represented by a head-to-tail polygon. If the polygon closes, the resultant is zero—an idea that will later be useful when studying equilibrium."],
      },
      "producto-escalar-y-vectorial": {
        title: "Dot product and cross product",
        essential: [
          "The dot product A·B is a number that measures how much one vector points along the other. It is zero when nonzero vectors are perpendicular.",
          "The cross product A×B produces a vector perpendicular to the plane of A and B. Its sense is determined by the right-hand rule.",
        ],
        understand: [
          "The magnitude AB cos θ of the dot product can be viewed as one vector's magnitude times the projection of the other along it.",
          "The magnitude AB sin θ of the cross product equals the area of the parallelogram formed by the vectors.",
        ],
        deepen: ["The dot product is commutative. The cross product is not: B×A = −(A×B). Parallel vectors have zero cross product."],
        explore: ["These products connect geometry with other physical quantities: the dot product appears in work, while the cross product appears in torque and angular momentum."],
      },
    },
  },
  "movimiento-1d": {
    introduction: "Kinematics describes how motion changes without yet explaining the interaction that causes it. Every description requires a reference frame and a sign convention.",
    sections: {
      "referencia-y-posicion": {
        title: "Reference frame, position, and displacement",
        essential: [
          "Position x locates an object relative to a chosen origin and axis. Displacement is Δx = x_f − x_i and depends only on the initial and final positions.",
          "Distance travelled measures total path length and cannot be negative. Distance and displacement magnitude coincide only in particular cases.",
        ],
        understand: [
          "A negative position only means that the object is on the negative side of the origin. It does not indicate its direction of motion.",
          "Changing the origin changes position coordinates but not displacement between two events if axis orientation and scale remain fixed.",
        ],
        deepen: ["A reference frame includes origin, orientation, spatial scale, and clock. Statements about motion must be understood relative to that frame."],
        explore: ["Two observers may assign different positions to the same object when they choose different origins. Comparing their descriptions requires transforming coordinates and stating which events are being compared."],
        checks: [{ question: "An object is at x = −20 m. What can necessarily be concluded?", answer: "It is 20 m on the negative side of the origin. The direction of its velocity or acceleration cannot be inferred." }],
      },
      "velocidad-y-rapidez": {
        title: "Average velocity, instantaneous velocity, and speed",
        essential: [
          "Average velocity is displacement divided by the time interval. Its sign gives the direction of the net displacement relative to the axis.",
          "Instantaneous velocity is the rate of change of position. Speed is the magnitude of velocity and is never negative.",
        ],
        understand: [
          "On an x(t) graph, instantaneous velocity is the tangent slope. A large position does not imply a large velocity.",
          "For an out-and-back trip, distance may be large while displacement—and therefore average velocity—is zero.",
        ],
        deepen: ["The derivative dx/dt arises as the limit of Δx/Δt as the time interval approaches zero. The position function must be differentiable at the instant considered."],
        explore: ["If x(t) has a corner, instantaneous velocity may not exist at that exact point even though average velocities exist on both sides. The model must decide whether such an abrupt change is physically reasonable."],
      },
      "aceleracion-y-signos": {
        title: "Average and instantaneous acceleration; signs",
        essential: [
          "Acceleration indicates how velocity changes with time. It may change its magnitude, its direction, or both.",
          "Negative acceleration points toward −x; it does not automatically mean that the object is slowing down.",
        ],
        understand: [
          "Speed increases when velocity and acceleration have the same sign, and decreases when they have opposite signs.",
          "On a v(t) graph, slope is acceleration. On an a(t) graph, the function value is acceleration, not its slope.",
        ],
        deepen: ["Instantaneous acceleration is dv/dt and is also the second derivative of position when x(t) is twice differentiable."],
        explore: ["In more than one dimension, acceleration can change the direction of velocity without changing its magnitude. The one-dimensional sign rule must then be replaced by a vector comparison."],
        checks: [{ question: "If v < 0 and a < 0, what happens to speed?", answer: "It increases because velocity and acceleration point in the same direction." }],
      },
      "graficas-relacionadas": {
        title: "Relationships among x(t), v(t), and a(t)",
        essential: [
          "The slope of x(t) is v(t), and the slope of v(t) is a(t). These relations connect the shapes of the three graphs.",
          "Signed area under v(t) represents displacement; signed area under a(t) represents change in velocity. Regions below the axis contribute negatively.",
        ],
        understand: [
          "Differentiation follows local changes: x(t) → v(t) → a(t). Integration accumulates changes: a(t) → v(t) → x(t), together with initial conditions.",
          "A horizontal line on x(t) indicates rest; a horizontal line on v(t) indicates constant velocity, which need not be zero.",
        ],
        deepen: ["The areas are definite integrals. Their physical interpretation includes sign and unit: (m/s)·s gives m, while (m/s²)·s gives m/s."],
        explore: ["Experimental graphs contain noise and do not always provide exact slopes or areas. In those cases, trends are estimated and the result's uncertainty is communicated."],
      },
    },
  },
  "ecuaciones-movimiento": {
    introduction: "Kinematic equations express a model. Before using them, state the reference frame, interval, and acceleration behaviour.",
    sections: {
      "aceleracion-constante": {
        title: "Constant-acceleration model",
        essential: [
          "If acceleration is constant over the interval, velocity changes linearly and position changes quadratically with time.",
          "The four usual equations are relations from the same model; choose one after identifying data, unknown, and conditions, not through a superficial match of symbols.",
        ],
        understand: [
          "On v(t), the slope is a and the signed area is Δx. When v crosses zero, the object changes direction if the description continues smoothly.",
          "The average velocity (v₀+v)/2 may be used in this form only when acceleration is constant.",
        ],
        deepen: ["Integrating constant a gives v = v₀+at. Integrating that velocity from the initial condition gives x = x₀+v₀t+½at². The other relations follow by eliminating t or using the linear average of velocities."],
        explore: ["A real motion may be approximated by intervals of nearly constant acceleration. The approximation is useful only when each interval is short enough for the purpose of the analysis."],
      },
      "cambio-de-sentido": {
        title: "Change of direction and interval-by-interval analysis",
        essential: [
          "A change of direction occurs when velocity changes sign. The instant v = 0 separates two intervals of motion, but acceleration may remain nonzero.",
          "Displacement adds signed contributions; distance adds lengths and therefore requires separating intervals when the object reverses.",
        ],
        understand: ["Acceleration opposite to velocity reduces speed to instantaneous rest. If acceleration continues, speed then increases in the opposite direction."],
        deepen: ["To calculate distance from v(t), locate its zeros and add the absolute value of displacement over each interval. Integrating |v(t)| gives distance travelled."],
        explore: ["Distance travelled is the total variation of position over the interval. The idea generalizes to curved paths by adding increasingly small path lengths."],
      },
      "caida-libre": {
        title: "Free fall as a model",
        essential: [
          "In the introductory free-fall model, air resistance is neglected, g is approximated as constant, and a region near Earth's surface is studied.",
          "g ≈ 9.8 m/s² is the approximate local magnitude. If +y points upward, aᵧ = −g. The sign comes from the axis, not from the symbol g.",
        ],
        understand: [
          "At the maximum height of a vertical launch, vᵧ = 0 but aᵧ = −g. Gravity acts during ascent, at the highest point, and during descent.",
          "Time or speed symmetries apply only between points at the same height under the same model conditions.",
        ],
        deepen: ["The body may be treated as a particle when its size and rotation are irrelevant to the question. If air resistance matters, acceleration is no longer constant or necessarily equal during ascent and descent."],
        explore: ["With air resistance, objects of the same shape may fall differently depending on mass, area, and speed. The constant value −g is no longer the total acceleration, although gravity still acts."],
        checks: [{ question: "At the highest point of an ideal vertical launch, what are vᵧ and aᵧ if +y points upward?", answer: "vᵧ = 0 and aᵧ = −g." }],
      },
      integracion: {
        title: "Nonconstant acceleration and integration",
        essential: [
          "When a changes with time, the constant-acceleration equations are not valid. Velocity is obtained by accumulating a(t), and position by accumulating v(t).",
          "Initial conditions determine which particular motion corresponds to those functions.",
        ],
        understand: [
          "The integral of a(t) between two instants is Δv, not necessarily the final velocity. The initial velocity must be added.",
          "Similarly, the integral of v(t) is displacement and is added to the initial position to obtain x(t).",
        ],
        deepen: ["If acceleration depends on position or velocity, changing variables or solving a differential equation may be necessary. This unit establishes the conceptual relation without yet constructing a general solution method."],
        explore: ["When data are known only at discrete instants, accumulation can be approximated numerically with rectangle or trapezoid areas. Step size controls part of the error."],
      },
    },
  },
  "movimiento-2d": {
    introduction: "In two and three dimensions, position, velocity, and acceleration are vectors. Cartesian components are related through the same time.",
    sections: {
      "posicion-velocidad-aceleracion": {
        title: "Position, velocity, and acceleration vectors",
        essential: [
          "The position vector r(t) locates the particle. Velocity v = dr/dt is tangent to the trajectory, and acceleration a = dv/dt describes the change in the velocity vector.",
          "Each component may be differentiated separately in a fixed Cartesian basis.",
        ],
        understand: [
          "A curved trajectory may have constant speed and still have acceleration because the direction of velocity changes.",
          "The x, y, and z components do not represent motions with different times: they describe the same event and share t.",
        ],
        deepen: ["Componentwise differentiation assumes that Cartesian unit vectors are constant. In moving bases such as polar coordinates, the unit vectors must also be differentiated."],
        explore: ["Trajectory curvature depends on how the direction of velocity changes. Two motions may follow the same curve at different rates and therefore have different accelerations."],
      },
      "componentes-de-trayectoria": {
        title: "Parallel and perpendicular components",
        essential: [
          "The parallel component of acceleration changes speed. The perpendicular component changes the direction of velocity.",
          "Purely perpendicular acceleration can curve a trajectory without changing instantaneous speed.",
        ],
        understand: ["This decomposition follows the trajectory and need not coincide with the x and y axes. It is especially useful in circular motion."],
        deepen: ["For nonzero speed, tangential acceleration has magnitude dv/dt and normal acceleration has magnitude v²/ρ, where ρ is the local radius of curvature."],
        explore: ["The same tangential-normal decomposition applies to any smooth trajectory. The local radius of curvature replaces the fixed radius of a circle."],
      },
      proyectiles: {
        title: "Projectile motion",
        essential: [
          "In the model without air resistance and with approximately constant g, aₓ = 0 and aᵧ = −g when +y points upward.",
          "Horizontal motion has constant velocity and vertical motion has constant acceleration; both share the same time.",
        ],
        understand: [
          "At the highest point, the vertical velocity component is zero, but horizontal velocity may be nonzero and acceleration still points downward.",
          "The parabolic shape results from combining x linear in t with y quadratic in t under these conditions.",
        ],
        deepen: ["Range or flight-time formulas that assume equal initial and final heights must not be applied to launches between different heights."],
        explore: ["Air resistance couples horizontal and vertical motion because it depends on the velocity vector. The trajectory is no longer exactly parabolic, and range requires a more complete model."],
        checks: [{ question: "At the highest point of an ideal projectile, is the total velocity necessarily zero?", answer: "No. The vertical component is zero, but the horizontal component remains constant in the ideal model." }],
      },
    },
  },
  "circular-relativo": {
    introduction: "Circular motion shows that speed and velocity are not equivalent. Relative velocity also requires precise identification of the frame from which an observation is made.",
    sections: {
      "movimiento-circular": {
        title: "Circular motion and radial acceleration",
        essential: [
          "On a circle, instantaneous velocity is tangent to the trajectory. Radial or centripetal acceleration points toward the centre.",
          "At constant speed, velocity is not constant because its direction changes continuously.",
        ],
        understand: [
          "Centripetal acceleration is not a new force. It names the radial component of acceleration; the responsible forces will be studied dynamically later.",
          "The greater the speed or the smaller the radius, the greater the acceleration required to change direction.",
        ],
        deepen: ["The radial acceleration vector can be written a_r = −(v²/R) r̂. The negative sign indicates that it points opposite to the outward radial unit vector."],
        explore: ["On a curved path that is not circular, the normal direction still points toward the local centre of curvature. The radius of curvature may change from point to point."],
        checks: [{ question: "A particle moves around a circle at constant speed. Does it have acceleration?", answer: "Yes. Its velocity direction changes continuously, so there is acceleration toward the centre." }],
      },
      "rapidez-variable": {
        title: "Circular motion with variable speed",
        essential: ["If speed changes, acceleration has a tangential component in addition to the radial component.", "The tangential component changes speed; the radial component changes direction."],
        understand: ["Total acceleration is the vector sum of two perpendicular components. Neither replaces the other."],
        deepen: ["For a circle of fixed radius, a_t = dv/dt and a_r = v²/R. Total magnitude is the square root of the sum of their squares."],
        explore: ["If speed and radius change simultaneously, both components may vary with time. Separating them reveals which part bends the path and which part changes the pace of motion."],
      },
      "velocidad-relativa": {
        title: "Relative velocity and reference frames",
        essential: [
          "v_A/B means the velocity of A measured from B. Subscript order is part of the definition.",
          "The composition v_A/C = v_A/B + v_B/C connects three explicitly identified frames.",
        ],
        understand: [
          "Before adding velocities, draw or name which object observes which. Reversing the order reverses the sign: v_B/A = −v_A/B.",
          "In this unit's classical approximation, time is common to the frames and velocities add vectorially.",
        ],
        deepen: ["The composition relation is valid for classical frames. At speeds comparable with light, another transformation is required, beyond this unit's scope."],
        explore: ["Vector composition also describes boats in currents and aircraft in wind. In two dimensions, choosing one's own direction can compensate for a medium's velocity."],
      },
    },
  },
  "coordenadas-polares": {
    introduction: "This extension introduces a moving basis useful for trajectories with radial geometry. It complements the curriculum without displacing the priority of topics explicitly developed in sessions 2–6.",
    sections: {
      "base-polar": {
        title: "Coordinates r and θ and a moving basis",
        essential: ["A planar position can be described by radial distance r and angle θ measured from a reference axis.", "r̂ points radially outward and θ̂ is perpendicular to r̂ in the direction of increasing θ."],
        understand: ["Unlike i and j, polar unit vectors change direction when θ changes. Although their magnitudes remain one, their derivatives are not zero."],
        deepen: ["The relations dr̂/dt = θ̇ θ̂ and dθ̂/dt = −θ̇ r̂ explain the additional terms that appear when differentiating position and velocity."],
        explore: ["Polar coordinates are natural when a distinguished centre exists. In problems without radial symmetry, a Cartesian basis may give a simpler description."],
      },
      "velocidad-polar": {
        title: "Velocity in polar coordinates",
        essential: ["Velocity combines radial and angular change: one part follows r̂ and another follows θ̂."],
        understand: ["ṙ measures how quickly distance from the origin changes. rθ̇ is the transverse speed caused by rotation."],
        deepen: ["The expression follows by differentiating r = r r̂ and using the fact that r̂ changes with θ. Differentiating only coordinate r is therefore insufficient."],
        explore: ["A spiral trajectory combines radial change and rotation. Depending on their signs, the object may approach the origin while moving in the direction of increasing θ."],
      },
      "aceleracion-polar": {
        title: "Polar acceleration and its relation to circular motion",
        essential: ["Polar acceleration has radial and transverse components. Each can receive contributions from more than one type of change."],
        understand: ["For a circle of constant radius and speed, ṙ = r̈ = θ̈ = 0. The radial component reduces to −rθ̇² r̂, directed toward the centre."],
        deepen: ["The transverse component contains rθ̈ and 2ṙθ̇. The second term appears when radial distance and angle change simultaneously."],
        explore: ["The polar basis is an example of curvilinear coordinates. Its usefulness depends on whether the problem's geometry makes the description simpler than a fixed Cartesian basis."],
      },
    },
  },
});

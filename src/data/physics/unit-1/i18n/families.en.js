import { formatNumber } from "../../../../i18n/index.js";

const number = (value) => formatNumber("en", value, { maximumFractionDigits: 3 });
const signed = (value) => value >= 0 ? `+${number(value)}` : `−${number(Math.abs(value))}`;
const presentation = (title, prompt, hints, solution, extra = {}) => ({
  title, prompt, hints, solution, ...extra,
});

export const FAMILY_OBJECTIVES_EN = Object.freeze({
  "family-u1-vector-components-direction": ["Decompose a vector into Cartesian components while accounting for the quadrant."],
  "family-u1-vector-magnitude-components": ["Calculate a vector's magnitude from its components."],
  "family-u1-vector-sum": ["Add vectors by components and obtain the magnitude of the resultant."],
  "family-u1-vector-perpendicular-lambda": ["Impose perpendicularity using the dot product."],
  "family-u1-distance-displacement": ["Distinguish distance travelled from displacement on a one-dimensional path."],
  "family-u1-average-velocity": ["Calculate average velocity from displacement and a time interval."],
  "family-u1-signs-speed": ["Relate the signs of velocity and acceleration to a change in speed."],
  "family-u1-constant-velocity": ["Apply v = v₀ + at with consistent signs."],
  "family-u1-constant-displacement": ["Apply the displacement equation for constant acceleration."],
  "family-u1-turning-point": ["Determine the stopping instant and position before a change of direction."],
  "family-u1-no-time": ["Use the time-independent kinematic relation."],
  "family-u1-free-fall": ["Apply a free-fall model with an explicit axis and sign convention."],
  "family-u1-horizontal-projectile": ["Use the same time in the horizontal and vertical components of a projectile."],
  "family-u1-circular-acceleration": ["Calculate radial acceleration without introducing an additional force."],
  "family-u1-relative-velocity-1d": ["Compose one-dimensional velocities while stating frames and signs."],
});

export const FAMILY_PRESENTERS_EN = Object.freeze({
  "family-u1-vector-components-direction": ({ parameters: { magnitude, angleDeg }, answer }) => {
    const [x, y] = answer.values.map((entry) => number(entry.value));
    return presentation(
      "Components from magnitude and direction",
      `A vector A has magnitude ${number(magnitude)} units and forms an angle of ${number(angleDeg)}° measured counterclockwise from +x. Determine Aₓ and Aᵧ.`,
      ["Use cosine for x and sine for y; retain the signs of the quadrant."],
      [`Aₓ = A cos θ and Aᵧ = A sin θ with θ = ${number(angleDeg)}°.`, `Aₓ = ${x} and Aᵧ = ${y} units.`, `√(Aₓ² + Aᵧ²) ≈ ${number(magnitude)} units.`],
      { fields: ["Aₓ", "Aᵧ"], answerDisplay: null },
    );
  },
  "family-u1-vector-magnitude-components": ({ parameters: { x, y }, answer }) => presentation(
    "Magnitude from components", `Vector A = (${signed(x)}, ${signed(y)}) in Cartesian components. Calculate its magnitude.`,
    ["The magnitude is √(Aₓ² + Aᵧ²)."],
    [`|A| = √[(${number(x)})² + (${number(y)})²].`, `|A| = ${number(answer.value)} units.`],
    { fields: ["Magnitude of A"], answerDisplay: `${number(answer.value)} units` },
  ),
  "family-u1-vector-sum": ({ parameters: { ax, ay, bx, by }, answer }) => {
    const [rx, ry, magnitude] = answer.values.map((entry) => number(entry.value));
    return presentation(
      "Sum of two vectors", `Let A = (${signed(ax)}, ${signed(ay)}) and B = (${signed(bx)}, ${signed(by)}). Determine R = A + B and its magnitude.`,
      ["Add corresponding components first."],
      [`R = (${number(ax)} + ${number(bx)}, ${number(ay)} + ${number(by)}) = (${rx}, ${ry}).`, `|R| = √[(${rx})² + (${ry})²] = ${magnitude} units.`],
      { fields: ["Rₓ", "Rᵧ", "|R|"], answerDisplay: null },
    );
  },
  "family-u1-vector-perpendicular-lambda": ({ parameters: { a1, a3, b1, b2, b3 }, answer }) => presentation(
    "Parameter for perpendicularity", `Determine λ so that A = (${number(a1)}, λ, ${number(a3)}) is perpendicular to B = (${number(b1)}, ${number(b2)}, ${number(b3)}).`,
    ["Two nonzero vectors are perpendicular when A · B = 0."],
    [`${number(a1)}(${number(b1)}) + λ(${number(b2)}) + ${number(a3)}(${number(b3)}) = 0.`, `Solving gives λ = ${number(answer.value)}.`],
    { fields: ["λ"], answerDisplay: `λ = ${number(answer.value)}` },
  ),
  "family-u1-distance-displacement": ({ parameters: { start, middle, final }, answer }) => {
    const [distance, displacement] = answer.values.map((entry) => number(entry.value));
    return presentation(
      "Distance and displacement", `A particle starts at x = ${number(start)} m, moves to x = ${number(middle)} m, and ends at x = ${number(final)} m. Calculate total distance and displacement.`,
      ["Distance adds lengths; displacement is x_f − x_i."],
      [`d = |${number(middle)} − (${number(start)})| + |${number(final)} − ${number(middle)}| = ${distance} m.`, `Δx = ${number(final)} − (${number(start)}) = ${displacement} m.`],
      { fields: ["Distance", "Δx"], answerDisplay: null },
    );
  },
  "family-u1-average-velocity": ({ parameters: { xi, xf, ti, tf }, answer }) => presentation(
    "Signed average velocity", `A particle is at xᵢ = ${number(xi)} m when tᵢ = ${number(ti)} s and at x_f = ${number(xf)} m when t_f = ${number(tf)} s. Calculate its average velocity.`,
    ["Use (x_f − xᵢ)/(t_f − tᵢ), retaining the sign."],
    [`v̄ = [${number(xf)} − (${number(xi)})]/(${number(tf)} − ${number(ti)}).`, `v̄ = ${number(answer.value)} m/s.`],
    { fields: ["Average velocity"], answerDisplay: `${number(answer.value)} m/s` },
  ),
  "family-u1-signs-speed": ({ parameters: { velocitySign, accelerationSign }, interaction }) => {
    const increases = velocitySign === accelerationSign;
    return presentation(
      "Signs of velocity and acceleration",
      `At an instant, v is ${velocitySign > 0 ? "positive" : "negative"} and a is ${accelerationSign > 0 ? "positive" : "negative"}. What happens to speed at that instant?`,
      ["Compare whether v and a have the same sign."],
      [`v and a ${increases ? "have" : "do not have"} the same sign.`, `Speed ${increases ? "increases" : "decreases"}.`],
      { options: ["It increases.", "It decreases.", "It remains constant.", "It cannot be determined from the signs."], answerDisplay: interaction.correctOptionId === "increase" ? "It increases." : "It decreases." },
    );
  },
  "family-u1-constant-velocity": ({ parameters: { v0, a, t }, answer }) => presentation(
    "Velocity with constant acceleration", `An object has v₀ = ${number(v0)} m/s and constant acceleration a = ${number(a)} m/s². Determine v after ${number(t)} s.`,
    ["Use v = v₀ + at."], [`v = ${number(v0)} + (${number(a)})(${number(t)}).`, `v = ${number(answer.value)} m/s.`],
    { fields: ["Final velocity"], answerDisplay: `${number(answer.value)} m/s` },
  ),
  "family-u1-constant-displacement": ({ parameters: { v0, a, t }, answer }) => presentation(
    "Displacement with constant acceleration", `An object starts with v₀ = ${number(v0)} m/s and maintains a = ${number(a)} m/s² for ${number(t)} s. Calculate its displacement.`,
    ["Use Δx = v₀t + ½at²."], [`Δx = (${number(v0)})(${number(t)}) + ½(${number(a)})(${number(t)})².`, `Δx = ${number(answer.value)} m.`],
    { fields: ["Displacement"], answerDisplay: `${number(answer.value)} m` },
  ),
  "family-u1-turning-point": ({ parameters: { v0, deceleration }, answer }) => {
    const a = -deceleration;
    const [time, displacement] = answer.values.map((entry) => number(entry.value));
    return presentation(
      "Stopping and changing direction", `An object starts at x = 0 with v₀ = ${number(v0)} m/s and a = ${number(a)} m/s². Calculate the instant when it stops and its displacement up to that point.`,
      ["At the change of direction, v = 0 instantaneously."],
      [`0 = ${number(v0)} + (${number(a)})t gives t = ${time} s.`, `Δx = ${number(v0)}(${time}) + ½(${number(a)})(${time})² = ${displacement} m.`],
      { fields: ["t_stop", "Δx"], answerDisplay: null },
    );
  },
  "family-u1-no-time": ({ parameters: { v0, a, dx }, answer }) => presentation(
    "Final speed without using time", `An object has initial speed ${number(v0)} m/s, constant acceleration ${number(a)} m/s², and moves through Δx = ${number(dx)} m. Determine the positive final speed.`,
    ["Use v² = v₀² + 2aΔx and select the root compatible with speed."],
    [`v² = ${number(v0)}² + 2(${number(a)})(${number(dx)}).`, `v = ${number(answer.value)} m/s.`],
    { fields: ["Final speed"], answerDisplay: `${number(answer.value)} m/s` },
  ),
  "family-u1-free-fall": (instance) => {
    const { mode, g, value } = instance.parameters;
    const result = number(instance.answer.value);
    if (mode === "drop") return presentation(
      "Fall from rest", `A stone is released from ${number(value)} m. Without air resistance and with g = ${number(g)} m/s², calculate the fall time.`,
      ["With +y upward: Δy = −½gt²."], [`−${number(value)} = −½(${number(g)})t².`, `t = ${result} s.`],
      { fields: ["Time"], answerDisplay: `${result} s` },
    );
    if (mode === "top-time") return presentation(
      "Time to maximum height", `A ball is launched vertically upward with v₀ = ${number(value)} m/s. Use +y upward and g = ${number(g)} m/s². Calculate the time to maximum height.`,
      ["At maximum height v = 0, but a = −g."], [`0 = ${number(value)} − ${number(g)}t.`, `t = ${result} s.`],
      { fields: ["Time"], answerDisplay: `${result} s` },
    );
    if (mode === "return-speed") return presentation(
      "Velocity on returning", `A ball is launched upward with v₀ = ${number(value)} m/s and returns to the same height. Without air resistance and with +y upward, what is its velocity on returning?`,
      ["At the same height it regains its speed, but it is descending."], ["Energy symmetry preserves the magnitude of velocity.", `Because it returns toward −y, v = −${number(value)} m/s.`],
      { fields: ["Return velocity"], answerDisplay: `−${number(value)} m/s` },
    );
    return presentation(
      "Maximum height of a launch", `A ball is launched upward with v₀ = ${number(value)} m/s. Use +y upward and g = ${number(g)} m/s². Calculate the maximum rise.`,
      ["At the top v = 0; use the time-independent relation."], [`0 = ${number(value)}² − 2(${number(g)})Δy.`, `Δy = ${result} m.`],
      { fields: ["Maximum rise"], answerDisplay: `${result} m` },
    );
  },
  "family-u1-horizontal-projectile": ({ parameters: { height, vx, g }, answer }) => {
    const [time, range] = answer.values.map((entry) => number(entry.value));
    return presentation(
      "Horizontally launched projectile", `An object leaves horizontally with vₓ = ${number(vx)} m/s from a height of ${number(height)} m. Without air resistance and with g = ${number(g)} m/s², calculate the fall time and horizontal range.`,
      ["The vertical fall time is the same time that multiplies vₓ in the horizontal motion."],
      [`${number(height)} = ½(${number(g)})t² gives t = ${time} s.`, `x = vₓt = ${number(vx)}(${time}) = ${range} m.`],
      { fields: ["Time", "Range"], answerDisplay: null },
    );
  },
  "family-u1-circular-acceleration": ({ parameters: { speed, radius }, answer }) => presentation(
    "Radial acceleration", `A particle moves on a circle of radius R = ${number(radius)} m at a speed of ${number(speed)} m/s. Calculate the magnitude of its centripetal acceleration.`,
    ["Use a_c = v²/R; its direction is toward the centre."], [`a_c = (${number(speed)})²/${number(radius)}.`, `a_c = ${number(answer.value)} m/s² toward the centre.`],
    { fields: ["Centripetal acceleration"], answerDisplay: `${number(answer.value)} m/s²` },
  ),
  "family-u1-relative-velocity-1d": ({ parameters: { context, relative, frame }, answer }) => {
    const contextEn = { "banda móvil": "moving walkway", plataforma: "platform", vehículo: "vehicle" }[context];
    return presentation(
      "Relative velocity in one dimension", `Take +x to the right. On a ${contextEn}, an object has velocity ${number(relative)} m/s relative to the moving frame, which in turn has velocity ${number(frame)} m/s relative to the ground. Calculate the object's velocity relative to the ground.`,
      ["Write v_object/ground = v_object/moving + v_moving/ground."],
      [`v_obj/ground = (${number(relative)}) + (${number(frame)}).`, `v_obj/ground = ${number(answer.value)} m/s.`],
      { fields: ["Velocity relative to the ground"], answerDisplay: `${number(answer.value)} m/s` },
    );
  },
});

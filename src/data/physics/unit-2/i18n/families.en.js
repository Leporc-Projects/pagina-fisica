const steps = (...values) => values;

export const FAMILY_OBJECTIVES_EN = Object.freeze({
  "u2-family-collinear-net-force": ["Add collinear forces using a sign convention."],
  "u2-family-net-force-2d": ["Add two-dimensional forces by components."],
  "u2-family-second-law-acceleration": ["Calculate acceleration from net force and constant mass."],
  "u2-family-second-law-required-force": ["Calculate the net force required for an acceleration."],
  "u2-family-weight": ["Calculate weight from an explicit mass and gravitational field."],
  "u2-family-third-law": ["Combine Newton's third and second laws for bodies of different masses."],
  "u2-family-fbd-resultant": ["Calculate resultant force and acceleration from a collinear force inventory."],
  "u2-family-galilean-velocity": ["Transform a one-dimensional velocity between inertial frames."],
});

export const FAMILY_PRESENTERS_EN = Object.freeze({
  "u2-family-collinear-net-force": ({ parameters: { right, left }, answer }) => ({
    title: "Collinear resultant", prompt: `A system experiences ${right} N toward +x and ${left} N toward −x. Calculate ΣFₓ.`,
    fields: ["ΣFₓ"], hints: ["Assign signs according to the +x axis."], answerDisplay: answer.display,
    solution: steps("Net force adds the external forces with direction.", `ΣFₓ = +${right} − ${left}.`, `ΣFₓ = ${answer.value} N.`, `The ${answer.value > 0 ? "positive" : "negative"} sign fixes the direction.`),
  }),
  "u2-family-net-force-2d": ({ parameters: { ax, ay, bx, by }, answer }) => ({
    title: "Adding forces in 2D", prompt: `F⃗₁ = (${ax}, ${ay}) N and F⃗₂ = (${bx}, ${by}) N. Determine ΣFₓ and ΣFᵧ.`, fields: ["ΣFₓ", "ΣFᵧ"],
    hints: ["Add corresponding components."], solution: steps("Vector addition is projected onto the axes.", `ΣFₓ = ${ax} + (${bx}); ΣFᵧ = ${ay} + (${by}).`, `ΣF⃗ = (${answer.values[0].value}, ${answer.values[1].value}) N.`, "The components retain the signs of their axes."),
  }),
  "u2-family-second-law-acceleration": ({ parameters: { mass, force }, answer }) => ({
    title: "Acceleration from Newton's second law", prompt: `A ${mass} kg mass experiences ΣFₓ = ${force} N. Calculate aₓ.`, fields: ["aₓ"], hints: ["Use aₓ = ΣFₓ/m."], answerDisplay: answer.display,
    solution: steps("The mass is constant and the given force is net force.", "ΣFₓ = maₓ.", `aₓ = ${force}/${mass} = ${answer.value} m/s².`, "The sign fixes the direction along x."),
  }),
  "u2-family-second-law-required-force": ({ parameters: { mass, acceleration }, answer }) => ({
    title: "Required net force", prompt: `What ΣFₓ does a ${mass} kg mass require to have aₓ = ${acceleration} m/s²?`, fields: ["ΣFₓ"], hints: ["Multiply m by aₓ while retaining the sign."], answerDisplay: answer.display,
    solution: steps("The question asks for the external resultant.", "ΣFₓ = maₓ.", `ΣFₓ = ${mass}(${acceleration}) = ${answer.value} N.`, "The sign indicates the direction of the resultant."),
  }),
  "u2-family-weight": ({ parameters: { mass, g }, answer }) => ({
    title: "Weight in a stated field", prompt: `A ${mass} kg mass is where g = ${g} m/s². Calculate the magnitude of its weight.`, fields: ["W"], hints: ["Weight is a force: W = mg."], answerDisplay: answer.display,
    solution: steps("The local field is stated explicitly.", "W = mg.", `W = ${mass}(${g}) = ${answer.value} N.`, "Mass remains unchanged; the result is a force."),
  }),
  "u2-family-third-law": ({ parameters: { massA, massB, force }, answer }) => ({
    title: "Interaction pair and accelerations", prompt: `A (${massA} kg) and B (${massB} kg) push each other with a mutual force of ${force} N. Take +x along the force on A and calculate a_A and a_B, with no other horizontal forces.`, fields: ["a_A", "a_B"], hints: ["The forces are opposite; then apply ΣF = ma to each body."],
    solution: steps("Newton's third law fixes +F on A and −F on B.", "Each body requires its own second-law equation.", `a_A = ${force}/${massA} = ${answer.values[0].value}; a_B = −${force}/${massB} = ${answer.values[1].value} m/s².`, "Equal forces do not imply equal accelerations."),
  }),
  "u2-family-fbd-resultant": ({ parameters: { mass, right, left }, answer }) => ({
    title: "From FBD to acceleration", prompt: `The FBD of a ${mass} kg mass shows ${right} N toward +x and ${left} N toward −x. Calculate ΣFₓ and aₓ.`, fields: ["ΣFₓ", "aₓ"], hints: ["First add the forces; then divide by mass."],
    solution: steps("The FBD defines the inventory for the same system.", `ΣFₓ = ${right} − ${left} = ${answer.values[0].value} N.`, `aₓ = ${answer.values[0].value}/${mass} = ${answer.values[1].value} m/s².`, "Their common sign fixes the direction."),
  }),
  "u2-family-galilean-velocity": ({ parameters: { relative, frame }, answer }) => ({
    title: "Galilean velocity", prompt: `An object has v' = ${relative} m/s in S', and S' moves at V = ${frame} m/s relative to S. Calculate v in S.`, fields: ["v"], hints: ["From v' = v − V, obtain v = v' + V."], answerDisplay: answer.display,
    solution: steps("The frames have constant relative velocity.", "v = v' + V.", `v = ${relative} + (${frame}) = ${answer.value} m/s.`, "Acceleration would remain the same in both frames."),
  }),
});

# Prepublication verification

This gate is mandatory before pushing any change to academic content or simulations. Record the commands, oracle inputs and observed results in the task or release report; a green build alone is not evidence of physical correctness.

## Required local gate

- [ ] Run focused tests for every changed contract or corrected defect.
- [ ] Run `npm test`.
- [ ] Run `npm run test:charts`.
- [ ] Run `npm run validate`.
- [ ] Run `npm run verify`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] Run `npm audit`.
- [ ] Start a local preview and inspect the changed surfaces before any push.
- [ ] Verify Spanish and English, desktop and 390×844 mobile layouts, keyboard-accessible controls, overflow and browser-console errors.
- [ ] Check initial light and dark rendering, then light→dark→light and dark→light→dark at runtime without reload; confirm the visual refresh preserves parameters, time, physical state and history.
- [ ] Inspect text drawn inside Canvas/p5 directly in ES/EN, desktop/mobile and warning/error/limit states. Document-level overflow does not detect text clipped by a canvas boundary.

For a simulation change, also:

- [ ] Derive expected values independently of the implementation and test representative regimes, signs, limits and constraints.
- [ ] Match analytical key points to plotted series and the current-state marker.
- [ ] Check model, renderer, free-body diagram, equations and readings against the same physical state.
- [ ] Check reset and scenario/preset switching for stale state or history.
- [ ] For a finite scene boundary, verify the full final message, the exact stop point and enough visible travel for the intended classroom interaction.
- [ ] For rope-and-pulley apparatus, inspect every anchor, hook, hanger, yoke, support and tangent at 0/25/50/75/100%; reject floating parts, unexplained gaps, overlaps or viewport-dependent contact states.
- [ ] At a geometry contact, verify the pre-impact velocity and acceleration remain visible, the graph ends at the same exact time, and no bounce or unmodeled impact force is introduced.

For a numerical academic change, also:

- [ ] Recalculate the changed example or answer independently from the stored result.
- [ ] Check sign convention, system boundary, unit, rounding and tolerance.
- [ ] Add a focused regression test for the corrected defect.

Do not push when any item fails or cannot be demonstrated. Document the exact blocker instead.

## Verification record — 2026-08-25

Starting ref: `6387911cb1870571eb9bff43240e815b8b7676e2`.

The independent prepublication audit recalculated the simulation oracle matrix and the complete registered academic corpus. The real inventory was 57 topics, 215 sections, 100 formulas, 104 visualizations, 113 concept checks, 144 common errors, 44 worked examples, 292 fixed exercises and 77 parameterized families.

Sources actually inspected were the 2026-2 class-by-class plan and the locally available tables of contents and relevant mechanics coverage in Halliday/Resnick, Kleppner/Kolenkow and Sears/Zemansky. Textbook solution manuals were not used as proof. The official standalone curriculum was not present, so no claim is made that it was independently inspected. Physics was verified by derivation, dimensions, conservation laws, constraints and limiting cases.

Findings corrected:

1. The table-and-hanging-mass renderer drew a diagonal segment that implied a vertical tension component while the model used `N=m₁g`. The rope now enters the fixed pulley horizontally at a tangent.
2. Atwood, movable-pulley and double-Atwood drawings did not preserve their ideal rope constraints exactly. Pure geometry now constructs tangent arcs and straight spans whose lengths obey each model constraint.
3. A finite-scene stop could occur between 30 Hz history samples, leaving the graph marker behind the final state. The exact stopped state is now always the final sample.
4. The former travel-limit announcement could be overwritten by the Step control and could be read as a modeled stopping force. The visible contact announcement now identifies the apparatus boundary and explicitly states that the impact is not modeled.
5. Unit 1 formulas had correct equations but incomplete pedagogical metadata for variables, units, interpretation or dimensional checks. Spanish and English metadata now cover the same invariant formulas.

Permanent regression coverage includes pure pulley geometry, the K/P/F/PT/PA/PM/PD analytic matrix, chart/current-marker mapping, the exact geometry-contact sample and announcement, all 100 formula accessibility/metadata contracts, all 292 fixed-exercise invariants, and 100 deterministic finite bilingual seeds for each of the 77 families. Unit-specific family tests add independent conservation, balance, domain, sign and constraint properties.

## Pulley apparatus addendum — 2026-08-25

Starting ref: `8e316625d20441b6c22c5d0886f245e152d607ec`.

The five pulley drawings now share explicit mechanical vocabulary: grooved wheels, fixed axles, table bracket, ceiling supports, rope anchors, mass eyelets, movable yokes and continuous hangers. The 3:1 tackle adds two fixed pulleys, one moving pulley and three explicit supporting strands. Pure geometry exposes every endpoint and the model owns scenario-specific terminal surfaces in metres. Contact is selected by the earliest positive analytic crossing, independent of viewport; playback preserves the immediately pre-impact velocity and acceleration and the history chart marks the same event. Static spokes replace the former arbitrary time/position rotation.

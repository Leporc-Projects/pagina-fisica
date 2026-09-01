# Aula Física agent guide

## Mission

Aula Física is a static Astro academic site for university Basic Physics I. It
publishes complete Spanish and English experiences while treating academic
correctness, clarity, accessibility, privacy, and deterministic physics as core
invariants.

## Start-of-task gate

1. Read the user or block prompt before acting and identify its exact scope,
   baseline, branch, verification, QA, commit, and publication policy.
2. Read the canonical documents relevant to the requested work. Repository
   knowledge must come from the current tree, not prior chat context.
3. When a prompt supplies a baseline, fetch `origin` and verify the exact SHA.
4. Require `main == origin/main`, a clean working tree, and the requested local
   feature, chore, or audit branch before editing.
5. If any baseline condition differs, stop and report it. Never reset, rebase,
   force, stash, or silently repair history to make a gate pass.

Do not hardcode a transient baseline in this file.

## Repository map

- Architecture and implementation contracts: `docs/ARCHITECTURE.md`
- Academic and editorial authoring: `docs/CONTENT_GUIDE.md`
- Internationalization: `docs/I18N.md`
- Mini Quiz V2 contracts: `docs/MINI_QUIZ_V2.md`
- Data and privacy: `docs/DATA_AND_PRIVACY.md`
- Analytics: `docs/ANALYTICS_AND_METRICS.md`
- Risk-specific and prepublication QA: `docs/PREPUBLICATION_VERIFICATION.md`
- Academic closure evidence: `docs/ACADEMIC_CLOSURE.md`
- Independent audit evidence: `docs/FULL_SITE_INDEPENDENT_AUDIT.md`
- Semantic audit evidence: `docs/FULL_SITE_SEMANTIC_AUDIT.md`
- Human + ChatGPT + Codex workflow: `docs/DEVELOPMENT_WORKFLOW.md`
- Reusable substantial-block prompt: `docs/CODEX_BLOCK_TEMPLATE.md`

The canonical documents own specialized contracts. In particular, use them for
the academic registry and exercise schema, progressive content layers, MathML,
worked examples, published simulation catalogs, participation schemas and
scope, teacher-tool publication, analytics events, and risk-specific QA. Do not
fork those rules into a second implementation or documentation system.

For Astro-specific work, consult the applicable official guide:

- [Routing](https://docs.astro.build/en/guides/routing/)
- [Components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Styling](https://docs.astro.build/en/guides/styling/)
- [Internationalization](https://docs.astro.build/en/guides/internationalization/)

## High-level invariants

- Spanish is the default locale at root paths; English uses `/en/`. Never add
  `/es/` or automatic locale redirects.
- Keep `Aula Física` unchanged. Treat shared physics, equations, parameters,
  units, numeric configuration, IDs, and grading invariants as one ES/EN source;
  localization is presentation.
- Never silently fall back to another locale for editorial content. A public
  counterpart exists only when its complete content is ready.
- Academic difficulty must come from physics and reasoning, never ambiguous
  wording. Claims, equations, figures, examples, and answers must agree.
- Simulation architecture remains pure model/state -> renderer -> UI. Renderers
  visualize model-owned physics and must not duplicate or invent it.
- Visual QA is meaning-first: verify that geometry, vectors, labels, equations,
  readings, interaction, responsive layout, themes, and accessibility preserve
  the intended physical meaning.
- Work privacy-first. Do not add a backend, identity, persistence, submission,
  tracking, or analytics expansion without explicit approval and the canonical
  privacy review. Never expose secrets client-side.
- Do not publish automatically. Push, PR, merge, deployment, or any other
  external integration requires explicit authorization.
- Product, academic, simulation, and visual changes remain local-first and must
  reach the documented human-QA gate before publication is considered.

## Development discipline

- Implement only the approved scope; report stale or conflicting rules instead
  of guessing. Preserve the safer behavior until a decision is made.
- Keep permanent knowledge in the repository and link canonical documents
  rather than pasting large historical reports into prompts or new files.
- Comments explain contracts, constraints, safety, or non-obvious reasoning.
  Do not narrate syntax or retain obsolete implementation history; keep comments
  in the language of the surrounding module.
- Do not add dependencies, frameworks, services, or configuration changes
  unless the block explicitly authorizes them.
- When a dev server is needed, use `astro dev --background`. Manage it with
  `astro dev status`, `astro dev logs`, and `astro dev stop`.

## Verification map

Use focused tests while implementing, then run the closure required by the
block. The standard repository commands are:

```sh
npm test
npm run test:charts
npm run validate
npm run verify
npm run build
npm run stats:loc
git diff --check
npm audit
```

`docs/PREPUBLICATION_VERIFICATION.md` adds mandatory gates for academic,
numerical, simulation, visual, runtime-theme, Canvas, and publication-sensitive
work. A green build does not replace independent physics or visual evidence.

## Reporting contract

Final production-oriented reports include the starting SHA, final feature SHA,
branch and commits, focused and full tests, QA evidence, build and page count,
audit result, limitations, publication state, and `main` / `origin/main` / tree
status. When LOC is relevant, report starting, final, and delta values for
Application, Tooling, Tests, CODE TOTAL, Editorial data, Documentation, and
RELEVANT TOTAL.

State external actions explicitly, including when there was no push, PR, merge,
or deploy. Never describe work as published merely because it builds locally.

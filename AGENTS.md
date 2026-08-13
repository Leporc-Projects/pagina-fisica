## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Internationalization

- Spanish is the default locale at root paths; English uses `/en/`. Never add `/es/` or automatic locale redirects.
- Update `src/i18n/config.js`, both dictionaries, `src/i18n/routes.js`, localized content, tests, and `docs/I18N.md` together.
- Do not publish a localized route until its full page and associated content are complete. Use a `null` counterpart and the disabled language selector otherwise.
- Keep `Aula Física` and `Leporc Projects` unchanged. Keep physics, units, equations, parameters, and numeric configuration shared across locales.
- Shared interface strings belong in dictionaries and use `t(locale, key, params)`. Do not add scattered locale conditionals or HTML interpolation.
- Visible numbers use the registered `Intl` locale; numeric HTML inputs keep computational dot semantics.
- Build every new core feature, public or teacher-facing, in Spanish and English from the start.
- Do not merge a core feature with missing translations or an incomplete locale route.
- Contracts with shared data must separate invariants from localized presentation.
- Deliberately locale-specific editorial content must declare its locale explicitly; never infer it or fall back silently.
- Public/student-facing and teacher-tool coverage is complete in ES and EN.

## Academic clarity

- Conceptual difficulty must come from physics and reasoning, never from ambiguous wording.
- Every core academic section develops one concept through four required layers: Essential explains its physical meaning accessibly, Understand develops relations and application, Deepen formalizes it, and Explore generalizes or connects it.
- Keep only Essential visible initially; use native disclosures for Understand, Deepen, and Explore, with all content readable in print.
- Keep semantic MathML typographically integrated with surrounding text through the shared inline-math contract; do not add per-formula alignment hacks.
- A public simulations catalog represents published resources, not a roadmap. Derive visible categories from published simulations and do not add promotional availability or novelty badges to finished features.

## Code comments

- Comments explain contracts, constraints, safety, or non-obvious reasoning. Do not narrate syntax or retain obsolete implementation history.
- Keep comments in the language of the surrounding module and update them when a contract changes.

## Final verification

- Run `npm run validate`, `npm run verify`, `npm run build`, `npm run stats:loc`, `git diff --check`, and `npm audit` before production integration.
- Every final production report must include starting and final refs plus LOC for Application, Tooling, Tests, CODE TOTAL, Editorial data, Documentation, RELEVANT TOTAL, and the corresponding deltas.

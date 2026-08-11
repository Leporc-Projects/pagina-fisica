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

## Code comments

- Comments explain contracts, constraints, safety, or non-obvious reasoning. Do not narrate syntax or retain obsolete implementation history.
- Keep comments in the language of the surrounding module and update them when a contract changes.

## Final verification

- Run `npm run validate`, `npm run verify`, `npm run build`, `npm run stats:loc`, `git diff --check`, and `npm audit` before production integration.
- Every final production report must include starting and final refs plus LOC for Application, Tooling, Tests, CODE TOTAL, Editorial data, Documentation, RELEVANT TOTAL, and the corresponding deltas.

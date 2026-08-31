# Development workflow

This document defines the canonical collaboration workflow for substantial Aula
Física work. The repository root `AGENTS.md` is the operating map; the canonical
documents it links remain authoritative for their domains.

## Roles

### Human / product owner

- Sets priorities and authorizes scope.
- Performs final subjective or human QA when the block requires it.
- Alone authorizes publication and external integration.

### ChatGPT

- Plans product, architecture, physics, and pedagogy work.
- Defines incremental block contracts and reviews reports and diffs.
- Performs adversarial correctness review.
- Decides whether evidence is sufficient for human QA or integration review; it
  does not replace the human publication decision.

### Codex

- Acts as the implementation agent: inspects the current repository, implements
  only the approved scope, tests it, closes the block, and reports evidence.
- Does not broaden scope, repair history to bypass a gate, or publish without
  explicit authorization.
- Records reusable project knowledge in the repository instead of depending on
  old chat context.

## Session strategy

- Start a new Codex chat or session for every substantial new block.
- Continue the same session only for small corrections or reviews within that
  same open block.
- Start a fresh chat after block closure.
- `/clear` is not a quota reset and must never be treated as one.
- Project knowledge belongs in versioned documentation, code, and tests; future
  work must not depend on an earlier chat being available.

## Prompt strategy

Substantial prompts should be incremental rather than encyclopedic. English is
acceptable and preferred for implementation instructions when it improves
precision; all public Spanish and English copy must still be correct.

A substantial block prompt normally includes only:

1. Exact baseline SHA.
2. Local branch.
3. Objective.
4. Scope and non-scope.
5. New or block-specific contracts.
6. Relevant files and canonical documents.
7. Focused tests.
8. Local and human QA.
9. Final closure commands.
10. Final report requirements.
11. Definition of Done.
12. Publication policy.

`AGENTS.md` and the canonical documents carry permanent rules. A block prompt
should not repeat them unless it intentionally and explicitly overrides a rule
for that block.

## Task sizing

### Small fix

A known, narrow cause affecting few files. The existing block session may
continue. Use focused tests and the closure proportionate to the affected risk.

### Standard feature or block

A meaningful behavior or content change. Use a fresh Codex session, an exact
baseline, a local branch, the full incremental block prompt, focused tests, QA,
and full closure.

### High-risk audit or refactor

Use this class for an unknown cause, cross-cutting architecture, semantic
academic audit, major migration, or similarly broad risk. Start a fresh chat,
use the strongest available reasoning capability, produce staged evidence, and
use independent oracles when applicable. Do not publish before review.

Capability classes are policy; transient model product names are not.

## Git lifecycle

1. Fetch `origin`.
2. Verify the exact baseline supplied by the block.
3. Require `main == origin/main` and a clean tree.
4. Create the requested local feature, chore, or audit branch.
5. Make a small number of logical commits.
6. Run focused tests, risk-specific QA, and full closure.
7. Obtain reviewer and human approval.
8. Integrate with `git merge --ff-only` only when authorized.
9. Push only after explicit authorization.
10. Wait for CI and Pages, then perform a production smoke test.
11. Delete the local branch after confirmed integration.
12. Finish clean and synchronized.

Never squash, force-push, rebase, or otherwise rewrite history unless a future
block explicitly changes that policy. A failed baseline gate is reported, not
repaired. Steps after local closure are a lifecycle description, not standing
authorization to perform them.

## Context and usage efficiency

- Link canonical paths and sections instead of pasting giant historical reports.
- Ask Codex to inspect relevant repository files rather than reproducing them in
  the prompt.
- Run focused tests during exploration and the mandated full closure once the
  implementation is stable.
- Keep temporary diff, browser, and review artifacts untracked or outside the
  repository unless the block explicitly makes them deliverables.
- Prefer deterministic tests and programmatic oracles over repeated manual
  narrative checks. Use manual QA where meaning, interaction, or appearance
  cannot be established programmatically.
- Report exact evidence once; do not promote assumptions into project knowledge.

## Closure and handoff

The block prompt selects the applicable focused tests and QA. Standard closure
commands and reporting fields live in `AGENTS.md`; risk-specific additions live
in `docs/PREPUBLICATION_VERIFICATION.md`.

The handoff must distinguish local completion, readiness for human QA,
integration authorization, and publication. Passing tests grants none of the
later permissions automatically.

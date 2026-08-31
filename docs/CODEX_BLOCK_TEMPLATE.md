# <BLOCK_NAME>

## 1. Codex setup / session

- Start a new Codex chat/session for this substantial block.
- Use the strongest reasoning capability appropriate to the block risk.
- Keep project knowledge in the repository, not in prior chat context.

Read and obey the repository root `AGENTS.md` and the canonical documents it references. Do not duplicate those permanent rules here.

## 2. Repository and baseline

- Repository: `Leporc-Projects/pagina-fisica`
- Expected starting SHA: `<BASELINE_SHA>`
- Local branch: `<BRANCH>`

Before editing:

1. Run `git fetch origin`.
2. Verify `main == origin/main == <BASELINE_SHA>`.
3. Verify the working tree is clean.
4. If anything differs, stop and report it. Do not reset, rebase, force, stash,
   or silently repair history.
5. Create the requested local branch.

## 3. Objective

<OBJECTIVE>

## 4. Scope

- <IN_SCOPE_ITEM>
- <IN_SCOPE_ITEM>

## 5. Non-scope

- <OUT_OF_SCOPE_ITEM>
- <OUT_OF_SCOPE_ITEM>

Do not broaden the block without explicit authorization.

## 6. New / block-specific contracts

- <BLOCK_SPECIFIC_CONTRACT>
- <BLOCK_SPECIFIC_CONTRACT>

Only new or intentionally overridden contracts belong here. Permanent project
rules remain in `AGENTS.md` and its canonical references.

## 7. Files / docs to inspect

<FILES_TO_INSPECT>

Inspect before editing. Follow links into canonical documentation only as needed
for the approved scope.

## 8. Implementation constraints

- Implement only the approved scope.
- Preserve existing contracts unless this block explicitly changes them.
- Do not introduce unrelated product, dependency, configuration, or publication
  changes.
- Keep temporary review artifacts untracked or outside the repository.

## 9. Focused tests

<FOCUSED_TESTS>

Record exact commands, counts, failures, warnings, and any independent oracle
inputs or expected values.

## 10. Local QA

- Complete the risk-specific checks required by
  `docs/PREPUBLICATION_VERIFICATION.md`.
- Verify the changed behavior or artifact locally.
- Human QA: <HUMAN_QA>

Record viewports, locales, themes, interactions, console state, and limitations
when they are relevant to the block.

## 11. Final closure

Run the standard closure from `AGENTS.md`:

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

Add any stricter block-specific closure here:

- <ADDITIONAL_CLOSURE_CHECK>

## 12. Git / commit policy

- Prefer a small number of logical local commits.
- Suggested commits: <COMMIT_PLAN>
- No squash, rebase, force-push, history rewrite, push, PR, merge, or deploy
  unless this block explicitly authorizes the action.
- Do not change `main`.

## 13. Final report

Include:

- starting SHA, branch, final HEAD, commits, `main`, and `origin/main`;
- working-tree state and explicit external actions not taken;
- files and contracts changed;
- focused tests, full closure, warnings, build/page count, and audit;
- QA evidence and limitations;
- LOC categories and deltas when relevant;
- exact publication state.

## 14. Definition of Done

- [ ] Exact baseline verified before editing.
- [ ] Approved scope implemented without unrelated changes.
- [ ] New contracts documented and protected by focused tests.
- [ ] Required local and human QA evidence recorded.
- [ ] Full closure is green.
- [ ] Logical local commits created.
- [ ] Final report is complete and exact.
- [ ] Publication policy was obeyed.

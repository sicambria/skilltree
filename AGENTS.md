<!-- BEGIN kaizen (managed — do not edit inside this block) -->
# Agent Operating Contract (kaizen harness)

> Canonical, tool-agnostic driver. Per-agent files (`CLAUDE.md`, `.cursor/rules`, `.codex`,
> `opencode.jsonc`, `.github/copilot-instructions.md`) are thin overlays that import this file.
> This is the source of truth — edit here, then regenerate overlays (`kaizen init --check` detects drift).

## Session-start invariants (violation = blocker)
1. **Before ANY edit:** run `git branch --show-current` and `git worktree list --porcelain`. If on the
   default branch (see `.harness/config.json` → `defaultBranch`) and the task changes any substantive
   (non-docs) file, **STOP and create a worktree first**, then merge at the end.
2. **Never leave the default branch with uncommitted substantive changes.** Substantive work goes in a
   worktree → merge to the default branch only when it is clean.
3. **After ANY `git push`:** verify with `git rev-list --left-right --count origin/<branch>...<branch>`.
   The AHEAD count MUST be 0. If the command timed out, the push did NOT complete — re-verify.
4. **After context compaction:** re-read this file and the active plan before continuing.
5. **Never use `--no-verify`.** The gates are the product. A bypass that reaches the default branch is a
   defect. If a gate is wrong, fix the gate (and log the decision), don't skip it.

## Plan-before-code (enforced)
- Non-trivial work gets a plan file under `.harness/plans/` before implementation.
- Every plan MUST contain a `## Standards & Guardrails Evidence` section whose `path:line` citations
  **resolve against the working tree** — a hallucinated citation hard-fails the commit
  (`.harness/scripts/audits/verify-plan-evidence.mjs`). Check off every configured evidence dimension
  with a resolving citation or an explicit `N/A — reason`.

## Verify contract
- The stack's real checks live behind `.harness/config.json → verify` (`test`/`lint`/`build`/`e2e`/`healthcheck`).
- `.harness/scripts/verify.mjs` runs them. A required check that cannot be mechanically confirmed
  **abstains (`human_needed`)** and fails closed — it never silently passes.

## SOTA scorecard (capability self-assessment)
- `node .harness/scripts/ops/sota-score.mjs` scores the harness **0–1000** against an embedded
  11-aspect weighted rubric, grading **function over presence** — a capability earns full credit only
  when `doctor` reports it wired-and-healthy, partial (0.5) when merely present, zero when absent.
  Flags: `--json`, `--write` (persists a snapshot to the event spine), `--min <n>` (opt-in gate).
  **Advisory / exit 0 by default** — a subjective score is deliberately never wired as a silent hard gate.
- It is a **capability-coverage** score (how much SOTA-harness capability is present and healthy here),
  **NOT** a benchmark-measured performance SOTA position — keep the two distinct.

## Install-time strengthening (never weaken existing controls)
- Installing kaizen must only ever *add* enforcement, never subtract it. `kaizen init` takes over
  `core.hooksPath`, so it **chains** the repo's pre-existing hooks (husky / pre-commit framework / hand-written
  `.git/hooks` / a custom hooksPath) — they keep firing and keep blocking, recorded in `config.hooks.chained`
  and run fail-closed by the drivers. A control that blocked a commit/push before install still blocks it after.
- An AI performing an install follows the same rule. If the target repo already has a good pattern the harness
  lacks, **strengthen the harness in place** (add it to `templates/` + the dogfood mirror, dual-tree) rather than
  leaving the adopter's enforcement weaker than you found it or shipping a one-off local hack. Never `--no-verify`,
  never silently orphan a gate; if a chained control is genuinely wrong, fix or retire it with a logged decision.

## Incident & learning loop (closed)
- On discovering any real bug: check `.harness/archive/postmortems/INDEX.md` first, do RCA, then scaffold
  an incident note (metadata + Summary/Root Cause/Prevention/Guardrail Updates/Automation Follow-Up).
- The note MUST cite a concrete guardrail path and automation path — the loop closes on a real prevention
  artifact, never prose. `verify-learning-loop.mjs` gates it and regenerates the index deterministically.

## Memory (survives context resets, committed in-repo)
- `.harness/memory/memory.md` is the hot, auto-loaded index. `project.md`/`user.md` are semantic;
  `episodic/` holds daily journals; `procedural/` holds distilled reusable skills. All committed in-repo.

## Behavioral contract & invariants (the layer beneath the gates)
- The tiered agent contract (T0 halt / T1 waiver / T2 best-effort / T3 graceful), the agent execution state
  machine, stop triggers, assumption budget, and Intent Gate live in `.harness/memory/rules.md`. Re-read its
  T0/T1 tiers + state machine at session start, after compaction, and at plan→execution transitions.
- `.harness/INVARIANTS.md` is the invariant registry + blast-radius Protection Matrix: when a change's blast
  radius intersects a threat category, consult the named invariant and apply the tier-appropriate response.
- Rationale (the MAST-grounded failure-mode taxonomy) is in `.harness/reference/failure-modes.md` — a design
  artifact, deliberately **not** hot-loaded, to keep the per-session context budget lean.

## Overrides are audited, never silent
- Any gate override must append a justified entry to `.harness/archive/decisions/` — an override that
  leaves no trace is forbidden.

## Session-start contract-read canary
Prove you actually ingested the contract (not just this pointer overlay): four **canary words** are
embedded as HTML-comment markers (format `CANARY: <word>`), one in each of `AGENTS.md`,
`.harness/memory/rules.md`, `.harness/INVARIANTS.md`, and `.harness/memory/memory.md`. **Surface all four
at session start.** Claude enforces contract-read through its SessionStart hook; for hook-less providers
(Cursor / Codex / opencode / Copilot) this canary is the read-compliance signal they otherwise lack. The
marker *integrity* (exactly one per file, all listed here) is gated by
`.harness/scripts/audits/verify-canary.mjs` — a marker that drifts out of sync fails closed.
<!--CANARY: MARBLE-->
<!-- END kaizen -->

## Repo-local: harness files are local-only (never on GitHub)

The entire AI harness (kaizen) lives in this repo **for local use only**. It must never
be committed to git or pushed to GitHub. All harness paths are covered by `.gitignore`
and no harness files are in the git index. This is enforced by convention:

- **Never** `git add` any path under `.harness/`, `AGENTS.md`, `CLAUDE.md`,
  `opencode.jsonc`, `.claude/`, `.cursor/rules/kaizen.mdc`,
  `.github/copilot-instructions.md`, `.github/workflows/kaizen-gate.yml`,
  `.github/workflows/osv-scan.yml`, `.gitlab-ci.yml`, or `bitbucket-pipelines.yml`.
- **Never** include harness files in a worktree merge.
- If `kaizen init --check` or `kaizen doctor` suggests re-running init, that is safe
  to do locally — it re-scaffolds `.harness/` on disk and rewires hooks. The resulting
  local commit (if any) must **not** be pushed to GitHub. After a re-init, re-apply
  `git rm --cached` to remove harness files from the index if the bootstrap commit
  added them back.
- A push that includes any harness path is a defect. The pre-push hook's
  `secret-scan` / `identity-scan` gates may catch some cases, but the primary
  defense is agent discipline — this section of the contract.

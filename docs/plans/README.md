# Plans

## Active

| Plan | Priority | Description | Score | Status |
|------|----------|-------------|-------|--------|
| [P1: Community Feed](p1-community-feed.md) | **High** | Social feed: skill level-ups, training offers/requests, Q&A, comments. Chronological, no likes/karma. | 99/100 | ✅ Complete (FE + BE) |
| [P2: Collaborative Progress Tracking](p2-collaborative-progress-tracking.md) | **High** | Skill-history timeline, collaborative goals, joint learning plans. No streaks or leaderboards. | 100/100 | ✅ Complete (FE + BE) |
| [P3: Mentor Recommendations](p3-mentor-recommendations.md) | **Medium** | "What should I learn next?" — mentors, paths, trainings based on skill gaps and goals. | 100/100 | ✅ Complete (FE + BE) |
| [P4: Skill Complementarity](p4-skill-complementarity.md) | **Medium** | "Who balances me?" — find people with skills you lack; group coverage view. | 99/100 | ✅ Complete (FE + BE) |
| [P5: Personal Learning Plan](p5-personal-learning-plan.md) | **High** | 3-month / 1-year / 3-year nested learning plan with cascade, progress tracking. Companion to P2. | 99/100 | ✅ Complete (FE + BE) |
| [P6: JTBD Menu & UX Overhaul](p6-jtbd-menu-and-ux-overhaul.md) | **High** | JTBD-based navigation, browse-all pages, onboarding wizard, dummy content removal. | 99/100 | ✅ Complete (FE) |

## Deferred Follow-ups

| Plan | Parent | Reason |
|------|--------|--------|
| P1b: In-app notifications | P1 | Notifications polling not included in frontend sweep. |
| P2b: Check-in nudges + timeline export | P2 | Nice-to-haves. Middleware for gentle reminders, JSON export. |
| P4b: Connection requests | P4 | Follow-up. Messaging system for pairing based on complementarity. |

## Complete

| Plan | Completed | Results |
|------|-----------|---------|
| [Increase meaningful test coverage](increase-meaningful-test-coverage.md) | Yes | 357 tests, 99.44% stmts, 95.48% branches |
| [Frontend UI for new features](done/frontend-ui-for-new-features.md) | Yes | Community navbar dropdown, 8 modals, 25+ JS functions, 855 LOC added |

## Gate Record

[ADVISOR-GATE.md](ADVISOR-GATE.md) — full advisor assessment for all plans. P4 required one revision cycle (incorrect MongoDB `$nin` query fixed).

## Specs

[Gap specs and prioritization](../specs/gap-specs.md) — derived from the JTBD analysis in [JTBD.md](../JTBD.md).

## Standards & Guardrails Evidence

- [x] Tests / shift-left: N/A — README is a directory index with no code to test
- [x] Reused patterns / grounding: N/A — README follows standard markdown table layout, no code patterns to reuse
- [x] Security: N/A — documentation only, no code or configuration

# Plans

## Active

| Plan | Priority | Description | Score | Status |
|------|----------|-------------|-------|--------|
| [P1: Community Feed](p1-community-feed.md) | **High** | Social feed: skill level-ups, training offers/requests, Q&A, comments. Chronological, no likes/karma. | 99/100 | Advisor passed |
| [P2: Collaborative Progress Tracking](p2-collaborative-progress-tracking.md) | **High** | Skill-history timeline, collaborative goals, joint learning plans. No streaks or leaderboards. | 100/100 | Advisor passed |
| [P3: Mentor Recommendations](p3-mentor-recommendations.md) | **Medium** | "What should I learn next?" — mentors, paths, trainings based on skill gaps and goals. | 100/100 | Advisor passed |
| [P4: Skill Complementarity](p4-skill-complementarity.md) | **Medium** | "Who balances me?" — find people with skills you lack; group coverage view. | 99/100 | Advisor passed (revised) |
| [P5: Personal Learning Plan](p5-personal-learning-plan.md) | **High** | 3-month / 1-year / 3-year nested learning plan with cascade, progress tracking. Companion to P2. | 99/100 | Advisor passed |

## Deferred Follow-ups

| Plan | Parent | Reason |
|------|--------|--------|
| P1b: Feed frontend + notifications | P1 | Scope split. Frontend page, in-app notification polling. |
| P2b: Check-in nudges + timeline export | P2 | Nice-to-haves. Middleware for gentle reminders, JSON export. |
| P4b: Connection requests | P4 | Follow-up. Messaging system for pairing based on complementarity. |

## Complete

| Plan | Completed | Results |
|------|-----------|---------|
| [Increase meaningful test coverage](increase-meaningful-test-coverage.md) | Yes | 357 tests, 99.44% stmts, 95.48% branches |

## Gate Record

[ADVISOR-GATE.md](ADVISOR-GATE.md) — full advisor assessment for all plans. P4 required one revision cycle (incorrect MongoDB `$nin` query fixed).

## Specs

[Gap specs and prioritization](../specs/gap-specs.md) — derived from the JTBD analysis in [JTBD.md](../JTBD.md).

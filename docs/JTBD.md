# Jobs To Be Done

## Product Purpose

> *A web application to visualize skills, motivate self-development, and foster a culture of collaboration and knowledge sharing.*

---

## 1. User Value Jobs

These are the functional, social, and emotional "hires" a user makes when they choose this product.

### Core Functional Jobs

| # | Job | Context / Trigger |
|---|---|---|
| J1 | Record and visualize my current skill levels | I want to see what I know and where I stand at a glance |
| J2 | Identify skill gaps and growth opportunities | I want to know what to learn next |
| J3 | Create a personal, time-framed learning roadmap (skill tree) | I want a structured plan to reach a career or personal goal |
| J4 | Discover experts willing to teach a specific skill | I want to learn from someone real, not just content |
| J5 | Arrange peer-to-peer training at my level | I want hands-on practice with guidance |
| J6 | Explore the full skill dependency graph interactively | I want to understand how skills connect and build on each other |
| J7 | Propose a new skill, tree, or training (contribute to the ontology) | I see something missing and want to add it |
| J8 | Get endorsed by peers for my skills | I want social proof of my competence |
| J9 | Search for people with specific skills | I want to find collaborators or mentors |
| J10 | Track my skill development over time | I want to see my own progress and stay motivated |
| J11 | Assess my readiness for a target role or path | I want to know if I qualify and what's missing |
| J12 | Browse predefined skill trees for inspiration | I want to discover possible career/development directions |

### Social / Emotional Jobs

| # | Job | Emotion / Social Need |
|---|---|---|
| S1 | Feel seen and validated for what I know | Recognition, belonging |
| S2 | Feel confident investing time in learning | Reduced uncertainty, clear path |
| S3 | Be part of a knowledge-sharing community | Peer connection, generativity |
| S4 | Signal expertise to others (via endorsements, skill levels) | Reputation, career capital |
| S5 | Feel prepared for an uncertain future (AI, climate, etc.) | Safety, purpose |

---

## 2. Other Jobs

These are jobs the product performs that do not deliver direct user value but support the system.

### Administrative Jobs

| # | Job | Performer |
|---|---|---|
| A1 | Approve or reject proposed skills, trees, and trainings | Admin |
| A2 | Manage user accounts (suspend, role change) | Admin |
| A3 | Moderate content quality and relevance | Admin |
| A4 | Seed and maintain the skill/tree ontology | Admin / Dev |
| A5 | Import skills from Wikidata in bulk | Admin |

### Technical / System Jobs

| # | Job | Performer |
|---|---|---|
| T1 | Authenticate users securely (JWT + PBKDF2) | System |
| T2 | Authorize actions by role (user vs admin) | System |
| T3 | Rate-limit auth endpoints to prevent abuse | System |
| T4 | Serve the interactive D3.js graph on demand | System |
| T5 | Persist and query skill relationships efficiently | System |
| T6 | Run automated tests (unit, integration, fuzz) | System / CI |
| T7 | Deploy via Docker (Node + Nginx + MongoDB) | DevOps |
| T8 | Set HTTP security headers (Helmet) | System |

### Business / Project Jobs

| # | Job | Performer |
|---|---|---|
| B1 | Maintain high test coverage (>99% stmts, >95% branches) | Dev |
| B2 | Document architecture, features, and roadmap | Dev |
| B3 | Define and seed "future-proof" and "regenerative" skill frameworks | Dev / Domain expert |
| B4 | License the project (AGPLv3 code + CC-BY-SA content) | Owner |

---

## 3. Purpose Alignment Score

**Score: 510 / 1000**

### Scoring Breakdown

| Criterion | Weight | Score | Weighted |
|---|---|---|---|
| Visualize skills | 200 | 180 | Strong visual chart + D3 graph. Missing progress-over-time timeline. |
| Motivate self-development | 250 | 100 | Roadmaps and trees exist but no gamification, streaks, reminders, or achievement system. Motivation is passive. |
| Foster collaboration & knowledge sharing | 250 | 80 | Expert discovery and training offers are present but not widely used; no messaging, forums, reviews, or community feed. |
| Future-ready / regenerative direction | 150 | 100 | Rich ontology of future-proof skills and RDG framework is seeded, but it is not personalized to the user. |
| Execution quality (tests, architecture, deploy) | 150 | 50 | High test coverage and clean architecture are excellent, but the frontend is vanilla JS with no mobile support or real-time features. |

**Total: 510 / 1000**

### Gap Analysis

| Gap | Impact | Effort |
|---|---|---|
| No progress timeline / streaks / goals | High | Medium |
| No community feed or discussion | High | High |
| No personalized skill recommendations | Medium | Medium |
| No mobile-responsive frontend | Medium | High |
| No real-time notifications | Medium | High |
| No skill benchmarking vs. peers (anonymized) | Medium | Medium |
| No integration with external learning platforms (Coursera, edX, etc.) | Low | High |

---

## 4. Summary

The product delivers **strong visualization** and a **rich skill ontology** but under-delivers on the motivational and collaborative pillars of its purpose. It is a high-quality **inventory tool** for skills but not yet an engine that *drives* self-development or community interaction. The seed content around future-proof and regenerative skills is differentiated and valuable, but it sits uncustomized — users cannot yet get a personalized readiness assessment against those frameworks.

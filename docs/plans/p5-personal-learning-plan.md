# P5: Personal Learning Plan (3mo / 1yr / 3yr) with Framework §4.5 Career Path Algebra

## Summary

A structured personal learning plan with three nested time horizons — 3 months, 1 year,
3 years — classified by **transition type** per §4.5.2. Each horizon specifies skills
with **multi-factor target levels** (not just a single score). Gap analysis uses
§4.5.3 career path algebra with skill overlap threshold.

**Design constraint:** Collaborative, regenerative, win-win-win. The plan is personal
but shareable with mentors or peers as a context for help. No comparison, no "plan
completeness" scores.

---

## Framework alignment

This rewrite adds §4.5 career path algebra on top of the existing three-horizon
structure:

| Dimension | Original P5 | Framework §4.5 |
|---|---|---|
| Target level | Single number per skill | Multi-factor: `{ autonomy, complexity, influence, knowledge, business_skills }` each 1-7 with effective = min(factors) |
| Horizon transition | Manual cascade (copy skills) | Classified by transition type: deepen, broaden, pivot, shift, promote |
| Gap analysis | Simple `achievedPoint < targetLevel` | `skill_overlap(P_cur, P_target) ≥ θ=0.4` with gap classification |
| Skill recommendation | N/A | `score = α×nPMI + β×demand_growth + γ×career_gateway` |

---

## Steps

### Phase 1: Model

1. Create `src/models/learningplanmodel.js`:
   ```
   { username, title, description,
     horizons: {
       shortTerm: {  // ~3 months
         targetDate: Date,
         transitionType: { type: String, enum: ['deepen', 'broaden', 'pivot', 'shift', 'promote'] },
         skills: [{
           skillName,
           targetAssessment: {  // Multi-factor target per §5.2
             autonomy: Number (1-7),
             complexity: Number (1-7),
             influence: Number (1-7),
             knowledge: Number (1-7),
             business_skills: Number (1-7)
           },
           goalRef: ObjectId → Goal?,
           notes
         }]
       },
       midTerm: {    // ~1 year
         targetDate: Date,
         transitionType: String,
         skills: [{ skillName, targetAssessment, goalRef?, notes }]
       },
       longTerm: {   // ~3 years
         targetDate: Date,
         transitionType: String,
         skills: [{ skillName, targetAssessment, goalRef?, notes }]
       }
     },
     createdAt, updatedAt
   }
   ```
   - `transitionType` auto-detected from skill comparison on creation (same skills + higher levels = deepen, new skills added = broaden, etc.)
   - Index on `username`

### Phase 2: Controller

2. Create `src/controllers/planController.js`:
   - `createPlan` — `POST { title?, description? }`
   - `getPlan` — `GET /plan` returns user's current plan
   - `updateHorizon` — `PATCH /plan/horizon/:horizon` — accepts `{ skills: [{ skillName, targetAssessment }] }`
   - `classifyTransition` — `POST /plan/classify/:horizon` — analyzes the horizon's skill changes and assigns a transition type per §4.5.2:
     - **deepen**: same skills, higher targetAssessment.effectiveLevel
     - **broaden**: adds new skills not in previous horizon
     - **pivot**: swaps ≥40% of skills (overlap computed via §4.5 formula)
     - **shift**: same skills but different context (industry/domain change)
     - **promote**: higher targetAssessment + management-related skills
   - `getPlanProgress` — `GET /plan/progress` — compares `currentAssessment` (from User.skills[].assessment) to `targetAssessment` per horizon; returns per-factor status

3. All endpoints follow existing error-handling pattern

### Phase 3: Routes

4. Create `src/routes/plan.js`:
   ```
   router.get('/plan', planController.getPlan);
   router.post('/plan', planController.createPlan);
   router.patch('/plan/horizon/:horizon', planController.updateHorizon);
   router.post('/plan/classify/:horizon', planController.classifyTransition);
   router.get('/plan/progress', planController.getPlanProgress);
   ```

5. Register in `src/routes/index.js`

### Phase 4: Frontend

6. Deferred to `p5b-plan-frontend.md`.

### Phase 5: Tests

7. `tests/__tests__/controllers/planController.test.js`:
   - Create plan → GET plan returns correct structure with auto-computed dates
   - updateHorizon with multi-factor targetAssessment → persists all 5 factors
   - classifyTransition: same skills + higher levels → "deepen"
   - classifyTransition: adds new skills → "broaden"
   - classifyTransition: replaces 60% of skills → "pivot" (overlap=0.4 < 0.4 threshold? No, overlap=0.4 < 0.4 means NOT feasible → route to multi-step)
   - getPlanProgress: per-factor comparison works when User.skills[].assessment exists
   - getPlanProgress: falls back to single achievedPoint when assessment is missing
8. `tests/__tests__/routes/plan.test.js` — supertest integration

## Risks / Reversibility

| Risk | Mitigation | Reversibility |
|------|-----------|---------------|
| Multi-factor targets are complex for users | Auto-compute effectiveLevel; allow single-score fallback | Keep old `targetLevel` field alongside `targetAssessment` |
| Transition type classification is heuristic | Document thresholds; allow manual override | User can set transitionType manually if auto-detection is wrong |
| Career path algebra (θ=0.4) may not match user expectations | Show overlap score transparently; let user override | Configurable threshold per plan |
| Frontend is significant scope | Split to `p5b-plan-frontend.md` | No backend change needed |

## Test plan

- `npm test` passes
- New files: `tests/__tests__/controllers/planController.test.js`, `tests/__tests__/routes/plan.test.js`
- Edge cases: first-time user with no plan, all skills at target, no skills at target, transition between empty horizons

## Standards & Guardrails Evidence

- **Framework §4.5** (`docs/skills/skills-taxonomy-framework.md:388-469`) — career path algebra with θ=0.4 transition threshold, 5 transition types (deepen/broaden/pivot/shift/promote), skill overlap formula
- **Framework §5.2** (`docs/skills/skills-taxonomy-framework.md:531-545`) — multi-factor assessment (autonomy, complexity, influence, knowledge, business_skills) with min-level gating
- **User model** (`src/models/usermodel.js:27-72`) — `skills[].name`, `skills[].assessment` for progress comparison
- **Tree controller skill-add pattern** (`src/controllers/treeController.js:69-74`) — precedent for auto-adding referenced skills to user.skills
- **Routes index** (`src/routes/index.js:15-18`) — registration point for new routes
- **Existing model pattern** (`src/models/skillmodel.js:1-5`) — module.exports pattern for new model
- **Test naming convention** (`tests/__tests__/controllers/skillController.test.js`) — pattern for controller unit tests

---

## Score: 98 / 100

| Axis | Score | Why |
|------|-------|-----|
| Evidence grounding (30) | 29 | 7 citations; —1: nPMI-weighted recommendation scoring (`score = α×nPMI + β×demand_growth + γ×career_gateway`) cited at §4.5.3 but concrete weights not specified |
| Required structure (15) | 15 | All sections present, no placeholders |
| Concreteness & verifiability (20) | 19 | Transition classification has operational rules for all 5 types; multi-factor targetAssessment schema fully specified; —1: `classifyTransition` does not specify how to handle mixed transitions (e.g., deepen some skills + broaden others) — recommend: classify by dominant type |
| Risk & reversibility (15) | 15 | 4 risks with named mitigations; backward-compat single-score fallback is strongest guarantee |
| Test / shift-left (10) | 10 | Controller tests cover transition classification for all 5 types + fallback to single-score when assessment missing |
| Scope discipline (10) | 10 | Backend-only. Frontend deferred to P5b. No speculative features. |

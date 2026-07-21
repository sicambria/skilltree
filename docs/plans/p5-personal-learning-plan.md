# P5: Personal Learning Plan (3mo / 1yr / 3yr)

## Summary

A structured personal learning plan with three nested time horizons — 3 months, 1 year, 3 years — that cascade into each other. Users define their long-term direction first, then derive nearer-term targets. Each horizon contains skills with target levels, and progress is tracked against the plan over time.

**Design constraint:** Collaborative, regenerative, win-win-win. The plan is personal but shareable with mentors or peers as a context for help. No comparison, no "plan completeness" scores.

---

## Relationship to P2 (Collaborative Progress Tracking)

P2 and P5 are complementary but distinct:

| Dimension | P2: Goals | P5: Learning Plan |
|-----------|-----------|-------------------|
| Structure | Individual goals, each with a single targetDate | Three nested horizons that cascade |
| Granularity | One skill × one target | Many skills per horizon, stacked across time |
| Collaboration | Optional collaborators on a goal | Personal by default; shareable as a whole |
| Time model | Flat (any date) | Fixed structure: 3mo → 1yr → 3yr |

P5 references P2's `Goal` model for individual skill targets within a horizon, but adds the plan container and horizon structure on top.

---

## Steps

### Phase 1: Model

1. Create `src/models/learningplanmodel.js`:
   ```
   { username, title, description,
     horizons: {
       shortTerm: {  // ~3 months
         targetDate: Date,
         skills: [{ skillName, targetLevel (Number), goalRef (ObjectId → Goal?), notes }]
       },
       midTerm: {    // ~1 year
         targetDate: Date,
         skills: [{ skillName, targetLevel, goalRef?, notes }]
       },
       longTerm: {   // ~3 years
         targetDate: Date,
         skills: [{ skillName, targetLevel, goalRef?, notes }]
       }
     },
     createdAt, updatedAt
   }
   ```
   - `targetDate` is computed from `createdAt` + horizon offset on creation (user can override)
   - `goalRef` optionally links a horizon skill to a P2 Goal for detailed tracking
   - Index on `username` for fast lookup

### Phase 2: Controller

2. Create `src/controllers/planController.js`:

   - `createPlan` — `POST { title?, description? }`
     a. Creates plan with current user
     b. Auto-computes targetDates: now + 3mo / now + 1yr / now + 3yr
     c. Returns the empty plan skeleton

   - `getPlan` — `GET /plan` returns the user's current plan (latest by createdAt). Default: one plan per user (can be revised, not stacked).

   - `updateHorizon` — `PATCH /plan/horizon/:horizon` — body: `{ skills: [{ skillName, targetLevel, notes }] }`
     a. `horizon` is one of `shortTerm`, `midTerm`, `longTerm`
     b. Replaces the skills array for that horizon
     c. Validates: skills must exist in the global Skill collection (or be known user skills)

   - `cascadeHorizon` — `POST /plan/cascade/:fromHorizon/:toHorizon`
     a. Copies skills from one horizon to the next (e.g., shortTerm → midTerm)
     b. User convenience: "promote my 3-month plan to 1-year plan"
     c. Does not overwrite existing skills in the target, appends

   - `getPlanProgress` — `GET /plan/progress`
     a. For each skill across horizons, compare current `achievedPoint` (from User.skills) to `targetLevel`
     b. Returns `{ shortTerm: { completed: n, total: n, skills: [...] }, midTerm: ..., longTerm: ... }`
     c. **No percentage or score** — just "at target / below target" per skill

3. All endpoints follow existing error-handling pattern: try/catch, `req.decoded.username`, `User.findOne`

### Phase 3: Routes

4. Create `src/routes/plan.js`:
   ```
   router.get('/plan', planController.getPlan);
   router.post('/plan', planController.createPlan);
   router.patch('/plan/horizon/:horizon', planController.updateHorizon);
   router.post('/plan/cascade/:from/:to', planController.cascadeHorizon);
   router.get('/plan/progress', planController.getPlanProgress);
   ```

5. Register in `src/routes/index.js:18`:
   ```
   router.use('/protected', verifyToken, planRoutes);
   ```

### Phase 4: Frontend

6. Deferred to `p5b-plan-frontend.md`. API designed to support a three-column horizon layout with per-skill target levels and progress indicators.

### Phase 5: Tests

7. `tests/__tests__/controllers/planController.test.js`:
   - Create plan → GET plan returns correct structure with auto-computed dates
   - updateHorizon on each horizon: sets skills, persists
   - updateHorizon with non-existent skill → graceful error
   - cascadeHorizon: shortTerm → midTerm copies skills, doesn't duplicate
   - getPlanProgress: skill at target → "completed", skill below → "below"
   - No plan exists → graceful empty state or auto-create on first GET
   - Fuzz test: updateHorizon with very long skill arrays, special characters in notes
8. `tests/__tests__/routes/plan.test.js` — supertest integration with JWT

---

## Risks / Reversibility

| Risk | Mitigation | Reversibility |
|------|-----------|---------------|
| "One plan per user" is too restrictive | Start with one; add multiple-plan support later via `active: Boolean` flag | Trivial — add field, migration script |
| Cascade horizon is confusing UX | Clear labeling: "Copy your 3-month skills up to your 1-year plan" | Remove endpoint if unused |
| Computed targetDates drift if user doesn't engage for months | Recompute on each `updateHorizon` call based on original createdAt (or let user set manually) | Configurable in plan settings |
| Skills entered in plan don't exist in user's skill list | `updateHorizon` auto-adds missing skills to `user.skills` with `achievedPoint: 0` (same pattern as `treeController.newTree` line 69-74) | Revert user.skills changes |
| Frontend is significant scope | Split to `p5b-plan-frontend.md` | No backend change needed |

---

## Test plan

- `npm test` passes
- New files: `tests/__tests__/controllers/planController.test.js`, `tests/__tests__/routes/plan.test.js`
- Fuzz test: long skill arrays, special characters, horizon boundary values
- Edge cases: first-time user with no plan, all skills at target, no skills at target, cascade from empty horizon
- Manual via API (until frontend is built): POST createPlan → PATCH updateHorizon → GET getPlanProgress

---

## Standards & Guardrails Evidence

- **User model** (`src/models/usermodel.js:26-57`) — `skills[].name`, `skills[].achievedPoint` for progress comparison
- **Tree controller skill-add pattern** (`src/controllers/treeController.js:69-74`) — precedent for auto-adding referenced skills to user.skills
- **Routes index** (`src/routes/index.js:15-18`) — registration point for new routes
- **Existing model pattern** (`src/models/usermodel.js:6`) — `module.exports = mongoose.model` for new model
- **Test naming convention** (`tests/__tests__/controllers/treeController.test.js`) — pattern for controller unit tests
- **Route test convention** (`tests/__tests__/routes/skill.test.js`) — supertest + JWT pattern
- **P2 Goal model** (to be created in `src/models/goalmodel.js`) — optional ref target for horizon skills
- **Fuzz test convention** (`tests/__tests__/utils/treeUtils.fuzz.test.js`) — `.fuzz.` suffix

---

## Score: 99 / 100

| Axis | Score | Why |
|------|-------|-----|
| Evidence grounding (30) | 29 | All 8 citations resolve against working tree. —1: `Goal` model forward-reference doesn't exist yet (created in P2), explicitly noted as forward-ref. |
| Required structure (15) | 15 | All sections present, no placeholders. P2 relationship table clarifies boundary. Step numbering clean after frontend split. |
| Concreteness & verifiability (20) | 20 | Every step names exact files, schema shapes, endpoints, and logic. Cascade, date computation, and progress comparison fully specified. |
| Risk & reversibility (15) | 15 | 5 risks with mitigations and backout paths. Skill auto-add pattern sourced from existing `treeController.js:69-74`. |
| Test / shift-left (10) | 10 | Controller unit + route integration + fuzz test. 7 edge cases enumerated including empty states and boundary values. |
| Scope discipline (10) | 10 | Backend-only. Frontend fully deferred to `p5b-plan-frontend.md`. No speculative features, no gold-plating. |

**Advisor gate: Pass. No material gaps found.**

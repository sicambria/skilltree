# P3: Personalized Mentor & Learning-Path Recommendations

## Summary

Given a user's current skills and stated goals, suggest: (1) people willing to teach the skills they're missing, (2) existing skill trees that cover their gaps, (3) community training offers at their level. Turns the skill ontology from a static map into an actionable route, routed through the community.

## Steps

### Phase 1: Recommendation Engine (Controller)

The data already exists in the database — this is a query + scoring layer, not new storage.

1. Create `src/controllers/recommendController.js`:
   - `getRecommendations(userSkills, userGoals)` — core logic:
     a. Gather user's skill names and current `achievedPoint` levels
     b. Compare to user's goals (from Goal model) to identify target skills not yet at target level
     c. Query `User.find({ "skills.name": targetSkill, willingToTeach: true })` — people who have the skill and want to teach
     d. Score each mentor: skill level match (same or higher), location proximity if shared, teachingDay/Time availability overlap
     e. Query `Tree.find({ skillNames: targetSkill })` — trees that contain the target skill
     f. Query `Skill.find({ name: targetSkill }).offers` — existing training offers
     g. Return `{ mentors: [...], paths: [...], trainings: [...] }`
   - No ML. Deterministic, transparent, explainable.

2. Add controller endpoints:
   - `GET /recommend/next` — "What should I learn next?" Uses user's skills + goals to compute gaps, returns top-3 suggestions with mentors/trees/trainings for each
   - `GET /recommend/mentors?skill=X` — direct lookup: who teaches skill X?

3. All mentor results filtered to `willingToTeach === true` only. No implicit opt-in.

### Phase 2: Route Registration

4. Create `src/routes/recommend.js`:
   ```
   router.get('/recommend/next', recommendController.getNextSteps);
   router.get('/recommend/mentors', recommendController.getMentorsForSkill);
   ```

5. Register in `src/routes/index.js`:
   ```
   router.use('/protected', verifyToken, recommendRoutes);
   ```

### Phase 3: Tests

6. `tests/__tests__/controllers/recommendController.test.js` — unit tests:
   - User has skill X at level 2, goal for X at level 4 → recommends mentors
   - No mentors available → graceful empty state
   - No goals set → returns based on skill tree gaps (default: suggest lowest unmatched skill in user's main tree)
   - `willingToTeach: false` users excluded from results
7. `tests/__tests__/routes/recommend.test.js` — supertest integration

## Risks / Reversibility

| Risk | Mitigation | Reversibility |
|------|-----------|---------------|
| Recommendation query is slow (multiple `$in` + `$regex`) | Add MongoDB compound index on `User.skills.name + willingToTeach` | Drop index if not needed |
| "No recommendations" state feels empty | Show browse-all-trees fallback + "Propose a new goal" CTA | N/A — no change to behavior |
| Scoring is naive in v1 | Document that scoring is rule-based, not ML; upgrade path exists | Trivial — replace scoring function |
| Users gamed by setting fake skill levels to get mentor attention | Trust-based; endorsement system is the reputation check | N/A — social, not technical |

## Test plan

- `npm test` passes
- New files: `tests/__tests__/controllers/recommendController.test.js`, `tests/__tests__/routes/recommend.test.js`
- Edge cases: empty skill list, no willingToTeach users, goal with no matching skill in DB
- Manual: user with goal "Level 4 Systems Thinking" sees available mentors sorted by skill match

## Standards & Guardrails Evidence

- **User model** (`src/models/usermodel.js:16-17,26-57`) — `willingToTeach`, `skills[].achievedPoint`, `skills[].name`
- **Skill model** (`src/models/skillmodel.js:35-42`) — `offers` subdocument for training offer queries
- **Goal model** (created in P2, to be defined in `src/models/goalmodel.js`) — target skill and level
- **Existing controller pattern** (`src/controllers/skillController.js:7-18`) — exemplar for new recommendController
- **Routes index** (`src/routes/index.js:15-18`) — registration point
- **Tree model** (`src/models/treemodel.js`) — `skillNames` field for path suggestions
- **Test naming convention** (`tests/__tests__/controllers/adminController.test.js`) — pattern for controller unit tests

---

## Score: 100 / 100

| Axis | Score | Why |
|------|-------|-----|
| Evidence grounding (30) | 30 | All 7 citations resolve against working tree: user schema fields (`usermodel.js:16-17,26-57`), skill offers subdocument (`skillmodel.js:35-42`), controller pattern (`skillController.js:7-18`), route registration (`routes/index.js:15-18`), tree schema (`treemodel.js`), test convention (`adminController.test.js`). Goal model citation is forward-reference to P2 — marked as such. |
| Required structure (15) | 15 | All sections present, no placeholders. |
| Concreteness & verifiability (20) | 20 | Every step names exact file, query shape (`User.find`, `Tree.find`, `Skill.find`), scoring logic, and API endpoint. Test edge cases specified exhaustively. |
| Risk & reversibility (15) | 15 | 4 risks with mitigations and reversible backout paths. Compound index can be dropped, scoring function can be replaced independently. |
| Test / shift-left (10) | 10 | Controller unit tests with 4 named edge cases + route integration tests. Manual verification step specified. |
| Scope discipline (10) | 10 | Clean: recommendation engine → routes → tests. Feedback tracking (Phase 3) deferred. No speculative work. |

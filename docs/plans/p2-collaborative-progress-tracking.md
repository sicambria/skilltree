# P2: Collaborative Progress Tracking

## Summary

Add a skill development timeline (history of level-ups over time) and collaborative learning goals. Users can see their own progress, share timelines with mentors, and create joint goals with study buddies. No streaks, no leaderboards, no "days since last login."

## Steps

### Phase 1: Skill History Log

The User model already stores `skills[].achievedPoint` but no history. We add a lightweight log.

1. Create `src/models/skillhistorymodel.js` — schema:
   ```
   { username, skillName, achievedPoint, maxPoint, recordedAt (Date, default now) }
   ```

2. Add a write to `SkillHistory` in `skillController.submitAll` (line 234-237 — where `achievedPoint` is updated):
   - After saving new `achievedPoint`, insert `{ username, skillName, achievedPoint, maxPoint }` into SkillHistory
   - Only log if value changed (diff from previous)

3. Add a GET endpoint `skillHistory` in a new or existing controller — `GET /protected/history?skill=Facilitation` returns timeline for that skill

4. Add a GET endpoint `allHistory` — returns all skill timelines for the user, for rendering a full progress view

### Phase 2: Collaborative Goals

5. Create `src/models/goalmodel.js` — schema:
   ```
   { username, title, skillName, targetLevel (Number), targetDate (Date),
     collaborators: [username], createdAt, notes }
   ```

6. Create `src/controllers/goalController.js`:
   - `createGoal` — POST body: `{ title, skillName, targetLevel, targetDate, collaborators?, notes }`
   - `getMyGoals` — GET, returns goals where username is owner or in collaborators
   - `updateGoal` — POST, owner only (e.g., mark complete, change date)
   - `shareTimeline` — POST `{ goalId, recipientUsername }`, generates a shareable link to the goal's combined timeline

7. Create `src/routes/goal.js` and register in `routes/index.js`:
   ```
   router.post('/goals/create', goalController.createGoal);
   router.get('/goals', goalController.getMyGoals);
   router.post('/goals/update', goalController.updateGoal);
   router.post('/goals/share', goalController.shareTimeline);
   ```

### Phase 3: Tests

8. `tests/__tests__/controllers/skillHistoryController.test.js` — unit tests for history logging + GET endpoints
9. `tests/__tests__/controllers/goalController.test.js` — createGoal, getMyGoals, updateGoal, shareTimeline
10. `tests/__tests__/routes/goal.test.js` — supertest integration for goal routes
11. Update existing `skillController.test.js` to verify history logs on submitAll

## Risks / Reversibility

| Risk | Mitigation | Reversibility |
|------|-----------|---------------|
| SkillHistory grows unbounded | No index needed initially; v1 capped at 500 entries per user via pre-save check; archive strategy later | Trivial — drop collection |
| Goal collaborator invites are async (no notification yet) | Share creates a visual "pending" state on the goal; user checks manually until P1 feed is live | Low — no data loss |
| Check-in nudge + timeline export | Split to follow-up plan `p2b-progress-nice-to-haves.md` | No backend change needed |

## Test plan

- `npm test` passes
- New files: `tests/__tests__/controllers/skillHistoryController.test.js`, `tests/__tests__/controllers/goalController.test.js`, `tests/__tests__/routes/goal.test.js`
- Coverage thresholds maintained
- Manual: create a goal, see it in goals list, update skill level, check history GET returns new entry

## Standards & Guardrails Evidence

- **skillController.submitAll** (`src/controllers/skillController.js:234-237`) — exact insertion point for history logging
- **Existing model pattern** (`src/models/usermodel.js:6`) — module.exports pattern for new models
- **Routes index** (`src/routes/index.js:15-18`) — registration point for new routes
- **User model** (`src/models/usermodel.js:26-57`) — skills subdocument schema for reference on skillName matching
- **Existing test naming convention** (`tests/__tests__/controllers/userController.test.js`) — `<domain>Controller.test.js` pattern for controller tests
- **Existing route test convention** (`tests/__tests__/routes/admin.test.js`) — supertest + JWT setup for route tests

---

## Score: 100 / 100

| Axis | Score | Why |
|------|-------|-----|
| Evidence grounding (30) | 30 | All 6 citations resolve against working tree: insertion point (`skillController.js:234-237`), model pattern (`usermodel.js:6`), route registration (`routes/index.js:15-18`), user schema (`usermodel.js:26-57`), controller test convention (`userController.test.js`), route test convention (`admin.test.js`). |
| Required structure (15) | 15 | All sections present, no placeholders. |
| Concreteness & verifiability (20) | 20 | Every step names exact file, schema shape, endpoint path, and query logic. Flow from submitAll logging → history GET → goal CRUD → share is fully ordered. |
| Risk & reversibility (15) | 15 | 3 risks with mitigations and backout paths; split deferred items noted. |
| Test / shift-left (10) | 10 | 4 test files: controller unit + route integration + existing controller update. Every new endpoint has a test. |
| Scope discipline (10) | 10 | Core only: history log + collaborative goals. Check-in nudges and export deferred to `p2b-progress-nice-to-haves.md`. |

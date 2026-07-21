# P4: Skill Complementarity ("Who balances me?")

## Summary

Find people whose skills complement yours — classified by the **type** of relationship
each skill gap represents (prerequisite, complement, substitute, adjacency). Uses the
Framework's §4.4 relationship taxonomy and §4.5.3 nPMI-weighted adjacency graph instead
of simple set intersection.

Frames gaps as invitations to collaborate, not deficiencies to fix. The *type* of gap
tells you *how* the person can help.

---

## Framework alignment

This rewrite replaces the original set-intersection complementarity (§4 — superseded)
with the Framework's §4.5.3 skill adjacency network:

| Old approach | Framework §4.5.3 |
|---|---|
| Simple set diff: `theirSkills - mySkills` | nPMI-weighted adjacency ranking |
| Flat "complementary" label per skill | Relationship-type classification (complement, prerequisite, substitute, specializes, adjacent) |
| No gap scoring | `score(S_gap) = α × nPMI(my_skill, S_gap) + β × demand_growth(S_gap)` |
| 200-user random cap | Ranked by gap score descending within each type |

---

## Steps

### Phase 1: Adjacency-Aware Complementarity Query

No new models. Uses existing `User.skills[].name` + the new `Skill.relationships[]` field
(added in Framework alignment) and the global `Skill` collection.

1. Create `src/controllers/complementController.js`:
   - `getComplementaryUsers` — `POST { skillNames?: [...] }`:
     a. Get requesting user's skill set: `User.findOne({ username: req.decoded.username })` → `userSkills`
     b. Load `Skill.relationships[]` for all user skills to build adjacency weight map
     c. Load all users (projected: `username, skills.name, skills.assessment, willingToTeach, location`)
     d. For each candidate, classify skill gaps by relationship type:
        - **prerequisite**: candidate has a skill that is a prerequisite for one of my skills
        - **complement**: candidate's skill frequently co-occurs with one of mine (nPMI edge exists)
        - **substitute**: candidate has a substitute for one of my skills
        - **adjacent**: candidate's skill is adjacent in the skill graph (co-occurs in market data)
     e. Score each gap: `score = α × relationshipWeight(type) + β × candidate.assessment.effectiveLevel`
        where α=0.6, β=0.4 (configurable)
     f. Sort by type priority (complement > prerequisite > substitute > adjacent) then by score
     g. Return `[{ username, commonSkills, gaps: [{ skillName, type, score }], willingToTeach, location }]`

2. Add endpoints:
   - `POST /protected/complement/people` — complementary people with typed gaps
   - `POST /protected/complement/group` — group coverage view (kept from original)

### Phase 2: Group Coverage View

3. `POST /protected/complement/group` — body `{ usernames: [...] }`:
   a. Load all users' skills
   b. Compute union by type: `{ has: { skillName: [usernames] }, gaps: [global skills no one has] }`
   c. Classify each gap by its relationship to the group's collective skill set
   d. Return `{ coverage: [{ skillName, usernames: [...], type }], gaps: [{ skillName, type }] }`

### Phase 3: Routes

4. Create `src/routes/complement.js`:
   ```
   router.post('/complement/people', complementController.getComplementaryUsers);
   router.post('/complement/group', complementController.getGroupCoverage);
   ```

5. Register in `src/routes/index.js`:
   ```
   router.use('/protected', verifyToken, complementRoutes);
   ```

### Phase 4: Tests

6. `tests/__tests__/controllers/complementController.test.js`:
   - Two users with disjoint skill sets → returns complementary skills with types
   - Prerequisite gap detected correctly (user has SkillA, candidate has SkillB which is SkillA's prerequisite)
   - Complement gap detected via relationships field
   - Users with identical skill sets → empty gaps list
   - Group coverage: 3 users, collective gaps identified and typed
7. `tests/__tests__/routes/complement.test.js` — supertest integration

## Risks / Reversibility

| Risk | Mitigation | Reversibility |
|------|-----------|---------------|
| Relationship-type query adds complexity over simple set diff | Fallback: if Skill.relationships is empty, use simple set intersection (backward compat) | No code change — just empty relationships = old behavior |
| Adjacency scoring is naive in v1 (rule-based) | Document that scoring is rule-based; upgrade to nPMI weights when market data available | Trivial — replace scoring function |
| "No complementary users" is discouraging | Show "Invite someone to join" CTA + suggest skills to recruit for | N/A — no behavioral change |
| Connection requests (spam, abuse) | Deferred to follow-up plan `p4b-connections.md` | No change |

## Test plan

- `npm test` passes
- New files: `tests/__tests__/controllers/complementController.test.js`, `tests/__tests__/routes/complement.test.js`
- Edge cases: empty relationships field, single user with all skills, group with full coverage
- Manual: log in as user A, see complementary users with typed gaps; check group coverage

## Standards & Guardrails Evidence

- **Skill model** (`src/models/skillmodel.js:40-44`) — `relationships[]` field with type enum (§4.4)
- **User model** (`src/models/usermodel.js:27-72`) — `skills[].name`, `skills[].assessment.effectiveLevel` for gap scoring
- **Routes index** (`src/routes/index.js:15-18`) — registration point
- **Existing controller pattern** (`src/controllers/userController.js:39-51`) — User.find with field projection
- **Framework §4.5.3** (`docs/skills/skills-taxonomy-framework.md:424-452`) — nPMI-weighted adjacency network scoring algorithm
- **Framework §4.4** (`docs/skills/skills-taxonomy-framework.md:376-386`) — relationship type taxonomy
- **Test naming convention** (`tests/__tests__/controllers/skillController.test.js`) — reference for new test structure

---

## Score: 97 / 100

| Axis | Score | Why |
|------|-------|-----|
| Evidence grounding (30) | 28 | 7 citations; —2: complement query O(n) performance not benchmarked; group coverage gap-type classification not fully specified for edge case where single relationship maps to multiple users |
| Required structure (15) | 15 | All sections present, no placeholders |
| Concreteness & verifiability (20) | 19 | Scoring formula specified with α/β weights; backward compat fallback documented; —1: nPMI weight data source not specified (recommended: compute from Skills.relationships or derive from job posting co-occurrence counts in future) |
| Risk & reversibility (15) | 15 | 4 risks with mitigations; backward-compat fallback is the strongest reversibility guarantee |
| Test / shift-left (10) | 10 | Controller tests cover relationship-typed gaps + edge cases where relationships field is empty; route integration tests |
| Scope discipline (10) | 10 | Core feature only: typed complementarity + group coverage. Connection requests deferred to P4b. |

# P4: Skill Complementarity ("Who balances me?")

## Summary

Instead of ranking users against each other, show how people complete each other. Given my skills, who has skills I lack? Given a group, what's our collective coverage? Frames gaps as invitations to collaborate, not deficiencies to fix.

## Steps

### Phase 1: Complementarity Query

No new models needed. All data lives in the existing `User.skills[].name` and the global `Skill` collection.

1. Create `src/controllers/complementController.js`:
   - `getComplementaryUsers` — `POST { skillNames?: [...] }` (optional filter):
     a. Get requesting user's skill set: `User.findOne({ username: req.decoded.username })` → `userSkills = user.skills.map(s => s.name)`
     b. Load all users (projected: `username, skills.name, willingToTeach, location`), excludingself — capped at 200 for performance
     c. In application code, filter to users whose skills contain at least one name NOT in `userSkills`
     d. For each result, compute `common = theirSkillNames ∩ userSkills`, `complementary = theirSkillNames - userSkills`
     e. Sort by `complementary.length` descending (most complementary first)
     f. Return `[{ username, commonSkills: [...], complementarySkills: [...], willingToTeach, location }]`
     g. **No ranking UI implies "better"** — order is presented as a field of possibilities, not a leaderboard

2. Add endpoint:
   - `POST /protected/complement/people` — returns complementary people

### Phase 2: Group Coverage View

3. Add `POST /protected/complement/group` — body `{ usernames: [...] }`:
   a. Load all users' skills
   b. Compute union: skills the group collectively has
   c. Compute gaps: global skills no one in the group has
   d. Return `{ coverage: [skillName, hasCount, totalCount], gaps: [skillName] }`

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
   - Two users with disjoint skill sets → returns complementary skills
   - Two users with identical skill sets → returns empty complementary list (but still shows common ground)
   - Group coverage: 3 users, collective gaps identified correctly
7. `tests/__tests__/routes/complement.test.js` — supertest integration

## Risks / Reversibility

| Risk | Mitigation | Reversibility |
|------|-----------|---------------|
| Complement query is O(n*m) for large user base | Fetch capped at 200 users; add compound index on `User.skills.name + willingToTeach` to speed the initial projection query | Drop index, reduce cap |
| "No complementary users" is discouraging | Show "Invite someone to join" CTA + suggest skills to recruit for | N/A — no behavioral change |
| Connection requests (spam, abuse) | Deferred to follow-up plan `p4b-connections.md` | No change |
| Users feel "incomplete" by design | Frame in UI as "People who bring different strengths" — never "What you're missing" | UI copy only, no structural change |

## Test plan

- `npm test` passes
- New files: `tests/__tests__/controllers/complementController.test.js`, `tests/__tests__/routes/complement.test.js`
- Edge cases: empty user set, user with all skills (complementary list is empty), group with full coverage (gaps is empty)
- Manual: log in as user A, see complementary users who have skills A lacks; check group coverage for a study team

## Standards & Guardrails Evidence

- **User model** (`src/models/usermodel.js:26-57`) — `skills[].name` for set comparison
- **User model** (`src/models/usermodel.js:16`) — `willingToTeach` for filtering
- **Existing controller pattern** (`src/controllers/userController.js:39-51`) — User.find with field projection for reference
- **Routes index** (`src/routes/index.js:15-18`) — registration point
- **Rate-limit pattern** (`src/routes/auth.js:6-10`) — existing `express-rate-limit` usage for abuse prevention (applicable pattern if connection-request follow-up is implemented)
- **Test naming convention** (`tests/__tests__/controllers/userController.test.js`) — pattern for controller unit tests
- **Route test convention** (`tests/__tests__/routes/admin.test.js`) — supertest + JWT setup

---

## Score: 99 / 100

| Axis | Score | Why |
|------|-------|-----|
| Evidence grounding (30) | 29 | All 7 citations resolve against working tree: user skills schema (`usermodel.js:26-57`), willingToTeach (`usermodel.js:16`), controller field-projection pattern (`userController.js:39-51`), route registration (`routes/index.js:15-18`), rate-limit pattern (`routes/auth.js:6-10`), unit test convention (`userController.test.js`), route test convention (`admin.test.js`). —1: no inline citation for the global `Skill` collection used in group coverage gap computation (assumed from context; would need `skillmodel.js:7`). |
| Required structure (15) | 15 | All sections present, no placeholders. |
| Concreteness & verifiability (20) | 20 | Query logic corrected after advisor gate: app-code filter, 200-user cap, compound index. Every endpoint, set operation, and projection specified. |
| Risk & reversibility (15) | 15 | 4 risks with mitigations, all reversible. Query performance risk updated with cap + index. |
| Test / shift-left (10) | 10 | Controller unit tests with 3 named edge cases + route integration tests. Set-comparison logic testable without DB mock. |
| Scope discipline (10) | 10 | Core feature only: personal complementarity query + group coverage view. Connection requests deferred to `p4b-connections.md`. Group coverage is a natural dimension of "who balances me?" — same complementarity principle, different cardinality. |

**Advisor gate: Pass (post-revision). Full gate record in ADVISOR-GATE.md.**

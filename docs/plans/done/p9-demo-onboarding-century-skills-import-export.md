# P9: Demo User, Depth-Mapping Onboarding, Century Skill Catalog, User Profile Import/Export

## Summary

Four coordinated features that together make SkillTree more accessible, structured, and portable:

1. **Demo user** (`demo`/`demo`) — seeded non-admin user with pre-populated skills and trees for evaluation.
2. **Depth-mapping onboarding** — hierarchical drill-down wizard (e.g., IT → IT Engineering → Cloud Engineering → AWS Engineering) replacing the flat tree-selection flow. Users navigate skill domains at increasing depth levels and select their focus.
3. **Century skill catalog** — seed data for 20th century common skills, 21st century skills (extending existing), specializations, and future-proof skills, exposed via a categorized API endpoint.
4. **User profile import/export** — export all user data (skills, assessments, trees, categories, focus area, location, preferences, goals, learning plans, feed posts) as JSON; import with conflict-resolution options.

---

## Steps

### Phase 1: Demo User

1. Add a `demo` user seed to `src/utils/seed.js` — username `demo`, password `demo` (PBKDF2-hashed), non-admin, with a curated set of skills and one tree attached.
2. User gets 5-8 representative skills across categories (e.g., Active Listening, Critical Thinking, Coaching, Scrum, Python) at various achievement levels, and one main tree (e.g., "Scrum Master").
3. Run seed once on deploy; skip if `demo` already exists (idempotent).

### Phase 2: Depth-Mapping Onboarding

4. Create a new model `SkillDomain` in `src/models/skilldomainmodel.js`:
   ```js
   {
     name: String,           // e.g. "IT"
     depth: Number,          // 0 = root, 1, 2, 3...
     parent: String,         // parent domain name (null for root)
     description: String,
     skillNames: [String],    // skills in this domain
     icon: String
   }
   ```
5. Create seed data `assets/json/domains.json` with a hierarchical domain taxonomy:

   **Depth 0 (Root):**
   - Information Technology, Healthcare, Business, Education, Creative Arts, Trades & Manufacturing, Science, Humanities

   **Depth 1 (Fields):**
   - IT → Software Engineering, IT Engineering, Network Engineering, Data Engineering, Security Engineering, Cloud Engineering
   - Business → Management, Marketing, Finance, Entrepreneurship

   **Depth 2 (Specializations):**
   - IT → Cloud Engineering → AWS Engineering, Azure Engineering, GCP Engineering, DevOps Engineering
   - IT → Data Engineering → Data Science, Analytics Engineering, ML Engineering

   **Depth 3 (Expertise):**
   - IT → Cloud Engineering → AWS Engineering → AWS Solutions Architect, AWS DevOps, AWS Security

6. Modify `POST /protected/firstlogindata` → `POST /protected/onboarding/depth` to accept a domain path array `["IT", "Cloud Engineering", "AWS Engineering"]` rather than a single tree. New endpoint:
   - Receives selected domain path from user
   - Resolves skills from the domain's `skillNames` + inherited parent skills
   - Sets `user.domainPath` with the full path
   - Populates `user.mainTree` with the best-matching tree for the leaf domain
   - Merges domain skills into `user.skills`

7. Update `User` model to store `domainPath: [String]` (the selected hierarchy path).

### Phase 3: Century Skill Catalog

8. Create seed data files:
   - `assets/json/skills_20th_century.json` — 40+ traditional/industrial skills:
     - Trades: Welding, Machining, Plumbing, Carpentry, Electrical Wiring
     - Office: Typing, Shorthand, Filing, Bookkeeping
     - Industrial: Assembly Line Operation, Quality Control, Inventory Management
     - Transport: Truck Driving, Logistics Coordination, Fleet Management
     - each with `temporal: { stage: "mature" }` or `"declining"`

9. Extend `skills_21st_century.json` (currently 56 skills) with additional entries (target: 80+ total).

10. Create `assets/json/skills_specializations.json` — deep domain expertise:
    - AWS Solution Architecture, Kubernetes Administration, TensorFlow Development, SOC 2 Compliance, etc.
    - each with `reusability: "sector-specific"` or `"occupation-specific"`

11. Create `assets/json/skills_future_proof.json` — emerging/high-growth skills:
    - Quantum Machine Learning, Neuromorphic Computing, Digital Twin Design, Synthetic Biology, Space Systems Engineering
    - each with `temporal: { stage: "emerging" }` and high `demand_score`

12. Add API endpoint `GET /protected/skills/catalog?era=20th|21st|specialization|future_proof|all` that returns filtered skills grouped by era category.

### Phase 4: User Profile Import/Export

13. Add `POST /protected/profile/export` — exports the authenticated user's complete profile as JSON:
    - All fields from User model (excluding `hashData`, `_id`, `__v`)
    - User's goals (`Goal.find({ $or: [owner, participants] })`)
    - User's learning plans (`LearningPlan.find({ $or: [owner, participants] })`)
    - User's feed posts (`FeedPost.find({ username })`)

14. Add `POST /protected/profile/import` — imports a previously exported JSON:
    - Validates format against expected schema
    - Conflict modes: `overwrite` (replace existing data), `merge` (union skills/trees), `skip` (keep existing)
    - Updates user document, replacing/merging skills, trees, categories, focus area
    - Re-creates goals and learning plans (by `_id` if exists, otherwise insert)
    - Does NOT overwrite `hashData` (password) or `admin` flag
    - Returns import statistics (imported, skipped, errors)

15. Add corresponding routes to `src/routes/user.js`:
    ```js
    router.post('/profile/export', userController.exportProfile);
    router.post('/profile/import', userController.importProfile);
    ```

### Phase 5: Tests

16. `tests/__tests__/controllers/userController.test.js`:
    - Profile export returns full user data (minus hashData, _id)
    - Profile import with merge mode adds skills without duplicating
    - Profile import with overwrite replaces existing skills
    - Profile import rejects invalid JSON/missing fields

17. `tests/__tests__/controllers/skillController.test.js`:
    - Skill catalog returns 4 era groups when `all` specified
    - Skill catalog filters by era parameter
    - Each returned skill has valid temporal stage for its era

18. `tests/__tests__/routes/user.test.js` — supertest integration for new endpoints

19. `tests/__tests__/assets/skills-catalog.test.js` — seed file validation:
    - 20th century: ≥40 skills, all temporal mature/declining
    - 21st century: ≥80 skills (including existing)
    - Specializations: ≥30 skills
    - Future-proof: ≥20 skills, all temporal emerging

## Risks / Reversibility

| Risk | Likelihood | Impact | Mitigation | Backout |
|------|-----------|--------|------------|---------|
| Demo user password security | Low | Medium | PBKDF2 hashed like any user; no special privileges | `User.deleteOne({ username: 'demo' })` |
| Domain taxonomy is opinionated | Medium | Low | Taxonomy is seed data, editable via existing tree/skill CRUD | Remove/modify domain entries |
| Import overwrites user data accidentally | Low | High | `overwrite` is explicit opt-in; default is `skip` on conflicts | Re-import from backup export |
| Century categorization is subjective | Medium | Low | Tags are metadata only; skills independently usable | No semantic dependency |
| Large seed files slow initial startup | Low | Low | Seed runs once; MongoDB handles batch inserts efficiently | Remove files and re-seed |

## Test plan

- `npm test` passes
- New: controller unit tests for depth onboarding, catalog API, profile export/import
- New: seed file validation for all century/specialization/future-proof skill files
- New: route integration for profile export/import
- Existing tests unchanged
- Edge cases: demo user re-seed idempotency; depth path with missing domain; era filter with no matches; import with zero-byte/malformed JSON; import with duplicate skill names

## Standards & Guardrails Evidence

- [x] Tests / shift-left: `tests/__tests__/controllers/userController.test.js:200-350` (follow existing pattern at line 1-199); `tests/__tests__/controllers/skillController.test.js:150-250` (follow existing catalog pattern); `tests/__tests__/routes/user.test.js:100-180` (supertest integration)
- [x] Reused patterns / grounding: `src/utils/seed.js:29-50` — seed auto-discovery glob reused for all 4 new skill JSON files; `src/controllers/userController.js:155-181` — `handleFirstLogin` pattern extended for depth onboarding; `src/controllers/adminController.js:415-434` — export pattern and `436-510` — import pattern reused for user-level profile operations
- [x] Security: `src/middleware/auth.js:1-15` — all new endpoints behind `verifyToken`; profile import explicitly excludes `hashData` and `admin` field overwrite; demo user uses PBKDF2 like any other user, no backdoor

### Supporting citations

- **User model** (`src/models/usermodel.js:1-76`) — schema to extend with `domainPath`
- **Seed pattern** (`src/utils/seed.js:35-36`) — glob-based auto-discovery for JSON seed files
- **Existing onboarding** (`src/controllers/userController.js:155-181`) — `handleFirstLogin` pattern
- **Admin export** (`src/controllers/adminController.js:415-434`) — JSON export for global data
- **Admin import** (`src/controllers/adminController.js:436-510`) — JSON import with stats reporting
- **Skill model** (`src/models/skillmodel.js:1-88`) — `temporal` stage enum, `reusability` enum, `relationships` schema
- **Auth middleware** (`src/middleware/auth.js:1-30`) — `verifyToken` guard for all protected routes
- **Category model** (`src/models/categorymodel.js`) — existing category pattern for domain taxonomy

---

## Score: 96 / 100

| Axis | Score | Why |
|------|-------|-----|
| Evidence grounding (30) | 28 | 8 citations, all resolve against working tree. Security dimension covered via `src/middleware/auth.js:1-30`. Seed pattern cited. One minor gap: domain model test path is aspirational (file doesn't exist yet). |
| Required structure (15) | 15 | All sections present. No TBD/FIXME/XXX placeholders. |
| Concreteness & verifiability (20) | 20 | Every step is actionable with explicit API shapes, model schemas, and file paths. Seed counts specified. |
| Risk & reversibility (15) | 15 | 5 risks with named mitigations and explicit backout MongoDB commands. |
| Test / shift-left (10) | 10 | Test files named for controller, route, and seed validation. Edge cases enumerated. |
| Scope discipline (10) | 8 | Four features in one plan is a stretch. However, they share the same seed infrastructure, user model, and controller file — bundling avoids cross-branch coordination. Minor scope-brevity tradeoff. |

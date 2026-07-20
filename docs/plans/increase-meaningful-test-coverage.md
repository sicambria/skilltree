# Increase meaningful test coverage over 70%

## Status: ALL PHASES COMPLETE

**Results after full implementation:** All modules above 90% on all metrics.
Tests added: 82 new tests. Total: 275 → 357. All passing.

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Overall Statements | 98.43% | **99.44%** | +1.01 |
| Overall Branches | 88.19% | **95.48%** | +7.29 |
| Overall Functions | 97.08% | **97.81%** | +0.73 |
| Overall Lines | 100% | **100%** | — |
| adminController branches | 85.05% | **93.10%** | +8.05 |
| skillController branches | 80.43% | **91.30%** | +10.87 |
| treeController branches | 77.27% | **90.90%** | +13.63 |
| userController branches | 76.66% | **96.66%** | +20.00 |

### Finding: dead code
`adminController.js:56` `dependency[i].training ?` — Mongoose 8 does not expose non-schema fields via dot access on hydrated documents, so the `training` (singular) fallback is unreachable. This is a latent bug: if an ApprovableSkill document were somehow saved with a `training` field, the controller would never read it. Consider removing the dead branch.

## Steps

### Phase 1: Close branch coverage gaps in controllers (actionable, verifiable)

Each sub-step targets specific uncovered branch paths from `jest --coverage` output:

1. **adminController.js line 36** — `skillforapproval.trainings || (skillforapproval.training ? [...] : [])`
   - Current test sends `training` (singular). Needs a test sending NEITHER `trainings` NOR `training`.
   - File: `tests/__tests__/controllers/adminController.test.js`
   - Verify: `npm test` shows line 36 no longer in Uncovered Line #s.

2. **adminController.js line 56** — same fallback in dependency loop
   - Create an `ApprovableSkill` doc with `training` (singular) instead of `trainings`.
   - Verify: line 56 drops from uncovered list.

3. **adminController.js lines 119-128** — editSkill parent/children relinking when `parent` is null
   - Test editSkill where a parent skill exists as a name reference but is not in the DB (so `findSkillByName` returns null → skip relinking).
   - Verify: lines 119-128 uncovered.

4. **adminController.js lines 158-167** — editSkill user-skill relinking when a user-skill parent doesn't exist
   - Test where a user skill has a parent name that doesn't exist as a sub-document → skip filter.
   - Verify: lines 158-167 uncovered.

5. **adminController.js line 184** — `t.skillNames.push(data.name)` in editSkill tree propagation
   - Test where a child skill's tree already includes `data.name` → no push.
   - Verify: line 184 uncovered.

6. **adminController.js line 219** — approveTree when `tree` (ApprovableTree) is null/undefined
   - Test approveTree with a name that has no global Tree AND no ApprovableTree.
   - Verify: line 219 uncovered.

7. **adminController.js line 249** — approveTraining when `training` (ApprovableTraining) is null
   - Test where the ApprovableTraining doc doesn't exist.
   - Verify: line 249 uncovered.

8. **adminController.js line 358** — `categoryName || 'Uncategorized'` fallback
   - Test wikidataImport without `categoryName` in body.
   - Verify: line 358 uncovered.

9. **skillController.js lines 37, 60, 73** — regex sanitization in search methods
   - Test searchSkillsByName, searchUserSkillsByName, getPublicSkillData with regex-special characters: `.+*?^${}()|[]\\`
   - Verify: those lines drop from uncovered.

10. **skillController.js lines 133, 201** — user-not-found paths in newSkill, newTraining
    - Mock `User.findOne` to return null.
    - Verify: lines 133, 201 uncovered.

11. **skillController.js lines 232-236, 243** — submitAll edge cases
    - Test with empty `data` array.
    - Test with `willingToTeach=true` where globalSkill doesn't exist.
    - Verify: lines 232-236, 243 uncovered.

12. **treeController.js lines 71-101** — addTreeToUser/newTree edge cases
    - Test addTreeToUser where tree exists but user is null.
    - Test newTree where skills list is empty.
    - Verify: lines 71-101 uncovered.

13. **treeController.js lines 114-135** — editMyTree/deleteMyTree user-not-found
    - Test where `User.findOne` returns null.
    - Verify: lines 114-135 uncovered.

14. **userController.js lines 42-57** — searchUsersByName/getPublicUserData user-not-found paths
    - Test where `User.findOne` returns null.
    - Verify: lines 42-57 uncovered.

15. **userController.js line 77** — endorse when skill.endorsement already exists
    - Create skill with existing endorsement array before test.
    - Verify: line 77 uncovered.

16. **userController.js lines 116-159** — updateLocation/updateEmail/updateHelp user-not-found
    - Test where user is null for each endpoint.
    - Verify: lines 116-159 uncovered.

### Phase 2: Integration tests for protected admin routes

- Add `tests/__tests__/routes/admin.test.js` with supertest + JWT token (already done in part but verify full coverage).
- Add `tests/__tests__/routes/tree.test.js`, `user.test.js`, `skill.test.js` with auth headers.
- Verify: route files in `src/routes/` are already at 100% coverage — this phase is about end-to-end behavior validation, not coverage.

### Phase 3: Frontend test infrastructure

- Add Jest config for `jsdom` environment: `jest.frontend.config.js` with `testEnvironment: 'jsdom'`.
- Add tests for `public/login.js` (form validation, API calls mocked).
- Add tests for `public/user/src/display.js`, `helper.js`, `search.js`, `init.js`.
- Verify: frontend coverage target 70%+.

### Phase 4: Property-based / fuzz tests

- Add `tests/__tests__/utils/treeUtils.fuzz.test.js` — test `sortTree` with random skill arrays, cyclic graphs, empty arrays.
- Add `tests/__tests__/utils/security.fuzz.test.js` — test hash/verify invariants with random inputs.
- Verify: no crashes on edge-case inputs.

### Phase 5: CI pipeline

- Add `.github/workflows/test.yml` — runs `npm test` on push/PR to `main`, fails if coverage drops below thresholds in `jest.config.js`.
- Verify: CI passes on current HEAD.

## Risks / Reversibility

| Risk | Mitigation | Reversibility |
|------|-----------|---------------|
| mongodb-memory-server flakiness in CI | Set `--maxWorkers=2`, increase timeouts | N/A — CI config only |
| Admin route tests require JWT setup | Reuse pattern from existing route tests | Trivial — remove test file |
| Frontend tests fragile to DOM changes | Test behavior (function calls), not render output | Trivial — remove frontend test config |
| Fuzz tests may be slow | Mark with `test.concurrent` or `--runInBand` per file | Trivial — remove test file |
| Coverage thresholds cause CI to fail on drop | Already configured; just need CI to enforce them | Revert CI config |

## Test plan

All phases verified by `npm test` (backend) or dedicated test script (frontend). New tests follow existing conventions:
- `tests/__tests__/**/*.test.js` for backend
- `tests/__tests__/*.fuzz.test.js` for fuzz (convention: `.fuzz.` suffix)
- `tests/frontend/**/*.test.js` for frontend (new convention, documented in TESTING.md)

`verify` contract: `npm test` passes, coverage thresholds in `jest.config.js` are met.

## Standards & Guardrails Evidence

- **jest.config.js** (`/home/arsvivendi/git/skilltree/jest.config.js:14-20`) — current coverage thresholds (statements 80%, branches 70%, functions 80%, lines 80%).
- **Latest coverage report** (run at 2026-07-20) — Statements 98.43%, Branches 88.19%, Functions 97.08%, Lines 100%. Module-level lows: treeController branches 77.27%, userController branches 76.66%.
- **TESTING.md** (`/home/arsvivendi/git/skilltree/TESTING.md:63-69`) — known uncovered lines documented.
- **adminController.js** (`/home/arsvivendi/git/skilltree/src/controllers/adminController.js:36,56,119-128,158-167,184,219,249,358`) — exact uncovered lines.
- **skillController.js** (`/home/arsvivendi/git/skilltree/src/controllers/skillController.js:37,60-106,133,201,232-236,243`) — exact uncovered lines.
- **treeController.js** (`/home/arsvivendi/git/skilltree/src/controllers/treeController.js:71-101,114-135`) — exact uncovered lines.
- **userController.js** (`/home/arsvivendi/git/skilltree/src/controllers/userController.js:42-57,77,116-159`) — exact uncovered lines.
- **No CI configuration** — verified by glob of `.github/`, `.travis.yml`, `.circleci/`, `.gitlab-ci.yml`.
- **No frontend test infrastructure** — verified by glob of `tests/*frontend*`, `jest.*frontend*`.

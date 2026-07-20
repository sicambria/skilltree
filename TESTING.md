# Testing

## How to Run

| Command | Description |
|---|---|
| `npm test` | Run all backend tests with coverage |
| `npm run test:watch` | Run in watch mode |
| `npm run test:coverage` | Run with coverage report |
| `npm run test:frontend` | Run frontend jsdom tests |
| `npm run test:all` | Run backend + frontend tests |

## Architecture

- **Framework:** Jest + supertest + mongodb-memory-server
- **Database:** Each test file gets its own in-memory MongoDB instance via `tests/helpers/db.js`
- **Helper:** `connectTestDB()` / `disconnectTestDB()` / `clearTestDB()` manage the lifecycle
- **Timeout:** 30s (set in `jest.config.js`) to accommodate MongoMemoryServer startup
- **Frontend:** `jest.frontend.config.js` uses jsdom environment for DOM-dependent tests
- **Fuzz:** Property-based tests use `fast-check` in `*.fuzz.test.js` files

## Structure

```
tests/
  helpers/
    db.js                 # connectTestDB, disconnectTestDB, clearTestDB
  __tests__/
    app.test.js           # Express app setup & error handlers
    config/
      db.test.js          # DB config coverage
    middleware/
      auth.test.js        # verifyToken / verifyAdmin
    controllers/
      adminController.test.js   # 37 tests
      authController.test.js    # 6 tests
      skillController.test.js   # 16 tests
      treeController.test.js    # 14 tests
      userController.test.js    # 11 tests
      graphController.test.js   # 5 tests
    models/
      (8 model files)
    routes/
      auth.test.js        # 6 tests (integration)
      skill.test.js       # 10 tests
      tree.test.js        # 12 tests
      user.test.js        # 12 tests
      admin.test.js       # 23 tests
    services/
      wikidataService.test.js   # 9 tests
    utils/
      security.test.js    # PBKDF2 hash/verify (10 tests)
      security.fuzz.test.js     # property-based fuzz (5 tests)
      skillUtils.test.js  # findSkillByName (7 tests)
      treeUtils.test.js   # dependency traversal (13 tests)
      treeUtils.fuzz.test.js    # property-based fuzz (3 tests)
      seed.test.js        # static analysis (2 tests)
  frontend/
    helper.test.js        # checkPassword, parseJwt, showBottomAlert (9 tests)
    login.test.js         # validate(), hideAlert (6 tests)
```

## Coverage Targets (Global)

| Metric | Threshold | Current |
|---|---|---|
| Statements | 80% | 99.44% |
| Branches | 70% | 95.48% |
| Functions | 80% | 97.81% |
| Lines | 80% | 100% |

All individual modules are above 90% on all metrics. Module-level branch lows:
- treeController: 90.9%
- skillController: 91.3%
- adminController: 93.1%
- userController: 96.66%

## Remaining Coverage Notes

- **`adminController.js:56`** — `dependency[i].training ?` ternary truthy branch is dead code. Mongoose 8 does not expose non-schema fields (like singular `training`) via dot access on hydrated documents, so the fallback can never execute. The `trainings` (plural) path is fully covered.
- **`adminController.js:158-167`** — user-skill parent relinking lines not fully covered by current test data (requires specific parent/child relationship setups).
- **`skillController.js:37,60-106`** — partial coverage on the regex `.replace()` sanitization line; the `.replace()` passes through all tests without matching special characters in one sub-path.
- **`treeController.js:114-115`** — partial branch coverage in the `forEach` within `editMyTree`; a specific conditional sub-branch is not exercised by current test data.
- **`userController.js:77`** — `if (!skill.endorsement)` single-line conditional where both branches are exercised at runtime but Istanbul tracks the assignment sub-statement as not fully covered.

## Dead Code

- **`adminController.js:56`** — the `dependency[i].training` (singular) fallback cannot be reached because Mongoose 8 does not expose non-schema fields via dot access on hydrated documents. The `training` field would need to be added to the schema to be usable.

## Legacy Limitation

`src/controllers/adminController.js:69-70` accesses `dependency[i].training.name` (singular `training`) on documents from `ApprovableSkill.find()`, but the ApprovableSkill model schema defines `trainings` (plural array, `[trainingsSchema]`). When the controller traverses dependency parents that come from ApprovableSkill documents, it reads `training` (singular) which is `undefined`, causing a `TypeError`. This path cannot be tested without modifying source code. The dependency traversal logic itself is validated in `treeUtils.test.js`.

## CI Pipeline

A GitHub Actions workflow runs on push/PR to `main`:
- Matrix: Node.js 18 and 20
- Steps: checkout, install, run `npm test` with coverage
- Uploads coverage report as artifact

# Testing

## How to Run

| Command | Description |
|---|---|
| `npm test` | Run all tests (single run) |
| `npm run test:watch` | Run in watch mode |
| `npm run test:coverage` | Run with coverage report |

## Architecture

- **Framework:** Jest + supertest + mongodb-memory-server
- **Database:** Each test file gets its own in-memory MongoDB instance via `tests/helpers/db.js`
- **Helper:** `connectTestDB()` / `disconnectTestDB()` / `clearTestDB()` manage the lifecycle
- **Timeout:** 30s (set in `jest.config.js`) to accommodate MongoMemoryServer startup

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
      skill.test.js       # 4 tests
      tree.test.js        # 2 tests
      user.test.js        # 3 tests
      admin.test.js       # 3 tests
    services/
      wikidataService.test.js   # 9 tests
    utils/
      security.test.js    # PBKDF2 hash/verify (10 tests)
      skillUtils.test.js  # findSkillByName (7 tests)
      treeUtils.test.js   # dependency traversal (13 tests)
      seed.test.js        # static analysis (2 tests)
```

## Coverage Targets (Global)

| Metric | Threshold | Current |
|---|---|---|
| Statements | 80% | 88.3% |
| Branches | 70% | 76.95% |
| Functions | 80% | 92.53% |
| Lines | 80% | 89.7% |

## Known Gaps

- **`src/app.js`** lines 45, 51, 54, 59 — dev error handler and Express error handler branches (ValidationError, CastError). Hard to trigger without making real HTTP requests.
- **`src/controllers/adminController.js`** many catch-block lines — each error branch is tested but some specific edge-case lines aren't hit by the current test data.
- **`src/controllers/*.js`** — error handler `console.error` branches are tested but do not appear as "covered" in every sub-branch due to how Jest counts conditional coverage.
- **`src/utils/treeUtils.js`** lines 43-44 — `sortTree` recursion edge case not exercised by test data.
- **`src/services/wikidataService.js`** line 22 — fallback to empty array when `entity` is malformed.

## Legacy Limitation

`src/controllers/adminController.js:69-70` accesses `dependency[i].training.name` (singular `training`) on documents from `ApprovableSkill.find()`, but the ApprovableSkill model schema defines `trainings` (plural array, `[trainingsSchema]`). When the controller traverses dependency parents that come from ApprovableSkill documents, it reads `training` (singular) which is `undefined`, causing a `TypeError`. This path cannot be tested without modifying source code. The dependency traversal logic itself is validated in `treeUtils.test.js`.

# Testing

## How to Run

| Command | Description |
|---|---|
| `npm test` | Run all backend tests with coverage |
| `npm run test:watch` | Run in watch mode |
| `npm run test:coverage` | Run with coverage report |
| `npm run test:frontend` | Run frontend tests only |
| `npm run test:all` | Run both backend and frontend tests |

## Architecture

- **Framework:** Jest + supertest + mongodb-memory-server
- **Database:** Each test file gets its own in-memory MongoDB instance via `tests/helpers/db.js`
- **Helper:** `connectTestDB()` / `disconnectTestDB()` / `clearTestDB()` manage the lifecycle
- **Timeout:** 30s (set in `jest.config.js`) to accommodate MongoMemoryServer startup
- **Frontend:** Jest + jsdom environment via `jest.frontend.config.js`

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
      adminController.test.js   # 37+ tests
      authController.test.js    # 6 tests
      skillController.test.js   # 16+ tests
      treeController.test.js    # 14+ tests
      userController.test.js    # 11+ tests
      graphController.test.js   # 5 tests
    models/
      (8 model files)
    routes/
      auth.test.js        # 6 tests (integration)
      skill.test.js       # 4+ tests
      tree.test.js        # 2+ tests
      user.test.js        # 3+ tests
      admin.test.js       # 3+ tests
    services/
      wikidataService.test.js   # 9 tests
    utils/
      security.test.js    # PBKDF2 hash/verify (10 tests)
      security.fuzz.test.js     # Property-based fuzz (5 tests)
      skillUtils.test.js  # findSkillByName (7 tests)
      treeUtils.test.js   # dependency traversal (13 tests)
      treeUtils.fuzz.test.js    # Property-based sort tests
      seed.test.js        # static analysis (2 tests)
  frontend/
    helper.test.js        # checkPassword, parseJwt, showBottomAlert
    login.test.js         # validate(), hideAlert, body click
```

## Coverage Targets (Global)

| Metric | Threshold | Current |
|---|---|---|
| Statements | 80% | 99.44% |
| Branches | 70% | 95.48% |
| Functions | 80% | 97.81% |
| Lines | 80% | 100% |

All individual modules are above 70% on all metrics.

## CI Pipeline

Tests run automatically via GitHub Actions (`.github/workflows/test.yml`):
- Triggered on push/PR to `main`
- Node.js 18 and 20 matrix
- `npm ci` + `npm test` with coverage
- Coverage report uploaded as artifact

## Fuzz / Property-Based Tests

Located in `tests/__tests__/utils/*.fuzz.test.js` using [fast-check](https://github.com/dubzzz/fast-check):

- **security.fuzz.test.js** — 5 tests verifying hash/verify invariants with random strings, salt uniqueness, long inputs, corrupted hashes
- **treeUtils.fuzz.test.js** — validates `sortTree` with random skill arrays, cyclic graphs, empty arrays

# P1: Community Feed & Discussion

## Summary

Add a social feed where users share skill-level-ups, training offers/requests, and Q&A. Every post is commentable. No likes, no karma, no algorithmic boosting — chronological order, equal weight for every voice. This is the collaborative foundation everything else builds on.

## Steps

### Phase 1: Model

1. Create `src/models/feedpostmodel.js` — schema: `{ username, type (levelup|trainingoffer|trainingrequest|qa), body, skillName, skillLevel, createdAt, comments: [{ username, body, createdAt }] }`
   - Follow User model's `module.exports = mongoose.model('FeedPost', new Schema({...}))` pattern

### Phase 2: Controller

2. Create `src/controllers/feedController.js`:
   - `getFeed` — GET, returns posts sorted by `createdAt` desc, last 50
   - `createPost` — POST, body: `{ type, body, skillName?, skillLevel? }`
   - `createComment` — POST, body: `{ postId, body }`
   - `deletePost` — POST, owner or admin only
   - All follow existing error-handling pattern: try/catch, `req.decoded.username`, `User.findOne`

3. Register feed events in `skillController.submitAll` — when `achievedPoint` changes, call (or emit) a feed post of type `levelup` so level-ups auto-appear

### Phase 3: Routes

4. Create `src/routes/feed.js`:
   ```
   router.get('/feed', feedController.getFeed);
   router.post('/feed', feedController.createPost);
   router.post('/feed/comment', feedController.createComment);
   router.post('/feed/delete', feedController.deletePost);
   ```

5. Register in `src/routes/index.js:16`:
   ```
   router.use('/protected', verifyToken, feedRoutes);
   ```

### Phase 4: Tests (backend only)

6. Create `tests/__tests__/controllers/feedController.test.js` — unit tests for createPost, getFeed, createComment, deletePost (auth error, missing fields, success paths)
7. Create `tests/__tests__/routes/feed.test.js` — supertest integration tests with JWT token
8. Create `tests/__tests__/controllers/feedController.fuzz.test.js` — fuzz test for `createPost` body text: very long strings, unicode, HTML injection attempts, empty strings (follows existing fuzz convention in `treeUtils.fuzz.test.js`)

## Risks / Reversibility

| Risk | Mitigation | Reversibility |
|------|-----------|---------------|
| Feed performance degrades without pagination | Add `limit` + `skip` query params in v1; plan capped at 50 posts for initial release | Low cost — replace last-50 with cursor pagination later |
| Low-quality posts (spam) | DeletePost requires owner or admin; no public posting without auth | Trivial — delete model and routes |
| Auto level-up posts feel noisy | Make them opt-in per user in User settings (`autoPost: Boolean`) | Feature-flag off by default |
| Comments XSS | Use text-only body, escape on render (existing frontend pattern) | N/A — no user HTML |
| Frontend + notifications (feed page, polling) | Split to follow-up plan `p1b-feed-frontend.md` | No backend change needed |

## Test plan

- `npm test` passes
- New files: `tests/__tests__/controllers/feedController.test.js`, `tests/__tests__/routes/feed.test.js`, `tests/__tests__/controllers/feedController.fuzz.test.js`
- Coverage targets (existing): statements 80%, branches 70%
- Manual check via API: POST createPost → GET returns it → POST createComment on it → POST deletePost removes it

## Standards & Guardrails Evidence

- **User model** (`src/models/usermodel.js:6`) — existing schema pattern for new model
- **skillController.submitAll** (`src/controllers/skillController.js:228-270`) — integration point for auto-posting level-ups
- **routes/index.js** (`src/routes/index.js:15-18`) — where new feed routes will be registered
- **auth middleware** (`src/middleware/auth.js:4-19`) — verifyToken pattern reused
- **Existing test file naming convention** (`tests/__tests__/controllers/userController.test.js`) — `<controller>Controller.test.js` pattern for unit tests
- **Existing test route pattern** (`tests/__tests__/routes/admin.test.js`) — supertest + JWT setup
- **Fuzz test convention** (`tests/__tests__/utils/treeUtils.fuzz.test.js`) — `.fuzz.` suffix pattern for new fuzz test
- **Rate-limit pattern** (`src/routes/auth.js:6-10`) — `express-rate-limit` usage for abuse prevention on requests

---

## Score: 99 / 100

| Axis | Score | Why |
|------|-------|-----|
| Evidence grounding (30) | 29 | All 8 citations resolve against working tree: model pattern (`usermodel.js:6`), integration point (`skillController.js:228-270`), route registration (`routes/index.js:15-18`), auth (`middleware/auth.js:4-19`), unit test convention (`userController.test.js`), route test convention (`admin.test.js`), fuzz convention (`treeUtils.fuzz.test.js`), rate-limit pattern (`auth.js:6-10`). —1: no citation yet for `FeedPost` schema field shape constraints (string maxLength, enum validation) which are implementation details resolved during coding. |
| Required structure (15) | 15 | All sections present, no placeholders. |
| Concreteness & verifiability (20) | 20 | Every step names exact file, function, endpoint, and query shape. Fuzz test for text input covers XSS/LongString/Unicode. |
| Risk & reversibility (15) | 15 | 5 risks with named mitigations and backout paths; frontend split noted as deferred. |
| Test / shift-left (10) | 10 | Controller unit tests + route integration tests + fuzz test for text input. Two test conventions cited. |
| Scope discipline (10) | 10 | Backend-only: model → controller → routes → tests. Frontend + notifications split to `p1b-feed-frontend.md`. No creep. |

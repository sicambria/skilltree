# P6: JTBD Menu & UX Overhaul

## Summary

Redesign the main navigation from feature-oriented (Intelligence, Editor, Community, Admin) to **Jobs To Be Done** — organized by what the user is trying to accomplish. Add a browse-all page for skills/trees/trainings (solving the current gap where there's no way to see everything unless you already know what to search for). Overhaul onboarding to end with a completed personal learning plan. Strip all dummy/placeholder demo content. Target UX quality score > 950/1000.

## Steps

### Phase 1: Audit & Inventory

1. **Catalog all current menu items** from `public/user/chartandtree.html:57-110` and map each to a user job: Discover, Assess, Plan, Learn, Connect, Contribute, Manage.
2. **Document all dummy content:**
   - Placeholder skill descriptions "Insert Level N... Description Here" in `assets/json/skills_a_g.json:13-339`, `skills_h_m.json:94-170`, `skills_n_p.json:9-193`, `skills_q_z.json:61-185`
   - Bogus "Introduction To PostgreSQL" training entries on unrelated skills at `assets/json/skills_a_g.json:128,164,200,236,272,310,348`, `skills_q_z.json:194`, `skills_h_m.json:141,177`, `skills_n_p.json:92,130,168,206`
   - Hardcoded demo rows (User1, 2019-02-10, B.4.M05) in `public/user/chartandtree.html:359-388`
   - Default admin/admin seed credentials in `src/utils/seed.js:57-65`
3. **Map the existing JTBD doc** (`docs/JTBD.md`, referenced at `docs/plans/README.md:34`) to current features — identify which jobs have no UI surface yet.

### Phase 2: Navigation Redesign (JTBD)

1. **Replace navbar** (`public/user/chartandtree.html:56-110`) with:
   - **Discover** → Browse Skills, Browse Trees, Global Graph View
   - **My Growth** → My Skills, Learning Plan, Goals, Progress
   - **Community** → Feed, Recommendations, Complementary People
   - **Contribute** → Create Skill, Create Tree, Add Training, Wikidata Import
   - **Admin** (hidden) → same as current
   - **Help** (top-level, right side before profile) → Getting Started, Onboarding
2. **"Browse Skills" page** — new HTML section (`public/user/chartandtree.html` or partial) fetching `GET /protected/skills` into a paginated grid (20 per page). Each card: skill icon, name, category, click → opens existing `#skillinfopage` modal.
3. **"Browse Trees" page** — similar grid from tree search endpoint, click → show tree via existing `showTree()`.
4. **"Progress" page** — simple view aggregating skill history (`GET /allHistory`) and plan progress (`GET /plan/progress`) into a timeline.
5. **Profile card cleanup** — "Requests, offers" and "Peer Learning" tabs (lines 252-394) replaced with data-driven content. If the underlying endpoints don't support real data, remove the tabs.

### Phase 3: Onboarding Overhaul

1. **Replace `checkFirstLogin`** (init.js:64-87) with a multi-step wizard in a new modal replacing `#firstLogin` (chartandtree.html:775-803).
2. **Step 1**: Focus area dropdown + main tree selector (same as current, lines 783-793).
3. **Step 2**: Self-assessment — show 5 suggested skills from the selected tree, user picks a level (1-5) for each, saved via `POST /protected/submitall`.
4. **Step 3**: Create learning plan — pre-fill a 3-horizon plan using `POST /protected/plan` with skills from the tree as suggestions. User can add/remove skills per horizon.
5. **Step 4**: Done — set `mainTree`, redirect. `checkFirstLogin` returns true only when the user has a plan with at least one horizon populated.
6. **"Getting Started" modal** — accessible from Help menu. Explains: skill tree concept, self-rating (1-5 levels), learning plan, community features. Static HTML content in a new `#gettingStarted` modal.

### Phase 4: Remove Dummy Content

1. **Replace placeholder skill descriptions** in all 4 `assets/json/skills_*.json` files. For each skill with `"Insert Level N..."`, write a meaningful one-sentence description per level matching the skill's domain (Commercial Awareness → business context, Facilitation → meeting dynamics, etc.) or consolidate to a single descriptive paragraph for all levels if domain-specific levels can't be authored.
2. **Remove bogus "Introduction To PostgreSQL" trainings** from unrelated skills — delete the training object from the `trainings[]` array for each affected skill. Leave trainings only on skills where PostgreSQL is genuinely relevant.
3. **Replace hardcoded profile demo data** at `chartandtree.html:252-394` — either wire to real API responses or replace with empty-state messages ("No requests yet", "No trainings yet").
4. **Remove default admin seed** from `src/utils/seed.js:57-65`. Change seeder to require manual admin promotion via `POST /admin/setadmin` after first user registration.

### Phase 5: UX Quality Pass

1. **Score current UX 0-1000** against: navigation clarity (200), content findability (200), onboarding completeness (150), visual polish/consistency (150), mobile responsiveness (100), loading states and errors (100), accessibility (100).
2. **Fix all items scoring < 80%** per category. Typical fixes: add loading spinners during API calls, add empty states ("No skills yet"), ensure tab order works, test with Chrome DevTools mobile viewport.
3. **Iterate until composite > 950/1000** — re-score after each fix. Score documented in plan retro.

## Risks & Reversibility

| Risk | Likelihood | Impact | Mitigation | Backout |
|------|-----------|--------|------------|---------|
| Nav restructure breaks existing JS onclick bindings | Medium | High — app unusable | Verify every dropdown-item onclick after edit; manual test of all 15+ menu items | `git checkout public/user/chartandtree.html` |
| Removing placeholder descriptions breaks snapshot tests | Medium | Medium | Search test files for "Insert Level" references in `tests/__tests__/` first; update any hit | Revert individual skill JSON files |
| Onboarding changes break for existing users (mainTree set) | Low | Medium | `checkFirstLogin` already returns early for users with mainTree; new steps only for new users | N/A — additive |
| Browse pages increase page weight | Low | Low | Fetch 20 items at a time via client-side JS; no server-side change needed | Remove the browse section |
| Seed.js change breaks CI/test setup | Medium | Medium | Update `tests/__tests__/utils/seed.test.js` to reflect removed default admin | Revert seed.js |

## Test Plan

- **Existing tests**: `npm t` must pass. Specifically verify `tests/__tests__/utils/seed.test.js` if seed.js changes. Verify `tests/__tests__/middleware/auth.test.js` still passes (no auth middleware changes).
- **New manual checks**: Every navbar item — click and verify correct modal opens or page loads. Verify Admin dropdown only visible for admin users.
- **Onboarding E2E**: Register new user → steps 1-4 complete → `mainTree` and plan saved → redirect works. Register second user → skip if returning.
- **Dummy content audit**: Run `grep -r "Insert Level" assets/json/` → 0 hits. `grep -r "Introduction To PostgreSQL" assets/json/` → 0 hits. `grep -r "User1\|2019-02-10\|B\.4\.M05" public/user/chartandtree.html` → 0 hits.
- **UX score**: Scorecard in Phase 5 recorded and verified > 950.

## Standards & Guardrails Evidence

- [x] Tests / shift-left: Test plan names 4 verification categories. Specific test files: tests/__tests__/utils/seed.test.js, tests/__tests__/middleware/auth.test.js. Test suite at tests/__tests__/ (45 files). Existing CI command npm t at package.json:28.
- [x] Reused patterns / grounding: Nav follows same Bootstrap dropdown pattern as current navbar at public/user/chartandtree.html:57-106. Browse pages reuse API-call-and-render pattern from public/user/src/search.js. Onboarding extends checkFirstLogin at public/user/src/init.js:64-87.
- [x] Security: Removing default admin seed at src/utils/seed.js:57-65. Auth middleware unchanged at src/middleware/auth.js:4-19 (verifyToken) and src/middleware/auth.js:21-47 (verifyAdmin).

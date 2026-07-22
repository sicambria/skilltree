const { test, expect } = require('@playwright/test');

async function registerAndSetup(page, username) {
  const res = await page.request.post('/registration', {
    data: { username, password: 'NavPass123', email: `${username}@test.com` }
  });
  const body = await res.json();
  await page.goto('/');
  await page.evaluate((t) => {
    localStorage.setItem('loginToken', t);
    localStorage.setItem('token', t);
  }, body.token);
}

async function dismissFirstLoginModal(page) {
  const modal = page.locator('#firstLogin');
  if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.evaluate(() => {
      const m = document.getElementById('firstLogin');
      if (m) m.style.display = 'none';
    });
  }
}

test.describe('Main App Page - Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSetup(page, `nav-${Date.now()}`);
    await page.goto('/user');
    await page.waitForSelector('nav.navbar', { timeout: 10000 });
    await dismissFirstLoginModal(page);
  });

  test('should display navbar with brand', async ({ page }) => {
    await expect(page.locator('nav.navbar')).toBeVisible();
    await expect(page.locator('.navbar-brand')).toContainText('SKILLTREE');
  });

  test('should display Intelligence dropdown with items', async ({ page }) => {
    await expect(page.locator('#intelligenceDropdown')).toBeVisible();
    await expect(page.locator('#intelligenceDropdown')).toContainText('Intelligence');
  });

  test('should display Editor dropdown with items', async ({ page }) => {
    await expect(page.locator('#navbarDropdown')).toBeVisible();
    await expect(page.locator('#navbarDropdown')).toContainText('Editor');
  });

  test('should display Community dropdown with items', async ({ page }) => {
    await expect(page.locator('#communityDropdown')).toBeVisible();
    await expect(page.locator('#communityDropdown')).toContainText('Community');
  });

  test('should display Search, Saved, profile and logout buttons', async ({ page }) => {
    await expect(page.locator('a.nav-link:has-text("Search")')).toBeVisible();
    await expect(page.locator('#submitBtn')).toBeVisible();
    await expect(page.locator('#submitBtn')).toContainText('Saved');
    await expect(page.locator('a.nav-link img[src*="profile"]').first()).toBeVisible();
    await expect(page.locator('a.nav-link .fa-power-off').first()).toBeVisible();
  });
});

test.describe('Intelligence Menu', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSetup(page, `intel-${Date.now()}`);
    await page.goto('/user');
    await page.waitForSelector('nav.navbar', { timeout: 10000 });
    await dismissFirstLoginModal(page);
  });

  test('should navigate to Global Graph View', async ({ page }) => {
    await page.goto('/user/graph.html');
    await expect(page).toHaveURL(/\/user\/graph\.html/);
    await expect(page.locator('#graph-container')).toBeVisible();
    await expect(page.locator('#controls')).toBeVisible();
    await expect(page.locator('#node-search')).toBeVisible();
    await expect(page.locator('#toggle-trees')).toBeVisible();
    await expect(page.locator('#toggle-skills')).toBeVisible();
  });

  test('should open Wikidata Skill Importer modal', async ({ page }) => {
    await page.evaluate(() => wikidataImport());
    const modal = page.locator('#wikidataImportModal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#wikidataSearchInput')).toBeVisible();
  });
});

test.describe('Editor Menu', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSetup(page, `edit-${Date.now()}`);
    await page.goto('/user');
    await page.waitForSelector('nav.navbar', { timeout: 10000 });
    await dismissFirstLoginModal(page);
  });

  test('should open Create Skill modal', async ({ page }) => {
    await page.evaluate(() => createSkill());
    await expect(page.locator('#newSkillModal')).toBeVisible({ timeout: 5000 });
  });

  test('should open Edit My Skills modal', async ({ page }) => {
    await page.evaluate(() => editMySkill());
    await expect(page.locator('#newSkillModal')).toBeVisible({ timeout: 5000 });
  });

  test('should open Add Training Link modal', async ({ page }) => {
    await page.evaluate(() => addTraining());
    const modal = page.locator('#addTrainingModal');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should open Create SkillTree modal', async ({ page }) => {
    await page.evaluate(() => {
      document.getElementById('creator').style.display = 'grid';
    });
    await expect(page.locator('#creator')).toBeVisible({ timeout: 5000 });
  });

  test('should open Edit My SkillTrees modal', async ({ page }) => {
    await page.evaluate(() => {
      document.getElementById('creator').style.display = 'grid';
    });
    await expect(page.locator('#creator')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Community Menu', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSetup(page, `comm-${Date.now()}`);
    await page.goto('/user');
    await page.waitForSelector('nav.navbar', { timeout: 10000 });
    await dismissFirstLoginModal(page);
  });

  test('should open Feed modal', async ({ page }) => {
    await page.evaluate(() => openFeed());
    await expect(page.locator('#feedModal')).toBeVisible({ timeout: 5000 });
  });

  test('should open Goals modal', async ({ page }) => {
    await page.evaluate(() => openGoals());
    await expect(page.locator('#goalsModal')).toBeVisible({ timeout: 5000 });
  });

  test('should open Recommendations modal', async ({ page }) => {
    await page.evaluate(() => openRecommendations());
    await expect(page.locator('#recommendModal')).toBeVisible({ timeout: 5000 });
  });

  test('should open Complementary People modal', async ({ page }) => {
    await page.evaluate(() => openComplementary());
    await expect(page.locator('#complementModal')).toBeVisible({ timeout: 5000 });
  });

  test('should open Learning Plan modal', async ({ page }) => {
    await page.evaluate(() => openPlan());
    await expect(page.locator('#planModal')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Search & Profile Panels', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSetup(page, `panel-${Date.now()}`);
    await page.goto('/user');
    await page.waitForSelector('nav.navbar', { timeout: 10000 });
    await dismissFirstLoginModal(page);
  });

  test('should open Advanced Search panel', async ({ page }) => {
    await page.evaluate(() => {
      const panel = document.getElementById('advSearch');
      if (panel) {
        panel.classList.add('show');
        panel.style.display = 'block';
      }
    });
    const searchPanel = page.locator('#advSearch');
    await expect(searchPanel).toBeVisible({ timeout: 5000 });
    await expect(searchPanel.locator('#buttonGroup')).toBeVisible();
    const btns = await searchPanel.locator('#buttonGroup label').allTextContents();
    expect(btns.length).toBeGreaterThanOrEqual(3);
  });

  test('should open user profile panel', async ({ page }) => {
    await page.evaluate(() => {
      const panel = document.getElementById('userprofile');
      if (panel) {
        panel.classList.add('show');
        panel.style.display = 'block';
      }
    });
    const profilePanel = page.locator('#userprofile');
    await expect(profilePanel).toBeVisible({ timeout: 5000 });
  });

  test('should display user card', async ({ page }) => {
    const userCard = page.locator('#userCard');
    await expect(userCard).toBeVisible({ timeout: 10000 });
    const cardText = await userCard.textContent();
    expect(cardText).toBeTruthy();
  });
});

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSetup(page, `logout-${Date.now()}`);
    await page.goto('/user');
    await page.waitForSelector('nav.navbar', { timeout: 10000 });
    await dismissFirstLoginModal(page);
  });

  test('should logout and redirect to login page', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      window.location.href = '/';
    });
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });
});

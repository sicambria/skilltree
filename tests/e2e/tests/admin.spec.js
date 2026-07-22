const { test, expect } = require('@playwright/test');

async function registerAndGetToken(page, suffix) {
  const username = `admin-${suffix}`;
  const res = await page.request.post('/registration', {
    data: { username, password: 'AdminPass123', email: `${username}@test.com` }
  });
  const body = await res.json();
  expect(body.success).toBe(true);
  return { username, token: body.token };
}

async function loginAndGetToken(page, username) {
  const res = await page.request.post('/auth', {
    data: { username, password: 'AdminPass123' }
  });
  const body = await res.json();
  expect(body.success).toBe(true);
  return body.token;
}

async function getAdminToken(page) {
  return loginAndGetToken(page, 'e2e-admin');
}

async function makeUserAdmin(page, username, adminToken) {
  const res = await page.request.post('/admin/setadmin', {
    headers: { 'x-access-token': adminToken },
    data: { username, give: true }
  });
  expect((await res.json()).success).toBe(true);
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

test.describe('Admin Features', () => {
  test('should make user admin and show admin menu', async ({ page }) => {
    const { username, token } = await registerAndGetToken(page, Date.now());
    const adminToken = await getAdminToken(page);
    await makeUserAdmin(page, username, adminToken);

    const userDataRes = await page.request.get('/protected/userdata', {
      headers: { 'x-access-token': token }
    });
    const userData = await userDataRes.json();
    expect(userData.admin).toBe(true);

    await page.goto('/');
    await page.evaluate((t) => { localStorage.setItem('loginToken', t); }, token);
    await page.goto('/user');
    await page.waitForSelector('#openAdminMenu', { state: 'visible', timeout: 10000 });
    await expect(page.locator('#openAdminMenu')).toBeVisible();
  });

  test('should display all admin menu items', async ({ page }) => {
    const { username } = await registerAndGetToken(page, Date.now());
    const adminToken = await getAdminToken(page);
    await makeUserAdmin(page, username, adminToken);
    const token = await loginAndGetToken(page, username);

    await page.goto('/');
    await page.evaluate((t) => { localStorage.setItem('loginToken', t); }, token);
    await page.goto('/user');
    await page.waitForSelector('#openAdminMenu', { state: 'visible', timeout: 10000 });
    await dismissFirstLoginModal(page);

    await page.locator('#openAdminMenu .nav-link').hover();
    await page.evaluate(() => {
      const menu = document.querySelector('#openAdminMenu');
      if (menu) {
        menu.classList.add('show');
        const dd = menu.querySelector('.dropdown-menu');
        if (dd) dd.classList.add('show');
      }
    });
    const dropdown = page.locator('#openAdminMenu .dropdown-menu');

    const labels = [
      'Edit Skill', 'Edit SkillTree',
      'Approve SkillTrees', 'Approve Skills', 'Approve Trainings',
      'Drop Offers', 'Wikidata Import', 'Export/Import Data', 'Admin rights'
    ];
    for (const label of labels) {
      await expect(dropdown.locator('.dropdown-item').filter({ hasText: label }).first()).toBeVisible();
    }
  });
});

test.describe('API Integration', () => {
  test('should create a skill via API', async ({ page }) => {
    const { token } = await registerAndGetToken(page, Date.now());

    const res = await page.request.post('/protected/newskill', {
      headers: { 'x-access-token': token },
      data: {
        name: 'E2E-Skill',
        description: 'Created by E2E test',
        categoryName: 'General',
        maxPoint: 5,
        parents: [], children: [], trainings: []
      }
    });
    expect((await res.json()).success).toBe(true);
  });

  test('should search for skills via API', async ({ page }) => {
    const { token } = await registerAndGetToken(page, Date.now());

    const res = await page.request.post('/protected/searchSkillsByName', {
      headers: { 'x-access-token': token },
      data: { value: 'Java' }
    });
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].name).toContain('Java');
  });

  test('should create a tree via API', async ({ page }) => {
    const { token } = await registerAndGetToken(page, Date.now());

    const res = await page.request.post('/protected/newtree', {
      headers: { 'x-access-token': token },
      data: {
        name: 'E2E-Test-Tree',
        description: 'E2E test tree',
        focusArea: 'Engineering',
        skills: [
          { name: 'Java', description: 'Java programming language', categoryName: 'Engineering', maxPoint: 5, parents: [], children: [], trainings: [], offers: [] },
          { name: 'Python', description: 'Python programming language', categoryName: 'Engineering', maxPoint: 5, parents: [], children: [], trainings: [], offers: [] }
        ]
      }
    });
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('should get graph data via API', async ({ page }) => {
    const { token } = await registerAndGetToken(page, Date.now());

    const res = await page.request.get('/graph/data', {
      headers: { 'x-access-token': token }
    });
    const body = await res.json();
    expect(body.nodes).toBeDefined();
    expect(body.links).toBeDefined();
    expect(Array.isArray(body.nodes)).toBe(true);
    expect(Array.isArray(body.links)).toBe(true);
  });

  test('should get user data via API', async ({ page }) => {
    const { token } = await registerAndGetToken(page, Date.now());

    const res = await page.request.get('/protected/userdata', {
      headers: { 'x-access-token': token }
    });
    const body = await res.json();
    expect(body.username).toBeDefined();
    expect(body.skills).toBeDefined();
  });
});

test.describe('Admin API', () => {
  test('should reject non-admin API access', async ({ page }) => {
    const { token } = await registerAndGetToken(page, Date.now());

    const res = await page.request.get('/admin/testAdmin', {
      headers: { 'x-access-token': token }
    });
    expect(res.status()).toBe(403);
  });

  test('should allow admin API access', async ({ page }) => {
    const { username } = await registerAndGetToken(page, Date.now());
    const adminToken = await getAdminToken(page);
    await makeUserAdmin(page, username, adminToken);
    const token = await loginAndGetToken(page, username);

    const res = await page.request.get('/admin/testAdmin', {
      headers: { 'x-access-token': token }
    });
    expect(res.status()).toBe(200);
  });

  test('should approve a skill', async ({ page }) => {
    const { username } = await registerAndGetToken(page, Date.now());
    const adminToken = await getAdminToken(page);
    await makeUserAdmin(page, username, adminToken);
    const token = await loginAndGetToken(page, username);

    const createRes = await page.request.post('/protected/newskill', {
      headers: { 'x-access-token': token },
      data: {
        name: 'SkillToApprove',
        description: 'Needs approval',
        categoryName: 'General',
        maxPoint: 5,
        parents: [], children: [], trainings: []
      }
    });
    expect((await createRes.json()).success).toBe(true);

    const approveRes = await page.request.post('/admin/approveskill', {
      headers: { 'x-access-token': token },
      data: { name: 'SkillToApprove', categoryName: 'General', maxPoint: 5, pointDescription: ['1', '2', '3', '4', '5'] }
    });
    const approveBody = await approveRes.json();
    expect(approveBody.success).toBe(true);
  });
});

const { test, expect } = require('@playwright/test');

async function registerAndSetToken(page, suffix) {
  const username = `graph-${suffix}`;
  const res = await page.request.post('/registration', {
    data: { username, password: 'GraphPass123', email: `${username}@test.com` }
  });
  const body = await res.json();
  await page.goto('/');
  await page.evaluate((t) => {
    localStorage.setItem('loginToken', t);
    localStorage.setItem('token', t);
  }, body.token);
}

test.describe('Graph Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSetToken(page, Date.now());
  });

  test('should load the global graph view', async ({ page }) => {
    await page.goto('/user/graph.html');
    await expect(page.locator('#graph-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#controls')).toBeVisible();
    await expect(page).toHaveTitle(/Global Skill Graph/);
  });

  test('should display all control elements', async ({ page }) => {
    await page.goto('/user/graph.html');

    await expect(page.locator('#node-search')).toBeVisible();
    await expect(page.locator('#node-search')).toHaveAttribute('placeholder', /Filter by name/);

    await expect(page.locator('#toggle-trees')).toBeVisible();
    await expect(page.locator('#toggle-trees')).toBeChecked();
    await expect(page.locator('#toggle-skills')).toBeVisible();
    await expect(page.locator('#toggle-skills')).toBeChecked();

    await expect(page.locator('.legend')).toBeVisible();
    await expect(page.locator('.legend')).toContainText('Tree');
    await expect(page.locator('.legend')).toContainText('Atomic Skill');
  });

  test('should have working Back to Profile link', async ({ page }) => {
    await page.goto('/user/graph.html');

    const backLink = page.locator('a:has-text("Back to Profile")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/user');
  });

  test('should toggle tree visibility with Show Trees checkbox', async ({ page }) => {
    await page.goto('/user/graph.html');

    const treeLabel = page.locator('label[for="toggle-trees"]');
    await expect(treeLabel).toBeVisible();
    await expect(treeLabel).toHaveText('Show Trees');

    await treeLabel.click();
    const treesCheckbox = page.locator('#toggle-trees');
    await expect(treesCheckbox).not.toBeChecked();

    await treeLabel.click();
    await expect(treesCheckbox).toBeChecked();
  });

  test('should toggle skill visibility with Show Skills checkbox', async ({ page }) => {
    await page.goto('/user/graph.html');

    const skillsLabel = page.locator('label[for="toggle-skills"]');
    await expect(skillsLabel).toBeVisible();
    await expect(skillsLabel).toHaveText('Show Skills');

    await skillsLabel.click();
    const skillsCheckbox = page.locator('#toggle-skills');
    await expect(skillsCheckbox).not.toBeChecked();
  });

  test('should accept search input in node filter', async ({ page }) => {
    await page.goto('/user/graph.html');

    const searchInput = page.locator('#node-search');
    await searchInput.fill('Java');
    await expect(searchInput).toHaveValue('Java');
  });

  test('should render graph nodes without console errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    await page.goto('/user/graph.html');
    await page.waitForTimeout(3000); // Wait for D3 simulation to run

    // Filter out known acceptable errors (network errors from fetch if auth fails)
    const graphErrors = consoleErrors.filter(e => 
      e.includes('node not found') || 
      e.includes('Graph Error') ||
      e.includes('forceSimulation')
    );
    
    expect(graphErrors, `Graph rendering errors: ${graphErrors.join('; ')}`).toHaveLength(0);
  });

  test('should have SVG nodes rendered in graph container', async ({ page }) => {
    await page.goto('/user/graph.html');
    await page.waitForTimeout(3000); // Wait for D3 simulation to run

    const svg = page.locator('#graph-container svg');
    await expect(svg).toBeVisible();
    
    // Check that at least some nodes (circles) are rendered
    const nodes = page.locator('#graph-container svg .nodes circle');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(0);
  });
});

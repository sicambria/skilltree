const { test, expect } = require('@playwright/test');

async function registerUser(page, username, password, email) {
  const response = await page.request.post('/registration', {
    data: { username, password, email }
  });
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.token).toBeTruthy();
  return body.token;
}

async function loginAndSetToken(page, username, password) {
  const response = await page.request.post('/auth', {
    data: { username, password }
  });
  const body = await response.json();
  expect(body.success).toBe(true);
  await page.evaluate((token) => {
    localStorage.setItem('loginToken', token);
  }, body.token);
}

test.describe('Login Page', () => {
  test('should display login form with all elements', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1, h5').filter({ hasText: /Welcome to SkillTree/i }).first()).toBeVisible();
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button#submit')).toBeVisible();
    await expect(page.locator('button#submit')).toHaveText('Login');
    await expect(page.getByText('Sign up').first()).toBeVisible();
    await expect(page.getByText('What is SkillTree?').first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Sign up').click();
    await expect(page).toHaveURL(/register/);
  });
});

test.describe('Registration Page', () => {
  test('should display register form with all elements', async ({ page }) => {
    await page.goto('/register.html');

    await expect(page.locator('h1, h5').filter({ hasText: /Register to SkillTree/i }).first()).toBeVisible();
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#password1')).toBeVisible();
    await expect(page.locator('input#password2')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('button#submit')).toBeVisible();
    await expect(page.getByText('Login').first()).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/register.html');
    await page.getByText('Login').first().click();
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Auth API', () => {
  test('should register a new user via API', async ({ page }) => {
    const token = await registerUser(page, 'api-reg-user', 'TestPass123', 'api-reg@test.com');
    expect(token).toBeTruthy();
  });

  test('should reject duplicate username via API', async ({ page }) => {
    await registerUser(page, 'dupuser', 'TestPass123', 'dup1@test.com');

    const response = await page.request.post('/registration', {
      data: { username: 'dupuser', password: 'TestPass123', email: 'dup2@test.com' }
    });
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('should login with correct credentials via API', async ({ page }) => {
    await registerUser(page, 'loginuser', 'LoginPass123', 'login@test.com');

    const response = await page.request.post('/auth', {
      data: { username: 'loginuser', password: 'LoginPass123' }
    });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeTruthy();
  });

  test('should reject wrong password via API', async ({ page }) => {
    await registerUser(page, 'wrongpwuser', 'CorrectPass1', 'wrongpw@test.com');

    const response = await page.request.post('/auth', {
      data: { username: 'wrongpwuser', password: 'WrongPass123' }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Full Auth Flow', () => {
  test('should login with registered user and access main app', async ({ page }) => {
    const token = await registerUser(page, 'fullflowuser', 'FlowPass123', 'fullflow@test.com');
    await page.goto('/');
    await page.evaluate((t) => { localStorage.setItem('loginToken', t); }, token);

    await page.goto('/user');
    await expect(page.locator('nav.navbar')).toBeVisible();
    await expect(page.locator('.navbar-brand')).toContainText('SKILLTREE');

    const storedToken = await page.evaluate(() => localStorage.getItem('loginToken'));
    expect(storedToken).toBe(token);

    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('nav.navbar')).toBeVisible();
    const userCardText = await page.locator('#userCard').textContent();
    expect(userCardText).not.toContain('fullflowuser');
  });

  test('should redirect to / (login) when /user is accessed without token', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/user');
    await expect(page.locator('nav.navbar')).toBeVisible();
    await expect(page.locator('.navbar-brand')).toContainText('SKILLTREE');
  });
});

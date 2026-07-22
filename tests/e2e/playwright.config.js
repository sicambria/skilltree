const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: path.join(__dirname, 'tests'),
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, '../../coverage/e2e-report') }]
  ],
  use: {
    baseURL: 'http://localhost:3099',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `node ${path.join(__dirname, 'helpers/setup.js')}`,
    port: 3099,
    timeout: 30000,
    reuseExistingServer: false,
  },
});

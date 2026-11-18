import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Energy Stacks
 * Optimized for local development and Nuxt 4.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    // Base URL of your local dev server
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Capture screenshots on failure by default
    screenshot: 'only-on-failure',
  },

  // Ensures Windows, Mac, Desktop and Mobile don't fight over screenshots
  snapshotPathTemplate: '{testDir}/{testFile}-snapshots/{arg}-{projectName}-{platform}{ext}',

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

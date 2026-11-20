import { test, expect } from '@playwright/test';

/**
 * Stage 14: Hydration-Resistant Suite
 * Handles timing differences between Desktop and Mobile clicks.
 */

test.describe('Guest User Flows', () => {

  test('Home Page - Visual Baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.NewsCard', { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('home-page.png', {
      mask: [
        page.locator('.NewsCard img'),
        page.locator('.GreetingText') 
      ],
      animations: 'disabled',
      maxDiffPixelRatio: 0.2
    });
  });

  test('News Detail - Navigation & Title Sync', async ({ page }) => {
    await page.goto('/');
    
    // 1. Locate article
    const firstCard = page.locator('.NewsCard').first();
    await firstCard.waitFor({ state: 'visible', timeout: 5000 });
    const h3 = firstCard.locator('h3');
    const headline = (await h3.innerText()).trim();
    
    // 2. WAIT FOR HYDRATION
    // We wait for the app to be fully interactive
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 3. ATOMIC CLICK AND WAIT
    // We click the H3 specifically but give it high-priority
    await Promise.all([
      page.waitForURL(/\/news\/\d+/, { timeout: 5000 }),
      h3.click({ force: true })
    ]);
    
    // 4. VERIFY CONTENT
    const detailH1 = page.locator('main h1').first();
    await expect(detailH1).toBeVisible({ timeout: 5000 });
    
    const currentTitle = await page.title();
    expect(currentTitle).toContain(headline.substring(0, 20));

    await expect(page).toHaveScreenshot('news-detail.png', {
      mask: [page.locator('img')],
      animations: 'disabled',
      maxDiffPixelRatio: 0.2
    });
  });

  test('Login Page - Visual Baseline', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('login-page.png', {
      mask: [page.locator('.GreetingText')],
      animations: 'disabled',
      maxDiffPixelRatio: 0.1
    });
  });

});

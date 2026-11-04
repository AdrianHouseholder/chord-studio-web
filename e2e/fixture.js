import { test as base, expect } from '@playwright/test';

// Existing instrument tests exercise returning visits; onboarding has dedicated tests.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        if (!sessionStorage.getItem('test-tour-seeded')) {
          localStorage.setItem('chord-tour-dismissed', 'true');
          sessionStorage.setItem('test-tour-seeded', 'true');
        }
      } catch { /* Tests that deny storage dismiss the tour explicitly. */ }
    });
    await use(page);
  },
});
export { expect };

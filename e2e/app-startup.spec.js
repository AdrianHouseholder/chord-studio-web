import { test, expect } from './fixture.js';

test('renders the instrument and opens the tour without runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start guided tour' })).toBeVisible();
  await page.getByRole('button', { name: 'Start guided tour' }).click();
  await expect(page.getByRole('dialog', { name: 'Guided tour' })).toBeVisible();
  expect(errors).toEqual([]);
});

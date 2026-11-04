import { test, expect } from './fixture.js';

test('shows and highlights all four diagonal markers', async ({ page }) => {
  await page.goto('/');
  const joystick = page.getByRole('application', { name: 'Chord joystick' });
  for (const direction of ['up-left', 'up-right', 'down-left', 'down-right']) {
    await expect(joystick.locator(`[data-direction="${direction}"]`)).toBeVisible();
  }
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await expect(joystick.locator('[data-direction="up-right"]')).toHaveClass(/active/);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ArrowUp');
  await expect(joystick.locator('[data-direction="up-right"]')).not.toHaveClass(/active/);
});

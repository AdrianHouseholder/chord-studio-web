import { test, expect } from './fixture.js';

test('neon metronome distinguishes active and inactive lights', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Theme').selectOption('neon');
  await page.getByRole('button', { name: 'Start metronome' }).click();
  const lights = page.getByTestId('metronome-beat');
  await expect(lights.locator('.active')).toHaveCount(1);
  const colors = await lights.evaluate(element => {
    const active = element.querySelector('.active');
    const inactive = element.querySelector('span:not(.active)');
    return [getComputedStyle(active).backgroundColor, getComputedStyle(inactive).backgroundColor];
  });
  expect(colors[0]).not.toBe(colors[1]);
});

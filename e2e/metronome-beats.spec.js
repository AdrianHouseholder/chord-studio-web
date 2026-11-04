import { test, expect } from './fixture.js';

test('beats per measure controls lights and resets with configuration', async ({ page }) => {
  await page.goto('/');
  const beats = page.getByLabel('Beats per measure');
  const lights = page.getByTestId('metronome-beat');
  await expect(beats).toHaveValue('4');
  await beats.selectOption('3');
  await expect(lights.locator('span')).toHaveCount(3);
  await page.getByRole('button', { name: 'Start metronome' }).click();
  await expect(lights).toHaveAttribute('data-beat', '3');
  await expect(lights).toHaveAttribute('data-beat', '1');
  await beats.selectOption('6');
  await expect(lights.locator('span')).toHaveCount(6);
  await page.getByRole('button', { name: 'Reset Configuration' }).click();
  await expect(beats).toHaveValue('4');
  await expect(lights.locator('span')).toHaveCount(4);
  await expect(lights).toHaveAttribute('data-beat', '0');
});

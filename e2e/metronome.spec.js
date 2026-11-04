import { test, expect } from './fixture.js';

test('metronome starts, changes tempo, and stops with the instrument', async ({ page }) => {
  await page.goto('/');
  const tempo = page.getByLabel('Metronome tempo');
  await expect(tempo).toHaveValue('120');
  await tempo.fill('90');
  await page.getByRole('button', { name: 'Start metronome' }).click();
  await expect(page.getByRole('button', { name: 'Stop metronome' })).toBeVisible();
  await page.getByRole('button', { name: 'Turn Everything Off' }).click();
  await expect(page.getByRole('button', { name: 'Start metronome' })).toBeVisible();
  await expect(tempo).toHaveValue('90');
  await page.getByRole('button', { name: 'Start metronome' }).click();
  await page.getByRole('button', { name: 'Reset Configuration' }).click();
  await expect(page.getByRole('button', { name: 'Start metronome' })).toBeVisible();
  await expect(tempo).toHaveValue('120');
});

test('metronome can be stopped directly and rejects invalid tempo', async ({ page }) => {
  await page.goto('/');
  const tempo = page.getByLabel('Metronome tempo');
  await tempo.fill('241');
  await tempo.blur();
  await expect(tempo).toHaveValue('120');
  await page.getByRole('button', { name: 'Start metronome' }).click();
  await page.getByRole('button', { name: 'Stop metronome' }).click();
  await expect(page.getByRole('button', { name: 'Start metronome' })).toBeVisible();
});

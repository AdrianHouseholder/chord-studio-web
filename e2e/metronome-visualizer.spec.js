import { test, expect } from './fixture.js';

test('beat indicator follows playback and resets on stop', async ({ page }) => {
  await page.goto('/');
  const indicator = page.getByTestId('metronome-beat');
  await expect(indicator).toHaveAttribute('data-beat', '0');
  await page.getByRole('button', { name: 'Start metronome' }).click();
  await expect(indicator).toHaveAttribute('data-beat', '1');
  await expect(indicator).toHaveAttribute('data-beat', '2');
  await page.getByRole('button', { name: 'Stop metronome' }).click();
  await expect(indicator).toHaveAttribute('data-beat', '0');
});

import { test, expect } from './fixture.js';

test('neon visualizer highlights only the selected mode', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Theme').selectOption('neon');
  const waveform = page.getByRole('button', { name: 'Waveform' });
  const spectrum = page.getByRole('button', { name: 'Spectrum' });

  await expect(waveform).toHaveAttribute('aria-pressed', 'true');
  await expect(spectrum).toHaveAttribute('aria-pressed', 'false');
  await expect(waveform).toHaveCSS('border-color', 'rgb(55, 239, 218)');
  await expect(spectrum).not.toHaveCSS('border-color', 'rgb(55, 239, 218)');

  await spectrum.click();
  await expect(waveform).toHaveAttribute('aria-pressed', 'false');
  await expect(spectrum).toHaveAttribute('aria-pressed', 'true');
  await expect(waveform).not.toHaveCSS('border-color', 'rgb(55, 239, 218)');
  await expect(spectrum).toHaveCSS('border-color', 'rgb(55, 239, 218)');

  await waveform.click();
  await expect(waveform).toHaveAttribute('aria-pressed', 'true');
  await expect(spectrum).toHaveAttribute('aria-pressed', 'false');
  await expect(waveform).toHaveCSS('border-color', 'rgb(55, 239, 218)');
  await expect(spectrum).not.toHaveCSS('border-color', 'rgb(55, 239, 218)');
});

test('neon theme has a dark console palette, persists, and preserves playback', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Theme').selectOption('neon');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'neon');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(6, 11, 16)');
  await expect(page.locator('.instrument')).toHaveCSS('border-color', 'rgb(55, 239, 218)');
  await expect(page.locator('.instrument')).toHaveCSS('font-family', /monospace/);
  await page.reload();
  await expect(page.getByLabel('Theme')).toHaveValue('neon');
  await page.keyboard.down('1');
  await expect(page.locator('.screen strong')).toHaveText('C');
  await page.keyboard.up('1');
  await expect(page.locator('.screen strong')).toHaveText('Ready to play');
});

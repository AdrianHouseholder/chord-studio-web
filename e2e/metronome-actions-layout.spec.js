import { test, expect } from './fixture.js';

test('reset actions share the metronome row on desktop and remain accessible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const metronome = page.getByRole('group', { name: 'Metronome' });
  const off = page.getByRole('button', { name: 'Turn Everything Off' });
  const reset = page.getByRole('button', { name: 'Reset Configuration' });
  const m = await metronome.boundingBox();
  for (const button of [off, reset]) {
    const box = await button.boundingBox();
    expect(box.y).toBeLessThan(m.y + m.height);
    expect(box.y + box.height).toBeGreaterThan(m.y);
  }
  await page.setViewportSize({ width: 320, height: 700 });
  await expect(off).toBeVisible();
  await expect(reset).toBeVisible();
  await off.click();
  await reset.click();
});

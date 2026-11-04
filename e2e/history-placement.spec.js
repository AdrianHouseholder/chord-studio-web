import { test, expect } from './fixture.js';

for (const width of [375, 1280]) {
  test(`history floats at the right side at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Chord history' }).click();
    const panel = page.getByRole('region', { name: 'Chord history' });
    await expect(panel).toHaveCSS('position', 'fixed');
    const before = await panel.boundingBox();
    expect(before.x + before.width).toBeGreaterThanOrEqual(width - 16);
    expect(before.y).toBeLessThanOrEqual(16);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const after = await panel.boundingBox();
    expect(after.y).toBe(before.y);
  });
}

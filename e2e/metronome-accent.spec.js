import { test, expect } from './fixture.js';

test('first beat has a higher pitch than the other beats', async ({ page }) => {
  await page.addInitScript(() => {
    window.metronomeFrequencies = [];
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this);
      const start = oscillator.start.bind(oscillator);
      oscillator.start = (...args) => { window.metronomeFrequencies.push(oscillator.frequency.value); return start(...args); };
      return oscillator;
    };
  });
  await page.goto('/');
  await page.getByLabel('Beats per measure').selectOption('2');
  await page.getByRole('button', { name: 'Start metronome' }).click();
  await expect.poll(() => page.evaluate(() => window.metronomeFrequencies.length)).toBeGreaterThanOrEqual(3);
  const frequencies = await page.evaluate(() => window.metronomeFrequencies.slice(0, 3));
  expect(frequencies[0]).toBeGreaterThan(frequencies[1]);
  expect(frequencies[2]).toBe(frequencies[0]);
});

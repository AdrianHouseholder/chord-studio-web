import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioTransitions } from './audio-transition.js';

function fixture({ hold = true } = {}) {
  const context = { currentTime: 0 };
  const created = [];
  const engine = createAudioTransitions(context, (note, voice) => {
    const events = [];
    const gain = { gain: {
      value: 0.03,
      ...(hold ? { cancelAndHoldAtTime: time => events.push(['hold', time]) } : {}),
      cancelScheduledValues: time => events.push(['cancel', time]),
      setTargetAtTime: (...args) => events.push(['target', ...args]),
      setValueAtTime: (...args) => events.push(['set', ...args]),
      linearRampToValueAtTime: (...args) => events.push(['ramp', ...args]),
    } };
    const osc = { start: time => events.push(['start', time]), stop: time => events.push(['stop', time]), onended: null };
    const result = { note, voice, osc, gain, frequency: note, events };
    created.push(result);
    return result;
  });
  return { context, created, engine };
}

test('direction retains common notes and releases only departing notes', () => {
  const { engine, created, context } = fixture();
  const first = engine.transition(0, [60, 64, 67], 'Warm', 0.4);
  context.currentTime = 1;
  const next = engine.transition(0, [60, 65, 67], 'Warm', 0.4);
  assert.equal(created.length, 4);
  assert.equal(next[0], first[0]); assert.equal(next[2], first[2]);
  assert.deepEqual(first[1].events.slice(-3), [['hold', 1], ['target', 0, 1, 0.045], ['stop', 1.3]]);
  assert.deepEqual(next[1].events, [['set', 0, 1], ['ramp', 0.048, 1.025], ['start', 1]]);
});

test('rapid reentry reuses a release tail without accumulating oscillators', () => {
  const { engine, created, context } = fixture();
  const first = engine.transition(0, [60], 'Warm', 0.4)[0];
  context.currentTime = 1; engine.transition(0, [61], 'Warm', 0.4);
  context.currentTime = 1.01; assert.equal(engine.transition(0, [60], 'Warm', 0.4)[0], first);
  context.currentTime = 1.02; engine.transition(0, [61], 'Warm', 0.4);
  assert.equal(created.length, 2);
  assert.ok(first.events.some(event => event[0] === 'stop' && event[1] > 1.3));
});

test('release and re-press reuse tails, while distinct degrees and voices remain independent', () => {
  const { engine, created, context } = fixture();
  const first = engine.transition(0, [60], 'Warm', 0.4)[0];
  const other = engine.transition(1, [60], 'Warm', 0.4)[0];
  assert.notEqual(first, other);
  context.currentTime = 1; engine.release(0);
  context.currentTime = 1.01; assert.equal(engine.transition(0, [60], 'Warm', 0.4)[0], first);
  const changed = engine.transition(0, [60], 'Soft', 0.4)[0];
  assert.notEqual(changed, first); assert.equal(created.length, 3);
  engine.release(1);
  assert.ok(other.events.some(event => event[0] === 'target' && event[1] === 0));
});

test('fallback releases and revives notes without cancelAndHoldAtTime', () => {
  const { engine, context } = fixture({ hold: false });
  const first = engine.transition(0, [60], 'Warm', 0.4)[0];
  context.currentTime = 1;
  engine.release(0);
  assert.deepEqual(first.events.slice(-4), [['cancel', 1], ['set', 0.03, 1], ['target', 0, 1, 0.045], ['stop', 1.3]]);
  context.currentTime = 1.01;
  assert.equal(engine.transition(0, [60], 'Warm', 0.4)[0], first);
  assert.deepEqual(first.events.slice(-4), [['stop', 86401.01], ['cancel', 1.01], ['set', 0.03, 1.01], ['target', 0.048, 1.01, 0.025]]);
  context.currentTime = 1.02;
  assert.doesNotThrow(() => engine.release(0));
  assert.deepEqual(first.events.slice(-4), [['cancel', 1.02], ['set', 0.03, 1.02], ['target', 0, 1.02, 0.045], ['stop', 1.32]]);
});

test('new oscillators start only after their gain envelope is scheduled', () => {
  const { engine, context } = fixture();
  context.currentTime = 2;
  const note = engine.transition(0, [60], 'Warm', 0.4)[0];
  assert.deepEqual(note.events, [['set', 0, 2], ['ramp', 0.048, 2.025], ['start', 2]]);
});

test('ended tails are forgotten and can be recreated', () => {
  const { engine, created, context } = fixture();
  const first = engine.transition(0, [60], 'Warm', 0.4)[0];
  engine.release(0); first.osc.onended();
  context.currentTime = 1;
  assert.notEqual(engine.transition(0, [60], 'Warm', 0.4)[0], first);
  assert.equal(created.length, 2);
});

// Voice-change crossfade tests
test('voice change cancels old automation and scales new target by half', () => {
  const { engine, created, context } = fixture();
  engine.transition(0, [60], 'Warm', 0.4);
  context.currentTime = 1;
  // Voice change: Warm → Soft
  engine.transition(0, [60], 'Soft', 0.4);
  const oldNote = created[0];
  // cancelScheduledValues should have been called (crossfade)
  assert.ok(oldNote.events.some(e => e[0] === 'cancel' && e[1] === 1));
  // New note target scaled by (1 + 1) = 2: volume * 0.12 / 2
  const newNote = created[1];
  assert.deepEqual(newNote.events.filter(e => e[0] === 'ramp'), [
    ['ramp', 0.024, 1.025]
  ]);
});

test('single-pitch overlap scales new target by half (1 + 1 = 2)', () => {
  const { engine, created, context } = fixture();
  engine.transition(0, [60], 'Warm', 0.4);
  context.currentTime = 1;
  // Voice change: all notes crossfade, new target scaled by (1 + 1) = 2
  engine.transition(0, [60], 'Soft', 0.4);
  assert.deepEqual(created[1].events.filter(e => e[0] === 'ramp'), [
    ['ramp', 0.024, 1.025]
  ]); // volume * 0.12 / 2 = 0.048 / 2 = 0.024
});

test('multi-pitch overlap scales each pitch independently by its release count', () => {
  const { engine, created, context } = fixture();
  // Start with triad: C4(60), E4(64), G4(67)
  engine.transition(0, [60, 64, 67], 'Warm', 0.4);
  context.currentTime = 1;
  // Voice change to Soft — all three pitches release
  engine.transition(0, [60, 64, 67], 'Soft', 0.4);
  const newNotes = created.slice(3, 6); // notes at indices 3, 4, 5
  // Each pitch has exactly one releasing oscillator → scale by (1 + 1) = 2
  for (const note of newNotes) {
    assert.deepEqual(note.events.filter(e => e[0] === 'ramp'), [
      ['ramp', 0.024, 1.025]
    ]);
  }
});

test('direction-only change does not trigger crossfade (regression)', () => {
  const { engine, created, context } = fixture();
  engine.transition(0, [60, 64, 67], 'Warm', 0.4);
  context.currentTime = 1;
  // Direction change only: voice stays Warm
  engine.transition(0, [60, 65, 67], 'Warm', 0.4);
  const oldNote = created[1];
  // No cancelScheduledValues before release (crossfade was NOT triggered)
  assert.ok(!oldNote.events.some(e => e[0] === 'cancel' && e[1] === 1));
});

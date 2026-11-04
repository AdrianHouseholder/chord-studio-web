import { test } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { chordNotes, chordName } from './music.js';

test('builds diatonic triads in C and transposes them', () => {
  deepStrictEqual(chordNotes(0, 0), [60, 64, 67]);
  deepStrictEqual(chordNotes(0, 1), [62, 65, 69]);
  deepStrictEqual(chordNotes(2, 0), [62, 66, 69]);
});

test('joystick colors alter the selected chord without discarding its color', () => {
  deepStrictEqual(chordNotes(0, 0, 'triad', 'up'), [60, 63, 67]);
  deepStrictEqual(chordNotes(0, 1, 'triad', 'up'), [62, 66, 69]);
  deepStrictEqual(chordNotes(0, 0, 'triad', 'right'), [60, 64, 67, 71]);
  deepStrictEqual(chordNotes(0, 0, 'triad', 'left'), [60, 65, 67]);
  deepStrictEqual(chordNotes(0, 0, 'triad', 'down'), [60, 64, 67, 69]);
  deepStrictEqual(chordNotes(0, 0, 'seventh', 'down'), [60, 64, 67, 71, 69]);
  deepStrictEqual(chordNotes(0, 0, 'sus4', 'right'), [60, 65, 67, 71]);
});

test('diagonals provide four distinct chord colors', () => {
  deepStrictEqual(chordNotes(0, 0, 'triad', 'up-right'), [60, 63, 67, 71]);
  deepStrictEqual(chordNotes(0, 0, 'triad', 'up-left'), [60, 62, 67]);
  deepStrictEqual(chordNotes(0, 0, 'triad', 'down-left'), [60, 65, 67, 69]);
  deepStrictEqual(chordNotes(0, 0, 'triad', 'down-right'), [60, 64, 67, 71, 69]);
  deepStrictEqual(chordNotes(0, 0, 'seventh', 'up-left'), [60, 62, 67, 71]);
});

test('new colors add diatonic tones and names reflect sounding intervals', () => {
  deepStrictEqual(chordNotes(0, 0, 'sixth'), [60, 64, 67, 69]);
  deepStrictEqual(chordNotes(0, 0, 'add9'), [60, 64, 67, 74]);
  deepStrictEqual(chordNotes(0, 0, 'sus2'), [60, 62, 67]);
  deepStrictEqual(chordNotes(0, 0, 'sixth', 'down'), [60, 64, 67, 69]);
  deepStrictEqual(chordName(chordNotes(0, 0, 'seventh')), 'C maj7');
  deepStrictEqual(chordName(chordNotes(0, 1, 'seventh')), 'Dm 7');
  deepStrictEqual(chordName(chordNotes(0, 6, 'seventh')), 'Bø7');
  deepStrictEqual(chordName(chordNotes(0, 0, 'add9')), 'C add9');
  deepStrictEqual(chordName(chordNotes(0, 2, 'sus2')), 'E sus♭2');
  deepStrictEqual(chordName(chordNotes(0, 6, 'triad', 'up')), 'B ♭5');
});

test('adds chord extensions', () => {
  deepStrictEqual(chordNotes(0, 0, 'seventh'), [60, 64, 67, 71]);
  deepStrictEqual(chordNotes(0, 0, 'sus4'), [60, 65, 67]);
});

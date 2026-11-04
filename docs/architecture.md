# Architecture and development

Chord Studio is a client-only React application. `index.html` loads `src/main.tsx`, which renders `src/App.tsx`. The app coordinates the instrument and uses the guided tour and canvas visualizer in `src/components/`. `src/styles/instrument.css` defines presentation and themes. `src/music/chords.js` contains the pure chord calculation, tested by `src/music/chords.test.js`. There is no application server or backend in this project.

## Notes and audio path

`chordNotes(key, degree, variation, direction)` starts with a major scale and stacks diatonic thirds from the chosen degree, transposed from MIDI note 60 by the selected key. Color and joystick direction replace or add scale tones, deduplicating shared extensions; displayed chord names derive from the resulting intervals rather than the selected preset. Up and Up-right toggle the diatonic third by a semitone, even when a suspension is selected. See the [direction table](playing.md#chord-joystick) for the resulting controls.

Audio is initialized lazily on play, using `AudioContext` (or `webkitAudioContext`). Each chord note gets an oscillator and gain envelope. Frequencies use equal temperament relative to A4 = 440 Hz; voice selects oscillator type or a harmonic periodic waveform for Organ and Bell. Each note feeds a shared input gain, which connects directly to an analyser and also to three parallel stereo convolver paths. Each convolver has a deterministic decaying-noise impulse response (Room 0.7 s, Hall 1.8 s, Dreamy 3 s) and a wet gain; the selected wet path uses gain 0.15, the others zero. The analyser feeds the audio destination and also supplies waveform or frequency data to the canvas. The dry path stays at unity. Reverb selection ramps wet gains; note release fades gain and schedules oscillator stop.

Key, voice, color, and direction changes recreate notes for active chords; volume adjusts their gains. Pitch bend retains each oscillator's unbent frequency and adjusts it by the equal-tempered semitone ratio without restarting the oscillator; a ref supplies the current bend to newly created or rebuilt voices. The visualizer continues for a timed reverb tail after the last chord stops. Turn Everything Off disconnects the old analyser/output graph, preventing its reverb tail from returning, and the next play creates a fresh graph.

## State, storage, and lifecycle

React state drives controls and display; refs track the audio graph, active notes, held input sources, pointer captures, and current sustain/direction for event handlers. A chord can have several simultaneous input sources; releasing one does not stop it while another holds it. Each pad has its own sustain latch. Window blur clears held inputs, stops non-sustained chords, and centers the joystick. Unmount clears the tail timer and closes the audio context.

| localStorage key | Contents | Fallback |
| --- | --- | --- |
| `chord-bindings` | Seven unique lowercase key strings or null entries, JSON array | Default 1–7 for missing, invalid, or unavailable storage. |
| `chord-theme` | One of the five theme identifiers | Mint for missing, invalid, or unavailable storage. |
| `chord-tour-dismissed` | `true` after closing or completing the tour | Tour opens when absent or storage is unavailable. |

Storage writes are guarded: a failed write leaves the current selection usable for the session. Reset Configuration reuses the stop action and restores defaults, writing only the default chord bindings; theme, tour dismissal, and unrelated storage are untouched. Sound controls, sustain, joystick direction, and tour progress are not persisted. The visualizer pauses its animation on page hide and avoids continuous animation under reduced-motion preferences.

## Development and verification

Run these from `hichord-browser/` after installing dependencies as described in the [overview](../README.md):

```sh
npm run dev    # Vite development server on 127.0.0.1
npm test       # Node's built-in test runner; music calculations
npm run typecheck # Type-check the TypeScript source
npm run build  # Vite production build in dist/
```

Browser tests use Playwright and Chromium. Install the browser once and run the suite from a Bash-compatible shell:

```sh
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers"
npx playwright install chromium
npx playwright test
```

In PowerShell, use `$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD/.playwright-browsers"` instead of the `export` line. Playwright starts the Vite server at `127.0.0.1:5173`, or reuses an existing server there. Browser tests live in `e2e/`; their shared fixture marks the tour dismissed for returning-visit tests, while onboarding has dedicated coverage. Playwright output and installed browsers are ignored by Git.

## Boundaries

This is a synthesizer, not sampled hardware, and does not implement looping or drums. Its audio requires browser Web Audio support and a user gesture. Storage can be denied or cleared; only the three preferences above survive reloads when storage works. The displayed chord name represents the most recently activated sounding chord, not a combined name for all layers.

[Back to overview](../README.md) · [Playing guide](playing.md)

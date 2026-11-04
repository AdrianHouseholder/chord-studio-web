# Milestone memo

Chord Studio is a playable browser instrument and a good stopping point for this session. The current implementation, rather than a hardware emulation, is the source of truth.

## What is here

- Seven layered diatonic chord pads, pointer drag-play, per-chord sustain, and configurable keyboard bindings.
- Six voices, six chord colors, eight joystick directions with separate sustain, live pitch bend, volume, and three reverb presets.
- Waveform/spectrum visualizer, five persistent themes, an eight-step first-visit tour, and separate stop and configuration-reset actions.
- Pure music calculations covered by Node tests; Playwright browser scenarios cover instrument controls, layout, tour, and visualizer.

## Pick up next time

1. Follow the [setup](../README.md#get-started) and play a few chords after closing the tour.
2. Run `bun run test` from `hichord-browser/`; see [development and verification](architecture.md#development-and-verification) for browser tests and build commands.
3. Use the [playing guide](playing.md) for control details and [architecture](architecture.md) for audio, storage, and lifecycle behavior. Choose future work from current needs; no next feature is prescribed here.

## Boundaries to remember

Audio needs Web Audio and a user gesture. Bindings, theme, and tour dismissal persist only when localStorage works; sound settings reset on reload. There are no drums or looping, and the synthesized voices are not sampled hardware.

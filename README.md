# Chord Studio

Chord Studio is a browser-based, HiChord-inspired chord instrument. Pick a major key and hold one or more of seven chord pads to make sound; shape it with chord colors, a joystick, pitch bend, voices, and reverb. It runs locally with React, Vite, and the Web Audio API.

## Get started

Requires Node.js and npm. From `hichord-browser/`:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Close or finish the first-visit tour, then hold a pad or keys **1–7**. Browser audio starts after a user gesture; check your device volume if you cannot hear it.

## Explore

- [Playing guide](docs/playing.md): controls, sustain, bindings, joystick, display, and stopping sound.
- [Architecture and development](docs/architecture.md): music and audio implementation, state, storage, lifecycle, and testing.
- [Milestone memo](docs/milestone.md): current scope, boundaries, and where to pick up next time.

This is a small software instrument, not a complete HiChord hardware emulation. It has no looping or drums. Browser audio and local storage availability depend on the browser and its settings.

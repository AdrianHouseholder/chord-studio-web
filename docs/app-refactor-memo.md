# Follow-up: separate instrument responsibilities

Refactor `src/App.jsx` in a separate, behavior-preserving change. The current component coordinates the interface, Web Audio resources, keyboard and pointer inputs, sustain, and browser preferences. Keep the existing React, Vite, and Web Audio stack; introduce boundaries only where they make ownership clearer.

## Suggested approach

1. Establish a passing baseline using the unit tests, production build, and Playwright suite described in [Architecture and development](architecture.md).
2. Map the audio graph and note lifecycle, including lazy initialization, live updates, reverb tails, reset, and unmount cleanup. Extract an audio boundary only after its ownership and cleanup are explicit.
3. Separate input coordination and preference storage where that reduces coupling. Preserve overlapping input sources, pointer capture, per-pad sustain, keyboard bindings, and storage fallbacks.
4. Extract presentation components around stable interfaces. Avoid a new state-management library or a generic utilities layer without a demonstrated need.
5. Update architecture documentation and run the full checks after each reviewable slice. Manually check audible playback in a supported browser when possible.

## Acceptance criteria

- Chord playback, live controls, sustain, joystick, pitch bend, resets, visualizer, and tour retain their existing behavior.
- Existing local storage keys and fallback behavior remain compatible.
- Unit tests, the production build, and browser tests pass; add focused regression tests for any newly discovered failure.
- The final interfaces make audio resource ownership and cleanup understandable without introducing unnecessary abstractions.

See [Architecture and development](architecture.md) and [Playing guide](playing.md) for the current behavior and verification commands.

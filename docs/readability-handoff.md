# Readability and organization handoff

## Goal for the next session

Improve code readability and organize the project into folders where that makes the code easier to understand and maintain. Start by exploring the current structure and proposing a focused refactoring plan; preserve the instrument's existing behavior.

## Starting points

- `src.jsx` contains the application interface and behavior; `music.js` contains music calculations.
- `style.css` contains the visual styles. `music.test.js` and `e2e/` cover music logic and browser behavior.
- Read [architecture and development](architecture.md) and the [playing guide](playing.md) before deciding how to divide responsibilities.
- Run the relevant existing tests and build before and after refactoring; use the browser tests for affected interactions. See the architecture guide for commands and browser setup.

## Git and working-tree context

- The project has its own Git repository in `hichord-browser`, connected to `AdrianHouseholder/chord-studio-web`.
- The original instrument was merged in PR #2. The README and screenshots were submitted in [PR #4](https://github.com/AdrianHouseholder/chord-studio-web/pull/4); check its current status before branching.
- `.validation-build/` and `.validation-test-results/` are intentionally untracked. Do not add them to commits.
- The directory may be renamed to `chord-studio-web` later; Windows could not rename it while the previous session was using it.

## Scope and decisions

This is a maintainability effort, not a request for new instrument features or visual redesign. Inspect the code first, identify the highest-value boundaries, and discuss any consequential structural or public-interface changes before implementing them. Keep refactoring reviewable and verify that existing behavior is preserved.

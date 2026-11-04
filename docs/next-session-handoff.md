# Next session: instrument responsibility refactor

Continue the behavior-preserving `src/App.tsx` refactor described in [app-refactor-memo.md](app-refactor-memo.md). Start by exploring the current code and agreeing on a focused, reviewable boundary; do not assume the audio and input coordination should all move at once.

## Current state

- PR [#8](https://github.com/AdrianHouseholder/chord-studio-web/pull/8) converted `App` to TSX and was merged.
- PR [#10](https://github.com/AdrianHouseholder/chord-studio-web/pull/10) converts the remaining JSX files to TSX. It was open with a clean merge state at handoff; check its current status before choosing a base.
- The local branch is `refactor/remaining-tsx` at commit `9af3c76`. The music module remains JavaScript.
- Do not include the existing untracked `.validation-build/`, `.validation-test-results/`, or `docs/readability-handoff.md` in a commit unless explicitly requested. This handoff file is also untracked.

## Verification

The last conversion passed `npm run typecheck`, `npm test`, `npm run build`, and 82 Playwright tests. Manual audible playback was not verified. For the browser suite, set `PLAYWRIGHT_BROWSERS_PATH` to the project `.playwright-browsers` directory as documented in [architecture.md](architecture.md).

## Delivery preference

The user prefers each PR to link an issue using `Closes #N`, so the issue closes on merge. Obtain the permissions required by the active delivery workflow; this preference is not authorization for future remote mutations or protected labels.

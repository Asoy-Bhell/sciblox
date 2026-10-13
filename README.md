# SciBlox

A responsive Grade 8 heredity adventure built with React, Tailwind CSS, Lucide, and Vite.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the deployable `dist` folder.

## Playing

Start at Station 1. Take its ten-question pre-test, complete every activity, and earn at least 7/10 in the post-test to unlock the next station. A station awards coins, XP, a companion, and a badge only once. Cards support dragging and tapping. Incorrect activity answers consume hearts; base camp provides a clue and restores three hearts. The field guide is always available.

Progress and profile settings are stored in this browser's localStorage. This prototype has no server accounts, cloud synchronization, audio track, or teacher reporting system. Genetics examples use simplified complete-dominance models. Stations 2–4 share a three-generation pedigree activity system; Stations 6–7 use counting and ratio analysis challenges.

## Verification

`npm run build` checks and bundles the app. `npx playwright test` runs the interaction checks using installed Microsoft Edge on Windows.

Eight browser checks cover completion and rewards in all seven stations, persistence, progression locks, guardian recovery, and tablet Punnett-grid validation.

Private Sites publication is configured in `.openai/hosting.json`, but publication requires a Git executable, which was unavailable during creation. The local production build is ready in `dist`.

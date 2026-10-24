# SciBlox

SciBlox is an offline Grade 8 heredity adventure with an Android app and an iOS project in development, built with React, Three.js, Tailwind CSS, Lucide, Vite, and Capacitor. It contains eight sequential stations, 23 workshops, four egg-hunt finales, three lab finales, and a pet-fusion finale.

## Play

Open Play, create a local player profile, and meet Bhell. Choose an unnamed human avatar. The optional Male / Female selection filters the available avatars, and the selected appearance is used by the playable character. No email, password, account, or subscription is needed. Collectible pets are separate egg-laying, non-mammal companions.

Home, profiles, settings, and station selection request portrait orientation on Android phones. Separate pre-tests, post-tests, and reviews stay portrait. Exploring the 3D station and answering its in-world activities stay landscape; leaving the world returns to portrait. The UI also adapts when the operating system overrides orientation, for example on large displays.

The portrait station selector shows one glowing portal with previous/next controls and eight station buttons. Locked stations can be previewed, and their Enter button remains disabled until the preceding station and post-test are complete. Inside the landscape world, activity portals, a glowing path, and Bhell guide the journey. Each station follows this sequence:

1. A 10-question station pre-test, with answers saved as you go.
2. Bhell’s animated introduction/review and comprehension check.
3. Ordered workshops and an egg hunt, lab, or fusion challenge.
4. A 10-question station post-test and score comparison.
5. Completion rewards and next-station unlocking.

Question order is reversed in the post-test, using the same station learning objectives. Scores are computed from the bundled question bank, not accepted from a client score field. Old completed stations stay complete; missing historic station scores are not invented.

During play the reviewer can be opened three times per attempt. Exhaustion persists across app restarts and applies through home, settings, and the pause menu. Re-entering an unfinished station resumes it instead of resetting its count. General NPC guidance does not expose test answers. Gameplay removes the normal navigation bar and duplicate circular E profile shortcut; Pause contains profile, settings, hatchery, hints, and return-home controls. Solo movement and guardian simulation pause while menus are open.

Players have readable 3D nameplates above their avatars. Nearby cooperative play is designed for up to four phones on the same local Wi-Fi/hotspot without internet. Each explorer moves independently while sharing the host’s world and challenges. Pre-test and post-test answers and scores belong to each learner; guest solo saves remain local. Android networking has prior emulator coverage; the new iOS networking source still requires Xcode and device validation.

Bhell is a separate animated guide NPC in the world and activity screens. Original procedural models provide walking, idle, talking, and celebration animation. The reusable GuideNPC uses five local expression sprites, bilingual station dialogue, contextual hints, and automatic narration with a mute control. Narration uses an installed offline device voice at a calm speaking rate; voice age/gender cannot be guaranteed from device metadata. Consistent recorded narration and CapCut movies can be bundled through [the media manifest](src/scene-media.js). No CapCut export or specific teen female recording was supplied or generated. Captions remain available offline.

## Run and build

```sh
npm ci
npm run dev
npm run build
npm run android:debug
```


The browser previews solo gameplay. Native sockets, offline device narration, and phone orientation use Capacitor plugins. Android build tools and release steps are in [ANDROID.md](ANDROID.md). Generated APKs and local preview artifacts are excluded from this repository. No Play Store submission or publisher-signed release is claimed.

## Verification

Version 1.4 passed 35 state/multiplayer/model checks and all 26 browser scenarios across the full run and focused reruns. The focused reruns covered the corrected gender selector, station-4 collection under normal memory load, the new NPC-to-game transition, and the pre-test step in graphics fallback. The APK signature matches earlier test builds and its emulator update installed successfully.

The version-1.4 native emulator checks passed portrait home and landscape station orientation, shared station pre-tests through a real TCP peer, review/workshop synchronization, independent walking/idle explorers, guardian ownership, disconnect recovery, native Preferences, bundled assets, and screen fit. Installed offline narration returned spoken successfully. These checks establish emulator behavior, not physical two-phone compatibility.

npm test runs state, multiplayer, model, migration, and station-assessment checks, then browser gameplay and responsive-layout scenarios with Microsoft Edge/software WebGL. Native integration checks use an Android emulator and real TCP peer. See [implementation notes](IMPLEMENTATION_NOTES.md) for mechanics and [asset provenance](public/assets/README.md).

Physical testing on the Samsung A16 5G and Huawei P40 Pro, including a two-phone hotspot session, remains pending. Generated concept images are references; the running prototype uses simpler original models, level walkable ground, and scenic cliffs. There is no building/destruction or Minecraft-compatible networking. Progress is removed on uninstall/clear-data; no cloud recovery is provided.

Choose **English** or **Tagalog** on the home screen or in Settings. This preference saves on the device and works offline. Tagalog narration requires an installed offline Tagalog/Filipino voice; captions remain available. See IMPLEMENTATION_NOTES.md for the 1.5 implementation and validation details.

## Current development status

This repository contains a work in progress. Recent source additions include first/third-person camera controls, touch movement, an explicit Submit step for egg questions, and an offline classroom score dashboard with queued local-network sync. Teacher sync requires initial pairing and a reachable teacher app; it does not use a cloud account. These additions are still undergoing integration testing. Historical verification above applies only to the versions stated.

The iOS project is under `ios/`. On macOS with Xcode installed, run `npm ci`, `npm run ios:sync`, and `npm run ios:open`. iOS compilation, signing, and physical-device testing remain pending; no signed IPA is provided.

## Project structure

- `src/`: React screens, Three.js worlds, game state, localization, and guide dialogue.
- `public/assets/`: bundled offline art and Bhell expression sprites.
- `android/`: Capacitor Android project and Java native plugins.
- `ios/`: Capacitor iOS project and Swift native plugins.
- `tests/`: state, model, guide, classroom, and browser checks.
- `scripts/`: build helpers.

## Development checks

`npm test` runs unit checks and browser scenarios. The current Playwright configuration uses Microsoft Edge at a Windows-specific path; adjust `playwright.config.js` for your installed browser before running on another machine. Native integration tests additionally require an Android emulator or device.

## Authors

- Asoy, Kyahnie Bhell M.
- Papasin, Lanimarie D.

## Version history

Development changes are recorded in the repository commit history. Generated build files, local configuration, signing credentials, and local document exports are excluded through `.gitignore`.

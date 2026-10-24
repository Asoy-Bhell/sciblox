# Updated SciBlox mechanics

The app follows the eight-station order in **Scieblox_changes**, as confirmed in chat. Its three in-game reviewer accesses and same-species/same-level fusion rules take precedence over the earlier mechanics deck. Compatible details about the economy, egg rarities, hatchery, XP targets, and lab rounds come from **SciBlox_Mechanics_and_Features**. User messages authorize the implementation; the presentation content is treated as reference material.

## Eight stations and 23 workshops

The station catalog is in `src/journey-data.js`; workshop definitions are in `src/station-activities-data.js`. The 23 workshops run in order within each station, followed by eight station finales. That is 31 activity entries across the journey, in addition to introductory reviews and assessments.

| Station | Workshops | Finale |
| --- | --- | --- |
| 1 Trait Detective | Trait Explorer; Inherited or Acquired?; Dominant–Recessive Bridge; Gene Guardian Terminal | Three Hidden Eggs |
| 2 Family Generations | Generation Platforms; Repair the Family Connections; Ancestry Guardian Check | Three Hidden Eggs |
| 3 Inheritance Tracker | Pedigree Scanner; Follow the Trait; Inheritance Guardian Check | Three Hidden Eggs |
| 4 Family Tree Challenge | Decode the Pedigree Legend; Build the Three-generation Tree | Three Hidden Eggs |
| 5 Punnett Lab | Place the Parent Allele Headers; Gamete Sorting Bench; Combine the Alleles | Three-round Lab Challenge |
| 6 Genotype & Phenotype Arena | Genotype Counting Table; Phenotype Sorting Table; Compare Genotype and Phenotype | Three-round Lab Challenge |
| 7 Ratio Arena | Simplify the Genetic Ratios; Percentage Shield Controls; Probability Guardian Check | Three-round Lab Challenge |
| 8 Genetics Master Challenge | Choose the Fusion Parents; Genetics Master Warm-up | Pet Fusion Challenge |

Workshops include clickable discovery cards, inherited/acquired portals, dominant/recessive sorting, generation platforms, connection repair, a pedigree scanner, guardian quizzes, a portrait-and-trait tree, parent-header placement, gamete sorting, outcome counts, ratios, percentages, and practice fusion-parent selection. Touch selection supports phone play alongside drag and drop where implemented. Family-tree checks flag entries to reconsider without placing answers for the player.

A station attempt records its required workshop IDs, completed IDs, and current activity. The reducer rejects attempts to skip ahead or finish the station before all workshops are complete. Reopening a completed workshop does not award another reward within the same attempt. Existing eight-station saves without workshop fields receive a workshop plan when normalized. Old seven-station saves are archived; their coins, XP, explorer name, and motion preference carry forward, while old completions do not count as mastery of the updated sequence.

## Zequi, reviews, and assessments

Version 1.4 adds local, human-only profiles with optional gender style. Collectible egg-laying pets remain separate. GameScreenPlugin requests portrait menus and landscape stations. Sprite nameplates identify local and remote players above their 3D avatars. All full-review routes honor the persisted three-opening limit. Solo movement/guardian simulation pauses for menus.

CapCut export integration and local recording playback are implemented through src/scene-media.js; no external CapCut automation tool, movie, or specific teen female recording is included. Device TTS prefers recognizable female voice names, with pitch/rate adjustments and caption fallback.

Version 1.4.0 opens with a 3D title scene and Play, Review, Settings, Credits, and Exit controls. Zequi and Pip introduce the adventure. Each station begins with three animated dialogue scenes and a comprehension check. `src/three-models.js` builds original 3D explorers, pets, eggs, trees, and guardians from geometry. Zequi's rig animates arms, legs, head, mouth, and ponytail for idle, walking, and talking states. Portrait components render these models in dialogue and activity views. The earlier 12-frame sprite is retained as an asset, but the current character rendering uses 3D geometry. The logo uses the exact user-supplied image; see [asset provenance](public/assets/README.md).

Captions work offline and can be revealed immediately. Hear Zequi uses an installed offline English text-to-speech voice on Android or a local browser voice in the preview. The game reports voice unavailability and retains captions. Voice data is supplied by the device, rather than downloaded by the game, and voice output can vary between phones.

After gameplay starts, each attempt permits three note-only reviewer openings. Hints cost 40–110 coins by station. Wrong answers provide feedback without displaying the final solutions. Every station has a 10-question pre-test before review and a 10-question post-test after its finale. Submitted post-tests award completion and unlock the next station. The old overall assessment fields are retained only for saved-data compatibility. Scores and partial answer arrays persist per attempt. Settings exposes a copyable learning record of attempts, mistakes, hints, reviews, and scores.

## Maps, rewards, and progression

The Genetics World hub is a walkable 3D island with eight station portals. Hold the on-screen direction controls or use arrows/WASD. Approach a portal and use its interaction button or E/Enter; one Select session dialog is available, without a repeated shortcut row. Future portals remain locked until their preceding station and its post-test are complete. Follow Zequi and Overview cameras show the same world from different positions. The hub publishes separate nearby-player positions with lobby scope.

Discovery islands have actual 3D terrain, trees, a camp, guardian, and egg meshes. Approach an egg, then tap its geometry or its accessible egg control. Canvas taps use a Three.js raycaster, and the existing proximity rule still applies. Wrong options are crossed out and trigger a moving guardian. The guardian is slower than the player. Reaching camp ends the chase; being caught returns the chased explorer to camp while retaining collected eggs. Run to Safe Spot provides an accessible rescue action.

The pet home base, hatching reveal, pet cards, and explorer portraits use the same procedural model system. These 3D views do not change the genetics rules, workshop order, or rewards. Three.js and all model code are included in the build. No external models, textures, or rendering service are needed during play.

`ThreeViewport` creates WebGL 2 renderers only for visible views and limits simultaneous rendering contexts to eight. It caps pixel ratio, pauses hidden scenes, resizes with the container, and disposes resources when scenes leave view or unmount. Rendering failures and context loss show fallback content; Retry 3D retries initialization, and a restored context resumes rendering. Station/activity controls remain available if graphics are unsupported. Browser software rendering establishes correctness, while physical Android graphics performance still needs device testing.

Each workshop pays 10 coins and 10 XP. Each egg also pays 10 coins and 10 XP. Completing an egg station pays 50 coins and 20 XP, in addition to workshop/egg rewards. Completing a lab or fusion station pays 60 coins and 80 XP, in addition to workshop rewards. Stars are max(1, 3 − mistakes), and replays retain the best rating. Level is 1 + floor(XP/100). XP remains a level/reward metric; station unlocking depends on preceding completion, without an additional XP gate.

Common/Rare/Epic eggs hatch after 20/40/60 seconds into a random egg-laying animal of the matching tier. These short countdowns are prototype choices because the slides specify timers without durations. Hatching has an animated reveal, and pet cards respond when greeted. Discovery records persist after fusion consumes parents. Pet upgrades cost 60 × current level and stop at level 5. The shop sells the specified bases and outfits with game coins.

Stations 5–7 use Bb × Bb, BB × bb, and Bb × bb across three rounds. Genotype ratios use BB:Bb:bb order, and phenotype ratios use dominant:recessive. Punnett-square boxes represent equally likely combinations; they do not guarantee exact family totals.

Fusion requires two different pets of the same species and level, a correct final solution, and explicit confirmation before consuming the parents. Zero mistakes raises the higher parent rarity one tier; one mistake preserves it; two lowers it one; three or more lowers it two, clamped to Common–Prismatic. The offspring genotype is sampled from the parental cross, and level increases by one up to level 5. Legendary or Prismatic outcomes award Genetics Master. Fusion species/rarity rewards are fictional mechanics, not biological inheritance rules.

Daily quests use three questions selected from weak station records, pay 30 coins and 15 XP once per local calendar day, and track a streak.

## Offline and nearby multiplayer

Solo play uses bundled assets and native Preferences. Nearby cooperative play uses the custom Android LocalMultiplayer plugin over TCP port 18947, with UDP room discovery on port 18948. Players connect to one Wi-Fi/hotspot, start a host expedition, scan for the host's room, and enter its six-digit room code. Manual local IPv4 entry is available when discovery fails. The app does not enable the hotspot itself and does not require a cloud server or mobile data.

Up to four phones share the host's expedition, coins, eggs, mistakes, and workshop progress. Each phone controls its own explorer; position, walking, facing, and outfit metadata are sent separately. The host chooses stations and shared pages. Guest solo saves remain on the guest's phone and are not replaced by shared snapshots. Leaving or losing the host returns guests to their own expedition.

The host publishes snapshots with sequence numbers. Actions are tagged with expedition, round, phase, and activity context so delayed actions cannot advance a later challenge. Duplicate remote action IDs are ignored. Guardians target the explorer who made the egg mistake; another explorer reaching camp cannot cancel that chase. Leaving a hosted room resolves an active shared chase before solo play resumes. Restoring a saved game also resolves an abandoned chase while preserving mistakes, the pending egg, and eliminated wrong options. The native roster retains movement metadata for late joiners. Protocol mismatches, wrong room codes, and full rooms are rejected. Heartbeats detect disconnected peers.

Room discovery sends local UDP probes and lists matching nearby hosts. Some networks block discovery or isolate clients; manual entry bypasses missing advertisements but cannot bypass blocked TCP connections. Hosting lasts while the app is active. There is no cloud matchmaking, background server, or internet multiplayer.

## Verification and remaining release work

Version 1.3 adds actual Three.js geometry for the walkable hub, discovery islands, Zequi, guardians, eggs, and pets. Touch direction buttons and keyboard movement drive articulated walking/idle animation; story portraits animate during dialogue. The hub and islands offer Follow/Overview cameras, and the hub has one station selector for all eight sessions. Nearby positions carry lobby/station scope so independent movement also works before a station starts. Generated concepts are visual references; the running prototype uses simpler original models, level walkable ground, and scenic cliffs.

Version 1.3 verification: 29 state/multiplayer/model checks and 21 browser scenarios passed across the main run and focused reruns. Integrated Android emulator checks passed for 3D rendering, real TCP guest actions and movement, workshop completion, guardian recovery, native saves, local assets, and screen fit. The optional narrator returned the supported captions fallback in this run. Physical two-phone hotspot compatibility and phone graphics performance remain unverified.

State/browser suites cover the genetics and journey rules; shared-action and position checks are in `tests/local-multiplayer.test.mjs`. `tests/three-models.test.mjs` checks finite model geometry, walking/talking animation, egg mesh picking, and independent resource disposal. `tests/three-world.spec.js` checks actual WebGL rendering, explorer movement, camera controls, portal locks, ray-picked and accessible eggs, graphics fallback/recovery, local assets, and phone layouts. The browser suite uses software WebGL in Edge for repeatability, rather than assuming a particular hardware GPU.

Native emulator verification in `tests/local-multiplayer-native.mjs` has exercised actual Java TCP/UDP sockets: room-code rejection, host advertisements, native scanning, joins, independent position delivery, late-join metadata, snapshots, guest actions, roster updates, and host-loss notification. These checks use emulator NAT/ADB forwarding and PC socket peers, rather than two physical phones. Updated 3D lobby movement also requires a physical two-phone session before release.

A full session on two physical Android phones connected through a hotspot remains pending. Device checks, publisher signing, a publisher-signed Play Store bundle, and Play Store submission remain release tasks. See [ANDROID.md](ANDROID.md) for the build and device checklist. This documentation does not claim a completed Play Store release.

## Version 1.5 — approved journey UI and bilingual play

- Portrait launch screen and one-at-a-time station portal selection; eight station buttons retain sequential locks.
- Portrait standalone pre-tests/post-tests and reviews; landscape 3D exploration and in-world activities. Android rotation is requested through the existing GameScreen native plugin.
- Bhell replaces Zequi in active dialogue, NPC signs, settings, and narration controls. Her new locally bundled illustrated dialogue artwork animates with CSS; articulated procedural world models still walk, idle, and talk. This is not a CapCut video export or a recorded teen voice. Optional licensed recordings/videos can be placed under public/assets/bhell using src/scene-media.js.
- Six human profile pictures are separate from optional Male/Female character selection. Male uses the short-haired male world model; Female uses the female model with ponytail. Legacy girl/boy profile values migrate without losing progress. Nearby players receive the selected gender and player name.
- English and Tagalog are selectable on the launch screen and in Settings, saved locally, and usable offline. All 80 authored station test prompts/options, station review scripts, notes, and workshop data have Tagalog translations. Allele symbols and ratios retain their notation and answer order. Each nearby player keeps their own language choice.
- Narration asks for a local English or Tagalog/Filipino voice. An unavailable voice falls back to captions; age/gender/timbre depend on installed voices. No online translation, authentication, subscription, or cloud service was added.
- Illustrated home scenery and Bhell art were generated for this project. The playable world remains simpler original Three.js geometry suited to the prototype; the approved concept is a visual reference rather than an exact gameplay render.
- Existing station scores, coins, pets, completed activities, and reviewer limits are preserved. Reviewer access remains limited to three per station attempt.

Latest screenshots: artifacts/previews/v1.5. Native verification report: artifacts/SciBlox-1.5-native-checks.json. Physical Samsung A16 5G / Huawei P40 Pro hotspot and graphics testing remains a release step. Publisher signing and Play Store submission are separate from this debug build.

Version 1.5 final verification: 39 state/genetics/multiplayer/model/localization checks and all 29 browser scenarios passed across the full run and focused reruns. Native Android checks passed for actual landscape world/activity and portrait test/reviewer rotation, Male/Female selection, Tagalog guidance and spoken narration, native saved answers, local TCP protocol handshake, bundled assets, and no JavaScript exceptions. The debug certificate matches 1.4; APK metadata and checksum are in artifacts/SciBlox-1.5-validation.json. No physical two-phone test or Play Store publication is claimed.

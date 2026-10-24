# SciBlox image assets

## User-provided logo

`sciblox-logo.jpg` is an unchanged copy of the logo supplied by the user at:

`D:/Downloads/c7157936-2594-4c9d-9f0c-0d99866682b1.jpg`

The same original is copied to `android/app/src/main/res/drawable/sciblox_logo.jpg`. Native bitmap/adaptive-icon wrappers display it in the launcher and splash. The web game uses the bundled image in its introduction, loading view, header, and sidebar. The logo was not regenerated or redrawn. The original and both copies have SHA-256 `1961cba5c938db9b4cc8959c67d7dc4adcbf6c14c6012146c6c6dd1489fe34ab`.

## Current procedural 3D models

Version 1.3.0 renders Mia, explorers, pets, eggs, guardians, and trees using original procedural geometry in `src/three-models.js`. `Character3D`, the world scenes, and the pet home render those models through the locally bundled Three.js runtime. The 3D characters are meshes with animated rigs, not sprite planes. No external model files, textures, or image-generation calls are needed during gameplay. The title credits identify Three.js and its MIT license.

## Earlier generated Mia sprite sheet

`mia-sprites.png` was generated using the built-in OpenAI image-generation tool for this SciBlox update. It is a transparent 1448 × 1086 PNG arranged as 4 columns × 3 rows: 12 frames of 362 × 362 pixels each.

Exact generation prompt:

> Create a production 2D game character animation SPRITE SHEET on a truly transparent background. Exactly 12 frames arranged in a perfectly regular 4-column by 3-row rectangular grid, no labels, no text, no border, identical equal cell dimensions, each character centered in its cell with identical scale and feet baseline. Character: Mia, an original friendly teenage female science explorer, warm brown skin, expressive dark eyes, dark ponytail, round amber goggles resting on head, cobalt blue explorer jacket with mint-green trim, cream shirt, mustard utility satchel, navy shorts over leggings, brown ankle boots. Style: polished hand-painted cartoon mobile adventure game, softly shaded with crisp navy outlines, readable silhouette, charming expressive face, non-pixel art. Full body visible in EVERY cell, isolated character ONLY, no props extending outside the cell, generous clear transparent margins between all frames. Row 1 (four frames): front three-quarter IDLE breathing and blinking loop, arms relaxed, subtle consistent changes. Row 2 (four frames): front three-quarter WALK cycle with alternating feet and natural arm swing, same fixed character scale and exact center position across frames, no perspective scaling. Row 3 (four frames): TALKING friendly guide animation, mouth closed then open then smiling then open, small natural hand gestures toward the viewer; keep body at same scale and baseline as other rows. Avoid extra characters, scenery, shadows that cross cell boundaries, weapons, watermarks, words, displaced grid cells, inconsistent clothing. This sprite sheet will be animated directly by CSS background-position without editing the art.

The original 2D version used the first row for idle, the second for walking, and the third for talking, with CSS background-position animation. The sheet remains in the project as a legacy asset with its provenance preserved. Version 1.3.0 uses the procedural 3D models for current character rendering.

The original supplied logo provides the app branding. The generated sheet records the earlier 2D character asset, while the current animated characters come from the procedural 3D model code.

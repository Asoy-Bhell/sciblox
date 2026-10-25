# Bhell guide system

`GuideNPC.jsx` is the reusable caption/sprite card. Pass `scenes`, `trigger`,
`language`, `motion`, `sound`, optional text `variables`, and `onClose`.
Each scene contains `id`, `expression`, bilingual `text`, and optional bilingual
`hint`. Supported expressions are wave, explain, think, celebrate, and encourage.

Eight authored JSON files under `stations/` are statically imported by
`dialogue.js`; adding dialogue does not require a network request. Keep hints as
reasoning prompts, never a selected option or filled answer. New languages can
add text keys; missing translations fall back to English. The app currently
offers English (`en`) and Tagalog (`tl`).

`useGuideSystem` observes accepted workshop, egg, lab, mistake, and XP changes.
Partial workshop quiz successes and validated fusion solutions use the optional
`onCorrect` / `onGuideCorrect` callbacks. Feedback queues before level-up
messages, wrong answers replace older feedback, and reopening Bhell uses the
station's `talk` scenes. Next advances; Skip closes the current conversation.

Idle means 20 seconds without pointer, keyboard, or form activity. Pausing,
backgrounding, an open conversation, and held controls suspend the timer. Event
handlers/timers are removed on unmount. Separate pre/post assessments retain
their existing UI and do not receive guide hints.

`useOfflineNarration` reuses the existing native Narrator plugin and local
recording map from `scene-media.js`, with browser localService voice fallback.
It never selects a network voice. Voice availability depends on the installed
offline language pack; captions remain complete without it. Voice plays automatically when a caption appears; Hear Bhell replays it and stops on Next, Skip, pause, background, language change, mute, or
unmount. Animated scenes controls sprite motion; Sound and Bhell's voice controls
narration. Existing StoryDialog screens now use this same narration hook, so
voice choice, neutral pitch, mute, and automatic narration are consistent.

Assets: `public/assets/bhell/{expression}.png`. There is no new runtime
dependency. Preview screenshots are written by `tests/guide-npc.spec.js` to
`artifacts/previews/bhell-guide/`.

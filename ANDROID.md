# SciBlox Android

The Android app bundles the game, Three.js, and assets locally. All eight stations and 23 workshops work offline after installation. Version 1.5.0 adds the approved portal UI, Bhell guidance, six independent human profile pictures, Male/Female playable characters, and English/Tagalog localization. Menus, reviews, and standalone tests request portrait; the explorable world and its in-world activity/questions request landscape. Progress uses Android SharedPreferences through Capacitor Preferences; the browser version uses localStorage. App data is removed on uninstall or when storage is cleared. Android backup is disabled. Website progress does not automatically transfer into the installed app. Nearby multiplayer is optional and connects over local Wi-Fi/hotspot without an internet service.

## Build tools

1. Install Android Studio and complete its setup wizard.
2. In SDK Manager, install Android 16 / API 36, Build-Tools, and Platform-Tools. Use Java 21–24 as the Gradle JDK. The project also detects portable Microsoft Java 21 at `.tools/java21` without changing the system default.
3. Run `npm.cmd run android:sync`, then `npm.cmd run android:open`.
4. Let Gradle sync. Connect an Android phone with USB debugging enabled, or create an emulator. Press Run to test.

The project uses Gradle 8.14.3, targets API 36, and supports API 24 and newer. An API 37 emulator has been used for native startup and TCP/UDP checks. Physical-device testing is still required before release.

## Installable debug APK

Run `npm.cmd run android:debug`. If Java is installed elsewhere, set JAVA_HOME to a Java 21–24 directory. For a custom SDK location, set ANDROID_HOME or configure `android/local.properties` through Studio.

Output: `android/app/build/outputs/apk/debug/app-debug.apk`. This is a development build for device testing, not a Play Store release. Allow the file's source to install apps in Android Settings when prompted. A future production build will use the publisher's release signing key.

The verified version 1.4.0/code 5 test APK is also copied to `artifacts/SciBlox-1.4-debug.apk`. Earlier APKs are retained. Version 1.4 uses the same package and debug signing certificate as the earlier test builds, so it is intended to update them without clearing progress. An update was installed successfully on the emulator. The previously reported installation failure on the Samsung A16 5G/Huawei P40 Pro has not yet been diagnosed from a connected physical device.

## Orientation and offline identity

Home, profile, settings, and session selection request portrait. Station pre-tests, review, gameplay, post-tests, and completion request landscape through GameScreenPlugin. Back/Pause navigation returns to portrait. Android 16+ may ignore orientation locks on large screens; the interface remains responsive. See [Android adaptive orientation guidance](https://developer.android.com/develop/adaptive-apps/guides/app-orientation-aspect-ratio-resizability).

The player profile is local and has no password or online sign-in. Human avatar style is optional. Earlier animal profile choices normalize to Human without changing collected pets, points, or completions. The circular E shortcut and repeated session button row have been removed. All eight stations remain in Select session.

## Branding and Zequi

The supplied SciBlox logo is bundled unchanged as `public/assets/sciblox-logo.jpg` and `android/app/src/main/res/drawable/sciblox_logo.jpg`. Native drawable wrappers use it for the launcher and splash. The in-game introduction, loading view, header, and sidebar use the same logo. See [asset provenance](public/assets/README.md).

Zequi uses a procedural 3D body with animated arms, legs, face, and ponytail. Eggs, guardians, pets, trees, island terrain, and portals are also 3D geometry. Each nearby player has their own movement and facing state. Models, materials, and the renderer are bundled; no external 3D assets are fetched. The earlier Zequi sprite sheet is retained with its provenance, but the current character views use 3D geometry.

3D rendering requires WebGL 2 support in the phone's Android System WebView and graphics driver. The app keeps station/activity controls and captions available if graphics fail. Visible scenes own a bounded number of rendering contexts, pause while hidden, and offer Retry 3D after failure. Test the Follow Zequi/Overview cameras, context recovery, and phone heat/performance on physical devices before release.

Hear Zequi prefers identifiable female offline English device voices with a brighter pitch; gender/age cannot be guaranteed. No specific teen voice recording or CapCut movie is bundled. Licensed audio/video exports can be mapped in src/scene-media.js. Missing voice data does not block captions. The fallback uses an installed offline English Android text-to-speech voice; missing voice data does not block captions or gameplay. Voice output may sound different across devices. Test narration once with mobile data and Wi-Fi internet disabled.

## Nearby multiplayer device checklist

1. Install the same current APK on two Android phones. Enable a Wi-Fi hotspot on the host phone and connect the second phone to it. Mobile data is not required.
2. In SciBlox, choose Nearby multiplayer and Host expedition on the hotspot phone. On the second phone, choose Find nearby expeditions, select the host, enter its six-digit room code, and join. If discovery finds no rooms, enter the displayed host local IPv4 address manually. Keep the host app open.
3. Confirm both explorer names appear. Walk independently in the 3D hub, then let the host select a station. Check synchronized review progress and workshops, then move each explorer separately on a discovery island. Check walking, facing, camera controls, egg collection, and lab progress on both screens.
4. Trigger an incorrect egg answer. The guardian should chase that explorer; a teammate already in camp should not cancel the chase. Collected eggs must survive rescue.
5. Leave and rejoin. Confirm guest solo progress was preserved. Test host disconnection, app restart, wrong room codes, a full four-player room, and a hotspot with internet disabled.

Native discovery uses UDP port 18948; gameplay uses TCP port 18947. Some hotspot or guest-network configurations isolate clients. Manual entry helps when discovery packets are blocked, but it cannot overcome blocked phone-to-phone TCP connections. The room runs while the host is active; it does not provide background hosting or internet matchmaking.

The native emulator checks in `tests/local-multiplayer-native.mjs` exercise real Java sockets, room-code validation, UDP advertisements and scanning, host snapshots, guest actions, late-join player metadata, and disconnects with PC peers. They do not establish compatibility between two physical phones. That device check remains pending.

`tests/native-game-smoke.mjs` additionally passed integrated version 1.3 checks for WebGL 2 hub/island rendering, independent guest lobby positions, shared review actions, workshop UI, animated explorers, guardian ownership and disconnect recovery, Preferences, local assets, and screen fit. The narration bridge returned the supported captions fallback in the latest run; an earlier run returned a usable offline English voice. Physical voice availability depends on installed language data.

## Publisher-signed Play Store bundle

Version 1.4 native integration passed portrait home/landscape station orientation, shared per-station pre-tests via a real TCP peer, independent movement, workshop completion, guardian recovery, native saves, screen fit, and installed offline narration. See artifacts/SciBlox-1.4-native-checks.json for the recorded results. No physical two-phone session is claimed.

The provisional package ID is **com.sciblox.learning**. Confirm it before the first Play Console upload. This update uses package version 1.4.0 and Android versionCode 5. Increment versionCode for every uploaded release.

Use Android Studio → Build → Generate Signed Bundle / APK → Android App Bundle. Create and securely retain an upload keystore, choose release, and enable Play App Signing in Play Console. Keep passwords and keystores out of chat and source control.

For command-line signing, copy `android/keystore.properties.example` to `android/keystore.properties` and enter the local keystore information. Run `npm.cmd run android:bundle`.

Output: `android/app/build/outputs/bundle/release/app-release.aab`. No publisher-signed bundle or Play Store submission is claimed by this update.

## Before submitting

- Test physical phones: back navigation, restart persistence, offline cold launch, 3D scene rendering and recovery, Follow/Overview cameras, all workshops and stations, guardian retries, keyboard resizing, bars/insets, portrait/landscape controls, narration, and large text.
- Confirm publisher details, package identifier, audience, content rating, and store copy. Draft short description: Explore heredity through eight playful science adventures.
- Supply a public privacy policy and developer contact. The app has no accounts, ads, analytics, or real-money purchases. It stores the explorer name, quizzes, points, and rewards locally. Nearby multiplayer shares the host's expedition and player positions with connected local peers. Review this local sharing and any future SDKs when completing the Play Console declarations.
- Prepare a 512 × 512 store icon, 1024 × 500 feature graphic, and actual phone screenshots. The native launcher/splash already uses the user's logo; publisher review of store artwork and metadata is still needed.
- Upload to internal testing first. Follow the testing and developer verification requirements shown in the publisher's Play Console account.

Build/release references: [Capacitor Android environment](https://capacitorjs.com/docs/getting-started/environment-setup), [Android target API requirements](https://developer.android.com/google/play/requirements/target-sdk), [Android App Bundles](https://developer.android.com/guide/app-bundle), [App signing](https://developer.android.com/studio/publish/app-signing). Consult the publisher's current Play Console requirements before release.

## Version 1.5 device test

Install artifacts/SciBlox-1.5-debug.apk as an update over the same-signed build. Check English/Tagalog after restart, Male/Female world characters, portrait tests and reviewer, landscape world activities, and reviewer lockout after three uses. Check two physical phones on one hotspot before release. Do not uninstall to update unless you intend to remove local progress.

The 1.5 APK uses the same debug certificate as artifacts/SciBlox-1.4-debug.apk (SHA-256 bf9c34de64b893009cc837566baf9face2b7e2ef1a1da689e1c8d5e4d1e26604). Native emulator checks, including actual rotation, passed; see artifacts/SciBlox-1.5-native-checks.json.

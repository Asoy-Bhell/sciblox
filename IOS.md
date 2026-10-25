# SciBlox iOS development

The `ios/` folder is a Capacitor project with native Swift bridges for screen
orientation, installed-device speech, classroom records, and direct LAN co-op.
It has not been compiled or signed on this Windows workstation. iPhone and
iPad compatibility must be confirmed with Xcode and physical-device testing.

## Build on a Mac

Install the Xcode version required by the installed Capacitor release, select
your Apple development team in the App target, then run:

```sh
npm ci
npm run ios:sync
npm run ios:open
```

Select an iPhone simulator or connected device in Xcode and build the App
scheme. Capacitor's Swift Package Manager project resolves native dependencies.
The privacy manifest is included in App resources. Review signing, app icons,
privacy declarations, and distribution requirements before an App Store release.

## Offline features

Game art, questions, English/Tagalog text, and Bhell expressions are bundled.
Narration needs an installed voice for the selected language; captions remain
available when no suitable voice is installed. No external speech service is
configured. Mute stops narration and saves on the device.

## Local network

Allow Local Network access when prompted. Both devices must be on the same
Wi-Fi or hotspot, with client-to-client connections allowed. The teacher or
co-op host must keep SciBlox open.

iOS currently uses **manual address pairing**, rather than automatic UDP room
discovery. Enter the local address shown on the teacher/host screen and its
six-digit code. Classroom synchronization retries automatically after pairing
while the app is in the foreground and the teacher is reachable. If the
teacher's address changes, pair again using the new address.

Co-op uses TCP port 18947; classroom sync uses TCP port 18949. Android also
provides discovery on UDP ports 18948 and 18950. These are local connections;
opening public router ports is unnecessary.

## Validation still required

- Compile Swift bridges and resolve any Xcode SDK differences.
- Test orientation changes, safe areas, touch controls, mute, and offline voices.
- Test Android-to-iPhone co-op and classroom pairing, reconnection, and saved scores.
- Confirm correct behavior when Local Network access is denied or the app backgrounds.

References: [Capacitor iOS](https://capacitorjs.com/docs/ios),
[native plugin registration](https://capacitorjs.com/docs/ios/custom-code), and
[privacy manifests](https://capacitorjs.com/docs/ios/privacy-manifest).

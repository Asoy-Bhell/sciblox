import UIKit
import Capacitor
import AVFoundation
import Network
import Darwin

final class SciBloxViewController: CAPBridgeViewController {
    static var orientation: UIInterfaceOrientationMask = .portrait
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { Self.orientation }
    override var prefersStatusBarHidden: Bool { true }
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(NarratorPlugin())
        bridge?.registerPluginInstance(GameScreenPlugin())
        bridge?.registerPluginInstance(ClassroomPlugin())
        bridge?.registerPluginInstance(LocalMultiplayerPlugin())
    }
}

@objc(NarratorPlugin)
public final class NarratorPlugin: CAPPlugin, CAPBridgedPlugin, AVSpeechSynthesizerDelegate {
    public let identifier = "NarratorPlugin", jsName = "Narrator"
    public let pluginMethods = [CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise), CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise), CAPPluginMethod(name: "voices", returnType: CAPPluginReturnPromise)]
    private let speaker = AVSpeechSynthesizer()
    override public func load() { speaker.delegate = self }
    @objc func speak(_ call: CAPPluginCall) { DispatchQueue.main.async {
        self.speaker.stopSpeaking(at: .immediate)
        let tagalog = call.getString("language") == "tl"
        let voices = AVSpeechSynthesisVoice.speechVoices().filter { voice in
            let language = voice.language.lowercased()
            return tagalog ? language.hasPrefix("fil") || language.hasPrefix("tl") : language.hasPrefix("en")
        }
        let requested = call.getString("voiceName") ?? ""
        guard let voice = voices.first(where: { $0.identifier == requested }) ?? voices.sorted(by: { ($0.gender == .female ? 1 : 0) > ($1.gender == .female ? 1 : 0) }).first,
              let text = call.getString("text"), !text.isEmpty else { call.resolve(["spoken": false]); return }
        // AVSpeechSynthesizer uses voices installed on this device; no external
        // audio service, downloaded script, or imitation voice is requested.
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = voice; utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.90; utterance.pitchMultiplier = 1.0
        self.speaker.speak(utterance); call.resolve(["spoken": true, "voiceName": voice.name, "recordedVoice": false])
    } }
    @objc func stop(_ call: CAPPluginCall) { DispatchQueue.main.async { self.speaker.stopSpeaking(at: .immediate); call.resolve() } }
    @objc func voices(_ call: CAPPluginCall) {
        let tagalog = call.getString("language") == "tl"
        let installed = AVSpeechSynthesisVoice.speechVoices().filter { voice in
            let lang = voice.language.lowercased()
            return tagalog ? lang.hasPrefix("tl") || lang.hasPrefix("fil") : lang.hasPrefix("en")
        }.map { ["id": $0.identifier, "name": $0.name, "language": $0.language] }
        call.resolve(["voices": installed])
    }
    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) { notifyListeners("finished", data: [:]) }
    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) { notifyListeners("finished", data: [:]) }
}

@objc(GameScreenPlugin)
public final class GameScreenPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GameScreenPlugin", jsName = "GameScreen"
    public let pluginMethods = [CAPPluginMethod(name: "orient", returnType: CAPPluginReturnPromise), CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise)]
    @objc func orient(_ call: CAPPluginCall) { DispatchQueue.main.async {
        let landscape = call.getString("mode") == "landscape"
        SciBloxViewController.orientation = landscape ? .landscape : .portrait
        if #available(iOS 16.0, *) {
            self.bridge?.viewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
            self.bridge?.viewController?.view.window?.windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: SciBloxViewController.orientation))
        } else { UIDevice.current.setValue(landscape ? UIInterfaceOrientation.landscapeRight.rawValue : UIInterfaceOrientation.portrait.rawValue, forKey: "orientation"); UIViewController.attemptRotationToDeviceOrientation() }
        call.resolve(["requested": landscape ? "landscape" : "portrait"])
    } }
    @objc func status(_ call: CAPPluginCall) { DispatchQueue.main.async { call.resolve(["landscape": self.bridge?.viewController?.view.window?.windowScene?.interfaceOrientation.isLandscape ?? false]) } }
}

// Bounded newline JSON, compatible with the Android LAN wire protocols.
final class LANPeer {
    let connection: NWConnection
    var onLine: (([String: Any]) -> Void)?, onClose: (() -> Void)?
    var buffer = Data(), closed = false
    let limit: Int
    init(_ connection: NWConnection, limit: Int = 1_048_576) { self.connection = connection; self.limit = limit }
    func start(queue: DispatchQueue, ready: (() -> Void)? = nil) {
        connection.stateUpdateHandler = { [weak self] state in
            guard let self = self else { return }
            switch state { case .ready: ready?(); self.read(); case .failed, .cancelled: self.close(); default: break }
        }
        connection.start(queue: queue)
    }
    func read() {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 16_384) { [weak self] data, _, done, error in
            guard let self = self, !self.closed else { return }
            if let data = data { self.buffer.append(data) }
            if self.buffer.count > self.limit { self.close(); return }
            while let end = self.buffer.firstIndex(of: 10) {
                let line = self.buffer.prefix(upTo: end); self.buffer.removeSubrange(...end)
                guard let json = try? JSONSerialization.jsonObject(with: Data(line)) as? [String: Any] else { self.close(); return }
                self.onLine?(json)
            }
            if done || error != nil { self.close() } else { self.read() }
        }
    }
    func write(_ object: [String: Any], completion: (() -> Void)? = nil) {
        guard !closed, var data = try? JSONSerialization.data(withJSONObject: object), data.count <= limit else { close(); return }
        data.append(10); connection.send(content: data, completion: .contentProcessed { [weak self] error in if error != nil { self?.close() }; completion?() })
    }
    func close() { guard !closed else { return }; closed = true; connection.cancel(); onClose?(); onLine = nil; onClose = nil }
}

func localIPv4(_ value: String) -> Bool {
    let parts = value.split(separator: ".").compactMap { Int($0) }
    guard parts.count == 4, parts.allSatisfy({ $0 >= 0 && $0 <= 255 }) else { return false }
    return parts[0] == 10 || parts[0] == 192 && parts[1] == 168 || parts[0] == 172 && (16...31).contains(parts[1]) || parts[0] == 169 && parts[1] == 254
}
func localAddresses() -> [String] {
    var interfaces: UnsafeMutablePointer<ifaddrs>?, result: [String] = []
    guard getifaddrs(&interfaces) == 0, let start = interfaces else { return [] }
    defer { freeifaddrs(interfaces) }
    var item: UnsafeMutablePointer<ifaddrs>? = start
    while let pointer = item {
        defer { item = pointer.pointee.ifa_next }
        guard let address = pointer.pointee.ifa_addr, address.pointee.sa_family == UInt8(AF_INET) else { continue }
        var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
        if getnameinfo(address, socklen_t(address.pointee.sa_len), &host, socklen_t(host.count), nil, 0, NI_NUMERICHOST) == 0 {
            let value = String(cString: host); if localIPv4(value) { result.append(value) }
        }
    }
    return Array(Set(result)).sorted()
}

@objc(ClassroomPlugin)
public final class ClassroomPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ClassroomPlugin", jsName = "Classroom"
    public let pluginMethods = ["start", "stop", "records", "upload", "discover"].map { CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise) }
    private let queue = DispatchQueue(label: "sciblox.classroom")
    private var listener: NWListener?, peers: [UUID: LANPeer] = [:]
    private var classID = "", code = ""
    private func path() throws -> URL {
        let directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("SciBloxClassroom")
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory.appendingPathComponent(classID + ".json")
    }
    private func recordsMap() -> [String: [String: Any]] { guard let url = try? path(), let data = try? Data(contentsOf: url), let rows = try? JSONSerialization.jsonObject(with: data) as? [String: [String: Any]] else { return [:] }; return rows }
    private func valid(_ record: [String: Any]) -> Bool {
        guard record["schema"] as? Int == 1, let id = record["id"] as? String, id.range(of: "^[A-Za-z0-9_-]{8,80}$", options: .regularExpression) != nil,
              let name = record["name"] as? String, !name.isEmpty, name.utf16.count <= 24, let revision = record["revision"] as? Int, revision > 0,
              let xp = record["xp"] as? Int, xp >= 0, xp < 100_000_000, let completed = record["completed"] as? [Int], completed.count <= 8, completed.allSatisfy({ (0...7).contains($0) }),
              let scores = record["scores"] as? [[String: Any]], scores.count <= 8 else { return false }
        return scores.allSatisfy { score in guard let station = score["station"] as? Int, (0...7).contains(station) else { return false }; return ["pre", "post"].allSatisfy { key in score[key] is NSNull || (score[key] as? Int).map { (0...10).contains($0) } == true } }
    }
    @objc func start(_ call: CAPPluginCall) { queue.async {
        self.listener?.cancel()
        guard let id = call.getString("classId"), id.range(of: "^[A-Za-z0-9_-]{8,80}$", options: .regularExpression) != nil, let code = call.getString("code"), code.range(of: "^\\d{6}$", options: .regularExpression) != nil else { call.reject("Invalid classroom identity."); return }
        self.classID = id; self.code = code
        do {
            let listener = try NWListener(using: .tcp, on: 18949); self.listener = listener
            var resolved = false
            listener.stateUpdateHandler = { state in switch state { case .ready: if !resolved { resolved = true; call.resolve(["classId": id, "addresses": localAddresses(), "port": 18949]) }; case .failed(let error): if !resolved { resolved = true; call.reject(error.localizedDescription) }; default: break } }
            listener.newConnectionHandler = { connection in
                let peer = LANPeer(connection, limit: 65_536), token = UUID(); self.peers[token] = peer
                peer.onClose = { self.peers.removeValue(forKey: token) }
                peer.onLine = { request in
                    guard request["code"] as? String == self.code, request["classId"] == nil || request["classId"] as? String == self.classID else { peer.write(["ok": false, "message": "Check the class code and teacher address."]) { peer.close() }; return }
                    do {
                        if request["checkOnly"] as? Bool != true {
                            guard var record = request["record"] as? [String: Any], self.valid(record), let student = record["id"] as? String, let revision = record["revision"] as? Int else { throw NSError(domain: "SciBlox", code: 1) }
                            var rows = self.recordsMap()
                            if revision > (rows[student]?["revision"] as? Int ?? 0) {
                                guard rows[student] != nil || rows.count < 2000 else { throw NSError(domain: "SciBlox", code: 2) }
                                record["receivedAt"] = Int(Date().timeIntervalSince1970 * 1000); rows[student] = record
                                try JSONSerialization.data(withJSONObject: rows).write(to: self.path(), options: .atomic)
                            }
                        }
                        peer.write(["ok": true, "classId": self.classID]) { peer.close() }
                    } catch { peer.write(["ok": false, "message": "Could not save the record."]) { peer.close() } }
                }
                peer.start(queue: self.queue)
                self.queue.asyncAfter(deadline: .now() + 8) { peer.close() }
            }
            listener.start(queue: self.queue)
        } catch { call.reject(error.localizedDescription) }
    } }
    @objc func stop(_ call: CAPPluginCall) { queue.async { self.listener?.cancel(); self.listener = nil; let peers = Array(self.peers.values); peers.forEach { $0.close() }; call.resolve() } }
    @objc func records(_ call: CAPPluginCall) { queue.async { call.resolve(["records": Array(self.recordsMap().values)]) } }
    @objc func discover(_ call: CAPPluginCall) { call.resolve(["rooms": [], "manualAddress": true]) }
    @objc func upload(_ call: CAPPluginCall) { queue.async {
        guard let address = call.getString("address"), localIPv4(address) else { call.reject("Use the teacher’s local Wi-Fi address."); return }
        let peer = LANPeer(NWConnection(host: NWEndpoint.Host(address), port: 18949, using: .tcp), limit: 65_536), token = UUID(); self.peers[token] = peer
        var settled = false
        let finish: ([String: Any]?, String?) -> Void = { value, error in guard !settled else { return }; settled = true; if let value = value { call.resolve(value) } else { call.reject(error ?? "Classroom unavailable.") }; peer.close(); self.peers.removeValue(forKey: token) }
        peer.onClose = { finish(nil, "Classroom unavailable. Your record stays on this device.") }
        peer.onLine = { value in if value["ok"] as? Bool == true { finish(value, nil) } else { finish(nil, value["message"] as? String) } }
        peer.start(queue: self.queue) {
            var request: [String: Any] = ["code": call.getString("code") ?? "", "checkOnly": call.getBool("checkOnly") ?? false]
            if let id = call.getString("classId") { request["classId"] = id }
            if let record = call.getObject("record") { request["record"] = record }
            peer.write(request)
        }
        self.queue.asyncAfter(deadline: .now() + 8) { finish(nil, "Classroom connection timed out.") }
    } }
}

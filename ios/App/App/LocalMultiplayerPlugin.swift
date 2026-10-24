import Capacitor
import Foundation
import Network

@objc(LocalMultiplayerPlugin)
public final class LocalMultiplayerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LocalMultiplayerPlugin", jsName = "LocalMultiplayer"
    public let pluginMethods = ["host", "join", "send", "discover", "disconnect"].map { CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise) }
    private let queue = DispatchQueue(label: "sciblox.cooperative")
    private var listener: NWListener?, upstream: LANPeer?, heartbeat: DispatchSourceTimer?
    private var peers: [String: LANPeer] = [:], names: [String: String] = [:], positions: [String: [String: Any]] = [:], seen: [String: Date] = [:]
    private var roomID = "", code = "", hostName = "Explorer", generation = 0
    private func emit(_ value: [String: Any]) { notifyListeners("event", data: value) }
    private func cleanName(_ value: String) -> String { let name = value.trimmingCharacters(in: .whitespacesAndNewlines); return String((name.isEmpty ? "Explorer" : name).prefix(24)) }
    private func stopRoom() {
        generation += 1; heartbeat?.cancel(); heartbeat = nil; listener?.cancel(); listener = nil
        let connected = Array(peers.values); peers.removeAll(); names.removeAll(); positions.removeAll(); seen.removeAll()
        connected.forEach { $0.close() }; let old = upstream; upstream = nil; old?.close()
    }
    private func broadcast(_ message: [String: Any], except: String? = nil) { for (id, peer) in peers where id != except { peer.write(message) } }
    private func roster() {
        let host: [String: Any] = ["id": "host", "name": hostName]
        var players: [[String: Any]] = [host.merging(positions["host"] ?? [:]) { first, _ in first }]
        for id in peers.keys.sorted() { let player: [String: Any] = ["id": id, "name": names[id] ?? "Explorer"]; players.append(player.merging(positions[id] ?? [:]) { first, _ in first }) }
        let message: [String: Any] = ["kind": "roster", "roomId": roomID, "players": players]
        broadcast(message); emit(["type": "roster", "roomId": roomID, "players": players])
    }
    private func validPosition(_ p: [String: Any]) -> Bool { guard let x = p["x"] as? Double, let y = p["y"] as? Double else { return false }; return x.isFinite && y.isFinite && (0...100).contains(x) && (0...100).contains(y) }
    @objc func host(_ call: CAPPluginCall) { queue.async {
        self.stopRoom(); let session = self.generation
        self.roomID = UUID().uuidString; self.code = String(format: "%06d", Int.random(in: 0..<1_000_000)); self.hostName = self.cleanName(call.getString("name") ?? "Explorer")
        do {
            let listener = try NWListener(using: .tcp, on: 18947); self.listener = listener; var resolved = false
            listener.stateUpdateHandler = { state in switch state {
                case .ready: if !resolved { resolved = true; call.resolve(["roomId": self.roomID, "code": self.code, "addresses": localAddresses(), "port": 18947, "discoveryReady": false]) }
                case .failed(let error): if !resolved { resolved = true; call.reject(error.localizedDescription) }
                default: break
            } }
            listener.newConnectionHandler = { connection in
                let peer = LANPeer(connection), id = UUID().uuidString; var admitted = false
                peer.onClose = { guard session == self.generation, admitted else { return }; self.peers.removeValue(forKey: id); self.names.removeValue(forKey: id); self.positions.removeValue(forKey: id); self.seen.removeValue(forKey: id); self.roster() }
                peer.onLine = { value in
                    guard session == self.generation else { peer.close(); return }
                    if !admitted {
                        guard value["protocol"] as? Int == 2, value["code"] as? String == self.code, self.peers.count < 3 else { peer.write(["kind": "error", "message": "Check the room code, app version, and four-player limit."]) { peer.close() }; return }
                        admitted = true; self.peers[id] = peer; self.names[id] = self.cleanName(value["name"] as? String ?? "Explorer"); self.seen[id] = Date()
                        peer.write(["kind": "welcome", "id": id, "roomId": self.roomID, "protocol": 2]); self.roster(); return
                    }
                    self.seen[id] = Date(); if value["kind"] as? String == "pong" { return }
                    guard let payload = value["payload"] as? [String: Any], let kind = payload["kind"] as? String, ["position", "action", "sync-request"].contains(kind) else { return }
                    var message: [String: Any] = ["kind": "data", "type": "message", "roomId": self.roomID, "sender": id, "payload": payload]
                    if kind == "position" {
                        guard let p = payload["position"] as? [String: Any], self.validPosition(p) else { return }
                        self.positions[id] = p; message.removeValue(forKey: "type"); self.broadcast(message, except: id); message["type"] = "message"
                    }
                    self.emit(message)
                }
                peer.start(queue: self.queue); self.queue.asyncAfter(deadline: .now() + 6) { if !admitted { peer.close() } }
            }
            listener.start(queue: self.queue)
            let timer = DispatchSource.makeTimerSource(queue: self.queue); self.heartbeat = timer; timer.schedule(deadline: .now() + 5, repeating: 5)
            timer.setEventHandler { for (id, peer) in Array(self.peers) { if Date().timeIntervalSince(self.seen[id] ?? .distantPast) > 22 { peer.close() } else { peer.write(["kind": "ping"]) } } }; timer.resume()
        } catch { call.reject(error.localizedDescription) }
    } }
    @objc func join(_ call: CAPPluginCall) { queue.async {
        self.stopRoom(); let session = self.generation
        guard let address = call.getString("address"), localIPv4(address) else { call.reject("Use the host’s local Wi-Fi address."); return }
        let peer = LANPeer(NWConnection(host: NWEndpoint.Host(address), port: 18947, using: .tcp)); self.upstream = peer
        var admitted = false, settled = false
        peer.onClose = {
            guard session == self.generation else { return }
            self.upstream = nil
            if !settled { settled = true; call.reject("Could not join the nearby expedition.") }
            else if admitted { self.emit(["type": "disconnected", "roomId": self.roomID, "message": "The host disconnected. Your personal scores are saved."]) }
        }
        peer.onLine = { value in
            guard session == self.generation else { return }
            if !admitted {
                guard value["kind"] as? String == "welcome", let id = value["id"] as? String, let room = value["roomId"] as? String else {
                    if !settled { settled = true; call.reject(value["message"] as? String ?? "Room code did not match.") }; peer.close(); return
                }
                admitted = true; settled = true; self.roomID = room; call.resolve(["id": id, "roomId": room, "port": 18947]); return
            }
            if value["kind"] as? String == "ping" { peer.write(["kind": "pong"]); return }
            guard value["roomId"] as? String == self.roomID else { return }
            var event = value; event["type"] = value["kind"] as? String == "roster" ? "roster" : "message"; self.emit(event)
        }
        peer.start(queue: self.queue) { peer.write(["protocol": 2, "code": call.getString("code") ?? "", "name": self.cleanName(call.getString("name") ?? "Explorer")]) }
        self.queue.asyncAfter(deadline: .now() + 8) { if !admitted { peer.close() } }
    } }
    @objc func send(_ call: CAPPluginCall) { queue.async {
        guard let payload = call.getObject("payload") else { call.reject("Missing payload."); return }
        if self.listener != nil {
            if payload["kind"] as? String == "position", let position = payload["position"] as? [String: Any] { guard self.validPosition(position) else { call.reject("Invalid position."); return }; self.positions["host"] = position }
            self.broadcast(["kind": "data", "roomId": self.roomID, "sender": "host", "payload": payload]); call.resolve()
        } else if let peer = self.upstream { peer.write(["payload": payload]); call.resolve() }
        else { call.reject("No nearby session is connected.") }
    } }
    @objc func discover(_ call: CAPPluginCall) { call.resolve(["rooms": [], "manualAddress": true]) }
    @objc func disconnect(_ call: CAPPluginCall) { queue.async { self.stopRoom(); call.resolve() } }
}

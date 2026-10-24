package com.sciblox.learning;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.*;

/** Direct LAN co-op: UDP room discovery and a host-authoritative TCP room. */
@CapacitorPlugin(name = "LocalMultiplayer")
public class LocalMultiplayerPlugin extends Plugin {
    private static final int PORT=18947, DISCOVERY_PORT=18948, PROTOCOL=2;
    private static final String DISCOVER="SCIBLOX_DISCOVER_V1", SERVICE="sciblox-lan-v1";
    private final ExecutorService io=Executors.newCachedThreadPool();
    private final ScheduledExecutorService heartbeat=Executors.newSingleThreadScheduledExecutor();
    private final Map<String,Peer> peers=new ConcurrentHashMap<>();
    private final Map<String,JSONObject> positions=new ConcurrentHashMap<>();
    private volatile ServerSocket server;
    private volatile DatagramSocket discovery;
    private volatile Peer upstream;
    private volatile String roomCode, roomId;
    private volatile String hostName="Explorer";
    private volatile long generation=0;
    private volatile boolean scanning=false;

    private static class Peer {
        final String id;
        String name;
        final Socket socket;
        final BufferedReader reader;
        final BufferedWriter writer;
        volatile long lastSeen=System.currentTimeMillis();
        Peer(String id,String name,Socket socket) throws IOException {
            this.id=id;this.name=name;this.socket=socket;
            reader=new BufferedReader(new InputStreamReader(socket.getInputStream(),StandardCharsets.UTF_8));
            writer=new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(),StandardCharsets.UTF_8));
        }
        synchronized void write(JSONObject data) throws IOException {
            writer.write(data.toString());writer.newLine();writer.flush();
        }
        void close(){try{socket.close();}catch(IOException ignored){}}
    }

    @Override public void load(){
        heartbeat.scheduleWithFixedDelay(()->io.execute(this::checkConnections),5,5,TimeUnit.SECONDS);
    }

    @PluginMethod public void host(PluginCall call){
        io.execute(()->{
            stop();
            final long session=generation;
            boolean resolved=false;
            ServerSocket listener=null;
            try{
                hostName=cleanName(call.getString("name","Explorer"));
                roomCode=String.format(Locale.US,"%06d",new SecureRandom().nextInt(1000000));
                roomId=UUID.randomUUID().toString();
                listener=new ServerSocket();
                listener.setReuseAddress(true);listener.bind(new InetSocketAddress(PORT));server=listener;
                boolean discoveryReady=startDiscovery(session);
                JSObject result=new JSObject();
                result.put("code",roomCode);result.put("roomId",roomId);result.put("addresses",addresses());
                result.put("port",PORT);result.put("discoveryAvailable",discoveryReady);
                call.resolve(result);resolved=true;roster(session);
                while(session==generation&&server==listener&&!listener.isClosed()){
                    Socket socket=listener.accept();io.execute(()->accept(socket,session));
                }
            }catch(Exception error){
                if(!resolved){stop();call.reject("Cannot host on this phone: "+friendly(error));}
                else if(session==generation){String oldRoom=roomId;stop();emitDisconnected(oldRoom,"The local room closed. Host again to continue with friends.");}
            }finally{if(listener!=null)try{listener.close();}catch(IOException ignored){}}
        });
    }

    private void accept(Socket socket,long session){
        Peer peer=null;
        try{
            socket.setSoTimeout(5000);socket.setTcpNoDelay(true);socket.setKeepAlive(true);
            peer=new Peer(UUID.randomUUID().toString(),"Explorer",socket);
            JSONObject hello=readObject(peer);
            if(hello==null)throw new IOException("Missing handshake.");
            if(hello.optInt("protocol")!=PROTOCOL){rejectPeer(peer,"Both phones need the same updated SciBlox app.");return;}
            if(!Objects.equals(roomCode,hello.optString("code"))){rejectPeer(peer,"Room code does not match.");return;}
            peer.name=cleanName(hello.optString("name","Explorer"));
            synchronized(this){
                if(session!=generation||server==null){peer.close();return;}
                if(peers.size()>=3){rejectPeer(peer,"This expedition is full (four players).");return;}
                peers.put(peer.id,peer);
            }
            socket.setSoTimeout(0);
            peer.write(new JSONObject().put("kind","welcome").put("id",peer.id).put("roomId",roomId).put("protocol",PROTOCOL));
            roster(session);
            final Peer accepted=peer;io.execute(()->readGuest(accepted,session));
        }catch(Exception error){
            if(peer!=null){peer.close();peers.remove(peer.id);positions.remove(peer.id);if(session==generation)roster(session);}
            else try{socket.close();}catch(IOException ignored){}
        }
    }

    private void rejectPeer(Peer peer,String message) throws Exception {
        peer.write(new JSONObject().put("kind","error").put("message",message));peer.close();
    }

    private void readGuest(Peer peer,long session){
        try{
            JSONObject input;
            while(session==generation&&(input=readObject(peer))!=null){
                peer.lastSeen=System.currentTimeMillis();
                if("pong".equals(input.optString("kind")))continue;
                JSONObject payload=input.optJSONObject("payload");if(payload==null)continue;
                String kind=payload.optString("kind");
                if(!Arrays.asList("position","action","sync-request").contains(kind))continue;
                JSONObject message=new JSONObject().put("type","message").put("kind","data").put("roomId",roomId).put("sender",peer.id).put("payload",payload);
                if("position".equals(kind)){
                    JSONObject pos=payload.optJSONObject("position");
                    if(!validPosition(pos))continue;
                    positions.put(peer.id,pos);emit(message);broadcast(message,peer.id);
                }else emit(message);
            }
        }catch(Exception ignored){}
        finally{
            peer.close();peers.remove(peer.id);positions.remove(peer.id);
            if(session==generation)roster(session);
        }
    }

    @PluginMethod public void join(PluginCall call){
        io.execute(()->{
            stop();
            final long session=generation;
            Peer peer=null;
            try{
                String address=call.getString("address","").trim();
                if(!address.matches("[0-9]{1,3}(\\.[0-9]{1,3}){3}"))throw new IOException("Enter the host's local IPv4 address.");
                InetAddress ip=InetAddress.getByName(address);
                if(!ip.isSiteLocalAddress()&&!ip.isLinkLocalAddress())throw new IOException("Use a local Wi-Fi or hotspot address.");
                Socket socket=new Socket();socket.connect(new InetSocketAddress(ip,PORT),5000);
                socket.setSoTimeout(5000);socket.setTcpNoDelay(true);socket.setKeepAlive(true);
                peer=new Peer("host","Host",socket);upstream=peer;
                peer.write(new JSONObject().put("protocol",PROTOCOL).put("code",call.getString("code","")).put("name",cleanName(call.getString("name","Explorer"))));
                JSONObject welcome=readObject(peer);
                if(welcome==null||!"welcome".equals(welcome.optString("kind")))throw new IOException(welcome==null?"The host closed the connection.":welcome.optString("message","The host could not accept this connection."));
                roomId=welcome.getString("roomId");socket.setSoTimeout(0);
                JSObject result=new JSObject();result.put("id",welcome.getString("id"));result.put("roomId",roomId);result.put("port",PORT);call.resolve(result);
                final Peer connected=peer;io.execute(()->readHost(connected,session));
            }catch(Exception error){
                if(peer!=null)peer.close();stop();call.reject("Could not join: "+friendly(error));
            }
        });
    }

    private void readHost(Peer peer,long session){
        final String connectedRoom=roomId;
        try{
            JSONObject message;
            while(session==generation&&(message=readObject(peer))!=null){
                peer.lastSeen=System.currentTimeMillis();
                if("ping".equals(message.optString("kind"))){peer.write(new JSONObject().put("kind","pong"));continue;}
                if(!connectedRoom.equals(message.optString("roomId")))continue;
                if("roster".equals(message.optString("kind")))message.put("type","roster");
                else message.put("type","message");
                emit(message);
            }
        }catch(Exception ignored){}
        finally{
            peer.close();
            if(session==generation){upstream=null;roomId=null;emitDisconnected(connectedRoom,"The host disconnected. Reconnect to the hotspot and join again. Your solo progress is unchanged.");}
        }
    }

    @PluginMethod public void send(PluginCall call){
        final long session=generation;
        io.execute(()->{
            try{
                JSObject payload=call.getObject("payload");if(payload==null){call.reject("Missing payload");return;}
                if(session!=generation){call.reject("The previous local room has closed.");return;}
                if(server!=null){
                    if("position".equals(payload.optString("kind"))){
                        JSONObject pos=payload.optJSONObject("position");if(!validPosition(pos)){call.reject("Invalid player position.");return;}positions.put("host",pos);
                    }
                    broadcast(new JSONObject().put("kind","data").put("roomId",roomId).put("sender","host").put("payload",payload),null);
                }else if(upstream!=null)upstream.write(new JSONObject().put("payload",payload));
                else{call.reject("No local room is connected.");return;}
                call.resolve();
            }catch(Exception error){call.reject("Local connection interrupted. Check that both phones are still on the same hotspot.");}
        });
    }

    private boolean startDiscovery(long session){
        try{
            DatagramSocket socket=new DatagramSocket(null);socket.setReuseAddress(true);
            socket.bind(new InetSocketAddress(DISCOVERY_PORT));socket.setBroadcast(true);socket.setSoTimeout(1000);discovery=socket;
            io.execute(()->{
                byte[] buffer=new byte[1024];
                while(session==generation&&discovery==socket&&!socket.isClosed()){
                    try{
                        DatagramPacket packet=new DatagramPacket(buffer,buffer.length);socket.receive(packet);
                        String request=new String(packet.getData(),packet.getOffset(),packet.getLength(),StandardCharsets.UTF_8);
                        if(!DISCOVER.equals(request)||server==null)continue;
                        byte[] response=new JSONObject().put("service",SERVICE).put("protocol",PROTOCOL).put("name",hostName).put("players",peers.size()+1).put("capacity",4).put("port",PORT).toString().getBytes(StandardCharsets.UTF_8);
                        socket.send(new DatagramPacket(response,response.length,packet.getAddress(),packet.getPort()));
                    }catch(SocketTimeoutException ignored){}catch(Exception error){if(!socket.isClosed())break;}
                }
                socket.close();
            });return true;
        }catch(Exception ignored){discovery=null;return false;}
    }

    @PluginMethod public void discover(PluginCall call){
        synchronized(this){if(scanning){call.reject("A nearby scan is already running.");return;}scanning=true;}
        io.execute(()->{
            final long session=generation;
            try(DatagramSocket socket=new DatagramSocket()){
                socket.setBroadcast(true);socket.setSoTimeout(180);
                Set<InetAddress> targets=discoveryTargets();
                if(targets.size()<=1)throw new IOException("Connect this phone to the host's Wi-Fi or hotspot first.");
                byte[] request=DISCOVER.getBytes(StandardCharsets.UTF_8),buffer=new byte[4096];
                Map<String,JSONObject> found=new LinkedHashMap<>();
                long started=System.currentTimeMillis(),nextProbe=0;
                while(session==generation&&System.currentTimeMillis()-started<3800){
                    long elapsed=System.currentTimeMillis()-started;
                    if(elapsed>=nextProbe){
                        for(InetAddress target:targets)try{socket.send(new DatagramPacket(request,request.length,target,DISCOVERY_PORT));}catch(IOException ignored){}
                        nextProbe=elapsed+1250;
                    }
                    try{
                        DatagramPacket packet=new DatagramPacket(buffer,buffer.length);socket.receive(packet);
                        JSONObject response=new JSONObject(new String(packet.getData(),packet.getOffset(),packet.getLength(),StandardCharsets.UTF_8));
                        if(!SERVICE.equals(response.optString("service"))||response.optInt("protocol")!=PROTOCOL)continue;
                        String address=packet.getAddress().getHostAddress();
                        response.put("address",address);response.put("name",cleanName(response.optString("name","Explorer")));found.put(address,response);
                    }catch(SocketTimeoutException ignored){}catch(org.json.JSONException ignored){}
                }
                JSObject result=new JSObject();result.put("rooms",new JSONArray(found.values()));call.resolve(result);
            }catch(Exception error){call.reject("Could not find nearby rooms: "+friendly(error)+" You can still enter the host address.");}
            finally{scanning=false;}
        });
    }

    private Set<InetAddress> discoveryTargets() throws Exception {
        Set<InetAddress> targets=new LinkedHashSet<>();targets.add(InetAddress.getByName("255.255.255.255"));
        Enumeration<NetworkInterface> interfaces=NetworkInterface.getNetworkInterfaces();
        if(interfaces==null)return targets;
        while(interfaces.hasMoreElements()){
            NetworkInterface network=interfaces.nextElement();if(!network.isUp()||network.isLoopback())continue;
            for(InterfaceAddress item:network.getInterfaceAddresses()){
                InetAddress ip=item.getAddress();
                if(!(ip instanceof Inet4Address)||!ip.isSiteLocalAddress())continue;
                if(item.getBroadcast()!=null)targets.add(item.getBroadcast());
                // Android hotspot gateway addresses are not always .1. Probe the
                // phone's local /24 as well when hotspot firmware drops broadcasts.
                byte[] own=ip.getAddress();
                for(int suffix=1;suffix<255;suffix++){byte[] target=own.clone();target[3]=(byte)suffix;targets.add(InetAddress.getByAddress(target));}
            }
        }
        return targets;
    }

    private void checkConnections(){
        long now=System.currentTimeMillis();
        if(server!=null){
            for(Peer peer:peers.values()){
                if(now-peer.lastSeen>22000){peer.close();continue;}
                try{peer.write(new JSONObject().put("kind","ping"));}catch(Exception ignored){peer.close();}
            }
        }else if(upstream!=null&&now-upstream.lastSeen>22000)upstream.close();
    }
    private JSONObject readObject(Peer peer) throws Exception {
        String line=peer.reader.readLine();if(line==null)return null;
        if(line.length()>1000000)throw new IOException("Local message is too large.");
        return new JSONObject(line);
    }
    private boolean validPosition(JSONObject pos){
        if(pos==null)return false;
        double x=pos.optDouble("x",Double.NaN),y=pos.optDouble("y",Double.NaN);
        return Double.isFinite(x)&&Double.isFinite(y);
    }
    private void roster(long session){
        if(session!=generation||server==null)return;
        try{
            JSONArray players=new JSONArray();players.put(player("host",hostName));
            for(Peer peer:peers.values())players.put(player(peer.id,peer.name));
            JSONObject data=new JSONObject().put("type","roster").put("kind","roster").put("roomId",roomId).put("players",players);
            emit(data);broadcast(data,null);
        }catch(Exception ignored){}
    }
    private JSONObject player(String id,String name) throws Exception {
        JSONObject result=new JSONObject().put("id",id).put("name",name);
        JSONObject position=positions.get(id);
        if(position!=null){Iterator<String> keys=position.keys();while(keys.hasNext()){String key=keys.next();if(!"id".equals(key)&&!"name".equals(key))result.put(key,position.get(key));}}
        return result;
    }
    private void broadcast(JSONObject data,String exclude){
        for(Peer peer:peers.values())if(!peer.id.equals(exclude))try{peer.write(data);}catch(Exception ignored){peer.close();}
    }
    private void emit(JSONObject data){try{notifyListeners("event",new JSObject(data.toString()));}catch(Exception ignored){}}
    private void emitDisconnected(String oldRoom,String message){emit(new JSObject().put("type","disconnected").put("roomId",oldRoom).put("message",message));}
    private JSONArray addresses() throws SocketException {
        JSONArray list=new JSONArray();Enumeration<NetworkInterface> interfaces=NetworkInterface.getNetworkInterfaces();if(interfaces==null)return list;
        while(interfaces.hasMoreElements()){
            NetworkInterface network=interfaces.nextElement();if(!network.isUp()||network.isLoopback())continue;
            Enumeration<InetAddress> ips=network.getInetAddresses();
            while(ips.hasMoreElements()){InetAddress ip=ips.nextElement();if(ip instanceof Inet4Address&&ip.isSiteLocalAddress())list.put(ip.getHostAddress());}
        }
        return list;
    }
    private String friendly(Exception error){
        if(error instanceof SocketTimeoutException)return "The host did not respond. Check the hotspot and keep its game open.";
        if(error instanceof ConnectException)return "No expedition is listening at that address. Ask the host to start a room.";
        return error.getMessage()==null?error.getClass().getSimpleName():error.getMessage();
    }
    private String cleanName(String name){String value=name.replaceAll("[\\r\\n]","").trim();return value.isEmpty()?"Explorer":value.substring(0,Math.min(24,value.length()));}
    private synchronized void stop(){
        generation++;
        if(discovery!=null)discovery.close();discovery=null;
        try{if(server!=null)server.close();}catch(IOException ignored){}server=null;
        if(upstream!=null)upstream.close();upstream=null;
        for(Peer peer:peers.values())peer.close();peers.clear();positions.clear();roomId=null;roomCode=null;
    }
    @PluginMethod public void disconnect(PluginCall call){stop();call.resolve();}
    @Override protected void handleOnDestroy(){stop();heartbeat.shutdownNow();io.shutdownNow();}
}


package com.sciblox.learning;

import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

/** A paired, local-network record receiver; no cloud endpoint or subscription. */
@CapacitorPlugin(name="Classroom")
public class ClassroomPlugin extends Plugin {
    private static final int PORT=18949, DISCOVERY=18950, LIMIT=65536;
    private final ExecutorService io=Executors.newCachedThreadPool();
    private volatile ServerSocket server;
    private volatile DatagramSocket radio;
    private volatile String classId="",code="",name="SciBlox classroom";
    private final Object recordLock=new Object();

    @PluginMethod public void start(PluginCall call){io.execute(()->{
        try{stopReceiver();classId=call.getString("classId","");code=call.getString("code","");name=call.getString("name","SciBlox classroom");
            if(!classId.matches("[\\w-]{8,80}")||!code.matches("\\d{6}"))throw new IOException("Invalid classroom identity.");
            ServerSocket listener=new ServerSocket();listener.setReuseAddress(true);listener.bind(new InetSocketAddress(PORT));server=listener;
            io.execute(()->accept(listener));startRadio();
            JSObject result=new JSObject();result.put("classId",classId);result.put("addresses",addresses());result.put("port",PORT);call.resolve(result);
        }catch(Exception e){stopReceiver();call.reject("Could not open classroom: "+e.getMessage());}
    });}
    @PluginMethod public void stop(PluginCall call){stopReceiver();call.resolve();}
    private void stopReceiver(){try{if(server!=null)server.close();}catch(Exception ignored){}try{if(radio!=null)radio.close();}catch(Exception ignored){}server=null;radio=null;}
    private void accept(ServerSocket listener){while(server==listener&&!listener.isClosed()){try{Socket socket=listener.accept();io.execute(()->receive(socket));}catch(IOException e){break;}}}
    private String line(InputStream input)throws IOException {ByteArrayOutputStream data=new ByteArrayOutputStream();int value;while((value=input.read())!=-1&&value!='\n'){if(data.size()>=LIMIT)throw new IOException("Record too large.");data.write(value);}if(data.size()==0)throw new IOException("Empty record.");return data.toString(StandardCharsets.UTF_8.name());}
    private void reply(Socket socket,JSONObject value)throws Exception{socket.getOutputStream().write((value.toString()+"\n").getBytes(StandardCharsets.UTF_8));socket.getOutputStream().flush();}
    private void receive(Socket socket){try(Socket s=socket){s.setSoTimeout(5000);JSONObject request=new JSONObject(line(s.getInputStream()));
        if(!code.equals(request.optString("code"))||request.has("classId")&&!classId.equals(request.optString("classId"))){reply(s,new JSONObject().put("ok",false).put("message","Check the class code and teacher address."));return;}
        if(!request.optBoolean("checkOnly")){JSONObject record=clean(request.getJSONObject("record"));
            synchronized(recordLock){JSONObject saved=readRecords();JSONObject previous=saved.optJSONObject(record.getString("id"));
                if(previous==null||previous.optLong("revision")<record.getLong("revision")){
                    if(previous==null&&saved.length()>=2000)throw new IOException("Class record limit reached.");
                    record.put("receivedAt",System.currentTimeMillis());saved.put(record.getString("id"),record);
                    if(!getContext().getSharedPreferences("sciblox-classroom",0).edit().putString("records:"+classId,saved.toString()).commit())throw new IOException("Teacher storage is full.");
                }
            }
        }
        reply(s,new JSONObject().put("ok",true).put("classId",classId));
    }catch(Exception ignored){/* No acknowledgement: learner retains its pending revision. */}}
    private JSONObject readRecords(){try{return new JSONObject(getContext().getSharedPreferences("sciblox-classroom",0).getString("records:"+classId,"{}"));}catch(Exception e){return new JSONObject();}}
    @PluginMethod public void records(PluginCall call){synchronized(recordLock){JSONObject values=readRecords();JSONArray rows=new JSONArray();Iterator<String> keys=values.keys();while(keys.hasNext())rows.put(values.optJSONObject(keys.next()));JSObject result=new JSObject();result.put("records",rows);call.resolve(result);}}
    private JSONObject clean(JSONObject r)throws Exception{
        String id=r.optString("id"),player=r.optString("name").trim();long revision=r.optLong("revision"),xp=r.optLong("xp");
        if(r.optInt("schema")!=1||!id.matches("[\\w-]{8,80}")||player.isEmpty()||player.length()>24||revision<1||revision>9007199254740991L||xp<0||xp>=100000000)throw new IOException("Invalid learner record.");
        JSONArray completed=r.getJSONArray("completed"),scores=r.getJSONArray("scores");if(completed.length()>8||scores.length()>8)throw new IOException("Invalid station records.");
        JSONArray cleanCompleted=new JSONArray(),cleanScores=new JSONArray();Set<Integer> unique=new HashSet<>();
        for(int i=0;i<completed.length();i++){int station=completed.getInt(i);if(station<0||station>7)throw new IOException("Invalid station.");if(unique.add(station))cleanCompleted.put(station);}
        unique.clear();for(int i=0;i<scores.length();i++){JSONObject score=scores.getJSONObject(i);int station=score.getInt("station");if(station<0||station>7||!unique.add(station))throw new IOException("Invalid score station.");JSONObject row=new JSONObject().put("station",station);for(String kind:new String[]{"pre","post"}){if(score.isNull(kind))row.put(kind,JSONObject.NULL);else{int value=score.getInt(kind);if(value<0||value>10)throw new IOException("Invalid score.");row.put(kind,value);}}cleanScores.put(row);}
        return new JSONObject().put("schema",1).put("id",id).put("name",player).put("revision",revision).put("xp",xp).put("completed",cleanCompleted).put("scores",cleanScores).put("picture",r.optString("picture","nova")).put("gender",r.optString("gender","unspecified"));
    }
    @PluginMethod public void upload(PluginCall call){io.execute(()->{try{
        String local=call.getString("address","");if(!local.matches("[0-9]{1,3}(\\.[0-9]{1,3}){3}"))throw new IOException("Enter the teacher’s local IPv4 address.");
        InetAddress address=InetAddress.getByName(local);if(!(address instanceof Inet4Address)||!address.isSiteLocalAddress()&&!address.isLinkLocalAddress())throw new IOException("Use the teacher’s local Wi-Fi address.");
        try(Socket socket=new Socket()){socket.connect(new InetSocketAddress(address,PORT),3500);socket.setSoTimeout(5000);
            JSONObject request=new JSONObject().put("code",call.getString("code","")).put("checkOnly",call.getBoolean("checkOnly",false));String expected=call.getString("classId");if(expected!=null)request.put("classId",expected);
            if(!request.optBoolean("checkOnly"))request.put("record",clean(call.getObject("record",new JSObject())));
            reply(socket,request);JSONObject response=new JSONObject(line(socket.getInputStream()));if(!response.optBoolean("ok"))throw new IOException(response.optString("message","Could not sync."));call.resolve(JSObject.fromJSONObject(response));
        }
    }catch(Exception e){call.reject("Classroom unavailable: "+e.getMessage());}});}
    private JSONArray addresses()throws SocketException{JSONArray result=new JSONArray();Enumeration<NetworkInterface> all=NetworkInterface.getNetworkInterfaces();while(all!=null&&all.hasMoreElements()){NetworkInterface network=all.nextElement();if(!network.isUp()||network.isLoopback())continue;for(InterfaceAddress item:network.getInterfaceAddresses())if(item.getAddress() instanceof Inet4Address&&item.getAddress().isSiteLocalAddress())result.put(item.getAddress().getHostAddress());}return result;}
    private void startRadio(){try{DatagramSocket socket=new DatagramSocket(null);socket.setReuseAddress(true);socket.bind(new InetSocketAddress(DISCOVERY));socket.setSoTimeout(1000);radio=socket;io.execute(()->{byte[] buffer=new byte[512];while(radio==socket&&!socket.isClosed()){try{DatagramPacket packet=new DatagramPacket(buffer,buffer.length);socket.receive(packet);String query=new String(packet.getData(),0,packet.getLength(),StandardCharsets.UTF_8);if(!"SCIBLOX_CLASSROOM_V1".equals(query))continue;byte[] data=new JSONObject().put("service","sciblox-classroom-v1").put("classId",classId).put("name",name).toString().getBytes(StandardCharsets.UTF_8);socket.send(new DatagramPacket(data,data.length,packet.getAddress(),packet.getPort()));}catch(SocketTimeoutException ignored){}catch(Exception e){break;}}});}catch(Exception ignored){}}
    @PluginMethod public void discover(PluginCall call){io.execute(()->{try(DatagramSocket socket=new DatagramSocket()){
        socket.setBroadcast(true);socket.setSoTimeout(200);Set<InetAddress> targets=new HashSet<>();targets.add(InetAddress.getByName("255.255.255.255"));
        Enumeration<NetworkInterface> all=NetworkInterface.getNetworkInterfaces();while(all!=null&&all.hasMoreElements()){NetworkInterface net=all.nextElement();if(!net.isUp()||net.isLoopback())continue;for(InterfaceAddress item:net.getInterfaceAddresses())if(item.getAddress() instanceof Inet4Address&&item.getAddress().isSiteLocalAddress()){if(item.getBroadcast()!=null)targets.add(item.getBroadcast());byte[] own=item.getAddress().getAddress();for(int n=1;n<255;n++){byte[] probe=own.clone();probe[3]=(byte)n;targets.add(InetAddress.getByAddress(probe));}}}
        byte[] query="SCIBLOX_CLASSROOM_V1".getBytes(StandardCharsets.UTF_8);for(InetAddress target:targets)try{socket.send(new DatagramPacket(query,query.length,target,DISCOVERY));}catch(Exception ignored){}
        Map<String,JSONObject> found=new LinkedHashMap<>();long until=System.currentTimeMillis()+2200;byte[] buffer=new byte[4096];while(System.currentTimeMillis()<until){try{DatagramPacket packet=new DatagramPacket(buffer,buffer.length);socket.receive(packet);JSONObject room=new JSONObject(new String(packet.getData(),0,packet.getLength(),StandardCharsets.UTF_8));if(!"sciblox-classroom-v1".equals(room.optString("service")))continue;String address=packet.getAddress().getHostAddress();room.put("address",address);found.put(address,room);}catch(SocketTimeoutException ignored){}catch(JSONException ignored){}}
        JSObject result=new JSObject();result.put("rooms",new JSONArray(found.values()));call.resolve(result);
    }catch(Exception e){call.reject("Could not find classrooms. Enter the teacher address instead.");}});}
    @Override protected void handleOnDestroy(){stopReceiver();io.shutdownNow();}
}

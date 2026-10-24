// Run against emulator-5554 after forwarding WebView CDP to 9222,
// TCP 18947 to 18947, and emulator UDP 18949 to 18948.
// This exercises actual native Java sockets, not a browser connection mock.
import assert from 'node:assert/strict';
import net from 'node:net';
import dgram from 'node:dgram';
import {once} from 'node:events';
import {spawnSync} from 'node:child_process';
import {EMPTY} from '../src/journey-state.js';
const adb='C:/Users/kyahn/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const targets=await (await fetch('http://127.0.0.1:9222/json')).json();
const target=targets.find(item=>item.url==='https://localhost/');
assert.ok(target,'Native app WebView is available');
const ws=new WebSocket(target.webSocketDebuggerUrl);await once(ws,'open');
let serial=0;
const waiting=new Map();
ws.addEventListener('message',event=>{
 const message=JSON.parse(event.data);if(message.id&&waiting.has(message.id)){waiting.get(message.id)(message);waiting.delete(message.id)}
});
function command(method,params={}){
 const id=++serial;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{waiting.delete(id);reject(Error('CDP timed out: '+method))},12000);
  waiting.set(id,message=>{clearTimeout(timer);message.error?reject(Error(message.error.message)):resolve(message.result)});
  ws.send(JSON.stringify({id,method,params}));
 });
}
async function evaluate(expression){
 const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
 return result.result.value;
}
const native=(method,args={})=>evaluate("window.Capacitor.nativePromise('LocalMultiplayer',"+JSON.stringify(method)+','+JSON.stringify(args)+')');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){
 for(let i=0;i<60;i++){const value=await fn();if(value)return value;await pause(100)}
 throw Error('Timed out: '+label);
}
function collect(socket){
 const messages=[];let buffer='';
 socket.on('data',chunk=>{
  buffer+=chunk.toString();let end;
  while((end=buffer.indexOf('\n'))>=0){const message=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);messages.push(message);if(message.kind==='ping')socket.write(JSON.stringify({kind:'pong'})+'\n')}
 });return messages;
}
function receiveUDP(socket){
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{socket.removeListener('message',onMessage);reject(Error('UDP room discovery timed out'))},5000);
  const onMessage=(data,remote)=>{clearTimeout(timer);resolve({data:JSON.parse(data.toString()),remote})};socket.once('message',onMessage);
 });
}
const report={};let peer,peerTwo,udp,advertiser,fakeHost,fakeUpstream;
try{
 await evaluate("window.__lanEvents=[];window.__lanListener=window.Capacitor.nativeCallback('LocalMultiplayer','addListener',{eventName:'event'},event=>window.__lanEvents.push(event));true");
 const room=await native('host',{name:'Native LAN host'});
 assert.match(room.code,/^\d{6}$/);assert.ok(room.roomId);assert.equal(room.discoveryAvailable,true);
 udp=dgram.createSocket('udp4');await new Promise(resolve=>udp.bind(0,'127.0.0.1',resolve));
 const udpResult=receiveUDP(udp);udp.send(Buffer.from('SCIBLOX_DISCOVER_V1'),18949,'127.0.0.1');
 const advertisement=(await udpResult).data;
 assert.equal(advertisement.service,'sciblox-lan-v1');assert.equal(advertisement.name,'Native LAN host');assert.equal(advertisement.protocol,2);report.nativeUDPResponder=true;
 peer=net.createConnection({host:'127.0.0.1',port:18947});const messages=collect(peer);await once(peer,'connect');
 peer.write(JSON.stringify({protocol:2,code:room.code,name:'Independent explorer'})+'\n');
 const welcome=await until(()=>messages.find(message=>message.kind==='welcome'),'native TCP welcome');
 assert.equal(welcome.roomId,room.roomId);assert.ok(welcome.id);
 await until(()=>messages.find(message=>message.kind==='roster'&&message.players.length===2),'two-player native roster');
 const position={x:55,y:31,walking:true,facing:'left',outfit:'Scarf',runId:'socket-test',sequence:7};
 peer.write(JSON.stringify({payload:{kind:'position',position}})+'\n');
 await until(()=>evaluate("window.__lanEvents.find(e=>e.sender==="+JSON.stringify(welcome.id)+"&&e.payload?.position?.sequence===7)"),'independent position delivery');
 await native('send',{payload:{kind:'snapshot',sequence:1,state:{...structuredClone(EMPTY),intro:true,assessment:{pre:4,post:null}},view:'map'}});
 await until(()=>messages.find(message=>message.payload?.kind==='snapshot'),'native broadcast snapshot');report.nativeTCPHandshakeAndSnapshot=true;
 peerTwo=net.createConnection({host:'127.0.0.1',port:18947});const second=collect(peerTwo);await once(peerTwo,'connect');
 peerTwo.write(JSON.stringify({protocol:2,code:room.code,name:'Second explorer'})+'\n');
 const roster=await until(()=>second.find(message=>message.kind==='roster'&&message.players.length===3),'late-join roster');
 const remote=roster.players.find(player=>player.id===welcome.id);
 assert.equal(remote.x,55);assert.equal(remote.walking,true);assert.equal(remote.facing,'left');report.lateJoinMovementMetadata=true;
 peer.end();await until(()=>second.find(message=>message.kind==='roster'&&message.players.length===2),'native disconnect roster');report.nativeDisconnectRoster=true;
 peerTwo.end();await native('disconnect');udp.close();udp=null;
 // Test native scanning against a real UDP advertiser on the emulator host.
 advertiser=dgram.createSocket('udp4');
 advertiser.on('message',(data,remote)=>{
  if(data.toString()==='SCIBLOX_DISCOVER_V1')advertiser.send(Buffer.from(JSON.stringify({service:'sciblox-lan-v1',protocol:2,name:'Gateway expedition',players:1,capacity:4,port:18947})),remote.port,remote.address);
 });
 await new Promise(resolve=>advertiser.bind(18948,'127.0.0.1',resolve));
 const discovered=await native('discover');
 const found=discovered.rooms.find(item=>item.name==='Gateway expedition');
 assert.ok(found,'Native scan discovered actual gateway UDP responder');assert.equal(found.address,'10.0.2.2');report.nativeUDPScanner=true;
 advertiser.close();advertiser=null;
 spawnSync(adb,['-s','emulator-5554','forward','--remove','tcp:18947'],{encoding:'utf8'});
 // Test native guest connection, action forwarding and host-loss notification.
 const incoming=[];
 fakeHost=net.createServer(socket=>{
  fakeUpstream=socket;let buffer='',handshake=false;
  socket.on('data',chunk=>{
   buffer+=chunk;let end;
   while((end=buffer.indexOf('\n'))>=0){
    const message=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);incoming.push(message);
    if(!handshake){handshake=true;socket.write(JSON.stringify({kind:'welcome',protocol:2,id:'native-guest',roomId:'fake-host-room'})+'\n');socket.write(JSON.stringify({kind:'roster',roomId:'fake-host-room',players:[{id:'host',name:'Gateway host'},{id:'native-guest',name:'Native guest'}]})+'\n')}
   }
  });
 });
 await new Promise(resolve=>fakeHost.listen(18947,'127.0.0.1',resolve));
 const guest=await native('join',{address:'10.0.2.2',code:'123456',name:'Native guest'});
 assert.equal(guest.id,'native-guest');assert.equal(guest.roomId,'fake-host-room');assert.equal(incoming[0].protocol,2);
 await native('send',{payload:{kind:'action',actionId:'test-action',action:{type:'REVIEW_NEXT',runId:'test-run',round:0,phase:'review',scene:0}}});
 await until(()=>incoming.find(message=>message.payload?.actionId==='test-action'),'native guest action forwarded');report.nativeGuestJoinAndSend=true;
 fakeUpstream.end();
 await until(()=>evaluate("window.__lanEvents.find(e=>e.type==='disconnected'&&e.roomId==='fake-host-room')"),'host loss event');report.hostLossNotification=true;
 console.log(JSON.stringify({...report,limit:'Real native Java TCP/UDP with emulator NAT and PC socket peers. Two physical phones over hotspot still require testing.'},null,2));
}finally{
 try{await native('disconnect')}catch{}
 peer?.destroy();peerTwo?.destroy();fakeUpstream?.destroy();udp?.close();advertiser?.close();fakeHost?.close();ws.close();
 spawnSync(adb,['-s','emulator-5554','forward','tcp:18947','tcp:18947'],{encoding:'utf8'});
}


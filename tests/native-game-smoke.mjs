// Integrated native UI + real TCP peer smoke test. Requires the Android test app
// on emulator-5554, its WebView on CDP9222, and TCP18947 forwarded to TCP18947.
import fs from 'node:fs';
import net from 'node:net';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {EMPTY} from '../src/journey-state.js';
import {activityCatalog} from '../src/station-activities-data.js';
import {assessmentQuestions} from '../src/station-assessments.js';
import {EGG_QUESTIONS} from '../src/journey-data.js';
const targets=await (await fetch('http://127.0.0.1:9222/json')).json();
const target=targets.find(item=>item.url==='https://localhost/');
assert.ok(target,'SciBlox Android WebView is available');
const ws=new WebSocket(target.webSocketDebuggerUrl);await once(ws,'open');
let serial=0,actionId=0;
const waiting=new Map(),errors=[];
ws.addEventListener('message',event=>{
 const message=JSON.parse(event.data);
 if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
 if(message.id&&waiting.has(message.id)){waiting.get(message.id)(message);waiting.delete(message.id)}
});
function command(method,params={}){
 const id=++serial;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{waiting.delete(id);reject(Error('CDP timed out: '+method))},45000);
  waiting.set(id,message=>{clearTimeout(timer);message.error?reject(Error(message.error.message)):resolve(message.result)});
  ws.send(JSON.stringify({id,method,params}));
 });
}
async function evaluate(expression){
 const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
 return result.result.value;
}
const native=(plugin,method,args={})=>evaluate('window.Capacitor.nativePromise('+JSON.stringify(plugin)+','+JSON.stringify(method)+','+JSON.stringify(args)+')');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){
 console.log('Native check: '+label);
 for(let i=0;i<90;i++){const value=await fn();if(value)return value;await pause(100)}
 throw Error('Timed out: '+label);
}
async function clickText(text,scope='document'){
 if(text==='Adventure map'&&await evaluate("!!document.querySelector('[aria-label=\"Pause menu\"]')&&!document.querySelector('[role=dialog]')"))await clickText('Pause menu');
 await evaluate('(()=>{const button=[...'+scope+'.querySelectorAll("button")].find(b=>!b.disabled&&(b.textContent.trim().includes('+JSON.stringify(text)+')||b.getAttribute("aria-label")==='+JSON.stringify(text)+'));if(!button)throw Error("Missing enabled button: "+'+JSON.stringify(text)+');button.click();return true})()');
 await pause(120);
}
async function clickSelector(selector,index=0){
 await evaluate('(()=>{const button=document.querySelectorAll('+JSON.stringify(selector)+')['+index+'];if(!button||button.disabled)throw Error("Missing enabled control "+'+JSON.stringify(selector)+');button.click();return true})()');
 await pause(120);
}
const saved=()=>evaluate("JSON.parse(localStorage.getItem('sciblox-v1'))");
async function reload(){
 try{await evaluate('location.reload()')}catch{}
 await until(()=>evaluate("!!document.querySelector('.launch-play')"),'native title menu');
 await clickText('Play');
 await until(()=>evaluate("document.body?.innerText.includes('SciBlox expedition')"),'native adventure startup');
}
function connectPeer(code,name){
 const socket=net.createConnection({host:'127.0.0.1',port:18947}),messages=[];
 let buffer='';
 socket.on('data',chunk=>{
  buffer+=chunk.toString();let end;
  while((end=buffer.indexOf('\n'))>=0){
   const message=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);messages.push(message);
   if(message.kind==='ping')socket.write(JSON.stringify({kind:'pong'})+'\n');
  }
 });
 return once(socket,'connect').then(async()=>{
  socket.write(JSON.stringify({protocol:2,code,name})+'\n');
  const welcome=await until(()=>messages.find(m=>m.kind==='welcome'),'protocol2 welcome');
  await until(()=>messages.find(m=>m.payload?.kind==='snapshot'),'shared snapshot');
  return {socket,messages,id:welcome.id,roomId:welcome.roomId};
 });
}
function latest(peer){return [...peer.messages].reverse().find(message=>message.payload?.kind==='snapshot')?.payload}
function guestAction(peer,type,details={},context){
 const run=(context||latest(peer)?.state)?.run;assert.ok(run,'Guest has a shared run');
 peer.socket.write(JSON.stringify({payload:{kind:'action',actionId:'smoke-'+(++actionId),action:{type,runId:run.id,round:run.round,phase:run.phase,scene:run.scene,activeActivity:run.activeActivity,...details}}})+'\n');
}
function guestPosition(peer,position,sequence){
 peer.socket.write(JSON.stringify({payload:{kind:'position',position:{...position,sequence,runId:position.scope==='lobby'?'lobby':latest(peer).state.run.id}}})+'\n');
}
async function hostLobby(){
 await clickText('Adventure map');
 await clickText('Nearby multiplayer');
 await clickText('Host expedition');
 return until(()=>evaluate("document.querySelector('.room-code')?.textContent.trim()"),'host room code');
}
const report={};let peer;
try{
 await command('Runtime.enable');
 await until(()=>evaluate("typeof window.Capacitor?.nativePromise==='function'"),'native bridge');
 await native('Preferences','set',{key:'sciblox-smoke-check',value:'native-preferences-ok'});
 assert.equal((await native('Preferences','get',{key:'sciblox-smoke-check'})).value,'native-preferences-ok');
 await native('Preferences','remove',{key:'sciblox-smoke-check'});report.nativePreferences=true;
 const voice=await native('Narrator','speak',{text:'Every trait has a story.'});
 assert.equal(typeof voice.spoken,'boolean');await native('Narrator','stop');report.offlineNarratorGracefulResult=voice.spoken?'spoken':'captions-fallback';
 const seed={...structuredClone(EMPTY),name:'Native Mia',profileReady:true,intro:true,modeChosen:true,assessment:{pre:4,post:null},settings:{...EMPTY.settings,motion:true,sound:false}};
 await native('Preferences','set',{key:'sciblox-v1',value:JSON.stringify(seed)});await reload();
 report.nativeStartup=true;await until(async()=> !(await native('GameScreen','status')).landscape,'portrait home orientation');report.nativePortraitHome=true;
 assert.ok(await evaluate("performance.getEntriesByType('resource').every(resource=>new URL(resource.name).hostname==='localhost')"));
 assert.ok(await evaluate("document.querySelector('.header-logo')?.naturalWidth>0"));report.bundledLocalAssetsAndLogo=true;
 const code=await hostLobby();assert.match(code,/^\d{6}$/);
 peer=await connectPeer(code,'Hotspot friend');
 await until(()=>evaluate("document.body.innerText.includes('2/4 explorers')"),'visible player roster');report.protocol2HandshakeAndRoster=true;
 await clickText('Adventure map');
 await until(()=>evaluate("document.querySelector('.journey-hub3d .three-viewport')?.dataset.state==='ready'"),'native 3D hub');
 assert.equal(await evaluate("!!document.querySelector('.journey-hub3d canvas').getContext('webgl2')"),true);
 guestPosition(peer,{x:40,y:70,walking:true,facing:'left',scope:'lobby'},1);
 await until(()=>evaluate("document.querySelector('.journey-hub3d .world-player.remote')?.style.left==='40%'"),'independent nearby lobby position');
 report.native3DHubAndLobbyMovement=true;
 await clickText('Adventure map');await clickText('Continue adventure');
 await until(()=>latest(peer)?.state.run?.phase==='pretest','host pre-test snapshot');
 await until(async()=> (await native('GameScreen','status')).landscape,'landscape station orientation');report.nativeLandscapeGameplay=true;
 for(const [question,q]of assessmentQuestions(0).entries()){
  guestAction(peer,'STATION_ANSWER',{kind:'pre',question,answer:q.answer});
  await until(()=>latest(peer)?.state.run?.tests?.pre.answers.length===question+1,'shared station pre-test answer');
 }
 guestAction(peer,'STATION_ASSESS',{kind:'pre'});
 await until(()=>latest(peer)?.state.run?.phase==='review','host review snapshot');report.sharedStationPreTest=true;
 const oldReview=structuredClone(latest(peer).state);
 guestAction(peer,'REVIEW_NEXT');
 try{await until(()=>latest(peer)?.state.run?.scene===1,'guest advances shared review')}
 catch(error){console.log(JSON.stringify({nativeRun:(await saved()).run,sharedRun:latest(peer)?.state.run,errors},null,2));throw error}
 guestAction(peer,'REVIEW_NEXT',{},oldReview);await pause(250);assert.equal(latest(peer).state.run.scene,1);
 await clickText('Continue the story');await clickSelector('.review-scene .answers button',EGG_QUESTIONS[0][0].answer);
 await clickText('Start gameplay');await clickText('Let’s explore');
 await until(()=>latest(peer)?.state.run?.phase==='play','shared play phase');report.sharedReviewAndStaleSceneGuard=true;
 // Complete actual host workshop controls, rather than mutating game state.
 for(const activity of activityCatalog[0]){
  await until(async()=> (await saved()).run.activeActivity===activity.id,'workshop '+activity.id);
  if(activity.type==='discovery'){
   for(let index=0;index<activity.cards.length;index++)await clickSelector('.prep-discovery button',index);
   await clickText('Save my discoveries');
  }else if(activity.type==='sort'){
   for(const card of activity.cards){
    await clickText(card.label,"document.querySelector('.station-preparation')");
    const group=activity.groups.find(item=>item.id===card.target);
    await clickSelector('button[aria-label='+JSON.stringify('Place selected card in '+group.label)+']');
   }
   await clickText('Check Answers',"document.querySelector('.station-preparation')");
  }else if(activity.type==='quiz'){
   for(const question of activity.questions)await clickSelector('.prep-quiz .answers button',question.answer);
  }
  await until(async()=> (await saved()).run.completedActivities.includes(activity.id),'saved workshop callback');
 }
 await until(()=>evaluate("!!document.querySelector('.hunt-world')"),'final egg hunt map');
 await until(()=>latest(peer)?.state.run?.activeActivity==='finale','finale shared snapshot');await clickText('Let’s explore');
 assert.equal((await saved()).run.completedActivities.length,4);report.nativeWorkshopCallbacksAndFinale=true;
 await until(()=>evaluate("document.querySelector('.adventure-world3d .three-viewport')?.dataset.state==='ready'"),'native 3D discovery island');
 assert.equal(await evaluate("!!document.querySelector('.adventure-world3d canvas').getContext('webgl2')"),true);report.native3DIsland=true;
 // Host and guest have distinct moving characters in the same island.
 guestPosition(peer,{x:72,y:22,walking:true,facing:'left',outfit:'Scarf'},1);
 await until(()=>evaluate("document.querySelector('.world-player.remote [data-animation]')?.dataset.animation==='walk'"),'guest walking sprite');
 assert.equal(await evaluate("parseFloat(document.querySelector('.world-player.remote').style.left)"),72);
 assert.equal(await evaluate("parseFloat(document.querySelector('[aria-label=\"Your explorer\"]').style.left)"),12);
 guestPosition(peer,{x:72,y:22,walking:false,facing:'left',outfit:'Scarf'},2);
 await until(()=>evaluate("document.querySelector('.world-player.remote [data-animation]')?.dataset.animation==='idle'"),'guest idle sprite');
 await evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));true");
 await until(()=>evaluate("document.querySelector('[aria-label=\"Your explorer\"] [data-animation]')?.dataset.animation==='walk'"),'host walking sprite');
 await pause(350);await evaluate("window.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}));true");
 await until(()=>evaluate("document.querySelector('[aria-label=\"Your explorer\"] [data-animation]')?.dataset.animation==='idle'"),'host idle sprite');
 await clickText('Run to Safe Spot');report.independentNativeWalkingAndIdle=true;
 guestAction(peer,'WRONG',{egg:0,option:(EGG_QUESTIONS[0][0].answer+1)%EGG_QUESTIONS[0][0].options.length});
 await until(()=>latest(peer)?.state.run?.chasing===true,'guest guardian chase');
 assert.equal(latest(peer).state.run.chaseActor,peer.id);
 await clickText('Run to Safe Spot');await pause(250);
 assert.equal((await saved()).run.chasing,true,'Host at camp cannot rescue the guest being chased');report.guestChaseActorProtected=true;
 peer.socket.end();
 await until(async()=> !(await saved()).run.chasing,'disconnected guest rescued');
 await until(()=>evaluate("parseFloat(document.querySelector('.world-guardian').style.left)===78&&parseFloat(document.querySelector('.world-guardian').style.top)===44"),'guardian reset to nest');
 report.guestDisconnectRescueAndGuardianReset=true;
 // Leaving a room while another guest is being chased must not strand solo play.
 const roomCode=code;peer=await connectPeer(roomCode,'Returning friend');
 await until(()=>latest(peer)?.state.run?.activeActivity==='finale','rejoin finale state');
 guestPosition(peer,{x:72,y:22,walking:false,facing:'left'},1);
 await until(()=>evaluate("document.querySelector('.world-player.remote')?.style.left==='72%'"),'rejoined guest position');
 guestAction(peer,'WRONG',{egg:0,option:(EGG_QUESTIONS[0][0].answer+2)%EGG_QUESTIONS[0][0].options.length});
 await until(async()=> (await saved()).run.chasing,'second guest chase');
 await clickText('Adventure map');await clickText('Nearby multiplayer');
 await clickText('Leave session & return to solo');
 await until(async()=> !(await saved()).run.chasing,'host leave clears shared chase');
 assert.equal((await saved()).run.activeActivity,'finale');report.hostLeaveRescuesSharedChase=true;
 peer.socket.destroy();peer=null;
 // Simulate an abandoned multiplayer chase in persistent storage and a cold reload.
 const abandoned=await saved();abandoned.run={...abandoned.run,chasing:true,chaseActor:'disconnected-guest'};
 await native('Preferences','set',{key:'sciblox-v1',value:JSON.stringify(abandoned)});
 await reload();
 await until(async()=> !(await saved()).run.chasing,'cold startup clears abandoned chase');
 assert.equal((await saved()).run.chaseActor,null);report.coldNormalizeClearsAbandonedChase=true;
 await clickText('Resume session');await until(()=>evaluate("!!document.querySelector('.hunt-world')"),'resumed saved finale');
 assert.ok(await evaluate("!document.querySelector('.hunt-world.chasing')"));
 assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"),true);report.nativeScreenFits=true;
 assert.deepEqual(errors,[]);report.noNativeWebViewErrors=true;
 const snapshot=await command('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.tools/native-game-v14.png',Buffer.from(snapshot.data,'base64'));
 report.limit='Native Android emulator with actual TCP socket peer; physical two-phone hotspot test remains pending.';
 fs.writeFileSync('.tools/native-game-smoke-v14-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{
 peer?.socket.destroy();
 try{await native('LocalMultiplayer','disconnect')}catch{}
 ws.close();
}


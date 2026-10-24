// Run against the owned Android emulator with its SciBlox WebView forwarded to 9222.
import fs from 'node:fs';
import net from 'node:net';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {EMPTY,newTests,preparationPlan} from '../src/journey-state.js';
import {assessmentQuestions} from '../src/station-assessments.js';
const targets=await (await fetch('http://127.0.0.1:9222/json')).json();
const target=targets.find(t=>t.url==='https://localhost/');assert.ok(target,'Native SciBlox WebView exists');
const ws=new WebSocket(target.webSocketDebuggerUrl);await once(ws,'open');
let serial=0;const pending=new Map(),errors=[];
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timed out: '+method))},20000);pending.set(id,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id,method,params}))});
async function evaluate(expression){const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value}
const native=(plugin,method,args={})=>evaluate('window.Capacitor.nativePromise('+JSON.stringify(plugin)+','+JSON.stringify(method)+','+JSON.stringify(args)+')');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<120;i++){try{const result=await fn();if(result)return result}catch{}await pause(100)}throw Error('Timed out: '+label)}
async function click(selector,index=0){await until(()=>evaluate('!!document.querySelectorAll('+JSON.stringify(selector)+')['+index+']'),'control '+selector);await evaluate('document.querySelectorAll('+JSON.stringify(selector)+')['+index+'].click()');await pause(180)}
async function button(text){await until(()=>evaluate('!![...document.querySelectorAll("button")].find(b=>!b.disabled&&b.textContent.trim()==='+JSON.stringify(text)+')'),'button '+text);await evaluate('[...document.querySelectorAll("button")].find(b=>!b.disabled&&b.textContent.trim()==='+JSON.stringify(text)+').click()');await pause(180)}
const saved=()=>evaluate("JSON.parse(localStorage.getItem('sciblox-v1'))");
const report={version:'1.5.0',checks:{}};let backup,peer;
async function seed(phase='play',gender='male',language='tl'){
 const plan=preparationPlan(0),progress={...structuredClone(EMPTY),name:'Ari Native',profileReady:true,intro:true,modeChosen:true,profile:{avatar:'Human',gender,picture:'luna'},settings:{...EMPTY.settings,language,sound:false,motion:true},run:{id:'native-v15-'+phase,index:0,phase,scene:2,reviewUses:0,activityPlan:plan,completedActivities:[],activeActivity:plan[0],collected:[],wrong:0,attempts:0,hints:0,round:0,chasing:false,pendingEgg:null,eliminated:{},startedAt:Date.now(),tests:newTests()}};
 await native('Preferences','set',{key:'sciblox-v1',value:JSON.stringify(progress)});await evaluate('location.reload()');await until(()=>evaluate("!!document.querySelector('.launch-play')"),'native title');await until(async()=>!(await native('GameScreen','status')).landscape,'portrait title');
 await click('.launch-play');await until(()=>evaluate("!!document.querySelector('.portal-enter')"),'portrait portal selector');await click('.portal-enter');
}
try{
 await command('Runtime.enable');await until(()=>evaluate("typeof window.Capacitor?.nativePromise==='function'"),'native bridge');backup=(await native('Preferences','get',{key:'sciblox-v1'})).value;
 await seed();await until(async()=>(await native('GameScreen','status')).landscape,'native landscape world');assert.ok(await evaluate('innerWidth>innerHeight'));assert.equal(await evaluate("document.querySelector('.journey-hub3d').dataset.gender"),'male');report.checks.malePlayableCharacter=true;
 await until(()=>evaluate("document.querySelector('.bhell-dialog img')?.naturalWidth>0"),'bundled Bhell image');assert.ok(await evaluate("document.querySelector('.bhell-dialog').innerText.includes('Ako si Bhell')"));report.checks.tagalogGuideAndBundledArt=true;
 await button('Tuklasin natin');await button('Pumasok sa gawain');await until(()=>evaluate("!!document.querySelector('.world-activity-overlay')"),'native in-world activity');assert.equal((await native('GameScreen','status')).landscape,true);assert.ok(await evaluate('innerWidth>innerHeight'));report.checks.nativeLandscapeInWorldQuestions=true;
 await click('.world-activity-overlay .close');await click('header button:last-child');await until(async()=>!(await native('GameScreen','status')).landscape,'portrait reviewer');await button('Bumalik sa laro');await until(async()=>(await native('GameScreen','status')).landscape,'landscape after reviewer');assert.equal((await saved()).run.reviewUses,1);report.checks.reviewerPortraitAndLandscapeReturn=true;
 await seed('pretest','female','en');await until(()=>evaluate("!!document.querySelector('.station-assessment')"),'native pretest');assert.equal((await native('GameScreen','status')).landscape,false);assert.ok(await evaluate('innerHeight>innerWidth'));await click('.station-assessment .answers button',assessmentQuestions(0)[0].answer);assert.equal((await saved()).run.tests.pre.answers.length,1);report.checks.nativePortraitPretestAndSavedAnswer=true;
 await seed('posttest','female','en');await until(()=>evaluate("!!document.querySelector('.station-assessment')"),'native posttest');assert.equal((await native('GameScreen','status')).landscape,false);report.checks.nativePortraitPosttest=true;
 await seed('play','female','en');await until(async()=>(await native('GameScreen','status')).landscape,'female world');assert.equal(await evaluate("document.querySelector('.journey-hub3d').dataset.gender"),'female');report.checks.femalePlayableCharacter=true;
 const portrait=await native('Narrator','speak',{text:'Kumusta! Ako si Bhell.',language:'tl'});assert.equal(typeof portrait.spoken,'boolean');await native('Narrator','stop');report.checks.tagalogNarrationGracefulFallback=portrait.spoken?'spoken':'captions available; no installed Tagalog voice';
 // Native local TCP room handshake and independent peer identity, without internet.
 const room=await native('LocalMultiplayer','host',{name:'Ari Native'});assert.match(room.code||room.roomCode||'',/^\d{6}$/);
 const code=room.code||room.roomCode;peer=net.createConnection({host:'127.0.0.1',port:18947});let buffer='';const messages=[];peer.on('data',chunk=>{buffer+=chunk;let end;while((end=buffer.indexOf('\n'))>=0){const message=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);messages.push(message);if(message.kind==='ping')peer.write(JSON.stringify({kind:'pong'})+'\n')}});await once(peer,'connect');peer.write(JSON.stringify({protocol:2,code,name:'Native Male Friend'})+'\n');await until(()=>messages.find(m=>m.kind==='welcome'),'native peer welcome');report.checks.nativeHotspotProtocolHandshake=true;peer.end();peer=null;await native('LocalMultiplayer','disconnect');
 assert.ok(await evaluate("performance.getEntriesByType('resource').every(r=>new URL(r.name).hostname==='localhost')"));report.checks.allAssetsBundledOffline=true;assert.deepEqual(errors,[]);report.checks.noNativeJavascriptExceptions=true;
}finally{
 peer?.destroy();try{await native('LocalMultiplayer','disconnect')}catch{}
 if(backup!==undefined){try{if(backup===null)await native('Preferences','remove',{key:'sciblox-v1'});else await native('Preferences','set',{key:'sciblox-v1',value:backup});await evaluate('location.reload()')}catch{}}
 fs.writeFileSync('artifacts/SciBlox-1.5-native-checks.json',JSON.stringify(report,null,2));ws.close();
}
console.log(JSON.stringify(report,null,2));

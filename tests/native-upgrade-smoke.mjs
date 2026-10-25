// Requires an owned Android emulator: WebView CDP -> 9222, classroom TCP -> 18959.
import fs from 'node:fs';
import net from 'node:net';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {EMPTY,newTests,preparationPlan} from '../src/journey-state.js';
import {learnerRecord} from '../src/classroom-data.js';
const targets=await(await fetch('http://127.0.0.1:9222/json')).json();
const target=targets.find(t=>t.url==='https://localhost/');assert.ok(target,'SciBlox WebView available');
const ws=new WebSocket(target.webSocketDebuggerUrl);await once(ws,'open');
let serial=0;const pending=new Map(),errors=[];
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method))},15000);pending.set(id,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id,method,params}))});
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
const native=(plugin,method,args={})=>evaluate(`window.Capacitor.nativePromise(${JSON.stringify(plugin)},${JSON.stringify(method)},${JSON.stringify(args)})`);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){for(let i=0;i<150;i++){if(await fn())return;await pause(100)}throw Error('Timed out: '+label)}
async function click(selector){await until(()=>evaluate(`!!document.querySelector(${JSON.stringify(selector)})`),selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)}
async function request(message){const socket=net.createConnection({host:'127.0.0.1',port:18959});socket.setTimeout(6000,()=>socket.destroy(Error('Classroom reply timeout')));await once(socket,'connect');socket.write(JSON.stringify(message)+'\n');let data='';try{for await(const chunk of socket){data+=chunk;if(data.includes('\n'))return JSON.parse(data.split('\n')[0])}return null}finally{socket.destroy()}}
const report={version:'1.6.1',checks:{}},classId='native-check-'+crypto.randomUUID(),code='473829';
let backup={},server;
try{
 await command('Runtime.enable');
 for(const key of ['sciblox-v1','sciblox-classroom-v1'])backup[key]=(await native('Preferences','get',{key})).value;
 await native('Classroom','start',{classId,code,name:'Native verification'});
 assert.equal((await request({code:'000000',checkOnly:true})).ok,false);
 assert.equal((await request({code,checkOnly:true})).classId,classId);report.checks.classroomPairCode=true;
 const state={...structuredClone(EMPTY),name:'Native learner',profileReady:true,intro:true,modeChosen:true,settings:{...EMPTY.settings,sound:false,motion:false},stationAssessments:{0:{pre:0,post:8}},completed:[0]};
 const record=learnerRecord(state,'native-learner-001',2);
 assert.equal((await request({code,classId,record})).ok,true);
 await request({code,classId,record:{...record,revision:1,name:'Stale'}});
 const records=(await native('Classroom','records')).records;assert.equal(records.length,1);assert.equal(records[0].name,'Native learner');assert.equal(records[0].scores[0].pre,0);report.checks.scoreValidationAndIdempotence=true;
 await native('Classroom','stop');await native('Classroom','start',{classId,code});assert.equal((await native('Classroom','records')).records[0].revision,2);report.checks.teacherRecordsSurviveRestart=true;await native('Classroom','stop');
 const received=[];
 server=net.createServer(socket=>{let data='';socket.on('data',chunk=>{data+=chunk;if(data.includes('\n')){const message=JSON.parse(data.split('\n')[0]);received.push(message);socket.end(JSON.stringify({ok:true,classId})+'\n')}})});
 server.listen(18949,'0.0.0.0');await once(server,'listening');
 assert.equal((await native('Classroom','upload',{address:'10.0.2.2',classId,code,record})).ok,true);report.checks.nativeLearnerUpload=true;
 await native('Preferences','set',{key:'sciblox-v1',value:JSON.stringify(state)});
 await native('Preferences','set',{key:'sciblox-classroom-v1',value:JSON.stringify({studentId:record.id,classId:'learner-private-class',code:'123456',role:'learner',paired:{address:'10.0.2.2',code,classId},revision:2,ack:0,fingerprint:'',record,records:[]})});
 await evaluate('location.reload()');
 await until(async()=>{const value=JSON.parse((await native('Preferences','get',{key:'sciblox-classroom-v1'})).value);return value?.ack>=3},'automatic queued score acknowledgement');report.checks.queuedRecordsSyncAutomatically=true;
 const plan=preparationPlan(0);state.run={id:'native-world-check',index:0,phase:'play',scene:2,reviewUses:0,activityPlan:plan,completedActivities:[],activeActivity:plan[0],collected:[],wrong:0,round:0,tests:newTests()};
 await native('Preferences','set',{key:'sciblox-v1',value:JSON.stringify(state)});await evaluate('location.reload()');await click('.launch-play');await click('.portal-enter');
 await until(async()=>(await native('GameScreen','status')).landscape,'landscape world');
 await until(()=>evaluate("document.querySelector('.guide-npc img')?.naturalWidth>0"),'bundled guide sprite');
 while(await evaluate("!!document.querySelector('.guide-npc')")){await evaluate("[...document.querySelectorAll('.guide-npc button')].find(b=>b.textContent.trim()==='Skip').click()");await pause(150)}
 await click('[aria-label="Switch to first person"]');assert.equal(await evaluate("document.querySelector('.journey-hub3d').dataset.camera"),'first');report.checks.nativeLandscapeAndPOV=true;
 await native('GameScreen','orient',{mode:'portrait'});await until(async()=>!(await native('GameScreen','status')).landscape,'portrait return');
 const voice=await native('Narrator','speak',{text:'Hello. Let us explore together.',language:'en'});assert.equal(typeof voice.spoken,'boolean');await native('Narrator','stop');report.checks.offlineNarration=voice.spoken?'spoken':'captions fallback';
 assert.deepEqual(errors,[]);report.checks.noJavascriptExceptions=true;
}finally{
 server?.close();try{await native('Classroom','stop')}catch{}
 for(const [key,value]of Object.entries(backup)){try{if(value===null)await native('Preferences','remove',{key});else await native('Preferences','set',{key,value})}catch{}}
 try{await evaluate('location.reload()')}catch{}
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/SciBlox-1.6-native-checks.json',JSON.stringify(report,null,2));ws.close();
}
console.log(JSON.stringify(report,null,2));

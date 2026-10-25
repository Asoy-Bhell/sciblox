import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stationDialogues,EXPRESSIONS,GUIDE_IDLE_MS,getGuideScenes,localizeGuide,guideProgress,progressTriggers} from '../src/guide/dialogue.js';

test('all eight stations bundle bilingual scenes for every guide trigger',()=>{
 assert.equal(stationDialogues.length,8);assert.equal(GUIDE_IDLE_MS,20_000);
 for(const [i,station]of stationDialogues.entries()){
  assert.equal(station.station,i+1);
  for(const trigger of ['intro','wrong','correct','idle','levelUp','talk']){
   const scenes=getGuideScenes(i,trigger);assert.ok(scenes.length);
   for(const scene of scenes){assert.ok(EXPRESSIONS[scene.expression]);assert.ok(scene.text.en);assert.ok(scene.text.tl);if(scene.hint){assert.ok(scene.hint.en);assert.ok(scene.hint.tl)}}
  }
  assert.ok(station.scenes.wrong.every(scene=>scene.hint));
 }
});
test('the five expression files are distinct local PNG assets',()=>{
 const hashes=[];
 for(const file of Object.values(EXPRESSIONS)){const bytes=fs.readFileSync(new URL('../public'+file,import.meta.url));assert.equal(bytes.subarray(1,4).toString(),'PNG');hashes.push(bytes.toString('base64').slice(-1000))}
 assert.equal(new Set(hashes).size,5);
});
test('guide localization falls back and substitutes only provided variables',()=>{
 assert.equal(localizeGuide({en:'Level {level}',tl:'Antas {level}'},'tl',{level:3}),'Antas 3');
 assert.equal(localizeGuide({en:'Hello'},'tl'),'Hello');
 assert.equal(localizeGuide('Hello {name}','en'),'Hello {name}');
});
test('accepted gameplay progress triggers celebration and level up once',()=>{
 const before=guideProgress({xp:95,run:{id:'a',wrong:0,completedActivities:[],collected:[],round:0}});
 const after=guideProgress({xp:105,run:{id:'a',wrong:0,completedActivities:['trait'],collected:[],round:0}});
 assert.deepEqual(progressTriggers(before,after),['correct','levelUp']);
 assert.deepEqual(progressTriggers(after,after),[]);
 assert.deepEqual(progressTriggers(before,{...after,runId:'b'}),[]);
 assert.deepEqual(progressTriggers(before,{...before,wrong:1}),['wrong']);
 assert.deepEqual(progressTriggers(before,{...before,eggs:1}),['correct']);
 assert.deepEqual(progressTriggers(before,{...before,round:1}),['correct']);
});
test('wrong-answer dialogue contains process hints without an answer key',()=>{
 for(const station of stationDialogues)for(const scene of station.scenes.wrong){assert.equal(scene.expression,'think');assert.equal('answer' in scene,false);assert.equal('options' in scene,false);assert.doesNotMatch(scene.hint.en,/correct answer|choose (A|B|C|D)\b|\b75%\b/i)}
});

test('each activity has bilingual directions and contextual feedback rotates without answer keys',()=>{
 for(const [index,data]of stationDialogues.entries()){
  for(const [id,activity]of Object.entries(data.activities)){
   assert.ok(activity.instructions.en);assert.ok(activity.instructions.tl);
   assert.equal(getGuideScenes(index,'talk',{activityId:id})[0].text,activity.instructions);
   for(const trigger of ['wrong','correct']){
    const variants=Array.from({length:4},(_,variant)=>getGuideScenes(index,trigger,{activityId:id,variant})[0]);
    assert.equal(new Set(variants.map(scene=>scene.text.en)).size,4);
    for(const scene of variants){assert.ok(scene.text.tl);assert.equal(scene.answer,undefined);assert.equal(scene.options,undefined)}
   }
  }
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import manifest from '../src/guide/tagalog-audio.json' with {type:'json'};
import {bundledNarration,hasBundledTagalog} from '../src/guide/bundled-narration.js';
import {stationDialogues,getGuideScenes,localizeGuide} from '../src/guide/dialogue.js';

test('bundled Tagalog captions resolve to nonempty local MP3 files',()=>{
 assert.ok(hasBundledTagalog);assert.equal(manifest.modelLicense,'CC-BY-NC-4.0');
 assert.ok(Object.keys(manifest.clips).length>=150);
 for(const [text,path]of Object.entries(manifest.clips)){
  assert.match(path,/^\/assets\/bhell\/audio\/tl\/[a-f0-9]{20}\.mp3$/);
  assert.deepEqual(bundledNarration(text,'tl'),[path]);assert.deepEqual(bundledNarration(text,'en'),[]);
  assert.ok(fs.statSync(new URL('../public'+path,import.meta.url)).size>500);
 }
});

test('every station contextual guide scene and hint has bundled Tagalog narration',()=>{
 for(const [station,data]of stationDialogues.entries())for(const activityId of Object.keys(data.activities))for(const trigger of ['intro','talk','wrong','correct','idle','levelUp'])for(let variant=0;variant<4;variant++)for(const scene of getGuideScenes(station,trigger,{activityId,variant})){
  const text=localizeGuide(scene.text,'tl',{level:2}),hint=localizeGuide(scene.hint,'tl');
  assert.ok(bundledNarration(text,'tl').length,`${station+1}/${activityId}/${trigger}: ${text}`);
  if(hint)assert.ok(bundledNarration(text+' '+hint,'tl').length,`Missing concatenated hint: ${hint}`);
 }
 assert.ok(bundledNarration('Naabot mo ang level 99!','tl').length);
 assert.deepEqual(bundledNarration('Unrecognized dialogue','tl'),[]);
});

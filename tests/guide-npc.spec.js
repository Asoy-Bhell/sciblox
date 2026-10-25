import {test,expect} from '@playwright/test';
import {EMPTY,preparationPlan,newTests} from '../src/journey-state.js';
import {getGuideScenes,localizeGuide} from '../src/guide/dialogue.js';

async function seed(page,{index=0,xp=0,language='en',sound=false,motion=false,completed=0,active,...rest}={}){
 const plan=preparationPlan(index);
 await page.goto('/');
 await page.evaluate(save=>localStorage.setItem('sciblox-v1',JSON.stringify(save)),{
  ...structuredClone(EMPTY),profileReady:true,intro:true,modeChosen:true,xp,
  completed:Array.from({length:index},(_,i)=>i),settings:{...EMPTY.settings,language,sound,motion},
  run:{id:'guide-check',index,phase:'play',scene:2,reviewUses:0,activityPlan:plan,completedActivities:plan.slice(0,completed),activeActivity:active||plan[completed]||'finale',collected:[],wrong:0,attempts:0,hints:0,round:0,chasing:false,pendingEgg:null,eliminated:{},startedAt:Date.now(),tests:newTests(),...rest}
 });
 await page.reload();await page.getByRole('button',{name:/^(Play|Maglaro)$/}).click();
 await page.getByRole('button',{name:/^(Resume session|Ipagpatuloy ang sesyon)$/}).click();
 await expect(page.locator('.guide-npc')).toBeVisible();
}
async function dismiss(page){while(await page.locator('.guide-npc').count())await page.locator('.guide-npc').getByRole('button',{name:/^(Skip|Laktawan)$/}).click()}

test('intro, expression changes, captions, Next, hint and skip work on a short phone',async({page})=>{
 await page.setViewportSize({width:740,height:360});await seed(page);
 const guide=page.locator('.guide-npc');await expect(guide).toHaveAttribute('data-expression','wave');
 await expect(guide.getByRole('button',{name:'Hear Bhell',exact:true})).toHaveCount(0);
 await expect(guide).toContainText('Station 1: Trait Detective');
 await guide.getByRole('button',{name:'Next',exact:true}).click();await expect(guide).toHaveAttribute('data-expression','explain');
 await guide.getByRole('button',{name:'Ask Bhell for guidance',exact:true}).click();await expect(guide.locator('.guide-hint')).toBeVisible();
 await expect.poll(()=>guide.locator('img').evaluate(el=>el.naturalWidth)).toBeGreaterThan(0);
 for(const button of await guide.getByRole('button').all()){const box=await button.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(361)}
 await page.screenshot({path:'artifacts/previews/bhell-guide/intro-landscape.png'});
 await dismiss(page);await expect(guide).toHaveCount(0);await expect(page.locator('.app')).toHaveAttribute('data-orientation','landscape');
});
test('wrong answers show only a clue, successful workshops celebrate, then level up',async({page})=>{
 await page.setViewportSize({width:844,height:390});await seed(page,{completed:3,xp:95});await dismiss(page);
 await page.getByRole('button',{name:'Enter activity',exact:true}).click();const workshop=page.locator('.station-preparation');
 await workshop.getByRole('button',{name:'Natural feather color',exact:true}).click();
 const guide=page.locator('.guide-npc');await expect(guide).toHaveAttribute('data-trigger','wrong');await expect(guide).toHaveAttribute('data-expression','think');
 await expect(guide.locator('.guide-hint')).not.toBeEmpty();
 await expect(guide).not.toContainText('Learning a bicycle trick');await page.screenshot({path:'artifacts/previews/bhell-guide/wrong-answer.png'});await dismiss(page);
 for(const answer of ['Learning a bicycle trick','One from each parent','The dominant phenotype']){
  await workshop.getByRole('button',{name:answer,exact:true}).click();await expect(guide).toHaveAttribute('data-trigger','correct');
  await expect(guide).toHaveAttribute('data-expression','celebrate');await guide.getByRole('button',{name:'Next',exact:true}).click();
 }
 await expect(guide).toHaveAttribute('data-trigger','levelUp');await expect(guide).toContainText('level 2');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')).run.completedActivities.length)).toBe(4);
 await page.screenshot({path:'artifacts/previews/bhell-guide/level-up.png'});await dismiss(page);
});
test('20-second idle nudges ignore pauses, held movement, and cleaned-up stations',async({page})=>{
 await seed(page);await dismiss(page);await page.clock.install();
 await page.clock.fastForward(19_500);await expect(page.locator('.guide-npc')).toHaveCount(0);
 await page.clock.fastForward(750);await expect(page.locator('.guide-npc')).toHaveAttribute('data-trigger','idle');await expect(page.locator('.guide-npc')).toHaveAttribute('data-expression','encourage');await dismiss(page);
 await page.getByRole('button',{name:'Pause menu',exact:true}).click();await page.clock.fastForward(25_000);await expect(page.locator('.guide-npc')).toHaveCount(0);
 await page.getByRole('button',{name:'Resume gameplay',exact:true}).click();
 await page.keyboard.down('ArrowRight');await page.clock.fastForward(21_000);await expect(page.locator('.guide-npc')).toHaveCount(0);await page.keyboard.up('ArrowRight');
 await page.getByRole('button',{name:'Pause menu',exact:true}).click();await page.getByRole('button',{name:'Adventure map',exact:true}).click();await page.clock.fastForward(25_000);await expect(page.locator('.guide-npc')).toHaveCount(0);
});
test('Tagalog scenes, static sprites and bundled resources work without external requests',async({page})=>{
 const external=[];await page.route('**/*',route=>{const url=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(url.hostname)){external.push(url.href);return route.abort()}return route.continue()});
 await page.setViewportSize({width:844,height:390});await seed(page,{language:'tl',motion:false});const guide=page.locator('.guide-npc');
 await expect(guide).toContainText('Ako si Bhell');await expect(guide).toHaveAttribute('data-motion','off');await expect(guide.locator('.bhell-audio-toggle')).toHaveCount(0);
 expect(await guide.locator('img').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await guide.getByRole('button',{name:'Susunod',exact:true}).click();await expect(guide).toContainText('Tagatuklas ng Katangian');await page.screenshot({path:'artifacts/previews/bhell-guide/tagalog.png'});await dismiss(page);
 for(const expression of ['wave','explain','think','celebrate','encourage'])expect((await page.request.get('/assets/bhell/'+expression+'.png')).ok()).toBeTruthy();expect(external).toEqual([]);
});
test('Hear Bhell selects a local voice, stops on Next, and handles unavailable voices',async({page})=>{
 await page.addInitScript(()=>{
  window.__guideSpeech=[];
  window.SpeechSynthesisUtterance=class {constructor(text){this.text=text}};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
   getVoices:()=>[{name:'Network English',lang:'en-US',localService:false},{name:'Local English',lang:'en-US',localService:true}],
   cancel:()=>window.__guideSpeech.push({stop:true}),
   speak:utterance=>{window.__guideSpeech.push({text:utterance.text,local:utterance.voice.localService});utterance.onstart?.()}
  }});
 });
 await seed(page,{sound:true});const guide=page.locator('.guide-npc');
 await expect.poll(()=>page.evaluate(()=>window.__guideSpeech.filter(x=>x.text).length)).toBeGreaterThan(0);await expect(page.getByRole('button',{name:'Mute Bhell',exact:true})).toHaveCount(1);expect((await page.evaluate(()=>window.__guideSpeech.filter(x=>x.text))).every(x=>x.local)).toBeTruthy();
 const before=await page.evaluate(()=>window.__guideSpeech.filter(x=>x.stop).length);await guide.getByRole('button',{name:'Next',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__guideSpeech.filter(x=>x.stop).length)).toBeGreaterThan(before);
 await page.getByRole('button',{name:'Mute Bhell',exact:true}).click();await expect(page.getByRole('button',{name:'Unmute Bhell',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')).settings.sound)).toBe(false);
 await page.evaluate(()=>window.speechSynthesis.getVoices=()=>[{name:'Cloud only',lang:'en-US',localService:false}]);await page.getByRole('button',{name:'Unmute Bhell',exact:true}).click();
 await expect(guide.locator('.voice-status')).toContainText('Offline voice is unavailable');await expect(guide.locator('.guide-captions')).not.toBeEmpty();
 await page.getByRole('button',{name:'Pause menu',exact:true}).click();await expect(guide).toHaveCount(0);
});

test('Activity 1 evidence and completion fit a short landscape viewport',async({page})=>{
 await page.setViewportSize({width:740,height:360});await seed(page);await dismiss(page);
 await page.getByRole('button',{name:'Enter activity',exact:true}).click();const workshop=page.locator('.station-preparation');
 for(const name of ['Bird','Bicycle','Flower'])await workshop.getByRole('button',{name:new RegExp(name)}).click();
 await expect(workshop.locator('.prep-discovery-detail')).toHaveCount(1);
 const save=workshop.getByRole('button',{name:'Save my discoveries',exact:true});await expect(save).toBeEnabled();
 const box=await save.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(360);
 expect(await page.locator('.world-activity-overlay').evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(2);
 await page.screenshot({path:'artifacts/previews/bhell-guide/compact-discovery.png'});await save.click();
 await expect(page.locator('.guide-npc')).toHaveAttribute('data-trigger','correct');
});

test('Bhell walks to the activity and gives relevant directions',async({page})=>{
 await page.setViewportSize({width:844,height:390});await seed(page);await dismiss(page);
 const world=page.locator('.journey-hub3d:not([data-preview="true"]) .three-viewport');
 await expect(world).toHaveAttribute('data-state','ready');
 const start=Number(await world.getAttribute('data-guide-z'));
 await expect.poll(async()=>Number(await world.getAttribute('data-guide-z'))).not.toBe(start);
 await page.getByRole('button',{name:'Talk to Bhell',exact:true}).click();
 await expect(page.locator('.guide-npc')).toHaveAttribute('data-trigger','talk');
 await expect(page.locator('.guide-npc')).toContainText('Tap each object');
});

test('portrait review speaks automatically and its small mute button persists',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>{
  window.__spoken=[];window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{name:'Local English',lang:'en-US',localService:true}],cancel:()=>{},speak:u=>{window.__spoken.push(u.text);u.onstart?.()}}});
 });
 await page.goto('/');await page.evaluate(s=>localStorage.setItem('sciblox-v1',JSON.stringify(s)),{...structuredClone(EMPTY),profileReady:true,intro:true,modeChosen:true,completed:[0],settings:{...EMPTY.settings,sound:true,motion:false},run:{id:'review-audio',index:1,phase:'review',scene:0,reviewUses:0,tests:newTests()}});
 await page.reload();await page.getByRole('button',{name:'Play',exact:true}).click();await page.getByRole('button',{name:'Resume session',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__spoken.length)).toBeGreaterThan(0);
 const toggle=page.getByRole('button',{name:'Mute Bhell',exact:true});await expect(toggle).toHaveCount(1);const box=await toggle.boundingBox();expect(box.width).toBeLessThanOrEqual(40);expect(box.height).toBeLessThanOrEqual(40);
 await toggle.click();await expect(page.getByRole('button',{name:'Unmute Bhell',exact:true})).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')).settings.sound)).toBe(false);
 const count=await page.evaluate(()=>window.__spoken.length);await page.getByRole('button',{name:'Continue the story',exact:true}).click();await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__spoken.length)).toBe(count);
 await page.screenshot({path:'artifacts/previews/bhell-guide/portrait-auto-audio.png'});
});

test('included Tagalog audio plays offline without a device voice and stops when muted',async({page})=>{
 const external=[],audioRequests=[];await page.route('**/*',route=>{const u=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)){external.push(u.href);return route.abort()}if(u.pathname.endsWith('.mp3'))audioRequests.push(u.pathname);return route.continue()});
 await page.addInitScript(()=>{window.__clips=[];const NativeAudio=window.Audio;window.Audio=class extends NativeAudio{constructor(src){super(src);window.__clips.push(this)}};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],cancel:()=>{}}})});
 await page.setViewportSize({width:844,height:390});await seed(page,{language:'tl',sound:true,motion:false});
 await expect.poll(()=>page.evaluate(()=>window.__clips.some(a=>a.currentTime>.05&&!a.paused)),{timeout:15000}).toBeTruthy();
 expect(audioRequests.length).toBeGreaterThan(0);expect(external).toEqual([]);await expect(page.locator('.guide-npc .voice-status')).toHaveCount(0);
 await page.locator('header .bhell-audio-toggle').click();await expect.poll(()=>page.evaluate(()=>window.__clips.every(a=>a.paused))).toBeTruthy();
});

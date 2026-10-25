import {test,expect} from '@playwright/test';
import {EMPTY,preparationPlan,newTests} from '../src/journey-state.js';
import {learnerRecord} from '../src/classroom-data.js';
import {dismissGuide} from './activity-helpers.js';
async function seed(page,extra={},classroom){
 await page.goto('/');
 await page.evaluate(({state,classroom})=>{
  localStorage.setItem('sciblox-v1',JSON.stringify(state));
  if(classroom)localStorage.setItem('CapacitorStorage.sciblox-classroom-v1',JSON.stringify(classroom));
 },{state:{...structuredClone(EMPTY),profileReady:true,intro:true,modeChosen:true,settings:{...EMPTY.settings,sound:false,motion:false},...extra},classroom});
 await page.reload();await page.getByRole('button',{name:'Play',exact:true}).click();
}
test('compact world controls switch POV, drag camera and retain touch movement',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 const plan=preparationPlan(0);
 await seed(page,{run:{id:'camera-check',index:0,phase:'play',scene:2,reviewUses:0,activityPlan:plan,completedActivities:[],activeActivity:plan[0],collected:[],wrong:0,round:0,tests:newTests()}});
 await page.getByRole('button',{name:'Resume session',exact:true}).click();await dismissGuide(page,{expected:true});
 const hub=page.locator('.journey-hub3d');await expect(hub.locator('.three-viewport')).toHaveAttribute('data-state','ready');
 await page.getByRole('button',{name:'Switch to first person',exact:true}).click();await expect(hub).toHaveAttribute('data-camera','first');
 const canvas=hub.locator('canvas'),bounds=await canvas.boundingBox();
 await page.mouse.move(bounds.x+bounds.width*.6,bounds.y+bounds.height*.5);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.75,bounds.y+bounds.height*.55,{steps:6});await page.mouse.up();
 await page.getByRole('button',{name:'Jump',exact:true}).click();await expect(page.locator('.app')).toHaveAttribute('data-orientation','landscape');
 await page.screenshot({path:'artifacts/previews/upgrade/first-person.png'});
 await page.getByRole('button',{name:'Switch to third person',exact:true}).click();await expect(hub).toHaveAttribute('data-camera','follow');
 const explorer=hub.locator('[aria-label="Your explorer"]'),start=await explorer.evaluate(el=>el.style.left);
 const right=page.getByRole('button',{name:'Move hub right',exact:true});await right.dispatchEvent('pointerdown',{pointerId:1});
 await expect.poll(()=>explorer.evaluate(el=>el.style.left)).not.toBe(start);await page.dispatchEvent('body','pointerup',{pointerId:1});
});
test('teacher dashboard preserves offline records, zero scores and station detail',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const row=learnerRecord({...EMPTY,name:'Ari',completed:[0],xp:100,stationAssessments:{0:{pre:0,post:8}}},'learner-test-001',2);
 await seed(page,{}, {studentId:'teacher-test-001',classId:'classroom-test-001',code:'123456',role:'teacher',records:[row]});
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Classroom · Scores & sync',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Class progress',exact:true})).toBeVisible();
 const learner=page.getByRole('row').filter({hasText:'Ari'});await expect(learner).toContainText('0');await expect(learner).toContainText('8');
 await learner.getByRole('button').click();await expect(page.getByText('Station 1: Pre 0/10 · Post 8/10',{exact:true})).toBeVisible();
 await expect(page.locator('.app')).toHaveAttribute('data-orientation','portrait');await page.screenshot({path:'artifacts/previews/upgrade/classroom.png'});
 await page.getByRole('button',{name:'Learner',exact:true}).click();await expect(page.getByRole('button',{name:'Connect to classroom',exact:true})).toBeDisabled();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('CapacitorStorage.sciblox-classroom-v1')).record?.revision)).toBeGreaterThan(0);
});
test('voice settings preview a selected installed voice and exclude online voices',async({page})=>{
 await page.addInitScript(()=>{
  window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
  Object.defineProperty(speechSynthesis,'getVoices',{value:()=>[{name:'Offline calm A',lang:'en-US',localService:true},{name:'Offline calm B',lang:'en-GB',localService:true},{name:'Online voice',lang:'en-US',localService:false}]});
  Object.defineProperty(speechSynthesis,'speak',{value:speech=>{window.previewed={name:speech.voice.name,rate:speech.rate,pitch:speech.pitch};speech.onstart?.()}});
  Object.defineProperty(speechSynthesis,'cancel',{value:()=>{}});
 });
 await page.setViewportSize({width:390,height:844});await seed(page);
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await page.getByRole('combobox',{name:'Offline voice',exact:true}).selectOption('Offline calm B');
 await expect(page.getByRole('combobox',{name:'Offline voice',exact:true}).getByRole('option',{name:/Online voice/})).toHaveCount(0);
 await page.getByRole('button',{name:'Preview voice',exact:true}).click();
 expect(await page.evaluate(()=>window.previewed)).toEqual({name:'Offline calm B',rate:1.05,pitch:1});
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')).settings.voiceByLanguage.en)).toBe('Offline calm B');
 await page.getByRole('button',{name:'Stop preview',exact:true}).click();await page.screenshot({path:'artifacts/previews/upgrade/voice-settings.png'});
});
test('egg questions require Submit and guardian status stays small without pulsing',async({page})=>{
 await page.setViewportSize({width:844,height:390});const plan=preparationPlan(0);
 await seed(page,{run:{id:'compact-alert-check',index:0,phase:'play',scene:2,reviewUses:0,activityPlan:plan,completedActivities:plan,activeActivity:'finale',collected:[],wrong:0,round:0,chasing:false,pendingEgg:null,eliminated:{},tests:newTests()}});
 await page.getByRole('button',{name:'Resume session',exact:true}).click();await dismissGuide(page,{expected:true});
 const world=page.locator('.adventure-world3d'),explorer=world.locator('[aria-label="Your explorer"]');
 for(const [axis,target,key]of [['left',70,'ArrowRight'],['top',24,'ArrowUp']]){
  await page.keyboard.down(key);try{await expect.poll(()=>explorer.evaluate((el,{axis,target})=>axis==='left'?parseFloat(el.style[axis])>=target:parseFloat(el.style[axis])<=target,{axis,target}),{timeout:15000,intervals:[50]}).toBeTruthy()}finally{await page.keyboard.up(key)}
 }
 await page.getByRole('button',{name:'Open Common egg',exact:true}).click();const question=page.locator('.egg-question');
 await expect(question.getByRole('button',{name:'Submit answer',exact:true})).toBeDisabled();
 await expect(question.locator('.selected-answer')).toHaveCount(0);expect(await question.evaluate(el=>document.activeElement===el)).toBeTruthy();
 for(const button of await question.getByRole('button').all()){const bounds=await button.boundingBox();expect(bounds.y+bounds.height).toBeLessThanOrEqual(390)}
 expect(await question.evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(2);
 await question.locator('.answers button').nth(1).click();await expect(page.getByRole('alert')).toHaveCount(0);
 await question.getByRole('button',{name:'Submit answer',exact:true}).click();await dismissGuide(page,{expected:true});
 const alert=page.getByRole('alert');await expect(alert).toContainText('Return to camp');const box=await alert.boundingBox(),scene=await world.boundingBox();
 expect(box.width).toBeLessThan(844*.35);expect(box.height).toBeLessThan(55);expect(box.y).toBeLessThan(scene.y+65);
 expect(await world.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await expect(page.locator('.hunt-hud')).not.toContainText('NaN');
 await page.screenshot({path:'artifacts/previews/upgrade/compact-guardian-alert.png'});
});

test.describe('multi-touch movement',()=>{
 test.use({hasTouch:true});
 test('releasing jump does not stop a held joystick and releasing joystick stops movement',async({page,context})=>{
  await page.setViewportSize({width:844,height:390});const plan=preparationPlan(0);
  await seed(page,{run:{id:'touch-pointers',index:0,phase:'play',scene:2,reviewUses:0,activityPlan:plan,completedActivities:[],activeActivity:plan[0],collected:[],wrong:0,round:0,tests:newTests()}});
  await page.getByRole('button',{name:'Resume session',exact:true}).click();await dismissGuide(page,{expected:true});
  const hub=page.locator('.journey-hub3d'),explorer=hub.locator('[aria-label="Your explorer"]');
  const stick=await page.getByRole('button',{name:'Move hub right',exact:true}).boundingBox(),jump=await page.getByRole('button',{name:'Jump',exact:true}).boundingBox();
  const first={id:1,x:stick.x+stick.width/2,y:stick.y+stick.height/2},second={id:2,x:jump.x+jump.width/2,y:jump.y+jump.height/2};
  const cdp=await context.newCDPSession(page),x=()=>explorer.evaluate(el=>parseFloat(el.style.left));
  const start=await x();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});await expect.poll(x).toBeGreaterThan(start+.5);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,second]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[second]});
  const afterJump=await x();await expect.poll(x).toBeGreaterThan(afterJump+.5);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(explorer.locator('[data-animation]')).toHaveAttribute('data-animation','idle');
  const stopped=await x();await page.waitForTimeout(250);expect(Math.abs(await x()-stopped)).toBeLessThan(.3);await cdp.detach();
 });
});

test('achievement badges explain their real unlock rules and earned status',async({page})=>{
 await page.setViewportSize({width:390,height:844});await seed(page,{badges:['Mastery: Trait Detective']});await page.getByRole('button',{name:'Profile',exact:true}).click();const badges=page.locator('.achievement-badges');
 await expect(badges).toContainText('1/9 earned');await expect(badges).toContainText('not shop currency');
 await badges.getByRole('button',{name:/Trait Detective/}).click();await expect(badges).toContainText('3 stars: no mistakes');await expect(badges.locator('[data-earned="true"]')).toHaveCount(1);
 await badges.getByRole('button',{name:'Genetics Master Not earned yet',exact:true}).click();await expect(badges).toContainText('Legendary or Prismatic');
});

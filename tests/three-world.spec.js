import {test,expect} from '@playwright/test';
import {EMPTY,preparationPlan} from '../src/journey-state.js';
import {finishStationTest,openActivity,dismissGuide} from './activity-helpers.js';
import {EGG_QUESTIONS} from '../src/journey-data.js';

test.use({hasTouch:true});
const hubSelector='.journey-hub3d:not([data-preview="true"])';

async function seed(page,overrides={}){
 await page.goto('/');
 await page.evaluate(state=>localStorage.setItem('sciblox-v1',JSON.stringify(state)),{
  ...structuredClone(EMPTY),profileReady:true,intro:true,modeChosen:true,assessment:{pre:4,post:null},
  settings:{...EMPTY.settings,sound:false,motion:true},...overrides,
 });
 await page.reload();
 await page.getByRole('button',{name:'Play',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Choose a station',exact:true})).toBeVisible();
}

async function rendered(viewport){
 await expect(viewport).toHaveAttribute('data-state','ready');
 await expect.poll(async()=>Number(await viewport.getAttribute('data-draw-calls'))).toBeGreaterThan(0);
 await expect.poll(async()=>Number(await viewport.getAttribute('data-frame-count'))).toBeGreaterThan(0);
 expect(await viewport.locator('canvas').evaluate(canvas=>{
  const gl=canvas.getContext('webgl2');
  return !!gl&&String(gl.getParameter(gl.VERSION)).includes('WebGL 2');
 })).toBeTruthy();
}

async function moveTo(page,x,y){
 const explorer=page.locator('.adventure-world3d [aria-label="Your explorer"]');
 for(const [axis,target,positive,negative] of [['left',x,'ArrowRight','ArrowLeft'],['top',y,'ArrowDown','ArrowUp']]){
  const start=await explorer.evaluate((element,key)=>parseFloat(element.style[key]),axis);
  const delta=target-start;
  if(Math.abs(delta)<1)continue;
  await page.keyboard.down(delta>0?positive:negative);
  try{
   await expect.poll(async()=>{
    return explorer.evaluate((element,{axis,target,key,positive})=>{
     const value=parseFloat(element.style[axis]);
     const reached=positive?value>=target-1:value<=target+1;
     if(reached)window.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));
     return reached;
    },{axis,target,key:delta>0?positive:negative,positive:delta>0});
   },{intervals:[40],timeout:15000}).toBeTruthy();
  }finally{await page.keyboard.up(delta>0?positive:negative)}
 }
}

function eggRun(){
 const plan=preparationPlan(0);
 return {id:'three-world-check',index:0,phase:'play',scene:2,reviewUses:0,activityPlan:plan,
  completedActivities:plan,activeActivity:'finale',collected:[],wrong:0,attempts:0,hints:0,
  round:0,chasing:false,pendingEgg:null,eliminated:{},startedAt:Date.now()};
}

test('3D activity world renders, walks and switches cameras after portrait station selection',async({page})=>{
 await seed(page,{run:{...eggRun(),completedActivities:[],activeActivity:preparationPlan(0)[0]}});await page.getByRole('button',{name:'Resume session',exact:true}).click();await page.getByRole('button',{name:'Skip',exact:true}).click();const hub=page.locator(hubSelector);await rendered(hub.locator('.three-viewport'));const player=hub.locator('[aria-label="Your explorer"]');const start=await player.evaluate(el=>parseFloat(el.style.left));await page.keyboard.down('ArrowRight');await expect(player.locator('[data-animation]')).toHaveAttribute('data-animation','walk');await expect.poll(()=>player.evaluate(el=>parseFloat(el.style.left))).toBeGreaterThan(start+1);await page.keyboard.up('ArrowRight');await expect(player.locator('[data-animation]')).toHaveAttribute('data-animation','idle');await hub.getByRole('button',{name:'View island overview',exact:true}).click();await expect(hub).toHaveAttribute('data-camera','overview');await hub.getByRole('button',{name:'Follow my explorer',exact:true}).click();await expect(hub).toHaveAttribute('data-camera','follow');
});

test('rendered egg can be ray-picked and accessible controls preserve collection',async({page})=>{
 test.setTimeout(60000);
 await seed(page,{run:eggRun()});
 await page.getByRole('button',{name:'Resume session',exact:true}).click();
 await page.getByRole('button',{name:'Skip',exact:true}).click();
 const world=page.locator('.adventure-world3d'),viewport=world.locator('.three-viewport');
 await rendered(viewport);
 await moveTo(page,72,22);
 await page.waitForTimeout(850);
 const bounds=await viewport.locator('canvas').boundingBox();
 expect(bounds).toBeTruthy();
 // Tap the physical egg region without relying on a particular camera framing.
 for(const [x,y]of [[.5,.61],[.5,.66],[.47,.61],[.53,.61],[.5,.56],[.5,.7]]){
  await page.mouse.click(bounds.x+bounds.width*x,bounds.y+bounds.height*y);
  if(await page.locator('.egg-question').count())break;
 }
 await expect(page.locator('.egg-question')).toBeVisible();
 await page.locator('.egg-question .answers button').nth(EGG_QUESTIONS[0][0].answer).click();await page.getByRole('button',{name:'Submit answer',exact:true}).click();
 await expect(world.getByRole('button',{name:'Open Common egg',exact:true})).toBeDisabled();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')).run.collected)).toEqual([0]);
 await dismissGuide(page,{expected:true});await moveTo(page,82,66);
 await world.getByRole('button',{name:'Open Rare egg',exact:true}).click();
 await expect(page.locator('.egg-question')).toBeVisible();
});

test('WebGL context loss recovers without replacing saved game progression',async({page})=>{
 await seed(page,{points:123,xp:50,completed:[0],run:{...eggRun(),completedActivities:[],activeActivity:preparationPlan(0)[0]}});await page.getByRole('button',{name:'Resume session',exact:true}).click();await page.getByRole('button',{name:'Skip',exact:true}).click();
 const viewport=page.locator(hubSelector+' .three-viewport');
 await rendered(viewport);
 const frames=Number(await viewport.getAttribute('data-frame-count'));
 const supported=await viewport.locator('canvas').evaluate(canvas=>{
  const extension=canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
  if(!extension)return false;
  extension.loseContext();setTimeout(()=>extension.restoreContext(),1800);return true;
 });
 expect(supported).toBeTruthy();
 await expect(viewport).toHaveAttribute('data-state','lost');
 await rendered(viewport);
 await expect.poll(async()=>Number(await viewport.getAttribute('data-frame-count')),{timeout:15000}).toBeGreaterThan(frames);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')));
 expect(saved.points).toBe(123);expect(saved.completed).toEqual([0]);
});

test('unavailable WebGL keeps portal selection and in-world lessons usable',async({page})=>{await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /^(webgl2?|experimental-webgl)$/.test(kind)?null:original.call(this,kind,...args)}});await seed(page,{run:{...eggRun(),completedActivities:[],activeActivity:preparationPlan(0)[0]}});await page.getByRole('button',{name:'Resume session',exact:true}).click();await openActivity(page);await expect(page.locator(hubSelector+' .three-viewport')).toHaveAttribute('data-state','fallback');await expect(page.locator('.station-preparation')).toBeVisible()});

test('phone portrait and landscape scenes fit and use bundled local assets',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const external=[];
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(!['127.0.0.1','localhost'].includes(url.hostname)){external.push(url.href);return route.abort()}
  return route.continue();
 });
 await seed(page,{run:{...eggRun(),completedActivities:[],activeActivity:preparationPlan(0)[0]}});await page.getByRole('button',{name:'Resume session',exact:true}).click();await page.getByRole('button',{name:'Skip',exact:true}).click();
 const hub=page.locator(hubSelector);
 await rendered(hub.locator('.three-viewport'));
 for(const size of [{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(size);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  const bounds=await hub.locator('canvas').boundingBox();
  expect(bounds.width).toBeGreaterThan(100);expect(bounds.width).toBeLessThanOrEqual(size.width+1);
  await expect(hub.getByRole('button',{name:'Move hub right',exact:true})).toBeVisible();
  const control=await hub.getByRole('button',{name:'Move hub right',exact:true}).boundingBox();
  expect(control.width).toBeGreaterThanOrEqual(40);expect(control.height).toBeGreaterThanOrEqual(40);
 }
 expect(external).toEqual([]);
});

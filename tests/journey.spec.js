import {test,expect} from '@playwright/test';
import {EMPTY} from '../src/journey-state.js';
import {cross,CROSSES,EGG_QUESTIONS,ASSESSMENT} from '../src/journey-data.js';
import {activityCatalog} from '../src/station-activities-data.js';
import {completeWorkshops,dismissGuide,savedProgress,solveActivity,solveFamilyTree,finishStationTest,goHome,openActivity} from './activity-helpers.js';

test('family portraits and symbols highlight errors without filling answers',async({page})=>{
 await seed(page,{xp:700,completed:[0,1,2]});await review(page,3);
 await solveActivity(page,activityCatalog[3][0]);
 await openActivity(page);await page.getByRole('button',{name:'Check family tree'}).click();
 await expect(page.locator('.portrait-tray .error-card')).toHaveCount(6);
 await expect(page.locator('.family-workshop .feedback')).toContainText('correct placements remain hidden');
 expect((await savedProgress(page)).run.completedActivities).not.toContain('family-construction');
 await solveFamilyTree(page);
 expect((await savedProgress(page)).run.completedActivities).toContain('family-construction');
 expect((await savedProgress(page)).mistakes[3]).toBe(1);
 await expect(page.locator('.hunt-world')).toBeVisible();
});

test('daily practice favors weak stations and rewards only once that day',async({page})=>{await seed(page,{mistakes:{6:12,4:7,5:3}});await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:/Daily Lab Quest/}).click();await expect(page.getByText('Reviewing Ratio Arena.',{exact:false})).toBeVisible();for(const index of [6,4,5])await page.locator('.activity-panel .answers button').nth(ASSESSMENT[index].answer).click();await expect(page.getByRole('heading',{name:'Today’s discoveries are complete.'})).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')).points)).toBe(30);await page.reload();await enterGame(page);await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:/Daily Lab Quest/}).click();await expect(page.getByRole('heading',{name:'Today’s discoveries are complete.'})).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')).points)).toBe(30)});
async function enterGame(page){await page.getByRole('button',{name:'Play',exact:true}).click()}
async function seed(page,overrides={}){await page.goto('/');await page.evaluate(s=>localStorage.setItem('sciblox-v1',JSON.stringify(s)),{...structuredClone(EMPTY),profileReady:true,intro:true,modeChosen:true,assessment:{pre:4,post:null},settings:{...EMPTY.settings,motion:false,sound:false},...overrides});await page.reload();await enterGame(page);await expect(page.getByRole('heading',{name:'Choose a station'})).toBeVisible()}
async function review(page,index){await page.getByRole('button',{name:new RegExp('^Station '+(index+1)+':')}).click();await page.getByRole('button',{name:/^(Enter station|Resume session)$/}).click();await finishStationTest(page,index);await page.getByRole('button',{name:'Continue the story'}).click();await page.getByRole('button',{name:'Continue the story'}).click();const q=EGG_QUESTIONS[index]?.[0]||ASSESSMENT[index];await page.locator('.review-scene .answers button').nth(q.answer).click();await page.getByRole('button',{name:'Start gameplay'}).click();await openActivity(page)}
async function move(page,x,y){while(await page.locator('.guide-npc').count())await page.locator('.guide-npc').getByRole('button',{name:'Skip',exact:true}).click();for(const [axis,target,positive,negative]of [['left',x,'ArrowRight','ArrowLeft'],['top',y,'ArrowDown','ArrowUp']]){const start=await page.locator('.adventure-world3d [aria-label="Your explorer"]').evaluate((el,key)=>parseFloat(el.style[key]),axis),delta=target-start;if(Math.abs(delta)<2)continue;const key=delta>0?positive:negative;await page.keyboard.down(key);try{await expect.poll(()=>page.evaluate(({axis,target,key,positive})=>{const value=parseFloat(document.querySelector('.adventure-world3d [aria-label="Your explorer"]').style[axis]);const reached=positive?value>=target-1:value<=target+1;if(reached)window.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));return reached},{axis,target,key,positive:delta>0}),{intervals:[40],timeout:20000}).toBeTruthy()}finally{await page.keyboard.up(key)}}}

test('offline profile and animated introduction lead into station pre-test',async({page})=>{
 await page.goto('/');await enterGame(page);await page.getByLabel('Player name',{exact:true}).fill('Ari');await page.getByLabel('Female',{exact:true}).check();await page.getByRole('button',{name:'Choose avatar 3',exact:true}).click();await page.getByRole('button',{name:'Save profile & continue',exact:true}).click();await expect(page.locator('.bhell-portrait img')).toBeVisible();
 await page.getByRole('button',{name:'Continue introduction'}).click();await page.getByRole('button',{name:'Continue introduction'}).click();await page.getByRole('button',{name:'Tap to Start'}).click();await page.getByRole('button',{name:/Play solo/}).click();await review(page,0);expect((await savedProgress(page)).stationAssessments[0].pre).toBe(10);await page.reload();await enterGame(page);expect((await savedProgress(page)).profile.avatar).toBe('Human');
});

for(let index=0;index<4;index++)test(`egg hunt session ${index+1}: movement, collection, reward and persistence`,async({page})=>{
 test.setTimeout(90000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await seed(page,{xp:700,completed:Array.from({length:index},(_,i)=>i)});await review(page,index);await completeWorkshops(page,index);
 for(const [egg,x,y]of [[0,72,22],[1,82,66],[2,35,37]]){await move(page,x,y);await move(page,x,y);await page.getByRole('button',{name:'Open '+['Common','Rare','Epic'][egg]+' egg',exact:true}).click();await expect(page.locator('.egg-question')).toBeVisible();await page.locator('.egg-question .answers button').nth(EGG_QUESTIONS[index][egg].answer).click();await page.getByRole('button',{name:'Submit answer',exact:true}).click();if(egg<2)await dismissGuide(page,{expected:true})}
 await finishStationTest(page,index,'post');await expect(page.getByText('SESSION COMPLETE',{exact:true})).toBeVisible();const save=await savedProgress(page);expect(save.points).toBe(80+activityCatalog[index].length*10);expect(save.eggs).toHaveLength(3);await page.reload();await enterGame(page);expect((await savedProgress(page)).completed).toContain(index);expect(errors).toEqual([]);
});

test('wrong egg answer triggers guardian chase and preserves safe retry',async({page})=>{
 test.setTimeout(90000);await seed(page);await review(page,0);await completeWorkshops(page,0);await move(page,72,22);await page.getByRole('button',{name:'Open Common egg',exact:true}).click();await page.locator('.egg-question .answers button').nth(1).click();await page.getByRole('button',{name:'Submit answer',exact:true}).click();
 await dismissGuide(page,{expected:true});await expect(page.getByRole('alert')).toContainText('Guardian chase');await expect(page.locator('.egg-question')).toHaveCount(0);await page.getByRole('button',{name:'Run to Safe Spot',exact:false}).click();await expect(page.getByRole('alert')).toHaveCount(0);
 await move(page,72,22);await page.getByRole('button',{name:'Open Common egg',exact:true}).click();await expect(page.locator('.egg-question .answers button').nth(1)).toBeDisabled();await page.locator('.egg-question .answers button').nth(0).click();await page.getByRole('button',{name:'Submit answer',exact:true}).click();expect((await savedProgress(page)).mistakes[0]).toBe(1);
});

for(const index of [4,5,6])test(`lab session ${index+1}: three crosses and validated rewards`,async({page})=>{
 test.setTimeout(90000);await seed(page,{xp:700,completed:Array.from({length:index},(_,i)=>i)});await review(page,index);await completeWorkshops(page,index);
 for(let round=0;round<3;round++){
  const result=cross(...CROSSES[round]),entries={};await expect(page.getByText('Round '+(round+1)+'/3',{exact:true})).toBeVisible();
  if(index===4)result.boxes.forEach((g,i)=>entries['Offspring box '+(i+1)]=g);
  if(index<6){['BB','Bb','bb'].forEach((g,i)=>entries['Number of '+g+' offspring']=String(result.counts[i]));entries['Dominant phenotype count']=String(result.dominant)}
  if(index>=5){entries['Genotype ratio BB:Bb:bb']=result.genotype;entries['Phenotype ratio dominant:recessive']=result.phenotype}
  if(index===6){['BB','Bb','bb'].forEach((g,i)=>entries[g+' offspring (%)']=String(result.percent[i]));entries['Dominant offspring (%)']=String(result.dominantPercent);entries['Recessive offspring (%)']=String(result.recessivePercent)}
  for(const [label,value]of Object.entries(entries))await page.getByLabel(label,{exact:true}).fill(value);await page.getByRole('button',{name:'Check round',exact:true}).click();await expect.poll(async()=>(await savedProgress(page)).run.round).toBe(round+1);if(round<2)await dismissGuide(page,{expected:true});
 }
 await finishStationTest(page,index,'post');await expect(page.getByText('SESSION COMPLETE',{exact:true})).toBeVisible();expect((await savedProgress(page)).points).toBe(60+activityCatalog[index].length*10);
});

test('fusion validates before consuming matching parents and unlocks the post-test',async({page})=>{
 test.setTimeout(90000);await seed(page,{xp:700,completed:[0,1,2,3,4,5,6],pets:[{id:'a',species:'Owl',level:1,rarity:2,genotype:'Bb'},{id:'b',species:'Owl',level:1,rarity:2,genotype:'Bb'}]});await review(page,7);await completeWorkshops(page,7);await page.getByLabel('Parent 1',{exact:true}).selectOption('a');await page.getByLabel('Parent 2',{exact:true}).selectOption('b');
 const entries={'Offspring box 1':'BB','Offspring box 2':'Bb','Offspring box 3':'Bb','Offspring box 4':'bb','Genotype ratio BB:Bb:bb':'1:2:1','Phenotype ratio dominant:recessive':'3:1','BB offspring (%)':'25','Bb offspring (%)':'50','bb offspring (%)':'25','Dominant offspring (%)':'75','Recessive offspring (%)':'25'};
 for(const [label,value]of Object.entries(entries))await page.getByLabel(label,{exact:true}).fill(value);await page.getByRole('button',{name:'Check fusion solution'}).click();expect((await savedProgress(page)).pets).toHaveLength(2);await dismissGuide(page,{expected:true});await page.getByRole('button',{name:'Confirm fusion of both pets',exact:false}).click();await finishStationTest(page,7,'post');await expect(page.getByText('SESSION COMPLETE',{exact:true})).toBeVisible();const save=await savedProgress(page);expect(save.pets).toHaveLength(1);expect(save.pets[0].rarity).toBe(3);expect(save.badges).toContain('Genetics Master');expect(save.stationAssessments[7].post).toBe(10);
});

test('phone reviewers, economy, animated hatchery and pet reactions work',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:390,height:844});await seed(page,{points:100,eggs:[{id:'ready',species:'Turtle',rarity:0,genotype:'bb',readyAt:1}]});await page.getByRole('button',{name:'My Pets',exact:true}).click();await page.getByRole('button',{name:/Hatchery \(1\)/}).click();await page.getByRole('button',{name:'Hatch egg',exact:true}).click();await expect(page.getByRole('dialog',{name:'A new companion is hatching',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Hello, Turtle!',exact:true})).toBeVisible();await page.getByRole('button',{name:'Meet my companion',exact:true}).click();await page.getByRole('button',{name:'My pets',exact:true}).click();const pet=page.getByRole('button',{name:'Greet Turtle',exact:true}).first();await pet.click();await expect(pet).toHaveClass(/pet-happy/);await page.getByRole('button',{name:/Upgrade · 60 coins/}).click();await goHome(page);await review(page,0);
 for(let i=0;i<3;i++){await page.getByRole('button',{name:new RegExp('^Reviewer '+(3-i)+'/3$')}).click();await page.getByRole('button',{name:'Return to gameplay'}).click()}
 await expect(page.getByRole('button',{name:'Reviewer 0/3',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Pause menu',exact:true}).click();await page.getByRole('button',{name:/Hint · 40 coins/}).click();await expect(page.getByRole('dialog',{name:'hint',exact:true})).toContainText('NO SOLUTIONS');await page.getByRole('button',{name:'Return to gameplay'}).click();expect((await savedProgress(page)).points).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

test('mode selection explains nearby hotspot play and preserves solo choice',async({page})=>{
 await seed(page);
 await page.getByRole('button',{name:'Solo / Multiplayer',exact:true}).click();
 await page.getByRole('button',{name:/Play with nearby friends/}).click();
 await expect(page.getByRole('heading',{name:'One island. Your own explorer.'})).toBeVisible();
 await expect(page.getByText('Install the Android app to connect.',{exact:true})).toBeVisible();
 await expect(page.getByText('Internet and mobile data are unnecessary.',{exact:false})).toBeVisible();
 expect((await savedProgress(page)).modeChosen).toBeTruthy();
 expect((await savedProgress(page)).mode).toBe('multiplayer');
 await goHome(page);
 await page.getByRole('button',{name:'Solo / Multiplayer',exact:true}).click();
 await page.getByRole('button',{name:/Play solo/}).click();
 expect((await savedProgress(page)).mode).toBe('solo');
 await page.reload();await enterGame(page);
 await expect(page.getByRole('heading',{name:'Choose a station'})).toBeVisible();
});

test('workshops gate the finale, persist progression, and reward completion once',async({page})=>{
 await seed(page);await review(page,0);
 await page.getByRole('button',{name:'Return to world',exact:true}).click();await page.locator('.world-activity-tracker summary').click();const activities=page.getByRole('navigation',{name:'Activities in this station'});
 await expect(activities.getByRole('button',{name:/Three Hidden Eggs/})).toBeDisabled();
 await expect(activities.getByRole('button',{name:/Inherited or Acquired/})).toBeDisabled();
 await solveActivity(page,activityCatalog[0][0]);
 expect((await savedProgress(page)).points).toBe(10);
 await page.reload();await enterGame(page);await page.getByRole('button',{name:'Resume session',exact:true}).click();
 await openActivity(page);await expect(page.locator('.station-preparation').getByRole('heading',{name:'Inherited or Acquired?',exact:true})).toBeVisible();await page.getByRole('button',{name:'Return to world',exact:true}).click();await page.locator('.world-activity-tracker summary').click();
 await activities.getByRole('button',{name:/Trait Explorer/}).click();
 await expect(page.getByText('Complete and saved.',{exact:false})).toBeVisible();
 expect((await savedProgress(page)).points).toBe(10);
 await page.getByRole('button',{name:'Continue station',exact:true}).click();
 for(const spec of activityCatalog[0].slice(1))await solveActivity(page,spec);
 const guide=page.getByRole('button',{name:'Let’s explore',exact:true});if(await guide.count())await guide.click();if(!await page.locator('.world-activity-tracker').getAttribute('open')){const tracker=page.locator('.world-activity-tracker');if(!await tracker.evaluate(el=>el.open))await tracker.locator('summary').click();}
 await expect(activities.getByRole('button',{name:/Three Hidden Eggs/})).toBeEnabled();
 await expect(page.locator('.hunt-world')).toBeVisible();
 expect((await savedProgress(page)).run.completedActivities).toHaveLength(4);
 expect((await savedProgress(page)).points).toBe(40);
 const player=page.locator('[aria-label="Your explorer"] [data-animation]');
 await expect(player).toHaveAttribute('data-animation','idle');
 await page.keyboard.down('ArrowRight');await expect(player).toHaveAttribute('data-animation','walk');
 await page.keyboard.up('ArrowRight');await expect(player).toHaveAttribute('data-animation','idle');
});

test('header validation rejects the wrong parent side and allows correction',async({page})=>{
 await seed(page,{xp:700,completed:[0,1,2,3]});await review(page,4);
 const workshop=page.locator('.station-preparation');
 await workshop.getByRole('button',{name:'Select Parent B allele B',exact:true}).click();
 await workshop.getByRole('button',{name:'Top header 1 \u00b7 empty',exact:true}).click();
 await expect(workshop.getByRole('button',{name:'Top header 1 \u00b7 empty',exact:true})).toBeVisible();
 await expect(workshop.locator('.prep-feedback')).toContainText('Keep one parent across the top');
 expect((await savedProgress(page)).mistakes[4]).toBe(1);
 await solveActivity(page,activityCatalog[4][0]);
 expect((await savedProgress(page)).run.completedActivities).toContain('parent-headers');
});

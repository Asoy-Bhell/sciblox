import {expect} from '@playwright/test';
import {activityCatalog} from '../src/station-activities-data.js';
import {assessmentQuestions} from '../src/station-assessments.js';

export async function finishStationTest(page,index,kind='pre'){
 const panel=page.locator('.station-assessment');
 const saved=await savedProgress(page),start=saved.run.tests[kind].answers.length;
 for(let question=start;question<10;question++){await panel.locator('.answers button').nth(assessmentQuestions(index,kind)[question].answer).click();await panel.getByRole('button',{name:'Next',exact:true}).click();}
 await panel.getByRole('button',{name:kind==='pre'?'Save score & meet Bhell':'Save score & finish station',exact:true}).click();
}
export async function goHome(page){
 if(await page.getByRole('button',{name:'Pause menu',exact:true}).count())await page.getByRole('button',{name:'Pause menu',exact:true}).click();
 await page.getByRole('button',{name:'Adventure map',exact:true}).click();
}

export async function savedProgress(page) {
  return page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')));
}

// Guide feedback is a deliberate player step, including queued level-up cards.
export async function dismissGuide(page,{expected=false}={}) {
 const guide=page.locator('.guide-npc');
 if(expected)await expect(guide).toBeVisible();
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 while(await guide.count()){
  await guide.getByRole('button',{name:'Skip',exact:true}).click();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 }
}

export async function solveFamilyTree(page) {
  const workshop=page.locator('.family-workshop');
  const people=[['Grandfather','I','■'],['Grandmother','I','○'],['Father','II','■'],['Mother','II','○'],['Son','III','□'],['Daughter','III','●']];
  for(const [name,generation,symbol] of people) {
    await workshop.locator('.portrait-tray').getByText(name,{exact:true}).click();
    await workshop.getByRole('button',{name:'Place portrait in generation '+generation,exact:true}).click();
    await workshop.getByRole('combobox',{name:name+' trait symbol',exact:true}).selectOption(symbol);
  }
  await workshop.getByRole('button',{name:'Check family tree'}).click();
}

// Completes the actual visible workshop, without modifying saved activity state.
export async function openActivity(page){
 while(await page.locator('.guide-npc').count())await page.locator('.guide-npc').getByRole('button',{name:'Skip',exact:true}).click();
 const guide=page.getByRole('button',{name:'Let’s explore',exact:true});if(await guide.count())await guide.click();
 const enter=page.getByRole('button',{name:'Enter activity',exact:true});if(await enter.count()&&!await page.locator('.world-activity-overlay').count())await enter.click();
}
export async function solveActivity(page,spec) {
 await openActivity(page);
  const workshop=page.locator('.station-preparation');
  await expect(workshop.getByRole('heading',{name:spec.title,exact:true})).toBeVisible();
  if(spec.type==='sort') {
    for(const card of spec.cards) {
      await workshop.getByRole('button',{name:'Select '+card.label,exact:true}).click();
      const destination=spec.groups.find(group=>group.id===card.target);
      await workshop.getByRole('button',{name:'Place selected card in '+destination.label,exact:true}).click();
    }
    await workshop.getByRole('button',{name:'Check Answers',exact:true}).click();
  } else if(spec.type==='discovery') {
    for(const card of spec.cards)await workshop.getByRole('button',{name:card.label,exact:true}).click();
    await workshop.getByRole('button',{name:'Save my discoveries'}).click();
  } else if(spec.type==='quiz') {
    for(const question of spec.questions)await workshop.getByRole('button',{name:question.options[question.answer],exact:true}).click();
  } else if(spec.type==='connections') {
    for(const label of ['Maya ↔ Omar','Maya & Omar ↓ Ana','Ana ↔ Ben','Ana & Ben ↓ Leo']) {
      await workshop.getByRole('button').filter({hasText:label}).click();
    }
    await workshop.getByRole('button',{name:'Check repaired connections'}).click();
  } else if(spec.type==='scanner') {
    for(const name of ['Father','Mother','Child'])await workshop.getByRole('button',{name:'Scan '+name,exact:true}).click();
    await workshop.getByRole('button',{name:'Use my scans to infer genotypes'}).click();
    await workshop.getByRole('button',{name:'bb',exact:true}).click();
    await workshop.getByRole('button',{name:'Both Bb',exact:true}).click();
  } else if(spec.type==='family') {
    await solveFamilyTree(page);
  } else if(spec.type==='headers') {
    for(const [parent,allele,slot] of [['A','B','Top header 1'],['A','b','Top header 2'],['B','B','Left header 1'],['B','b','Left header 2']]) {
      await workshop.getByRole('button',{name:'Select Parent '+parent+' allele '+allele,exact:true}).click();
      await workshop.getByRole('button',{name:new RegExp('^'+slot+' ·')}).click();
    }
    await workshop.getByRole('button',{name:'Check parent headers'}).click();
  } else if(spec.type==='numbers') {
    for(const field of spec.fields)await workshop.getByLabel(field.label,{exact:true}).fill(field.answer);
    await workshop.getByRole('button',{name:'Check Answers',exact:true}).click();
  } else if(spec.type==='parents') {
    await workshop.getByRole('button',{name:'Select Fern · Turtle · level 2',exact:true}).click();
    await workshop.getByRole('button',{name:'Select Moss · Turtle · level 2',exact:true}).click();
    await workshop.getByRole('button',{name:'Check parent eligibility'}).click();
  } else throw new Error('No browser solver for activity type '+spec.type);
  await expect.poll(async()=> (await savedProgress(page)).run.completedActivities).toContain(spec.id);
}

export async function completeWorkshops(page,station) {
  for(const spec of activityCatalog[station])await solveActivity(page,spec);
  await expect.poll(async()=>(await savedProgress(page)).run.activeActivity).toBe('finale');
  const next=page.getByRole('button',{name:'Let’s explore',exact:true});
  if(await next.count())await next.click();
 if(station>=4)await openActivity(page);
}

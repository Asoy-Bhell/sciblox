import {test,expect} from '@playwright/test';
import {getBank} from '../src/data.js';
test('station locks, pre-test, explorer, sorting, guardian safe zone, and saved progress',async({page})=>{
 const failures=[];page.on('pageerror',e=>failures.push(e.message));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Your next big discovery awaits.'})).toBeVisible();
 await page.getByRole('button',{name:/STATION 02/}).click();
 await expect(page.getByRole('status')).toContainText('Complete the previous station');
 await page.getByRole('button',{name:'Let’s explore'}).click();
 await page.getByRole('button',{name:'Begin pre-test'}).click();
 const answers=['Natural feather color','Purple flowers','pp','Acquired','A version of a gene','Each parent','P','Pp','No','Acquired'];
 for(let i=0;i<10;i++){
   await page.getByRole('dialog').getByRole('button',{name:new RegExp('^[ABC] '+answers[i]+'$')}).click();
   await page.getByRole('button',{name:i===9?'See results':'Next question'}).click();
 }
 await page.getByRole('button',{name:'Return to station'}).click();
 for(const name of ['Bird','Bicycle','Flower'])await page.getByRole('button',{name:new RegExp(name+' Tap to investigate')}).click();
 await expect(page.getByText('Discovery saved!')).toBeVisible();
 await page.getByRole('button',{name:/2 Inherited or Acquired/}).click();
 for(const [card,zone]of [['Feather color','Inherited'],['Cycling','Acquired'],['Flower color','Inherited'],['A scar','Acquired']]){
  await page.getByRole('button',{name:new RegExp(card)}).click();
  await page.locator('.dropzone').filter({has:page.getByText(zone,{exact:true})}).click();
 }
 await expect(page.getByText('Discovery saved!')).toBeVisible();
 await page.getByRole('button',{name:/4 Gene Guardian Room/}).click();
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'PP',exact:true}).click();
 await expect(page.getByText('You’re safe at base camp.')).toBeVisible();
 await page.getByRole('button',{name:'Try again'}).click();
 await page.getByRole('button',{name:'pp',exact:true}).click();
 await expect(page.getByText('Discovery saved!')).toBeVisible();
 await page.reload();
 await expect(page.locator('.coin')).toHaveText('90');
 await page.getByRole('button',{name:'Continue adventure'}).click();
 await page.getByRole('button',{name:/3 Dominant–Recessive Bridge/}).click();
 for(const [card,zone]of [['PP','Dominant phenotype'],['Pp','Dominant phenotype'],['pp','Recessive phenotype']]){
  await page.getByRole('button',{name:new RegExp('^🌺 '+card+'$|^🤍 '+card+'$')}).click();
  await page.locator('.dropzone').filter({has:page.getByText(zone,{exact:true})}).click();
 }
 await page.getByRole('button',{name:/5 Three Hidden Eggs/}).click();
 for(const answer of ['White','Acquired','One dominant and one recessive'])await page.getByRole('button',{name:answer,exact:true}).click();
 await page.getByRole('button',{name:'Post-test'}).click();
 for(let i=0;i<10;i++){
  await page.getByRole('dialog').getByRole('button',{name:new RegExp('^[ABC] '+answers[i]+'$')}).click();
  await page.getByRole('button',{name:i===9?'See results':'Next question'}).click();
 }
 await page.getByRole('button',{name:'Hatch my egg'}).click();
 await expect(page.getByText('A NEW FRIEND HAS HATCHED!')).toBeVisible();
 await page.getByRole('button',{name:'Meet your companion'}).click();
 await expect(page.getByRole('heading',{name:'Pip the Parrot'})).toBeVisible();
 await page.getByRole('button',{name:'Adventure map',exact:true}).click();
 await expect(page.locator('.coin')).toHaveText('300');
 await page.getByRole('button',{name:/STATION 02/}).click();
 await expect(page.getByRole('heading',{name:'Family Generation Forest.'})).toBeVisible();
 expect(failures).toEqual([]);
});
test('tablet layout and Punnett validation',async({page})=>{
 await page.setViewportSize({width:820,height:1180});await page.goto('/');
 await page.evaluate(()=>{localStorage.setItem('sciblox-v1',JSON.stringify({completed:[0,1,2,3],pre:{4:5},activities:{},points:600,xp:1000,name:'Tester',motion:false}))});
 await page.reload();await page.getByRole('button',{name:/STATION 05/}).click();
 await page.getByRole('button',{name:/2 Build the offspring grid/}).click();
 await page.getByLabel('B × B',{exact:true}).fill('BB');await page.getByLabel('B × b',{exact:true}).fill('Bb');
 await page.getByLabel('b × B',{exact:true}).fill('Bb');await page.getByLabel('b × b',{exact:true}).fill('bb');
 await page.getByRole('button',{name:'Check offspring grid'}).click();
 await expect(page.getByText('Discovery saved!')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

for(let station=1;station<7;station++)test(`Station ${station+1}: all activities, post-test, and reward`,async({page})=>{
 await page.goto('/');
 await page.evaluate(i=>localStorage.setItem('sciblox-v1',JSON.stringify({completed:Array.from({length:i},(_,n)=>n),pre:{[i]:4},activities:{},points:0,xp:0,name:'Tester',motion:false})),station);
 await page.reload();await page.getByRole('button',{name:new RegExp('STATION 0'+(station+1))}).click();
 const place=async(card,zone)=>{
  await page.locator('.sort-cards button').filter({hasText:card}).click();
  await page.locator('.dropzone').filter({has:page.getByText(zone,{exact:true})}).click();
 };
 const check=async(name,entries)=>{for(const [label,value]of entries)await page.getByLabel(label,{exact:true}).fill(value);await page.getByRole('button',{name}).click();await expect(page.getByText('Discovery saved!')).toBeVisible()};
 if(station<4){
  for(const [card,zone]of [['Grandmother','I · Grandparents'],['Grandfather','I · Grandparents'],['Mother','II · Parents'],['Father','II · Parents'],['Daughter','III · Children'],['Son','III · Children']])await place(card,zone);
  await page.getByRole('button',{name:/2 Pedigree scanner/}).click();
  await page.getByRole('button',{name:'Scan father'}).click();
  await expect(page.getByRole('status')).toContainText('Generation II');
  for(const [label,value]of [['Father (trait present)','■'],['Mother (trait absent)','○'],['Daughter (trait present)','●']])await page.getByLabel(label,{exact:true}).selectOption(value);
  await page.getByRole('button',{name:'Check answers'}).click();
  await page.getByRole('button',{name:/3 Repair the family connections/}).click();
  await place('Grandparents →','Parents');await place('Parents →','Children');
 }else if(station===4){
  for(const [label,value]of [['Top parent','Parent 1'],['Left parent','Parent 2'],['First top allele','B'],['Second top allele','b'],['First side allele','B'],['Second side allele','b']])await page.getByLabel(label,{exact:true}).selectOption(value);
  await page.getByRole('button',{name:'Check headers'}).click();
  await page.getByRole('button',{name:/2 Build the offspring grid/}).click();
  await check('Check offspring grid',[['B × B','BB'],['B × b','Bb'],['b × B','Bb'],['b × b','bb']]);
  await page.getByRole('button',{name:/3 Grid Guardian Room/}).click();await page.getByRole('button',{name:'Bb',exact:true}).click();
 }else{
  await check('Check analysis',[['Number of BB offspring','1'],['Number of Bb offspring','2'],['Number of bb offspring','1']]);
  await page.getByRole('button',{name:/2 Read the phenotypes/}).click();
  await check('Check analysis',[['Dominant phenotype count','3'],['Recessive phenotype count','1'],['Dominant probability (%)','75']]);
  await page.getByRole('button',{name:/3 Open the ratio vault/}).click();
  await check('Open the vault',[['Genotype ratio BB:Bb:bb','1:2:1'],['Phenotype ratio dominant:recessive','3:1']]);
 }
 await page.getByRole('button',{name:'Post-test'}).click();
 for(const [i,q]of getBank(station).entries()){
  await page.getByRole('dialog').locator('.answers button').nth(q.answer).click();
  await page.getByRole('button',{name:i===9?'See results':'Next question'}).click();
 }
 await page.getByRole('button',{name:'Hatch my egg'}).click();
 await expect(page.getByText('A NEW FRIEND HAS HATCHED!')).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')).completed)).toContain(station);
});

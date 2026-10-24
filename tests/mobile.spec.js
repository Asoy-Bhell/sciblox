import {test,expect} from '@playwright/test';

test.use({viewport:{width:360,height:800},hasTouch:true,isMobile:true});
test('phone bottom navigation, touch sorting, modal focus and screen fit',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Your next big discovery awaits.'})).toBeVisible();
 for(const width of [360,390,412]){
  await page.setViewportSize({width,height:800});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  const navigation=await page.locator('.sidebar').boundingBox();
  expect(navigation.y+navigation.height).toBeCloseTo(800,0);
 }
 await page.setViewportSize({width:360,height:800});
 await page.screenshot({path:'mobile-preview.png'});
 await page.getByRole('button',{name:'Field guide',exact:true}).tap();
 await expect(page.getByRole('heading',{name:'The field guide.'})).toBeVisible();
 await page.getByRole('button',{name:'Settings',exact:true}).tap();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByLabel('Explorer name').fill('Mobile Explorer');
 await page.getByRole('button',{name:'Save & return'}).tap();
 await page.getByRole('button',{name:'Adventure map',exact:true}).tap();
 await page.evaluate(()=>{
  const save=JSON.parse(localStorage.getItem('sciblox-v1'));save.pre={0:3};localStorage.setItem('sciblox-v1',JSON.stringify(save));
 });
 await page.reload();
 await page.getByRole('button',{name:'Let’s explore'}).tap();
 await page.getByRole('button',{name:/2 Inherited or Acquired/}).tap();
 for(const [card,zone]of [['Feather color','Inherited'],['Cycling','Acquired'],['Flower color','Inherited'],['A scar','Acquired']]){
  await page.locator('.sort-cards button').filter({hasText:card}).tap();
  await page.locator('.dropzone').filter({has:page.getByText(zone,{exact:true})}).tap();
 }
 await expect(page.getByText('Discovery saved!')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Pre-test: 3/10'}).tap();
 await expect(page.getByRole('dialog')).toBeVisible();
 expect(await page.getByRole('dialog').evaluate(el=>el.contains(document.activeElement))).toBeTruthy();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.reload();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')).name)).toBe('Mobile Explorer');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sciblox-v1')).activities['0-1'])).toBeTruthy();
});

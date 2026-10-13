import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1200}});
await page.goto('http://127.0.0.1:5173');
await page.screenshot({path:'preview.png',fullPage:true});
await browser.close();

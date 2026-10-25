import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser=process.env.PLAYWRIGHT_BROWSER_PATH||(process.platform==='win32'&&existsSync(edge)?edge:undefined);
export default defineConfig({webServer:{command:(process.platform==='win32'?'npm.cmd':'npm')+' run test:serve',url:'http://127.0.0.1:4173',reuseExistingServer:true,timeout:120000},testDir:'./tests',testMatch:['journey.spec.js','three-world.spec.js','mobile-upgrade.spec.js','guide-npc.spec.js','controls-classroom.spec.js'],timeout:45000,workers:1,use:{baseURL:'http://127.0.0.1:4173',launchOptions:{executablePath:browser,args:['--headless','--use-angle=swiftshader','--enable-unsafe-swiftshader']}}});

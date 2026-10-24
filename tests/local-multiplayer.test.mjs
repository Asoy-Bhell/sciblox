import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const root=fileURLToPath(new URL('../',import.meta.url));
const externalPaths={
 react:pathToFileURL(require.resolve('react')).href,
 '@capacitor/core':pathToFileURL(require.resolve('@capacitor/core')).href,
 'react/jsx-runtime':pathToFileURL(require.resolve('react/jsx-runtime')).href,
};
const output=await build({root,configFile:false,logLevel:'silent',build:{write:false,minify:false,
 lib:{entry:fileURLToPath(new URL('../src/local-multiplayer.jsx',import.meta.url)),formats:['es'],fileName:'local-multiplayer'},
 rollupOptions:{external:Object.keys(externalPaths),output:{paths:externalPaths}}}});
const compiled=Array.isArray(output)?output[0]:output;
const code=compiled.output.find(item=>item.type==='chunk').code;
const {isCurrentSharedAction,cleanPlayerPosition}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));

const state={run:{id:'island-one',round:1,phase:'play',scene:2,activeActivity:'finale',chasing:false}};
const action=type=>({type,runId:'island-one',round:1,phase:'play',scene:2,activeActivity:'finale',actor:'friend-one'});

test('shared answer cannot affect a later expedition, round, phase or activity',()=>{
 assert.equal(isCurrentSharedAction(action('ROUND'),state),true);
 for(const change of [{runId:'old-island'},{round:0},{phase:'review'}]){
  assert.equal(isCurrentSharedAction({...action('ROUND'),...change},state),false);
 }
 assert.equal(isCurrentSharedAction({...action('WRONG'),activeActivity:'old-activity'},state),false);
 assert.equal(isCurrentSharedAction({type:'ROUND'},state),false);
});
test('only the explorer being chased can reach safety; another wrong answer cannot transfer chase',()=>{
 const chasing={run:{...state.run,chasing:true,chaseActor:'friend-one'}};
 assert.equal(isCurrentSharedAction(action('SAFE'),chasing),true);
 assert.equal(isCurrentSharedAction({...action('SAFE'),actor:'host'},chasing),false);
 assert.equal(isCurrentSharedAction({...action('WRONG'),actor:'friend-two'},chasing),false);
 assert.equal(isCurrentSharedAction(action('EGG'),chasing),false);
 assert.equal(isCurrentSharedAction(action('SELECT_ACTIVITY'),chasing),false);
});
test('late reviewer clicks cannot skip another review scene',()=>{
 const review={run:{...state.run,phase:'review',scene:1}};
 assert.equal(isCurrentSharedAction({...action('REVIEW_NEXT'),phase:'review',scene:1},review),true);
 assert.equal(isCurrentSharedAction({...action('REVIEW_NEXT'),phase:'review',scene:0},review),false);
 assert.equal(isCurrentSharedAction({...action('PLAY'),phase:'review',scene:0},review),false);
});
test('guest game controls exclude host-only settings and selecting new stations',()=>{
 assert.equal(isCurrentSharedAction(action('START'),state),false);
 assert.equal(isCurrentSharedAction(action('SETTING'),state),false);
 assert.equal(isCurrentSharedAction(action('MODE'),state),false);
 assert.equal(isCurrentSharedAction({...action('ACTIVITY_DONE'),activity:'finale'},state),true);
 assert.equal(isCurrentSharedAction({type:'HATCH',id:'team-egg'},{run:null}),true);
});
test('each remote explorer keeps independent position, walking state and facing',()=>{
 const first=cleanPlayerPosition({x:20,y:40,runId:'one',sequence:1},{x:12,y:40});
 const second=cleanPlayerPosition({x:12,y:82,runId:'one',sequence:2},{x:12,y:82,facing:'left'});
 assert.equal(first.walking,true);assert.equal(first.facing,'right');
 assert.equal(second.walking,false);assert.equal(second.facing,'left');
 assert.equal(first.x,20);assert.equal(second.x,12);
 assert.equal(cleanPlayerPosition({x:NaN,y:1}),null);
 assert.equal(cleanPlayerPosition({x:Infinity,y:1}),null);
 const bounded=cleanPlayerPosition({x:500,y:-20,walking:false,facing:'up',outfit:'Scarf',sequence:2,runId:'one'});
 assert.equal(bounded.x,96);assert.equal(bounded.y,6);assert.equal(bounded.walking,false);assert.equal(bounded.outfit,'Scarf');
});

test('lobby positions keep their own scope while older island packets remain compatible',()=>{
 const lobby=cleanPlayerPosition({x:40,y:70,walking:true,facing:'up',runId:'lobby',scope:'lobby',sequence:8});
 assert.equal(lobby.scope,'lobby');assert.equal(lobby.runId,'lobby');assert.equal(lobby.walking,true);
 const island=cleanPlayerPosition({x:72,y:22,runId:'island-one',sequence:9});
 assert.equal(island.scope,'station');assert.equal(island.runId,'island-one');
 assert.equal(cleanPlayerPosition({x:40,y:70,scope:'invalid'}).scope,'station');
});


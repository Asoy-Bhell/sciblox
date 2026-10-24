import station1 from './stations/station-1.json' with {type:'json'};
import station2 from './stations/station-2.json' with {type:'json'};
import station3 from './stations/station-3.json' with {type:'json'};
import station4 from './stations/station-4.json' with {type:'json'};
import station5 from './stations/station-5.json' with {type:'json'};
import station6 from './stations/station-6.json' with {type:'json'};
import station7 from './stations/station-7.json' with {type:'json'};
import station8 from './stations/station-8.json' with {type:'json'};

// Explicit local imports keep all dialogue in the offline application bundle.
export const stationDialogues=[station1,station2,station3,station4,station5,station6,station7,station8];
export const EXPRESSIONS=Object.freeze(Object.fromEntries(
  ['wave','explain','think','celebrate','encourage'].map(name=>[name,`/assets/bhell/${name}.png`])
));
export const GUIDE_IDLE_MS=20_000;
export const levelForXP=xp=>1+Math.floor(Math.max(0,Number(xp)||0)/100);
export function localizeGuide(value,language='en',variables={}){
  const text=typeof value==='string'?value:value?.[language]||value?.en||'';
  return text.replace(/\{(\w+)\}/g,(match,key)=>variables[key]===undefined?match:String(variables[key]));
}
export function getGuideScenes(station,trigger){
  return (stationDialogues[station]||stationDialogues[0]).scenes[trigger]||[];
}
// Observe accepted state transitions, not button clicks: rejected or repeated
// network actions must not earn duplicate celebrations or expose test answers.
export function guideProgress(state){
  const run=state.run;
  return {runId:run?.id,wrong:run?.wrong||0,completed:run?.completedActivities?.length||0,
    eggs:run?.collected?.length||0,round:run?.round||0,level:levelForXP(state.xp)};
}
export function progressTriggers(before,after){
  if(!before||before.runId!==after.runId)return [];
  const events=[];
  if(after.wrong>before.wrong)events.push('wrong');
  else if(after.completed>before.completed||after.eggs>before.eggs||after.round>before.round)events.push('correct');
  if(after.level>before.level)events.push('levelUp');
  return events;
}

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
export function getGuideScenes(station,trigger,context){
  const data=stationDialogues[station]||stationDialogues[0];
  if(!context)return data.scenes[trigger]||[];
  const activity=data.activities?.[context.activityId];
  const variants=data.variants?.[trigger],variant=variants?.[(context.variant||0)%variants.length];
  const scenes=variant?[variant]:(data.scenes[trigger]||[]);
  const hint=activity?.hint||data.scenes.wrong?.[0]?.hint;
  if(trigger==='talk'&&context.chasing)return [{id:'return-to-camp',expression:'encourage',text:{en:'Return to camp using the house control or your joystick. Your collected eggs stay safe. Then retry the unanswered egg.',tl:'Bumalik sa kampo gamit ang bahay o joystick. Ligtas ang mga nakuhang itlog. Pagkatapos, subukan muli ang hindi pa nasasagutang itlog.'}}];
  if(trigger==='talk'&&activity)return [{id:'help-'+context.activityId,expression:'explain',text:activity.instructions,hint}];
  return scenes.map((scene,index)=>({...scene,id:scene.id+'-'+(context.variant||0),
    ...(trigger==='intro'&&index===1&&activity?{text:activity.instructions}:{}),
    ...(['wrong','idle'].includes(trigger)?{hint:context.hint?{en:context.hint,tl:activity?.hints?.[context.hint]||hint?.tl}:hint}:{})}));
}
// Observe accepted state transitions, not button clicks: rejected or repeated
// network actions must not earn duplicate celebrations or expose test answers.
export function guideProgress(state){
  const run=state.run;
  return {runId:run?.id,wrong:run?.wrong||0,completed:run?.completedActivities?.length||0,
    eggs:run?.collected?.length||0,round:run?.round||0,activity:run?.activeActivity,level:levelForXP(state.xp)};
}
export function progressTriggers(before,after){
  if(!before||before.runId!==after.runId)return [];
  const events=[];
  if(after.wrong>before.wrong)events.push('wrong');
  else if(after.completed>before.completed||after.eggs>before.eggs||after.round>before.round)events.push('correct');
  if(after.level>before.level)events.push('levelUp');
  return events;
}

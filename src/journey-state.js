import {AVATAR_OPTIONS,avatarAppearance} from './avatar-options.js';
import {STATIONS,SPECIES,HATCH_SECONDS,cross} from './journey-data.js';
import {activityCatalog} from './station-activities-data.js';
import {assessmentQuestions,examScore} from './station-assessments.js';
import {reduceCoopAssessment} from './cooperative-assessments.js';
export const AVATARS=['Human'];
export const newTests=()=>({pre:{answers:[],score:null},post:{answers:[],score:null}});
export const preparationPlan=index=>(activityCatalog[index]||[]).map(a=>a.id);
export const preparationComplete=run=>!!run&&(!run.activityPlan||run.activityPlan.every(id=>run.completedActivities?.includes(id)));
export const EMPTY={schemaVersion:3,name:'Explorer',profileReady:false,profile:{avatar:'Human',gender:'unspecified',picture:'nova'},stationAssessments:{},points:0,xp:0,completed:[],stars:{},mistakes:{},run:null,eggs:[],pets:[],discovered:[],badges:[],assessment:{pre:null,post:null},intro:false,log:[],daily:{day:null,streak:0},settings:{language:'en',motion:true,sound:true,base:'Meadow',outfit:'Explorer'},purchases:[],mode:'solo',modeChosen:false,players:['Explorer','Partner'],turn:0};
export function normalize(raw={}){
 if(raw.schemaVersion===2||raw.schemaVersion===3){const savedRun=raw.run?.chasing?{...raw.run,chasing:false,chaseActor:null}:raw.run;let run=savedRun&&!savedRun.activityPlan?{...savedRun,activityPlan:preparationPlan(savedRun.index),completedActivities:[],activeActivity:preparationPlan(savedRun.index)[0]||'finale'}:savedRun;if(run&&!run.tests)run={...run,tests:newTests()};const profile={...EMPTY.profile,...raw.profile};if(!AVATARS.includes(profile.avatar))profile.avatar='Human';profile.gender=profile.gender==='girl'?'female':profile.gender==='boy'?'male':profile.gender;if(!['male','female','unspecified'].includes(profile.gender))profile.gender='unspecified';if(!AVATAR_OPTIONS.some(option=>option.id===profile.picture))profile.picture='nova';profile.picture=avatarAppearance(profile.picture,profile.gender).id;return {...EMPTY,...raw,schemaVersion:3,run,profile,stationAssessments:raw.stationAssessments||{},assessment:{...EMPTY.assessment,...raw.assessment},settings:{...EMPTY.settings,...raw.settings},daily:{...EMPTY.daily,...raw.daily}};}
 return {...EMPTY,name:raw.name||'Explorer',points:raw.points||0,xp:raw.xp||0,settings:{...EMPTY.settings,motion:raw.motion!==false},legacy:raw.completed?.length?raw:undefined};
}
export const canEnter=(s,index)=>index>=0&&index<8&&(index===0||s.completed.includes(index-1));
export function availablePairs(s){return s.pets.flatMap((p,i)=>s.pets.slice(i+1).filter(q=>p.species===q.species&&p.level===q.level).map(q=>[p,q]))}
function log(s,event,action){return [...s.log,{time:action.now||Date.now(),station:action.index??s.run?.index??null,event,...action.detail}].slice(-2000)}
function finish(s,a){
 const r=s.run;if(!r||r.phase!=='play')return s;
 if(!preparationComplete(r))return s;
 const index=r.index;if(index<4&&r.collected.length!==3)return s;
 if(index>=4&&index<7&&r.round<3)return s;
 if(index===7&&!a.fused)return s;
 return {...s,run:{...r,phase:'posttest',tests:r.tests||newTests(),stars:Math.max(1,3-r.wrong)},log:log(s,'station-activities-finished',a)};
}
function awardCompletion(s,a){
 const r=s.run,index=r.index;
 const stars=Math.max(1,3-r.wrong);
 const best=Math.max(s.stars[index]||0,stars);
 return {...s,points:s.points+(index<4?50:60),xp:s.xp+(index<4?20:80),completed:[...new Set([...s.completed,index])],stars:{...s.stars,[index]:best},badges:best===3?[...new Set([...s.badges,'Mastery: '+STATIONS[index].name])]:s.badges,run:{...r,phase:'complete',stars},log:log(s,'station-complete',{...a,detail:{stars,mistakes:r.wrong}}),turn:s.mode==='local'?(s.turn+1)%2:s.turn};
}
export function reducer(s,a){
 if(a.type.startsWith('COOP_'))return reduceCoopAssessment(s,a);
 if(a.runId&&a.runId!==s.run?.id)return s;
 if(a.round!==undefined&&a.round!==s.run?.round)return s;
 if(a.phase!==undefined&&a.phase!==s.run?.phase)return s;
 if(['REVIEW_NEXT','PLAY'].includes(a.type)&&a.scene!==undefined&&a.scene!==s.run?.scene)return s;
 if(['ACTIVITY_DONE','SELECT_ACTIVITY','WRONG'].includes(a.type)&&a.activeActivity!==undefined&&a.activeActivity!==s.run?.activeActivity)return s;
 switch(a.type){
  case 'INTRO':return {...s,intro:true};
  case 'FAMILY_BUILT':return s.run?.phase==='play'&&s.run.index===3&&!s.run.familyBuilt?{...s,run:{...s.run,familyBuilt:true,attempts:s.run.attempts+1},log:log(s,'family-tree-built',a)}:s;
  case 'DAILY_MISTAKE':return {...s,mistakes:{...s.mistakes,[a.index]:(s.mistakes[a.index]||0)+1},log:log(s,'daily-mistake',a)};
  case 'PROFILE':{const profile={...s.profile,...a.profile};if(!AVATARS.includes(profile.avatar)||!['male','female','unspecified'].includes(profile.gender))return s;if(!AVATAR_OPTIONS.some(option=>option.id===profile.picture))profile.picture='nova';profile.picture=avatarAppearance(profile.picture,profile.gender).id;const name=(a.name??s.name).trim().slice(0,24);if(!name)return s;return {...s,name,profile,profileReady:a.confirm?true:s.profileReady};}
  case 'MODE':return {...s,mode:a.mode,modeChosen:true,players:a.players||s.players,turn:0};
  case 'SETTING':if(a.key==='language'&&!['en','tl'].includes(a.value))return s;return {...s,settings:{...s.settings,[a.key]:a.value}};
  case 'ASSESS':if(a.kind==='post'&&!s.completed.includes(7))return s;return {...s,assessment:{...s.assessment,[a.kind]:a.score},log:log(s,a.kind+'-test',{...a,detail:{score:a.score}})};
  case 'START':if(!canEnter(s,a.index))return s;return {...s,run:{id:a.id,index:a.index,phase:'pretest',tests:newTests(),scene:0,reviewUses:0,activityPlan:preparationPlan(a.index),completedActivities:[],activeActivity:preparationPlan(a.index)[0]||'finale',collected:[],wrong:0,attempts:0,hints:0,round:0,chasing:false,pendingEgg:null,eliminated:{},startedAt:a.now},log:log(s,'station-start',a)};
  case 'STATION_ANSWER':{const r=s.run,kind=r?.phase==='pretest'?'pre':r?.phase==='posttest'?'post':null;if(!kind||a.kind!==kind)return s;const exam=r.tests[kind],questions=assessmentQuestions(r.index,kind);if(a.question!==exam.answers.length||exam.answers.length>=questions.length||!Number.isInteger(a.answer)||a.answer<0||a.answer>3)return s;return {...s,run:{...r,tests:{...r.tests,[kind]:{...exam,answers:[...exam.answers,a.answer]}}}};}
  case 'STATION_ASSESS':{const r=s.run,kind=r?.phase==='pretest'?'pre':r?.phase==='posttest'?'post':null;if(!kind||a.kind!==kind||r.tests[kind].answers.length!==assessmentQuestions(r.index,kind).length)return s;const score=examScore(r.index,kind,r.tests[kind].answers),tests={...r.tests,[kind]:{...r.tests[kind],score}},record={...(s.stationAssessments[r.index]||{}),[kind]:score,total:10,updatedAt:a.now||Date.now()};let result={...s,stationAssessments:{...s.stationAssessments,[r.index]:record},run:{...r,tests,phase:kind==='pre'?'review':'posttest'},log:log(s,'station-'+kind+'-test',{...a,detail:{score,total:10}})};return kind==='post'?awardCompletion(result,a):result;}
  case 'SELECT_ACTIVITY':{const r=s.run;if(!r||r.phase!=='play'||r.chasing)return s;const plan=r.activityPlan||[],done=r.completedActivities||[],next=plan.find(id=>!done.includes(id));if(a.activity==='finale'?!preparationComplete(r):!plan.includes(a.activity)||(!done.includes(a.activity)&&a.activity!==next))return s;return {...s,run:{...r,activeActivity:a.activity}};}
  case 'ACTIVITY_DONE':{const r=s.run;if(!r||r.phase!=='play'||!r.activityPlan?.includes(a.activity)||r.activeActivity!==a.activity||r.completedActivities?.includes(a.activity))return s;const done=[...(r.completedActivities||[]),a.activity];return {...s,points:s.points+10,xp:s.xp+10,run:{...r,completedActivities:done,activeActivity:r.activityPlan.find(id=>!done.includes(id))||'finale',attempts:r.attempts+1},log:log(s,'activity-complete',{...a,detail:{activity:a.activity}})};}
  case 'REVIEW_NEXT':return s.run?.phase!=='review'?s:{...s,run:{...s.run,scene:Math.min(2,s.run.scene+1)}};
  case 'PLAY':return s.run?.phase==='review'&&s.run.scene===2?{...s,run:{...s.run,phase:'play'}}:s;
  case 'REVIEW_ACCESS':return s.run?.phase==='play'&&s.run.reviewUses<3?{...s,run:{...s.run,reviewUses:s.run.reviewUses+1},log:log(s,'review-access',a)}:s;
  case 'HINT':{const price=40+(s.run?.index||0)*10;if(!s.run||s.run.phase!=='play'||s.points<price)return s;return {...s,points:s.points-price,run:{...s.run,hints:s.run.hints+1},log:log(s,'hint',{...a,detail:{cost:price}})}}
  case 'WRONG':if(!s.run||s.run.phase!=='play'||s.run.chasing)return s;return {...s,mistakes:{...s.mistakes,[s.run.index]:(s.mistakes[s.run.index]||0)+1},run:{...s.run,wrong:s.run.wrong+1,attempts:s.run.attempts+1,chasing:s.run.index<4&&a.egg!==undefined,chaseActor:a.actor||'solo',pendingEgg:a.egg??s.run.pendingEgg,eliminated:a.egg===undefined?s.run.eliminated:{...s.run.eliminated,[a.egg]:[...new Set([...(s.run.eliminated[a.egg]||[]),a.option])]}},log:log(s,'wrong-answer',a)};
  case 'SAFE':return !s.run||(s.run.chasing&&(s.run.chaseActor||'solo')!==(a.actor||'solo'))?s:{...s,run:{...s.run,chasing:false},log:log(s,a.caught?'guardian-catch':'safe-spot',a)};
  case 'EGG':{const r=s.run;if(!r||r.phase!=='play'||!preparationComplete(r)||r.activeActivity&&r.activeActivity!=='finale'||r.index>=4||r.chasing||r.collected.includes(a.egg)||!Number.isInteger(a.egg)||a.egg<0||a.egg>2||!SPECIES[a.egg].includes(a.species)||!['BB','Bb','bb'].includes(a.genotype))return s;const result={...s,points:s.points+10,xp:s.xp+10,eggs:[...s.eggs,{id:a.id,rarity:a.egg,readyAt:a.now+HATCH_SECONDS[a.egg]*1000,station:r.index,species:a.species,genotype:a.genotype}],run:{...r,collected:[...r.collected,a.egg],pendingEgg:null,attempts:r.attempts+1},log:log(s,'egg-collected',{...a,detail:{rarity:a.egg}})};return result.run.collected.length===3?finish(result,a):result}
  case 'ROUND':{if(!s.run||s.run.phase!=='play'||!preparationComplete(s.run)||s.run.activeActivity&&s.run.activeActivity!=='finale'||s.run.index<4||s.run.index>6)return s;const result={...s,run:{...s.run,round:s.run.round+1,attempts:s.run.attempts+1},log:log(s,'lab-round',a)};return result.run.round===3?finish(result,a):result}
  case 'HATCH':{const egg=s.eggs.find(e=>e.id===a.id);if(!egg||egg.readyAt>a.now)return s;return {...s,eggs:s.eggs.filter(e=>e.id!==a.id),pets:[...s.pets,{id:egg.id,species:egg.species,genotype:egg.genotype,rarity:egg.rarity,level:1}],discovered:[...new Set([...s.discovered,egg.species])],log:log(s,'pet-hatched',{...a,detail:{species:egg.species}})}}
  case 'BUY':{const prices={Sunset:120,Night:200,Shades:60,Scarf:70,'Top hat':80,Crown:150};const price=prices[a.item];if(!price||s.points<price||s.purchases.includes(a.item))return s;return {...s,points:s.points-price,purchases:[...s.purchases,a.item],settings:{...s.settings,[['Sunset','Night'].includes(a.item)?'base':'outfit']:a.item},log:log(s,'shop-purchase',{...a,detail:{item:a.item,cost:price}})}}
  case 'UPGRADE':{const pet=s.pets.find(p=>p.id===a.id);if(!pet||pet.level>=5||s.points<60*pet.level)return s;return {...s,points:s.points-60*pet.level,pets:s.pets.map(p=>p.id===pet.id?{...p,level:p.level+1}:p),log:log(s,'pet-level',{...a,detail:{id:pet.id,level:pet.level+1}})}}
  case 'FUSE':{const r=s.run;if(!r||r.index!==7||r.phase!=='play'||!preparationComplete(r)||r.activeActivity&&r.activeActivity!=='finale'||!Array.isArray(a.parents)||a.parents.length!==2)return s;const p=s.pets.find(x=>x.id===a.parents[0]),q=s.pets.find(x=>x.id===a.parents[1]);if(!p||!q||p.id===q.id||p.species!==q.species||p.level!==q.level)return s;const tier=Math.max(0,Math.min(4,Math.max(p.rarity,q.rarity)+(r.wrong===0?1:r.wrong===1?0:r.wrong===2?-1:-2)));if(!SPECIES[tier].includes(a.species)||!cross(p.genotype,q.genotype).boxes.includes(a.genotype))return s;const result={...s,pets:[...s.pets.filter(x=>!a.parents.includes(x.id)),{id:a.id,species:a.species,rarity:tier,level:Math.min(5,p.level+1),genotype:a.genotype}],discovered:[...new Set([...s.discovered,a.species])],badges:tier>=3?[...new Set([...s.badges,'Genetics Master'])]:s.badges,log:log(s,'pet-fusion',{...a,detail:{parents:a.parents,rarity:tier,species:a.species}})};return finish(result,{...a,fused:true})}
  case 'DAILY':if(s.daily.day===a.day)return s;return {...s,points:s.points+30,xp:s.xp+15,daily:{day:a.day,streak:s.daily.day===a.yesterday?s.daily.streak+1:1},log:log(s,'daily-quest',{...a,detail:{score:a.score}})};
  default:return s;
 }
}

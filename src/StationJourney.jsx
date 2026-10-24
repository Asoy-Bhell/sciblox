// localized-ui
import {t} from './i18n';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {X,ArrowRight,Lock,Play,ListChecks} from 'lucide-react';
import {activityCatalog,PreparationActivity} from './station-activities';
import {EggHunt,Lab} from './journey-components';
import GuideNPC from './GuideNPC';
import useGuideSystem from './guide/useGuideSystem';
import JourneyMap3D from './JourneyMap3D';
import {preparationComplete} from './journey-state';

export default function StationJourney({state,send,sound,network,paused=false}){
 const run=state.run,activities=activityCatalog[run.index]||[],completed=run.completedActivities||[],active=run.activeActivity||activities[0]?.id||'finale';
 const firstIncomplete=activities.find(a=>!completed.includes(a.id))?.id||'finale';
 const finaleTitle=run.index<4?'Three Hidden Eggs':run.index===7?'Pet Fusion Challenge':'Three-round Lab Challenge';
 const [opened,setOpened]=useState(null),[reward,setReward]=useState('');
 const npc=useGuideSystem({state,paused}),guide=npc.open;
 const setGuide=value=>value?npc.notify('talk'):npc.close();
 const dialog=useRef(null),previous=useRef(active);
 const entries=[...activities,{id:'finale',title:finaleTitle}];
 const selected=activities.find(a=>a.id===active),inHunt=active==='finale'&&run.index<4;
 const own=network.ownProfile||state.profile,actor=network.actor||network.connection?.id||'solo';
 useLayoutEffect(()=>{if(previous.current!==active){previous.current=active;setOpened(completed.includes(active)?active:null)}},[active]);
 useEffect(()=>{if(!reward)return;const timer=setTimeout(()=>setReward(''),3000);return()=>clearTimeout(timer)},[reward]);
 useEffect(()=>{if(!opened||paused)return;const before=document.activeElement;dialog.current?.querySelector('button:not(:disabled)')?.focus();const key=e=>{if(e.key==='Escape'){setOpened(null);setGuide(false)}if(e.key==='Tab'){const controls=[...dialog.current?.querySelectorAll('button:not(:disabled),input,select,textarea')||[],...document.querySelectorAll('.guide-npc button:not(:disabled)')];if(!controls.length)return;if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0].focus()}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);before?.focus()}},[opened,paused]);
 const enter=index=>{const item=entries[index];if(!item)return;if(item.id==='finale'?!preparationComplete(run):!completed.includes(item.id)&&item.id!==firstIncomplete)return;if(item.id!==active)send({type:'SELECT_ACTIVITY',activity:item.id});setGuide(false);setOpened(item.id)};
 const done=()=>{setReward(selected?.title||'Activity complete');sound();setOpened(null);send({type:'ACTIVITY_DONE',activity:active})};
 return <section className={'station-journey-world '+(opened?'activity-is-open':'')} aria-label={t("Station adventure world")}>
 {t(inHunt?<EggHunt key={run.id} run={run} send={send} sound={sound} remotePlayers={network.players||[]} onPosition={network.position} outfit={state.settings.outfit} actor={actor} animated={state.settings.motion} avatar="Human" gender={own.gender} picture={own.picture} playerName={network.ownName||state.name} onTalk={()=>setGuide(true)}/>:<JourneyMap3D stations={entries.map((a,i)=>({name:'Activity '+(i+1)+': '+a.title}))} completed={activities.flatMap((a,i)=>completed.includes(a.id)?[i]:[])} onSelect={enter} motion={state.settings.motion} outfit={state.settings.outfit} gender={own.gender} picture={own.picture} playerName={network.ownName||state.name} onTalk={()=>setGuide(true)} onPosition={network.position} remotePlayers={network.players||[]} activityWorld runId={run.id} worldTitle={'STATION '+(run.index+1)}/>)}
 {t(!inHunt&&<div className="world-mission mission-compact"><span>{t("YOUR NEXT DISCOVERY")}</span><b className="mission-caption">{t(selected?.title||finaleTitle)}</b><button className="icon-control" aria-label={t("Enter activity")} title={t("Enter activity")} onClick={()=>enter(entries.findIndex(a=>a.id===active))}><Play size={21}/></button></div>)}
 <details className="world-activity-tracker"><summary aria-label={t("Activities in this station")}><ListChecks size={17}/>{completed.length}/{activities.length}</summary><nav aria-label={t("Activities in this station")}>{t(entries.map((a,i)=><button key={a.id} disabled={a.id==='finale'?!preparationComplete(run):!completed.includes(a.id)&&a.id!==firstIncomplete} onClick={()=>enter(i)}>{t(completed.includes(a.id)?'✓ ':'')}{t(i+1)}{t(". ")}{t(a.title)}{t(a.id!==firstIncomplete&&!completed.includes(a.id)&&a.id!=='finale'&&<Lock size={12}/>)}</button>))}</nav></details>
 {t(reward&&<div className="world-reward" role="status">{t("✓ ")}{t(reward)}{t(" · +10 coins · +10 XP")}</div>)}
 {guide&&!paused&&<div className="world-dialog-shade guide-shade"><GuideNPC key={run.id+'-'+npc.current.id} scenes={npc.scenes} trigger={npc.current.trigger} language={state.settings.language} motion={state.settings.motion} sound={state.settings.sound} variables={npc.variables} onClose={npc.close} onSoundChange={value=>send({type:'SETTING',key:'sound',value})}/></div>}
 {opened&&!guide&&<aside className="world-bhell-hint"><img src="/assets/bhell/encourage.png" alt="Bhell"/><div><b>Bhell</b><p>{t('Take your time!')}</p><button onClick={()=>{npc.notify('talk')}}>{t('Ask Bhell for guidance')}</button></div></aside>}
 {t(opened&&!(opened==='finale'&&run.index<4)&&<div className="world-dialog-shade"><section ref={dialog} className="world-activity-overlay" role="dialog" aria-modal="true" aria-label={t('In-world activity: '+(selected?.title||finaleTitle))}><button className="close" aria-label={t("Return to world")} onClick={()=>setOpened(null)}><X/></button><div className="eyebrow">{t("STATION ")}{t(run.index+1)}{t(" · ACTIVITY ")}{t(entries.findIndex(a=>a.id===active)+1)}</div>{t(active==='finale'?<Lab key={run.id} run={run} send={send} sound={sound} pets={state.pets} onGuideCorrect={()=>npc.notify('correct')}/>:completed.includes(active)?<div className="activity-saved"><h2>{t(selected?.title)}</h2><p>{t("Complete and saved. Your next discovery is waiting.")}</p><button className="primary" onClick={()=>{setOpened(null);send({type:'SELECT_ACTIVITY',activity:firstIncomplete})}}>{t("Continue station")}</button></div>:<PreparationActivity key={run.id+'-'+active} station={run.index} activity={active} onComplete={done} onWrong={()=>{sound(false);send({type:'WRONG'})}} onCorrect={()=>npc.notify('correct')}/>)}</section></div>)}
 </section>;
}

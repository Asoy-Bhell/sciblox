import {useCallback,useEffect,useRef,useState} from 'react';
import {EXPRESSIONS,GUIDE_IDLE_MS,getGuideScenes,guideProgress,progressTriggers,levelForXP} from './dialogue';

export default function useGuideSystem({state,paused=false}){
  const run=state.run,serial=useRef(0),previous=useRef(guideProgress(state));
  const latest=useRef(state),hintRef=useRef(''),counts=useRef({});latest.current=state;
  const make=useCallback((trigger,extra={})=>{const run=latest.current.run,key=run.id+'-'+trigger,variant=counts.current[key]||0;counts.current[key]=variant+1;const message={trigger,id:++serial.current,context:{activityId:run.activeActivity,variant,chasing:run.chasing,hint:trigger==='wrong'?hintRef.current:'',...extra}};if(trigger==='wrong')hintRef.current='';return message},[]);
  const [messages,setMessages]=useState(()=>state.settings.guideSeenRuns?.includes(run.id)?[]:[make('intro')]);
  const queue=useRef(messages);queue.current=messages;
  const idleAt=useRef(Date.now()),nudged=useRef(false),heldKeys=useRef(new Set());
  const notify=useCallback((trigger,context)=>{
    const message=make(trigger,context);
    setMessages(current=>trigger==='wrong'||trigger==='talk'?[message]:[...current.filter(item=>item.trigger!=='idle'),message].slice(-4));
  },[make]);
  const close=useCallback(()=>{setMessages(current=>current.slice(1));idleAt.current=Date.now();nudged.current=false},[]);
  useEffect(()=>{for(const path of Object.values(EXPRESSIONS)){const image=new Image();image.src=path}},[]);
  useEffect(()=>{
    const now=guideProgress(state);
    if(previous.current.runId!==now.runId){setMessages([make('intro')]);idleAt.current=Date.now();nudged.current=false}
    else for(const trigger of progressTriggers(previous.current,now))notify(trigger,{activityId:trigger==='correct'?previous.current.activity:run.activeActivity});
    previous.current=now;
  },[run?.id,run?.wrong,run?.completedActivities?.length,run?.collected?.length,run?.round,state.xp,make,notify]);
  useEffect(()=>{
    const activity=()=>{idleAt.current=Date.now();nudged.current=false};
    const keyDown=e=>{heldKeys.current.add(e.code);activity()},keyUp=e=>{heldKeys.current.delete(e.code);activity()};
    const pointers=new Set();
    const down=e=>{pointers.add(e.pointerId);activity()},up=e=>{pointers.delete(e.pointerId);activity()};
    const blur=()=>{heldKeys.current.clear();pointers.clear();activity()};
    const events=[['pointerdown',down],['pointerup',up],['pointercancel',up],['pointermove',activity],['keydown',keyDown],['keyup',keyUp],['input',activity],['blur',blur]];
    for(const [name,handler]of events)window.addEventListener(name,handler,{passive:true});
    document.addEventListener('visibilitychange',blur);
    const timer=setInterval(()=>{
      if(paused||document.hidden||document.documentElement.dataset.scibloxPaused==='true'||queue.current.length||heldKeys.current.size||pointers.size){idleAt.current=Date.now();return}
      if(!nudged.current&&Date.now()-idleAt.current>=GUIDE_IDLE_MS){nudged.current=true;notify('idle')}
    },250);
    return()=>{clearInterval(timer);for(const [name,handler]of events)window.removeEventListener(name,handler);document.removeEventListener('visibilitychange',blur)};
  },[paused,notify,run?.id]);
  const current=messages[0];
  return {current,open:!!current,close,notify,setHint:value=>{hintRef.current=value||''},scenes:current?getGuideScenes(run.index,current.trigger,current.context):[],variables:{level:levelForXP(state.xp)}};
}

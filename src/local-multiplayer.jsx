// localized-ui
import {t} from './i18n';
﻿import React,{useEffect,useState,useRef} from 'react';
import {registerPlugin} from '@capacitor/core';
import {nativeMobile} from './mobile';
import {publicCoopSnapshot,personalCoopState} from './cooperative-assessments';
const LocalMultiplayer=registerPlugin('LocalMultiplayer');
const REMOTE_ACTIONS=new Set(['REVIEW_NEXT','PLAY','REVIEW_ACCESS','HINT','WRONG','SAFE','EGG','ROUND','HATCH','FUSE','FAMILY_BUILT','ACTIVITY_DONE','SELECT_ACTIVITY']);
const SHARED_PAGES=new Set(['map','station','pets','profile','shop','daily','settings']);

// Delayed answers belong to the challenge visible on the sender's phone.
export function isCurrentSharedAction(action,state){
 if(!action||!REMOTE_ACTIONS.has(action.type))return false;
 if(action.type==='STATION_ANSWER'&&(action.question!==state.run?.tests?.[action.kind]?.answers?.length))return false;
 if(action.type==='HATCH')return typeof action.id==='string';
 const run=state.run;
 if(!run||action.runId!==run.id||action.round!==run.round||action.phase!==run.phase)return false;
 if(['REVIEW_NEXT','PLAY'].includes(action.type)&&action.scene!==run.scene)return false;
 if(['ACTIVITY_DONE','SELECT_ACTIVITY','WRONG'].includes(action.type)&&action.activeActivity!==run.activeActivity)return false;
 if(action.type==='SAFE')return run.chasing&&(run.chaseActor||'solo')===action.actor;
 if(run.chasing&&['WRONG','EGG','ROUND','FAMILY_BUILT','FUSE','SELECT_ACTIVITY'].includes(action.type))return false;
 return true;
}
export function cleanPlayerPosition(position,previous={}){
 if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.y))return null;
 const dx=position.x-(previous.x??position.x),dy=position.y-(previous.y??position.y);
 const facing=['left','right','up','down'].includes(position.facing)?position.facing:
  Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy?dy<0?'up':'down':previous.facing||'right';
 return {x:Math.max(4,Math.min(96,position.x)),y:Math.max(6,Math.min(94,position.y)),
  walking:typeof position.walking==='boolean'?position.walking:Math.hypot(dx,dy)>.08,
  facing,outfit:typeof position.outfit==='string'?position.outfit.slice(0,24):previous.outfit||'Explorer',
  avatar:'Human',picture:typeof position.picture==='string'?position.picture.slice(0,24):previous.picture||'nova',gender:position.gender==='boy'?'male':position.gender==='girl'?'female':['male','female','unspecified'].includes(position.gender)?position.gender:previous.gender||'unspecified',
  runId:typeof position.runId==='string'?position.runId:null,scope:position.scope==='lobby'?'lobby':'station',sequence:Number(position.sequence)||0};
}
export function useLocalMultiplayer(localState,dispatch){
 const [connection,setConnection]=useState(null),[snapshot,setSnapshot]=useState(null),[players,setPlayers]=useState([]),[error,setError]=useState('');
 const [rooms,setRooms]=useState([]),[scanning,setScanning]=useState(false),[remoteView,setRemoteView]=useState(null);
 const ref=useRef({connection,localState,dispatch,snapshot});ref.current={connection,localState,dispatch,snapshot};
 const pending=useRef(null),hostView=useRef('map'),lastPosition=useRef(0),lastOwnPosition=useRef({});
 const sequence=useRef(0),actionSequence=useRef(0),positionSequence=useRef(0),received=useRef(-1),seenActions=useRef(new Set());
 const publishSnapshot=()=>{
  if(!ref.current.connection?.host)return;
  LocalMultiplayer.send({payload:{kind:'snapshot',sequence:++sequence.current,state:publicCoopSnapshot(ref.current.localState),view:hostView.current}}).catch(e=>setError(e.message||'Could not update the nearby expedition.'));
 };
 const reset=()=>{
  const current=ref.current,run=current.localState.run;
  if(current.connection?.host&&run?.chasing)current.dispatch({type:'SAFE',actor:run.chaseActor||'solo',caught:true,runId:run.id});
  ref.current.connection=null;ref.current.snapshot=null;pending.current=null;
  setConnection(null);setSnapshot(null);setPlayers([]);setRemoteView(null);
  seenActions.current.clear();lastOwnPosition.current={};lastPosition.current=0;
 };
 useEffect(()=>{
  if(!nativeMobile)return;
  let active=true;
  const listener=LocalMultiplayer.addListener('event',event=>{
   if(!active)return;
   const current=ref.current;
   if(!current.connection&&!pending.current)return;
   if(current.connection?.roomId&&event.roomId!==current.connection.roomId)return;
   if(event.type==='disconnected'){setError(event.message||'Local session disconnected. Your solo progress is unchanged.');reset();return}
   if(event.type==='roster'){
    const roster=Array.isArray(event.players)?event.players.filter(p=>typeof p.id==='string'):[];
    setPlayers(previous=>roster.map(player=>{
     const old=previous.find(p=>p.id===player.id)||{},position=cleanPlayerPosition(player,old);
     return {...old,...player,...(position||{})};
    }));
    if(current.connection?.host){
     const run=current.localState.run;
     if(run?.chasing&&!roster.some(p=>p.id===run.chaseActor))current.dispatch({type:'SAFE',actor:run.chaseActor,caught:true,runId:run.id});
     publishSnapshot();
    }
    return;
   }
   if(event.type!=='message'||!event.payload)return;
   const payload=event.payload;
   if(payload.kind==='sync-request'&&current.connection?.host){publishSnapshot();return}
   if(payload.kind==='snapshot'&&event.sender==='host'&&(current.connection?.host===false||pending.current==='join')){
    if(!Number.isFinite(payload.sequence)||payload.sequence<=received.current||!payload.state?.settings)return;
    received.current=payload.sequence;ref.current.snapshot=payload.state;setSnapshot(payload.state);
    if(SHARED_PAGES.has(payload.view))setRemoteView(payload.view);
   }else if(payload.kind==='action'&&current.connection?.host){
    const action={...payload.action,actor:event.sender};
    if(!isCurrentSharedAction(action,current.localState))return;
    const actionId=typeof payload.actionId==='string'?event.sender+':'+payload.actionId:null;
    if(!actionId||seenActions.current.has(actionId))return;
    seenActions.current.add(actionId);
    if(seenActions.current.size>512)seenActions.current.delete(seenActions.current.values().next().value);
    current.dispatch(action);
   }else if(payload.kind==='position'){
    setPlayers(previous=>previous.map(player=>{
     if(player.id!==event.sender)return player;
     const pos=cleanPlayerPosition(payload.position,player);
     if(!pos||pos.scope!=='lobby'&&pos.runId!==(current.snapshot||current.localState).run?.id)return player;
     if(player.runId===pos.runId&&player.scope===pos.scope&&pos.sequence<=(player.sequence||0))return player;
     return {...player,...pos};
    }));
   }
  });
  return()=>{active=false;listener.then(l=>l.remove()).catch(()=>{})};
 },[]);
 useEffect(()=>{if(connection?.host)publishSnapshot()},[localState,connection]);
 const host=async name=>{
  setError('');reset();pending.current='host';sequence.current=0;
  try{
   const result=await LocalMultiplayer.host({name});
   const connected={...result,host:true,id:'host',name};ref.current.connection=connected;pending.current=null;
   setConnection(connected);return result;
  }catch(e){reset();setError(e.message||'Could not host an expedition.');return null}
 };
 const join=async(address,code,name)=>{
  setError('');reset();pending.current='join';received.current=-1;
  try{
   const result=await LocalMultiplayer.join({address:address.trim(),code,name});
   const connected={...result,host:false,name,address:address.trim()};ref.current.connection=connected;pending.current=null;
   setConnection(connected);
   LocalMultiplayer.send({payload:{kind:'sync-request'}}).catch(()=>{});
   return result;
  }catch(e){reset();setError(e.message||'Could not join this expedition.');return null}
 };
 const scan=async()=>{
  if(!nativeMobile||scanning)return;
  setError('');setScanning(true);setRooms([]);
  try{const result=await LocalMultiplayer.discover();setRooms(result.rooms||[])}
  catch(e){setError(e.message||'Could not scan this local network. Enter the host address instead.')}
  finally{setScanning(false)}
 };
 const disconnect=async()=>{reset();try{await LocalMultiplayer.disconnect()}catch{}};
 useEffect(()=>{if(connection?.host===false&&snapshot?.run&&localState.coopRun?.id!==snapshot.run.id)dispatch({type:'COOP_START',id:snapshot.run.id,index:snapshot.run.index})},[connection?.host,snapshot?.run?.id,localState.coopRun?.id]);
 const send=action=>{
  const current=ref.current,shared=current.snapshot||current.localState,actor=current.connection?.id||'solo';
  if(current.connection?.host===false){
   if(action.type==='SETTING'||action.type==='PROFILE'){dispatch(action);return}
   const personal={STATION_ANSWER:'COOP_ANSWER',STATION_ASSESS:'COOP_ASSESS',REVIEW_NEXT:'COOP_REVIEW_NEXT',PLAY:'COOP_PLAY'}[action.type];
   if(personal){dispatch({...action,type:personal,id:shared.run?.id,teamFinished:['posttest','complete'].includes(shared.run?.phase)});return}
  }
  if(REMOTE_ACTIONS.has(action.type))action={...action,runId:action.runId??shared.run?.id,round:action.round??shared.run?.round,phase:action.phase??shared.run?.phase,scene:action.scene??shared.run?.scene,activeActivity:action.activeActivity??shared.run?.activeActivity,actor};
  if(current.connection&&!current.connection.host){
   if(!REMOTE_ACTIONS.has(action.type)){setError('The host manages the shared expedition and its settings.');return}
   if(!current.snapshot){setError('Waiting for the host’s expedition to load.');return}
   LocalMultiplayer.send({payload:{kind:'action',actionId:++actionSequence.current+'',action}}).catch(e=>setError(e.message));
  }else{
   if(current.connection?.host&&REMOTE_ACTIONS.has(action.type)&&!isCurrentSharedAction(action,current.localState))return;
   dispatch(action);
  }
 };
 const position=position=>{
  const current=ref.current,run=(current.snapshot||current.localState).run;
  if(!current.connection||!run&&position.scope!=='lobby'||Date.now()-lastPosition.current<110)return;
  const pos=cleanPlayerPosition({...position,...current.localState.profile,runId:position.scope==='lobby'?'lobby':run.id,sequence:++positionSequence.current,outfit:position.outfit||current.localState.settings.outfit},lastOwnPosition.current);
  if(!pos)return;lastPosition.current=Date.now();lastOwnPosition.current=pos;
  LocalMultiplayer.send({payload:{kind:'position',position:pos}}).catch(()=>{});
 };
 const publishView=page=>{
  if(!SHARED_PAGES.has(page)||ref.current.connection?.host===false)return;
  hostView.current=page;publishSnapshot();
 };
 const state=snapshot&&connection?.host===false?personalCoopState(localState,snapshot):localState;
 const peers=players.filter(p=>p.id!==connection?.id);
 const remotePlayers=peers.map(player=>player.runId===state.run?.id&&player.scope!=='lobby'?player:{...player,x:12,y:82,walking:false});
 const lobbyPlayers=peers.filter(player=>player.scope==='lobby');
 return {state,send,host,join,scan,rooms,scanning,disconnect,players:remotePlayers,lobbyPlayers,roster:players,error,clearError:()=>setError(''),position,
  connected:!!connection,ready:!!connection&&(connection.host||!!snapshot),guest:!!connection&&!connection.host,
  ownProfile:localState.profile,ownName:localState.name,actor:connection?.id||'solo',connection,supported:nativeMobile,remoteView:connection?.host===false&&state.run&&['pretest','review','posttest','waiting'].includes(state.run.phase)?'station':remoteView,publishView};
}
export function MultiplayerPanel({network,name}){
 const [address,setAddress]=useState(''),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[searched,setSearched]=useState(false);
 const task=async fn=>{setBusy(true);try{await fn()}finally{setBusy(false)}};
 return <><div className="eyebrow">{t("NEARBY FRIENDS · PLAY OFFLINE TOGETHER")}</div><h1>{t("One island. Your own explorer.")}</h1>
  <p className="intro">{t("Play solo anytime, or join the same world on up to four phones. Each player moves their own character while the team solves the expedition together. Each learner completes their own pre-test and post-test.")}</p>
  <section className="settings-panel"><h2>{t("Connect through a hotspot")}</h2>
   <ol className="connection-steps"><li>{t("Connect all phones to the same Wi-Fi or one phone’s hotspot. Internet and mobile data are unnecessary.")}</li><li>{t("On the hotspot phone, tap Host expedition. Leave SciBlox open.")}</li><li>{t("On each friend’s phone, tap Find nearby expeditions, choose the host, and enter its six-digit room code.")}</li></ol>
   <div className="info">{t("The host chooses the station and saves the shared journey. Your own character can explore, collect eggs, and answer challenges with friends. Guest solo progress stays on each guest’s phone.")}</div>
   {t(!network.supported?<div className="info"><b>{t("Install the mobile app to connect.")}</b><p>{t("The browser previews solo gameplay. Hotspot play connects directly between phones, without an internet server.")}</p></div>:
    network.connected?<><h3>{t(network.connection.host?'Your expedition is open':'You joined the expedition')}</h3>
     {t(network.connection.host&&<><p>{t("Room code: ")}<strong className="room-code">{t(network.connection.code)}</strong></p><p style={{overflowWrap:'anywhere'}}>{t("Local address: ")}{t(network.connection.addresses?.join(' or ')||'Check hotspot settings for the host address')}</p><p>{t("Ask your friends to scan for ")}<b>{t(network.connection.name||name)}{t("’s expedition")}</b>{t(".")}</p></>)}
     {t(!network.ready&&<p role="status">{t("Loading the host’s world…")}</p>)}
     <h3>{t(network.players.length+1)}{t("/4 explorers")}</h3><ul aria-label={t("Expedition players")}>
      <li><b>{t(network.connection.name||name)}</b>{t(" · You")}{t(network.connection.host?' · Host':'')}</li>
      {t(network.players.map(p=><li key={p.id}>{t(p.name)}{t(p.id==='host'?' · Host':'')}{t(" · Connected")}</li>))}</ul>
     <button className="secondary" onClick={network.disconnect}>{t("Leave session & return to solo")}</button></>:
    <><button className="primary" disabled={busy||network.scanning} onClick={()=>task(()=>network.host(name))}>{t("Host expedition")}</button>
     <button className="secondary" disabled={busy||network.scanning} onClick={()=>{setSearched(true);network.scan()}}>{t(network.scanning?'Searching your hotspot…':'Find nearby expeditions')}</button>
     <div role="status" aria-live="polite">{t(network.scanning?'Keep the host’s game open while we look for nearby rooms.':searched?network.rooms.length?network.rooms.length+' nearby expedition'+(network.rooms.length===1?'':'s')+' found.':'No rooms found. Check that the host is open on the same hotspot, then try its local address.':'')}</div>
     {t(network.rooms.map(room=><button key={room.address} className="secondary" disabled={busy||room.players>=room.capacity} onClick={()=>setAddress(room.address)} style={{display:'block',width:'100%',marginBlock:8,textAlign:'left'}}>
      {t(room.name)}{t("’s expedition · ")}{t(room.players)}{t("/")}{t(room.capacity)}{t(" players")}<br/><small>{t(room.address)}{t(address===room.address?' · Selected':'')}</small></button>))}
     <p>{t("Choose a room above, or enter the host’s local address if it does not appear. On iPhone, enter the host address manually. Some Wi-Fi networks block connections between phones.")}</p>
     <div className="form-grid"><label className="field-label">{t("Host local address")}<input placeholder={t("192.168.43.1")} autoComplete="off" inputMode="decimal" value={address} onChange={e=>setAddress(e.target.value)}/></label><label className="field-label">{t("Room code")}<input placeholder={t("Six digits")} inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label></div>
     <button className="primary" disabled={busy||network.scanning||!address||code.length!==6} onClick={()=>task(()=>network.join(address,code,name))}>{t(busy?'Connecting…':'Join expedition')}</button></>)}
  </section></>;
}


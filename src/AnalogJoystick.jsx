import React,{useEffect,useRef,useState} from 'react';
export default function AnalogJoystick({onMove,hub=false}){
 const [point,setPoint]=useState({x:0,y:0}),active=useRef(null),latest=useRef(onMove);latest.current=onMove;
 const apply=p=>{setPoint(p);latest.current(p.x,p.y)};
 const move=e=>{const bounds=e.currentTarget.getBoundingClientRect(),radius=bounds.width*.32,x=(e.clientX-bounds.left-bounds.width/2)/radius,y=(e.clientY-bounds.top-bounds.height/2)/radius,length=Math.hypot(x,y);const magnitude=length<.16?0:Math.min(1,(length-.16)/.84);apply({x:length?x/length*magnitude:0,y:length?y/length*magnitude:0})};
 const stop=e=>{if(e?.pointerId!==undefined&&active.current!==null&&e.pointerId!==active.current)return;active.current=null;apply({x:0,y:0})};
 useEffect(()=>{const blur=()=>stop();window.addEventListener('blur',blur);return()=>{window.removeEventListener('blur',blur);latest.current(0,0)}},[]);
 const capture=(e,p)=>{e.preventDefault();if(active.current!==null&&active.current!==e.pointerId)return;active.current=e.pointerId;try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}if(p)apply(p);else move(e)};
 return <div className="analog-stick" aria-label="Movement joystick" onPointerDown={e=>capture(e)} onPointerMove={e=>{if(active.current===e.pointerId)move(e)}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
 <span className="analog-ring"/><span className="analog-thumb" style={{transform:`translate(${point.x*28}px,${point.y*28}px)`}}/>{[['up',0,-1],['right',1,0],['down',0,1],['left',-1,0]].map(([name,x,y])=><button key={name} className={'analog-key '+name} aria-label={'Move '+(hub?'hub ':'')+name} onPointerDown={e=>{e.stopPropagation();capture(e,{x,y})}} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();apply({x,y})}}} onKeyUp={()=>stop()} onBlur={()=>{if(active.current===null)stop()}}><span aria-hidden="true">{name==='up'?'↑':name==='down'?'↓':name==='left'?'←':'→'}</span></button>)}</div>;
}

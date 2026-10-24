import React,{useRef,useState} from 'react';
export default function AnalogJoystick({onMove,hub=false}){
 const [point,setPoint]=useState({x:0,y:0}),active=useRef(false);
 const move=e=>{const bounds=e.currentTarget.getBoundingClientRect(),radius=bounds.width*.32,x=(e.clientX-bounds.left-bounds.width/2)/radius,y=(e.clientY-bounds.top-bounds.height/2)/radius,scale=Math.max(1,Math.hypot(x,y));const p={x:x/scale,y:y/scale};setPoint(p);onMove(p.x,p.y)};
 const stop=()=>{active.current=false;setPoint({x:0,y:0});onMove(0,0)};
 return <div className="analog-stick" aria-label="Movement joystick" onPointerDown={e=>{e.preventDefault();active.current=true;e.currentTarget.setPointerCapture(e.pointerId);move(e)}} onPointerMove={e=>{if(active.current)move(e)}} onPointerUp={stop} onPointerCancel={stop}>
 <span className="analog-ring"/><span className="analog-thumb" style={{transform:`translate(${point.x*28}px,${point.y*28}px)`}}/>{[['up',0,-1],['right',1,0],['down',0,1],['left',-1,0]].map(([name,x,y])=><button key={name} className={'analog-key '+name} aria-label={'Move '+(hub?'hub ':'')+name} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();setPoint({x,y});onMove(x,y)}}} onKeyUp={stop} onBlur={stop}><span aria-hidden="true">{name==='up'?'↑':name==='down'?'↓':name==='left'?'←':'→'}</span></button>)}</div>;
}

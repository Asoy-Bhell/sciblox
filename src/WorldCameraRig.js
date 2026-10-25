// Touch-look lives on the world canvas, so dragging the right side never steals
// the joystick's captured pointer. Short taps still select portals and eggs.
export function createWorldCameraRig(element){
 const rig={yaw:0,pitch:0,jumpStart:-Infinity},drag={id:null,x:0,y:0,startX:0,startY:0,moved:false};
 let targetYaw=0,targetPitch=0,aim=null,mode=null;
 const down=e=>{if(drag.id!==null)return;drag.id=e.pointerId;drag.x=drag.startX=e.clientX;drag.y=drag.startY=e.clientY;drag.moved=false};
 const move=e=>{if(drag.id!==e.pointerId)return;if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<8)return;drag.moved=true;targetYaw-=(e.clientX-drag.x)*.004;targetPitch=Math.max(-.45,Math.min(.45,targetPitch+(e.clientY-drag.y)*.003));drag.x=e.clientX;drag.y=e.clientY};
 const release=e=>{if(e.pointerId===drag.id)drag.id=null};
 const blur=()=>{drag.id=null;drag.moved=false};
 rig.didDrag=()=>drag.moved;
 const jump=()=>{if(performance.now()-rig.jumpStart>650)rig.jumpStart=performance.now()};
 element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',blur);window.addEventListener('sciblox-jump',jump);
 rig.height=()=>{const t=(performance.now()-rig.jumpStart)/650;return t>=0&&t<=1?Math.sin(t*Math.PI)*.8:0};
 rig.update=delta=>{const factor=1-Math.exp(-Math.max(0,delta)*16);rig.yaw+=(targetYaw-rig.yaw)*factor;rig.pitch+=(targetPitch-rig.pitch)*factor};
 // Aim and position use the same damping; no idle or walking camera bob.
 rig.apply=(camera,position,look,delta,nextMode)=>{if(!aim||mode!==nextMode){aim=look.clone();camera.position.copy(position);mode=nextMode}else{const factor=1-Math.exp(-Math.max(0,delta)*10);camera.position.lerp(position,factor);aim.lerp(look,factor)}camera.lookAt(aim)};
 rig.dispose=()=>{element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('blur',blur);window.removeEventListener('sciblox-jump',jump)};
 return rig;
}
export function triggerJump(){window.dispatchEvent(new Event('sciblox-jump'))}

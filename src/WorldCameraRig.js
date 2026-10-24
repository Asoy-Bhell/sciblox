// Touch-look lives on the world canvas, so dragging the right side never steals
// the joystick's captured pointer. Short taps still select portals and eggs.
export function createWorldCameraRig(element){
 const rig={yaw:0,pitch:0,jumpStart:-Infinity},drag={id:null,x:0,y:0};
 const down=e=>{drag.id=e.pointerId;drag.x=e.clientX;drag.y=e.clientY};
 const move=e=>{if(drag.id!==e.pointerId)return;rig.yaw-=(e.clientX-drag.x)*.006;rig.pitch=Math.max(-.6,Math.min(.6,rig.pitch+(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY};
 const release=e=>{if(e.pointerId===drag.id)drag.id=null};
 const jump=()=>{if(performance.now()-rig.jumpStart>650)rig.jumpStart=performance.now()};
 element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('sciblox-jump',jump);
 rig.height=()=>{const t=(performance.now()-rig.jumpStart)/650;return t>=0&&t<=1?Math.sin(t*Math.PI)*.8:0};
 rig.dispose=()=>{element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('sciblox-jump',jump)};
 return rig;
}
export function triggerJump(){window.dispatchEvent(new Event('sciblox-jump'))}

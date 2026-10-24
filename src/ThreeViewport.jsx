import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';

// Only visible views own a graphics context. Pet lists can otherwise exhaust
// Android WebView's context budget even when their cards are off screen.
const activeViews=new Set(),waitingViews=new Set();
const MAX_VIEWS=8;
function releaseSlot(view){activeViews.delete(view);for(const wake of [...waitingViews])wake()}
function disposeScene(scene){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[]){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value)}});
 geometries.forEach(value=>value.dispose());textures.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());scene.clear();
}

export default function ThreeViewport({buildScene,className='',label='SciBlox 3D scene',children,onUnavailable}){
 const host=useRef(null),latest=useRef({onUnavailable});latest.current={onUnavailable};
 const [status,setStatus]=useState('waiting'),[retry,setRetry]=useState(0);
 useEffect(()=>{
  const element=host.current;if(!element)return;
  let renderer,scene,camera,api,raf=0,visible=false,disposed=false,failed=false,last=0,elapsed=0,frames=0;
  const identity={};
  const stopFrame=()=>{cancelAnimationFrame(raf);raf=0;last=0};
  const frame=now=>{
   raf=0;if(disposed||!renderer||!visible||document.hidden||failed)return;
   if(api?.still&&frames>35)return;
   if(last&&now-last<15){raf=requestAnimationFrame(frame);return}
   const dt=last?Math.min((now-last)/1000,.15):0;last=now;elapsed+=dt;
   try{api?.update?.(dt,elapsed);renderer.render(scene,camera);frames++;if(frames===1||frames%5===0){element.dataset.drawCalls=String(renderer.info.render.calls);element.dataset.frameCount=String(frames)}}
   catch(error){failed=true;setStatus('fallback');latest.current.onUnavailable?.(error);stopFrame();return}
   raf=requestAnimationFrame(frame);
  };
  const resume=()=>{if(renderer&&visible&&!document.hidden&&!failed&&!raf)raf=requestAnimationFrame(frame)};
  const resize=()=>{
   if(!renderer)return;if(api?.still)frames=0;const width=Math.max(1,element.clientWidth),height=Math.max(1,element.clientHeight);
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setSize(width,height,false);
   camera.aspect=width/height;camera.updateProjectionMatrix();api?.resize?.(width,height);resume();
  };
  const lost=event=>{event.preventDefault();failed=true;stopFrame();setStatus('lost')};
  const restored=()=>{failed=false;setStatus('ready');resize();resume()};
  const destroy=()=>{
   stopFrame();if(!renderer)return;
   renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);
   api?.dispose?.();disposeScene(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();renderer=null;api=null;releaseSlot(identity);
  };
  const create=()=>{
   if(disposed||!visible||renderer||failed)return;
   if(activeViews.size>=MAX_VIEWS){setStatus('fallback');waitingViews.add(create);return}
   waitingViews.delete(create);activeViews.add(identity);
   try{
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:window.devicePixelRatio<2,powerPreference:'low-power'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',label);renderer.domElement.tabIndex=-1;
    renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
    element.prepend(renderer.domElement);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(45,1,.1,200);
    api=buildScene({scene,camera,renderer,element,THREE})||{};setStatus('ready');resize();resume();
   }catch(error){failed=true;if(renderer){try{destroy()}catch{renderer=null}}else releaseSlot(identity);setStatus('fallback');latest.current.onUnavailable?.(error)}
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)create();else{waitingViews.delete(create);destroy();setStatus('waiting')}},{rootMargin:'60px'});
  observer.observe(element);const sizes=new ResizeObserver(resize);sizes.observe(element);
  const visibility=()=>document.hidden?stopFrame():resume();document.addEventListener('visibilitychange',visibility);
  return()=>{disposed=true;waitingViews.delete(create);observer.disconnect();sizes.disconnect();document.removeEventListener('visibilitychange',visibility);destroy()};
 },[buildScene,label,retry]);
 return <div ref={host} className={'three-viewport '+className} data-state={status} data-draw-calls="0" data-frame-count="0">{status!=='ready'&&<div className="three-fallback">{children||<span>3D graphics are unavailable on this device. You can still use the activity buttons.</span>}{(status==='fallback'||status==='lost')&&<button className="three-retry" onClick={()=>setRetry(value=>value+1)}>Retry 3D</button>}</div>}</div>
}

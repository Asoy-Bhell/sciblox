// localized-ui
import {t,getLanguage} from './i18n';
import {enrichWorld,decoratePortal} from './WorldArt';
import AnalogJoystick from './AnalogJoystick';
import React,{useCallback,useRef,useState} from 'react';
import ThreeViewport from './ThreeViewport';
import {CameraControls,TalkButton,JumpButton} from './WorldCameraControls';
import {createWorldCameraRig,triggerJump} from './WorldCameraRig';
import {createExplorer,createPlayerAvatar,createNameLabel,animateExplorer,createTree,createEgg,createPet,animatePet,disposeObject} from './three-models';
import './world3d.css';

const PORTALS=[[-11,-10],[-3,-13],[6,-12],[12,-5],[12,5],[5,12],[-4,12],[-12,5]];
const PORTAL_COLORS=[0x14b8e2,0x24bf89,0x64c86d,0xf0ac43,0x4b9ef4,0xa67bee,0x21bebe,0xed83bd];
const unlocked=(data,index)=>index===0||data.completed.includes(index-1);
const normalizePoint=point=>({x:(point.x+18)/36*100,y:(point.z+18)/36*100});
const toWorld=player=>({x:(player.x??50)/100*36-18,z:(player.y??72.22)/100*36-18});

export default function JourneyMap3D({stations,completed=[],xp=0,onSelect,motion=true,preview=false,outfit='Explorer',avatar='Human',gender='girl',picture,playerName='Explorer',onTalk,onPosition,remotePlayers=[],activityWorld=false,runId=null,worldTitle='GENETICS WORLD',guideTarget=0}){
 const language=getLanguage();
 const [cameraMode,setCameraMode]=useState('follow'),[nearby,setNearby]=useState(null),[notice,setNotice]=useState('');
 const [pose,setPose]=useState({x:50,y:72.22,walking:false,facing:'up'});
 const latest=useRef({}),control=useRef({direction:{x:0,z:0},keys:new Set(),player:{x:0,z:8},facing:'up'});
 latest.current={stations,completed,xp,onSelect,motion,preview,outfit,avatar,gender,picture,playerName,onTalk,onPosition,remotePlayers,cameraMode,activityWorld,runId,worldTitle,guideTarget};
 const interact=useRef(()=>{});
 const buildScene=useCallback(({scene,camera,renderer,element,THREE})=>{
  const cameraRig=createWorldCameraRig(renderer.domElement);
  renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFShadowMap;
  scene.background=new THREE.Color(0xaddffd);scene.fog=new THREE.Fog(0xaddffd,58,120);
  scene.add(new THREE.HemisphereLight(0xf1fbff,0x8ba36b,1.5));
  const sun=new THREE.DirectionalLight(0xfff4d7,2.2);sun.position.set(-18,35,14);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-26;sun.shadow.camera.right=26;sun.shadow.camera.top=26;sun.shadow.camera.bottom=-26;sun.shadow.normalBias=.06;scene.add(sun);enrichWorld(scene);
  const geometry=new THREE.BoxGeometry(1,1,1),materials=new Map();
  const material=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.88,flatShading:true}));return materials.get(color)};
  const box=(w,h,d,color,x=0,y=0,z=0,parent=scene)=>{
   const cube=new THREE.Mesh(geometry,material(color));cube.scale.set(w,h,d);cube.position.set(x,y,z);cube.castShadow=true;cube.receiveShadow=true;parent.add(cube);return cube;
  };
  const tiles=[],matrix=new THREE.Matrix4(),tileColor=new THREE.Color();
  for(let x=-10;x<10;x++)for(let z=-10;z<10;z++){
   if(Math.abs(x+.5)+Math.abs(z+.5)>16.5)continue;tiles.push({x:x*2+1,z:z*2+1});
  }
  const ground=new THREE.InstancedMesh(new THREE.BoxGeometry(2,.6,2),material(0xffffff),tiles.length);
  const soil=new THREE.InstancedMesh(new THREE.BoxGeometry(2,2.4,2),material(0x99764f),tiles.length);
  tiles.forEach((tile,index)=>{
   matrix.makeTranslation(tile.x,-.3,tile.z);ground.setMatrixAt(index,matrix);
   ground.setColorAt(index,tileColor.set(index%4===0?0x68ba64:0x78c96e));
   matrix.makeTranslation(tile.x,-1.8,tile.z);soil.setMatrixAt(index,matrix);
  });ground.receiveShadow=true;soil.receiveShadow=true;scene.add(ground,soil);
  box(180,.2,180,0x42bce6,0,-3.3,0).castShadow=false;
  // Paved central plaza and eight paths are actual cuboid tiles.
  const paving=[];
  for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++)if(Math.hypot(x,z)<6)paving.push({x:x*1.4,z:z*1.4});
  const plaza=new THREE.InstancedMesh(new THREE.BoxGeometry(1.37,.1,1.37),material(0xffffff),paving.length);
  paving.forEach((tile,index)=>{matrix.makeTranslation(tile.x,.035,tile.z);plaza.setMatrixAt(index,matrix);plaza.setColorAt(index,tileColor.set(index%2?0xcbdbe2:0xe0eaf0))});plaza.receiveShadow=true;scene.add(plaza);
  PORTALS.slice(0,latest.current.stations.length).forEach(([x,z])=>{for(let step=5;step<12;step++){const t=step/12;box(1.35,.08,1.35,step%2?0xcbdbe2:0xe0eaf0,x*t,.025,z*t).castShadow=false}});
  // Canvas textures are generated locally only for physical signboards.
  const sign=(text,subtitle,width,height,x,y,z,parent=scene,background='#166dc3')=>{
   const canvas=document.createElement('canvas');canvas.width=640;canvas.height=160;
   const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,640,160);
   ctx.strokeStyle='#8bdeff';ctx.lineWidth=10;ctx.strokeRect(5,5,630,150);
   ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';let fontSize=48;ctx.font='900 '+fontSize+'px Arial';
   while(fontSize>16&&ctx.measureText(text).width>590){fontSize-=2;ctx.font='900 '+fontSize+'px Arial'}
   ctx.fillText(t(text),320,subtitle?62:82);
   if(subtitle){ctx.font='700 25px Arial';ctx.fillStyle='#bceeff';ctx.fillText(t(subtitle),320,119)}
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   const board=box(width,height,.18,0x104e8a,x,y,z,parent);
   const face=new THREE.Mesh(new THREE.PlaneGeometry(width*.96,height*.92),new THREE.MeshBasicMaterial({map:texture}));
   face.position.set(x,y,z+.101);parent.add(face);return {board,face};
  };
  const digit=(number,parent,x,y,z,color=0xffffff)=>{
   const patterns=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg'];
   const segments={a:[0,.44,.5,.1],b:[.25,.22,.1,.4],c:[.25,-.22,.1,.4],d:[0,-.44,.5,.1],e:[-.25,-.22,.1,.4],f:[-.25,.22,.1,.4],g:[0,0,.5,.1]};
   for(const name of patterns[number]){const [dx,dy,w,h]=segments[name];box(w,h,.08,color,x+dx,y+dy,z,parent)}
  };
  const portalNodes=PORTALS.slice(0,latest.current.stations.length).map(([x,z],index)=>{
   const portal=new THREE.Group();portal.position.set(x,0,z);portal.rotation.y=Math.atan2(-x,-z);scene.add(portal);
   const open=unlocked(latest.current,index),color=open?PORTAL_COLORS[index]:0x8197a8;
   box(4,.22,2.65,open?0x79dcf3:0xa7b7be,0,.1,0,portal);
   decoratePortal(portal,{open});
   const portalMaterial=new THREE.MeshStandardMaterial({color:open?0x51d7fb:0x7b9daf,emissive:open?0x167ea8:0x000000,emissiveIntensity:.32,transparent:true,opacity:open?.65:.38,roughness:.3});
   const screen=new THREE.Mesh(new THREE.BoxGeometry(2.25,2.75,.12),portalMaterial);screen.position.y=1.82;portal.add(screen);
   const label=sign(latest.current.stations[index].name,open?(latest.current.activityWorld?'ACTIVITY ':'STATION ')+(index+1):(latest.current.activityWorld?'ACTIVITY ':'STATION ')+(index+1)+' · LOCKED',4.25,.95,0,4.2,0,portal,open?'#146dc0':'#536b80');
   box(1.1,1.16,.23,open?0x156bc0:0x63798b,0,5.25,0,portal);digit(index+1,portal,0,5.25,.15);
   if(!open){box(.62,.52,.3,0xffd256,0,1.8,.3,portal);box(.13,.43,.2,0xffd256,-.23,2.2,.3,portal);box(.13,.43,.2,0xffd256,.23,2.2,.3,portal);box(.55,.13,.2,0xffd256,0,2.43,.3,portal)}
   if(latest.current.completed.includes(index)){box(.15,2.6,.15,0xffe9ac,2.15,1.3,0,portal);box(.95,.55,.1,0x28c68e,2.58,2.35,0,portal)}
   screen.userData.station=index;label.board.userData.station=index;label.face.userData.station=index;
   const target=new THREE.Mesh(new THREE.BoxGeometry(4.4,5.7,2.8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));target.position.y=2.75;target.userData.station=index;portal.add(target);
   const particle=box(.25,.25,.25,open?0xc4f7ff:0x8fa4b0,-.6,2.5,.4,portal);
   return {portal,target,screen,particle};
  });
  // A glowing breadcrumb path leads to the next unlocked activity.
  if(latest.current.activityWorld){const next=latest.current.stations.findIndex((_,i)=>!latest.current.completed.includes(i)),target=PORTALS[Math.max(0,next)];for(let i=0;i<9;i++){const t=(i+1)/11;const marker=box(.55,.04,.32,0x5ceaff,target[0]*t,.13,8+(target[1]-8)*t);marker.material.emissive.set(0x32bfee);marker.material.emissiveIntensity=.8;marker.rotation.y=Math.atan2(target[0],target[1]-8)}}
  // The main Science portal gives the plaza a clear destination and identity.
  const science=new THREE.Group();science.position.set(0,0,-7);scene.add(science);
  box(.7,4.5,.8,0x1886d9,-2.6,2.25,0,science);box(.7,4.5,.8,0x1886d9,2.6,2.25,0,science);box(6,.7,1.05,0x1685d8,0,4.75,0,science);
  sign(latest.current.worldTitle,latest.current.activityWorld?'FOLLOW THE GLOWING PATH':'SCIBLOX SCIENCE EXPEDITION',7,1.25,0,5.65,0,science);
  const dna=new THREE.Group();dna.position.set(0,1.15,0);science.add(dna);
  for(let level=0;level<7;level++){
   const angle=level*.8,x=Math.sin(angle)*.7,z=Math.cos(angle)*.7;
   box(.27,.27,.27,0x49dcea,x,level*.35,z,dna);box(.27,.27,.27,0xffcf54,-x,level*.35,-z,dna);
   const bond=box(1.4,.1,.1,0xf6fbff,0,level*.35,0,dna);bond.rotation.y=-angle;
  }
  // Distant tiered green cliffs frame the playable plaza without blocking paths.
  if(latest.current.activityWorld){for(let i=0;i<12;i++){const x=-29+i*5,z=-25-Math.abs(Math.sin(i*2))*6,height=3+(i%4)*1.8;box(5,height,6,0x8a9879,x,height/2-1,z);box(5.2,.5,6.2,0x62b471,x,height-0.8,z);const tree=createTree(i%2);tree.position.set(x,height-.5,z);tree.scale.setScalar(1.3);scene.add(tree)}for(const x of [-8,8]){box(2.2,5.4,2.1,0x7399b9,x,2.7,-20);box(2.5,.7,2.5,0x428ec1,x,5.7,-20);box(.45,2,.45,0x53d7ee,x,7,-20)}}
  // Camp and hatchery landmarks remain part of the same explorable hub.
  const hatchery=new THREE.Group();hatchery.position.set(-13,0,-2);hatchery.rotation.y=.65;scene.add(hatchery);
  box(4,2.3,3,0x75b5ce,0,1.15,0,hatchery);box(4.4,.5,3.4,0xffcb5d,0,2.55,0,hatchery);
  box(1.25,1.85,.12,0x194f6f,0,.95,1.56,hatchery);sign('HATCHERY','RAISE YOUR COMPANIONS',4.2,.85,0,3.25,0,hatchery,'#237a92');
  for(let index=0;index<3;index++){const egg=createEgg(index);egg.position.set(-1.4+index*1.4,.2,2.45);egg.scale.setScalar(.7);hatchery.add(egg)}
  const camp=new THREE.Group();camp.position.set(0,0,14.8);scene.add(camp);
  box(4,.2,2.5,0xc7aa72,0,.1,0,camp);box(.16,2,.16,0x167d95,-1.8,1,0,camp);box(.16,2,.16,0x167d95,1.8,1,0,camp);box(4.5,.4,3,0x20abc1,0,2.1,0,camp);
  sign('EXPLORER CAMP','YOUR JOURNEY STARTS HERE',4,.8,0,2.85,0,camp,'#16758b');
  const pet=createPet('Turtle');pet.position.set(2.8,0,14.5);pet.scale.setScalar(.8);scene.add(pet);
  const treeLocations=[[-17,-10],[-14,-15],[-7,-17],[2,-17],[12,-15],[17,-10],[17,0],[16,10],[10,16],[-9,16],[-16,11],[-17,1],[-7,-6],[8,2]];
  treeLocations.forEach(([x,z],index)=>{const tree=createTree(index%2);tree.position.set(x,0,z);tree.scale.setScalar(index<12?1.35:.9);scene.add(tree)});
  for(let index=0;index<16;index++){
   const x=Math.sin(index*6.8)*15,z=Math.cos(index*3.7)*15;
   if(Math.abs(x)<7&&Math.abs(z)<7)continue;
   box(.16,.4,.16,0x288f60,x,.2,z);box(.5,.2,.5,[0xffcb55,0xc696f7,0xff8f87][index%3],x,.5,z);
  }
  // High, distant clouds are chunky geometry and require no downloaded image.
  for(let index=0;index<7;index++){const x=-37+index*13,z=-35-(index%2)*12;box(6,1.3,2.8,0xffffff,x,16+(index%3),z).castShadow=false;box(3,1.2,2.5,0xffffff,x+1,17+(index%3),z).castShadow=false}
  const playerModel=data=>{const model=createPlayerAvatar({color:0x178bd3,outfit:data.outfit,avatar:data.avatar,gender:data.gender,picture:data.picture});model.scale.multiplyScalar(1.0);model.add(createNameLabel(data.playerName));return model};
  let explorer=playerModel(latest.current);scene.add(explorer);let lastOutfit=JSON.stringify([latest.current.outfit,latest.current.avatar,latest.current.gender,latest.current.picture,latest.current.playerName]);
  const guide=createExplorer({outfit:'Guide',gender:'female'});guide.position.set(-2.5,0,5);guide.add(createNameLabel('Bhell · Guide'));scene.add(guide);
  const playerMarker=box(.9,.035,.9,0xf5fbff,0,.07,8);playerMarker.castShadow=false;
  const remotes=new Map(),remoteColors=[0x9873eb,0xf3aa3d,0xee83ac];
  const state=control.current;let lastPublished=0,lastNearby='',aspect=1;
  const nearestPortal=()=>{
   let nearest=null,distance=Infinity;
   PORTALS.slice(0,latest.current.stations.length).forEach(([x,z],index)=>{const d=Math.hypot(state.player.x-x,state.player.z-z);if(d<distance){distance=d;nearest={index,distance:d}}});
   return nearest&&nearest.distance<3.25?nearest:null;
  };
  const activate=index=>{
   const data=latest.current;if(data.preview)return;
   if(!unlocked(data,index)){setNotice('Complete Station '+index+' to open this portal.');return}
   data.onSelect?.(index);
  };
  interact.current=()=>{const near=nearestPortal();if(near)activate(near.index)};
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerDown=null;
  const portalHit=event=>{
   const bounds=renderer.domElement.getBoundingClientRect();if(!bounds.width||!bounds.height)return null;
   pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);
   return raycaster.intersectObjects(portalNodes.map(node=>node.target),false)[0]?.object;
  };
  const down=event=>{pointerDown={x:event.clientX,y:event.clientY}};
  const up=event=>{if(cameraRig.didDrag()||!pointerDown||Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>10)return;pointerDown=null;const target=portalHit(event);if(raycaster.intersectObject(guide,true).length)latest.current.onTalk?.();else if(target)activate(target.userData.station)};
  const hover=event=>{if(event.pointerType!=='touch')renderer.domElement.style.cursor=portalHit(event)?'pointer':'default'};
  const keyDown=event=>{if(document.querySelector('[role="dialog"]:not([data-blocking="false"])'))return;
   if(latest.current.preview||document.querySelector('[role="dialog"]:not([data-blocking="false"])')||/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
   const key=event.key.toLowerCase();
   if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){event.preventDefault();state.keys.add(key)}
   if((key==='enter'||key==='e')&&event.target.tagName!=='BUTTON'){event.preventDefault();interact.current()}
  };
  const keyUp=event=>state.keys.delete(event.key.toLowerCase());
  const release=()=>{state.keys.clear();state.direction={x:0,z:0}};
  if(!latest.current.preview){
   renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointermove',hover);
   window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',release);
  }
  camera.fov=48;camera.near=.1;camera.far=180;camera.position.set(0,11.5,23.5);camera.lookAt(0,.7,5.5);camera.updateProjectionMatrix();
  const desired=new THREE.Vector3(),look=new THREE.Vector3();
  return {
   still:preview,
   resize(width,height){aspect=width/Math.max(height,1)},
   update(delta,time){
    cameraRig.update(delta);
    const data=latest.current,dt=Math.min(delta,.12);
    let dx=state.direction.x+(state.keys.has('arrowright')||state.keys.has('d')?1:0)-(state.keys.has('arrowleft')||state.keys.has('a')?1:0);
    let dz=state.direction.z+(state.keys.has('arrowdown')||state.keys.has('s')?1:0)-(state.keys.has('arrowup')||state.keys.has('w')?1:0);
    if(data.preview||document.documentElement.dataset.scibloxPaused==='true'||!!document.querySelector('[role="dialog"]:not([data-blocking="false"])')){dx=0;dz=0;state.keys.clear()}
    if(data.cameraMode==='first'){const x=dx;dx=x*Math.cos(cameraRig.yaw)+dz*Math.sin(cameraRig.yaw);dz=dz*Math.cos(cameraRig.yaw)-x*Math.sin(cameraRig.yaw)}
    if(Math.hypot(dx,dz)<.08){dx=0;dz=0}const moving=!!(dx||dz),length=Math.max(1,Math.hypot(dx,dz));
    state.player.x=Math.max(-17,Math.min(17,state.player.x+dx/length*6*dt));state.player.z=Math.max(-17,Math.min(17,state.player.z+dz/length*6*dt));
    if(moving)state.facing=Math.abs(dx)>Math.abs(dz)?dx<0?'left':'right':dz<0?'up':'down';
    const identity=JSON.stringify([data.outfit,data.avatar,data.gender,data.picture,data.playerName]);if(lastOutfit!==identity){scene.remove(explorer);disposeObject(explorer);explorer=playerModel(data);scene.add(explorer);lastOutfit=identity}const goal=PORTALS[Math.max(0,data.guideTarget)]||PORTALS[0],gx=goal[0],gz=goal[1]+2.8;
    const guideDx=gx-guide.position.x,guideDz=gz-guide.position.z,guideDistance=Math.hypot(guideDx,guideDz),guideMoving=data.activityWorld&&guideDistance>.12&&!document.querySelector('[role="dialog"]:not([data-blocking="false"])');
    if(guideMoving){const step=Math.min(guideDistance,dt*3.2);guide.position.x+=guideDx/guideDistance*step;guide.position.z+=guideDz/guideDistance*step}
    animateExplorer(guide,{walking:guideMoving&&data.motion,talking:false,facing:guideMoving?Math.abs(guideDx)>Math.abs(guideDz)?guideDx<0?'left':'right':guideDz<0?'up':'down':'down',time:data.motion?time:0,delta});
    element.dataset.guideTarget=String(data.guideTarget);element.dataset.guideX=String(guide.position.x);element.dataset.guideZ=String(guide.position.z);
    explorer.position.set(state.player.x,cameraRig.height(),state.player.z);explorer.visible=data.cameraMode!=='first';animateExplorer(explorer,{walking:moving&&data.motion,facing:state.facing,talking:false,time:data.motion?time:0,delta});
    playerMarker.position.set(state.player.x,.07,state.player.z);playerMarker.rotation.y=Math.PI/4;
    animatePet(pet,{time:data.motion?time:0,happy:false});dna.rotation.y=data.motion?time*.3:0;
    portalNodes.forEach((node,index)=>{const open=unlocked(data,index);node.particle.position.y=2.5+(data.motion?Math.sin(time*2+index)*.35:0);node.particle.rotation.y=data.motion?time:0;node.screen.material.emissiveIntensity=open?.25+(data.motion?Math.sin(time*2+index)*.12:0):0});
    const present=new Set(data.remotePlayers.map(player=>player.id));for(const [id,model]of remotes)if(!present.has(id)){scene.remove(model);disposeObject(model);remotes.delete(id)}
    data.remotePlayers.forEach((player,index)=>{
     let model=remotes.get(player.id);const identity=JSON.stringify([player.avatar,player.gender,player.outfit,player.name]);if(!model||model.userData.identity!==identity){if(model){scene.remove(model);disposeObject(model)}model=createPlayerAvatar({color:remoteColors[index%3],outfit:player.outfit||'Explorer',avatar:player.avatar,gender:player.gender,picture:player.picture});model.scale.multiplyScalar(1.2);model.add(createNameLabel(player.name));model.userData.identity=identity;remotes.set(player.id,model);scene.add(model);const p=toWorld(player);model.position.set(p.x,0,p.z)}
     const p=toWorld(player);model.position.x+=(p.x-model.position.x)*Math.min(1,dt*15);model.position.z+=(p.z-model.position.z)*Math.min(1,dt*15);
     animateExplorer(model,{walking:player.walking&&data.motion,facing:player.facing||'up',talking:false,time:data.motion?time:0,delta});
    });
    if(time-lastPublished>.09&&!data.preview){
     lastPublished=time;const p=normalizePoint(state.player);
     setPose({...p,walking:moving,facing:state.facing});data.onPosition?.({...p,walking:moving,facing:state.facing,outfit:data.outfit,avatar:data.avatar,gender:data.gender,scope:data.activityWorld?'station':'lobby',runId:data.runId});
     const near=nearestPortal(),key=near?near.index+'':'none';
     if(key!==lastNearby){lastNearby=key;setNearby(near?near.index:null);setNotice('')}
    }
    if(data.cameraMode==='overview'){const scale=Math.max(1,1/aspect);desired.set(2,39*scale,33*scale);look.set(0,0,0)}
    else if(data.cameraMode==='first'){desired.set(state.player.x,2.35,state.player.z);look.set(state.player.x-Math.sin(cameraRig.yaw)*10,2.35-cameraRig.pitch*8,state.player.z-Math.cos(cameraRig.yaw)*10)}
    else{desired.set(state.player.x+Math.sin(cameraRig.yaw)*7.6,4.7+cameraRig.pitch*3,state.player.z+Math.cos(cameraRig.yaw)*7.6);look.set(state.player.x,1.5,state.player.z)}
    cameraRig.apply(camera,desired,look,delta,data.cameraMode);
   },
   dispose(){
    cameraRig.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointermove',hover);
    window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',release);release();
   }
  };
 },[preview,completed.join(','),xp,stations.length,runId,language]);
 const move=(event,x,z)=>{event.preventDefault();event.currentTarget.setPointerCapture?.(event.pointerId);control.current.direction={x,z}};
 const stop=()=>{control.current.direction={x:0,z:0}};
 return <section className={'journey-hub3d world3d-shell'+(preview?' hub3d-preview':'')} data-camera={cameraMode} data-preview={preview?'true':'false'} data-gender={gender} data-avatar-id={picture} aria-label={t("SciBlox 3D Genetics World hub")}>
  <ThreeViewport buildScene={buildScene} className="world3d-canvas" label={t("Walkable blocky Genetics World with eight station portals")}><div className="world3d-fallback-content"><h3>{t("Your expedition is ready.")}</h3><p>{t("3D graphics are unavailable on this device. Choose an unlocked station using the portal buttons below.")}</p></div></ThreeViewport>
  {t(!preview&&<><div className="world3d-scene-hud"><span className="world3d-place">{t("GENETICS WORLD")}<small>{t(completed.length)}{t("/8 stations complete")}</small></span><CameraControls mode={cameraMode} onChange={setCameraMode}/></div>
   <div className="hub3d-dpad"><AnalogJoystick hub onMove={(x,y)=>{control.current.direction={x,z:y}}}/></div>
   <div className="hub3d-interact" aria-live="polite">{t(nearby===null?<><b>{t("Find your next discovery")}</b><small>{t("Walk to a portal · WASD / arrows")}</small></>:<><b>{t(stations[nearby].name)}</b><button type="button" disabled={!unlocked(latest.current,nearby)} onClick={()=>interact.current()}>{t(unlocked(latest.current,nearby)?(activityWorld?'Enter activity ':'Enter station ')+(nearby+1):'Locked')}</button><small>{t(unlocked(latest.current,nearby)?'Press E or Enter to explore':'Finish Station '+nearby+' to continue')}</small></>)}</div>
   <TalkButton onTalk={onTalk}/><JumpButton onJump={triggerJump}/>
   {t(notice&&<div className="hub3d-notice" role="status">{t(notice)}</div>)}
   <div className="world3d-probes"><span role="img" className="world-player" aria-label={t("Your explorer")} style={{left:pose.x+'%',top:pose.y+'%'}}><span data-animation={pose.walking?'walk':'idle'}/></span>{t(remotePlayers.map(player=><span className="world-player remote" key={player.id} style={{left:(player.x??50)+'%',top:(player.y??72.22)+'%'}}><span data-animation={player.walking?'walk':'idle'}/><small>{t(player.name)}</small></span>))}</div>
  </>)}
 </section>;
}

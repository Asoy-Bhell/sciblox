// localized-ui
import {t} from './i18n';
import {enrichWorld} from './WorldArt';
import React,{useCallback,useRef,useState} from 'react';
import ThreeViewport from './ThreeViewport';
import {CameraControls,TalkButton,JumpButton} from './WorldCameraControls';
import {createWorldCameraRig,triggerJump} from './WorldCameraRig';
import {createExplorer,createPlayerAvatar,createNameLabel,animateExplorer,createEgg,createGuardian,createTree,disposeObject} from './three-models';
import './world3d.css';

const EGG_SPOTS=[{x:72,y:22},{x:82,y:66},{x:35,y:37}];
const RARITIES=['Common','Rare','Epic'];
const EGG_COLORS=[0xffcc4b,0x28d9ef,0xb284ff];
const worldPoint=({x=12,y=82}={})=>({x:(x-50)*.24,z:(y-50)*.20});
const SAFE=worldPoint({x:12,y:82});
const NEST=worldPoint({x:78,y:44});

export default function AdventureWorld3D({position,guardian,walking=false,facing='right',run,remotePlayers=[],outfit='Explorer',actor='solo',onEgg,motion=true,avatar='Human',gender='girl',picture,playerName='Explorer',onTalk,onCameraHeading}){
 const [cameraMode,setCameraMode]=useState('follow');
 const latest=useRef({});latest.current={position,guardian,walking,facing,run,remotePlayers,outfit,actor,onEgg,motion,cameraMode,avatar,gender,picture,playerName,onTalk,onCameraHeading};
 const buildScene=useCallback(({scene,camera,renderer,element,THREE})=>{
  const cameraRig=createWorldCameraRig(renderer.domElement);
  renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFShadowMap;
  scene.background=new THREE.Color(0xc3eaff);
  scene.fog=new THREE.Fog(0xc3eaff,65,130);
  scene.add(new THREE.HemisphereLight(0xe4f7ff,0x8b9c59,1.5));
  const sunlight=new THREE.DirectionalLight(0xfff5da,2.2);
  sunlight.position.set(-12,30,16);sunlight.castShadow=true;
  sunlight.shadow.mapSize.set(1024,1024);
  sunlight.shadow.camera.left=-22;sunlight.shadow.camera.right=22;sunlight.shadow.camera.top=22;sunlight.shadow.camera.bottom=-22;
  sunlight.shadow.normalBias=.06;scene.add(sunlight);enrichWorld(scene,{island:true});
  const boxGeometry=new THREE.BoxGeometry(1,1,1),materials=new Map();
  const material=color=>{
   if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.92,flatShading:true}));
   return materials.get(color);
  };
  const box=(w,h,d,color,x=0,y=0,z=0,parent=scene)=>{
   const mesh=new THREE.Mesh(boxGeometry,material(color));mesh.scale.set(w,h,d);mesh.position.set(x,y,z);
   mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  // Instanced cuboids keep the terrain inexpensive on a phone. Every walkable
  // grass/sand tile has the same top height, matching the existing movement loop.
  const tiles=[];
  for(let x=-8;x<8;x++)for(let z=-7;z<7;z++){
   if((Math.abs(x+.5)>6.5&&Math.abs(z+.5)>4.5)||(Math.abs(x+.5)>7&&Math.abs(z+.5)>3.5))continue;
   tiles.push({x:x*2+1,z:z*2+1});
  }
  const tileSet=new Set(tiles.map(tile=>tile.x+','+tile.z)),matrix=new THREE.Matrix4(),color=new THREE.Color();
  const top=new THREE.InstancedMesh(new THREE.BoxGeometry(2,.55,2),material(0xffffff),tiles.length);
  const soil=new THREE.InstancedMesh(new THREE.BoxGeometry(2,1.8,2),material(0x9b7652),tiles.length);
  const stone=new THREE.InstancedMesh(new THREE.BoxGeometry(1.94,1.1,1.94),material(0x6d8490),tiles.length);
  tiles.forEach((tile,index)=>{
   const shore=[[-2,0],[2,0],[0,-2],[0,2]].some(([dx,dz])=>!tileSet.has((tile.x+dx)+','+(tile.z+dz)));
   matrix.makeTranslation(tile.x,-.275,tile.z);top.setMatrixAt(index,matrix);
   top.setColorAt(index,color.set(shore?0xf4d892:((index%5===0)?0x72c86d:(index%3===0)?0x6bc168:0x76cc73)));
   matrix.makeTranslation(tile.x,-1.45,tile.z);soil.setMatrixAt(index,matrix);
   matrix.makeTranslation(tile.x,-2.85,tile.z);stone.setMatrixAt(index,matrix);
  });
  top.receiveShadow=true;soil.receiveShadow=true;stone.receiveShadow=true;scene.add(top,soil,stone);
  box(180,.18,180,0x46bfe5,0,-3.55,0).castShadow=false;
  // Pixel-like ocean glints and a shallow, traversable stream.
  const glints=new THREE.InstancedMesh(new THREE.BoxGeometry(1.4,.025,.15),new THREE.MeshBasicMaterial({color:0x9ce6f7}),52);
  for(let i=0;i<52;i++){matrix.makeTranslation(Math.sin(i*7.3)*34,-3.43,Math.cos(i*3.8)*29);glints.setMatrixAt(i,matrix)}scene.add(glints);
  const river=[];
  for(let i=0;i<12;i++){const z=-11+i*2,x=[-1,-1,0,0,1,1,0,-1,-2,-2,-1,0][i];river.push({x,z});box(2.1,.045,2.06,0x45d7ed,x,.03,z).castShadow=false;box(.3,.05,1.2,0xb4f2ef,x+.65,.065,z-.2).castShadow=false}
  for(const z of [-5,3,7]){
   const segment=river.reduce((best,current)=>Math.abs(current.z-z)<Math.abs(best.z-z)?current:best,river[0]);
   for(let i=0;i<6;i++)box(.48,.16,1.65,0xc28c52,segment.x-1.25+i*.5,.13,z);
   box(3,.15,.12,0x8b603f,segment.x,.35,z-.82);box(3,.15,.12,0x8b603f,segment.x,.35,z+.82);
  }
  // Flat paving leads from camp toward the first discovery.
  for(let i=0;i<15;i++){
   const t=i/14,x=SAFE.x+(5.3-SAFE.x)*t,z=SAFE.z+(-5.6-SAFE.z)*t;
   if(Math.abs(x)<1.6)continue;
   box(.75,.065,.68,i%2?0xe6d4a4:0xf0dfb7,x,.03,z).castShadow=false;
  }
  // A blocky safe camp, away from the explorer's exact spawn point.
  const camp=new THREE.Group();camp.position.set(SAFE.x,0,SAFE.z);scene.add(camp);
  box(5,.045,4,0xa1e9c7,0,.02,0,camp).castShadow=false;
  box(1.75,1.25,1.6,0x25a7ba,-1.5,.625,.4,camp);
  box(2,.25,1.85,0x147389,-1.5,1.35,.4,camp);
  box(.7,.95,.05,0x123f50,-1.5,.48,1.22,camp);
  box(.13,2.4,.13,0xf8f2dc,1.65,1.2,.7,camp);
  box(.8,.55,.07,0x17b68c,2.02,2.1,.7,camp);
  box(1.5,.15,.8,0xa97a4c,.2,.2,1.6,camp);
  box(.13,.5,.13,0x805635,-.4,.1,1.6,camp);box(.13,.5,.13,0x805635,.8,.1,1.6,camp);
  const nest=new THREE.Group();nest.position.set(NEST.x,0,NEST.z);scene.add(nest);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const rock=box(.7,.5,.7,i%2?0x85959b:0x71838c,Math.cos(a)*1.35,.2,Math.sin(a)*1.2,nest);rock.rotation.y=a}
  // Stepped cliff scenery and a guardian cave give the island a voxel skyline.
  for(const side of [-1,1])for(let tier=0;tier<3;tier++){
   box(2.2,1.2+tier*.6,3.8,0x8c795e,side*(13.8+tier*.6),(.6+tier*.3),-6-tier*2.5);
   box(2.3,.24,3.9,tier%2?0x4cae50:0x67bd54,side*(13.8+tier*.6),1.3+tier*.6,-6-tier*2.5);
  }
  const cave=new THREE.Group();cave.position.set(8.5,0,-8.8);scene.add(cave);
  box(2.0,4,2.3,0x7b807c,-2,2,0,cave);box(2.0,4,2.3,0x7b807c,2,2,0,cave);box(6,1.5,2.7,0x858b80,0,4.3,0,cave);box(5.8,.35,2.8,0x59b45c,0,5.2,0,cave);box(2,3.4,.12,0x263e3a,0,1.7,-1.1,cave);
  for(const side of [-1,1]){box(.15,1.0,.15,0x82562d,side*1.15,1.4,1.2,cave);const lantern=box(.35,.45,.35,0xffcf58,side*1.15,2,1.2,cave);lantern.material=new THREE.MeshBasicMaterial({color:0xffcf58})}
  const waterfall=new THREE.Group();waterfall.position.set(-13.6,0,-10);scene.add(waterfall);
  box(2.6,5.4,2,0x8b8475,0,2.2,0,waterfall);box(2.7,.3,2.2,0x6dc562,0,5,0,waterfall);box(1.15,7.8,.22,0x54d6f2,0,.8,1.2,waterfall);box(.25,7.8,.25,0xaff4fa,.25,.8,1.35,waterfall);
  // Trees have actual cuboid canopies, not images or camera-facing planes.
  const treeSpots=[[-13,-7,0],[-10,-10,1],[-5,-11,0],[5,-10,1],[11,-7,0],[13,-1,1],[12,7,0],[7,10,1],[0,11,0],[-5,10,1],[-12,2,0],[-13,7,1],[-6,0,0],[7,0,1]];
  treeSpots.forEach(([x,z,kind],index)=>{const tree=createTree(kind);tree.position.set(x,0,z);tree.scale.setScalar(index<12?1.25:1);scene.add(tree)});
  for(const [x,z]of [[-14,-11],[-11,-12],[-8,-12],[1,-12],[9,-11],[13,-10],[-14,-2],[14,3]]){const tree=createTree(0);tree.position.set(x,0,z);tree.scale.setScalar(1.8);scene.add(tree)}
  for(let i=0;i<22;i++){const x=Math.sin(i*5.7)*12,z=Math.cos(i*4.3)*9;if(Math.abs(x)<2)continue;box(.16,.3,.16,0x338f57,x,.15,z);box(.35,.2,.35,[0xffd75b,0xcba3ff,0xff8e91][i%3],x,.38,z)}
  // Three separate physical eggs and larger transparent raycast targets.
  const targets=[],eggNodes=EGG_SPOTS.map((spot,index)=>{
   const root=new THREE.Group(),p=worldPoint(spot);root.position.set(p.x,0,p.z);scene.add(root);
   box(1.25,.14,1.25,EGG_COLORS[index],0,.08,0,root);
   const egg=createEgg(index);egg.position.y=.18;egg.scale.setScalar(1.2);root.add(egg);
   const beacon=box(.28,.28,.28,EGG_COLORS[index],0,1.7,0,root);beacon.rotation.z=Math.PI/4;
   const halo=new THREE.Mesh(new THREE.BoxGeometry(1.65,.045,1.65),new THREE.MeshBasicMaterial({color:EGG_COLORS[index],transparent:true,opacity:.3}));
   halo.position.y=.035;root.add(halo);
   const target=new THREE.Mesh(new THREE.BoxGeometry(2.3,2.7,2.3),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
   target.position.y=1;target.userData.eggIndex=index;root.add(target);targets.push(target);
   return {root,egg,beacon,halo,p};
  });
  const playerModel=data=>{const model=createPlayerAvatar({color:0x188bd0,outfit:data.outfit,avatar:data.avatar,gender:data.gender,picture:data.picture});model.scale.multiplyScalar(1.18);model.add(createNameLabel(data.playerName));return model};
  let explorer=playerModel(latest.current);scene.add(explorer);
  let explorerOutfit=JSON.stringify([latest.current.outfit,latest.current.avatar,latest.current.gender,latest.current.picture,latest.current.playerName]);
  const guide=createExplorer({outfit:'Guide'});guide.position.set(SAFE.x+2.5,0,SAFE.z-2.5);guide.add(createNameLabel('Bhell · Guide'));scene.add(guide);
  const marker=box(.85,.035,.85,0xf5fbff,0,.04,0);marker.castShadow=false;
  const guardianNode=createGuardian();guardianNode.scale.setScalar(1.15);scene.add(guardianNode);
  const remotes=new Map(),remoteColors=[0x9369ef,0xf2ab39,0xe97cad];
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null;
  const intersect=event=>{
   const bounds=renderer.domElement.getBoundingClientRect();
   if(!bounds.width||!bounds.height)return null;
   pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);
   return raycaster.intersectObjects(targets.filter(target=>!latest.current.run.collected.includes(target.userData.eggIndex)),false)[0]?.object;
  };
  const down=event=>{pointerStart={x:event.clientX,y:event.clientY}};
  const up=event=>{
   if(cameraRig.didDrag()||!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>10)return;
   pointerStart=null;const target=intersect(event);if(target)latest.current.onEgg?.(target.userData.eggIndex);
  };
  const hover=event=>{if(event.pointerType!=='touch')renderer.domElement.style.cursor=intersect(event)?'pointer':'default'};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointermove',hover);
  camera.fov=48;camera.near=.1;camera.far=180;
  const initial=worldPoint(latest.current.position);camera.position.set(initial.x,12,initial.z+16);camera.lookAt(initial.x,.5,initial.z-2);camera.updateProjectionMatrix();
  let aspect=1,lastMode='follow';const desired=new THREE.Vector3(),look=new THREE.Vector3();
  return {
   resize(width,height){aspect=width/Math.max(height,1)},
   update(delta,time){
    cameraRig.update(delta);
    const data=latest.current,p=worldPoint(data.position),g=worldPoint(data.guardian),animated=data.motion;
    const identity=JSON.stringify([data.outfit,data.avatar,data.gender,data.picture,data.playerName]);if(identity!==explorerOutfit){scene.remove(explorer);disposeObject(explorer);explorer=playerModel(data);scene.add(explorer);explorerOutfit=identity}animateExplorer(guide,{talking:animated,facing:'down',time:animated?time:0,delta});
    explorer.position.set(p.x,cameraRig.height(),p.z);explorer.visible=data.cameraMode!=='first';animateExplorer(explorer,{walking:data.walking&&animated,facing:data.facing,talking:false,time:animated?time:0,delta});
    marker.position.set(p.x,.045,p.z);marker.rotation.y=Math.PI/4;
    guardianNode.position.set(g.x,data.run.chasing&&animated?Math.abs(Math.sin(time*7))*.12:0,g.z);
    const chased=data.run.chaseActor===data.actor?data.position:data.remotePlayers.find(player=>player.id===data.run.chaseActor)||data.position;
    const target=worldPoint(chased);guardianNode.rotation.y=data.run.chasing?Math.atan2(target.x-g.x,target.z-g.z):-.4;
    eggNodes.forEach((node,index)=>{
     node.root.visible=!data.run.collected.includes(index);
     const near=Math.hypot(data.position.x-EGG_SPOTS[index].x,data.position.y-EGG_SPOTS[index].y)<15;
     node.egg.position.y=.18+(animated?Math.sin(time*2.5+index)*.06:0);
     node.beacon.position.y=1.7+(animated?Math.sin(time*3+index)*.1:0);
     node.beacon.rotation.y=animated?time*.8:0;
     node.halo.material.opacity=near?.5:.2;node.halo.scale.setScalar(near?1.15:1);
    });
    const present=new Set(data.remotePlayers.map(player=>player.id));
    for(const [id,model]of remotes)if(!present.has(id)){scene.remove(model);disposeObject(model);remotes.delete(id)}
    data.remotePlayers.forEach((player,index)=>{
     let model=remotes.get(player.id);
     const identity=JSON.stringify([player.outfit,player.avatar,player.gender,player.picture,player.name]);if(!model||model.userData.identity!==identity){
      if(model){scene.remove(model);disposeObject(model)}
      model=createPlayerAvatar({color:remoteColors[index%remoteColors.length],outfit:player.outfit||'Explorer',avatar:player.avatar,gender:player.gender,picture:player.picture});model.add(createNameLabel(player.name));model.userData.identity=identity;
      model.userData.outfit=player.outfit;model.scale.multiplyScalar(1.18);remotes.set(player.id,model);scene.add(model);
      const start=worldPoint(player);model.position.set(start.x,0,start.z);
     }
     const remote=worldPoint(player);model.position.x+=(remote.x-model.position.x)*Math.min(1,delta*15);model.position.z+=(remote.z-model.position.z)*Math.min(1,delta*15);
     animateExplorer(model,{walking:player.walking&&animated,facing:player.facing||'right',talking:false,time:animated?time:0,delta});
    });
    if(data.cameraMode==='overview'){
     const scale=Math.max(1,1/aspect);desired.set(2,30*scale,26*scale);look.set(0,0,0);
     }else if(data.cameraMode==='first'){desired.set(p.x,2.6,p.z);look.set(p.x-Math.sin(cameraRig.yaw)*10,2.6-cameraRig.pitch*8,p.z-Math.cos(cameraRig.yaw)*10)}
    else{desired.set(p.x+Math.sin(cameraRig.yaw)*8,5.2+cameraRig.pitch*3,p.z+Math.cos(cameraRig.yaw)*8);look.set(p.x,1.5,p.z)}
    data.onCameraHeading?.(data.cameraMode==='first'?cameraRig.yaw:0);
    cameraRig.apply(camera,desired,look,delta,data.cameraMode);
   },
   dispose(){cameraRig.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointermove',hover)}
  };
 },[]);
 return <section className={'hunt-world world3d-shell adventure-world3d'+(run.chasing?' chasing':'')} data-camera={cameraMode} data-gender={gender} data-avatar-id={picture} aria-label={t("Explorable 3D island map")}>
  <ThreeViewport buildScene={buildScene} className="world3d-canvas" label={t("Blocky SciBlox discovery island")}><div className="world3d-fallback-content"><p>{t("3D graphics are unavailable on this device. The island controls and activities still work.")}</p><div className="world3d-fallback-map"><span style={{left:'12%',top:'82%'}}>{t("Camp")}</span>{t(EGG_SPOTS.map((spot,index)=><span key={index} style={{left:spot.x+'%',top:spot.y+'%'}}>{t(RARITIES[index])}</span>))}<b style={{left:position.x+'%',top:position.y+'%'}}>{t("Bhell")}</b></div></div></ThreeViewport>
  <div className="world3d-scene-hud"><span className="world3d-place">{t("DISCOVERY ISLAND ")}<small>{t("Walk. Investigate. Collect.")}</small></span><CameraControls mode={cameraMode} onChange={setCameraMode}/></div>
  <TalkButton onTalk={onTalk}/><JumpButton onJump={triggerJump}/>
  <div className="world3d-eggbar">{t(EGG_SPOTS.map((spot,index)=>{
   const collected=run.collected.includes(index),near=Math.hypot(position.x-spot.x,position.y-spot.y)<15;
   return <button type="button" key={index} className={'world3d-egg-control egg-color-'+index+(near?' nearby':'')} aria-label={t('Open '+RARITIES[index]+' egg')} disabled={collected} onClick={()=>onEgg(index)}><span className="voxel-egg-icon"/><span><b>{t(RARITIES[index])}{t(" egg")}</b><small>{t(collected?'Collected':near?'Tap to investigate':'Explore to find me')}</small></span></button>;
  }))}</div>
  <div className="world3d-probes"><span role="img" className="world-player" aria-label={t("Your explorer")} style={{left:position.x+'%',top:position.y+'%'}}><span data-animation={walking?'walk':'idle'}/></span><span className="world-guardian" aria-label={t("Island guardian")} style={{left:guardian.x+'%',top:guardian.y+'%'}}/>{t(remotePlayers.map(player=><span className="world-player remote" key={player.id} style={{left:(player.x??12)+'%',top:(player.y??82)+'%'}}><span data-animation={player.walking?'walk':'idle'}/><small>{t(player.name)}</small></span>))}</div>
 </section>;
}

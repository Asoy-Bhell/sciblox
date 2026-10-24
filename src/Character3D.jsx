// localized-ui
import {t} from './i18n';
import React,{useCallback,useRef} from 'react';
import * as THREE from 'three';
import ThreeViewport from './ThreeViewport';
import {createPlayerAvatar,animateExplorer,createPet,animatePet,createEgg,disposeObject} from './three-models';

function portraitScene({scene,camera,cameraPerspective,renderer,element},model,{floor=true,padding=1.12}={}) {
  const viewCamera=camera||cameraPerspective;
  const stage=new THREE.Group();stage.name='Portrait stage';stage.add(model);scene.add(stage);
  const ambient=new THREE.HemisphereLight('#f3fbff','#7f9d94',2.1);
  const key=new THREE.DirectionalLight('#fff4db',2.6);key.position.set(-3,5,6);
  const rim=new THREE.DirectionalLight('#a3dffc',1.5);rim.position.set(4,3,-3);
  scene.add(ambient,key,rim);
  renderer.shadowMap.enabled=false;
  if(floor) {
    const geometry=new THREE.CircleGeometry(.48,24),material=new THREE.MeshBasicMaterial({color:'#315a68',transparent:true,opacity:.11,depthWrite:false});
    const shadow=new THREE.Mesh(geometry,material);shadow.name='Soft portrait grounding';shadow.rotation.x=-Math.PI/2;shadow.scale.y=.72;shadow.position.y=-.005;stage.add(shadow);
  }
  const bounds=new THREE.Box3().setFromObject(stage),dimensions=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const resize=(width,height)=>{
    const aspect=Math.max(.2,width/Math.max(1,height));
    viewCamera.aspect=aspect;viewCamera.fov=34;viewCamera.near=.05;viewCamera.far=40;
    const halfFov=THREE.MathUtils.degToRad(viewCamera.fov/2);
    const distance=Math.max(dimensions.y/(2*Math.tan(halfFov)),dimensions.x/(2*Math.tan(halfFov)*aspect))*padding;
    viewCamera.position.set(center.x,center.y+.065,distance+dimensions.z*.45);
    viewCamera.lookAt(center.x,center.y,center.z);viewCamera.updateProjectionMatrix();
  };
  const rect=element.getBoundingClientRect();resize(rect.width||88,rect.height||88);
  return {stage,resize,dispose:()=>{disposeObject(stage);scene.remove(stage,ambient,key,rim);}};
}

// Animation props live in refs, so walking and speaking never recreate WebGL.
export function Character3D({state='idle',size=88,facing='right',className='',label='Bhell the science explorer',outfit='Explorer',avatar='Human',gender='girl',picture,motion=true,children}) {
  const latest=useRef({state,facing,motion});latest.current={state,facing,motion};
  const buildScene=useCallback(context=>{
    const model=createPlayerAvatar({outfit,avatar,gender,picture}),portrait=portraitScene(context,model);
    const update=(delta,elapsed)=>{
      const current=latest.current,time=current.motion?elapsed:0;
      animateExplorer(model,{walking:current.state==='walk',talking:current.state==='talk',facing:current.facing,time,delta:current.motion?delta:0});
      // Portraits show a three-quarter face while world models use cardinal yaw.
      portrait.stage.rotation.y=current.facing==='right'?-1.18:current.facing==='left'?1.18:0;
      if(current.state==='celebrate'&&model.userData.kind!=='pet') {
        const rig=model.userData.rig;
        rig.leftArm.rotation.z=-2.25;rig.rightArm.rotation.z=2.25;
        rig.body.position.y=current.motion?Math.abs(Math.sin(time*5))*.12:0;
      }
    };
    update(0,0);return {...portrait,update};
  },[outfit,avatar,gender,picture]);
  return <span className={'mia-character character-3d mia-'+state+' '+className} role="img" aria-label={t(label)} data-animation={state} data-renderer="three" style={{width:size,height:size,display:'inline-block',position:'relative',flexShrink:0,verticalAlign:'middle'}}><ThreeViewport className="character-3d-viewport" label={t(label+' in 3D')} buildScene={buildScene}>{t(children||<span className="character-3d-fallback" aria-hidden="true">{t("🧑🏽‍🔬")}</span>)}</ThreeViewport></span>;
}

export function Pet3D({species='Parrot',size=76,happy=false,className='',label=species,motion=true,children}) {
  const latest=useRef({happy,motion});latest.current={happy,motion};
  const buildScene=useCallback(context=>{
    const model=createPet(species);model.rotation.y=.28;
    const portrait=portraitScene(context,model,{padding:1.1});
    const update=(delta,elapsed)=>{
      const current=latest.current,time=current.motion?elapsed:0;
      animatePet(model,{time,happy:current.happy});
      model.rotation.y=.28+(current.motion?Math.sin(time*.8)*.09:0);
    };
    update(0,0);return {...portrait,update};
  },[species]);
  return <span className={'pet-3d '+className} role="img" aria-label={t(label)} data-renderer="three" data-animation={happy?'happy':'idle'} style={{width:size,height:size,display:'inline-block',position:'relative',flexShrink:0,verticalAlign:'middle'}}><ThreeViewport className="pet-3d-viewport" label={t(label+' in 3D')} buildScene={buildScene}>{t(children||<span aria-hidden="true">{t("✦")}</span>)}</ThreeViewport></span>;
}

export function Egg3D({rarity=0,size=110,className='',motion=true,children}) {
  const latest=useRef({motion});latest.current={motion};
  const buildScene=useCallback(context=>{
    const model=createEgg(rarity);model.rotation.y=.25;
    const portrait=portraitScene(context,model,{floor:false,padding:1.1});
    const update=(delta,elapsed)=>{
      const time=latest.current.motion?elapsed:0;
      model.rotation.y=.25+Math.sin(time*.8)*.14;
      model.userData.rig.shell.rotation.z=latest.current.motion?Math.sin(time*2.6)*.045:0;
      model.userData.rig.shell.position.y=(Math.sin(time*2.2)+1)*(latest.current.motion?.018:0);
    };
    update(0,0);return {...portrait,update};
  },[rarity]);
  return <span className={'egg-3d '+className} role="img" aria-label={t("Companion egg in 3D")} data-renderer="three" style={{width:size,height:size,display:'inline-block',position:'relative',flexShrink:0,verticalAlign:'middle'}}><ThreeViewport className="egg-3d-viewport" label={t("Voxel companion egg")} buildScene={buildScene}>{t(children||<span aria-hidden="true">{t("🥚")}</span>)}</ThreeViewport></span>;
}

export default Character3D;

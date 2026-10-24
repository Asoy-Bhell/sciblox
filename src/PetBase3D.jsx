// localized-ui
import {t} from './i18n';
import React,{useCallback,useRef,useState} from 'react';
import * as THREE from 'three';
import ThreeViewport from './ThreeViewport';
import {createPet,animatePet,createTree} from './three-models';

export default function PetBase3D({pets,base='Meadow',motion=true}){
 const current=useRef({pets,motion}),[greeting,setGreeting]=useState('');current.current={pets,motion};
 const buildScene=useCallback(({scene,camera,renderer,element})=>{
  const colors=base==='Night'?{sky:0x142a63,ground:0x39666b}:base==='Sunset'?{sky:0xffd7b4,ground:0x92b658}:{sky:0xb7e4fa,ground:0x93c957};
  scene.background=new THREE.Color(colors.sky);scene.add(new THREE.HemisphereLight(0xffffff,0x365778,2.5));const light=new THREE.DirectionalLight(0xfff4d7,2.5);light.position.set(-7,12,8);scene.add(light);
  const box=(width,height,depth,color,x,y,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),new THREE.MeshLambertMaterial({color}));mesh.position.set(x,y,z);scene.add(mesh);return mesh};
  box(14,.9,10,0x956b44,0,-.6,0);box(14,.35,10,colors.ground,0,0,0);box(2,.05,9,0xeed494,0,.2,0);
  for(const x of [-4,4]){box(2.5,2,2.1,0xf3cba4,x,1.2,-2.5);box(3,.4,2.8,0x3273ba,x,2.4,-2.5);box(1,1.5,.07,0x204775,x,1,-1.4);box(.55,.6,.1,0x9ae4f3,x+.8,1.5,-1.4)}
  for(const [x,z]of [[-6,3],[6,2],[-5,-4],[5,-4]]){const tree=createTree(0);tree.position.set(x,.15,z);tree.scale.setScalar(.9);scene.add(tree)}
  const animals=[],raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  current.current.pets.slice(0,12).forEach((pet,index)=>{const model=createPet(pet.species);model.position.set((index%4-1.5)*2.4,.2,Math.floor(index/4)*2-1.5);model.scale.setScalar(.85);model.userData.pet=pet;animals.push(model);scene.add(model)});
  let happy=null,until=0;
  const click=event=>{const bounds=element.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(animals,true)[0];if(!hit)return;let object=hit.object;while(object&&!object.userData.pet)object=object.parent;if(object){happy=object;until=performance.now()+1200;setGreeting(object.userData.pet.species+' is happy to see you!')}};
  element.addEventListener('pointerup',click);
  const target=new THREE.Vector3(0,.4,0);camera.position.set(10,10,15);camera.lookAt(target);
  return {resize(width,height){camera.position.set(width<height?9:10,width<height?13:10,width<height?20:15);camera.lookAt(target)},update(dt,time){animals.forEach((pet,index)=>animatePet(pet,{time:current.current.motion?time+index:0,happy:pet===happy&&performance.now()<until}))},dispose(){element.removeEventListener('pointerup',click)}};
 },[base,pets.map(p=>p.id+':'+p.species).join(',')]);
 return <div className="pet-base-3d"><ThreeViewport buildScene={buildScene} label={t("Your 3D pet home")}><p>{t(pets.length?'Your companions are resting at home.':'Hatch your first friend to bring your base to life.')}</p></ThreeViewport><div className="pet-home-caption"><b>{t("My Base · ")}{t(base)}</b><span role="status">{t(greeting||(pets.length?'Tap a companion to say hello.':'Your first companion is waiting to hatch.'))}</span></div></div>
}

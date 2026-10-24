import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
 createExplorer,animateExplorer,createEgg,createGuardian,createTree,
 createPet,animatePet,disposeObject,
} from '../src/three-models.js';

function resources(object){
 const geometries=new Set(),materials=new Set();
 object.traverse(child=>{
  if(child.geometry)geometries.add(child.geometry);
  for(const material of [].concat(child.material||[]))materials.add(material);
 });
 return {geometries,materials};
}

test('procedural explorers, eggs, guardians, trees and pets have finite visible geometry',()=>{
 const models=[createExplorer(),createEgg(0),createEgg(2),createGuardian(),createTree(0),createTree(1),
  ...['Turtle','Parrot','Owl','Lizard','Butterfly'].map(createPet)];
 for(const model of models){
  assert.ok(model.isObject3D,'model can be placed in a Three.js scene');
  const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
  assert.ok([size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>0),'visible bounds on all axes');
  assert.ok(resources(model).geometries.size>0,'contains rendered geometry');
  for(const geometry of resources(model).geometries){
   const attribute=geometry.getAttribute('position');
   assert.ok(attribute?.count>0,'renderable vertex positions');
   assert.ok([...attribute.array].every(Number.isFinite),'no invalid vertices reach WebGL');
  }
  disposeObject(model);
 }
});

test('explorer rig animates walking limbs and talking mouth then returns to idle',()=>{
 const explorer=createExplorer(),rig=explorer.userData.rig;
 assert.ok(rig?.leftLeg&&rig.rightLeg&&rig.mouth,'explorer exposes the animated rig');
 animateExplorer(explorer,{walking:false,time:.3,delta:1});
 const idle=rig.leftLeg.rotation.x;
 animateExplorer(explorer,{walking:true,time:.3,delta:1});
 const first=rig.leftLeg.rotation.x;
 animateExplorer(explorer,{walking:true,time:.6,delta:1});
 assert.notEqual(rig.leftLeg.rotation.x,first,'walk cycle changes over time');
 assert.ok(Math.abs(first-idle)>.01,'walking visibly differs from idle');
 animateExplorer(explorer,{walking:false,time:.6,delta:1});
 assert.ok(Math.abs(rig.leftLeg.rotation.x)<=Math.abs(first)+.01,'idle settles the gait');
 animateExplorer(explorer,{talking:false,time:.3,delta:1});
 const quiet=rig.mouth.scale.clone();
 animateExplorer(explorer,{talking:true,time:.3,delta:1});
 assert.notDeepEqual(rig.mouth.scale.toArray(),quiet.toArray(),'speech changes the mouth pose');
 disposeObject(explorer);
});

test('egg meshes support actual ray picking and animated pets remain finite',()=>{
 const egg=createEgg(1);egg.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(egg),center=box.getCenter(new THREE.Vector3());
 const raycaster=new THREE.Raycaster(new THREE.Vector3(center.x,box.max.y+3,center.z),new THREE.Vector3(0,-1,0));
 assert.ok(raycaster.intersectObject(egg,true).length>0,'an egg can be picked through rendered geometry');
 for(const species of ['Turtle','Parrot','Owl']){
  const pet=createPet(species);
  for(const time of [0,.25,1,5])animatePet(pet,{time,happy:true});
  pet.updateMatrixWorld(true);
  assert.ok(pet.matrixWorld.elements.every(Number.isFinite),'pet animation preserves a finite transform');
  disposeObject(pet);
 }
 disposeObject(egg);
});

test('scene disposal releases resources without destroying another explorer',()=>{
 const first=createExplorer(),second=createExplorer();
 const owned=resources(first),separate=resources(second),disposed=new Set();
 for(const resource of [...owned.geometries,...owned.materials])resource.addEventListener('dispose',()=>disposed.add(resource));
 let affected=0;
 for(const resource of [...separate.geometries,...separate.materials])resource.addEventListener('dispose',()=>affected++);
 disposeObject(first);
 for(const resource of [...owned.geometries,...owned.materials])assert.ok(disposed.has(resource),'released scene resource');
 assert.equal(affected,0,'other active scene retains independent resources');
 disposeObject(second);
});


test('Male and Female selections create corresponding human characters',()=>{
 const male=createExplorer({gender:'male'}),female=createExplorer({gender:'female'});
 assert.equal(male.userData.rig.ponytail.visible,false);
 assert.equal(female.userData.rig.ponytail.visible,true);
 animateExplorer(male,{walking:true,time:.7,delta:.1});animateExplorer(female,{walking:true,time:.7,delta:.1});
 assert.ok(male.userData.rig.leftLeg.rotation.x!==0);assert.ok(female.userData.rig.leftLeg.rotation.x!==0);
 disposeObject(male);disposeObject(female);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWorldCameraRig} from '../src/WorldCameraRig.js';
test('follow camera keeps a fixed viewing direction when the explorer translates',()=>{
 const previous=globalThis.window;globalThis.window=new EventTarget();
 const rig=createWorldCameraRig(new EventTarget()),camera=new THREE.PerspectiveCamera();
 try{
  rig.apply(camera,new THREE.Vector3(0,5,8),new THREE.Vector3(0,1.5,0),1/60,'follow');
  const before=camera.getWorldDirection(new THREE.Vector3());
  for(let i=0;i<30;i++)rig.apply(camera,new THREE.Vector3(4,5,8),new THREE.Vector3(4,1.5,0),1/60,'follow');
  const after=camera.getWorldDirection(new THREE.Vector3());
  assert.ok(before.distanceTo(after)<1e-8,'aim and position must follow together without camera sway');
  const position=camera.position.clone();for(let i=0;i<10;i++)rig.apply(camera,position,new THREE.Vector3(position.x,1.5,0),1/60,'follow');
  assert.equal(camera.position.y,5,'idle camera height remains fixed');
 }finally{rig.dispose();globalThis.window=previous}
});
test('small touch noise does not rotate the camera; intentional drags are smoothed',()=>{
 const previous=globalThis.window;globalThis.window=new EventTarget();const canvas=new EventTarget(),rig=createWorldCameraRig(canvas);
 const event=(name,x,y)=>{const e=new Event(name);Object.assign(e,{pointerId:1,clientX:x,clientY:y});canvas.dispatchEvent(e)};
 try{
  event('pointerdown',100,100);event('pointermove',103,101);rig.update(.1);assert.equal(rig.yaw,0);assert.equal(rig.pitch,0);
  event('pointermove',140,100);rig.update(1/60);assert.ok(rig.yaw<0&&rig.yaw>-.16);
 }finally{rig.dispose();globalThis.window=previous}
});

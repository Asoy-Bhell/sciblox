import React,{useEffect,useState} from 'react';
import * as THREE from 'three';
import {avatarAppearance} from './avatar-options';
import {createPlayerAvatar,disposeObject} from './three-models';
const cache=new Map();let renderer;
function portrait(picture){
 if(cache.has(picture))return cache.get(picture);
 const look=avatarAppearance(picture,'unspecified');
 renderer??=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setSize(240,240);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,20);
 scene.background=new THREE.Color('#d9f1ff');scene.add(new THREE.HemisphereLight('#f7fcff','#6f8aa3',2.6));
 const light=new THREE.DirectionalLight('#fff1dd',3);light.position.set(-2,5,5);scene.add(light);
 const model=createPlayerAvatar({gender:look.gender,picture:look.id});scene.add(model);
 camera.position.set(.30,2.42,3.7);camera.lookAt(0,2.14,0);renderer.render(scene,camera);
 const url=renderer.domElement.toDataURL('image/png');cache.set(picture,url);disposeObject(model);scene.clear();return url;
}
// Cached snapshots of the actual world rig, using one shared graphics context.
export default function AvatarPortrait({id='nova',className=''}){
 const look=avatarAppearance(id,'unspecified'),[url,setUrl]=useState(()=>cache.get(look.id));
 useEffect(()=>{let cancelled=false;const task=setTimeout(()=>{try{const result=portrait(look.id);if(!cancelled)setUrl(result)}catch{if(!cancelled)setUrl(null)}},0);return()=>{cancelled=true;clearTimeout(task)}},[look.id]);
 return <span className={'profile-portrait portrait-art '+className} role="img" aria-label="Human avatar portrait" data-avatar-id={look.id} data-gender={look.gender} style={{backgroundImage:url?`url('${url}')`:'none',backgroundColor:'#d9f1ff',backgroundSize:'cover',backgroundPosition:'center'}}>{!url&&<span aria-hidden="true">{look.gender==='male'?'👨':'👩'}</span>}</span>;
}

import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export function decoratePortal(portal,{open=true}={}){
 const gold=new THREE.MeshStandardMaterial({color:open?'#edbd54':'#91a7bc',roughness:.40,metalness:.24});
 const pale=new THREE.MeshStandardMaterial({color:open?'#fff0ba':'#c1cfda',roughness:.60});
 // Arched frames replace the straight beam construction.
 const curve=new THREE.EllipseCurve(0,0,1.45,1.45,0,Math.PI,false,0);
 const points=curve.getPoints(24).map(p=>new THREE.Vector3(p.x,p.y+2.02,0));
 const frame=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.27,8,false),gold);portal.add(frame);
 for(const side of [-1,1]){const pillar=new THREE.Mesh(new RoundedBoxGeometry(.54,2.05,.66,2,.08),gold);pillar.position.set(side*1.45,1.04,0);portal.add(pillar);const foot=new THREE.Mesh(new RoundedBoxGeometry(.90,.28,.90,2,.06),pale);foot.position.set(side*1.45,.17,0);portal.add(foot)}
 const glow=new THREE.MeshBasicMaterial({color:open?'#81f5ff':'#92a7c4',transparent:true,opacity:open?.70:.20});
 const oval=new THREE.Mesh(new THREE.CircleGeometry(1,48),glow);oval.scale.set(1.17,1.55,1);oval.position.set(0,1.72,.10);portal.add(oval);
 for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05-i*.19,.018,4,40),glow);ring.scale.y=1.34;ring.position.set(0,1.72,.14+i*.02);ring.rotation.z=i*.5;portal.add(ring)}
}

export function enrichWorld(scene,{island=false}={}){
 const mats=new Map(),geo=new Map();
 const mat=color=>{if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.82}));return mats.get(color)};
 const rounded=(size,color,x,y,z)=>{const key=size.join(',');if(!geo.has(key))geo.set(key,new RoundedBoxGeometry(...size,1,.12));const m=new THREE.Mesh(geo.get(key),mat(color));m.position.set(x,y,z);scene.add(m);return m};
 const sphere=new THREE.IcosahedronGeometry(1,1);
 const crown=(x,y,z,size,color)=>{const m=new THREE.Mesh(sphere,mat(color));m.position.set(x,y,z);m.scale.set(size,size*.75,size);scene.add(m)};
 // Layered islands, foliage and waterfalls frame the traversable ground.
 for(let i=0;i<16;i++){
  const a=i/16*Math.PI*2,x=Math.cos(a)*25,z=Math.sin(a)*25,height=3+(i%4)*1.6;
  for(let tier=0;tier<3;tier++){rounded([6-tier*.8,2.4,6-tier*.7],tier%2?'#b8ac86':'#9e957a',x,tier*1.9-.3,z);rounded([6.1-tier*.8,.32,6.1-tier*.7],'#5ba55d',x,tier*1.9+1,z)}
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.20,.34,height,7),mat('#7b5739'));trunk.position.set(x,height/2+4,z);scene.add(trunk);
  for(let n=0;n<4;n++)crown(x+Math.sin(n*2)*1.0,height+4+Math.cos(n)*.4,z+Math.cos(n*2)*.7,1.65,['#347f4b','#4a9e51','#67b65c','#70ba62'][n]);
  if(i%4===0){const water=new THREE.Mesh(new THREE.PlaneGeometry(1.4,8),new THREE.MeshBasicMaterial({color:'#6ddff5',transparent:true,opacity:.78,side:THREE.DoubleSide}));water.position.set(x,1.8,z+3);scene.add(water);for(let j=0;j<3;j++)rounded([.08,7.9,.05],'#b5f8ff',x-.48+j*.42,1.8,z+3.02)}
 }
 // A domed blue research sanctuary in the distance.
 if(!island)for(const x of [-7,0,7]){
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(x===0?2.7:1.4,x===0?2.9:1.6,x===0?7:9,12),mat('#d8e9ee'));tower.position.set(x,x===0?3.5:4.5,-25);scene.add(tower);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(x===0?2.9:1.6,20,12,0,Math.PI*2,0,Math.PI/2),mat('#2999c9'));dome.position.set(x,x===0?7:9,-25);scene.add(dome);
  for(let side=0;side<6;side++){const a=side/6*Math.PI*2;rounded([.40,3,.13],'#3fa8d2',x+Math.sin(a)*(x===0?2.74:1.43),x===0?4.3:5.4,-25+Math.cos(a)*(x===0?2.74:1.43))}
 }
 // Ground-level plant clusters and rounded boulders, kept clear of portals.
 for(let i=0;i<34;i++){const a=i*2.399,x=Math.cos(a)*(16+i%3),z=Math.sin(a)*(16+i%3);crown(x,.30,z,.52,'#4a9c59');if(i%3===0)rounded([.65,.50,.60],'#a9b5a9',x+.65,.2,z);if(i%4===0)crown(x,.7,z,.18,'#f3bc5c')}
 const cloudGeo=new THREE.SphereGeometry(1,10,8),cloudMat=new THREE.MeshBasicMaterial({color:'#f8fcff'});
 for(let i=0;i<9;i++)for(let j=0;j<3;j++){const m=new THREE.Mesh(cloudGeo,cloudMat);m.scale.set(3.5,1.2,2.0);m.position.set(-36+i*10+j*2,19+i%3,-40-(i%2)*12);scene.add(m)}
}

import * as THREE from 'three';
import {avatarAppearance} from './avatar-options.js';

// Original cuboid explorers. Portraits and world avatars use this same rig.
export function createBlockExplorer({picture,gender='female',outfit='Explorer',color}={}){
 const look=avatarAppearance(picture,gender),root=new THREE.Group(),geometry=new THREE.BoxGeometry(1,1,1),materials=new Map();
 const navy='#203551',shirt=color||look.color,white='#eff6ff';
 const box=(p,s,c,x=0,y=0,z=0)=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.9}));const mesh=new THREE.Mesh(geometry,materials.get(c));mesh.scale.set(...s);mesh.position.set(x,y,z);mesh.castShadow=true;p.add(mesh);return mesh};
 const joint=(p,name,x=0,y=0,z=0)=>{const g=new THREE.Group();g.name=name;g.position.set(x,y,z);p.add(g);return g};
 const body=joint(root,'body');box(body,[.70,.78,.38],shirt,0,1.47);box(body,[.32,.65,.021],white,0,1.48,.202);
 for(const side of [-1,1]){box(body,[.055,.67,.035],'#173d73',side*.24,1.48,.21);box(body,[.14,.13,.025],'#80d9ef',side*.24,1.38,.23)}
 box(body,[.55,.62,.23],shirt,0,1.47,-.30);box(body,[.40,.25,.09],'#26518b',0,1.31,-.46);
 const leftArm=joint(body,'left-arm',-.49,1.81),rightArm=joint(body,'right-arm',.49,1.81);
 for(const arm of [leftArm,rightArm]){box(arm,[.25,.29,.34],white,0,-.13);box(arm,[.23,.46,.29],look.skin,0,-.50);box(arm,[.24,.16,.30],look.skin,0,-.76)}
 const leftLeg=joint(body,'left-leg',-.19,1.09),rightLeg=joint(body,'right-leg',.19,1.09);
 for(const leg of [leftLeg,rightLeg]){box(leg,[.31,.86,.34],navy,0,-.41);box(leg,[.33,.18,.46],white,0,-.98,.06);box(leg,[.34,.055,.47],'#5684af',0,-1.065,.06)}
 box(body,[.23,.15,.24],look.skin,0,1.92);
 const head=joint(body,'head',0,2.30);box(head,[.78,.76,.70],look.skin);box(head,[.80,.17,.73],look.hair,0,.32,-.005);box(head,[.80,.58,.11],look.hair,0,.03,-.36);
 // Flat pixel features stay on the face, without protruding eyes or cheeks.
 for(const side of [-1,1]){box(head,[.13,.10,.014],white,side*.175,.045,.357);box(head,[.055,.085,.015],'#293440',side*.16,.041,.368);box(head,[.15,.025,.015],look.hair,side*.175,.155,.357);box(head,[.07,.13,.12],look.skin,side*.42,-.025,-.015)}
 box(head,[.08,.07,.045],look.skin,0,-.065,.37);
 const mouth=box(head,[.14,.025,.013],'#8e5147',0,-.205,.358);box(head,[.08,.018,.014],white,0,-.194,.367);
 box(head,[.31,.13,.09],look.hair,-.20,.225,.355);box(head,[.13,.08,.08],look.hair,-.29,.135,.35);
 const ponytail=joint(head,'ponytail',0,.05,-.43);ponytail.visible=false;
 if(look.gender==='female'){
  for(const side of [-1,1])box(head,[.12,look.style==='long'?.94:.62,.48],look.hair,side*.385,look.style==='long'?-.20:-.10,-.10);
  if(look.style==='ponytail'){ponytail.visible=true;box(ponytail,[.23,.61,.23],look.hair,0,-.26,-.04);box(ponytail,[.25,.07,.25],'#68c9df',0,.02,-.04)}
 }
 if(look.style==='curly')for(let i=0;i<4;i++)box(head,[.20,.12+(i%2)*.06,.54],look.hair,-.29+i*.19,.44,0);
 if(look.glasses){for(const side of [-1,1]){for(const dy of [-.075,.075])box(head,[.25,.022,.022],navy,side*.175,.05+dy,.39);for(const dx of [-.115,.115])box(head,[.022,.16,.022],navy,side*.175+dx,.05,.39)}box(head,[.10,.02,.02],navy,0,.07,.39)}
 if(outfit==='Scarf'){box(body,[.73,.12,.44],'#f2a845',0,1.84);box(body,[.14,.29,.035],'#f2a845',-.19,1.65,.23)}
 if(outfit==='Shades')for(const side of [-1,1])box(head,[.27,.13,.025],navy,side*.175,.05,.40);
 if(outfit==='Top hat'){box(head,[.94,.065,.83],navy,0,.47);box(head,[.61,.34,.58],navy,0,.66)}
 if(outfit==='Crown'){box(head,[.85,.12,.76],'#efbc4d',0,.46);for(const x of [-.30,0,.30])box(head,[.12,.16,.10],'#ffda69',x,.58,.34)}
 root.name='Blocky human explorer';root.userData={kind:'explorer',outfit,gender,picture:look.id,style:'blocky',rig:{body,head,leftArm,rightArm,leftLeg,rightLeg,mouth,ponytail}};
 return root;
}

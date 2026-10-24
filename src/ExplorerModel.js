import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {avatarAppearance} from './avatar-options.js';

// Articulated, rounded adventure characters. Each model owns its resources.
export function createAdventureExplorer({color='#2465c9',outfit='Explorer',gender='female',picture}={}){
 const root=new THREE.Group();root.name=outfit==='Guide'?'Bhell':'Human explorer';
 const look=avatarAppearance(picture,gender),guide=outfit==='Guide',female=gender!=='male'&&gender!=='boy',skin=guide?'#e8ad7c':look.skin,hair=guide?'#29202b':look.hair,navy='#16335e',white='#f4f9ff';
 if(picture&&!guide)color=look.color;
 const materials=new Map(),geometries=new Map();
 const material=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.72}));return materials.get(c)};
 const shape=(parent,type,scale,c,x,y,z)=>{const key=type;if(!geometries.has(key))geometries.set(key,type==='ball'?new THREE.SphereGeometry(1,16,12):new RoundedBoxGeometry(1,1,1,2,.17));const m=new THREE.Mesh(geometries.get(key),material(c));m.scale.set(...scale);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m};
 const ball=(p,s,c,x=0,y=0,z=0)=>shape(p,'ball',s,c,x,y,z),box=(p,s,c,x=0,y=0,z=0)=>shape(p,'box',s,c,x,y,z);
 const joint=(p,name,x=0,y=0,z=0)=>{const g=new THREE.Group();g.name=name;g.position.set(x,y,z);p.add(g);return g};
 const body=joint(root,'body');
 box(body,[.66,.75,.40],white,0,1.49,0);box(body,[.70,.20,.42],navy,0,1.12,0);
 for(const side of [-1,1]){box(body,[.23,.72,.46],color,side*.25,1.52,-.005);box(body,[.15,.14,.04],'#67daf3',side*.24,1.50,.245)}
 box(body,[.08,.72,.025],'#e9b961',-.10,1.50,.24);
 const leftArm=joint(body,'left-arm',-.48,1.78,0),rightArm=joint(body,'right-arm',.48,1.78,0);
 for(const arm of [leftArm,rightArm]){ball(arm,[.16,.20,.18],white,0,-.09,0);box(arm,[.26,.32,.30],white,0,-.21,0);ball(arm,[.12,.27,.13],skin,0,-.48,.015);ball(arm,[.14,.16,.13],skin,0,-.71,.02)}
 const leftLeg=joint(body,'left-leg',-.19,1.10,0),rightLeg=joint(body,'right-leg',.19,1.10,0);
 for(const leg of [leftLeg,rightLeg]){box(leg,[.29,.46,.34],navy,0,-.20,0);ball(leg,[.125,.28,.14],skin,0,-.56,0);box(leg,[.31,.19,.43],white,0,-.91,.09);box(leg,[.32,.065,.44],'#b5d5ed',0,-1.015,.09);box(leg,[.19,.045,.22],color,0,-.83,.12)}
 // Visible backpack and straps, matching the reference's third-person silhouette.
 box(body,[.60,.66,.25],color,0,1.53,-.34);box(body,[.48,.35,.12],'#4089e9',0,1.38,-.50);box(body,[.22,.08,.04],'#9fefff',0,1.39,-.57);
 for(const side of [-1,1])box(body,[.09,.66,.08],'#347de0',side*.24,1.57,.24);
 const head=joint(body,'head',0,2.25,0);
 ball(head,[.48,.53,.42],skin,0,.06,0);ball(head,[.45,.42,.43],hair,0,.24,-.12);
 for(const side of [-1,1]){ball(head,[.08,.12,.07],skin,side*.47,.04,0);ball(head,[.115,.15,.055],white,side*.18,.07,.367);ball(head,[.073,.105,.035],'#342628',side*.18,.06,.410);ball(head,[.024,.034,.014],white,side*.18-.016,.10,.44);ball(head,[.085,.028,.025],hair,side*.18,.26,.36);ball(head,[.07,.027,.014],'#e58b84',side*.30,-.13,.35)}
 ball(head,[.065,.065,.075],'#d6986d',0,-.06,.40);
 const mouth=box(head,[.13,.028,.025],'#763f43',0,-.23,.37);ball(head,[.09,.022,.02],white,0,-.224,.388);
 const ponytail=joint(head,'ponytail',0,.07,-.42);ball(ponytail,[.22,.44,.20],hair,0,-.15,-.04);ball(ponytail,[.17,.27,.16],hair,0,-.54,-.06);ponytail.visible=female&&!guide;
 if(female||guide){for(const side of [-1,1])ball(head,[.15,guide?.33:.44,.32],hair,side*.40,-.13,-.10);ball(head,[.30,.15,.29],hair,-.19,.38,.12)}
 else for(let i=0;i<5;i++){const tuft=ball(head,[.18,.15,.20],hair,-.28+i*.14,.52+Math.sin(i)*.04,.02);tuft.rotation.z=-.3}
 if(guide){ball(head,[.50,.24,.45],white,0,.52,-.02);box(head,[.83,.065,.36],color,0,.44,.32);box(head,[.19,.17,.055],'#58e4fa',0,.58,.405)}
 if(!guide&&look.style==='curly')for(let i=0;i<10;i++){const angle=i/10*Math.PI*2;ball(head,[.15,.16,.14],hair,Math.cos(angle)*.35,.43+Math.sin(angle)*.03,Math.sin(angle)*.27)}
 if(!guide&&look.style==='long'){ponytail.visible=false;for(const side of [-1,1])ball(head,[.17,.55,.25],hair,side*.40,-.24,-.10)}
 if(!guide&&look.style==='curly')ponytail.visible=false;
 if(!guide&&look.glasses){for(const side of [-1,1]){const frame=new THREE.Mesh(new THREE.TorusGeometry(.14,.018,6,20),material('#173b65'));frame.position.set(side*.18,.07,.44);head.add(frame)}box(head,[.08,.025,.02],'#173b65',0,.09,.44)}
 if(outfit==='Shades')for(const side of [-1,1])box(head,[.27,.18,.055],navy,side*.18,.08,.43);
 if(outfit==='Scarf'){box(body,[.68,.12,.47],'#ffad4d',0,1.90,0);box(body,[.16,.34,.05],'#ffad4d',-.15,1.74,.27)}
 if(outfit==='Top hat'){box(head,[1,.07,.8],navy,0,.62,0);box(head,[.54,.39,.53],navy,0,.82,0)}
 if(outfit==='Crown'){box(head,[.75,.16,.63],'#ffd05e',0,.63,0);for(const x of [-.28,0,.28])box(head,[.12,.18,.10],'#ffe6a2',x,.78,.24)}
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.48,24),new THREE.MeshBasicMaterial({color:'#193646',transparent:true,opacity:.18,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;root.add(shadow);
 root.userData.kind='explorer';root.userData.outfit=outfit;root.userData.gender=gender;root.userData.picture=look.id;root.userData.rig={body,head,leftArm,rightArm,leftLeg,rightLeg,mouth,ponytail};return root;
}

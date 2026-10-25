import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {avatarAppearance} from './avatar-options.js';
import {createBlockExplorer} from './BlockExplorer.js';

// Articulated, rounded adventure characters. Each model owns its resources.
export function createAdventureExplorer({color='#2465c9',outfit='Explorer',gender='female',picture}={}){
 if(outfit!=='Guide')return createBlockExplorer({color,picture,gender,outfit});
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
 // Smaller, inset almond eyes and a tapered face replace the protruding eyes.
 const face=ball(head,[.46,.51,.40],skin,0,.06,0);
 const faceGeometry=face.geometry.clone(),positions=faceGeometry.attributes.position;
 for(let i=0;i<positions.count;i++){const y=positions.getY(i);if(y<0)positions.setX(i,positions.getX(i)*(1+y*.13))}
 faceGeometry.computeVertexNormals();face.geometry=faceGeometry;
 ball(head,[.455,.40,.415],hair,0,.25,-.13);
 for(const side of [-1,1]){
  ball(head,[.067,.10,.065],skin,side*.45,.025,0);
  const eye=ball(head,[.102,.071,.030],white,side*.18,.075,.365);eye.rotation.z=side*.10;
  ball(head,[.047,.061,.024],'#65412e',side*.18,.072,.393);
  ball(head,[.026,.044,.013],'#231e27',side*.18,.072,.412);
  ball(head,[.015,.018,.008],white,side*.18-.014,.096,.425);
  const brow=ball(head,[.088,.016,.014],hair,side*.18,.205,.365);brow.rotation.z=side*-.10;
  ball(head,[.055,.021,.009],'#df9687',side*.29,-.10,.306);
 }
 ball(head,[.041,.045,.045],skin,0,-.043,.395);
 // A curved smile, with a narrow tooth highlight, remains an animated rig mesh.
 const smile=new THREE.Shape();smile.moveTo(-.12,-.13);smile.quadraticCurveTo(0,-.19,.12,-.13);smile.quadraticCurveTo(.07,-.255,0,-.255);smile.quadraticCurveTo(-.08,-.25,-.12,-.13);
 const mouth=new THREE.Mesh(new THREE.ShapeGeometry(smile,16),material('#743e3b'));mouth.position.z=.366;head.add(mouth);
 const teeth=new THREE.Shape();teeth.moveTo(-.095,-.15);teeth.quadraticCurveTo(0,-.19,.095,-.15);teeth.lineTo(.075,-.18);teeth.quadraticCurveTo(0,-.212,-.075,-.18);teeth.closePath();
 const toothMesh=new THREE.Mesh(new THREE.ShapeGeometry(teeth,12),material(white));toothMesh.position.z=.368;head.add(toothMesh);
 const ponytail=joint(head,'ponytail',0,.07,-.42);ball(ponytail,[.22,.44,.20],hair,0,-.15,-.04);ball(ponytail,[.17,.27,.16],hair,0,-.54,-.06);ponytail.visible=female&&!guide;
 if(female||guide){for(const side of [-1,1])ball(head,[.15,guide?.33:.44,.32],hair,side*.40,-.13,-.10);ball(head,[.30,.15,.29],hair,-.19,.38,.12)}
 else for(let i=0;i<5;i++){const tuft=ball(head,[.18,.15,.20],hair,-.28+i*.14,.52+Math.sin(i)*.04,.02);tuft.rotation.z=-.3}
 if(guide){ball(head,[.50,.24,.45],white,0,.52,-.02);box(head,[.83,.065,.36],color,0,.44,.32);box(head,[.19,.17,.055],'#58e4fa',0,.58,.405)}
 if(!guide&&look.style==='curly')for(let i=0;i<10;i++){const angle=i/10*Math.PI*2;ball(head,[.15,.16,.14],hair,Math.cos(angle)*.35,.43+Math.sin(angle)*.03,Math.sin(angle)*.27)}
 if(!guide&&look.style==='long'){ponytail.visible=false;for(const side of [-1,1])ball(head,[.17,.55,.25],hair,side*.40,-.24,-.10)}
 if(!guide&&look.style==='curly')ponytail.visible=false;
 if(!guide&&look.glasses){for(const side of [-1,1]){const frame=new THREE.Mesh(new THREE.TorusGeometry(.115,.013,6,24),material('#173b65'));frame.scale.y=.83;frame.position.set(side*.18,.075,.435);head.add(frame)}box(head,[.10,.018,.02],'#173b65',0,.08,.435)}
 if(outfit==='Shades')for(const side of [-1,1])box(head,[.27,.18,.055],navy,side*.18,.08,.43);
 if(outfit==='Scarf'){box(body,[.68,.12,.47],'#ffad4d',0,1.90,0);box(body,[.16,.34,.05],'#ffad4d',-.15,1.74,.27)}
 if(outfit==='Top hat'){box(head,[1,.07,.8],navy,0,.62,0);box(head,[.54,.39,.53],navy,0,.82,0)}
 if(outfit==='Crown'){box(head,[.75,.16,.63],'#ffd05e',0,.63,0);for(const x of [-.28,0,.28])box(head,[.12,.18,.10],'#ffe6a2',x,.78,.24)}
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.48,24),new THREE.MeshBasicMaterial({color:'#193646',transparent:true,opacity:.18,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;root.add(shadow);
 root.userData.kind='explorer';root.userData.outfit=outfit;root.userData.gender=gender;root.userData.picture=look.id;root.userData.rig={body,head,leftArm,rightArm,leftLeg,rightLeg,mouth,ponytail};return root;
}

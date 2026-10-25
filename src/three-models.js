import {createAdventureExplorer} from './ExplorerModel.js';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Resources are reused inside one model, never across separately owned models.
// That keeps a departing multiplayer avatar safe to dispose independently.
function modelBuilder(name) {
  const root=new THREE.Group();root.name=name;
  const geometryCache=new Map(),materialCache=new Map();
  const box=(parent,w,h,d,color,x=0,y=0,z=0,options={})=>{
    const radius=Math.min(options.bevel??.025,w*.2,h*.2,d*.2);
    const geometryKey=[w,h,d,radius].join('|');
    if(!geometryCache.has(geometryKey))geometryCache.set(geometryKey,radius?new RoundedBoxGeometry(w,h,d,1,radius):new THREE.BoxGeometry(w,h,d));
    const materialKey=[color,options.emissive||0,options.intensity||0,options.metalness||0].join('|');
    if(!materialCache.has(materialKey))materialCache.set(materialKey,new THREE.MeshStandardMaterial({color,roughness:.8,metalness:options.metalness||0,emissive:options.emissive||0,emissiveIntensity:options.intensity||0}));
    const mesh=new THREE.Mesh(geometryCache.get(geometryKey),materialCache.get(materialKey));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;
    if(options.rotation)mesh.rotation.set(...options.rotation);
    if(options.name)mesh.name=options.name;
    parent.add(mesh);return mesh;
  };
  const joint=(parent,name,x=0,y=0,z=0)=>{const group=new THREE.Group();group.name=name;group.position.set(x,y,z);parent.add(group);return group;};
  return {root,box,joint};
}

export const createExplorer=createAdventureExplorer;

export function animateExplorer(group,{walking=false,facing='right',talking=false,time=0,delta=0}={}) {
  if(group?.userData?.kind==='pet'){
    animatePet(group,{time,happy:walking});
    group.rotation.y={right:Math.PI/2,left:-Math.PI/2,up:Math.PI,down:0}[facing]??0;
    return;
  }
  const rig=group?.userData?.rig;if(!rig)return;
  const yaw={right:Math.PI/2,left:-Math.PI/2,up:Math.PI,down:0}[facing]??0;
  const difference=Math.atan2(Math.sin(yaw-group.rotation.y),Math.cos(yaw-group.rotation.y));
  group.rotation.y+=difference*(delta>0?Math.min(1,delta*14):1);
  const stride=walking?Math.sin(time*9):0;
  const blocky=group.userData.style==='blocky';
  rig.body.position.y=blocky?0:walking?Math.abs(Math.sin(time*9))*.045:(Math.sin(time*2)+1)*.009;
  rig.body.rotation.z=blocky?0:walking?stride*.025:Math.sin(time*1.6)*.009;
  rig.leftLeg.rotation.x=stride*.62;rig.rightLeg.rotation.x=-stride*.62;
  rig.leftArm.rotation.x=-stride*.54+(talking?-.22-Math.sin(time*4)*.13:0);
  rig.rightArm.rotation.x=stride*.54+(talking?-.28+Math.sin(time*3.6)*.14:0);
  rig.leftArm.rotation.z=talking?-.18-Math.sin(time*2.7)*.08:-.025;
  rig.rightArm.rotation.z=talking?.26+Math.sin(time*3)*.10:.025;
  rig.head.rotation.x=blocky?0:talking?Math.sin(time*3.2)*.035:Math.sin(time*1.7)*.012;
  rig.head.rotation.y=blocky?0:talking?Math.sin(time*2)*.055:Math.sin(time*.9)*.02;
  rig.ponytail.rotation.x=walking?stride*.11:Math.sin(time*1.8)*.035;
  rig.mouth.scale.y=talking?1.25+Math.abs(Math.sin(time*9)) *2.5:1;
}

const EGG_COLORS=['#63d9b0','#62b8f4','#b78af0','#f5c65d','#ee86d0'];
export function createEgg(rarity=0) {
  const {root,box,joint}=modelBuilder('Voxel companion egg');
  const tone=EGG_COLORS[Math.max(0,Math.min(4,Number(rarity)||0))];
  const shell=joint(root,'egg-shell');
  const glow=box(root,.73,.065,.68,tone,0,.033,0,{bevel:.025,emissive:tone,intensity:.3});
  for(const [w,h,d,y]of [[.32,.14,.31,.14],[.49,.16,.46,.27],[.56,.19,.51,.44],[.44,.15,.42,.61],[.26,.13,.27,.75]]) {
    box(shell,w,h,d,'#fff7df',0,y,0,{bevel:.025});
  }
  for(const [x,y]of [[-.12,.36],[.09,.52],[-.045,.69]])box(shell,.10,.10,.035,tone,x,y,y>.63?.15:y>.46?.225:.27,{bevel:.015});
  box(shell,.15,.12,.035,tone,.13,.25,.235,{bevel:.018});
  root.userData.kind='egg';root.userData.rarity=rarity;root.userData.rig={shell,glow};
  return root;
}

export function createGuardian() {
  const {root,box,joint}=modelBuilder('Stone genetics guardian');
  const body=joint(root,'guardian-body'),stone='#758b83',light='#a8b9a5',dark='#3c5653',glow='#96f5cb';
  for(const side of [-1,1]) {
    box(body,.39,.35,.47,dark,side*.27,.175,.02,{bevel:.045});
    box(body,.31,.65,.32,stone,side*.27,.56,0,{bevel:.035});
  }
  box(body,.95,.84,.55,stone,0,1.17,0,{bevel:.055});
  box(body,.63,.12,.60,light,0,.79,0,{bevel:.02});
  box(body,.38,.38,.045,dark,0,1.23,.30,{bevel:.04});
  box(body,.11,.25,.035,glow,0,1.23,.33,{bevel:.01,emissive:glow,intensity:.35});
  box(body,.26,.07,.035,glow,0,1.23,.34,{bevel:.01,emissive:glow,intensity:.35});
  const head=joint(body,'guardian-head',0,1.92,0);
  box(head,.87,.68,.68,stone,0,0,0,{bevel:.065});
  box(head,.69,.36,.035,dark,0,-.015,.355,{bevel:.04});
  for(const side of [-1,1]) {
    box(head,.20,.11,.035,glow,side*.19,.035,.382,{bevel:.018,emissive:glow,intensity:.6});
    box(head,.32,.10,.12,light,side*.20,.16,.34,{rotation:[0,0,-side*.14],bevel:.015});
  }
  box(head,.14,.22,.15,light,0,-.035,.40,{bevel:.015});
  box(head,.31,.06,.045,light,0,-.23,.37,{bevel:.012});
  box(head,.95,.13,.74,light,0,.37,0,{bevel:.025});
  const leftArm=joint(body,'guardian-left-arm',-.65,1.49,0),rightArm=joint(body,'guardian-right-arm',.65,1.49,0);
  for(const [arm,side]of [[leftArm,-1],[rightArm,1]]) {
    box(arm,.31,.62,.39,stone,0,-.24,0,{bevel:.04});
    box(arm,.35,.23,.43,dark,0,-.65,.03,{bevel:.045});
    arm.rotation.z=side*.07;
  }
  root.userData.kind='guardian';root.userData.rig={body,head,leftArm,rightArm};return root;
}

export function createTree(kind=0) {
  const {root,box,joint}=modelBuilder('Blocky island tree');
  const leaves=joint(root,'foliage'),palm=kind===1||kind==='palm',pine=kind===2||kind==='pine';
  box(root,palm?.22:.30,palm?1.65:1.12,palm?.22:.30,'#93643b',0,palm?.825:.56,0,{bevel:.012});
  if(palm) {
    box(leaves,.40,.25,.40,'#4aa96c',0,1.72,0,{bevel:.02});
    for(let i=0;i<6;i++) {
      const angle=i*Math.PI/3;
      const leaf=box(leaves,.92,.14,.25,i%2?'#62bf75':'#338d61',Math.sin(angle)*.45,1.69,Math.cos(angle)*.45,{bevel:.018});
      leaf.rotation.y=angle+Math.PI/2;leaf.rotation.z=.14;
    }
  } else if(pine) {
    for(const [width,y]of [[1.25,1.07],[.96,1.42],[.66,1.73],[.32,2.0]])box(leaves,width,.38,width,'#378667',0,y,0,{bevel:.025});
  } else {
    box(leaves,1.22,.62,1.05,'#54ab6d',0,1.25,0,{bevel:.04});
    box(leaves,.91,.52,.84,'#70bf76',-.12,1.69,.03,{bevel:.04});
    box(leaves,.54,.47,.59,'#40955f',.50,1.39,-.02,{bevel:.035});
    box(leaves,.49,.39,.48,'#84ca7a',-.41,1.51,.31,{bevel:.025});
  }
  root.userData.kind='tree';root.userData.rig={leaves};return root;
}

export function createPet(species='Parrot') {
  const {root,box,joint}=modelBuilder('Companion '+species);
  const body=joint(root,'pet-body');
  const rig={body,wings:[],legs:[],tail:null,head:null};
  const name=String(species).toLowerCase(),ink='#263b45',ivory='#fff7de';
  const eyes=(parent,y,z,spacing=.11,size=.055)=>{
    for(const side of [-1,1])box(parent,size,size*1.2,.025,ink,side*spacing,y,z,{bevel:.006});
  };
  if(name.includes('turtle')) {
    box(body,.66,.28,.81,'#4c9e76',0,.29,0,{bevel:.065});
    box(body,.57,.19,.69,'#9caf56',0,.48,-.025,{bevel:.045});
    box(body,.37,.11,.45,'#c0ce72',0,.625,-.025,{bevel:.025});
    box(body,.27,.23,.32,'#83c791',0,.30,.51,{bevel:.045});
    eyes(body,.33,.68,.085,.045);
    box(body,.075,.02,.025,'#487e60',0,.255,.68,{bevel:.004});
    for(const x of [-.29,.29])for(const z of [-.25,.25])box(body,.19,.15,.25,'#80bf86',x,.09,z,{bevel:.025});
    box(body,.12,.12,.22,'#80bf86',0,.19,-.47,{bevel:.02});
    for(const x of [-.15,.15])box(body,.02,.015,.43,'#6d8443',x,.685,-.025,{bevel:.003});
  } else if(/gecko|lizard|crocodile|snake/.test(name)) {
    const tone=name.includes('crocodile')?'#6d9c58':name.includes('snake')?'#79bd5f':'#70c7a0';
    box(body,.34,.27,.68,tone,0,.25,0,{bevel:.045});
    box(body,.39,.25,.38,tone,0,.32,.43,{bevel:.05});
    box(body,.29,.075,.26,'#d3e7a3',0,.205,.47,{bevel:.02});
    eyes(body,.36,.63,.12,.06);
    if(!name.includes('snake'))for(const x of [-.25,.25])for(const z of [-.18,.23])box(body,.24,.12,.22,tone,x,.09,z,{bevel:.025});
    const tail=joint(body,'pet-tail',0,.21,-.37);rig.tail=tail;
    for(const [width,y,z]of [[.25,-.005,-.11],[.18,-.025,-.34],[.11,-.04,-.54]])box(tail,width,.15,.28,tone,0,y,z,{bevel:.025});
    if(name.includes('crocodile'))for(const z of [-.22,0,.22])box(body,.15,.09,.12,'#426e42',0,.43,z,{bevel:.01});
  } else if(name.includes('frog')) {
    box(body,.51,.37,.44,'#6ac27d',0,.39,0,{bevel:.065});
    box(body,.56,.27,.41,'#83d390',0,.65,.10,{bevel:.055});
    box(body,.31,.25,.045,'#dcf0ad',0,.39,.24,{bevel:.025});
    for(const side of [-1,1]) {
      box(body,.17,.16,.17,ivory,side*.18,.84,.18,{bevel:.025});
      box(body,.065,.09,.026,ink,side*.18,.85,.277,{bevel:.01});
      box(body,.27,.15,.39,'#53a964',side*.28,.09,-.02,{bevel:.035});
      box(body,.14,.28,.14,'#72c983',side*.27,.25,.25,{bevel:.02});
    }
  } else if(name.includes('butterfly')) {
    box(body,.13,.45,.14,'#65476e',0,.46,0,{bevel:.02});
    box(body,.20,.19,.20,'#916fa2',0,.80,.01,{bevel:.03});
    eyes(body,.82,.124,.045,.025);
    for(const side of [-1,1]) {
      const wing=joint(body,side<0?'left-wing':'right-wing',side*.08,.56,-.01);rig.wings.push(wing);
      box(wing,.42,.50,.09,'#c087e3',side*.23,.08,0,{bevel:.055});
      box(wing,.31,.32,.10,'#efa4c8',side*.19,-.23,0,{bevel:.045});
      box(body,.025,.23,.025,'#65476e',side*.07,.98,.015,{rotation:[0,0,-side*.3],bevel:.004});
    }
  } else if(name.includes('octopus')) {
    box(body,.54,.53,.48,'#bf93db',0,.60,0,{bevel:.085});
    box(body,.59,.21,.54,'#ad7ecb',0,.30,0,{bevel:.045});
    eyes(body,.63,.255,.13,.07);
    for(let i=0;i<8;i++) {
      const angle=i*Math.PI/4;
      const arm=box(body,.16,.14,.40,i%2?'#be91d8':'#d0a8e5',Math.sin(angle)*.35,.10,Math.cos(angle)*.35,{bevel:.03});arm.rotation.y=angle;
    }
  } else {
    const owl=name.includes('owl'),penguin=name.includes('penguin'),duck=/duck|swan/.test(name),chick=name.includes('chick'),eagle=name.includes('eagle'),peacock=name.includes('peacock'),macaw=name.includes('macaw');
    const tone=owl?'#a68562':penguin?'#334552':chick?'#f4cc60':eagle?'#886c51':peacock?'#5098b8':duck?'#f4e8b3':macaw?'#d66c5b':'#63bca3';
    const wingTone=owl?'#7e654f':penguin?'#253945':chick?'#dfae43':eagle?'#634e40':duck?'#e2cc8f':macaw?'#568fc8':'#408e8b';
    box(body,.41,.48,.36,tone,0,.45,0,{bevel:.06});
    box(body,.30,.31,.04,penguin||owl?ivory:'#b4de9f',0,.45,.197,{bevel:.035});
    const head=joint(body,'pet-head',0,owl?.88:.85,0);rig.head=head;
    box(head,owl?.48:.41,.36,.38,tone,0,0,0,{bevel:.05});
    if(owl) {
      for(const side of [-1,1]) {
        box(head,.18,.18,.035,ivory,side*.125,.025,.205,{bevel:.025});
        box(head,.11,.14,.13,wingTone,side*.18,.23,-.01,{rotation:[0,0,-side*.2],bevel:.018});
      }
    } else box(head,.28,.20,.03,penguin||eagle?ivory:'#d6ead3',0,.01,.205,{bevel:.03});
    eyes(head,.035,.237,.11,owl?.075:.055);
    box(head,duck?.19:.12,duck?.07:.13,duck?.22:.13,'#f0ae54',0,-.09,.265,{bevel:.02});
    for(const side of [-1,1]) {
      const wing=joint(body,side<0?'left-wing':'right-wing',side*.23,.60,0);rig.wings.push(wing);
      box(wing,.12,.36,.32,wingTone,side*.025,-.10,-.025,{bevel:.035});
      box(body,.065,.16,.075,'#d39446',side*.12,.145,.03,{bevel:.012});
      box(body,.16,.085,.25,'#e6ac58',side*.12,.045,.07,{bevel:.018});
    }
    const tail=joint(body,'pet-tail',0,.29,-.25);rig.tail=tail;
    box(tail,.22,.30,.13,wingTone,0,0,-.03,{rotation:[-.3,0,0],bevel:.025});
    if(peacock)for(const [x,y,rotation]of [[-.33,.65,.45],[0,.76,0],[.33,.65,-.45]])box(body,.32,.80,.09,x===0?'#6bb599':'#87c8a8',x,y,-.31,{rotation:[0,0,rotation],bevel:.025});
    if(name.includes('swan')) {head.position.y=1.13;box(body,.17,.35,.17,ivory,0,.83,.03,{bevel:.025});}
  }
  root.userData.kind='pet';root.userData.species=species;root.userData.rig=rig;
  return root;
}

export function animatePet(group,{time=0,happy=false}={}) {
  const rig=group?.userData?.rig;if(!rig?.body)return;
  rig.body.position.y=happy?Math.abs(Math.sin(time*10))*.16:(Math.sin(time*2.4)+1)*.012;
  rig.body.rotation.z=Math.sin(time*(happy?7:1.8))*(happy?.10:.025);
  rig.wings?.forEach((wing,i)=>{wing.rotation.z=(i===0?-1:1)*(happy?.3+Math.sin(time*12)*.3:.025+Math.sin(time*2.4)*.02);});
  if(rig.tail)rig.tail.rotation.y=Math.sin(time*(happy?9:2.2))*(happy?.3:.09);
  if(rig.head)rig.head.rotation.y=Math.sin(time*(happy?4:1.2))*(happy?.20:.06);
}

export function disposeObject(group) {
  if(!group?.traverse)return;
  const geometries=new Set(),materials=new Set(),textures=new Set();
  group.traverse(object=>{
    if(object.geometry)geometries.add(object.geometry);
    for(const material of Array.isArray(object.material)?object.material:[object.material]) {
      if(!material)continue;materials.add(material);
      for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
    }
  });
  for(const texture of textures)texture.dispose();
  for(const material of materials)material.dispose();
  for(const geometry of geometries)geometry.dispose();
}

export function createPlayerAvatar({avatar='Human',gender='girl',...options}={}){
 const model=createExplorer({...options,gender});
 model.userData.avatar='Human';model.userData.gender=gender;
 return model;
}

export function createNameLabel(name='Explorer'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=100;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#12345de8';ctx.fillRect(0,0,512,100);
 ctx.strokeStyle='#a7e7ff';ctx.lineWidth=7;ctx.strokeRect(4,4,504,92);
 ctx.textAlign='center';ctx.textBaseline='middle';let font=64;
 const text=String(name).slice(0,24);ctx.font='bold '+font+'px Arial';
 while(font>20&&ctx.measureText(text).width>480){font-=2;ctx.font='bold '+font+'px Arial'}
 ctx.fillStyle='#fff';ctx.fillText(text,256,51);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,depthWrite:false}));
 label.name='Player name: '+text;label.scale.set(1.35,.27,1);label.position.y=3.25;label.renderOrder=20;
 return label;
}

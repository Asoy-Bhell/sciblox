// localized-ui
import {t} from './i18n';
import React,{useState} from 'react';
const PEOPLE=[
 {id:'grandfather',name:'Grandfather',icon:'👴',generation:'I',symbol:'■',trait:true},
 {id:'grandmother',name:'Grandmother',icon:'👵',generation:'I',symbol:'○',trait:false},
 {id:'father',name:'Father',icon:'👨',generation:'II',symbol:'■',trait:true},
 {id:'mother',name:'Mother',icon:'👩',generation:'II',symbol:'○',trait:false},
 {id:'son',name:'Son',icon:'👦',generation:'III',symbol:'□',trait:false},
 {id:'daughter',name:'Daughter',icon:'👧',generation:'III',symbol:'●',trait:true}
];
export default function FamilyBuilder({run,send}){
 const [chosen,setChosen]=useState(null),[slots,setSlots]=useState({}),[symbols,setSymbols]=useState({}),[errors,setErrors]=useState([]),[message,setMessage]=useState('');
 const place=(generation,id=chosen)=>{if(!id)return;setSlots({...slots,[id]:generation});setChosen(null);setErrors(errors.filter(key=>key!==id))};
 const check=()=>{const bad=PEOPLE.filter(p=>slots[p.id]!==p.generation||symbols[p.id]!==p.symbol).map(p=>p.id);setErrors(bad);if(bad.length){send({type:'WRONG'});setMessage('Check the marked portraits, generation levels, and symbols. The correct placements remain hidden.')}else{send({type:'FAMILY_BUILT'});setMessage('Family tree constructed! Your learning log records this workshop.')}};
 return <div className="family-workshop"><h3>{t("Family tree workshop")}</h3><p>{t("Drag each portrait onto a generation platform, or select a portrait and tap its platform. Then attach a pedigree symbol. Squares represent males, circles females, and filled symbols show the trait.")}</p><div className="portrait-tray">{t(PEOPLE.map(p=><button key={p.id} draggable className={(chosen===p.id?'picked ':'')+(errors.includes(p.id)?'error-card':'')} onDragStart={e=>{setChosen(p.id);e.dataTransfer.setData('text/plain',p.id)}} onClick={()=>setChosen(p.id)}><span>{t(p.icon)}</span><b>{t(p.name)}</b><small>{t("Trait ")}{t(p.trait?'present':'absent')}</small></button>))}</div><div className="generation-platforms">{t(['I','II','III'].map(generation=><div className="generation-platform" key={generation} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');if(PEOPLE.some(p=>p.id===id))place(generation,id)}}><button className="secondary" aria-label={t('Place portrait in generation '+generation)} onClick={()=>place(generation)}>{t("Generation ")}{t(generation)}</button><div>{t(PEOPLE.filter(p=>slots[p.id]===generation).map(p=><label className={'field-label '+(errors.includes(p.id)?'error':'')} key={p.id}>{t(p.icon)} {t(p.name)}<select aria-label={t(p.name+' trait symbol')} value={symbols[p.id]||''} onChange={e=>setSymbols({...symbols,[p.id]:e.target.value})}><option value="">{t("Attach symbol")}</option>{t(['■','□','●','○'].map(s=><option key={s}>{t(s)}</option>))}</select></label>))}</div></div>))}</div><button className="primary" disabled={run.familyBuilt} onClick={check}>{t(run.familyBuilt?'✓ Tree saved':'Check family tree')}</button>{t(message&&<div className="feedback" role="status">{t(message)}</div>)}</div>
}

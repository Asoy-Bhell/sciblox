// localized-ui
import {t} from './i18n';
import React, {useRef, useState} from 'react';
import {Check, Lightbulb, Search} from 'lucide-react';
import FamilyBuilder from './FamilyBuilder';
import {activityCatalog, PRACTICE_PETS} from './station-activities-data';

export {activityCatalog};

const PREPARATION_STYLES = `
.station-preparation {max-width:920px;margin:auto;--prep-purple:#7450ba;--prep-teal:#127e75;--prep-orange:#bc5a1b}
.station-preparation fieldset {border:0;padding:0;margin:0;min-width:0}
.station-preparation fieldset:disabled {opacity:.82}
.prep-description {line-height:1.6;max-width:70ch}
.prep-card-tray,.prep-discoveries,.prep-pets {display:flex;flex-wrap:wrap;gap:12px;margin:18px 0}
.prep-card {display:flex;align-items:center;gap:9px;min-height:54px;padding:12px 15px;background:#fff;border:2px solid #d9e6e2;border-radius:14px;font:inherit;text-align:left;color:#183d36;cursor:pointer;touch-action:manipulation;box-shadow:0 3px 0 #e8f0ed}
.prep-card span[aria-hidden] {font-size:29px}
.prep-card.selected {border-color:#7250b3;background:#f0e9ff;box-shadow:0 0 0 3px #e4d8fa}
.prep-card.prep-error,.prep-input.prep-error,.prep-header-grid .prep-header-slot.prep-error {border-color:#c3393f;background:#fff0f1;animation:prep-shake .3s}
.prep-groups {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:14px;margin:16px 0 22px}
.prep-group {border:2px dashed #a6c2b9;background:#f3f9f5;border-radius:18px;padding:14px;min-height:158px}
.prep-group.purple {border-color:#a48bc8;background:#f6f0ff}.prep-group.orange {border-color:#daab7b;background:#fff6e9}.prep-group.teal {border-color:#76b9ae;background:#eaf7f3}
.prep-group h4 {margin:2px 0 12px;font-size:17px}.prep-group .prep-card {width:100%;margin:10px 0}
.prep-group .secondary {width:100%;min-height:46px;font-size:14px}
.prep-selection {min-height:26px;font-size:14px;color:#526a62;line-height:1.5}
.prep-discovery {flex:1 1 190px;border:2px solid #d7e7e0;border-radius:18px;background:#fff;padding:15px;min-width:0}
.prep-discovery > button {width:100%;justify-content:center;flex-direction:column;min-height:135px;text-align:center;font-weight:800}
.prep-discovery > button span {font-size:58px}.prep-discovery p {font-size:15px;line-height:1.6;margin-bottom:0}
.prep-scanner {border:2px solid #c6e1d6;background:#edf7f2;padding:18px;border-radius:20px;text-align:center;margin:18px 0}
.prep-tree-row {display:flex;align-items:center;justify-content:center;gap:16px;margin:10px auto}
.prep-symbol {width:70px;min-height:75px;border:2px solid #abc4ba;background:white;color:#174f47;border-radius:14px;font:inherit;cursor:pointer}
.prep-symbol b {display:block;font-size:38px;line-height:1.1}.prep-symbol small {display:block;margin-top:5px}.prep-symbol.scanned {border-color:#7650b8;background:#f4edff}
.prep-tree-line {width:2px;height:32px;background:#7b9d8f;margin:auto}.prep-scan-message {min-height:50px;line-height:1.5}
.prep-partner-line {width:26px;border-top:2px dashed #8aa599;flex-shrink:0}.prep-partner-line.connected {border-top:3px solid #418771}
.prep-quiz {margin:18px 0}.prep-quiz .answers button {min-height:54px}.prep-quiz h3 {line-height:1.5}
.prep-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:min(100%,330px);margin:20px auto;gap:9px}
.prep-grid > div {display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:95px;border:2px solid #c8ddd3;border-radius:14px;background:#f6fbf7;font-size:25px;font-weight:800}
.prep-grid small {font-size:12px;line-height:1.4;margin-top:5px;color:#62786d;font-weight:500}
.prep-fields {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:15px;margin:18px 0 22px}
.prep-fields label {display:flex;flex-direction:column;gap:8px;line-height:1.5;font-size:15px;font-weight:700}
.prep-input {width:100%;min-height:49px;font:inherit;font-size:19px;border:2px solid #bed4c9;border-radius:12px;padding:10px;background:#fff;color:#143e35}
.prep-feedback {display:flex;align-items:flex-start;gap:9px;padding:14px 16px;border-radius:14px;background:#fff3d7;color:#68461d;margin-top:18px;line-height:1.5}
.prep-feedback svg {flex-shrink:0;margin-top:3px}.prep-feedback.success {background:#e0f5e8;color:#1e6747}
.prep-header-grid {display:grid;grid-template-columns:76px repeat(2,minmax(0,1fr));gap:8px;max-width:400px;margin:20px auto}.prep-header-grid .prep-header-slot {min-height:72px;background:#f4eefc;border:2px dashed #af98cb;color:#593481;border-radius:12px;font:inherit;font-size:23px;cursor:pointer;padding:7px}
.prep-header-grid .prep-header-slot.side {background:#e6f5ef;border-color:#7db5a5;color:#176951}
.prep-header-grid .prep-header-slot small {display:block;font-size:11px}.prep-blank-cell {border-radius:12px;background:#f7faf8;border:1px solid #d4e4dc;display:grid;place-items:center;color:#8fa59a;font-size:30px;min-height:77px}
.prep-pet {flex:1 1 150px;flex-direction:column;text-align:center;gap:4px}.prep-pet > span[aria-hidden] {font-size:46px}.prep-pet small {font-size:13px}.prep-story {background:#edf6ff;border:1px solid #b8d3e7;border-radius:14px;padding:15px;line-height:1.6}
.prep-connections {display:grid;gap:10px;margin:18px 0}.prep-connections button {width:100%;justify-content:space-between}.prep-connections small {font-size:12px}
.prep-progress {font-size:13px;letter-spacing:.06em;color:#56796a;font-weight:800;text-transform:uppercase}
.station-preparation button:focus-visible,.station-preparation input:focus-visible {outline:3px solid #b9750c;outline-offset:3px}
@keyframes prep-shake {25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@media (prefers-reduced-motion:reduce) {.station-preparation * {animation:none!important}}
@media(max-width:480px){.prep-card-tray{gap:8px}.prep-card-tray .prep-card{width:100%}.prep-discoveries{gap:10px}.prep-discovery{flex-basis:100%}.prep-discovery > button{min-height:95px;flex-direction:row;gap:18px}.prep-discovery > button span{font-size:45px}.prep-symbol{width:64px}.prep-tree-row{gap:10px}.prep-header-grid{grid-template-columns:65px repeat(2,minmax(0,1fr))}.prep-pet{flex-basis:calc(50% - 12px);padding:12px 7px}}
`;

function SortActivity({definition, onDone, onFail}) {
  const [selected, setSelected] = useState(null);
  const [placements, setPlacements] = useState({});
  const [errors, setErrors] = useState([]);
  const place = (target, id = selected) => {
    if (!definition.cards.some(card => card.id === id)) return;
    setPlacements(current => ({...current, [id]:target}));
    setSelected(null);
    setErrors(current => current.filter(error => error !== id));
  };
  const renderCard = card => <button key={card.id} type="button" draggable className={'prep-card '+(selected===card.id?'selected ':'')+(errors.includes(card.id)?'prep-error':'')} aria-pressed={selected===card.id} aria-label={t('Select '+card.label)} onClick={()=>setSelected(card.id)} onDragStart={event=>{event.dataTransfer.setData('text/plain',card.id);event.dataTransfer.effectAllowed='move';setSelected(card.id)}}><span aria-hidden="true">{t(card.icon)}</span><span>{t(card.label)}</span></button>;
  const check = () => {
    const wrong = definition.cards.filter(card=>placements[card.id]!==card.target).map(card=>card.id);
    setErrors(wrong);
    if (wrong.length) onFail(`${wrong.length} card${wrong.length===1?' needs':'s need'} another look. ${definition.hint}`);
    else onDone();
  };
  return <><p className="prep-selection">{t(selected?'Selected: '+definition.cards.find(card=>card.id===selected).label+'. Tap a destination below.':'Drag cards, or tap a card and then its destination. You can select a placed card to move it.')}</p><div className="prep-card-tray" aria-label={t("Cards awaiting placement")}>{t(definition.cards.filter(card=>!placements[card.id]).map(renderCard))}</div><div className="prep-groups">{t(definition.groups.map(group=><section key={group.id} className={'prep-group '+group.color} aria-label={t(group.label+' destination')} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();place(group.id,event.dataTransfer.getData('text/plain'))}}><h4>{t(group.label)}</h4><button className="secondary" type="button" aria-label={t('Place selected card in '+group.label)} disabled={!selected} onClick={()=>place(group.id)}>{t("Place selected card here")}</button>{t(definition.cards.filter(card=>placements[card.id]===group.id).map(renderCard))}</section>))}</div><button className="primary" type="button" onClick={check}>{t("Check Answers ")}<Check size={17}/></button></>;
}

function DiscoveryActivity({definition, onDone}) {
  const [seen, setSeen] = useState([]);
  return <><div className="prep-discoveries">{t(definition.cards.map(card=><article className="prep-discovery" key={card.id}><button type="button" className={'prep-card '+(seen.includes(card.id)?'selected':'')} aria-expanded={seen.includes(card.id)} onClick={()=>setSeen(current=>current.includes(card.id)?current:[...current,card.id])}><span aria-hidden="true">{t(card.icon)}</span>{t(card.label)}{t(seen.includes(card.id)&&<small>{t("Inspected ✓")}</small>)}</button>{t(seen.includes(card.id)&&<p>{t(card.text)}</p>)}</article>))}</div><p className="prep-selection" role="status">{t(seen.length)}{t(" of ")}{t(definition.cards.length)}{t(" discoveries inspected")}</p><button type="button" className="primary" disabled={seen.length!==definition.cards.length} onClick={onDone}>{t("Save my discoveries ")}<Check size={17}/></button></>;
}

function QuizActivity({definition, onDone, onFail, onProgress}) {
  const [index, setIndex] = useState(0);
  const [rejected, setRejected] = useState([]);
  const question = definition.questions[index];
  const answer = option => {
    if (option !== question.answer) {
      setRejected(current=>current.includes(option)?current:[...current,option]);
      onFail(question.hint);
      return;
    }
    if (index === definition.questions.length-1) onDone();
    else {setIndex(index+1);setRejected([]);onProgress?.('Good reasoning. Continue to the next check.');}
  };
  return <div className="prep-quiz"><p className="prep-progress">{t("Check ")}{t(index+1)}{t(" of ")}{t(definition.questions.length)}</p><h3>{t(question.prompt)}</h3><div className="answers">{t(question.options.map((option,i)=><button key={index+'-'+i} type="button" className={rejected.includes(i)?'incorrect':''} onClick={()=>answer(i)}>{t(option)}</button>))}</div></div>;
}

const CONNECTIONS = [
  {id:'grandparents',label:'Maya ↔ Omar',kind:'Partner line',correct:true},
  {id:'mother-grandmother',label:'Maya & Omar ↓ Ana',kind:'Descent line',correct:true},
  {id:'parents',label:'Ana ↔ Ben',kind:'Partner line',correct:true},
  {id:'child',label:'Ana & Ben ↓ Leo',kind:'Descent line',correct:true},
  {id:'wrong-partners',label:'Maya ↔ Leo',kind:'Partner line',correct:false},
  {id:'wrong-descent',label:'Ana & Ben ↓ Omar',kind:'Descent line',correct:false}
];

function ConnectionsActivity({definition, onDone, onFail}) {
  const [selected, setSelected] = useState([]);
  const [errors, setErrors] = useState([]);
  const toggle = id => {setSelected(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);setErrors(current=>current.filter(item=>item!==id));};
  const check = () => {
    const wrong = CONNECTIONS.filter(connection=>selected.includes(connection.id)!==connection.correct).map(connection=>connection.id);
    setErrors(wrong.filter(id=>selected.includes(id)));
    if(wrong.length) onFail('Some relationship lines are missing or do not match the story. '+definition.hint);
    else onDone();
  };
  return <><div className="prep-story"><b>{t("The family story")}</b><br/>{t("Maya and Omar are partners and are Ana’s parents. Ana and Ben are partners and are Leo’s parents.")}</div><div className="prep-scanner" aria-label={t("Family generations")}><div className="prep-tree-row"><span>{t("I · 👵 Maya")}</span><span className={'prep-partner-line '+(selected.includes('grandparents')?'connected':'')} aria-label={t(selected.includes('grandparents')?'Partner line repaired':'Broken partner line')}/><span>{t("👴 Omar")}</span></div><div className="prep-tree-line" style={{background:selected.includes('mother-grandmother')?'#418771':'#c9d5ce',borderLeft:selected.includes('mother-grandmother')?'none':'2px dashed #899e93'}}/><div className="prep-tree-row"><span>{t("II · 👩 Ana")}</span><span className={'prep-partner-line '+(selected.includes('parents')?'connected':'')} aria-label={t(selected.includes('parents')?'Partner line repaired':'Broken partner line')}/><span>{t("👨 Ben")}</span></div><div className="prep-tree-line" style={{background:selected.includes('child')?'#418771':'#c9d5ce',borderLeft:selected.includes('child')?'none':'2px dashed #899e93'}}/><div className="prep-tree-row">{t("III · 👦 Leo")}</div></div><div className="prep-connections">{t(CONNECTIONS.map(connection=><button key={connection.id} type="button" className={'prep-card '+(selected.includes(connection.id)?'selected ':'')+(errors.includes(connection.id)?'prep-error':'')} aria-pressed={selected.includes(connection.id)} onClick={()=>toggle(connection.id)}><span>{t(connection.label)}<br/><small>{t(connection.kind)}</small></span><span aria-hidden="true">{t(selected.includes(connection.id)?'✓':'＋')}</span></button>))}</div><button type="button" className="primary" onClick={check}>{t("Check repaired connections ")}<Check size={17}/></button></>;
}

const SCAN_PEOPLE = [
  {id:'father',name:'Father',symbol:'■',text:'Father: a male with the dominant green phenotype. His exact genotype is not shown by shading alone.'},
  {id:'mother',name:'Mother',symbol:'●',text:'Mother: a female with the dominant green phenotype. Her exact genotype is not shown by shading alone.'},
  {id:'child',name:'Child',symbol:'□',text:'Child: a male with the recessive yellow phenotype. Each parent contributed one allele to his genotype.'}
];

function ScannerActivity({onDone, onFail, onProgress}) {
  const [scanned, setScanned] = useState([]);
  const [current, setCurrent] = useState(null);
  const [investigate, setInvestigate] = useState(false);
  const scan = person => {setCurrent(person);setScanned(items=>items.includes(person.id)?items:[...items,person.id]);};
  const questions = {questions:[
    {prompt:'What is the genotype of the recessive-phenotype child?',options:['BB','Bb','bb'],answer:2,hint:'Use the rule for expressing a recessive phenotype under complete dominance.'},
    {prompt:'Both green parents have this yellow child. What must the parents’ genotypes be in this model?',options:['Both BB','Both Bb','Both bb'],answer:1,hint:'The child receives a recessive allele from each parent. Combine that evidence with the parents’ dominant phenotype.'}
  ]};
  return <><div className="prep-story">{t("Legend: square = male; circle = female; shaded = green phenotype. Green (B) is dominant; yellow (b) is recessive in this model.")}</div><div className="prep-scanner"><div className="prep-tree-row">{t(SCAN_PEOPLE.slice(0,2).map(person=><button type="button" key={person.id} className={'prep-symbol '+(scanned.includes(person.id)?'scanned':'')} aria-label={t('Scan '+person.name)} onClick={()=>scan(person)}><b>{t(person.symbol)}</b><small>{t(person.name)}</small></button>))}</div><div className="prep-tree-line"/><div className="prep-tree-row"><button type="button" className={'prep-symbol '+(scanned.includes('child')?'scanned':'')} aria-label={t("Scan Child")} onClick={()=>scan(SCAN_PEOPLE[2])}><b>{t("□")}</b><small>{t("Child")}</small></button></div><p className="prep-scan-message" role="status"><Search size={16} style={{display:'inline',verticalAlign:'middle'}}/> {t(current?current.text:'Tap each family member to examine the evidence.')}</p></div>{t(investigate?<QuizActivity definition={questions} onDone={onDone} onFail={onFail} onProgress={onProgress}/>:<button type="button" className="primary" disabled={scanned.length!==3} onClick={()=>setInvestigate(true)}>{t("Use my scans to infer genotypes")}</button>)}</>;
}

function FamilyActivity({onDone, onFail}) {
  const [familyBuilt, setFamilyBuilt] = useState(false);
  const send = event => {
    if(event.type==='WRONG') onFail('Check the marked portraits. Read each person’s generation, sex, and trait evidence separately.');
    if(event.type==='FAMILY_BUILT') {setFamilyBuilt(true);onDone();}
  };
  return <FamilyBuilder run={{familyBuilt}} send={send}/>;
}

const HEADER_TOKENS = [
  {id:'a1',parent:'A',allele:'B'}, {id:'a2',parent:'A',allele:'b'},
  {id:'b1',parent:'B',allele:'B'}, {id:'b2',parent:'B',allele:'b'}
];
const HEADER_SLOTS = [
  {id:'top1',parent:'A',label:'Top header 1'}, {id:'top2',parent:'A',label:'Top header 2'},
  {id:'left1',parent:'B',label:'Left header 1'}, {id:'left2',parent:'B',label:'Left header 2'}
];

function HeadersActivity({onDone, onFail}) {
  const [selected, setSelected] = useState(null);
  const [slots, setSlots] = useState({});
  const [error, setError] = useState(null);
  const place = (slot, id=selected) => {
    const token = HEADER_TOKENS.find(item=>item.id===id);
    if(!token) return;
    if(token.parent!==slot.parent) {
      setError(slot.id);
      onFail('Keep one parent across the top and the other down the side. Check the Parent A / Parent B labels before placing this allele.');
      return;
    }
    setSlots(current=>{const next={...current};Object.keys(next).forEach(key=>{if(next[key]===id)delete next[key];});next[slot.id]=id;return next;});
    setSelected(null);setError(null);
  };
  const renderSlot = id => {
    const slot = HEADER_SLOTS.find(item=>item.id===id),token=HEADER_TOKENS.find(item=>item.id===slots[id]);
    return <button type="button" key={id} className={'prep-header-slot '+(slot.parent==='B'?'side ':'')+(error===id?'prep-error':'')} aria-label={t(slot.label+(token?' · Parent '+token.parent+' allele '+token.allele:' · empty'))} onClick={()=>{if(selected)place(slot);else if(token)setSelected(token.id);}} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();place(slot,event.dataTransfer.getData('text/plain'));}}>{t(token?token.allele:'＋')}<small>{t("Parent ")}{t(slot.parent)}</small></button>;
  };
  const check = () => {
    if(HEADER_SLOTS.some(slot=>!slots[slot.id])||new Set(Object.values(slots)).size!==4) onFail('Use each parent’s two separate allele tokens exactly once. Every top and left header needs one allele.');
    else onDone();
  };
  return <><div className="prep-card-tray">{t(HEADER_TOKENS.map(token=><button type="button" draggable key={token.id} className={'prep-card '+(selected===token.id?'selected':'')} aria-label={t('Select Parent '+token.parent+' allele '+token.allele)} aria-pressed={selected===token.id} onClick={()=>setSelected(token.id)} onDragStart={event=>{event.dataTransfer.setData('text/plain',token.id);setSelected(token.id);}}>{t("Parent ")}{t(token.parent)}{t(" · ")}<b>{t(token.allele)}</b>{t(Object.values(slots).includes(token.id)&&<small>{t("Placed")}</small>)}</button>))}</div><p className="prep-selection">{t(selected?'Tap a header to place the selected allele.':'Drag a token to a header, or select it and tap the header. The two letters of each Bb parent are separate gamete options.')}</p><div className="prep-header-grid" aria-label={t("Punnett square header builder")}><div/>{t(renderSlot('top1'))}{t(renderSlot('top2'))}{t(renderSlot('left1'))}<div className="prep-blank-cell">{t("?")}</div><div className="prep-blank-cell">{t("?")}</div>{t(renderSlot('left2'))}<div className="prep-blank-cell">{t("?")}</div><div className="prep-blank-cell">{t("?")}</div></div><p className="small">{t("The inner boxes come next in your station lab.")}</p><button type="button" className="primary" onClick={check}>{t("Check parent headers ")}<Check size={17}/></button></>;
}

function NumberActivity({definition, onDone, onFail}) {
  const [values,setValues] = useState({});
  const [errors,setErrors] = useState([]);
  const check = event => {
    event.preventDefault();
    const wrong = definition.fields.filter(field=>{
      const value=(values[field.id]||'').replace(/\s/g,'').replace(/%$/,'');
      return field.format==='ratio'?value!==field.answer:value===''||Number(value)!==Number(field.answer);
    }).map(field=>field.id);
    setErrors(wrong);
    if(wrong.length) onFail('Check the highlighted entries. '+definition.hint);
    else onDone();
  };
  return <form onSubmit={check}>{t(definition.square&&<div className="prep-grid" aria-label={t("Four equally likely offspring boxes")}>{t(definition.square.map((genotype,i)=><div key={i} aria-label={t('Box '+(i+1)+' · '+genotype)}>{t(genotype)}<small>{t("Box ")}{t(i+1)}</small></div>))}</div>)}<div className="prep-fields">{t(definition.fields.map(field=><label key={field.id} htmlFor={'prep-'+definition.id+'-'+field.id}>{t(field.label)}<input id={'prep-'+definition.id+'-'+field.id} className={'prep-input '+(errors.includes(field.id)?'prep-error':'')} aria-invalid={errors.includes(field.id)} inputMode={field.format==='ratio'?'text':'numeric'} autoComplete="off" spellCheck={false} value={values[field.id]||''} onChange={event=>{setValues(current=>({...current,[field.id]:event.target.value}));setErrors(current=>current.filter(id=>id!==field.id));}} placeholder={t(field.format==='ratio'?'Use : between counts':'Enter a number')}/></label>))}</div><button type="submit" className="primary">{t("Check Answers ")}<Check size={17}/></button></form>;
}

function ParentPractice({onDone,onFail}) {
  const [chosen,setChosen] = useState([]);
  const select = id => setChosen(current=>current.includes(id)?current.filter(item=>item!==id):current.length<2?[...current,id]:[current[1],id]);
  const check = () => {
    const pets = chosen.map(id=>PRACTICE_PETS.find(pet=>pet.id===id));
    if(pets.length!==2) {onFail('Choose two different parent pets before checking.');return;}
    if(pets[0].species!==pets[1].species||pets[0].level!==pets[1].level) {onFail('Compare both the species and the level on each selected pet. Both details must match; genotypes may differ.');return;}
    onDone();
  };
  return <><div className="prep-pets">{t(PRACTICE_PETS.map(pet=><button type="button" key={pet.id} className={'prep-card prep-pet '+(chosen.includes(pet.id)?'selected':'')} aria-pressed={chosen.includes(pet.id)} aria-label={t('Select '+pet.name+' · '+pet.species+' · level '+pet.level)} onClick={()=>select(pet.id)}><span aria-hidden="true">{t(pet.icon)}</span><b>{t(pet.name)}</b><span>{t(pet.species)}</span><small>{t("Level ")}{t(pet.level)}{t(" · ")}{t(pet.genotype)}</small></button>))}</div><p className="prep-selection">{t(chosen.length)}{t("/2 practice parents selected. This lesson changes no inventory pets.")}</p><button type="button" className="primary" onClick={check}>{t("Check parent eligibility ")}<Check size={17}/></button></>;
}

function ActivityShell({station, definition, onComplete, onWrong, onCorrect}) {
  const [complete,setComplete] = useState(false);
  const [feedback,setFeedback] = useState('');
  const completed = useRef(false);
  const onDone = () => {
    if(completed.current) return;
    completed.current=true;
    setComplete(true);
    setFeedback('Workshop complete! Your discoveries are saved for this station.');
    onComplete?.();
  };
  const onFail = message => {
    if(completed.current) return;
    setFeedback(message);
    onWrong?.();
  };
  const props={definition,onDone,onFail,onProgress:message=>{setFeedback(message);onCorrect?.()}};
  const content = {
    sort:SortActivity,discovery:DiscoveryActivity,quiz:QuizActivity,
    connections:ConnectionsActivity,scanner:ScannerActivity,family:FamilyActivity,
    headers:HeadersActivity,numbers:NumberActivity,parents:ParentPractice
  };
  const Content=content[definition.type];
  return <section className="station-preparation" aria-label={t(definition.title)}><style>{t(PREPARATION_STYLES)}</style><p className="prep-progress">{t("Station ")}{t(station+1)}{t(" · Learning workshop")}</p><h2>{t(definition.title)}</h2><p className="prep-description">{t(definition.description)}</p><fieldset disabled={complete}><Content {...props}/></fieldset>{t(feedback&&<div className={'prep-feedback '+(complete?'success':'')} role="status" aria-live="polite">{t(complete?<Check size={18}/>:<Lightbulb size={18}/>)}<span>{t(feedback)}</span></div>)}</section>;
}

// `station` is zero-based. `activity` may be its catalog object, stable id, or
// zero-based activity index. The key resets local inputs when the lesson changes.
export function PreparationActivity({station,activity,onComplete,onWrong,onCorrect}) {
  const definitions=activityCatalog[station]||[];
  const definition=typeof activity==='number'?definitions[activity]:definitions.find(item=>item.id===(typeof activity==='string'?activity:activity?.id));
  if(!definition) return <div role="status">{t("Choose a workshop from this station’s activity menu.")}</div>;
  return <ActivityShell key={station+'-'+definition.id} station={station} definition={definition} onComplete={onComplete} onWrong={onWrong} onCorrect={onCorrect}/>;
}

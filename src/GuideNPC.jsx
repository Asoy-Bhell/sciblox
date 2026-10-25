import React,{useEffect,useId,useState} from 'react';
import {ArrowRight,Lightbulb,Volume2,VolumeX} from 'lucide-react';
import {EXPRESSIONS,localizeGuide} from './guide/dialogue';
import useOfflineNarration from './guide/useOfflineNarration';
import './guide-npc.css';
import BhellAudioToggle from './BhellAudioToggle';

const COPY={en:{guide:'Bhell NPC guide',next:'Next',skip:'Skip',hear:'Hear Bhell',stop:'Stop speaking',hint:'Ask Bhell for guidance',explore:'Let’s explore',muted:'Voice is off in Settings.',mute:'Mute Bhell',unmute:'Unmute Bhell'},
  tl:{guide:'Gabay na NPC na si Bhell',next:'Susunod',skip:'Laktawan',hear:'Pakinggan si Bhell',stop:'Itigil ang pagsasalita',hint:'Humingi ng gabay kay Bhell',explore:'Tuklasin natin',muted:'Naka-off ang boses sa Mga Setting.',mute:'I-mute si Bhell',unmute:'Paganahin ang boses ni Bhell'}};

// Controlled visibility; a new message key remounts this component. Authored
// captions remain complete even with motion disabled or no voice installed.
export default function GuideNPC({scenes=[],trigger='intro',language='en',motion=true,sound=true,variables={},onClose,onSoundChange,autoSpeak=true,voiceName,showAudioControl=true}){
  const [index,setIndex]=useState(0),[showHint,setShowHint]=useState(false);
  const [localMuted,setLocalMuted]=useState(false),enabled=sound&&!localMuted;
  const setSound=value=>onSoundChange?onSoundChange(value):setLocalMuted(!value);
  const scene=scenes[index]||scenes[0],copy=COPY[language]||COPY.en,id=useId();
  const text=localizeGuide(scene?.text,language,variables),hint=localizeGuide(scene?.hint,language,variables);
  const narration=useOfflineNarration({sound:enabled,language,voiceName,sceneKey:`${scene?.id}-${text}-${showHint}`});
  const expression=EXPRESSIONS[scene?.expression]?scene.expression:'explain';
  useEffect(()=>{setShowHint(trigger==='wrong')},[trigger]);
  useEffect(()=>{
    if(!autoSpeak||!enabled||!text)return;
    const timer=setTimeout(()=>narration.speak(text+(showHint&&hint?' '+hint:'')),180);
    return()=>{clearTimeout(timer);narration.stop()};
  },[autoSpeak,enabled,text,hint,showHint,narration.speak,narration.stop]);
  if(!scene)return null;
  const close=()=>{narration.stop();onClose?.()};
  const next=()=>{narration.stop();if(index+1<scenes.length){setIndex(index+1);setShowHint(false)}else close()};
  return <section className={'bhell-dialog guide-npc '+(motion?'guide-motion':'guide-still')} role="dialog" aria-modal="false" aria-label={copy.guide} aria-describedby={id} data-blocking={!['correct','idle'].includes(trigger)} data-expression={expression} data-trigger={trigger} data-motion={motion?'on':'off'} data-language={language}>
    <div className="guide-npc-body">
      <img className="guide-npc-sprite" src={EXPRESSIONS[expression]} alt="Bhell" draggable="false"/>
      <div className="speech guide-npc-bubble">
        <span className="speaker-name">Bhell</span>
        <div className="guide-captions" id={id} aria-live="polite" aria-atomic="true"><p>{text}</p>{showHint&&hint&&<p className="guide-hint"><Lightbulb size={14} aria-hidden="true"/>{hint}</p>}</div>
        {showAudioControl&&<BhellAudioToggle sound={enabled} onChange={value=>{narration.stop();setSound(value)}}/>}
        {enabled&&narration.status&&<small className="voice-status" role="status">{narration.status}</small>}
      </div>
    </div>
    <div className="guide-actions">
      {hint&&!showHint&&<button type="button" className="text-button guide-hint-button" onClick={()=>setShowHint(true)}><Lightbulb size={14}/>{copy.hint}</button>}
      <button type="button" className="text-button" onClick={close}>{copy.skip}</button>
      <button type="button" className="primary" onClick={next}>{copy.next}<ArrowRight size={14}/></button>
    </div>
  </section>;
}

// localized-ui
import {t,getLanguage} from './i18n';
import React,{useEffect,useRef,useState} from 'react';
import useOfflineNarration from './guide/useOfflineNarration';
import {nativeMobile} from './mobile';
import {Volume2} from 'lucide-react';
import {BHELL_MEDIA,localMedia} from './scene-media';
import Character3D,{Pet3D,Egg3D} from './Character3D';
import ProfilePortrait from './ProfilePortrait';

export function AnimatedCharacter({state='idle',size=88,facing='right',className='',label='Bhell the science explorer',outfit='Guide',motion=true}){
 return <Character3D state={state} size={size} facing={facing} className={className} label={t(label)} outfit={outfit} motion={motion}><span className="mia-sprite"/></Character3D>
}

export function StoryDialog({text,speaker='Bhell',motion=true,sound=true,scene=0,icon}){
 text=t(text);
 const [visible,setVisible]=useState(motion?'':text),timer=useRef(null);
 const narration=useOfflineNarration({sound,language:getLanguage(),sceneKey:'story-'+scene+'-'+text});
 const speaking=narration.speaking,voiceStatus=narration.status;
 useEffect(()=>{setVisible(motion?'':text);if(motion){let length=0;timer.current=setInterval(()=>{length=Math.min(length+3,text.length);setVisible(text.slice(0,length));if(length===text.length)clearInterval(timer.current)},24)}return()=>clearInterval(timer.current)},[text,motion]);
 useEffect(()=>{if(!sound)return;const task=setTimeout(()=>narration.speak(text),180);return()=>{clearTimeout(task);narration.stop()}},[text,sound,narration.speak,narration.stop]);
 const narrate=()=>{setVisible(text);clearInterval(timer.current);if(speaking)narration.stop();else narration.speak(text)};
 const talking=speaking||visible.length<text.length;
 return <div className={'story-stage character-story scene-'+scene} key={scene}><span className="story-glow"/><div className={'bhell-portrait story-mia '+(talking&&motion?'bhell-talking':'')}><img src="/assets/bhell-guide.png" alt="Bhell, your science guide"/><span className="bhell-hand" aria-hidden="true">{t("✦")}</span></div>{t(icon&&<span className="story-topic">{t(icon)}</span>)}<div className="speech"><span className="speaker-name">{t(speaker)}<small>{t("YOUR SCIENCE EXPLORER")}</small></span><p aria-label={t(text)}><span className="dialogue-space" aria-hidden="true">{t(text)}</span><span className="dialogue-visible" aria-hidden="true">{t(visible||'…')}</span><span className="sr-only">{t(text)}</span></p><div className="speech-controls">{t(visible.length<text.length&&<button className="text-button" onClick={()=>{clearInterval(timer.current);setVisible(text)}}>{t("Show full dialogue")}</button>)}<button className="text-button" onClick={narrate}><Volume2 size={15}/>{t(" Hear Bhell")}</button></div>{t(voiceStatus&&<small className="voice-status" role="status">{t(voiceStatus)}</small>)}</div><span className="story-land">{t("🌱 🌼 🌿")}</span></div>
}

export function HatchReveal({pet,onClose}){
 const [hatched,setHatched]=useState(false);
 const dialog=useRef(null),close=useRef(null);
 useEffect(()=>{const timer=setTimeout(()=>setHatched(true),1250);return()=>clearTimeout(timer)},[]);
 useEffect(()=>{const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.focus();const trap=event=>{if(event.key==='Tab'){event.preventDefault();(close.current?.disabled?dialog.current:close.current)?.focus()}};document.addEventListener('keydown',trap);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',trap);previous?.focus()}},[]);
 useEffect(()=>{if(hatched)close.current?.focus()},[hatched]);
 return <div ref={dialog} tabIndex={-1} className="hatch-overlay" role="dialog" aria-modal="true" aria-label={t("A new companion is hatching")}><div className={'hatch-theater '+(hatched?'hatched':'')}><span className="hatch-rays"/>{t(!hatched?<span className="hatching-egg"><Egg3D rarity={pet.rarity} size={190}>{t("🥚")}</Egg3D></span>:<span className="newborn-pet"><Pet3D species={pet.species} size={215} happy>{t(pet.icon)}</Pet3D></span>)}<div className="hatch-sparkles">{t(Array.from({length:12},(_,i)=><i key={i} style={{'--spark-angle':i*30+'deg','--spark-delay':i*.03+'s'}}>{t("✦")}</i>))}</div><div className="hatch-copy"><div className="eyebrow">{t(hatched?'WELCOME TO YOUR HOME BASE':'SOMETHING WONDERFUL IS HAPPENING')}</div><h2>{t(hatched?`Hello, ${pet.species}!`:'An egg is hatching…')}</h2><p>{t(hatched?'Your new companion is ready to explore with you.':'A little wiggle. A little crack. A new friend.')}</p><button ref={close} className="primary" disabled={!hatched} onClick={onClose}>{t("Meet my companion")}</button></div></div></div>
}

export function ReactivePet({icon,label,size=50}){
 const [reaction,setReaction]=useState(false);
 useEffect(()=>{if(!reaction)return;const timer=setTimeout(()=>setReaction(false),1000);return()=>clearTimeout(timer)},[reaction]);
 return <button className={'reactive-pet '+(reaction?'pet-happy':'')} style={{fontSize:size}} aria-label={t('Greet '+label)} onClick={()=>setReaction(true)}><Pet3D species={label} happy={reaction} size={Math.max(70,size*1.45)}>{t(icon)}</Pet3D>{t(reaction&&<i>{t("♥")}</i>)}</button>
}

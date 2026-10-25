import {useCallback,useEffect,useRef,useState} from 'react';
import {Narrator} from '../narrator';
import {nativeMobile} from '../mobile';
import {BHELL_MEDIA,localMedia} from '../scene-media';
import {bundledNarration} from './bundled-narration';

const unavailable={en:'Offline voice is unavailable on this device. Follow Bhell’s captions.',tl:'Walang offline na boses sa device na ito. Sundan ang mga caption ni Bhell.'};

// Shares the existing Android Narrator plugin, local recordings, and browser
// localService voices. No network voice or external audio URL is accepted.
export default function useOfflineNarration({sound=true,language='en',sceneKey,voiceName:chosenVoice}){
  let savedVoice='';try{savedVoice=JSON.parse(localStorage.getItem('sciblox-v1'))?.settings?.voiceByLanguage?.[language]||''}catch{}
  const voiceName=chosenVoice??savedVoice;
  const [speaking,setSpeaking]=useState(false),[status,setStatus]=useState('');
  const request=useRef(0),audio=useRef(null),mounted=useRef(true),speech=useRef(null);
  const stop=useCallback(()=>{
    request.current++;
    audio.current?.pause();audio.current=null;speech.current=null;
    if(nativeMobile)Narrator.stop().catch(()=>{});
    else window.speechSynthesis?.cancel();
    if(mounted.current)setSpeaking(false);
  },[]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;stop()}},[stop]);
  useEffect(()=>{stop();setStatus('')},[sceneKey,sound,language,voiceName,stop]);
  useEffect(()=>{
    if(!nativeMobile)return;
    let disposed=false,handle;
    Narrator.addListener('finished',()=>{if(mounted.current)setSpeaking(false)}).then(value=>{if(disposed)value.remove();else handle=value}).catch(()=>{});
    return()=>{disposed=true;handle?.remove()};
  },[]);
  useEffect(()=>{
    const hidden=()=>{if(document.hidden)stop()};
    document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',stop);
    return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',stop)};
  },[stop]);
  const speak=useCallback(async text=>{
    stop();setStatus('');
    if(!sound)return;
    const id=request.current,valid=()=>mounted.current&&request.current===id;
    const fail=()=>{if(valid()){setSpeaking(false);setStatus(unavailable[language]||unavailable.en)}};
    const recording=localMedia(BHELL_MEDIA.dialogue[text]);
    const paths=recording?[recording]:!voiceName||voiceName==='bundled-tl'?bundledNarration(text,language):[];
    if(paths.length){
      if(nativeMobile){try{const result=await Narrator.playLocal({paths});if(result.spoken){if(valid())setSpeaking(true);return}}catch{}}
      else{
       const play=async index=>{if(!valid())return;const player=new Audio(paths[index]);audio.current=player;player.playbackRate=1.05;player.preservesPitch=true;player.onended=()=>{if(index+1<paths.length)play(index+1).catch(fail);else if(valid())setSpeaking(false)};player.onerror=fail;await player.play();if(valid())setSpeaking(true);else player.pause()};
       try{await play(0);return}catch{if(!valid())return}
      }
    }
    if(nativeMobile){
      try{const result=await Narrator.speak({text,language,voiceName});if(valid()){setSpeaking(!!result.spoken);if(!result.spoken)fail()}}
      catch{fail()}
      return;
    }
    const synth=window.speechSynthesis;
    const voices=synth?.getVoices().filter(v=>v.localService&&(language==='tl'?/^(tl|fil)(-|$)/i.test(v.lang):/^en(-|$)/i.test(v.lang)))||[];
    const voice=voices.find(v=>v.name===voiceName)||voices.sort((a,b)=>Number(/female|woman|zira|samantha|susan|hazel|jenny/i.test(b.name))-Number(/female|woman|zira|samantha|susan|hazel|jenny/i.test(a.name))||a.name.localeCompare(b.name))[0];
    if(!voice){fail();return}
    try{
      const utterance=new SpeechSynthesisUtterance(text);speech.current=utterance;
      utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=1.05;utterance.pitch=1;
      utterance.onstart=()=>{if(valid())setSpeaking(true)};
      utterance.onend=()=>{if(valid())setSpeaking(false)};utterance.onerror=fail;
      synth.speak(utterance);
    }catch{fail()}
  },[language,sound,stop,voiceName]);
  return {speak,stop,speaking,status};
}

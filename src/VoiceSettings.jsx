import React,{useCallback,useEffect,useState} from 'react';
import {nativeMobile} from './mobile';
import {Narrator} from './narrator';
import useOfflineNarration from './guide/useOfflineNarration';
import {hasBundledTagalog} from './guide/bundled-narration';
export default function VoiceSettings({settings,onChange}){
 const language=settings.language||'en',tl=language==='tl',selected=settings.voiceByLanguage?.[language]||'';
 const bundled=tl&&hasBundledTagalog;
 const [voices,setVoices]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const narration=useOfflineNarration({sound:true,language,voiceName:selected,sceneKey:'voice-preview'});
 const load=useCallback(async()=>{setLoading(true);setError('');try{
  const list=nativeMobile?(await Narrator.voices({language})).voices||[]:(window.speechSynthesis?.getVoices()||[]).filter(v=>v.localService&&(tl?/^(tl|fil)(-|$)/i.test(v.lang):/^en(-|$)/i.test(v.lang))).map(v=>({id:v.name,name:v.name,language:v.lang}));
  setVoices(list);
 }catch{setError(tl?'Hindi mabasa ang mga boses sa device.':'Device voices could not be loaded.')}finally{setLoading(false)}},[language,tl]);
 useEffect(()=>{load();window.speechSynthesis?.addEventListener('voiceschanged',load);return()=>window.speechSynthesis?.removeEventListener('voiceschanged',load)},[load]);
 return <section className="voice-settings"><h2>{tl?'Boses ni Bhell':'Bhell’s voice'}</h2><label className="field-label">{tl?'Naka-install na offline na boses':'Installed offline voice'}<select aria-label={tl?'Offline na boses':'Offline voice'} value={selected} onChange={e=>{narration.stop();onChange({type:'SETTING',key:'voiceByLanguage',value:{...settings.voiceByLanguage,[language]:e.target.value}})}}><option value="">{tl?'Awtomatikong pumili':'Choose automatically'}</option>{bundled&&<option value="bundled-tl">{tl?'Bhell · Tagalog (kasama sa app)':'Bhell · Tagalog (included)'}</option>}{voices.map(v=><option key={v.id} value={v.id}>{v.name} · {v.language}</option>)}</select></label>
 <div className="voice-settings-actions"><button className="secondary" disabled={!voices.length&&!bundled} onClick={()=>narration.speaking?narration.stop():narration.speak(tl?'Kumusta! Ako si Bhell. Dahan-dahan nating tuklasin ang agham.':'Hello! I’m Bhell. Take your time. Let’s explore science together.')}>{narration.speaking?(tl?'Itigil':'Stop preview'):(tl?'Pakinggan ang halimbawa':'Preview voice')}</button><button className="text-button" disabled={loading} onClick={load}>{tl?'I-refresh ang mga boses':'Refresh voices'}</button></div>
 <p className="small">{tl?'Kasama sa app ang Tagalog na boses ni Bhell at gumagana ito offline. Maaari ka ring pumili ng naka-install na Filipino voice sa telepono.':'The sound depends on the installed voice. For a different voice, install an offline English or Filipino voice in your phone’s speech settings, then refresh.'}</p>{(error||narration.status)&&<p role="status">{error||narration.status}</p>}{!loading&&!voices.length&&!bundled&&<p role="status">{tl?'Walang angkop na offline na boses. Available pa rin ang mga caption.':'No compatible offline voice is installed. Captions remain available.'}</p>}</section>;
}

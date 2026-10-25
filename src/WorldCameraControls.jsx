import React from 'react';
import {Camera,Map,MessageCircle,ArrowUp} from 'lucide-react';
import {getLanguage,t} from './i18n';
export function CameraControls({mode,onChange}){
 const first=mode==='first',tl=getLanguage()==='tl';
 return <div className="world-pov-controls"><button className="world3d-camera icon-control" aria-label={t(first?'Switch to third person':'Switch to first person')} title={tl?'Pananaw ng kamera':'Camera POV'} onClick={()=>onChange(first?'follow':'first')}><Camera size={20}/><small className="icon-counter">{first?'1st':'3rd'}</small></button><button className="world3d-camera icon-control" aria-label={t(mode==='overview'?'Follow my explorer':'View island overview')} onClick={()=>onChange(mode==='overview'?'follow':'overview')}><Map size={20}/></button></div>;
}
export function TalkButton({onTalk}){return onTalk&&<button className="world-npc-button icon-control" title={t('Talk to Bhell')} aria-label={t('Talk to Bhell')} onClick={onTalk}><MessageCircle size={21}/></button>}
export function JumpButton({onJump}){return <button className="world-jump icon-control" aria-label={t('Jump')} title={t('Jump')} onClick={onJump}><ArrowUp size={23}/></button>}

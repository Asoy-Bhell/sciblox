import React from 'react';
import {Volume2,VolumeX} from 'lucide-react';
import {t} from './i18n';
export default function BhellAudioToggle({sound,onChange,className=''}){
 const label=t(sound?'Mute Bhell':'Unmute Bhell');
 return <button type="button" className={'bhell-audio-toggle '+className} aria-label={label} title={label} aria-pressed={!sound} onClick={()=>onChange(!sound)}>{sound?<Volume2 size={19}/>:<VolumeX size={19}/>}</button>;
}

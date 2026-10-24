import React from 'react';
export default function LanguageSelector({value='en',onChange}){
 return <label className="field-label language-selector"><span>{value==='tl'?'Wika':'Language'}</span><select aria-label="Language / Wika" value={value} onChange={event=>onChange(event.target.value)}><option value="en">English</option><option value="tl">Tagalog</option></select></label>;
}

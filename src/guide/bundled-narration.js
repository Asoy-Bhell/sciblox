import manifest from './tagalog-audio.json' with {type:'json'};
export const hasBundledTagalog=Object.keys(manifest.clips||{}).length>0;
export function bundledNarration(text,language='tl'){
 if(language!=='tl')return [];
 const clips=manifest.clips||{},remainingStart=String(text).trim();
 if(clips[remainingStart])return [clips[remainingStart]];
 let remaining=remainingStart;const result=[];
 const keys=Object.keys(clips).sort((a,b)=>b.length-a.length);
 while(remaining){const key=keys.find(key=>remaining.startsWith(key));if(!key){if(/^Naabot mo ang (level|antas) \d+/i.test(remainingStart)){const fallback=clips['Naabot mo ang bagong antas! Ipagpatuloy ang pagtuklas.'];return fallback?[fallback]:[]}return []}result.push(clips[key]);remaining=remaining.slice(key.length).trim()}
 return result;
}

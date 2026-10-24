import {TAGALOG_INTERFACE} from './tagalog-interface.js';
import {TAGALOG_LESSONS} from './tagalog-lessons.js';
import {TAGALOG_TEXT} from './tagalog-text.js';
import {TAGALOG_BANK} from './tagalog-assessments.js';
import {STATION_QUESTIONS} from './station-assessments.js';
let language='en';
const dictionary={...TAGALOG_TEXT,...TAGALOG_LESSONS,...TAGALOG_INTERFACE};
for(let station=0;station<8;station++)for(let question=0;question<10;question++){
 const original=STATION_QUESTIONS[station][question],translated=TAGALOG_BANK[station][question],shift=(station+question)%4;
 dictionary[original.prompt]=translated[0];
 for(let option=0;option<4;option++)dictionary[original.options[(option+4-shift)%4]]=translated[option+1];
}
export const getLanguage=()=>language;
export function setLanguage(value){language=value==='tl'?'tl':'en';if(typeof document!=='undefined')document.documentElement.lang=language;}
const patterns=[
 [/^STATION (\d+)(.*)$/,(m,n,end)=>'ESTASYON '+n+t(end)],
 [/^Station (\d+) · (.*)$/,(m,n,name)=>'Estasyon '+n+' · '+t(name)],
 [/^Station (\d+): (.*?)( \(locked\))?$/,(m,n,name,locked)=>'Estasyon '+n+': '+t(name)+(locked?' (naka-lock)':'')],
 [/^Complete Station (\d+) to unlock$/,(m,n)=>'Tapusin ang Estasyon '+n+' upang mabuksan'],
 [/^Station (\d+)$/,(m,n)=>'Estasyon '+n],
 [/^Activity (\d+)(.*)$/,(m,n,end)=>'Gawain '+n+t(end)],
 [/^ACTIVITY (\d+)(.*)$/,(m,n,end)=>'GAWAIN '+n+t(end)],
 [/^Question (\d+)\/(\d+)$/,(m,n,total)=>'Tanong '+n+'/'+total],
 [/^(\d+) questions · Your answers save as you go. No hints during the test.$/,(m,n)=>n+' tanong · Naka-save ang bawat sagot mo. Walang pahiwatig sa pagsusulit.'],
 [/^Reviewer (\d+)\/3$/,(m,n)=>'Reviewer '+n+'/3'],
 [/^Activities · (\d+)\/(\d+) complete$/,(m,n,total)=>'Mga gawain · '+n+'/'+total+' kumpleto'],
 [/^Great work! Your next discovery is (.*)\. Follow the glowing path or choose its portal.$/,(m,name)=>'Magaling! Ang susunod mong tuklas ay '+t(name)+'. Sundan ang maliwanag na landas o piliin ang portal nito.'],
 [/^(.*)’s field journal\.$/,(m,name)=>'Talaan ni '+name+'.'],
 [/^Level (\d+)$/,(m,n)=>'Level '+n],
 [/^(\d+)\/100 XP to the next level$/,(m,n)=>n+'/100 XP bago ang susunod na level'],
 [/^Round (\d+)\/3$/,(m,n)=>'Yugto '+n+'/3'],
 [/^Parent (\d+)$/,(m,n)=>'Magulang '+n],
 [/^Offspring box (\d+)$/,(m,n)=>'Kahon ng supling '+n],
 [/^Number of (BB|Bb|bb) offspring$/,(m,g)=>'Bilang ng '+g+' na supling'],
 [/^(BB|Bb|bb) offspring \(%\)$/,(m,g)=>g+' na supling (%)'],
 [/^Number of (BB|Bb|bb) boxes$/,(m,g)=>'Bilang ng '+g+' na kahon'],
 [/^Select (.*)$/,(m,value)=>'Piliin ang '+t(value)],
 [/^Place selected card in (.*)$/,(m,value)=>'Ilagay ang napiling card sa '+t(value)],
 [/^Scan (.*)$/,(m,value)=>'Suriin ang '+t(value)],
 [/^Open (Common|Rare|Epic) egg$/,(m,rarity)=>'Buksan ang '+t(rarity).toLowerCase()+' na itlog'],
 [/^(Common|Rare|Epic) egg$/,(m,rarity)=>t(rarity)+' na itlog'],
 [/^Move hub (up|down|left|right)$/,(m,dir)=>'Lumakad '+({up:'pataas',down:'pababa',left:'pakaliwa',right:'pakanan'}[dir])],
 [/^Move (up|down|left|right)$/,(m,dir)=>'Lumakad '+({up:'pataas',down:'pababa',left:'pakaliwa',right:'pakanan'}[dir])],
 [/^Hello, (.*)!$/,(m,name)=>'Kumusta, '+t(name)+'!'],
 [/^Greet (.*)$/,(m,name)=>'Batiin ang '+t(name)],
 [/^Upgrade · (\d+) coins$/,(m,n)=>'I-upgrade · '+n+' barya'],
 [/^(\d+) coins$/,(m,n)=>n+' barya'],
 [/^Hatchery \((\d+)\)$/,(m,n)=>'Pagpapapisa ('+n+')'],
 [/^Pre-test: (.*) · Post-test: (.*)$/,(m,pre,post)=>'Paunang pagsusulit: '+pre+' · Panghuling pagsusulit: '+post],
 [/^Station reviewers(.*)$/,(m,tail)=>'Mga reviewer ng estasyon'+tail.replace('accesses left','paggamit ang natitira')],
 [/^STATION REVIEWER · (\d+) ACCESSES REMAIN$/,(m,n)=>'REVIEWER NG ESTASYON · '+n+' PAGGAMIT ANG NATITIRA'],
 [/^Welcome to Station (\d+)$/,(m,n)=>'Maligayang pagdating sa Estasyon '+n]
];
export function t(value){
 if(language!=='tl'||typeof value!=='string'||!value.trim())return value;
 const leading=value.match(/^\s*/)[0],trailing=value.match(/\s*$/)[0],key=value.trim().replace(/\s+/g,' ');
 if(dictionary[key])return leading+dictionary[key]+trailing;
 for(const [pattern,replace] of patterns)if(pattern.test(key))return leading+key.replace(pattern,replace)+trailing;
 // Preserve labels, symbols and proper names when no authored translation exists.
 return value;
}
export const hasTranslation=value=>Object.hasOwn(dictionary,value)||patterns.some(([pattern])=>pattern.test(value));

import React,{useState} from 'react';
import {Award,Lock,CheckCircle} from 'lucide-react';
import {STATIONS} from './journey-data';
import {getLanguage,t} from './i18n';
export default function AchievementBadges({state}){
 const tl=getLanguage()==='tl',[opened,setOpened]=useState(null);
 const badges=[...STATIONS.map((station,index)=>({id:'mastery-'+index,title:t(station.name),earned:state.badges.includes('Mastery: '+station.name),requirement:tl?'Tapusin ang estasyong ito na may 3 bituin: walang pagkakamali sa mga gawain.':'Finish this station with 3 stars: no mistakes in its activities.'})),{id:'final-master',title:'Genetics Master',earned:state.badges.includes('Genetics Master'),requirement:tl?'Gumawa ng Legendary o Prismatic na hayop sa Pet Fusion Challenge ng Estasyon 8.':'Create a Legendary or Prismatic pet in Station 8’s Pet Fusion Challenge.'}];
 return <section className="achievement-badges"><p>{tl?'Mga tala ito ng natapos mong pagkatuto. Pindutin ang badge upang makita kung paano ito makukuha. Hindi ito perang pang-shop.':'These record your learning milestones. Tap a badge to see how to earn it. Badges are not shop currency.'}</p><small>{badges.filter(b=>b.earned).length}/{badges.length} {tl?'nakuha':'earned'}</small><div className="achievement-grid">{badges.map(badge=><article key={badge.id} data-earned={badge.earned}><button aria-expanded={opened===badge.id} onClick={()=>setOpened(opened===badge.id?null:badge.id)}>{badge.earned?<Award size={24}/>:<Lock size={20}/>}<span>{badge.title}<small>{badge.earned?(tl?'Nakuha na':'Earned'):(tl?'Hindi pa nakukuha':'Not earned yet')}</small></span></button>{opened===badge.id&&<p>{badge.earned&&<CheckCircle size={14}/>} {badge.requirement}</p>}</article>)}</div></section>;
}

// localized-ui
import {t} from './i18n';
import React,{useEffect,useState} from 'react';
import {StoryDialog} from './AnimatedCharacter';

export default function BhellGuide({activity,completed=0,motion=true,sound=true,hint,onHint}){
 const [open,setOpen]=useState(true),[help,setHelp]=useState(false);
 useEffect(()=>{setOpen(true);setHelp(false)},[activity]);
 return <section className={'zequi-guide '+(open?'guide-open':'')} aria-label={t("Bhell NPC guide")}>{t(open?<><StoryDialog text={help?hint:completed?`Well done! You have completed ${completed} activities. Next is ${activity}. Take your time and use what you have learned.`:`Welcome, explorer! I’m Bhell. Your next activity is ${activity}. Read the instructions, then investigate. I’ll be here if you need guidance.`} speaker="Bhell" motion={motion} sound={sound}/><div className="guide-actions"><button className="primary" onClick={()=>{setOpen(false);requestAnimationFrame(()=>{const target=document.querySelector('.station-preparation')||document.querySelector('.hunt-stage')||document.querySelector('.lab-square');target?.scrollIntoView({block:'start',behavior:'auto'})})}}>{t("Let’s explore")}</button><button className="secondary" onClick={()=>{setHelp(true);onHint?.()}}>{t("Ask Bhell for guidance")}</button></div></>:<button className="secondary" onClick={()=>setOpen(true)}>{t("Talk to Bhell")}</button>)}</section>;
}

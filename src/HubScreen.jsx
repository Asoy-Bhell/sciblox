// localized-ui
import {t} from './i18n';
import React,{useState} from 'react';
import {ChevronLeft,ChevronRight,Lock,Check,Users,Play} from 'lucide-react';
import {STATIONS} from './journey-data';
import {canEnter} from './journey-state';
export function StationPicker({state,onStart}){
 const next=STATIONS.findIndex((_,i)=>!state.completed.includes(i));
 const [selected,setSelected]=useState(state.run?.index??(next<0?7:next));
 const station=STATIONS[selected],open=canEnter(state,selected),done=state.completed.includes(selected);
 return <section className="portal-picker" aria-label={t("Choose a station")}><div className="eyebrow">{t("EIGHT STATIONS · ONE JOURNEY")}</div><h1>{t("Choose a station")}</h1><div className="station-objective"><b>{t("STATION ")}{t(selected+1)}</b><h2>{t(station.name)}</h2><p>{t(station.mission)}</p></div><div className="portal-carousel"><button className="portal-chevron" aria-label={t("Previous station")} onClick={()=>setSelected((selected+7)%8)}><ChevronLeft/></button><div className={'station-portal '+(open?'portal-unlocked':'portal-locked')}><div className="portal-ring"><div className="portal-light">{t(open?<strong>{t(selected+1)}</strong>:<Lock size={60}/>)}</div></div><span className="portal-plinth"/>{t(done&&<span className="portal-complete"><Check size={16}/>{t(" Complete")}</span>)}</div><button className="portal-chevron" aria-label={t("Next station")} onClick={()=>setSelected((selected+1)%8)}><ChevronRight/></button></div><nav className="station-dots" aria-label={t("Station selection")}>{t(STATIONS.map((s,i)=><button key={s.name} aria-label={t('Station '+(i+1)+': '+s.name+(canEnter(state,i)?'':' (locked)'))} aria-current={selected===i?'true':undefined} onClick={()=>setSelected(i)}>{t(canEnter(state,i)?state.completed.includes(i)?<Check size={15}/>:i+1:<Lock size={14}/>)}</button>))}</nav><button className="primary portal-enter" disabled={!open} onClick={()=>onStart(selected)}>{t(open?<><Play size={19}/>{t(state.run?.index===selected&&state.run.phase!=='complete'?'Resume session':'Enter station')}</>:'Complete Station '+selected+' to unlock')}</button><small>{t(station.subtitle)}</small></section>;
}
export default function HubScreen({state,network,onStart,onContinue,onMode}){
 return <section className="station-selection-home"><div className="selector-sky" aria-hidden="true"><i/><i/><i/></div><StationPicker state={state} onStart={onStart}/><button className="secondary mode-switch" onClick={onMode}><Users size={17}/>{t(network.connected?'Nearby multiplayer · '+(network.players.length+1)+' players':'Solo / Multiplayer')}</button></section>;
}
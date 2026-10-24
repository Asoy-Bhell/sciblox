// localized-ui
import {t} from './i18n';
import React,{useState} from 'react';
import ProfilePortrait,{PORTRAITS} from './ProfilePortrait';
import AvatarChooser from './AvatarChooser';
export default function PlayerProfile({state,onSave,onCancel}){
 return <AvatarChooser state={state} onSave={onSave} onCancel={onCancel}/>;
}
// Retained for legacy snapshots; current routes use the matching AvatarChooser.
export function LegacyPlayerProfile({state,onSave,onCancel}){
 const [name,setName]=useState(state.name==='Explorer'?'':state.name),[gender,setGender]=useState(state.profile.gender),[picture,setPicture]=useState(state.profile.picture||'nova');
 return <section className="offline-profile"><h1>{t("Choose your profile picture")}</h1><form onSubmit={event=>{event.preventDefault();if(name.trim())onSave({name:name.trim(),profile:{avatar:'Human',gender,picture},confirm:true})}}><div className="portrait-options" role="group" aria-label={t("Human profile pictures")}>{t(PORTRAITS.map(p=><button type="button" key={p.id} aria-label={t('Choose '+p.label+' profile picture')} aria-pressed={picture===p.id} className={picture===p.id?'selected':''} onClick={()=>setPicture(p.id)}><ProfilePortrait id={p.id}/><span>{t(p.label)}</span></button>))}</div><label className="field-label">{t("Player name")}<input autoComplete="nickname" maxLength={24} required value={name} onChange={event=>setName(event.target.value)} placeholder={t("Enter your player name")}/></label><fieldset className="gender-options"><legend>{t("Gender ")}<small>{t("(optional)")}</small></legend>{t([['male','Male'],['female','Female'],['unspecified','Prefer not to say']].map(([value,label])=><label key={value}><input type="radio" name="gender" value={value} checked={gender===value} onChange={()=>setGender(value)}/><span>{t(label)}</span></label>))}</fieldset><p className="small">{t("Your picture is separate from your human character in the world. No account or subscription is needed.")}</p><button className="primary" type="submit" disabled={!name.trim()}>{t("Save profile & continue")}</button>{t(onCancel&&<button className="secondary" type="button" onClick={onCancel}>{t("Cancel")}</button>)}</form></section>;
}

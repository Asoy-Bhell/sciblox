import {t,getLanguage} from './i18n';
import React,{useState} from 'react';
import ProfilePortrait from './ProfilePortrait';
import {AVATAR_OPTIONS,avatarAppearance} from './avatar-options';
import Character3D from './Character3D';
export default function AvatarChooser({state,onSave,onCancel}){
 const tl=getLanguage()==='tl',initial=state.profile.gender==='male'?'male':'female';
 const [name,setName]=useState(state.name==='Explorer'?'':state.name),[gender,setGender]=useState(initial),[picture,setPicture]=useState(avatarAppearance(state.profile.picture,initial).id);
 const options=AVATAR_OPTIONS.filter(option=>option.gender===gender);
 const chooseGender=value=>{setGender(value);setPicture(avatarAppearance(picture,value).id)};
 return <section className="offline-profile upgraded-profile"><h1>{tl?'Piliin ang iyong avatar':'Choose your avatar'}</h1><form onSubmit={event=>{event.preventDefault();if(name.trim())onSave({name:name.trim(),profile:{avatar:'Human',gender,picture},confirm:true})}}>
 <fieldset className="gender-options"><legend>{t('Gender')}</legend>{[['male','Male'],['female','Female']].map(([value,label])=><label key={value}><input type="radio" name="gender" value={value} checked={gender===value} onChange={()=>chooseGender(value)}/><span>{t(label)}</span></label>)}</fieldset>
 <div className="portrait-options" role="group" aria-label={t('Human profile pictures')}>{options.map((p,index)=><button type="button" key={p.id} aria-label={(tl?'Piliin ang avatar ':'Choose avatar ')+(index+1)} aria-pressed={picture===p.id} className={picture===p.id?'selected':''} onClick={()=>setPicture(p.id)}><ProfilePortrait id={p.id}/></button>)}</div>
 <div className="avatar-confirmation"><Character3D size={115} gender={gender} picture={picture} motion={false} facing="down" label={tl?'Ang iyong karakter':'Your selected character'}/><label className="field-label">{t('Player name')}<input autoComplete="nickname" maxLength={24} required value={name} onChange={event=>setName(event.target.value)} placeholder={t('Enter your player name')}/></label></div>
 <button className="primary" type="submit" disabled={!name.trim()}>{t('Save profile & continue')}</button>{onCancel&&<button className="secondary" type="button" onClick={onCancel}>{t('Cancel')}</button>}
 </form></section>;
}

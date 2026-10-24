import {Capacitor} from '@capacitor/core';
import {Preferences} from '@capacitor/preferences';

export const nativeAndroid=Capacitor.getPlatform()==='android';
export const nativeMobile=Capacitor.isNativePlatform();
const key='sciblox-v1';
let pending=Promise.resolve();
export async function readProgress(){
 let value;
 if(Capacitor.isNativePlatform())value=(await Preferences.get({key})).value;
 if(!value){try{value=localStorage.getItem(key)}catch{}}
 try{return JSON.parse(value||'{}')}catch{return {}}
}
export function writeProgress(save){
 const value=JSON.stringify(save);
 try{localStorage.setItem(key,value)}catch{}
 if(!Capacitor.isNativePlatform())return Promise.resolve();
 // Serialize writes so rapidly earned rewards cannot overwrite newer progress.
 pending=pending.catch(()=>{}).then(()=>Preferences.set({key,value}));
 return pending;
}

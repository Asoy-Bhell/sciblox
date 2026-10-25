import {useCallback,useEffect,useRef,useState} from 'react';
import {Capacitor,registerPlugin} from '@capacitor/core';
import {Preferences} from '@capacitor/preferences';
import {learnerRecord,rankedRecords} from './classroom-data';
const Classroom=registerPlugin('Classroom'),key='sciblox-classroom-v1';
const fresh=()=>({studentId:crypto.randomUUID(),classId:crypto.randomUUID(),code:String(crypto.getRandomValues(new Uint32Array(1))[0]%1e6).padStart(6,'0'),role:'learner',paired:null,revision:0,ack:0,fingerprint:'',record:null,records:[]});
export default function useClassroom(state){
 const [store,setStore]=useState(null),[status,setStatus]=useState('offline'),[error,setError]=useState(''),[rooms,setRooms]=useState([]),[host,setHost]=useState(null);
 const latest=useRef({store,state});latest.current={store,state};const busy=useRef(false),writes=useRef(Promise.resolve());
 const supported=Capacitor.isNativePlatform();
 useEffect(()=>{let active=true;Preferences.get({key}).then(({value})=>{let saved;try{saved=JSON.parse(value)}catch{}if(active)setStore(saved?.studentId?{...fresh(),...saved}:fresh())}).catch(()=>{if(active){setStore(fresh());setError('Classroom settings could not be restored.')}});return()=>{active=false}},[]);
 useEffect(()=>{if(!store)return;const value=JSON.stringify(store);writes.current=writes.current.catch(()=>{}).then(()=>Preferences.set({key,value})).catch(()=>setError('Classroom settings could not be saved. Check device storage.'))},[store]);
 const fingerprint=JSON.stringify(learnerRecord(state,'fingerprint',1));
 useEffect(()=>{if(!store||store.role==='teacher'||!state.profileReady||store.fingerprint===fingerprint)return;setStore(current=>({...current,revision:current.revision+1,fingerprint,record:learnerRecord(state,current.studentId,current.revision+1)}))},[fingerprint,store?.studentId,store?.role,state.profileReady]);
 const refresh=useCallback(async()=>{try{const result=await Classroom.records();setStore(current=>current?{...current,records:result.records||[]}:current)}catch(e){setError(e.message||'Could not read class records.')}},[]);
 const sync=useCallback(async()=>{
  const current=latest.current.store;if(!supported||!current?.paired||!current.record||current.role!=='learner'||busy.current)return;
  busy.current=true;setStatus('syncing');setError('');
  try{
   const pairing=current.paired;
   const result=await Classroom.upload({...pairing,record:current.record});
   if(result.classId!==pairing.classId)throw Error('This is a different classroom. Reconnect to your teacher.');
   setStore(value=>value.paired?.classId===pairing.classId?{...value,ack:Math.max(value.ack,current.record.revision),lastSync:Date.now()}:value);setStatus('synced');
  }catch(e){setStatus('offline');setError('Saved on this device. Waiting for your classroom connection.');
   // A hotspot may assign the teacher a different address after reconnecting.
   // Rediscover only the already paired class; never send to another teacher.
   if(Capacitor.getPlatform()==='android')try{const found=await Classroom.discover();const room=found.rooms?.find(room=>room.classId===current.paired.classId);if(room&&room.address!==current.paired.address)setStore(value=>value.paired?.classId===current.paired.classId?{...value,paired:{...value.paired,address:room.address}}:value)}catch{}
  }finally{busy.current=false}
 },[supported]);
 useEffect(()=>{if(!store||!supported)return;const timer=setTimeout(sync,500);return()=>clearTimeout(timer)},[store?.record?.revision,store?.paired,sync,supported]);
 useEffect(()=>{if(!supported)return;const wake=()=>{if(!document.hidden)sync()};const timer=setInterval(wake,15_000);window.addEventListener('online',wake);document.addEventListener('visibilitychange',wake);return()=>{clearInterval(timer);window.removeEventListener('online',wake);document.removeEventListener('visibilitychange',wake)}},[sync,supported]);
 useEffect(()=>{if(!supported||store?.role!=='teacher')return;let alive=true;Classroom.start({classId:store.classId,code:store.code,name:'SciBlox classroom'}).then(result=>{if(alive){setHost(result);setStatus('hosting');refresh()}}).catch(e=>setError(e.message));const timer=setInterval(refresh,3000);return()=>{alive=false;clearInterval(timer);Classroom.stop().catch(()=>{});setHost(null)}},[store?.role,supported,refresh]);
 const discover=async()=>{setError('');setStatus('searching');try{const result=await Classroom.discover();setRooms(result.rooms||[]);if(result.manualAddress)setError(state.settings.language==='tl'?'Sa iPhone, ilagay ang address at code na ipinapakita sa device ng guro.':'On iPhone, enter the address and code shown on the teacher’s device.')}catch(e){setError(e.message)}finally{setStatus('offline')}};
 const pair=async(address,code)=>{
  if(!supported)return;setError('');setStatus('syncing');try{const result=await Classroom.upload({address,code,record:latest.current.store.record,checkOnly:true});setStore(current=>({...current,paired:{address,code,classId:result.classId},ack:0}));setStatus('offline')}catch(e){setError(e.message||'Could not connect to the teacher.');setStatus('offline')}
 };
 return {ready:!!store,supported,status,error,rooms,host,store,records:rankedRecords(store?.records||[]),sync,refresh,discover,pair,
  setRole:role=>{setError('');setStore(current=>({...current,role}))},unpair:()=>{setStore(current=>({...current,paired:null,ack:0}));setStatus('offline')}};
}

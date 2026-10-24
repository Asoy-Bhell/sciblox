export function learnerRecord(state,id,revision=1){
 const scores=Object.entries(state.stationAssessments||{}).filter(([index])=>Number(index)>=0&&Number(index)<8).map(([index,value])=>({station:Number(index),pre:Number.isInteger(value.pre)?value.pre:null,post:Number.isInteger(value.post)?value.post:null}));
 return {schema:1,id,name:String(state.name||'Explorer').slice(0,24),picture:state.profile?.picture||'nova',gender:state.profile?.gender||'unspecified',revision,completed:[...new Set(state.completed||[])].filter(n=>Number.isInteger(n)&&n>=0&&n<8),xp:Math.max(0,Math.floor(state.xp||0)),scores};
}
export function validLearnerRecord(record){
 return record?.schema===1&&typeof record.id==='string'&&/^[\w-]{8,80}$/.test(record.id)&&typeof record.name==='string'&&record.name.length>0&&record.name.length<=24&&Number.isSafeInteger(record.revision)&&record.revision>0&&Number.isSafeInteger(record.xp)&&record.xp>=0&&record.xp<1e8&&Array.isArray(record.completed)&&record.completed.length<=8&&record.completed.every(n=>Number.isInteger(n)&&n>=0&&n<8)&&Array.isArray(record.scores)&&record.scores.length<=8&&record.scores.every(s=>Number.isInteger(s.station)&&s.station>=0&&s.station<8&&[s.pre,s.post].every(n=>n===null||Number.isInteger(n)&&n>=0&&n<=10));
}
export function mergeClassRecord(records,record,receivedAt=Date.now()){
 if(!validLearnerRecord(record))return records;
 const existing=records.find(row=>row.id===record.id);
 if(existing&&existing.revision>=record.revision)return records;
 return [...records.filter(row=>row.id!==record.id),{...record,receivedAt}];
}
export function scoreSummary(record,kind){const values=record.scores.filter(s=>Number.isInteger(s[kind])).map(s=>s[kind]);return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10:null}
export function rankedRecords(records){return [...records].sort((a,b)=>b.completed.length-a.completed.length||(scoreSummary(b,'post')??-1)-(scoreSummary(a,'post')??-1)||b.xp-a.xp||a.name.localeCompare(b.name))}
export function classroomCSV(records){
 const cell=value=>'"'+String(value??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 return [['Rank','Player','Pre-test mean /10','Post-test mean /10','Stations /8','XP','Last received'],...rankedRecords(records).map((r,i)=>[i+1,r.name,scoreSummary(r,'pre'),scoreSummary(r,'post'),r.completed.length,r.xp,r.receivedAt?new Date(r.receivedAt).toISOString():''])].map(row=>row.map(cell).join(',')).join('\r\n');
}

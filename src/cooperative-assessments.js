import {assessmentQuestions,examScore} from './station-assessments.js';
const tests=()=>({pre:{answers:[],score:null},post:{answers:[],score:null}});
export function reduceCoopAssessment(state,action){
 if(action.type==='COOP_START'){
  if(typeof action.id!=='string'||!action.id||state.coopRun?.id===action.id||!Number.isInteger(action.index)||action.index<0||action.index>7)return state;
  return {...state,coopRun:{id:action.id,index:action.index,scene:0,reviewed:false,tests:tests(),credited:false}};
 }
 const run=state.coopRun;if(!run||action.id!==run.id)return state;
 if(action.type==='COOP_REVIEW_NEXT')return run.tests.pre.score===null?state:{...state,coopRun:{...run,scene:Math.min(2,run.scene+1)}};
 if(action.type==='COOP_PLAY')return run.tests.pre.score===null||run.scene!==2?state:{...state,coopRun:{...run,reviewed:true}};
 const kind=action.kind;if(!['pre','post'].includes(kind)||kind==='post'&&(!run.reviewed||!action.teamFinished))return state;
 const exam=run.tests[kind],questions=assessmentQuestions(run.index,kind);
 if(action.type==='COOP_ANSWER'){
  if(exam.score!==null||action.question!==exam.answers.length||exam.answers.length>=questions.length||!Number.isInteger(action.answer)||action.answer<0||action.answer>3)return state;
  return {...state,coopRun:{...run,tests:{...run.tests,[kind]:{...exam,answers:[...exam.answers,action.answer]}}}};
 }
 if(action.type==='COOP_ASSESS'){
  if(exam.score!==null||exam.answers.length!==questions.length)return state;
  const score=examScore(run.index,kind,exam.answers),credit=kind==='post'&&!run.credited;
  return {...state,coopRun:{...run,credited:run.credited||credit,tests:{...run.tests,[kind]:{...exam,score}}},
   stationAssessments:{...state.stationAssessments,[run.index]:{...(state.stationAssessments[run.index]||{}),[kind]:score,total:10,updatedAt:Date.now()}},
   completed:credit?[...new Set([...state.completed,run.index])]:state.completed,
   xp:state.xp+(credit?run.index<4?20:80:0),points:state.points+(credit?run.index<4?50:60:0)};
 }
 return state;
}
export function publicCoopSnapshot(state){
 return {...state,name:'Team',profile:undefined,stationAssessments:{},assessment:{pre:null,post:null},log:[],coopRun:undefined,
  run:state.run?{...state.run,tests:tests()}:null};
}
export function personalCoopState(local,shared){
 if(!shared?.run)return {...shared,settings:local.settings,profile:local.profile,name:local.name};
 const privateRun=local.coopRun?.id===shared.run.id?local.coopRun:{id:shared.run.id,index:shared.run.index,scene:0,reviewed:false,tests:tests()};
 const finished=['posttest','complete'].includes(shared.run.phase);
 const phase=privateRun.tests.pre.score===null?'pretest':!privateRun.reviewed?'review':finished?privateRun.tests.post.score===null?'posttest':'complete':['pretest','review'].includes(shared.run.phase)?'waiting':'play';
 return {...shared,name:local.name,profile:local.profile,settings:local.settings,stationAssessments:local.stationAssessments,
  run:{...shared.run,phase,scene:privateRun.scene,tests:privateRun.tests},coopWaiting:phase==='waiting'};
}

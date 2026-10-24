import test from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY,reducer} from '../src/journey-state.js';
import {assessmentQuestions} from '../src/station-assessments.js';
import {learnerRecord,validLearnerRecord,mergeClassRecord,rankedRecords,classroomCSV} from '../src/classroom-data.js';
import {publicCoopSnapshot,personalCoopState} from '../src/cooperative-assessments.js';
import {AVATAR_OPTIONS,avatarAppearance} from '../src/avatar-options.js';
import {createPlayerAvatar,disposeObject} from '../src/three-models.js';

test('record validation, idempotent merge, and ranking keep missing tests distinct from zero',()=>{
 const state={...structuredClone(EMPTY),name:'Ari',xp:20,completed:[0],stationAssessments:{0:{pre:0,post:8}}};
 const record=learnerRecord(state,'student-123',1);assert.equal(validLearnerRecord(record),true);
 assert.equal(validLearnerRecord({...record,scores:[{station:0,pre:11,post:8}]}),false);
 let rows=mergeClassRecord([],record,100);assert.equal(rows.length,1);assert.equal(mergeClassRecord(rows,record),rows);
 rows=mergeClassRecord(rows,{...record,revision:2,scores:[{station:0,pre:0,post:9}]},200);assert.equal(rows[0].scores[0].post,9);
 const incomplete=learnerRecord({...state,name:'Mika',completed:[],stationAssessments:{}},'student-456',1);
 assert.equal(rankedRecords([incomplete,...rows])[0].name,'Ari');assert.match(classroomCSV(rows),/"0","9"/);
 assert.match(classroomCSV([{...record,name:'=FORMULA'}]),/'=FORMULA/);
});
test('all avatar choices match gender and the actual world rig',()=>{
 for(const gender of ['male','female']){const options=AVATAR_OPTIONS.filter(p=>p.gender===gender);assert.equal(options.length,4);for(const option of options){const model=createPlayerAvatar({picture:option.id,gender});assert.equal(model.userData.picture,option.id);assert.equal(model.userData.gender,gender);disposeObject(model)}}
 assert.equal(avatarAppearance('luna','male').gender,'male');assert.equal(avatarAppearance('kai','female').gender,'female');
});
test('host snapshots never publish assessment answers or personal results',()=>{
 const state={...structuredClone(EMPTY),stationAssessments:{0:{pre:10}},log:[{event:'private'}],run:{id:'team',index:0,phase:'play',tests:{pre:{answers:[1,2],score:10},post:{answers:[],score:null}}}};
 const shared=publicCoopSnapshot(state);assert.deepEqual(shared.run.tests.pre.answers,[]);assert.equal(shared.run.tests.pre.score,null);assert.deepEqual(shared.stationAssessments,{});assert.deepEqual(shared.log,[]);assert.equal(state.run.tests.pre.answers.length,2);
});
test('each guest finishes their own tests; team progress cannot fill or overwrite answers',()=>{
 let state={...structuredClone(EMPTY),name:'Mika'};state=reducer(state,{type:'COOP_START',id:'team',index:0});
 const shared={...structuredClone(EMPTY),run:{id:'team',index:0,phase:'play',tests:{pre:{answers:[0,0],score:9},post:{answers:[],score:null}}}};
 assert.equal(personalCoopState(state,shared).run.phase,'pretest');assert.deepEqual(personalCoopState(state,shared).run.tests.pre.answers,[]);
 for(const [question,q]of assessmentQuestions(0,'pre').entries())state=reducer(state,{type:'COOP_ANSWER',id:'team',kind:'pre',question,answer:q.answer});
 state=reducer(state,{type:'COOP_ASSESS',id:'team',kind:'pre'});assert.equal(state.stationAssessments[0].pre,10);assert.equal(personalCoopState(state,shared).run.phase,'review');
 state=reducer(state,{type:'COOP_REVIEW_NEXT',id:'team'});state=reducer(state,{type:'COOP_REVIEW_NEXT',id:'team'});state=reducer(state,{type:'COOP_PLAY',id:'team'});
 assert.equal(personalCoopState(state,shared).run.phase,'play');
 assert.equal(reducer(state,{type:'COOP_ANSWER',id:'team',kind:'post',question:0,answer:0}),state);
 const finished={...shared,run:{...shared.run,phase:'posttest'}};assert.equal(personalCoopState(state,finished).run.phase,'posttest');
 for(const [question,q]of assessmentQuestions(0,'post').entries())state=reducer(state,{type:'COOP_ANSWER',id:'team',kind:'post',question,answer:q.answer,teamFinished:true});
 state=reducer(state,{type:'COOP_ASSESS',id:'team',kind:'post',teamFinished:true});assert.equal(state.stationAssessments[0].post,10);assert.deepEqual(state.completed,[0]);assert.equal(state.run,null);assert.equal(personalCoopState(state,finished).run.phase,'complete');assert.equal(reducer(state,{type:'COOP_ASSESS',id:'team',kind:'post',teamFinished:true}),state);
});

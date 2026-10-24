// localized-ui
import {t} from './i18n';
import React from 'react';
import {assessmentQuestions,examScore} from './station-assessments';
import {STATIONS} from './journey-data';

export default function StationAssessment({run,send}){
 const kind=run.phase==='pretest'?'pre':'post',questions=assessmentQuestions(run.index,kind),answers=run.tests[kind].answers,n=answers.length,done=n===questions.length,score=examScore(run.index,kind,answers);
 return <section className="station-assessment activity-panel" aria-label={t('Station '+(run.index+1)+' '+kind+'-test')}><div className="eyebrow">{t("STATION ")}{t(run.index+1)}{t(" · ")}{t(STATIONS[run.index].name)}</div><h2>{t(kind==='pre'?'Before this station':'After this station')}</h2><p>{t(questions.length)}{t(" questions · Your answers save as you go. No hints during the test.")}</p>{t(done?<><div className="score">{t(score)}<small>{t("/")}{t(questions.length)}</small></div>{t(kind==='post'&&<p>{t("Pre-test: ")}{t(run.tests.pre.score??'Not recorded (older saved session)')}{t("/")}{t(questions.length)}{t(" · Post-test: ")}{t(score)}{t("/")}{t(questions.length)}{t(run.tests.pre.score!==null&&<>{t(" · Change: ")}{t(score-run.tests.pre.score>=0?'+':'')}{t(score-run.tests.pre.score)}</>)}</p>)}<button className="primary" onClick={()=>send({type:'STATION_ASSESS',kind,now:Date.now()})}>{t(kind==='pre'?'Save score & meet Bhell':'Save score & finish station')}</button></>:<><div className="quiz-progress">{t("Question ")}{t(n+1)}{t("/")}{t(questions.length)}<div className="progress-track"><div style={{width:n/questions.length*100+'%'}}/></div></div><h3>{t(questions[n].prompt)}</h3><div className="answers">{t(questions[n].options.map((option,answer)=><button key={option} onClick={()=>send({type:'STATION_ANSWER',kind,question:n,answer})}>{t(String.fromCharCode(65+answer))}{t(". ")}{t(option)}</button>))}</div></>)}</section>;
}

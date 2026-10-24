import React,{useEffect,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {t} from './i18n';
import {assessmentQuestions,examScore} from './station-assessments';
export default function ReferenceAssessment({run,send}){
 const kind=run.phase==='pretest'?'pre':'post',questions=assessmentQuestions(run.index,kind),answers=run.tests[kind].answers,n=answers.length,done=n===questions.length,score=examScore(run.index,kind,answers);
 const [selection,setSelection]=useState(null);useEffect(()=>setSelection(null),[n,run.id]);
 return <section className="station-assessment reference-assessment" aria-label={t('Station '+(run.index+1)+' '+kind+'-test')}>
 <div className="assessment-heading"><h2>{t('Station')} {run.index+1} · {t(kind==='pre'?'Pre-test':'Post-test')}</h2><div className="assessment-progress"><div className="progress-track"><div style={{width:(n/10)*100+'%'}}/></div><b>{Math.min(n+1,10)} / 10</b></div></div>
 <div className="assessment-scenery" aria-hidden="true"/><div className="assessment-question-sheet">
 {done?<><h2>{score} / 10</h2>{kind==='post'&&<p>{t('Pre-test:')} {run.tests.pre.score??'—'}/10 · {t('Post-test:')} {score}/10</p>}<button className="primary" onClick={()=>send({type:'STATION_ASSESS',kind,now:Date.now()})}>{t(kind==='pre'?'Save score & meet Bhell':'Save score & finish station')}</button></>:<><span className="sr-only">Question {n+1}/10</span><h3>{t(questions[n].prompt)}</h3><div className="answers">{questions[n].options.map((option,answer)=><button key={option} aria-pressed={selection===answer} className={selection===answer?'selected-answer':''} onClick={()=>setSelection(answer)}>{String.fromCharCode(65+answer)}. {t(option)}</button>)}</div><button className="primary assessment-next" disabled={selection===null} onClick={()=>send({type:'STATION_ANSWER',kind,question:n,answer:selection})}>{t('Next')}<ArrowRight size={18}/></button></>}
 </div></section>;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {t,setLanguage,hasTranslation} from '../src/i18n.js';
import {STATION_QUESTIONS} from '../src/station-assessments.js';
import {TAGALOG_BANK} from '../src/tagalog-assessments.js';
import {normalize,EMPTY,reducer} from '../src/journey-state.js';
test('all eighty Tagalog tests preserve the correct answer after option rotation',()=>{setLanguage('tl');for(let station=0;station<8;station++)for(let index=0;index<10;index++){const en=STATION_QUESTIONS[station][index],tl=TAGALOG_BANK[station][index];assert.equal(t(en.prompt),tl[0]);assert.equal(t(en.options[en.answer]),tl[1]);for(const option of en.options)assert.ok(hasTranslation(option)||/^[0-9BPbpIV:×% ]+$/.test(option),option)}});
test('language is a local saved setting and does not reset earned progress',()=>{const s=normalize({...structuredClone(EMPTY),points:190,completed:[0,1],profile:{avatar:'Human',gender:'girl'}});const updated=reducer(s,{type:'SETTING',key:'language',value:'tl'});assert.equal(normalize(JSON.parse(JSON.stringify(updated))).settings.language,'tl');assert.equal(updated.points,190);assert.deepEqual(updated.completed,[0,1]);assert.equal(updated.profile.gender,'female');assert.equal(reducer(updated,{type:'SETTING',key:'language',value:'unknown'}),updated)});
test('English can be restored and allele notation remains unchanged in either language',()=>{setLanguage('tl');assert.equal(t('Play'),'Maglaro');for(const value of ['BB','Bb','bb','1:2:1','3:1','25%','Ari'])assert.equal(t(value),value);setLanguage('en');assert.equal(t('Play'),'Play');assert.equal(t('What is an allele?'),'What is an allele?')});

import assert from 'node:assert/strict';
import { parseReport, validateReport } from './ingest-browser-bridge-report.mjs';
let n=0;const ok=(x,m)=>{assert.ok(x,m);n++},eq=(a,b,m)=>{assert.equal(a,b,m);n++};
const mission={mission_id:'M',created_at:'2026-09-12T00:00:00Z',expires_at:'2026-09-13T00:00:00Z',allowed_hosts:['gemini.google.com','github.com'],actions:[{type:'A'},{type:'B'}]};
const good={mission_id:'M',status:'PASS',action_index:2,action_type:'COMPLETE',host:'gemini.google.com',path:'/app',error_code:'',timestamp:'2026-09-12T01:00:00Z'};
const body='HAKIM_BRIDGE_RESULT\n```json\n'+JSON.stringify(good)+'\n```';
eq(parseReport(body).status,'PASS');
let v=validateReport(good,mission,{author:'smileeyes1',owner:'smileeyes1'});eq(v.pass,true);eq(v.scope,'SMOKE_SCOPE_ONLY');
v=validateReport({...good,action_index:1},mission,{author:'smileeyes1',owner:'smileeyes1'});eq(v.pass,false);ok(v.errors.includes('PASS_BEFORE_ALL_ACTIONS'));
v=validateReport({...good,host:'evil.example'},mission,{author:'smileeyes1',owner:'smileeyes1'});eq(v.pass,false);ok(v.errors.includes('HOST_OUT_OF_SCOPE'));
v=validateReport(good,mission,{author:'someone-else',owner:'smileeyes1'});eq(v.pass,false);ok(v.errors.includes('UNTRUSTED_AUTHOR'));
v=validateReport({...good,status:'FAIL',action_index:1,action_type:'B',error_code:'X'},mission,{author:'smileeyes1',owner:'smileeyes1'});eq(v.pass,true);eq(v.scope,'FAIL_EVIDENCE_ONLY');
for(const bad of ['', 'HAKIM_BRIDGE_RESULT', 'HAKIM_BRIDGE_RESULT\n```json\n{x}\n```']){let threw=false;try{parseReport(bad)}catch{threw=true}ok(threw)}
console.log(JSON.stringify({pass:true,assertions:n,checked:['trusted owner','mission identity','all-actions-before-pass','host scope','timestamp window','fail evidence accepted without promotion','malformed reports rejected']},null,2));

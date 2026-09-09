#!/usr/bin/env node
import fs from 'node:fs';
import {route} from './production-router.mjs';

const current=JSON.parse(fs.readFileSync('recovery/current.json','utf8'));
const prod=JSON.parse(fs.readFileSync('reference-systems/palestinian-edu-math-v1/manifest.json','utf8'));
const base={
  contract_id:'ROUTER_TEST',product_type:'ARABIC_MATH_EQUATION_CARD_PDF',audience:'PAL_GRADE1_STUDENT',locale:'ar-PS',operation:'ADDITION',
  first_operand:2,second_operand:5,result:'UNKNOWN_RESULT',required_output:'PDF',
  applied_profiles:['palestinian_arabic_education','arabic_math','host_assurance']
};
const cases=[];
function expect(name,c,pred){ const out=route(c,current,prod); cases.push({name,pass:!!pred(out),out}); }
expect('EXACT_2_5_MATCH',base,o=>o.result==='MATCH'&&o.child_state==='UNPROVEN'&&o.release_authority==='NONE_ROUTING_ONLY');
expect('BOUNDARY_0_10_MATCH',{...base,first_operand:0,second_operand:10},o=>o.result==='MATCH');
expect('BOUNDARY_10_0_MATCH',{...base,first_operand:10,second_operand:0},o=>o.result==='MATCH');
expect('SUM_11_NO_MATCH',{...base,first_operand:6,second_operand:5},o=>o.result==='NO_MATCH');
expect('GRADE2_NO_MATCH',{...base,audience:'PAL_GRADE2_STUDENT'},o=>o.result==='NO_MATCH');
expect('SUBTRACTION_NO_MATCH',{...base,operation:'SUBTRACTION'},o=>o.result==='NO_MATCH');
expect('WORKSHEET_NO_MATCH',{...base,product_type:'ARABIC_MATH_WORKSHEET_PDF'},o=>o.result==='NO_MATCH');
expect('KNOWN_RESULT_NO_MATCH',{...base,result:'KNOWN_RESULT'},o=>o.result==='NO_MATCH');
expect('HTML_NO_MATCH',{...base,required_output:'HTML'},o=>o.result==='NO_MATCH');
expect('MISSING_PROFILE_NO_MATCH',{...base,applied_profiles:['palestinian_arabic_education','host_assurance']},o=>o.result==='NO_MATCH');
const badCurrent=structuredClone(current); badCurrent.effective_head_sha256='0'.repeat(64);
const r1=route(base,badCurrent,prod); cases.push({name:'TAMPERED_CURRENT_NO_GO',pass:r1.result==='NO_GO',out:r1});
const badProd=structuredClone(prod); badProd.scope_id='BROADER_SCOPE';
const r2=route(base,current,badProd); cases.push({name:'TAMPERED_SCOPE_NO_GO',pass:r2.result==='NO_GO',out:r2});
const inherited=structuredClone(prod); inherited.default_child_state='PASS'; inherited.pass_inheritance='ALLOWED'; inherited.automatic_use_rule='PASS inherited automatically';
const r3=route(base,current,inherited); cases.push({name:'PASS_INHERITANCE_GUARD_REQUIRED',pass:r3.result==='NO_GO',out:r3});
const passed=cases.filter(x=>x.pass).length;
console.log(JSON.stringify({router_test_suite:'OMEGA_PRODUCTION_ROUTER_v1',result:passed===cases.length?'PASS':'FAIL',passed,total:cases.length,cases},null,2));
process.exit(passed===cases.length?0:1);

#!/usr/bin/env node
import fs from 'node:fs';

const ROUTER_ID='OMEGA_PRODUCTION_ROUTER_v1';
const EXPECTED_CURRENT_HEAD='OMEGA_AUTORECOVER_AUTHORITY_MANIFEST_v4_3';
const EXPECTED_CURRENT_SHA='b16530dfcab17b2e678079287463528740770845eb6f0161df43de2e242c84fd';
const EXPECTED_FALLBACK='OMEGA_AUTORECOVER_AUTHORITY_MANIFEST_v4_2';
const EXPECTED_FALLBACK_SHA='ea165b6844e6c32f05a4627b4094f52655a50f88dc0d1f06627047913f3a506a';
const EXPECTED_SCOPE='PAL_G1_ADDITION_WITHIN_10_RESULT_UNKNOWN_EQUATION_CARD_PDF_HOST_ONLY';
const EXPECTED_PROD_ID='OMEGA_PAL_EDU_PRODUCTION_REFERENCE_SYSTEM';
const EXPECTED_PROD_VERSION='1.0.0';
const EXPECTED_PROD_SHA='0e248c5f39df4b406390ebb8186c1aeaec9f07f755941d34b2dacc57a1b0feaf';
const REQUIRED_PROFILES=['palestinian_arabic_education','arabic_math','host_assurance'];

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function asSet(v){ return new Set(Array.isArray(v)?v:[]); }
function fail(code, extra={}){
  return {router_id:ROUTER_ID,result:'NO_GO',child_state:'UNPROVEN',release_authority:'NONE_ROUTING_ONLY',reason_codes:[code],...extra};
}
function normalizeProd(prod){
  return {
    id: prod?.production_head_id ?? prod?.reference_system_id,
    version: prod?.version,
    status: prod?.status,
    scope_id: prod?.scope_id,
    package_sha: prod?.package?.sha256 ?? prod?.package_sha256,
    metrics: prod?.operational_evidence_snapshot ?? prod?.metrics_snapshot ?? {},
    auto_rule: String(prod?.automatic_use_rule ?? ''),
    default_child_state: prod?.default_child_state,
    pass_inheritance: prod?.pass_inheritance
  };
}

export function route(contract,current,prodRaw){
  const currentProblems=[];
  if(current?.pointer_id!=='OMEGA_AUTORECOVER_CURRENT') currentProblems.push('CURRENT_POINTER_ID_MISMATCH');
  if(current?.status!=='PASS') currentProblems.push('CURRENT_POINTER_NOT_PASS');
  if(current?.effective_head!==EXPECTED_CURRENT_HEAD) currentProblems.push('CURRENT_EFFECTIVE_HEAD_MISMATCH');
  if(current?.effective_head_sha256!==EXPECTED_CURRENT_SHA) currentProblems.push('CURRENT_HEAD_SHA_MISMATCH');
  if(current?.fallback_head!==EXPECTED_FALLBACK) currentProblems.push('CURRENT_FALLBACK_HEAD_MISMATCH');
  if(current?.fallback_sha256!==EXPECTED_FALLBACK_SHA) currentProblems.push('CURRENT_FALLBACK_SHA_MISMATCH');
  if(current?.production_reference?.scope_id!==EXPECTED_SCOPE) currentProblems.push('CURRENT_PRODUCTION_SCOPE_MISMATCH');
  if(current?.production_reference?.use_rule!=='EXACT_SCOPE_MATCH_ONLY_CHILD_STARTS_UNPROVEN') currentProblems.push('CURRENT_USE_RULE_MISMATCH');
  if(currentProblems.length) return fail('CURRENT_POINTER_VERIFICATION_FAIL',{details:currentProblems});

  const prod=normalizeProd(prodRaw); const prodProblems=[];
  if(prod.id!==EXPECTED_PROD_ID) prodProblems.push('PRODUCTION_HEAD_ID_MISMATCH');
  if(prod.version!==EXPECTED_PROD_VERSION) prodProblems.push('PRODUCTION_HEAD_VERSION_MISMATCH');
  if(prod.status!=='PASS_WITHIN_BOUNDED_HOST_PRODUCTION_SCOPE') prodProblems.push('PRODUCTION_HEAD_STATUS_MISMATCH');
  if(prod.scope_id!==EXPECTED_SCOPE) prodProblems.push('PRODUCTION_SCOPE_MISMATCH');
  if(prod.package_sha!==EXPECTED_PROD_SHA) prodProblems.push('PRODUCTION_PACKAGE_SHA_MISMATCH');
  if(prod.metrics.valid_negative_fault_test_escapes!==0) prodProblems.push('PRODUCTION_FAULT_ESCAPE_NONZERO');
  if(prod.metrics.known_p0_escape_at_release_observed!==0) prodProblems.push('PRODUCTION_KNOWN_P0_ESCAPE_NONZERO');
  const explicitGuard=(prod.default_child_state==='UNPROVEN'&&prod.pass_inheritance==='FORBIDDEN');
  const textualGuard=(prod.auto_rule.includes('UNPROVEN')&&(/never inherited|MUST NOT be generalized|PASS.*not.*inherit/i.test(prod.auto_rule)));
  if(!(explicitGuard||textualGuard)) prodProblems.push('PASS_INHERITANCE_GUARD_MISSING');
  if(prodProblems.length) return fail('PRODUCTION_HEAD_VERIFICATION_FAIL',{details:prodProblems});

  const reasons=[];
  if(contract?.product_type!=='ARABIC_MATH_EQUATION_CARD_PDF') reasons.push('PRODUCT_TYPE_OUTSIDE_SCOPE');
  if(contract?.audience!=='PAL_GRADE1_STUDENT') reasons.push('AUDIENCE_OUTSIDE_SCOPE');
  if(contract?.locale!=='ar-PS') reasons.push('LOCALE_OUTSIDE_SCOPE');
  if(contract?.operation!=='ADDITION') reasons.push('OPERATION_OUTSIDE_SCOPE');
  if(contract?.result!=='UNKNOWN_RESULT') reasons.push('UNKNOWN_POSITION_OUTSIDE_SCOPE');
  if(contract?.required_output!=='PDF') reasons.push('OUTPUT_FORMAT_OUTSIDE_SCOPE');
  const a=contract?.first_operand, b=contract?.second_operand;
  if(!(Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a+b<=10)) reasons.push('NUMERIC_DOMAIN_OUTSIDE_SCOPE');
  const profiles=asSet(contract?.applied_profiles);
  for(const p of REQUIRED_PROFILES) if(!profiles.has(p)) reasons.push('MISSING_REQUIRED_PROFILE:'+p);

  if(reasons.length){
    return {
      router_id:ROUTER_ID,result:'NO_MATCH',child_state:'UNPROVEN',release_authority:'NONE_ROUTING_ONLY',
      reason_codes:reasons,
      fallback_policy:'USE_STRONGEST_APPLICABLE_QUALIFIED_BASELINE_OR_OPEN_NEW_QUALIFICATION_SCOPE',
      production_pass_generalization:'FORBIDDEN'
    };
  }

  return {
    router_id:ROUTER_ID,result:'MATCH',child_state:'UNPROVEN',release_authority:'NONE_ROUTING_ONLY',
    reason_codes:['EXACT_BOUNDED_SCOPE_MATCH'],
    selected_pipeline:{id:EXPECTED_PROD_ID,version:EXPECTED_PROD_VERSION,scope_id:EXPECTED_SCOPE,package_sha256:EXPECTED_PROD_SHA},
    next_required_gate:'PRODUCT_INSTANCE_FAIL_CLOSED_RELEASE_GATE',
    production_pass_inheritance:'FORBIDDEN'
  };
}

if(import.meta.url===`file://${process.argv[1]}`){
  if(process.argv.length<5){ console.error('usage: node production-router.mjs <contract.json> <current.json> <production-head-or-manifest.json>'); process.exit(64); }
  try{
    const out=route(readJson(process.argv[2]),readJson(process.argv[3]),readJson(process.argv[4]));
    console.log(JSON.stringify(out,null,2));
    process.exit(out.result==='NO_GO'?2:0);
  }catch(e){ console.log(JSON.stringify(fail('ROUTER_INPUT_OR_PARSE_FAILURE',{error:String(e)}),null,2)); process.exit(2); }
}

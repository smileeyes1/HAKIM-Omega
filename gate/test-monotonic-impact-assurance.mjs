import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { computeImpactPlan } from '../runtime/impact-engine.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'omega-impact-'));
const artifact=path.join(tmp,'candidate.bin');
const sidecar=path.join(tmp,'candidate.bin.omega.json');
fs.writeFileSync(artifact,'candidate-v2\n');
const artifactHash=crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
const genomeBytes=fs.readFileSync(path.join(root,'genome','omega-dna.json'));
const genome=JSON.parse(genomeBytes);
const genomeHash=crypto.createHash('sha256').update(genomeBytes).digest('hex');
const h=s=>crypto.createHash('sha256').update(s).digest('hex');
const baselineHash=h('baseline-v1');
const changeHash=h('change-v2');
const impactHash=h('impact-plan');
const transitionHash=h('transition-evidence');

const plan=computeImpactPlan({
  direct_changes:['STUDENT_WORKSPACE_CLEARANCE_REQUIRED'],
  edges:{STUDENT_WORKSPACE_CLEARANCE_REQUIRED:['STUDENT_EYE_ALL_P0_PAGES']},
  test_catalog:{
    STUDENT_WORKSPACE_CLEARANCE_REQUIRED:['workspace-geometry'],
    STUDENT_EYE_ALL_P0_PAGES:['student-eye-regression']
  }
});
if(plan.unknown_impact_remaining||plan.impacted_invariants.length!==2||plan.required_tests.length!==2){
  throw new Error('IMPACT_ENGINE_POSITIVE_PLAN_FAILED');
}
const unknown=computeImpactPlan({direct_changes:['UNMAPPED'],edges:{},test_catalog:{}});
if(unknown.unknown_impact_remaining!==true||unknown.uncovered_impacted_invariants[0]!=='UNMAPPED'){
  throw new Error('IMPACT_ENGINE_UNKNOWN_FAIL_CLOSED_BROKEN');
}

const base={
  omega_lineage_version:'1',
  artifact_id:'IMPACT_CANDIDATE_FIXTURE',
  artifact_sha256:artifactHash,
  artifact_type:'bin',
  dna:{genome_id:genome.genome_id,genome_version:genome.genome_version,genome_sha256:genomeHash},
  parent:{kind:'artifact',id:'BASELINE_V1',sha256:baselineHash},
  applied_profiles:['monotonic_upgrade'],
  applicable_p0:['MONOTONIC_ASSURANCE','PROMOTION_REQUIRES_NO_REGRESSION'],
  evidence_refs:['IMPACT_PLAN','REGRESSION_RESULT'],
  gate:{result:'PASS',scope:'HOST_ONLY',tested_equals_delivered:true},
  claims:[],
  limitations:['CI_FIXTURE_ONLY'],
  change_assurance:{
    policy_id:'OMEGA_MONOTONIC_IMPACT_ASSURANCE_V1',
    policy_version:'1.0.0',
    baseline_id:'BASELINE_V1',
    baseline_sha256:baselineHash,
    change_id:'CHANGE_V2',
    change_sha256:changeHash,
    impact_analysis_complete:true,
    directly_changed_invariants:['STUDENT_WORKSPACE_CLEARANCE_REQUIRED'],
    impacted_invariants:['STUDENT_WORKSPACE_CLEARANCE_REQUIRED','STUDENT_EYE_ALL_P0_PAGES'],
    preserved_evidence:[
      {evidence_ref:'RTL_BASELINE_PASS',invariant:'ARABIC_NATIVE_RTL',baseline_artifact_sha256:baselineHash,scope_proof_ref:'DIFF_SCOPE_RTL_UNCHANGED'}
    ],
    invalidated_evidence:[
      {evidence_ref:'OLD_CLEARANCE_PASS',invariant:'STUDENT_WORKSPACE_CLEARANCE_REQUIRED'}
    ],
    required_tests:[
      {id:'workspace-geometry',covers:['STUDENT_WORKSPACE_CLEARANCE_REQUIRED']},
      {id:'student-eye-regression',covers:['STUDENT_EYE_ALL_P0_PAGES']}
    ],
    executed_tests:[
      {id:'workspace-geometry',result:'PASS'},
      {id:'student-eye-regression',result:'PASS'}
    ],
    unknown_impact_remaining:false,
    regression_pass:true,
    no_protected_invariant_regressed:true,
    baseline_recoverable:true,
    impact_analysis_sha256:impactHash,
    transition_evidence_sha256:transitionHash,
    test_scope_rationale_ref:'IMPACT_CLOSURE_V1',
    verification_logic_changed:false,
    known_failure_injection_detected:false,
    promotion_decision:'PASS'
  }
};

function run(label, mutate, expectPass, expectedCode){
  const x=structuredClone(base);
  mutate?.(x);
  fs.writeFileSync(sidecar,JSON.stringify(x,null,2));
  const r=spawnSync(process.execPath,[path.join(root,'gate','verify.mjs'),artifact,sidecar],{encoding:'utf8'});
  const passed=r.status===0;
  if(passed!==expectPass){console.error(label,r.stdout,r.stderr);process.exit(1);}
  if(!expectPass&&expectedCode&&!(r.stderr||'').includes(expectedCode)){
    console.error(label,'expected',expectedCode,'got',r.stderr);process.exit(1);
  }
}
run('positive',null,true);
run('reuse-impacted',x=>x.change_assurance.preserved_evidence.push({evidence_ref:'BAD',invariant:'STUDENT_EYE_ALL_P0_PAGES',baseline_artifact_sha256:baselineHash,scope_proof_ref:'BAD'}),false,'EVIDENCE_REUSE_ON_IMPACTED_INVARIANT');
run('unknown-impact',x=>{x.change_assurance.unknown_impact_remaining=true},false,'UNKNOWN_IMPACT_REMAINING');
run('missing-test-pass',x=>{x.change_assurance.executed_tests=x.change_assurance.executed_tests.filter(t=>t.id!=='workspace-geometry')},false,'REQUIRED_IMPACT_TEST_NOT_PASS');
run('uncovered-impact',x=>{x.change_assurance.required_tests=x.change_assurance.required_tests.filter(t=>t.id!=='student-eye-regression')},false,'IMPACT_INVARIANT_UNCOVERED');
run('regression',x=>{x.change_assurance.regression_pass=false},false,'REGRESSION_NOT_PASS');
run('baseline-recovery',x=>{x.change_assurance.baseline_recoverable=false},false,'BASELINE_NOT_RECOVERABLE');
run('verifier-change',x=>{x.change_assurance.verification_logic_changed=true;x.change_assurance.known_failure_injection_detected=false},false,'KNOWN_FAILURE_INJECTION_NOT_DETECTED');
run('baseline-binding',x=>{x.change_assurance.preserved_evidence[0].baseline_artifact_sha256=h('other')},false,'PRESERVED_EVIDENCE_BASELINE_MISMATCH');
fs.rmSync(tmp,{recursive:true,force:true});
console.log('MONOTONIC_IMPACT_ASSURANCE_SELF_TEST_PASS');

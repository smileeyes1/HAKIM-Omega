import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'omega-student-workspace-'));
const artifact=path.join(tmp,'student.pdf');
const sidecar=path.join(tmp,'student.pdf.omega.json');
fs.writeFileSync(artifact,'fixture-student-artifact-v1\n');
const artifactHash=crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
const genomeBytes=fs.readFileSync(path.join(root,'genome','omega-dna.json'));
const genome=JSON.parse(genomeBytes);
const genomeHash=crypto.createHash('sha256').update(genomeBytes).digest('hex');
const evidenceHash=crypto.createHash('sha256').update('geometry-evidence-v1').digest('hex');

const base={
  omega_lineage_version:'1',
  artifact_id:'STUDENT_WORKSPACE_GUARD_FIXTURE',
  artifact_sha256:artifactHash,
  artifact_type:'application/pdf',
  dna:{genome_id:genome.genome_id,genome_version:genome.genome_version,genome_sha256:genomeHash},
  parent:{kind:'contract_or_artifact',id:'STUDENT_WORKSPACE_POLICY_V1'},
  applied_profiles:['palestinian_arabic_student'],
  applicable_p0:['STUDENT_WORKSPACE_PROTECTED_ZONE','ZERO_STUDENT_WORKSPACE_OVERLAP','ZERO_UNINTENDED_STUDENT_WORKSPACE_TOUCH'],
  evidence_refs:['FIXTURE_VISUAL','FIXTURE_GEOMETRY'],
  gate:{result:'PASS',scope:'HOST_ONLY',tested_equals_delivered:true},
  claims:[],
  limitations:['CI_FIXTURE_ONLY'],
  student_workspace:{
    policy_id:'PALESTINIAN_ARABIC_STUDENT_WORKSPACE_V1',
    policy_version:'1.0.0',
    actual_output_tested:true,
    no_overlap:true,
    no_unintended_touch:true,
    no_clip:true,
    min_size_pass:true,
    clearance_pass:true,
    rtl_native:true,
    eastern_arabic_digits:true,
    known_failure_injection_detected:true,
    geometry_evidence_sha256:evidenceHash,
    visual_evidence_refs:['fixture-page-1.png'],
    minimum_clearance_mm:3,
    minimum_digit_box_width_mm:16,
    minimum_digit_box_height_mm:14
  }
};

function run(label, mutate, expectPass, expectedCode){
  const x=structuredClone(base);
  mutate?.(x);
  fs.writeFileSync(sidecar,JSON.stringify(x,null,2));
  const r=spawnSync(process.execPath,[path.join(root,'gate','verify.mjs'),artifact,sidecar],{encoding:'utf8'});
  const passed=r.status===0;
  if(passed!==expectPass){
    console.error(label,r.stdout,r.stderr);
    process.exit(1);
  }
  if(!expectPass && expectedCode && !(r.stderr||'').includes(expectedCode)){
    console.error(label,'expected failure code',expectedCode,'got',r.stderr);
    process.exit(1);
  }
}

run('positive',null,true);
run('overlap',x=>{x.student_workspace.no_overlap=false},false,'STUDENT_WORKSPACE_OVERLAP');
run('touch',x=>{x.student_workspace.no_unintended_touch=false},false,'STUDENT_WORKSPACE_TOUCH');
run('clip',x=>{x.student_workspace.no_clip=false},false,'STUDENT_WORKSPACE_CLIP');
run('undersize',x=>{x.student_workspace.minimum_digit_box_width_mm=15},false,'STUDENT_WORKSPACE_TOO_SMALL');
run('clearance',x=>{x.student_workspace.minimum_clearance_mm=2.9},false,'STUDENT_WORKSPACE_CLEARANCE_FAIL');
run('known-failure',x=>{x.student_workspace.known_failure_injection_detected=false},false,'STUDENT_WORKSPACE_KNOWN_FAILURE_NOT_DETECTED');

fs.rmSync(tmp,{recursive:true,force:true});
console.log('STUDENT_WORKSPACE_GUARD_SELF_TEST_PASS');

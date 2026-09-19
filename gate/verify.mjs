import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const dnaRoot = path.resolve(here,'..');
const [,, artifactArg, sidecarArg] = process.argv;
if (!artifactArg || !sidecarArg) throw new Error('artifact and sidecar are required');
const artifact = path.resolve(process.cwd(),artifactArg);
const sidecar = path.resolve(process.cwd(),sidecarArg);
const genomeBytes=fs.readFileSync(path.join(dnaRoot,'genome','omega-dna.json'));
const genome=JSON.parse(genomeBytes);
const genomeHash=crypto.createHash('sha256').update(genomeBytes).digest('hex');
const artifactHash=crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
const m=JSON.parse(fs.readFileSync(sidecar,'utf8'));
const fail=[];
const hex64=/^[0-9a-f]{64}$/;
if(m.dna?.genome_id!==genome.genome_id) fail.push('GENOME_ID_MISMATCH');
if(m.dna?.genome_version!==genome.genome_version) fail.push('GENOME_VERSION_MISMATCH');
if(m.dna?.genome_sha256!==genomeHash) fail.push('GENOME_HASH_MISMATCH');
if(m.artifact_sha256!==artifactHash) fail.push('ARTIFACT_HASH_MISMATCH');
if(!m.parent?.id) fail.push('PARENT_MISSING');
if(!Array.isArray(m.applied_profiles)) fail.push('PROFILES_MISSING');
if(!Array.isArray(m.evidence_refs) || m.evidence_refs.length===0) fail.push('EVIDENCE_MISSING');
if(m.gate?.result!=='PASS') fail.push('GATE_NOT_PASS');
if(m.gate?.tested_equals_delivered!==true) fail.push('TESTED_DELIVERED_NOT_PROVEN');
const forbidden=new Set(genome.claims_forbidden_without_specific_evidence||[]);
for(const c of (m.claims||[])) if(forbidden.has(c)&&m.gate?.scope!=='FIELD_AS_PROVEN') fail.push(`FORBIDDEN_CLAIM:${c}`);

const monotonicProfile=Array.isArray(m.applied_profiles) && m.applied_profiles.includes('monotonic_upgrade');
if(monotonicProfile){
  const a=m.change_assurance;
  if(!a){
    fail.push('CHANGE_ASSURANCE_MISSING');
  } else {
    if(a.policy_id!=='OMEGA_MONOTONIC_IMPACT_ASSURANCE_V1'||a.policy_version!=='1.0.0') fail.push('CHANGE_ASSURANCE_POLICY_MISMATCH');
    if(!a.baseline_id) fail.push('BASELINE_ID_MISSING');
    if(!hex64.test(a.baseline_sha256||'')) fail.push('BASELINE_SHA_INVALID');
    if(!a.change_id) fail.push('CHANGE_ID_MISSING');
    if(!hex64.test(a.change_sha256||'')) fail.push('CHANGE_SHA_INVALID');
    if(a.impact_analysis_complete!==true) fail.push('IMPACT_ANALYSIS_INCOMPLETE');
    if(!Array.isArray(a.directly_changed_invariants)) fail.push('DIRECT_CHANGE_SCOPE_MISSING');
    if(!Array.isArray(a.impacted_invariants)) fail.push('IMPACT_SCOPE_MISSING');
    if(!Array.isArray(a.preserved_evidence)) fail.push('PRESERVED_EVIDENCE_MISSING');
    if(!Array.isArray(a.invalidated_evidence)) fail.push('INVALIDATED_EVIDENCE_MISSING');
    if(!Array.isArray(a.required_tests)) fail.push('REQUIRED_TESTS_MISSING');
    if(!Array.isArray(a.executed_tests)) fail.push('EXECUTED_TESTS_MISSING');
    if(a.unknown_impact_remaining!==false) fail.push('UNKNOWN_IMPACT_REMAINING');
    if(a.regression_pass!==true) fail.push('REGRESSION_NOT_PASS');
    if(a.no_protected_invariant_regressed!==true) fail.push('PROTECTED_INVARIANT_REGRESSION');
    if(a.baseline_recoverable!==true) fail.push('BASELINE_NOT_RECOVERABLE');
    if(!hex64.test(a.impact_analysis_sha256||'')) fail.push('IMPACT_ANALYSIS_SHA_INVALID');
    if(!hex64.test(a.transition_evidence_sha256||'')) fail.push('TRANSITION_EVIDENCE_SHA_INVALID');
    if(!a.test_scope_rationale_ref) fail.push('TEST_SCOPE_RATIONALE_MISSING');
    if(a.promotion_decision!=='PASS') fail.push('PROMOTION_NOT_PASS');
    if(a.verification_logic_changed===true && a.known_failure_injection_detected!==true) fail.push('KNOWN_FAILURE_INJECTION_NOT_DETECTED');

    const impacted=new Set(a.impacted_invariants||[]);
    for(const d of (a.directly_changed_invariants||[])) if(!impacted.has(d)) fail.push(`DIRECT_CHANGE_OUTSIDE_IMPACT_CLOSURE:${d}`);
    for(const p of (a.preserved_evidence||[])){
      if(!p?.evidence_ref||!p?.invariant||!p?.scope_proof_ref) fail.push('PRESERVED_EVIDENCE_BINDING_INCOMPLETE');
      if(p?.baseline_artifact_sha256!==a.baseline_sha256) fail.push('PRESERVED_EVIDENCE_BASELINE_MISMATCH');
      if(impacted.has(p?.invariant)) fail.push(`EVIDENCE_REUSE_ON_IMPACTED_INVARIANT:${p?.invariant}`);
    }
    const passed=new Set((a.executed_tests||[]).filter(t=>t?.result==='PASS').map(t=>t.id));
    const coverage=new Set();
    for(const t of (a.required_tests||[])){
      if(!t?.id||!Array.isArray(t.covers)) fail.push('REQUIRED_TEST_INVALID');
      if(t?.id&&!passed.has(t.id)) fail.push(`REQUIRED_IMPACT_TEST_NOT_PASS:${t.id}`);
      for(const inv of (t?.covers||[])) coverage.add(inv);
    }
    for(const inv of impacted) if(!coverage.has(inv)) fail.push(`IMPACT_INVARIANT_UNCOVERED:${inv}`);
  }
}

const studentProfile=Array.isArray(m.applied_profiles) && m.applied_profiles.includes('palestinian_arabic_student');
if(studentProfile){
  const w=m.student_workspace;
  if(!w){
    fail.push('STUDENT_WORKSPACE_EVIDENCE_MISSING');
  } else {
    if(w.policy_id!=='PALESTINIAN_ARABIC_STUDENT_WORKSPACE_V1' || w.policy_version!=='1.0.0') fail.push('STUDENT_WORKSPACE_POLICY_MISMATCH');
    if(w.actual_output_tested!==true) fail.push('STUDENT_WORKSPACE_ACTUAL_OUTPUT_NOT_TESTED');
    if(w.no_overlap!==true) fail.push('STUDENT_WORKSPACE_OVERLAP');
    if(w.no_unintended_touch!==true) fail.push('STUDENT_WORKSPACE_TOUCH');
    if(w.no_clip!==true) fail.push('STUDENT_WORKSPACE_CLIP');
    if(w.min_size_pass!==true) fail.push('STUDENT_WORKSPACE_TOO_SMALL');
    if(w.clearance_pass!==true) fail.push('STUDENT_WORKSPACE_CLEARANCE_FAIL');
    if(w.rtl_native!==true) fail.push('STUDENT_WORKSPACE_RTL_FAIL');
    if(w.eastern_arabic_digits!==true) fail.push('STUDENT_WORKSPACE_DIGITS_FAIL');
    if(w.known_failure_injection_detected!==true) fail.push('STUDENT_WORKSPACE_KNOWN_FAILURE_NOT_DETECTED');
    if(!hex64.test(w.geometry_evidence_sha256||'')) fail.push('STUDENT_WORKSPACE_GEOMETRY_EVIDENCE_INVALID');
    if(!Array.isArray(w.visual_evidence_refs)||w.visual_evidence_refs.length===0) fail.push('STUDENT_WORKSPACE_VISUAL_EVIDENCE_MISSING');
    if(Number(w.minimum_clearance_mm)<3) fail.push('STUDENT_WORKSPACE_CLEARANCE_FAIL');
    if(Number(w.minimum_digit_box_width_mm)<16 || Number(w.minimum_digit_box_height_mm)<14) fail.push('STUDENT_WORKSPACE_TOO_SMALL');
  }
}
if(fail.length){console.error(JSON.stringify({status:'NO_GO',failures:fail},null,2));process.exit(1)}
console.log(JSON.stringify({status:'PASS',artifact_sha256:artifactHash,genome_sha256:genomeHash},null,2));

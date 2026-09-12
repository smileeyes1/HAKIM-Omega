import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const text = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const assert = (c, m) => { if (!c) throw new Error(m); };

export function validateSupremeIntentBinding() {
  const root = load('hakim/HAKIM_GOVERNANCE_ROOT.json');
  const contract = load('hakim/HAKIM_SUPREME_INTENT_CONTRACT.json');
  const total = load('hakim/HAKIM_TOTAL_LEADERSHIP_CONSTITUTION.json');
  const runtimeTruth = load('hakim/HAKIM_CANONICAL_RUNTIME_TRUTH.json');
  const workflow = text('.github/workflows/hakim-control-plane.yml');

  assert(root.root_id === 'HAKIM_GOVERNANCE_ROOT', 'bad governance root id');
  assert(root.status === 'ACTIVE_FAIL_CLOSED', 'governance root must fail closed');
  assert(root.canonical_instance_id === 'HAKIM_ORIGINAL_PHONE_APP', 'canonical Hakim identity drift');
  assert(root.governing_artifacts?.supreme_intent_contract === 'hakim/HAKIM_SUPREME_INTENT_CONTRACT.json', 'supreme intent contract not root-bound');
  assert(root.governing_artifacts?.canonical_runtime_truth === 'hakim/HAKIM_CANONICAL_RUNTIME_TRUTH.json', 'canonical runtime truth not root-bound');
  assert(contract.contract_id === 'HAKIM_SUPREME_INTENT_CONTRACT', 'bad supreme intent contract id');
  assert(contract.status === 'ACTIVE_GOVERNING_INTERPRETATION_CONTRACT', 'supreme intent contract inactive');
  assert(contract.trigger_semantics?.normalization_id === 'SUPREME_INTENT_MAX_VERIFIED_NET_VALUE', 'normalization id drift');
  assert(contract.trigger_semantics?.equivalent_variants_apply === true, 'equivalent trigger variants disabled');
  assert(contract.required_method?.includes('ALL_EIGHT_SCAN'), 'ALL_EIGHT missing from supreme intent method');
  assert(contract.required_method?.includes('HOW_SEVEN'), 'HOW_SEVEN missing from supreme intent method');
  assert(contract.required_method?.includes('WAW_LIMA_HAYYA'), 'WAW-LIMA-HAYYA missing from supreme intent method');
  assert(contract.required_method?.includes('WISDOM_SEVEN'), 'wisdom missing from supreme intent method');
  assert(contract.required_method?.includes('VERIFY_ACTUAL_OUTPUT'), 'actual-output verification missing');
  assert(contract.required_method?.includes('NEXT_HIGHEST_VALUE_GAP'), 'next-gap continuation missing');
  assert(contract.how_rule?.includes('عمق تكيفي'), 'adaptive HOW rule missing');
  assert(contract.deduplication_rule?.includes('LAST_VERIFIED_BASELINE'), 'baseline reuse rule missing');
  assert(contract.deduplication_rule?.includes('لا يعيد بناء ما نجح'), 'proven-success deduplication rule missing');
  assert(contract.verification_rule?.includes('الناتج الفعلي'), 'actual-output final-judge rule missing');
  assert(contract.stop_rule?.includes('لا تعلن الاكتمال'), 'false-completion guard missing');
  assert(contract.hard_boundaries?.includes('NO_BUSYWORK_OR_INFINITE_RECURSION'), 'anti-busywork boundary missing');
  assert(contract.hard_boundaries?.includes('NO_FALSE_SUCCESS_COMPLETENESS_OR_FIELD_CLAIMS'), 'false-claim boundary missing');
  assert(root.supreme_intent_binding?.required === true, 'root does not require supreme intent');
  assert(root.supreme_intent_binding?.adaptive_how_required === true, 'root does not require adaptive HOW');
  assert(root.supreme_intent_binding?.actual_output_is_final_judge === true, 'root actual-output gate missing');
  assert(root.supreme_intent_binding?.preserve_last_verified_baseline === true, 'root baseline protection missing');
  assert(root.supreme_intent_binding?.preserve_proven_success === true, 'root proven-success protection missing');
  assert(root.supreme_intent_binding?.no_busywork === true, 'root anti-busywork guard missing');
  assert(root.supreme_intent_binding?.no_authority_expansion === true, 'root authority boundary missing');
  assert(total.operating_rule?.includes('ALL_EIGHT'), 'total leadership ALL_EIGHT binding missing');
  assert(total.operating_rule?.includes('HOW_SEVEN'), 'total leadership HOW_SEVEN binding missing');

  assert(runtimeTruth.truth_id === 'HAKIM_CANONICAL_RUNTIME_TRUTH', 'bad canonical runtime truth id');
  assert(runtimeTruth.status === 'ACTIVE_FAIL_CLOSED_POINTER', 'canonical runtime truth pointer inactive');
  assert(runtimeTruth.canonical_instance_id === 'HAKIM_ORIGINAL_PHONE_APP', 'runtime truth canonical identity drift');
  assert(runtimeTruth.canonical_runtime_authority?.repository === 'smileeyes1/SovereignAssistant', 'runtime truth repository drift');
  assert(runtimeTruth.canonical_runtime_authority?.state_path === 'governance/HAKIM_ACTIVE_STATE.json', 'runtime truth state path drift');
  assert(runtimeTruth.canonical_runtime_authority?.refresh_rule?.includes('Resolve repository main at runtime'), 'runtime truth freshness rule missing');
  assert(runtimeTruth.promotion_rule?.includes('direct real-phone evidence'), 'runtime truth field-proof boundary missing');
  assert(runtimeTruth.staleness_rule?.includes('NOT_FRESH'), 'runtime truth stale-state fail-closed rule missing');
  assert(root.runtime_truth_binding?.required === true, 'root does not require runtime truth');
  assert(root.runtime_truth_binding?.fresh_resolution_required_for_phone_field_routing === true, 'fresh runtime resolution not required');
  assert(root.runtime_truth_binding?.stale_local_phone_snapshot_must_not_override_fresher_canonical_runtime === true, 'stale local snapshot precedence guard missing');
  assert(root.runtime_truth_binding?.field_pass_requires_direct_real_phone_evidence === true, 'field proof guard missing');
  assert(root.runtime_truth_binding?.no_parallel_hakim_identity === true, 'parallel Hakim identity guard missing');

  assert(workflow.includes('node runtime/validate-supreme-intent-binding.mjs'), 'CI does not load supreme intent validator');
  assert(workflow.includes('node runtime/test-supreme-intent-binding.mjs'), 'CI does not run supreme intent regression test');

  const raw = JSON.stringify({ root, contract, runtimeTruth }).toLowerCase();
  for (const forbidden of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=']) {
    assert(!raw.includes(forbidden), `possible secret marker found: ${forbidden}`);
  }

  return {
    pass: true,
    root_version: root.version,
    contract_version: contract.version,
    runtime_truth_version: runtimeTruth.version,
    normalization_id: contract.trigger_semantics.normalization_id,
    canonical_instance_id: root.canonical_instance_id,
    canonical_runtime_repository: runtimeTruth.canonical_runtime_authority.repository,
    fail_closed: true,
    actual_output_gate: true,
    adaptive_how: true,
    baseline_preserved: true,
    fresh_runtime_truth_required: true
  };
}

function main() {
  try {
    console.log(JSON.stringify(validateSupremeIntentBinding(), null, 2));
  } catch (e) {
    console.error(JSON.stringify({ pass: false, error: e.message }, null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();

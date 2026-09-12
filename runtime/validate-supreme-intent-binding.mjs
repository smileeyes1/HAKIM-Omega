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
  const workflow = text('.github/workflows/hakim-control-plane.yml');

  assert(root.root_id === 'HAKIM_GOVERNANCE_ROOT', 'bad governance root id');
  assert(root.status === 'ACTIVE_FAIL_CLOSED', 'governance root must fail closed');
  assert(root.canonical_instance_id === 'HAKIM_ORIGINAL_PHONE_APP', 'canonical Hakim identity drift');
  assert(root.governing_artifacts?.supreme_intent_contract === 'hakim/HAKIM_SUPREME_INTENT_CONTRACT.json', 'supreme intent contract not root-bound');
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
  assert(workflow.includes('node runtime/validate-supreme-intent-binding.mjs'), 'CI does not load supreme intent validator');
  assert(workflow.includes('node runtime/test-supreme-intent-binding.mjs'), 'CI does not run supreme intent regression test');

  const raw = JSON.stringify({ root, contract }).toLowerCase();
  for (const forbidden of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=']) {
    assert(!raw.includes(forbidden), `possible secret marker found: ${forbidden}`);
  }

  return {
    pass: true,
    root_version: root.version,
    contract_version: contract.version,
    normalization_id: contract.trigger_semantics.normalization_id,
    canonical_instance_id: root.canonical_instance_id,
    fail_closed: true,
    actual_output_gate: true,
    adaptive_how: true,
    baseline_preserved: true
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

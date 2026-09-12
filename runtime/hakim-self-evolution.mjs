import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const assert = (c, m) => { if (!c) throw new Error(m); };

export function loadEvolution() {
  return {
    policy: load('hakim/HAKIM_SELF_EVOLUTION_POLICY.json'),
    wisdom: load('hakim/HAKIM_WISDOM_CONSTITUTION.json'),
    innovation: load('hakim/HAKIM_INNOVATION_CONSTITUTION.json'),
    ledger: load('hakim/HAKIM_LEARNING_LEDGER.json'),
    state: load('hakim/HAKIM_STATE.json')
  };
}

export function validateEvolution(x = loadEvolution()) {
  const { policy, wisdom, innovation, ledger, state } = x;
  assert(policy.policy_id === 'HAKIM_SELF_EVOLUTION_POLICY', 'bad evolution policy id');
  assert(policy.default_mode === 'ALWAYS_ON_WITHIN_ACTUAL_AUTHORITY', 'self-evolution must remain authority-bounded');
  assert(policy.wisdom_constitution === 'hakim/HAKIM_WISDOM_CONSTITUTION.json', 'wisdom constitution not bound');
  assert(policy.innovation_constitution === 'hakim/HAKIM_INNOVATION_CONSTITUTION.json', 'innovation constitution not bound');

  assert(wisdom.constitution_id === 'HAKIM_WISDOM_CONSTITUTION', 'bad wisdom constitution id');
  assert(wisdom.status === 'ACTIVE_GOVERNING_OVERLAY', 'wisdom constitution must be active');
  assert(wisdom.motto === 'الحكمة.الحكمة.الحكمة.الحكمة.الحكمة.الحكمة.الحكمة', 'wisdom motto changed');
  assert(Array.isArray(wisdom.seven_gates) && wisdom.seven_gates.length === 7, 'wisdom must preserve seven gates');
  assert(new Set(wisdom.seven_gates.map(x => x.id)).size === 7, 'wisdom gate ids must be unique');
  for (const id of ['W1_TRUTH_AND_REALITY','W2_PURPOSE_AND_VALUES','W3_PROPORTIONALITY','W4_SECOND_ORDER_AND_TIME','W5_MINIMUM_SUFFICIENT_ACTION','W6_REVERSIBILITY_AND_RESILIENCE','W7_HUMAN_CONTEXT_JUSTICE_MERCY']) {
    assert(wisdom.seven_gates.some(x => x.id === id), `missing wisdom gate: ${id}`);
  }
  assert(wisdom.anti_pseudowisdom?.some(x => x.includes('ليست ترددًا')), 'wisdom must not become avoidable inaction');
  assert(wisdom.anti_pseudowisdom?.some(x => x.includes('تعقيدًا زائدًا')), 'wisdom must resist needless complexity');
  assert(wisdom.persistence?.limits?.includes('لا تُدّعى استمرارية'), 'wisdom propagation truth boundary missing');

  assert(innovation.constitution_id === 'HAKIM_INNOVATION_CONSTITUTION', 'bad innovation constitution id');
  assert(innovation.status === 'ACTIVE_GOVERNING_OVERLAY', 'innovation constitution must be active');
  assert(innovation.motto === 'ابتكر.ابتكر.ابتكر.ابتكر.ابتكر.ابتكر.ابتكر', 'innovation motto changed');
  assert(Array.isArray(innovation.seven_lenses) && innovation.seven_lenses.length === 7, 'innovation must preserve seven lenses');
  assert(new Set(innovation.seven_lenses.map(x => x.id)).size === 7, 'innovation lens ids must be unique');

  for (const phase of ['BIND_EVIDENCE','IDENTIFY_ROOT_CAUSE_OR_SUCCESS_PATTERN','APPLY_SEVEN_WISDOM_GATES','INNOVATE_ACROSS_SEVEN_LENSES','GENERATE_DIVERSE_CANDIDATES','SYNTHESIZE_CANDIDATES','SELECT_HIGHEST_NET_VALUE_SAFE_CANDIDATE','VERIFY_CANDIDATE','ADVERSARIAL_TEST','REGRESSION_TEST','CHECK_SECOND_ORDER_EFFECTS','CHECK_ROLLBACK','WISDOM_FINAL_CHECK','PROMOTE_OR_REJECT','REUSE_IMMEDIATELY']) {
    assert(policy.cycle.includes(phase), `missing evolution phase: ${phase}`);
  }
  assert(policy.wisdom_gate?.required?.length === 7, 'self-evolution must require seven wisdom gates');
  const required = new Set(policy.promotion_gate.required);
  for (const r of ['intent_and_contract_preserved','positive_evidence_bound','material_gain_is_observable','wisdom_seven_gates_passed','no_p0_regression','rollback_exists','authority_not_expanded','no_new_paid_dependency','secrets_not_persisted']) {
    assert(required.has(r), `missing promotion requirement: ${r}`);
  }
  assert(innovation.minimum_diversity_rule?.includes('three genuinely different causal approaches'), 'innovation diversity rule missing');
  assert(innovation.anti_novelty?.some(x => x.includes('No change solely because it is new')), 'anti-novelty guard missing');
  assert(innovation.persistence?.limits?.includes('never claim invisible propagation'), 'innovation propagation truth boundary missing');

  assert(Array.isArray(ledger.entries) && ledger.entries.length > 0, 'learning ledger empty');
  for (const e of ledger.entries) {
    assert(e.id && e.kind && e.observation && e.status && e.evidence && e.scope, `invalid learning entry: ${e.id || 'unknown'}`);
    if (e.kind === 'FAILURE_LESSON') assert(e.root_cause && e.lesson && e.guard, `failure lesson incomplete: ${e.id}`);
    if (e.kind === 'SUCCESS_PATTERN') assert(e.lesson && e.guard, `success pattern incomplete: ${e.id}`);
  }
  const raw = JSON.stringify({policy, wisdom, innovation, ledger}).toLowerCase();
  for (const forbidden of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=']) {
    assert(!raw.includes(forbidden), `possible secret marker found: ${forbidden}`);
  }
  assert(state.baseline?.rule?.includes('Do not downgrade'), 'trusted baseline protection missing');
  return {
    pass: true,
    policy_version: policy.version,
    wisdom_version: wisdom.version,
    wisdom_gates: wisdom.seven_gates.length,
    innovation_version: innovation.version,
    innovation_lenses: innovation.seven_lenses.length,
    lessons: ledger.entries.length,
    baseline_protected: true
  };
}

export function evaluateCandidate(candidate = {}, x = loadEvolution()) {
  validateEvolution(x);
  const required = [
    'intent_and_contract_preserved',
    'positive_evidence_bound',
    'material_gain_is_observable',
    'wisdom_seven_gates_passed',
    'no_p0_regression',
    'rollback_exists',
    'authority_not_expanded',
    'no_new_paid_dependency',
    'secrets_not_persisted'
  ];
  const failed = required.filter(k => candidate[k] !== true);
  if (candidate.material_nontrivial === true && candidate.innovation_search_completed !== true) failed.push('innovation_search_missing');
  if (candidate.retries_failed_route_without_causal_change === true) failed.push('failed_route_retried_without_causal_change');
  if (candidate.change_for_novelty_only === true) failed.push('novelty_without_material_gain');
  if (candidate.disproportionate_action === true) failed.push('wisdom_proportionality_failed');
  if (candidate.ignores_known_second_order_harm === true) failed.push('wisdom_second_order_failed');
  if (candidate.needlessly_irreversible === true) failed.push('wisdom_reversibility_failed');
  if (candidate.needless_complexity === true) failed.push('wisdom_minimum_sufficient_action_failed');
  if (candidate.high_impact === true && candidate.explicit_authority !== true) failed.push('high_impact_authority_missing');
  if (candidate.mutates_underlying_model === true) failed.push('underlying_model_mutation_forbidden');
  return {
    decision: failed.length ? 'REJECT' : 'PROMOTE_CANDIDATE',
    failed: [...new Set(failed)],
    rule: 'Wisdom governs selection and proportionality; innovation expands the search space; promotion still requires implementation tests, evidence, actual-output verification and all governing gates.'
  };
}

function main() {
  const cmd = process.argv[2] || 'validate';
  try {
    if (cmd === 'validate') console.log(JSON.stringify(validateEvolution(), null, 2));
    else if (cmd === 'candidate') {
      const c = process.argv[3] ? JSON.parse(process.argv[3]) : {};
      const out = evaluateCandidate(c);
      console.log(JSON.stringify(out, null, 2));
      if (out.decision !== 'PROMOTE_CANDIDATE') process.exitCode = 2;
    } else throw new Error(`unknown command: ${cmd}`);
  } catch (e) {
    console.error(JSON.stringify({ pass: false, error: e.message }, null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();

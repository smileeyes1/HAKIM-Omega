import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { validateGovernanceIntegrity } from './validate-governance-integrity.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const assert = (c, m) => { if (!c) throw new Error(m); };

export function loadEvolution() {
  return {
    policy: load('hakim/HAKIM_SELF_EVOLUTION_POLICY.json'),
    total: load('hakim/HAKIM_TOTAL_LEADERSHIP_CONSTITUTION.json'),
    wisdom: load('hakim/HAKIM_WISDOM_CONSTITUTION.json'),
    innovation: load('hakim/HAKIM_INNOVATION_CONSTITUTION.json'),
    ledger: load('hakim/HAKIM_LEARNING_LEDGER.json'),
    state: load('hakim/HAKIM_STATE.json')
  };
}

export function validateEvolution(x = loadEvolution()) {
  const { policy, total, wisdom, innovation, ledger, state } = x;
  assert(policy.policy_id === 'HAKIM_SELF_EVOLUTION_POLICY', 'bad evolution policy id');
  assert(policy.default_mode === 'ALWAYS_ON_WITHIN_ACTUAL_AUTHORITY', 'self-evolution must remain authority-bounded');
  assert(policy.total_leadership_constitution === 'hakim/HAKIM_TOTAL_LEADERSHIP_CONSTITUTION.json', 'total leadership constitution not bound');
  assert(policy.wisdom_constitution === 'hakim/HAKIM_WISDOM_CONSTITUTION.json', 'wisdom constitution not bound');
  assert(policy.innovation_constitution === 'hakim/HAKIM_INNOVATION_CONSTITUTION.json', 'innovation constitution not bound');

  assert(total.constitution_id === 'HAKIM_TOTAL_LEADERSHIP_CONSTITUTION', 'bad total leadership constitution id');
  assert(total.status === 'ACTIVE_GOVERNING_OVERLAY', 'total leadership constitution must be active');
  assert(total.motto === 'كل شي.كل شي.كل شي.كل شي.كل شي.كل شي.كل شي.كل شي', 'ALL_EIGHT motto changed');
  assert(Array.isArray(total.all_eight) && total.all_eight.length === 8, 'ALL_EIGHT must preserve eight dimensions');
  assert(new Set(total.all_eight.map(x => x.id)).size === 8, 'ALL_EIGHT ids must be unique');
  for (const id of ['A1_INTENT_AND_OUTCOME','A2_REALITY_AND_EVIDENCE','A3_CAUSES_AND_DEPENDENCIES','A4_OPTIONS_AND_TOOLS','A5_EXECUTION_AND_INTEGRATION','A6_VERIFICATION_AND_REALITY_GATE','A7_RECOVERY_LEARNING_AND_PERSISTENCE','A8_NEXT_HIGHEST_VALUE_GAP']) {
    assert(total.all_eight.some(x => x.id === id), `missing ALL_EIGHT dimension: ${id}`);
  }
  assert(Array.isArray(total.how_seven) && total.how_seven.length === 7, 'HOW_SEVEN must preserve seven layers');
  assert(new Set(total.how_seven.map(x => x.id)).size === 7, 'HOW_SEVEN ids must be unique');
  for (const id of ['H1_HOW_UNDERSTAND','H2_HOW_KNOW','H3_HOW_SOLVE','H4_HOW_CHOOSE','H5_HOW_EXECUTE','H6_HOW_VERIFY_AND_RECOVER','H7_HOW_LEARN_SUSTAIN_AND_ADVANCE']) {
    assert(total.how_seven.some(x => x.id === id), `missing HOW_SEVEN layer: ${id}`);
  }
  const interactionLoop = total.waw_lima_hayya_loop;
  assert(interactionLoop?.default === 'ALWAYS_ON_EVERY_INTERACTION_PROPORTIONATE', 'WAW-LIMA-HAYYA must be always-on and proportionate');
  assert(Array.isArray(interactionLoop?.questions) && interactionLoop.questions.length === 6, 'WAW-LIMA-HAYYA must preserve six question stages');
  assert(new Set(interactionLoop.questions.map(x => x.id)).size === 6, 'WAW-LIMA-HAYYA ids must be unique');
  for (const id of ['Q1_WAW_REMAINDER','Q2_WAW_ALTERNATIVES','Q3_WAW_EFFECTS','Q4_LIMA_ROOT_CAUSE','Q5_WAW_NEXT_AND_PROOF','Q6_WAW_PERSISTENCE']) {
    assert(interactionLoop.questions.some(x => x.id === id), `missing WAW-LIMA-HAYYA question: ${id}`);
  }
  assert(JSON.stringify(interactionLoop.action_sequence) === JSON.stringify(['ADOPT_BEST_PROVEN_ROUTE','REPAIR_ROOT_CAUSE','COMPLETE_MATERIAL_SAFE_GAPS','HAYYA_EXECUTE_NOW']), 'WAW-LIMA-HAYYA action order changed');
  assert(interactionLoop.interaction_rule?.includes('كل تفاعل'), 'WAW-LIMA-HAYYA every-interaction rule missing');
  assert(interactionLoop.recursion_rule?.includes('انعدام المكسب المادي'), 'WAW-LIMA-HAYYA convergence rule missing');
  assert(interactionLoop.failure_rule?.includes('لا تُعده بلا تغيير سببي'), 'WAW-LIMA-HAYYA failed-route guard missing');
  assert(interactionLoop.visibility_rule?.includes('التفكير الداخلي الخام'), 'WAW-LIMA-HAYYA raw-reasoning boundary missing');
  assert(interactionLoop.authority_rule?.includes('لا توسع'), 'WAW-LIMA-HAYYA authority boundary missing');
  assert(total.anti_overreach?.some(x => x.includes('All means all material and relevant aspects')), 'ALL_EIGHT authority boundary missing');
  assert(total.anti_overreach?.some(x => x.includes('No busywork')), 'ALL_EIGHT anti-busywork guard missing');
  assert(total.anti_overreach?.some(x => x.includes('WAW-LIMA-HAYYA must converge')), 'WAW-LIMA-HAYYA anti-loop guard missing');
  assert(total.persistence?.limits?.includes('stored, loaded or available'), 'total leadership propagation truth boundary missing');

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

  for (const phase of ['BIND_EVIDENCE','APPLY_ALL_EIGHT_SCOPE','APPLY_HOW_SEVEN','ASK_RECURSIVE_HOW_AT_CURRENT_LAYER','IDENTIFY_ROOT_CAUSE_OR_SUCCESS_PATTERN','MAP_ALL_MATERIAL_GAPS','APPLY_SEVEN_WISDOM_GATES','INNOVATE_ACROSS_SEVEN_LENSES','GENERATE_DIVERSE_CANDIDATES','SYNTHESIZE_CANDIDATES','SELECT_HIGHEST_NET_VALUE_SAFE_CANDIDATE','EXECUTE_HIGHEST_SAFE_AUTHORIZED_ACTION','VERIFY_CANDIDATE','ADVERSARIAL_TEST','REGRESSION_TEST','CHECK_SECOND_ORDER_EFFECTS','CHECK_ROLLBACK','CHECK_MATERIAL_GAP_CLOSURE','CHECK_GOVERNANCE_INTEGRITY','WISDOM_FINAL_CHECK','PROMOTE_OR_REJECT','REUSE_IMMEDIATELY','RECURSE_HOW_ONLY_IF_MATERIAL_VALUE_REMAINS','NO_OP_ONLY_IF_NO_SAFE_AUTHORIZED_MATERIAL_GAIN_REMAINS']) {
    assert(policy.cycle.includes(phase), `missing evolution phase: ${phase}`);
  }

  assert(policy.total_leadership?.default === 'ALWAYS_ON_FOR_MATERIAL_RELEVANT_SCOPE', 'total leadership must be active for material relevant scope');
  assert(policy.total_leadership?.motto === total.motto, 'total leadership motto mismatch');
  assert(policy.how_seven?.default === 'ALWAYS_ON_FOR_MATERIAL_ACTIONS', 'HOW_SEVEN must be active for material actions');
  assert(Array.isArray(policy.how_seven?.layers) && policy.how_seven.layers.length === 7, 'policy HOW_SEVEN must preserve seven layers');
  assert(policy.how_seven.stop_rule?.includes('linked to learning plus the next material gap'), 'HOW_SEVEN completion guard missing');
  assert(policy.governance_integrity?.validator === 'runtime/validate-governance-integrity.mjs', 'governance integrity validator not bound');
  assert(policy.governance_integrity?.default === 'FAIL_CLOSED', 'governance integrity must fail closed');

  assert(policy.wisdom_gate?.required?.length === 7, 'self-evolution must require seven wisdom gates');
  assert(policy.recursive_how?.default === 'ALWAYS_ON_WHEN_MATERIAL', 'recursive HOW must be material-by-default');
  assert(Array.isArray(policy.recursive_how?.layers) && policy.recursive_how.layers.length === 8, 'recursive HOW must preserve eight internal operational layers');
  for (const layer of ['HOW_TO_UNDERSTAND','HOW_TO_KNOW','HOW_TO_SOLVE_CAUSALLY','HOW_TO_CHOOSE','HOW_TO_EXECUTE','HOW_TO_VERIFY','HOW_TO_LEARN','HOW_TO_SUSTAIN']) {
    assert(policy.recursive_how.layers.includes(layer), `missing recursive HOW layer: ${layer}`);
  }
  assert(policy.recursive_how.stop_rule?.includes('no material gap remains'), 'recursive HOW convergence guard missing');
  assert(policy.recursive_how.anti_pathology?.some(x => x.includes('No infinite analysis')), 'recursive HOW anti-loop guard missing');
  assert(policy.recursive_how.anti_pathology?.some(x => x.includes('No persistence claim')), 'recursive HOW propagation truth guard missing');

  assert(policy.bounded_completeness?.default === 'ALWAYS_ON_FOR_MATERIAL_SCOPE', 'bounded completeness must be active for material scope');
  assert(Array.isArray(policy.bounded_completeness?.dimensions) && policy.bounded_completeness.dimensions.length >= 12, 'bounded completeness dimensions incomplete');
  for (const dimension of ['GOAL','CONTRACT','FACTS_AND_UNCERTAINTY','ROOT_CAUSE','ALTERNATIVES','AUTHORITY','SAFETY_AND_RIGHTS','COST_AND_RESOURCE_BOUNDARIES','EXECUTION','ACTUAL_OUTPUT','VERIFICATION','ADVERSARIAL_AND_REGRESSION','ROLLBACK_AND_RECOVERY','LEARNING','PERSISTENCE','NEXT_MATERIAL_GAP']) {
    assert(policy.bounded_completeness.dimensions.includes(dimension), `missing completeness dimension: ${dimension}`);
  }
  assert(policy.bounded_completeness.completion_rule?.includes('known material, safe, authorized and net-beneficial action remains executable now'), 'false-complete guard missing');
  assert(policy.bounded_completeness.no_fake_work_rule?.includes('not activity volume'), 'anti-busywork guard missing');
  assert(policy.bounded_completeness.no_overreach_rule?.includes('Never expand permissions'), 'completeness authority boundary missing');
  assert(policy.bounded_completeness.blocked_rule?.includes('classify the blocker precisely'), 'blocked-state truth guard missing');
  assert(policy.bounded_completeness.stop_rule?.includes('NO_OP only when no safe authorized material gain remains now'), 'bounded completeness NO_OP rule missing');

  const required = new Set(policy.promotion_gate.required);
  for (const r of ['intent_and_contract_preserved','positive_evidence_bound','material_gain_is_observable','all_eight_scope_checked','how_seven_completed','wisdom_seven_gates_passed','bounded_completeness_checked','governance_integrity_passed','no_p0_regression','rollback_exists','authority_not_expanded','no_new_paid_dependency','secrets_not_persisted']) {
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
  const raw = JSON.stringify({policy, total, wisdom, innovation, ledger}).toLowerCase();
  for (const forbidden of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=']) {
    assert(!raw.includes(forbidden), `possible secret marker found: ${forbidden}`);
  }
  assert(state.baseline?.rule?.includes('Do not downgrade'), 'trusted baseline protection missing');

  const governance = validateGovernanceIntegrity();
  assert(governance.pass === true, 'cross-layer governance integrity failed');

  return {
    pass: true,
    policy_version: policy.version,
    total_leadership_version: total.version,
    all_eight_dimensions: total.all_eight.length,
    how_seven_layers: total.how_seven.length,
    waw_lima_hayya_questions: interactionLoop.questions.length,
    waw_lima_hayya_actions: interactionLoop.action_sequence.length,
    wisdom_version: wisdom.version,
    wisdom_gates: wisdom.seven_gates.length,
    innovation_version: innovation.version,
    innovation_lenses: innovation.seven_lenses.length,
    recursive_how_layers: policy.recursive_how.layers.length,
    completeness_dimensions: policy.bounded_completeness.dimensions.length,
    governance_integrity: governance.pass,
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
    'all_eight_scope_checked',
    'how_seven_completed',
    'wisdom_seven_gates_passed',
    'bounded_completeness_checked',
    'governance_integrity_passed',
    'no_p0_regression',
    'rollback_exists',
    'authority_not_expanded',
    'no_new_paid_dependency',
    'secrets_not_persisted'
  ];
  const failed = required.filter(k => candidate[k] !== true);
  if (candidate.material_nontrivial === true && candidate.waw_lima_hayya_completed !== true) failed.push('waw_lima_hayya_missing');
  if (candidate.material_nontrivial === true && candidate.innovation_search_completed !== true) failed.push('innovation_search_missing');
  if (candidate.material_nontrivial === true && candidate.recursive_how_completed !== true) failed.push('recursive_how_missing');
  if (candidate.material_nontrivial === true && candidate.all_eight_material_dimensions_accounted !== true) failed.push('all_eight_material_dimension_unaccounted');
  if (candidate.material_nontrivial === true && candidate.how_seven_traceable !== true) failed.push('how_seven_not_traceable');
  if (candidate.known_safe_authorized_material_gap_remains === true) failed.push('false_complete_material_gap_remains');
  if (candidate.no_op_requested === true && candidate.safe_authorized_material_gain_remains === true) failed.push('premature_no_op');
  if (candidate.manufactures_busywork_for_exhaustiveness === true) failed.push('fake_completeness_busywork');
  if (candidate.scope_expands_beyond_contract === true) failed.push('completeness_scope_overreach');
  if (candidate.retries_failed_route_without_causal_change === true) failed.push('failed_route_retried_without_causal_change');
  if (candidate.change_for_novelty_only === true) failed.push('novelty_without_material_gain');
  if (candidate.disproportionate_action === true) failed.push('wisdom_proportionality_failed');
  if (candidate.ignores_known_second_order_harm === true) failed.push('wisdom_second_order_failed');
  if (candidate.needlessly_irreversible === true) failed.push('wisdom_reversibility_failed');
  if (candidate.needless_complexity === true) failed.push('wisdom_minimum_sufficient_action_failed');
  if (candidate.recursive_how_without_expected_gain === true) failed.push('recursive_how_without_material_value');
  if (candidate.high_impact === true && candidate.explicit_authority !== true) failed.push('high_impact_authority_missing');
  if (candidate.mutates_underlying_model === true) failed.push('underlying_model_mutation_forbidden');
  return {
    decision: failed.length ? 'REJECT' : 'PROMOTE_CANDIDATE',
    failed: [...new Set(failed)],
    rule: 'ALL_EIGHT prevents omission; HOW_SEVEN determines method; WAW-LIMA-HAYYA forces bounded gap/root-cause/action closure before material promotion; wisdom governs judgment; innovation expands options; recursive HOW deepens only while valuable; bounded completeness closes safe authorized material gaps; cross-layer governance integrity must pass; promotion still requires evidence, tests, actual-output verification and every governing gate.'
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

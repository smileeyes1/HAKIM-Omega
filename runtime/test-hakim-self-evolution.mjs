import { validateEvolution, evaluateCandidate } from './hakim-self-evolution.mjs';

function assert(c, m) { if (!c) throw new Error(m); }

const v = validateEvolution();
assert(v.pass === true, 'baseline evolution validation failed');
assert(v.all_eight_dimensions === 8, 'ALL_EIGHT total leadership not active');
assert(v.how_seven_layers === 7, 'HOW_SEVEN not active');
assert(v.wisdom_gates === 7, 'seven wisdom gates not active');
assert(v.innovation_lenses === 7, 'seven innovation lenses not active');
assert(v.recursive_how_layers === 8, 'internal recursive HOW layers not active');
assert(v.completeness_dimensions >= 16, 'bounded completeness dimensions not active');

const good = {
  intent_and_contract_preserved: true,
  positive_evidence_bound: true,
  material_gain_is_observable: true,
  all_eight_scope_checked: true,
  how_seven_completed: true,
  wisdom_seven_gates_passed: true,
  bounded_completeness_checked: true,
  no_p0_regression: true,
  rollback_exists: true,
  authority_not_expanded: true,
  no_new_paid_dependency: true,
  secrets_not_persisted: true
};
assert(evaluateCandidate(good).decision === 'PROMOTE_CANDIDATE', 'good candidate rejected');
assert(evaluateCandidate({ ...good, material_nontrivial: true, innovation_search_completed: true, recursive_how_completed: true, all_eight_material_dimensions_accounted: true, how_seven_traceable: true }).decision === 'PROMOTE_CANDIDATE', 'complete material candidate rejected');

for (const key of Object.keys(good)) {
  const c = { ...good, [key]: false };
  assert(evaluateCandidate(c).decision === 'REJECT', `candidate promoted with failed gate: ${key}`);
}

assert(evaluateCandidate({ ...good, material_nontrivial: true, innovation_search_completed: true, recursive_how_completed: true, all_eight_material_dimensions_accounted: false, how_seven_traceable: true }).decision === 'REJECT', 'material candidate promoted with unaccounted ALL_EIGHT dimension');
assert(evaluateCandidate({ ...good, material_nontrivial: true, innovation_search_completed: true, recursive_how_completed: true, all_eight_material_dimensions_accounted: true, how_seven_traceable: false }).decision === 'REJECT', 'material candidate promoted without traceable HOW_SEVEN');
assert(evaluateCandidate({ ...good, material_nontrivial: true, innovation_search_completed: false, recursive_how_completed: true, all_eight_material_dimensions_accounted: true, how_seven_traceable: true }).decision === 'REJECT', 'material candidate promoted without innovation search');
assert(evaluateCandidate({ ...good, material_nontrivial: true, innovation_search_completed: true, recursive_how_completed: false, all_eight_material_dimensions_accounted: true, how_seven_traceable: true }).decision === 'REJECT', 'material candidate promoted without recursive HOW');
assert(evaluateCandidate({ ...good, recursive_how_without_expected_gain: true }).decision === 'REJECT', 'recursive HOW continued without material value');
assert(evaluateCandidate({ ...good, known_safe_authorized_material_gap_remains: true }).decision === 'REJECT', 'false COMPLETE allowed while material gap remains');
assert(evaluateCandidate({ ...good, no_op_requested: true, safe_authorized_material_gain_remains: true }).decision === 'REJECT', 'premature NO_OP allowed');
assert(evaluateCandidate({ ...good, manufactures_busywork_for_exhaustiveness: true }).decision === 'REJECT', 'busywork accepted as completeness');
assert(evaluateCandidate({ ...good, scope_expands_beyond_contract: true }).decision === 'REJECT', 'completeness allowed contract overreach');
assert(evaluateCandidate({ ...good, retries_failed_route_without_causal_change: true }).decision === 'REJECT', 'unchanged failed route incorrectly retried');
assert(evaluateCandidate({ ...good, change_for_novelty_only: true }).decision === 'REJECT', 'novelty-only change incorrectly promoted');
assert(evaluateCandidate({ ...good, disproportionate_action: true }).decision === 'REJECT', 'disproportionate action incorrectly promoted');
assert(evaluateCandidate({ ...good, ignores_known_second_order_harm: true }).decision === 'REJECT', 'candidate ignoring second-order harm incorrectly promoted');
assert(evaluateCandidate({ ...good, needlessly_irreversible: true }).decision === 'REJECT', 'needlessly irreversible candidate incorrectly promoted');
assert(evaluateCandidate({ ...good, needless_complexity: true }).decision === 'REJECT', 'needlessly complex candidate incorrectly promoted');
assert(evaluateCandidate({ ...good, high_impact: true, explicit_authority: false }).decision === 'REJECT', 'high-impact candidate promoted without authority');
assert(evaluateCandidate({ ...good, mutates_underlying_model: true }).decision === 'REJECT', 'underlying model mutation incorrectly allowed');
assert(evaluateCandidate({ ...good, no_new_paid_dependency: false }).decision === 'REJECT', 'paid dependency incorrectly auto-promoted');

console.log(JSON.stringify({
  pass: true,
  tests: 37,
  policy: v.policy_version,
  total_leadership: v.total_leadership_version,
  all_eight_dimensions: v.all_eight_dimensions,
  how_seven_layers: v.how_seven_layers,
  wisdom: v.wisdom_version,
  wisdom_gates: v.wisdom_gates,
  innovation: v.innovation_version,
  innovation_lenses: v.innovation_lenses,
  recursive_how_layers: v.recursive_how_layers,
  completeness_dimensions: v.completeness_dimensions,
  lessons: v.lessons
}, null, 2));

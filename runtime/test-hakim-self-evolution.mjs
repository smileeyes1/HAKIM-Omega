import { validateEvolution, evaluateCandidate } from './hakim-self-evolution.mjs';

function assert(c, m) { if (!c) throw new Error(m); }

const v = validateEvolution();
assert(v.pass === true, 'baseline evolution validation failed');
assert(v.innovation_lenses === 7, 'seven innovation lenses not active');

const good = {
  intent_and_contract_preserved: true,
  positive_evidence_bound: true,
  material_gain_is_observable: true,
  no_p0_regression: true,
  rollback_exists: true,
  authority_not_expanded: true,
  no_new_paid_dependency: true,
  secrets_not_persisted: true
};
assert(evaluateCandidate(good).decision === 'PROMOTE_CANDIDATE', 'good candidate rejected');
assert(evaluateCandidate({ ...good, material_nontrivial: true, innovation_search_completed: true }).decision === 'PROMOTE_CANDIDATE', 'innovated material candidate rejected');

for (const key of Object.keys(good)) {
  const c = { ...good, [key]: false };
  assert(evaluateCandidate(c).decision === 'REJECT', `candidate promoted with failed gate: ${key}`);
}

assert(evaluateCandidate({ ...good, material_nontrivial: true, innovation_search_completed: false }).decision === 'REJECT', 'material candidate promoted without innovation search');
assert(evaluateCandidate({ ...good, retries_failed_route_without_causal_change: true }).decision === 'REJECT', 'unchanged failed route incorrectly retried');
assert(evaluateCandidate({ ...good, change_for_novelty_only: true }).decision === 'REJECT', 'novelty-only change incorrectly promoted');
assert(evaluateCandidate({ ...good, high_impact: true, explicit_authority: false }).decision === 'REJECT', 'high-impact candidate promoted without authority');
assert(evaluateCandidate({ ...good, mutates_underlying_model: true }).decision === 'REJECT', 'underlying model mutation incorrectly allowed');
assert(evaluateCandidate({ ...good, no_new_paid_dependency: false }).decision === 'REJECT', 'paid dependency incorrectly auto-promoted');

console.log(JSON.stringify({ pass: true, tests: 17, policy: v.policy_version, innovation: v.innovation_version, innovation_lenses: v.innovation_lenses, lessons: v.lessons }, null, 2));

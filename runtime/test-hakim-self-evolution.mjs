import { validateEvolution, evaluateCandidate } from './hakim-self-evolution.mjs';

function assert(c, m) { if (!c) throw new Error(m); }

const v = validateEvolution();
assert(v.pass === true, 'baseline evolution validation failed');

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

for (const key of Object.keys(good)) {
  const c = { ...good, [key]: false };
  assert(evaluateCandidate(c).decision === 'REJECT', `candidate promoted with failed gate: ${key}`);
}

assert(evaluateCandidate({ ...good, high_impact: true, explicit_authority: false }).decision === 'REJECT', 'high-impact candidate promoted without authority');
assert(evaluateCandidate({ ...good, mutates_underlying_model: true }).decision === 'REJECT', 'underlying model mutation incorrectly allowed');
assert(evaluateCandidate({ ...good, no_new_paid_dependency: false }).decision === 'REJECT', 'paid dependency incorrectly auto-promoted');

console.log(JSON.stringify({ pass: true, tests: 12, policy: v.policy_version, lessons: v.lessons }, null, 2));

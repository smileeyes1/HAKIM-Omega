import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const assert = (c, m) => { if (!c) throw new Error(m); };

export function loadEvolution() {
  return {
    policy: load('hakim/HAKIM_SELF_EVOLUTION_POLICY.json'),
    ledger: load('hakim/HAKIM_LEARNING_LEDGER.json'),
    state: load('hakim/HAKIM_STATE.json')
  };
}

export function validateEvolution(x = loadEvolution()) {
  const { policy, ledger, state } = x;
  assert(policy.policy_id === 'HAKIM_SELF_EVOLUTION_POLICY', 'bad evolution policy id');
  assert(policy.default_mode === 'ALWAYS_ON_WITHIN_ACTUAL_AUTHORITY', 'self-evolution must remain authority-bounded');
  for (const phase of ['BIND_EVIDENCE','IDENTIFY_ROOT_CAUSE_OR_SUCCESS_PATTERN','VERIFY_CANDIDATE','ADVERSARIAL_TEST','REGRESSION_TEST','CHECK_ROLLBACK','PROMOTE_OR_REJECT','REUSE_IMMEDIATELY']) {
    assert(policy.cycle.includes(phase), `missing evolution phase: ${phase}`);
  }
  const required = new Set(policy.promotion_gate.required);
  for (const r of ['intent_and_contract_preserved','positive_evidence_bound','material_gain_is_observable','no_p0_regression','rollback_exists','authority_not_expanded','no_new_paid_dependency','secrets_not_persisted']) {
    assert(required.has(r), `missing promotion requirement: ${r}`);
  }
  assert(Array.isArray(ledger.entries) && ledger.entries.length > 0, 'learning ledger empty');
  for (const e of ledger.entries) {
    assert(e.id && e.kind && e.observation && e.status && e.evidence && e.scope, `invalid learning entry: ${e.id || 'unknown'}`);
    if (e.kind === 'FAILURE_LESSON') {
      assert(e.root_cause && e.lesson && e.guard, `failure lesson incomplete: ${e.id}`);
    }
    if (e.kind === 'SUCCESS_PATTERN') assert(e.lesson && e.guard, `success pattern incomplete: ${e.id}`);
  }
  const raw = JSON.stringify({policy, ledger}).toLowerCase();
  for (const forbidden of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=']) {
    assert(!raw.includes(forbidden), `possible secret marker found: ${forbidden}`);
  }
  assert(state.baseline?.rule?.includes('Do not downgrade'), 'trusted baseline protection missing');
  return { pass: true, policy_version: policy.version, lessons: ledger.entries.length, baseline_protected: true };
}

export function evaluateCandidate(candidate = {}, x = loadEvolution()) {
  validateEvolution(x);
  const required = [
    'intent_and_contract_preserved',
    'positive_evidence_bound',
    'material_gain_is_observable',
    'no_p0_regression',
    'rollback_exists',
    'authority_not_expanded',
    'no_new_paid_dependency',
    'secrets_not_persisted'
  ];
  const failed = required.filter(k => candidate[k] !== true);
  if (candidate.high_impact === true && candidate.explicit_authority !== true) failed.push('high_impact_authority_missing');
  if (candidate.mutates_underlying_model === true) failed.push('underlying_model_mutation_forbidden');
  return {
    decision: failed.length ? 'REJECT' : 'PROMOTE_CANDIDATE',
    failed: [...new Set(failed)],
    rule: 'Promotion is allowed only after external implementation tests and actual-output verification pass.'
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

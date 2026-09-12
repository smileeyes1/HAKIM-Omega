import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const text = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const assert = (c, m) => { if (!c) throw new Error(m); };

export function loadGovernance() {
  return {
    manifest: load('hakim/HAKIM_SYSTEM_MANIFEST.json'),
    state: load('hakim/HAKIM_STATE.json'),
    policy: load('hakim/HAKIM_SELF_EVOLUTION_POLICY.json'),
    total: load('hakim/HAKIM_TOTAL_LEADERSHIP_CONSTITUTION.json'),
    wisdom: load('hakim/HAKIM_WISDOM_CONSTITUTION.json'),
    innovation: load('hakim/HAKIM_INNOVATION_CONSTITUTION.json'),
    ledger: load('hakim/HAKIM_LEARNING_LEDGER.json'),
    workflow: text('.github/workflows/hakim-control-plane.yml'),
    evolutionRuntime: text('runtime/hakim-self-evolution.mjs'),
    controlRuntime: text('runtime/hakim-control-plane.mjs')
  };
}

export function validateGovernanceIntegrity(g = loadGovernance()) {
  const { manifest, state, policy, total, wisdom, innovation, ledger, workflow, evolutionRuntime, controlRuntime } = g;

  assert(manifest.manifest_id === 'HAKIM_OMEGA_CONTROL_PLANE', 'bad manifest id');
  assert(state.state_id === 'HAKIM_ACTIVE_STATE', 'bad state id');
  assert(policy.policy_id === 'HAKIM_SELF_EVOLUTION_POLICY', 'bad evolution policy id');
  assert(total.constitution_id === 'HAKIM_TOTAL_LEADERSHIP_CONSTITUTION', 'bad total leadership constitution id');
  assert(wisdom.constitution_id === 'HAKIM_WISDOM_CONSTITUTION', 'bad wisdom constitution id');
  assert(innovation.constitution_id === 'HAKIM_INNOVATION_CONSTITUTION', 'bad innovation constitution id');
  assert(ledger.ledger_id === 'HAKIM_LEARNING_LEDGER', 'bad learning ledger id');

  const paths = {
    total: 'hakim/HAKIM_TOTAL_LEADERSHIP_CONSTITUTION.json',
    wisdom: 'hakim/HAKIM_WISDOM_CONSTITUTION.json',
    innovation: 'hakim/HAKIM_INNOVATION_CONSTITUTION.json',
    policy: 'hakim/HAKIM_SELF_EVOLUTION_POLICY.json',
    ledger: 'hakim/HAKIM_LEARNING_LEDGER.json'
  };

  for (const [k, p] of Object.entries(paths)) {
    if (k === 'policy') {
      assert(manifest.self_evolution?.policy === p, `manifest missing ${k} binding`);
      assert(state.self_evolution?.policy === p, `state missing ${k} binding`);
    } else if (k === 'ledger') {
      assert(manifest.self_evolution?.learning_ledger === p, `manifest missing ${k} binding`);
      assert(state.self_evolution?.learning_ledger === p, `state missing ${k} binding`);
    } else {
      const manifestPath = k === 'total' ? manifest.authority?.total_leadership_constitution : manifest.authority?.[`${k}_constitution`];
      assert(manifestPath === p, `manifest missing ${k} constitution binding`);
      const statePath = k === 'total' ? state.total_leadership?.constitution : state[k]?.constitution;
      assert(statePath === p, `state missing ${k} constitution binding`);
      const policyPath = k === 'total' ? policy.total_leadership_constitution : policy[`${k}_constitution`];
      assert(policyPath === p, `policy missing ${k} constitution binding`);
    }
  }

  assert(state.baseline?.control_plane_version === manifest.version, 'state/manifest control-plane version drift');
  assert(state.self_evolution?.policy_version === policy.version, 'state/policy version drift');
  assert(state.total_leadership?.all_eight_dimensions === total.all_eight?.length, 'ALL_EIGHT count drift');
  assert(state.total_leadership?.how_seven_layers === total.how_seven?.length, 'HOW_SEVEN count drift');
  assert(state.wisdom?.seven_gates === wisdom.seven_gates?.length, 'wisdom gate count drift');
  assert(state.innovation?.seven_lenses === innovation.seven_lenses?.length, 'innovation lens count drift');
  assert(state.self_evolution?.all_eight_dimensions === total.all_eight?.length, 'self-evolution ALL_EIGHT count drift');
  assert(state.self_evolution?.how_seven_layers === total.how_seven?.length, 'self-evolution HOW_SEVEN count drift');
  assert(state.self_evolution?.bounded_completeness_dimensions === policy.bounded_completeness?.dimensions?.length, 'bounded completeness count drift');
  assert(state.self_evolution?.recursive_how_layers === policy.recursive_how?.layers?.length, 'recursive HOW count drift');
  assert(state.evidence?.self_evolution_gate?.learning_entries === ledger.entries?.length, 'state/learning-ledger entry count drift');

  const invariantPairs = [
    ['ALL_EIGHT_MATERIAL_RELEVANT_SCOPE_MUST_BE_ACCOUNTED_FOR', 'APPLY_ALL_EIGHT_SCOPE'],
    ['HOW_SEVEN_GOVERNS_MATERIAL_EXECUTION_METHOD', 'APPLY_HOW_SEVEN'],
    ['WISDOM_SEVEN_GATES_GOVERN_EVERY_MATERIAL_DECISION', 'APPLY_SEVEN_WISDOM_GATES'],
    ['INNOVATE_SEVEN_LENSES_BEFORE_CONVERGENCE_ON_MATERIAL_NONTRIVIAL_GAPS', 'INNOVATE_ACROSS_SEVEN_LENSES'],
    ['SELF_EVOLUTION_REQUIRES_EVIDENCE_REGRESSION_AND_ROLLBACK', 'REGRESSION_TEST'],
    ['CROSS_LAYER_GOVERNANCE_INTEGRITY_REQUIRED_FOR_PROMOTION', 'CHECK_GOVERNANCE_INTEGRITY']
  ];
  for (const [inv, phase] of invariantPairs) {
    assert(manifest.protected_invariants?.includes(inv), `manifest invariant missing: ${inv}`);
    assert(policy.cycle?.includes(phase), `policy phase missing for invariant ${inv}: ${phase}`);
  }

  for (const required of ['all_eight_scope_checked','how_seven_completed','wisdom_seven_gates_passed','bounded_completeness_checked','governance_integrity_passed','no_p0_regression','rollback_exists','authority_not_expanded','no_new_paid_dependency','secrets_not_persisted']) {
    assert(policy.promotion_gate?.required?.includes(required), `promotion gate missing: ${required}`);
  }

  for (const fileRef of [
    'hakim/HAKIM_TOTAL_LEADERSHIP_CONSTITUTION.json',
    'hakim/HAKIM_WISDOM_CONSTITUTION.json',
    'hakim/HAKIM_INNOVATION_CONSTITUTION.json',
    'hakim/HAKIM_SELF_EVOLUTION_POLICY.json',
    'runtime/hakim-self-evolution.mjs',
    'runtime/test-hakim-self-evolution.mjs',
    'runtime/validate-governance-integrity.mjs',
    'runtime/test-governance-integrity.mjs'
  ]) assert(workflow.includes(fileRef) || fileRef.startsWith('hakim/'), `workflow watch/step coverage missing: ${fileRef}`);

  assert(workflow.includes("node runtime/hakim-self-evolution.mjs validate"), 'workflow does not validate self-evolution');
  assert(workflow.includes('node runtime/test-hakim-self-evolution.mjs'), 'workflow does not run self-evolution adversarial tests');
  assert(workflow.includes('node runtime/validate-governance-integrity.mjs'), 'workflow does not run governance integrity gate');
  assert(workflow.includes('node runtime/test-governance-integrity.mjs'), 'workflow does not run governance integrity mutation tests');

  const runtimeLoads = [
    "policy: load('hakim/HAKIM_SELF_EVOLUTION_POLICY.json')",
    "total: load('hakim/HAKIM_TOTAL_LEADERSHIP_CONSTITUTION.json')",
    "wisdom: load('hakim/HAKIM_WISDOM_CONSTITUTION.json')",
    "innovation: load('hakim/HAKIM_INNOVATION_CONSTITUTION.json')",
    "ledger: load('hakim/HAKIM_LEARNING_LEDGER.json')",
    "state: load('hakim/HAKIM_STATE.json')"
  ];
  for (const binding of runtimeLoads) {
    assert(evolutionRuntime.includes(binding), `self-evolution runtime exact load binding missing: ${binding}`);
  }
  assert(evolutionRuntime.includes("import { validateGovernanceIntegrity } from './validate-governance-integrity.mjs'"), 'self-evolution runtime governance validator import missing');
  assert(evolutionRuntime.includes('const governance = validateGovernanceIntegrity();'), 'self-evolution runtime governance validation call missing');

  assert(controlRuntime.includes("manifest.version === '1.1.0'"), 'control-plane compatibility guard missing');
  assert(Array.isArray(ledger.entries) && ledger.entries.length > 0, 'learning ledger empty');

  const raw = JSON.stringify({ manifest, state, policy, total, wisdom, innovation, ledger }).toLowerCase();
  for (const forbidden of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=']) {
    assert(!raw.includes(forbidden), `possible secret marker found: ${forbidden}`);
  }

  return {
    pass: true,
    manifest_version: manifest.version,
    policy_version: policy.version,
    all_eight: total.all_eight.length,
    how_seven: total.how_seven.length,
    wisdom_gates: wisdom.seven_gates.length,
    innovation_lenses: innovation.seven_lenses.length,
    completeness_dimensions: policy.bounded_completeness.dimensions.length,
    recursive_how_layers: policy.recursive_how.layers.length,
    learning_entries: ledger.entries.length,
    state_learning_count_bound: true,
    cross_layer_bindings: true,
    exact_runtime_bindings: true,
    workflow_gate_bound: true,
    mutation_test_bound: true
  };
}

function main() {
  try {
    console.log(JSON.stringify(validateGovernanceIntegrity(), null, 2));
  } catch (e) {
    console.error(JSON.stringify({ pass: false, error: e.message }, null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();

import { loadGovernance, validateGovernanceIntegrity } from './validate-governance-integrity.mjs';

function assert(c, m) { if (!c) throw new Error(m); }
function clone(x) { return structuredClone(x); }
function mustReject(name, mutate) {
  const g = clone(loadGovernance());
  mutate(g);
  let rejected = false;
  try { validateGovernanceIntegrity(g); } catch { rejected = true; }
  assert(rejected, `governance mutation was not rejected: ${name}`);
}

const baseline = validateGovernanceIntegrity();
assert(baseline.pass === true, 'baseline governance integrity failed');

mustReject('state policy version drift', g => { g.state.self_evolution.policy_version = '0.0.0'; });
mustReject('manifest total leadership binding removed', g => { delete g.manifest.authority.total_leadership_constitution; });
mustReject('state wisdom binding drift', g => { g.state.wisdom.constitution = 'hakim/WRONG.json'; });
mustReject('policy innovation binding drift', g => { g.policy.innovation_constitution = 'hakim/WRONG.json'; });
mustReject('ALL_EIGHT count drift', g => { g.state.total_leadership.all_eight_dimensions = 7; });
mustReject('HOW_SEVEN count drift', g => { g.state.total_leadership.how_seven_layers = 6; });
mustReject('wisdom gate count drift', g => { g.state.wisdom.seven_gates = 6; });
mustReject('innovation lens count drift', g => { g.state.innovation.seven_lenses = 6; });
mustReject('bounded completeness count drift', g => { g.state.self_evolution.bounded_completeness_dimensions = 15; });
mustReject('recursive HOW count drift', g => { g.state.self_evolution.recursive_how_layers = 7; });
mustReject('protected invariant removed', g => { g.manifest.protected_invariants = g.manifest.protected_invariants.filter(x => x !== 'HOW_SEVEN_GOVERNS_MATERIAL_EXECUTION_METHOD'); });
mustReject('policy cycle phase removed', g => { g.policy.cycle = g.policy.cycle.filter(x => x !== 'CHECK_GOVERNANCE_INTEGRITY'); });
mustReject('promotion gate weakened', g => { g.policy.promotion_gate.required = g.policy.promotion_gate.required.filter(x => x !== 'governance_integrity_passed'); });
mustReject('workflow governance step removed', g => { g.workflow = g.workflow.replace(/\n      - name: Validate cross-layer governance integrity\n        run: node runtime\/validate-governance-integrity\.mjs\n?/, '\n'); });
mustReject('self-evolution runtime governing load removed', g => { g.evolutionRuntime = g.evolutionRuntime.replace("load('hakim/HAKIM_WISDOM_CONSTITUTION.json')", "load('hakim/WRONG.json')"); });
mustReject('learning ledger emptied', g => { g.ledger.entries = []; });

console.log(JSON.stringify({ pass: true, tests: 17, baseline, mutation_rejections: 16 }, null, 2));

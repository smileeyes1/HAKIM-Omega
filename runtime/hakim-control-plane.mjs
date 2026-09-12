import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '..');
const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

export function loadControlPlane() {
  return {
    manifest: load('hakim/HAKIM_SYSTEM_MANIFEST.json'),
    intent: load('hakim/HAKIM_INTENT_SCHEMA.json'),
    tools: load('hakim/HAKIM_TOOL_REGISTRY.json'),
    memory: load('hakim/HAKIM_MEMORY_SCHEMA.json'),
    state: load('hakim/HAKIM_STATE.json'),
    platforms: load('platforms/platform-registry.json'),
  };
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }
function toolMap(cp) { return new Map(cp.tools.tools.map(t => [t.id, t])); }

export function validateControlPlane(cp = loadControlPlane()) {
  const { manifest, intent, tools, memory, state, platforms } = cp;

  assert(manifest.manifest_id === 'HAKIM_OMEGA_CONTROL_PLANE', 'bad manifest id');
  assert(manifest.version === '1.1.0', 'unexpected control-plane version');
  assert(manifest.status === 'ACTIVE_VERIFIED_HOST_BASELINE', 'control plane not promoted to verified host baseline');
  assert(Array.isArray(manifest.protected_invariants) && manifest.protected_invariants.length >= 12, 'protected invariants missing');
  for (const inv of [
    'NO_FALSE_TOOL_OWNERSHIP',
    'FAIL_CLOSED_ON_P0_OR_CRITICAL_UNKNOWN',
    'INTENT_TO_OUTCOME_WITHOUT_GOAL_DRIFT',
    'RUNTIME_AUTHORITY_DISCOVERY_REQUIRED',
    'PROVEN_SUCCESS_FROZEN_BY_DEFAULT'
  ]) assert(manifest.protected_invariants.includes(inv), `protected invariant missing: ${inv}`);
  for (const phase of ['COMPILE_INTENT','DISCOVER_TOOLS','AUTHORITY_CHECK','VERIFY','REALITY_GATE','UPDATE_STATE']) {
    assert(manifest.mission_state_machine.includes(phase), `mission state missing: ${phase}`);
  }
  assert(manifest.autonomy?.default === 'FULL_WITHIN_ACTUAL_AUTHORITY', 'autonomy policy mismatch');
  assert(/failed tool|failed tool or path|failed tool or path does not fail/i.test(manifest.autonomy?.means_failure_rule || ''), 'means-failure continuity rule missing');

  assert(intent.schema_id === 'HAKIM_INTENT_SCHEMA', 'bad intent schema id');
  assert(/^\d+\.\d+\.\d+$/.test(intent.version), 'intent schema version must be semver');
  for (const s of ['CAPTURED','LOCKED','IN_PROGRESS','PASS','BLOCKED','SUPERSEDED']) assert(intent.intent_states.includes(s), `intent state missing: ${s}`);
  for (const f of ['statement','desired_outcome','observable_acceptance','hard_constraints','dependencies','risks','known_unknowns','evidence_required','next_highest_safe_action','status']) assert(Object.hasOwn(intent.fields, f), `intent field missing: ${f}`);
  for (const g of ['NO_UNSUPPORTED_HIDDEN_INTENT','NO_CONSTRAINT_LOSS','NO_SUCCESS_CLAIM_WITHOUT_OBSERVABLE_ACCEPTANCE']) assert(intent.anti_drift_checks.includes(g), `anti-drift check missing: ${g}`);

  assert(tools.registry_id === 'HAKIM_TOOL_REGISTRY', 'bad tool registry id');
  assert(tools.version === '1.2.0', 'unexpected tool registry version');
  assert(Array.isArray(tools.authority_states) && tools.authority_states.includes('UNKNOWN') && tools.authority_states.includes('BLOCKED'), 'authority-state model missing');
  assert(Array.isArray(tools.tools) && tools.tools.length >= 22, 'too few registered tool families');
  const ids = tools.tools.map(t => t.id);
  assert(new Set(ids).size === ids.length, 'duplicate tool id');
  for (const t of tools.tools) {
    assert(typeof t.availability === 'string' && t.availability.length > 0, `availability missing for ${t.id}`);
    assert(typeof t.cost_policy === 'string', `cost policy missing for ${t.id}`);
    assert(Array.isArray(t.capabilities), `capabilities missing for ${t.id}`);
  }
  const tm = toolMap(cp);
  assert(tm.get('local_browser_agent')?.cost_policy === 'free', 'local free browser route missing');
  assert(tm.get('local_browser_agent')?.default_enabled === true, 'local browser route must be default enabled');
  assert(tm.get('tinyfish_browser')?.default_enabled === false && /metered/i.test(tm.get('tinyfish_browser')?.cost_policy || ''), 'metered browser must remain fallback');
  for (const id of ['chatgpt_web_research','chatgpt_automations','chatgpt_image_generation','chatgpt_artifact_runtime','plugin_directory']) assert(tm.has(id), `native capability missing: ${id}`);

  assert(memory.schema_id === 'HAKIM_MEMORY_SCHEMA', 'bad memory schema id');
  const layerIds = memory.layers.map(x => x.id);
  for (const required of ['working','episodic','semantic','procedural','evidence','artifact','failures','rollback','bridge_health','user_contract']) assert(layerIds.includes(required), `memory layer missing: ${required}`);
  assert(/never/i.test(memory.persistence.secret_material), 'secret persistence policy missing');

  assert(platforms.registry_id === 'OMEGA_PLATFORM_PROPAGATION_REGISTRY', 'bad platform registry id');
  assert(platforms.registry_version === '1.5.0', 'unexpected platform registry version');
  const pm = new Map(platforms.platforms.map(p => [p.id,p]));
  assert(pm.get('hakim_control_plane')?.mode === 'ENFORCED_HOST_CONTROL_PLANE', 'Hakim control-plane enforcement missing');
  assert(pm.get('hakim_local_browser_bridge')?.mode === 'STATIC_CI_PASS_FIELD_PARTIAL', 'local bridge field boundary missing');
  assert(pm.get('gemini_gems')?.mode === 'RUNTIME_PROJECTION_ONLY_UNLESS_EXTERNAL_GATE_WIRED', 'Gemini self-certification boundary changed');
  assert(pm.get('unintegrated_external_platform')?.mode === 'PROPAGATION_NOT_ENFORCED', 'unintegrated fail-closed boundary missing');

  assert(state.state_id === 'HAKIM_ACTIVE_STATE', 'bad state id');
  assert(state.version === '1.0.3', 'unexpected active-state version');
  assert(state.mission?.contract_status === 'LOCKED', 'mission contract must be locked');
  assert(state.baseline?.control_plane_version === manifest.version, 'state/control-plane version mismatch');
  assert(state.baseline?.platform_registry_version === platforms.registry_version, 'state/platform registry mismatch');
  assert(state.baseline?.rule?.includes('Do not downgrade'), 'baseline protection missing');
  assert(state.release_state === 'PASS_CONTROL_PLANE_HOST_SCOPE_FIELD_BRIDGE_PARTIAL', 'field boundary must remain explicit');

  const raw = JSON.stringify(cp).toLowerCase();
  for (const forbidden of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=']) assert(!raw.includes(forbidden), `possible secret marker found: ${forbidden}`);

  return {
    pass: true,
    control_plane_version: manifest.version,
    tool_count: tools.tools.length,
    memory_layers: memory.layers.length,
    intent_states: intent.intent_states.length,
    platform_count: platforms.platforms.length,
    field_bridge: pm.get('hakim_local_browser_bridge').mode
  };
}

export function structureIntent(input = {}, cp = loadControlPlane()) {
  validateControlPlane(cp);
  const statement = String(input.statement || '').trim();
  if (!statement) return { status:'BLOCKED', reason:'MISSING_INTENT_STATEMENT' };
  const desired = String(input.desired_outcome || statement).trim();
  const acceptance = Array.isArray(input.observable_acceptance) ? input.observable_acceptance.filter(Boolean) : [];
  const unknowns = Array.isArray(input.known_unknowns) ? input.known_unknowns.filter(Boolean) : [];
  return {
    intent_id: input.intent_id || 'RUNTIME_INTENT',
    statement,
    why: input.why ?? null,
    desired_outcome: desired,
    observable_acceptance: acceptance,
    hard_constraints: Array.isArray(input.hard_constraints) ? input.hard_constraints : [],
    known_unknowns: unknowns,
    next_highest_safe_action: String(input.next_highest_safe_action || '').trim(),
    status: acceptance.length ? (unknowns.length ? 'CLARIFIED' : 'LOCKED') : 'CAPTURED',
    rule: 'No hidden goal is invented; success requires observable acceptance.'
  };
}

export function planMission(taskType, availableToolIds = null, cp = loadControlPlane()) {
  validateControlPlane(cp);
  const route = cp.tools.task_routes[taskType];
  if (!route) return { status: 'BLOCKED', reason: 'UNKNOWN_TASK_ROUTE', task_type: taskType, route: [] };
  const known = toolMap(cp);
  let candidates = route.map(id => known.get(id)).filter(Boolean);
  if (Array.isArray(availableToolIds)) {
    const allow = new Set(availableToolIds);
    candidates = candidates.filter(t => allow.has(t.id));
  }
  candidates.sort((a,b) => {
    const rank = t => (t.default_enabled ? 0 : 10) + (/metered/i.test(t.cost_policy) ? 5 : 0);
    return rank(a) - rank(b);
  });
  if (!candidates.length) return { status: 'BLOCKED', reason: 'NO_AUTHORIZED_CAPABILITY', task_type: taskType, route: [] };
  return {
    status: 'PASS',
    task_type: taskType,
    route: candidates.map(t => ({ id:t.id, availability:t.availability, cost_policy:t.cost_policy, default_enabled:t.default_enabled })),
    authority_rule: cp.tools.runtime_discovery_policy?.rule || 'Runtime authority must be verified before execution.'
  };
}

export function status(cp = loadControlPlane()) {
  const v = validateControlPlane(cp);
  return {
    pass: v.pass,
    control_plane: cp.manifest.version,
    state: cp.state.status,
    release_state: cp.state.release_state,
    current_bottleneck: cp.state.mission.current_bottleneck,
    next_action: cp.state.mission.next_highest_safe_action,
    bridges: cp.state.bridge_health,
    tools_registered: v.tool_count,
    memory_layers: v.memory_layers,
    platform_registry: cp.platforms.registry_version
  };
}

function main() {
  const cmd = process.argv[2] || 'validate';
  try {
    if (cmd === 'validate') console.log(JSON.stringify(validateControlPlane(), null, 2));
    else if (cmd === 'status') console.log(JSON.stringify(status(), null, 2));
    else if (cmd === 'plan') {
      const type = process.argv[3];
      const out = planMission(type);
      console.log(JSON.stringify(out, null, 2));
      if (!type || out.status !== 'PASS') process.exitCode = 2;
    } else if (cmd === 'intent') {
      const raw = process.argv[3] ? JSON.parse(process.argv[3]) : {};
      const out = structureIntent(raw);
      console.log(JSON.stringify(out, null, 2));
      if (out.status === 'BLOCKED') process.exitCode = 2;
    } else throw new Error(`unknown command: ${cmd}`);
  } catch (err) {
    console.error(JSON.stringify({ pass:false, error:err.message }, null, 2));
    process.exitCode = 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();

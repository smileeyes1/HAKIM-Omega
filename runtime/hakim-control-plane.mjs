import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '..');
const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

export function loadControlPlane() {
  return {
    manifest: load('hakim/HAKIM_SYSTEM_MANIFEST.json'),
    tools: load('hakim/HAKIM_TOOL_REGISTRY.json'),
    memory: load('hakim/HAKIM_MEMORY_SCHEMA.json'),
    state: load('hakim/HAKIM_STATE.json'),
  };
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

export function validateControlPlane(cp = loadControlPlane()) {
  const { manifest, tools, memory, state } = cp;
  assert(manifest.manifest_id === 'HAKIM_OMEGA_CONTROL_PLANE', 'bad manifest id');
  assert(/^\d+\.\d+\.\d+$/.test(manifest.version), 'manifest version must be semver');
  assert(Array.isArray(manifest.protected_invariants) && manifest.protected_invariants.length >= 8, 'protected invariants missing');
  assert(manifest.protected_invariants.includes('NO_FALSE_TOOL_OWNERSHIP'), 'tool ownership invariant missing');
  assert(manifest.protected_invariants.includes('FAIL_CLOSED_ON_P0_OR_CRITICAL_UNKNOWN'), 'fail-closed invariant missing');
  assert(Array.isArray(manifest.mission_state_machine) && manifest.mission_state_machine.includes('VERIFY'), 'state machine incomplete');

  assert(tools.registry_id === 'HAKIM_TOOL_REGISTRY', 'bad tool registry id');
  assert(Array.isArray(tools.tools) && tools.tools.length >= 8, 'too few registered tool families');
  const ids = tools.tools.map(t => t.id);
  assert(new Set(ids).size === ids.length, 'duplicate tool id');
  for (const t of tools.tools) {
    assert(typeof t.availability === 'string' && t.availability.length > 0, `availability missing for ${t.id}`);
    assert(typeof t.cost_policy === 'string', `cost policy missing for ${t.id}`);
    assert(Array.isArray(t.capabilities), `capabilities missing for ${t.id}`);
  }
  const tiny = tools.tools.find(t => t.id === 'tinyfish_browser');
  assert(tiny && tiny.default_enabled === false && /metered/i.test(tiny.cost_policy), 'metered fallback must not be default');
  const local = tools.tools.find(t => t.id === 'local_browser_agent');
  assert(local && local.cost_policy === 'free', 'local free browser route missing');

  assert(memory.schema_id === 'HAKIM_MEMORY_SCHEMA', 'bad memory schema id');
  const layerIds = memory.layers.map(x => x.id);
  for (const required of ['working','episodic','semantic','procedural','evidence','artifact','failures','rollback','bridge_health','user_contract']) {
    assert(layerIds.includes(required), `memory layer missing: ${required}`);
  }
  assert(/never/i.test(memory.persistence.secret_material), 'secret persistence policy missing');

  assert(state.state_id === 'HAKIM_ACTIVE_STATE', 'bad state id');
  assert(state.mission?.contract_status === 'LOCKED', 'mission contract must be locked');
  assert(state.baseline?.rule?.includes('Do not downgrade'), 'baseline protection missing');

  const raw = JSON.stringify(cp).toLowerCase();
  for (const forbidden of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=']) {
    assert(!raw.includes(forbidden), `possible secret marker found: ${forbidden}`);
  }
  return { pass: true, tool_count: tools.tools.length, memory_layers: memory.layers.length };
}

export function planMission(taskType, availableToolIds = null, cp = loadControlPlane()) {
  validateControlPlane(cp);
  const route = cp.tools.task_routes[taskType];
  if (!route) return { status: 'BLOCKED', reason: 'UNKNOWN_TASK_ROUTE', task_type: taskType, route: [] };
  const known = new Map(cp.tools.tools.map(t => [t.id, t]));
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
    rule: 'Runtime must still verify actual connection/authorization before execution.'
  };
}

export function status(cp = loadControlPlane()) {
  validateControlPlane(cp);
  return {
    control_plane: cp.manifest.version,
    state: cp.state.status,
    release_state: cp.state.release_state,
    current_bottleneck: cp.state.mission.current_bottleneck,
    next_action: cp.state.mission.next_highest_safe_action,
    bridges: cp.state.bridge_health
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
    } else throw new Error(`unknown command: ${cmd}`);
  } catch (err) {
    console.error(JSON.stringify({ pass:false, error:err.message }, null, 2));
    process.exitCode = 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();

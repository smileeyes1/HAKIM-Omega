import assert from 'node:assert/strict';
import { loadControlPlane, validateControlPlane, planMission, status } from './hakim-control-plane.mjs';

const cp = loadControlPlane();
const v = validateControlPlane(cp);
assert.equal(v.pass, true);
assert.ok(v.tool_count >= 8);
assert.ok(v.memory_layers >= 10);

const phone = planMission('phone_web_ui');
assert.equal(phone.status, 'PASS');
assert.equal(phone.route[0].id, 'local_browser_agent');
assert.equal(phone.route[0].cost_policy, 'free');

const webFallback = planMission('web_ui_fallback');
assert.equal(webFallback.status, 'PASS');
assert.equal(webFallback.route[0].id, 'local_browser_agent');
assert.equal(webFallback.route.at(-1).id, 'tinyfish_browser');

const freeOnly = planMission('web_ui_fallback', ['local_browser_agent']);
assert.equal(freeOnly.status, 'PASS');
assert.deepEqual(freeOnly.route.map(x => x.id), ['local_browser_agent']);

const noTools = planMission('phone_web_ui', []);
assert.equal(noTools.status, 'BLOCKED');
assert.equal(noTools.reason, 'NO_AUTHORIZED_CAPABILITY');

const unknown = planMission('not_a_real_route');
assert.equal(unknown.status, 'BLOCKED');
assert.equal(unknown.reason, 'UNKNOWN_TASK_ROUTE');

const repo = planMission('repo_or_code');
assert.equal(repo.route[0].id, 'github_owner_relay');

const persist = planMission('persistent_artifact');
assert.ok(persist.route.some(x => x.id === 'chatgpt_files_library'));
assert.ok(persist.route.some(x => x.id === 'github_owner_relay'));
assert.ok(persist.route.some(x => x.id === 'google_control_plane'));

const ids = cp.tools.tools.map(t => t.id);
assert.equal(new Set(ids).size, ids.length);
assert.equal(cp.tools.tools.find(t => t.id === 'tinyfish_browser').default_enabled, false);
assert.equal(cp.tools.tools.find(t => t.id === 'remote_desktop_commander').default_enabled, false);
assert.equal(cp.tools.tools.find(t => t.id === 'local_browser_agent').default_enabled, true);

const layers = new Set(cp.memory.layers.map(x => x.id));
for (const x of ['working','episodic','semantic','procedural','evidence','artifact','failures','rollback','bridge_health','user_contract']) assert.ok(layers.has(x));

assert.ok(cp.manifest.protected_invariants.includes('FAIL_CLOSED_ON_P0_OR_CRITICAL_UNKNOWN'));
assert.ok(cp.manifest.protected_invariants.includes('PROVEN_SUCCESS_FROZEN_BY_DEFAULT'));
assert.ok(cp.manifest.protected_invariants.includes('NO_SECRET_IN_PUBLIC_REPOSITORY'));
assert.ok(cp.manifest.protected_invariants.includes('NO_FALSE_TOOL_OWNERSHIP'));

const s = status(cp);
assert.equal(s.control_plane, '1.0.0');
assert.ok(s.next_action);
assert.ok(Array.isArray(s.bridges));

const serialized = JSON.stringify(cp).toLowerCase();
for (const marker of ['password=', 'api_key=', 'session_cookie=', 'authorization: bearer ']) assert.equal(serialized.includes(marker), false);

console.log(JSON.stringify({
  pass:true,
  tests:24,
  tool_count:v.tool_count,
  memory_layers:v.memory_layers,
  checked:['schema','state','protected invariants','tool uniqueness','free-first routing','metered fallback','fail-closed unknown route','fail-closed unavailable route','memory layers','secret markers','baseline protection','status projection']
}, null, 2));

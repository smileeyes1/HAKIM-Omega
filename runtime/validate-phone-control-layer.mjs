import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILE = path.join(ROOT, 'hakim/HAKIM_PHONE_CONTROL_LAYER.json');
const load = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const assert = (c, m) => { if (!c) throw new Error(m); };

export function validatePhoneControlLayer(layer = load()) {
  assert(layer.layer_id === 'HAKIM_PHONE_CONTROL_LAYER', 'bad layer id');
  assert(/^\d+\.\d+\.\d+$/.test(layer.version), 'version must be semver');
  assert(layer.status === 'ACTIVE_HOST_VERIFIED_FIELD_PARTIAL', 'phone layer must remain field-partial until actual phone evidence');
  for (const p of ['TRUTH_BEFORE_CLAIM','FREE_FIRST','LEAST_PRIVILEGE','ACTUAL_PHONE_OUTPUT_IS_FINAL_JUDGE']) assert(layer.principles.includes(p), `missing principle ${p}`);

  const tiers = new Map(layer.control_tiers.map(x => [x.tier, x]));
  for (const t of ['T0','T1','T2','T3','T4','T5']) assert(tiers.has(t), `missing control tier ${t}`);
  assert(/per-session user consent/i.test(tiers.get('T4').scope + ' ' + tiers.get('T4').field_requirement), 'MediaProjection consent boundary missing');
  assert(/not required/i.test(tiers.get('T5').scope), 'root must not be default');

  const channels = new Map(layer.channels.map(x => [x.id, x]));
  for (const id of ['chatgpt_connectors','local_browser_agent','remote_desktop_commander','make_ntfy_command_transport','make_result_webhook','termux_shizuku_rish','tinyfish_cloud_browser']) assert(channels.has(id), `missing channel ${id}`);
  assert(channels.get('local_browser_agent').cost === 'free', 'free local browser route missing');
  assert(channels.get('tinyfish_cloud_browser').default === false && /metered/i.test(channels.get('tinyfish_cloud_browser').cost), 'metered browser must remain fallback');
  assert(/UNPROVEN/.test(channels.get('make_ntfy_command_transport').current_state), 'Make send must not imply phone execution');
  assert(/UNPROVEN/.test(channels.get('make_result_webhook').current_state), 'Make receiver must not imply phone-origin return');

  assert(layer.security_boundaries.public_missions.includes('NON_SENSITIVE'), 'public mission classification boundary missing');
  assert(/never/i.test(layer.security_boundaries.passwords_otp_recovery), 'secret exclusion boundary missing');
  assert(/no silent root/i.test(layer.security_boundaries.system_privilege), 'silent privilege escalation boundary missing');
  assert(Array.isArray(layer.field_acceptance) && layer.field_acceptance.length >= 6, 'field acceptance incomplete');
  assert(/actual phone-side execution evidence is still missing/i.test(layer.current_bottleneck), 'actual phone evidence blocker must stay explicit');

  const raw = JSON.stringify(layer).toLowerCase();
  for (const marker of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=', 'hook.eu1.make.com/', 'ntfy.sh/hakim-cmd-']) assert(!raw.includes(marker), `possible secret or private transport endpoint found: ${marker}`);
  assert(!/full[_ -]?control[_ -]?pass|complete[_ -]?phone[_ -]?control/i.test(raw), 'must not claim full phone control before field evidence');
  return {pass:true, version:layer.version, channels:layer.channels.length, tiers:layer.control_tiers.length, status:layer.status};
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try { console.log(JSON.stringify(validatePhoneControlLayer(), null, 2)); }
  catch (e) { console.error(JSON.stringify({pass:false,error:e.message}, null, 2)); process.exitCode = 1; }
}

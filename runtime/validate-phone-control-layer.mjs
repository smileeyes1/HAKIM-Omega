import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILE = path.join(ROOT, 'hakim/HAKIM_PHONE_CONTROL_LAYER.json');
const load = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const assert = (c, m) => { if (!c) throw new Error(m); };

export function validatePhoneControlLayer(layer = load()) {
  assert(layer.layer_id === 'HAKIM_PHONE_CONTROL_LAYER', 'bad layer id');
  assert(/^\d+\.\d+\.\d+$/.test(layer.version), 'version must be semver');
  assert(layer.status === 'SAFE_CORE_HOST_VERIFIED_FIELD_PENDING', 'phone layer must remain explicitly field-pending until actual phone evidence');
  for (const p of ['TRUTH_BEFORE_CLAIM','FREE_OR_INCLUDED_ONLY_BY_DEFAULT','LEAST_PRIVILEGE','NO_PLAY_PROTECT_BYPASS','NO_SILENT_PERMISSION_ESCALATION','ACTUAL_PHONE_OUTPUT_IS_FINAL_JUDGE']) {
    assert(layer.principles.includes(p), `missing principle ${p}`);
  }

  const tiers = new Map(layer.control_tiers.map(x => [x.tier, x]));
  for (const t of ['T0','T1_SAFE','T1_LEGACY','T2','T3','T4','T5']) assert(tiers.has(t), `missing control tier ${t}`);
  assert(/no Accessibility/i.test(tiers.get('T1_SAFE').scope), 'safe core no-Accessibility boundary missing');
  assert(/Frozen/i.test(tiers.get('T1_LEGACY').scope) && /must not be reactivated automatically/i.test(tiers.get('T1_LEGACY').field_requirement), 'legacy Accessibility route must stay frozen');
  assert(/fresh per-session user consent/i.test(tiers.get('T4').scope + ' ' + tiers.get('T4').field_requirement), 'MediaProjection consent boundary missing');
  assert(/not required/i.test(tiers.get('T5').scope), 'root must not be default');

  const channels = new Map(layer.channels.map(x => [x.id, x]));
  for (const id of ['chatgpt_connectors','hakim_android_safe_core','local_browser_agent_legacy','remote_desktop_commander','make_ntfy_command_transport','termux_shizuku_rish','tinyfish_cloud_browser']) {
    assert(channels.has(id), `missing channel ${id}`);
  }
  const safe = channels.get('hakim_android_safe_core');
  assert(safe.cost === 'free', 'safe core must remain free');
  assert(safe.default === true, 'safe core must remain default phone field candidate');
  assert(/FIELD.*PENDING|PENDING/i.test(safe.current_state), 'safe core must remain field-pending');
  assert(safe.package === 'ps.hakim.safe.debug', 'safe-core package identity drifted');
  assert(safe.version === '0.2.0-debug', 'safe-core version drifted');
  const legacy = channels.get('local_browser_agent_legacy');
  assert(legacy.default === false && /FROZEN/i.test(legacy.current_state), 'legacy sensitive route must stay frozen');
  assert(channels.get('tinyfish_cloud_browser').default === false && /metered/i.test(channels.get('tinyfish_cloud_browser').cost), 'metered browser must remain blocked fallback');
  assert(/UNPROVEN/.test(channels.get('make_ntfy_command_transport').current_state), 'Make send must not imply phone execution');

  assert(/INTERNET only/i.test(layer.security_boundaries.safe_core_permissions), 'safe-core permission boundary missing');
  assert(/OPEN_URL, WAIT, STATUS and REPORT only/i.test(layer.security_boundaries.safe_core_actions), 'safe-core action boundary missing');
  assert(layer.security_boundaries.public_missions.includes('NON_SENSITIVE'), 'public mission classification boundary missing');
  assert(/never/i.test(layer.security_boundaries.passwords_otp_recovery), 'secret exclusion boundary missing');
  assert(/no silent root/i.test(layer.security_boundaries.system_privilege), 'silent privilege escalation boundary missing');
  assert(/Play Protect bypass/i.test(layer.security_boundaries.system_privilege), 'Play Protect bypass prohibition missing');
  assert(Array.isArray(layer.field_acceptance) && layer.field_acceptance.length >= 6, 'field acceptance incomplete');
  assert(/Actual installation and harmless mission execution/i.test(layer.current_bottleneck), 'actual phone field blocker must stay explicit');
  assert(/Install the newly built HAKIM Android SAFE CORE APK/i.test(layer.next_highest_safe_action), 'next safe field action missing');

  assert(/Play Protect/i.test(layer.current_evidence.play_protect_field_failure || ''), 'field Play Protect failure evidence missing');
  assert(/SUCCESS/i.test(layer.current_evidence.safe_core_ci || ''), 'safe-core host CI evidence missing');
  assert(/pending/i.test(layer.current_evidence.safe_core_artifact || ''), 'artifact must not imply phone runtime pass');

  const raw = JSON.stringify(layer).toLowerCase();
  for (const marker of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=', 'hook.eu1.make.com/', 'ntfy.sh/hakim-cmd-']) {
    assert(!raw.includes(marker), `possible secret or private transport endpoint found: ${marker}`);
  }
  assert(!/full[_ -]?control[_ -]?pass|complete[_ -]?phone[_ -]?control|field[_ -]?pass/i.test(layer.status), 'must not claim full phone control before field evidence');
  return {pass:true, version:layer.version, channels:layer.channels.length, tiers:layer.control_tiers.length, status:layer.status, field_candidate:safe.id};
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try { console.log(JSON.stringify(validatePhoneControlLayer(), null, 2)); }
  catch (e) { console.error(JSON.stringify({pass:false,error:e.message}, null, 2)); process.exitCode = 1; }
}

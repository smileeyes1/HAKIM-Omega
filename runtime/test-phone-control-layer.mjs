import fs from 'node:fs';
import path from 'node:path';
import { validatePhoneControlLayer } from './validate-phone-control-layer.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'hakim/HAKIM_PHONE_CONTROL_LAYER.json'), 'utf8'));
const clone = x => JSON.parse(JSON.stringify(x));
const mustFail = (name, mutate) => {
  const x = clone(base); mutate(x);
  let failed = false;
  try { validatePhoneControlLayer(x); } catch { failed = true; }
  if (!failed) throw new Error(`mutation unexpectedly passed: ${name}`);
};

const pass = validatePhoneControlLayer(base);
if (!pass.pass) throw new Error('baseline did not pass');

mustFail('false full-control status', x => { x.status = 'FULL_CONTROL_PASS'; });
mustFail('remove least privilege', x => { x.principles = x.principles.filter(v => v !== 'LEAST_PRIVILEGE'); });
mustFail('remove Play Protect guard', x => { x.principles = x.principles.filter(v => v !== 'NO_PLAY_PROTECT_BYPASS'); });
mustFail('re-enable legacy sensitive route', x => { x.channels.find(v => v.id === 'local_browser_agent_legacy').default = true; });
mustFail('rename isolated safe package', x => { x.channels.find(v => v.id === 'hakim_android_safe_core').package = 'ps.hakim.omega.debug'; });
mustFail('claim safe core field pass early', x => { x.channels.find(v => v.id === 'hakim_android_safe_core').current_state = 'FIELD_PASS'; });
mustFail('make metered browser default', x => { x.channels.find(v => v.id === 'tinyfish_cloud_browser').default = true; });
mustFail('promote Make transport without phone evidence', x => { x.channels.find(v => v.id === 'make_ntfy_command_transport').current_state = 'PASS'; });
mustFail('weaken safe permissions', x => { x.security_boundaries.safe_core_permissions = 'INTERNET plus AccessibilityService'; });
mustFail('leak private webhook endpoint', x => { x.current_bottleneck += ' https://hook.eu1.make.com/example'; });
mustFail('remove phone evidence blocker', x => { x.current_bottleneck = 'Everything complete'; });

console.log(JSON.stringify({pass:true, baseline:pass, mutations_rejected:11, checked:['field-pending truth boundary','least privilege','Play Protect guard','legacy route frozen','isolated package identity','no premature field PASS','metered route blocked','transport is not phone execution','INTERNET-only safe permissions','secret endpoint rejection','actual-phone evidence blocker']}, null, 2));

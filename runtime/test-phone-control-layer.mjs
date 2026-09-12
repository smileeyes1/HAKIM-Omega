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
mustFail('promote Make transport without phone evidence', x => { x.channels.find(v => v.id === 'make_ntfy_command_transport').current_state = 'PASS'; });
mustFail('make metered browser default', x => { x.channels.find(v => v.id === 'tinyfish_cloud_browser').default = true; });
mustFail('leak private webhook endpoint', x => { x.current_bottleneck += ' https://hook.eu1.make.com/example'; });
mustFail('remove phone evidence blocker', x => { x.current_bottleneck = 'Everything complete'; });

console.log(JSON.stringify({pass:true, baseline:pass, mutations_rejected:6}, null, 2));

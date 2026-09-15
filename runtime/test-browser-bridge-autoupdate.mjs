import fs from 'node:fs';
import assert from 'node:assert/strict';

const script=fs.readFileSync('mobile-agent/hakim-omega-local-bridge.user.js','utf8');
const update='https://raw.githubusercontent.com/smileeyes1/HAKIM-Omega/main/mobile-agent/hakim-omega-local-bridge.user.js';

assert.match(script,/^\/\/ @version\s+0\.1\.4$/m);
assert.ok(script.includes(`// @updateURL    ${update}`));
assert.ok(script.includes(`// @downloadURL  ${update}`));
assert.match(script,/const VERSION='٠٫١٫٤'/);
assert.match(script,/HEARTBEAT_MS=60\*60\*1000/);
assert.match(script,/FOREGROUND_DEBOUNCE_MS=15000/);
assert.match(script,/visibilitychange/);
assert.match(script,/addEventListener\('focus'/);
assert.match(script,/get\('enabled',null\)===null/);
assert.match(script,/RATE_LIMIT_/);
assert.ok(!script.includes('POLL_MS=20000'));

console.log(JSON.stringify({pass:true,autoupdate:true,version:'0.1.4',heartbeat:'hourly_plus_foreground_nudge',first_run_auto_arm:true,rate_limit_guard:true},null,2));

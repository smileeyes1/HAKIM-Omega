import fs from 'node:fs';
import assert from 'node:assert/strict';

const script=fs.readFileSync('mobile-agent/hakim-omega-local-bridge.user.js','utf8');
const update='https://raw.githubusercontent.com/smileeyes1/HAKIM-Omega/main/mobile-agent/hakim-omega-local-bridge.user.js';

assert.match(script,/^\/\/ @version\s+0\.1\.3$/m);
assert.ok(script.includes(`// @updateURL    ${update}`));
assert.ok(script.includes(`// @downloadURL  ${update}`));
assert.match(script,/const VERSION='٠٫١٫٣'/);
assert.match(script,/HEARTBEAT_MS=60\*60\*1000/);
assert.match(script,/RATE_LIMIT_/);
assert.ok(!script.includes('POLL_MS=20000'));

console.log(JSON.stringify({pass:true,autoupdate:true,version:'0.1.3',heartbeat:'hourly',rate_limit_guard:true},null,2));

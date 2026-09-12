import fs from 'node:fs';
import assert from 'node:assert/strict';
const contract=fs.readFileSync('hakim/RATE_LIMIT_RESILIENCE_CONTRACT.md','utf8');
for(const token of ['EVENT_FIRST/PUSH_FIRST','hourly','debounced','one mission-fetch request','HTTP 429','Retry-After','exponential backoff','No paid/credit-consuming bypass','HAKIM_BRIDGE_RESULT']) assert.ok(contract.includes(token),`missing ${token}`);
console.log(JSON.stringify({pass:true,contract:'RATE_LIMIT_RESILIENCE',assertions:9},null,2));

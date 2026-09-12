import assert from 'node:assert/strict';
import { validateSupremeIntentBinding } from './validate-supreme-intent-binding.mjs';

const v = validateSupremeIntentBinding();
assert.equal(v.pass, true);
assert.equal(v.fail_closed, true);
assert.equal(v.actual_output_gate, true);
assert.equal(v.adaptive_how, true);
assert.equal(v.baseline_preserved, true);
assert.equal(v.canonical_instance_id, 'HAKIM_ORIGINAL_PHONE_APP');
assert.equal(v.normalization_id, 'SUPREME_INTENT_MAX_VERIFIED_NET_VALUE');

console.log(JSON.stringify({
  pass: true,
  assertions: 7,
  contract_version: v.contract_version,
  root_version: v.root_version,
  normalization_id: v.normalization_id,
  canonical_instance_id: v.canonical_instance_id,
  fail_closed: v.fail_closed
}, null, 2));

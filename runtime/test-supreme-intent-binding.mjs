import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateSupremeIntentBinding } from './validate-supreme-intent-binding.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const truthPath = path.join(ROOT, 'hakim/HAKIM_CANONICAL_RUNTIME_TRUTH.json');

const v = validateSupremeIntentBinding();
assert.equal(v.pass, true);
assert.equal(v.fail_closed, true);
assert.equal(v.actual_output_gate, true);
assert.equal(v.adaptive_how, true);
assert.equal(v.baseline_preserved, true);
assert.equal(v.canonical_instance_id, 'HAKIM_ORIGINAL_PHONE_APP');
assert.equal(v.normalization_id, 'SUPREME_INTENT_MAX_VERIFIED_NET_VALUE');
assert.equal(v.canonical_runtime_repository, 'smileeyes1/SovereignAssistant');
assert.equal(v.fresh_runtime_truth_required, true);

const original = fs.readFileSync(truthPath, 'utf8');
try {
  const mutated = JSON.parse(original);
  mutated.canonical_runtime_authority.repository = 'stale/or-wrong-repo';
  fs.writeFileSync(truthPath, JSON.stringify(mutated, null, 2));
  assert.throws(() => validateSupremeIntentBinding(), /runtime truth repository drift/);
} finally {
  fs.writeFileSync(truthPath, original);
}

console.log(JSON.stringify({
  pass: true,
  assertions: 10,
  mutation_rejections: 1,
  contract_version: v.contract_version,
  root_version: v.root_version,
  runtime_truth_version: v.runtime_truth_version,
  normalization_id: v.normalization_id,
  canonical_instance_id: v.canonical_instance_id,
  canonical_runtime_repository: v.canonical_runtime_repository,
  fail_closed: v.fail_closed
}, null, 2));

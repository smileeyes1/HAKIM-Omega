import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { validateCanonicalInstance } from './validate-canonical-instance.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'hakim', 'HAKIM_CANONICAL_INSTANCE.json'), 'utf8'));
const clone = () => structuredClone(base);

const failures = [];
function expectReject(name, mutate) {
  const d = clone(); mutate(d);
  let rejected = false;
  try { validateCanonicalInstance(d); } catch { rejected = true; }
  if (!rejected) failures.push(name);
}

assert.equal(validateCanonicalInstance(base).pass, true);
expectReject('single instance disabled', d => { d.single_instance = false; });
expectReject('canonical id replaced', d => { d.canonical_instance_id = 'HAKIM_REPLACEMENT'; });
expectReject('frontend replaced', d => { d.frontend.kind = 'NEW_AGENT'; });
expectReject('replacement allowed', d => { d.frontend.replacement_allowed = true; });
expectReject('clone allowed', d => { d.frontend.clone_allowed = true; });
expectReject('parallel Hakim allowed', d => { d.frontend.parallel_hakim_allowed = true; });
expectReject('repo promoted to frontend', d => { d.support_components.find(x => x.id === 'smileeyes1/HAKIM-Omega').role = 'CANONICAL_FRONTEND'; });
expectReject('support component promoted to parallel frontend', d => { d.support_components[1].role = 'FRONTEND_PARALLEL'; });
expectReject('false field pass state', d => { d.field_binding.state = 'FIELD_PASS'; d.field_binding.field_pass = false; });
expectReject('field pass without evidence', d => { d.field_binding.state = 'FIELD_PASS'; d.field_binding.field_pass = true; delete d.field_binding.evidence_id; });
expectReject('CI treated as field proof', d => { d.field_binding.ci_or_send_is_not_field_proof = false; });
expectReject('parallel identity guard removed', d => { d.protected_boundaries = d.protected_boundaries.filter(x => x !== 'NO_PARALLEL_HAKIM_IDENTITY'); });
expectReject('field claim guard removed', d => { d.protected_boundaries = d.protected_boundaries.filter(x => x !== 'NO_FALSE_FIELD_CLAIMS'); });

if (failures.length) {
  console.error(JSON.stringify({pass:false,unexpected_accepts:failures}, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({pass:true,baseline_accepts:1,mutation_rejections:13}, null, 2));

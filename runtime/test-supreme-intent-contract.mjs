import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const p = path.join(ROOT, 'hakim', 'HAKIM_SUPREME_INTENT_CONTRACT.json');
const c = JSON.parse(fs.readFileSync(p, 'utf8'));

assert.equal(c.contract_id, 'HAKIM_SUPREME_INTENT_CONTRACT');
assert.equal(c.status, 'ACTIVE_GOVERNING_INTERPRETATION_CONTRACT');
assert.equal(c.canonical_instance_id, 'HAKIM_ORIGINAL_PHONE_APP');
assert.equal(c.trigger_semantics?.normalization_id, 'SUPREME_INTENT_MAX_VERIFIED_NET_VALUE');
assert.equal(c.trigger_semantics?.equivalent_variants_apply, true);
assert.ok(Array.isArray(c.trigger_semantics?.examples) && c.trigger_semantics.examples.length >= 4);
assert.ok(c.trigger_semantics.examples.some(x => x.includes('ما أفضل شيء')));
assert.ok(c.trigger_semantics.examples.some(x => x.includes('قم بكل شيء')));
assert.ok(c.normalized_meaning.includes('أعلى قيمة صافية مثبتة'));
assert.ok(c.all_means.includes('كل جانب وخطوة وفجوة مادية ذات صلة'));
assert.ok(c.how_rule.includes('عمق تكيفي'));
assert.ok(c.execution_rule.includes('مجاني أو مشمول'));
assert.ok(c.failure_rule.includes('فشل الوسيلة لا يفشل الغاية'));
assert.ok(c.verification_rule.includes('الناتج الفعلي'));
assert.ok(c.persistence_rule.includes('نجاح مثبت'));
assert.ok(c.deduplication_rule.includes('LAST_VERIFIED_BASELINE'));
assert.ok(c.stop_rule.includes('لا تعلن الاكتمال'));

const method = new Set(c.required_method || []);
for (const id of [
  'RESTORE_LATEST_VERIFIED_BASELINE','COST_GATE','RATE_LIMIT_GATE','ALL_EIGHT_SCAN','HOW_SEVEN',
  'WAW_LIMA_HAYYA','WISDOM_SEVEN','INNOVATION_SEVEN_WHEN_MATERIAL','VERIFY_ACTUAL_OUTPUT',
  'ADVERSARIAL_AND_REGRESSION_CHECK','REPAIR_ROOT_CAUSE_OR_SWITCH_MEANS','LEARN_AND_PERSIST_PROVEN_SUCCESS',
  'NEXT_HIGHEST_VALUE_GAP'
]) assert.ok(method.has(id), `missing required method: ${id}`);

const hard = new Set(c.hard_boundaries || []);
for (const id of [
  'NO_PERMISSION_ESCALATION','NO_AUTH_OR_2FA_BYPASS','NO_SECRET_EXPOSURE_OR_PERSISTENCE',
  'NO_AUTOMATIC_METERED_OR_CREDIT_CONSUMING_ROUTE','NO_IRREVERSIBLE_HIGH_IMPACT_ACTION_WITHOUT_REQUIRED_AUTHORITY',
  'NO_SCOPE_EXPANSION_MERELY_BECAUSE_USER_SAYS_ALL','NO_FALSE_SUCCESS_COMPLETENESS_OR_FIELD_CLAIMS',
  'NO_PARALLEL_HAKIM_IDENTITY','NO_BUSYWORK_OR_INFINITE_RECURSION'
]) assert.ok(hard.has(id), `missing hard boundary: ${id}`);

assert.equal(c.precedence?.[0], 'PLATFORM_SAFETY_RIGHTS_AND_LAW');
assert.ok(c.persistence_scope?.repository.includes('merged to canonical main'));
assert.ok(c.persistence_scope?.automation.includes('existing Hakim automation'));
assert.ok(c.persistence_scope?.other_platforms.includes('Never claim propagation'));

console.log(JSON.stringify({
  pass: true,
  contract: c.contract_id,
  version: c.version,
  triggers: c.trigger_semantics.examples.length,
  required_method_steps: c.required_method.length,
  hard_boundaries: c.hard_boundaries.length,
  supreme_intent_persisted: true
}, null, 2));

import fs from 'node:fs';

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const current = readJson('recovery/current.json');
const closure = readJson('recovery/v4.3-external-loop.json');
const platformRegistry = readJson('platforms/platform-registry.json');
const production = readJson('reference-systems/palestinian-edu-math-v1/manifest.json');

const V43 = 'b16530dfcab17b2e678079287463528740770845eb6f0161df43de2e242c84fd';
const V42 = 'ea165b6844e6c32f05a4627b4094f52655a50f88dc0d1f06627047913f3a506a';
const PROD = '0e248c5f39df4b406390ebb8186c1aeaec9f07f755941d34b2dacc57a1b0feaf';
const SCOPE = 'PAL_G1_ADDITION_WITHIN_10_RESULT_UNKNOWN_EQUATION_CARD_PDF_HOST_ONLY';

assert(current.pointer_id === 'OMEGA_AUTORECOVER_CURRENT', 'BAD_CURRENT_POINTER_ID');
assert(current.status === 'PASS', 'CURRENT_POINTER_NOT_PASS');
assert(current.effective_head === 'OMEGA_AUTORECOVER_AUTHORITY_MANIFEST_v4_3', 'BAD_EFFECTIVE_HEAD');
assert(current.effective_head_sha256 === V43, 'BAD_V43_SHA');
assert(current.fallback_head === 'OMEGA_AUTORECOVER_AUTHORITY_MANIFEST_v4_2', 'BAD_FALLBACK_HEAD');
assert(current.fallback_sha256 === V42, 'BAD_FALLBACK_SHA');
assert(current.production_reference?.scope_id === SCOPE, 'BAD_PRODUCTION_SCOPE');
assert(current.production_reference?.use_rule === 'EXACT_SCOPE_MATCH_ONLY_CHILD_STARTS_UNPROVEN', 'BAD_PRODUCTION_USE_RULE');

assert(closure.result === 'PASS', 'CLOSURE_NOT_PASS');
assert(closure.autorecover_head === current.effective_head, 'CLOSURE_HEAD_MISMATCH');
assert(closure.autorecover_sha256 === current.effective_head_sha256, 'CLOSURE_SHA_MISMATCH');
assert(closure.previous_proven_fallback?.sha256 === V42, 'CLOSURE_FALLBACK_MISMATCH');
assert(closure.production_reference_head?.sha256 === PROD, 'CLOSURE_PRODUCTION_SHA_MISMATCH');
assert(closure.production_reference_head?.scope_id === SCOPE, 'CLOSURE_SCOPE_MISMATCH');
assert(closure.production_reference_head?.automatic_use === 'EXACT_SCOPE_MATCH_ONLY', 'CLOSURE_SCOPE_NOT_EXACT');
assert(closure.production_reference_head?.pass_inheritance === 'FORBIDDEN', 'CLOSURE_PASS_INHERITANCE_NOT_FORBIDDEN');
assert(closure.protected_heads?.main_signed === 'v0.8.0/sequence8', 'MAIN_HEAD_CHANGED');
assert(closure.protected_heads?.host_assurance === 'v0.9H.1', 'HOST_HEAD_CHANGED');

assert(production.package_sha256 === PROD, 'PRODUCTION_PACKAGE_SHA_MISMATCH');
assert(production.scope_id === SCOPE, 'PRODUCTION_SCOPE_MISMATCH');
assert(production.default_child_state === 'UNPROVEN', 'CHILD_STATE_NOT_UNPROVEN');
assert(production.pass_inheritance === 'FORBIDDEN', 'PRODUCTION_PASS_INHERITANCE_NOT_FORBIDDEN');
assert(production.metrics_snapshot?.valid_negative_fault_test_escapes === 0, 'PRODUCTION_FAULT_ESCAPE_NONZERO');
assert(production.metrics_snapshot?.known_p0_escape_at_release_observed === 0, 'PRODUCTION_KNOWN_P0_ESCAPE_NONZERO');
assert(production.delivery_namespace_policy?.staging_empty_after_run_required === true, 'STAGING_EMPTY_NOT_REQUIRED');

const chatgpt = platformRegistry.platforms.find(p => p.id === 'chatgpt_library');
assert(chatgpt, 'CHATGPT_LIBRARY_PLATFORM_MISSING');
assert(chatgpt.adapter === 'autorecover_v4_3_plus_bounded_production_reference_and_sidecar', 'CHATGPT_ADAPTER_NOT_V43');
assert(chatgpt.physical_claims === false, 'CHATGPT_PHYSICAL_CLAIM_ENABLED');

const forbidden = new Set(closure.limitations || []);
assert(forbidden.has('NO_FIELD_OR_PHYSICAL_CLAIMS'), 'MISSING_FIELD_LIMITATION');
assert(forbidden.has('NO_AVIATION_NUCLEAR_EQUIVALENCE_CLAIM'), 'MISSING_AVIATION_NUCLEAR_LIMITATION');
assert(forbidden.has('PASS_IS_NOT_INHERITED_BY_CHILD_ARTIFACTS'), 'MISSING_PASS_INHERITANCE_LIMITATION');

console.log('OMEGA_AUTORECOVER_CURRENT_GATE_PASS');

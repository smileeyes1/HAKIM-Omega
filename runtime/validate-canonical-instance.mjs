import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CANONICAL_PATH = path.join(ROOT, 'hakim', 'HAKIM_CANONICAL_INSTANCE.json');

function assert(cond, msg) { if (!cond) throw new Error(msg); }

export function validateCanonicalInstance(doc = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'))) {
  assert(doc.identity_id === 'HAKIM_CANONICAL_INSTANCE', 'bad canonical identity id');
  assert(doc.canonical_instance_id === 'HAKIM_ORIGINAL_PHONE_APP', 'original phone Hakim must remain canonical');
  assert(doc.display_name === 'حكيم', 'canonical display name changed');
  assert(doc.identity_source === 'USER_CONFIRMED_EXISTING_ON_PHONE_APP', 'canonical identity source changed');
  assert(doc.single_instance === true, 'single-instance invariant disabled');
  assert(doc.instance_role === 'CANONICAL_FRONTEND', 'canonical instance must remain the only frontend identity');
  assert(doc.frontend?.kind === 'EXISTING_USER_PHONE_APP', 'frontend must remain the existing user phone app');
  assert(doc.frontend?.replacement_allowed === false, 'replacement of original Hakim must remain forbidden');
  assert(doc.frontend?.clone_allowed === false, 'Hakim clone must remain forbidden');
  assert(doc.frontend?.parallel_hakim_allowed === false, 'parallel Hakim must remain forbidden');
  assert(Array.isArray(doc.support_components) && doc.support_components.length >= 3, 'backend support components missing');
  for (const c of doc.support_components) {
    assert(typeof c.id === 'string' && c.id.length > 0, 'support component id missing');
    assert(['BACKEND_ONLY','OPTIONAL_BACKEND_MAINTENANCE_ONLY'].includes(c.role), `support component ${c.id} may not become a parallel frontend`);
  }
  const repo = doc.support_components.find(x => x.id === 'smileeyes1/HAKIM-Omega');
  assert(repo?.role === 'BACKEND_ONLY', 'repository must remain backend-only');
  assert(doc.field_binding?.mission_id === 'FIELD_SMOKE_PHONE_BRIDGE_2026_09_12_A', 'field mission identity changed');
  assert(['FIELD_BINDING_PENDING','FIELD_PASS','FIELD_FAIL'].includes(doc.field_binding?.state), 'invalid field binding state');
  if (doc.field_binding?.field_pass === true) {
    assert(doc.field_binding?.state === 'FIELD_PASS', 'field pass boolean/state mismatch');
    assert(typeof doc.field_binding?.evidence_id === 'string' && doc.field_binding.evidence_id.length >= 8, 'FIELD_PASS requires request-bound evidence id');
  } else {
    assert(doc.field_binding?.state !== 'FIELD_PASS', 'FIELD_PASS state requires field_pass=true');
  }
  assert(doc.field_binding?.ci_or_send_is_not_field_proof === true, 'CI/send boundary weakened');
  assert(Array.isArray(doc.protected_boundaries) && doc.protected_boundaries.includes('NO_PARALLEL_HAKIM_IDENTITY'), 'parallel-Hakim guard missing');
  assert(doc.protected_boundaries.includes('NO_FALSE_FIELD_CLAIMS'), 'field evidence guard missing');
  return {
    pass: true,
    canonical_instance_id: doc.canonical_instance_id,
    single_instance: true,
    frontend: doc.frontend.kind,
    field_binding: doc.field_binding.state,
    backend_components: doc.support_components.length
  };
}

function main() {
  try {
    console.log(JSON.stringify(validateCanonicalInstance(), null, 2));
  } catch (err) {
    console.error(JSON.stringify({pass:false,error:err.message}, null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();

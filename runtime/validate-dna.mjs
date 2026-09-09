import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const root = process.cwd();
const genomePath = path.join(root, 'genome', 'omega-dna.json');
const digestPath = path.join(root, 'genome', 'omega-dna.sha256');
const genomeBytes = fs.readFileSync(genomePath);
const genome = JSON.parse(genomeBytes);
const actualGenomeHash = crypto.createHash('sha256').update(genomeBytes).digest('hex');
const expectedGenomeHash = fs.readFileSync(digestPath, 'utf8').trim().split(/\s+/)[0];
const failures = [];
if (actualGenomeHash !== expectedGenomeHash) failures.push('GENOME_HASH_MISMATCH');
if (genome.genome_id !== 'OMEGA_INHERITABLE_ASSURANCE_DNA') failures.push('GENOME_ID_INVALID');
if (genome.inheritance?.mode !== 'fail_closed') failures.push('DNA_NOT_FAIL_CLOSED');
if (!Array.isArray(genome.protected_invariants) || genome.protected_invariants.length < 5) failures.push('PROTECTED_INVARIANTS_INCOMPLETE');

function walk(dir) {
  let out = [];
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    if (ent.name === '.git' || ent.name === 'node_modules') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out = out.concat(walk(p));
    else if (ent.name.endsWith('.omega.json') && !ent.name.includes('.template.')) out.push(p);
  }
  return out;
}
const sidecars = walk(root);
const hex64 = /^[0-9a-f]{64}$/;
for (const p of sidecars) {
  let m;
  try { m = JSON.parse(fs.readFileSync(p,'utf8')); } catch { failures.push(`${p}:INVALID_JSON`); continue; }
  const prefix = path.relative(root,p);
  if (m.omega_lineage_version !== '1') failures.push(`${prefix}:LINEAGE_VERSION`);
  if (!m.artifact_id) failures.push(`${prefix}:ARTIFACT_ID_MISSING`);
  if (!hex64.test(m.artifact_sha256 || '')) failures.push(`${prefix}:ARTIFACT_SHA256_INVALID`);
  if (m.dna?.genome_id !== genome.genome_id) failures.push(`${prefix}:GENOME_ID_MISMATCH`);
  if (m.dna?.genome_version !== genome.genome_version) failures.push(`${prefix}:GENOME_VERSION_MISMATCH`);
  if (m.dna?.genome_sha256 !== actualGenomeHash) failures.push(`${prefix}:GENOME_SHA256_MISMATCH`);
  if (!m.parent?.id) failures.push(`${prefix}:PARENT_MISSING`);
  if (!Array.isArray(m.applied_profiles)) failures.push(`${prefix}:PROFILES_MISSING`);
  if (!Array.isArray(m.evidence_refs)) failures.push(`${prefix}:EVIDENCE_REFS_MISSING`);
  if (!['PASS','NO_GO','UNPROVEN'].includes(m.gate?.result)) failures.push(`${prefix}:GATE_RESULT_INVALID`);
  if (m.gate?.result === 'PASS' && m.gate?.tested_equals_delivered !== true) failures.push(`${prefix}:PASS_WITHOUT_TESTED_EQUALS_DELIVERED`);
  const forbidden = new Set(genome.claims_forbidden_without_specific_evidence || []);
  for (const c of (m.claims || [])) if (forbidden.has(c) && m.gate?.scope !== 'FIELD_AS_PROVEN') failures.push(`${prefix}:FORBIDDEN_HOST_ONLY_CLAIM:${c}`);
}

if (failures.length) {
  console.error(JSON.stringify({status:'NO_GO', failures, genome_sha256:actualGenomeHash, sidecars:sidecars.length}, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({status:'PASS', genome_sha256:actualGenomeHash, sidecars:sidecars.length}, null, 2));

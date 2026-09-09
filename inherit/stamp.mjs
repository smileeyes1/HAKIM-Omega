import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dnaRoot = path.resolve(here, '..');
const [,, artifactArg, artifactId, parentId, profilesCsv=''] = process.argv;
if (!artifactArg || !artifactId || !parentId) throw new Error('artifact, artifact-id and parent-id are required');
const artifactPath = path.resolve(process.cwd(), artifactArg);
const genomeBytes = fs.readFileSync(path.join(dnaRoot,'genome','omega-dna.json'));
const genome = JSON.parse(genomeBytes);
const genomeHash = crypto.createHash('sha256').update(genomeBytes).digest('hex');
const artifactHash = crypto.createHash('sha256').update(fs.readFileSync(artifactPath)).digest('hex');
const manifest = {
  omega_lineage_version:'1', artifact_id:artifactId, artifact_sha256:artifactHash,
  artifact_type:path.extname(artifactPath).slice(1) || 'binary',
  dna:{genome_id:genome.genome_id,genome_version:genome.genome_version,genome_sha256:genomeHash},
  parent:{kind:'contract_or_artifact',id:parentId,sha256:''},
  applied_profiles:profilesCsv ? profilesCsv.split(',').filter(Boolean) : [],
  applicable_p0:[], evidence_refs:[],
  gate:{result:'UNPROVEN',scope:'HOST_ONLY_OR_FIELD_AS_PROVEN',tested_equals_delivered:false},
  claims:[], limitations:['INHERITED_NOT_YET_RELEASE_QUALIFIED']
};
const out = artifactPath + '.omega.json';
fs.writeFileSync(out, JSON.stringify(manifest,null,2)+'\n');
console.log(`OMEGA_SIDECAR=${out}`);

import fs from 'fs';
import crypto from 'crypto';

const genome=JSON.parse(fs.readFileSync('genome/omega-dna.json','utf8'));
const genomeBytes=fs.readFileSync('genome/omega-dna.json');
const genomeHash=crypto.createHash('sha256').update(genomeBytes).digest('hex');
const expectedHash=fs.readFileSync('genome/omega-dna.sha256','utf8').trim().split(/\s+/)[0];
const gs=fs.readFileSync('adapters/google/apps-script/OmegaDNA.gs','utf8');
const bootstrap=fs.readFileSync('adapters/google/apps-script/ProjectBootstrap.gs','utf8');
const appManifest=JSON.parse(fs.readFileSync('adapters/google/apps-script/appsscript.json','utf8'));
const gem=fs.readFileSync('adapters/google/gemini/GEM_RUNTIME.md','utf8');
const failures=[];
if(genomeHash!==expectedHash) failures.push('GENOME_HASH_MISMATCH');
if(!gs.includes(genome.genome_id)) failures.push('APPS_SCRIPT_GENOME_ID_MISSING');
if(!gs.includes(genome.genome_version)) failures.push('APPS_SCRIPT_GENOME_VERSION_MISSING');
if(!gs.includes(genomeHash)) failures.push('APPS_SCRIPT_GENOME_SHA_MISSING');
for(const token of ['omegaStampDriveFile','omegaValidateLineageObject','omegaRequireRelease','UNPROVEN','OMEGA_NO_GO']) if(!gs.includes(token)) failures.push(`APPS_SCRIPT_REQUIRED_TOKEN_MISSING:${token}`);
for(const token of ['omegaCreateProjectBootstrap','omegaGetLatestRevisionId','omegaExportNativeIdentity','omegaRequireGoogleNativeRelease','UNPROVEN','57c40bed4042e080eae458af7cfcf841873e3cc9fc2bac8da612da037eb0f5b2']) if(!bootstrap.includes(token)) failures.push(`BOOTSTRAP_REQUIRED_TOKEN_MISSING:${token}`);
for(const scope of ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/script.external_request']) if(!(appManifest.oauthScopes||[]).includes(scope)) failures.push(`APPS_SCRIPT_SCOPE_MISSING:${scope}`);
if(!gem.includes(genome.genome_id)) failures.push('GEM_RUNTIME_GENOME_ID_MISSING');
if(!gem.includes(genomeHash)) failures.push('GEM_RUNTIME_GENOME_SHA_MISSING');
for(const token of ['UNPROVEN','fail closed','Actual-Output','physical/field/aviation/nuclear']) if(!gem.toLowerCase().includes(token.toLowerCase())) failures.push(`GEM_RUNTIME_REQUIRED_RULE_MISSING:${token}`);
if(failures.length){console.error(JSON.stringify({status:'NO_GO',failures,genome_sha256:genomeHash},null,2));process.exit(1)}
console.log(JSON.stringify({status:'PASS',genome_sha256:genomeHash,google_adapter:'PASS',project_bootstrap_extension:'PASS'},null,2));

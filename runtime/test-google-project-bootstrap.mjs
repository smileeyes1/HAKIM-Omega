import fs from 'fs';
import vm from 'vm';
const cells=new Map(),registry=[];let copied=false;
function range(p,r){return{setValue(v){cells.set(p+':'+r,v);return this;},setValues(v){cells.set(p+':'+r,v);return this;}}}
const contract={getRange:r=>range('contract',r)},gate={getRange:r=>range('gate',r)};
const projectSS={getSheetByName:n=>n==='Project Contract'?contract:n==='Release Gate'?gate:null};
const registrySS={getSheetByName:n=>n==='Lineage Registry'?{appendRow:r=>registry.push(r)}:null};
const copy={getId:()=> 'COPY123',getUrl:()=> 'https://docs.google.com/spreadsheets/d/COPY123'};
const source={makeCopy:()=>{copied=true;return copy;}};
const ctx={console,Date,encodeURIComponent,Array,JSON,MimeType:{PLAIN_TEXT:'text/plain'},
 DriveApp:{getFolderById:()=>({}),getFileById:id=>source,getRootFolder:()=>({})},
 SpreadsheetApp:{openById:id=>id==='COPY123'?projectSS:registrySS,flush:()=>{}},
 Utilities:{formatDate:()=> '2026-09-09',computeDigest:()=>[],DigestAlgorithm:{SHA_256:'SHA_256'}},
 ScriptApp:{getOAuthToken:()=> 'token'},UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getBlob:()=>({getBytes:()=>[]})})},
 Drive:{Revisions:{list:()=>({revisions:[{id:'1'},{id:'2'}]})}}
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('adapters/google/apps-script/OmegaDNA.gs','utf8'),ctx);
vm.runInContext(fs.readFileSync('adapters/google/apps-script/ProjectBootstrap.gs','utf8'),ctx);
const fails=[];
const out=vm.runInContext("omegaCreateProjectBootstrap('P1','C1',['google_workspace'],'F1','PDF')",ctx);
if(!copied||out.status!=='UNPROVEN'||registry[0][7]!=='UNPROVEN')fails.push('BIRTH_OR_REGISTRY_NOT_UNPROVEN');
if(JSON.stringify(cells.get('gate:C8:D8'))!==JSON.stringify([['UNPROVEN','UNPROVEN']]))fails.push('FINAL_GATE_NOT_UNPROVEN');
let parentKilled=false;try{vm.runInContext("omegaCreateProjectBootstrap('P1','',[],'F1','PDF')",ctx)}catch(e){parentKilled=String(e).includes('OMEGA_NO_GO')}if(!parentKilled)fails.push('MISSING_PARENT_ESCAPE');
ctx.lineage={omega_lineage_version:'1',artifact_id:'A',artifact_sha256:null,native_identity:{mimeType:'application/vnd.google-apps.document'},native_google_identity:null,dna:{genome_id:'OMEGA_INHERITABLE_ASSURANCE_DNA',genome_version:'1.0.0',genome_sha256:'1e5dfdf7816bb83368b94a7c04e94833c0a27775417f638dcc4c4eeeb5bae312'},parent:{id:'P'},evidence_refs:['E'],gate:{result:'PASS',scope:'HOST_ONLY',tested_equals_delivered:true},claims:[]};
let nativeKilled=false;try{vm.runInContext('omegaRequireGoogleNativeRelease(lineage)',ctx)}catch(e){nativeKilled=String(e).includes('NATIVE_REVISION_OR_EXPORT_IDENTITY_MISSING')}if(!nativeKilled)fails.push('NATIVE_IDENTITY_ESCAPE');
ctx.lineage.native_google_identity={revision_id:'2'};try{vm.runInContext('omegaRequireGoogleNativeRelease(lineage)',ctx)}catch(e){fails.push('REVISION_REJECTED')}
const ident=vm.runInContext("omegaExportNativeIdentity('F','application/pdf')",ctx);if(ident.status!=='IDENTITY_ONLY_UNPROVEN')fails.push('EXPORT_SELF_CERTIFIED');
if(fails.length){console.error(JSON.stringify({status:'NO_GO',fails},null,2));process.exit(1)}
console.log(JSON.stringify({status:'PASS',checks:['BIRTH_UNPROVEN','REGISTRY_UNPROVEN','MISSING_PARENT_KILLED','NATIVE_IDENTITY_REQUIRED','EXPORT_IDENTITY_ONLY']},null,2));

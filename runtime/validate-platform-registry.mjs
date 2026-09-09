import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync(new URL('../platforms/platform-registry.json', import.meta.url),'utf8'));
if(!['1.3.0','1.4.0'].includes(p.registry_version)) throw new Error('REGISTRY_VERSION');
const ids=new Set();
for(const x of p.platforms){
  if(!x.id||!x.mode) throw new Error('MALFORMED_PLATFORM');
  if(ids.has(x.id)) throw new Error('DUPLICATE_PLATFORM:'+x.id);
  ids.add(x.id);
}
for(const must of ['chatgpt_library','github','google_drive','google_docs','google_sheets','google_slides','google_apps_script','gemini_gems','make','unintegrated_external_platform']){
  if(!ids.has(must)) throw new Error('MISSING_PLATFORM:'+must);
}
console.log('OMEGA_PLATFORM_REGISTRY_PASS');

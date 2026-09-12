import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync(new URL('../platforms/platform-registry.json', import.meta.url),'utf8'));
if(p.registry_version!=='1.5.0') throw new Error('REGISTRY_VERSION');
const ids=new Set();
for(const x of p.platforms){
  if(!x.id||!x.mode) throw new Error('MALFORMED_PLATFORM');
  if(ids.has(x.id)) throw new Error('DUPLICATE_PLATFORM:'+x.id);
  ids.add(x.id);
}
for(const must of ['chatgpt_runtime','chatgpt_library','github','google_drive','google_docs','google_sheets','google_slides','google_apps_script','gemini_gems','hakim_control_plane','hakim_local_browser_bridge','make','unintegrated_external_platform']){
  if(!ids.has(must)) throw new Error('MISSING_PLATFORM:'+must);
}
const gas=p.platforms.find(x=>x.id==='google_apps_script');
if(!gas || gas.mode!=='ADAPTER_READY_HOST_PREQUALIFIED' || !String(gas.adapter).includes('ProjectBootstrap.gs')) throw new Error('GOOGLE_BOOTSTRAP_NOT_BOUND');
const hakim=p.platforms.find(x=>x.id==='hakim_control_plane');
if(!hakim || hakim.mode!=='ENFORCED_HOST_CONTROL_PLANE') throw new Error('HAKIM_CONTROL_PLANE_NOT_ENFORCED');
const bridge=p.platforms.find(x=>x.id==='hakim_local_browser_bridge');
if(!bridge || bridge.mode!=='STATIC_CI_PASS_FIELD_PARTIAL') throw new Error('HAKIM_BRIDGE_FIELD_BOUNDARY_MISSING');
const gem=p.platforms.find(x=>x.id==='gemini_gems');
if(!gem || gem.mode!=='RUNTIME_PROJECTION_ONLY_UNLESS_EXTERNAL_GATE_WIRED') throw new Error('GEMINI_SELF_CERTIFICATION_BOUNDARY_CHANGED');
const unintegrated=p.platforms.find(x=>x.id==='unintegrated_external_platform');
if(!unintegrated || unintegrated.mode!=='PROPAGATION_NOT_ENFORCED') throw new Error('UNINTEGRATED_FAIL_CLOSED_BOUNDARY_CHANGED');
console.log('OMEGA_PLATFORM_REGISTRY_PASS');

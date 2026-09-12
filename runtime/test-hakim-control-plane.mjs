import assert from 'node:assert/strict';
import { loadControlPlane, validateControlPlane, structureIntent, planMission, status } from './hakim-control-plane.mjs';

const cp = loadControlPlane();
const v = validateControlPlane(cp);
let n=0; const ok=(cond,msg)=>{assert.ok(cond,msg);n++}; const eq=(a,b,msg)=>{assert.equal(a,b,msg);n++};

eq(v.pass,true); eq(v.control_plane_version,'1.1.0'); ok(v.tool_count>=22); ok(v.memory_layers>=10); ok(v.intent_states>=9); ok(v.platform_count>=14);

const bare=structureIntent({statement:'أريد نتيجة نافعة'}); eq(bare.status,'CAPTURED'); eq(bare.desired_outcome,'أريد نتيجة نافعة');
const locked=structureIntent({statement:'أريد ملفًا',desired_outcome:'ملف صالح',observable_acceptance:['يفتح']}); eq(locked.status,'LOCKED');
const clarified=structureIntent({statement:'أريد هدفًا',observable_acceptance:['دليل'],known_unknowns:['مصدر']}); eq(clarified.status,'CLARIFIED');
const missing=structureIntent({}); eq(missing.status,'BLOCKED'); eq(missing.reason,'MISSING_INTENT_STATEMENT');

const phone=planMission('phone_web_ui'); eq(phone.status,'PASS'); eq(phone.route[0].id,'local_browser_agent'); eq(phone.route[0].cost_policy,'free');
const webFallback=planMission('web_ui_fallback'); eq(webFallback.route[0].id,'local_browser_agent'); eq(webFallback.route.at(-1).id,'tinyfish_browser');
const freeOnly=planMission('web_ui_fallback',['local_browser_agent']); eq(freeOnly.status,'PASS'); eq(freeOnly.route.length,1); eq(freeOnly.route[0].id,'local_browser_agent');
const noTools=planMission('phone_web_ui',[]); eq(noTools.status,'BLOCKED'); eq(noTools.reason,'NO_AUTHORIZED_CAPABILITY');
const unknown=planMission('not_a_real_route'); eq(unknown.status,'BLOCKED'); eq(unknown.reason,'UNKNOWN_TASK_ROUTE');
const research=planMission('public_research'); eq(research.route[0].id,'chatgpt_web_research');
const scheduled=planMission('scheduled_or_conditional'); eq(scheduled.route[0].id,'chatgpt_automations');
const image=planMission('image_creation'); eq(image.route[0].id,'chatgpt_image_generation');
const artifact=planMission('artifact_creation'); eq(artifact.route[0].id,'chatgpt_artifact_runtime');
const discover=planMission('tool_discovery'); eq(discover.route[0].id,'plugin_directory');
const repo=planMission('repo_or_code'); eq(repo.route[0].id,'github_owner_relay');
const persist=planMission('persistent_artifact'); ok(persist.route.some(x=>x.id==='chatgpt_files_library')); ok(persist.route.some(x=>x.id==='github_owner_relay')); ok(persist.route.some(x=>x.id==='google_control_plane'));

const ids=cp.tools.tools.map(t=>t.id); eq(new Set(ids).size,ids.length); eq(cp.tools.tools.find(t=>t.id==='tinyfish_browser').default_enabled,false); eq(cp.tools.tools.find(t=>t.id==='local_browser_agent').default_enabled,true);
for(const x of ['working','episodic','semantic','procedural','evidence','artifact','failures','rollback','bridge_health','user_contract']) ok(cp.memory.layers.some(y=>y.id===x),`missing memory ${x}`);
for(const x of ['FAIL_CLOSED_ON_P0_OR_CRITICAL_UNKNOWN','PROVEN_SUCCESS_FROZEN_BY_DEFAULT','NO_SECRET_IN_PUBLIC_REPOSITORY','NO_FALSE_TOOL_OWNERSHIP','INTENT_TO_OUTCOME_WITHOUT_GOAL_DRIFT','RUNTIME_AUTHORITY_DISCOVERY_REQUIRED']) ok(cp.manifest.protected_invariants.includes(x),`missing invariant ${x}`);
for(const x of ['NO_UNSUPPORTED_HIDDEN_INTENT','NO_CONSTRAINT_LOSS','NO_SUCCESS_CLAIM_WITHOUT_OBSERVABLE_ACCEPTANCE']) ok(cp.intent.anti_drift_checks.includes(x),`missing anti drift ${x}`);
const pm=new Map(cp.platforms.platforms.map(p=>[p.id,p])); eq(pm.get('hakim_control_plane').mode,'ENFORCED_HOST_CONTROL_PLANE'); ok(['STATIC_CI_PASS_FIELD_PARTIAL','FIELD_SMOKE_PASS_SCOPE_LIMITED'].includes(pm.get('hakim_local_browser_bridge').mode)); eq(pm.get('gemini_gems').mode,'RUNTIME_PROJECTION_ONLY_UNLESS_EXTERNAL_GATE_WIRED'); eq(pm.get('unintegrated_external_platform').mode,'PROPAGATION_NOT_ENFORCED');

const s=status(cp); eq(s.control_plane,'1.1.0'); eq(s.platform_registry,'1.5.0'); ok(s.next_action); ok(Array.isArray(s.bridges)); ok(['PASS_CONTROL_PLANE_HOST_SCOPE_FIELD_BRIDGE_PARTIAL','PASS_CONTROL_PLANE_HOST_SCOPE_FIELD_BRIDGE_SMOKE_PASS'].includes(s.release_state));
const serialized=JSON.stringify(cp).toLowerCase(); for(const marker of ['password=','api_key=','session_cookie=','authorization: bearer ','recovery_code=']) eq(serialized.includes(marker),false);

const promoted=structuredClone(cp);
promoted.platforms.platforms.find(x=>x.id==='hakim_local_browser_bridge').mode='FIELD_SMOKE_PASS_SCOPE_LIMITED';
promoted.state.release_state='PASS_CONTROL_PLANE_HOST_SCOPE_FIELD_BRIDGE_SMOKE_PASS';
promoted.tools.tools.find(x=>x.id==='local_browser_agent').qualification.field_runtime='PASS_SMOKE_SCOPE_ONLY';
eq(validateControlPlane(promoted).pass,true);

console.log(JSON.stringify({pass:true,assertions:n,tool_count:v.tool_count,memory_layers:v.memory_layers,intent_states:v.intent_states,platform_count:v.platform_count,checked:['intent anti-drift','runtime authority boundary','free-first routing','metered fallback','native capability routes','fail-closed unavailable/unknown routes','memory layers','platform propagation boundaries','secret markers','baseline protection','field bridge scope-limited progression']},null,2));

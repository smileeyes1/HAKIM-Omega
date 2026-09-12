import fs from 'node:fs';
import assert from 'node:assert/strict';

const script=fs.readFileSync('mobile-agent/hakim-omega-local-bridge.user.js','utf8');
const policy=JSON.parse(fs.readFileSync('hakim/LOCAL_BRIDGE_POLICY.json','utf8'));
const mission=JSON.parse(fs.readFileSync('hakim/REMOTE_MISSION.json','utf8'));

assert.match(script,/==UserScript==/);
assert.match(script,/@version\s+0\.1\.3/);
assert.match(script,/@connect\s+raw\.githubusercontent\.com/);
assert.match(script,/GM_xmlhttpRequest/);
assert.match(script,/SECRET_FIELD_BLOCKED/);
assert.match(script,/CLASSIFICATION_BLOCKED/);
assert.match(script,/MISSION_EXPIRED/);
assert.match(script,/UNKNOWN_HOST_IN_MISSION/);
assert.match(script,/LOCAL_CONFIRMATION_DECLINED/);
assert.match(script,/https_only|protocol!==['"]https:/);
assert.match(script,/last_completed_mission_id/);
assert.match(script,/pending_report/);
assert.match(script,/HAKIM_BRIDGE_RESULT/);
assert.match(script,/model-response/);
assert.match(script,/rich-textarea/);
assert.match(script,/جارٍ الفحص الآن/);
assert.match(script,/لا توجد مهمة جديدة، الجسر يعمل/);
assert.match(script,/الجسر متوقف — اضغط «تفعيل» أولًا/);
assert.match(script,/aria-live="polite"/);
assert.match(script,/hakim-bridge-check'\)\.onclick=\(\)=>poll\(true\)/);
assert.match(script,/HEARTBEAT_MS=60\*60\*1000/);
assert.ok(!/POLL_MS=20000/.test(script),'dense 20s polling must not return');
assert.match(script,/poll_inflight/);
assert.match(script,/rate_limit_until/);
assert.match(script,/retryAfterMs/);
assert.match(script,/backoffMs/);
assert.match(script,/MISSION_HTTP_['"]?\+r\.status|MISSION_HTTP_/);
assert.match(script,/RATE_LIMIT_/);
assert.match(script,/تم تجاهل الضغط المتكرر/);
assert.match(script,/setInterval\(\(\)=>poll\(false\),HEARTBEAT_MS\)/);
assert.ok(!/password\s*=\s*['"][^'"]+['"]/.test(script));
assert.equal(policy.policy_id,'HAKIM_LOCAL_BROWSER_BRIDGE_POLICY');
assert.ok(policy.allowed_hosts.includes('gemini.google.com'));
assert.ok(policy.allowed_hosts.includes('github.com'));
assert.equal(policy.limits.credentials_in_mission,false);
assert.equal(policy.limits.private_page_content_in_public_report,false);
assert.equal(policy.safety.secret_fields_never_autofilled,true);
assert.equal(policy.safety.high_impact_requires_local_confirmation,true);
assert.match(mission.schema_version,/^\d+\.\d+\.\d+$/);
assert.equal(typeof mission.enabled,'boolean');
assert.ok(Array.isArray(mission.actions));
assert.ok(mission.actions.length<=policy.limits.max_actions);
assert.ok(['PUBLIC','INTERNAL_NON_SENSITIVE'].includes(mission.data_classification));
if(mission.enabled){
  assert.notEqual(mission.mission_id,'IDLE');
  assert.ok(mission.actions.length>0);
  assert.ok(Date.parse(mission.expires_at)>Date.parse(mission.created_at));
  for(const h of mission.allowed_hosts||[]) assert.ok(policy.allowed_hosts.includes(h),`active mission host not allowed: ${h}`);
}else if(mission.completed_by_evidence){
  assert.notEqual(mission.mission_id,'IDLE');
  assert.ok(mission.actions.length>0);
  assert.equal(mission.completed_by_evidence,'hakim/FIELD_BRIDGE_EVIDENCE.json');
}else{
  assert.ok(mission.mission_id==='IDLE'||mission.actions.length===0);
}

const metas=[...script.matchAll(/^\/\/ @match\s+https:\/\/([^/]+)\//gm)].map(x=>x[1]);
for(const host of metas) assert.ok(policy.allowed_hosts.includes(host),`metadata host not in policy: ${host}`);
for(const token of policy.forbidden_field_tokens) assert.ok(script.includes(token),`secret token not embedded in runtime guard: ${token}`);

console.log(JSON.stringify({pass:true,assertions:45,metadata_hosts:metas.length,policy_hosts:policy.allowed_hosts.length,visible_feedback:true,rate_limit_guard:true,event_first_heartbeat:true,remote_mission:mission.enabled?'ACTIVE_SCHEMA_VALID':mission.completed_by_evidence?'COMPLETED_EVIDENCE_BOUND':'IDLE_FAIL_SAFE'},null,2));

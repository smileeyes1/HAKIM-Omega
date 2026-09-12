import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=process.env.HAKIM_REPO_ROOT ? path.resolve(process.env.HAKIM_REPO_ROOT) : path.resolve(HERE,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const write=(p,v)=>fs.writeFileSync(path.join(ROOT,p),JSON.stringify(v,null,2)+'\n','utf8');

export function parseReport(body=''){
  if(!body.includes('HAKIM_BRIDGE_RESULT')) throw new Error('REPORT_MARKER_MISSING');
  const m=body.match(/```json\s*([\s\S]*?)```/i);
  if(!m) throw new Error('REPORT_JSON_BLOCK_MISSING');
  let r; try{r=JSON.parse(m[1])}catch{throw new Error('REPORT_JSON_INVALID')}
  return r;
}

export function validateReport(report, mission, opts={}){
  const errors=[];
  const owner=opts.owner||'smileeyes1';
  if(opts.author && opts.author!==owner) errors.push('UNTRUSTED_AUTHOR');
  if(!report || typeof report!=='object') errors.push('REPORT_NOT_OBJECT');
  if(report?.mission_id!==mission?.mission_id) errors.push('MISSION_ID_MISMATCH');
  if(!['PASS','FAIL'].includes(report?.status)) errors.push('BAD_STATUS');
  if(!Number.isInteger(report?.action_index)||report.action_index<0) errors.push('BAD_ACTION_INDEX');
  if(typeof report?.action_type!=='string') errors.push('BAD_ACTION_TYPE');
  if(typeof report?.host!=='string'||!Array.isArray(mission?.allowed_hosts)||!mission.allowed_hosts.includes(report.host)) errors.push('HOST_OUT_OF_SCOPE');
  if(typeof report?.path!=='string'||report.path.length>300) errors.push('BAD_PATH');
  const ts=Date.parse(report?.timestamp||'');
  if(!Number.isFinite(ts)) errors.push('BAD_TIMESTAMP');
  const created=Date.parse(mission?.created_at||'');
  const expires=Date.parse(mission?.expires_at||'');
  if(Number.isFinite(ts)&&Number.isFinite(created)&&ts<created-300000) errors.push('TIMESTAMP_BEFORE_MISSION');
  if(Number.isFinite(ts)&&Number.isFinite(expires)&&ts>expires+300000) errors.push('TIMESTAMP_AFTER_EXPIRY');
  if(report?.status==='PASS'){
    if(report.action_index!==mission.actions.length) errors.push('PASS_BEFORE_ALL_ACTIONS');
    if(report.action_type!=='COMPLETE') errors.push('PASS_NOT_COMPLETE');
    if(report.error_code) errors.push('PASS_WITH_ERROR');
  }
  return {pass:errors.length===0,errors,scope:report?.status==='PASS'?'SMOKE_SCOPE_ONLY':'FAIL_EVIDENCE_ONLY'};
}

function promotePass(report, mission){
  const tools=read('hakim/HAKIM_TOOL_REGISTRY.json');
  const local=tools.tools.find(x=>x.id==='local_browser_agent');
  if(!local) throw new Error('LOCAL_BROWSER_TOOL_MISSING');
  local.qualification ||= {};
  local.qualification.field_runtime='PASS_SMOKE_SCOPE_ONLY';
  local.qualification.field_evidence='hakim/FIELD_BRIDGE_EVIDENCE.json';
  write('hakim/HAKIM_TOOL_REGISTRY.json',tools);

  const platforms=read('platforms/platform-registry.json');
  const bridge=platforms.platforms.find(x=>x.id==='hakim_local_browser_bridge');
  if(!bridge) throw new Error('BRIDGE_PLATFORM_MISSING');
  bridge.mode='FIELD_SMOKE_PASS_SCOPE_LIMITED';
  bridge.field_evidence='hakim/FIELD_BRIDGE_EVIDENCE.json';
  write('platforms/platform-registry.json',platforms);

  const state=read('hakim/HAKIM_STATE.json');
  const bh=state.bridge_health.find(x=>x.id==='local_browser_agent');
  if(bh){bh.state='PASS_SMOKE_SCOPE_FIELD_EVIDENCE';bh.evidence='Actual phone roundtrip PASS for the staged harmless smoke mission; scope is limited to the tested mission and environment.'}
  state.evidence ||= {};
  state.evidence.staged_field_mission={status:'PASS_SMOKE_SCOPE_ONLY',mission_id:mission.mission_id,source:'hakim/FIELD_BRIDGE_EVIDENCE.json'};
  state.release_state='PASS_CONTROL_PLANE_HOST_SCOPE_FIELD_BRIDGE_SMOKE_PASS';
  state.mission.current_bottleneck='Representative-site expansion remains evidence-gated; the free local bridge has passed the staged phone smoke roundtrip only.';
  state.mission.next_highest_safe_action='Preserve smoke PASS, then qualify additional site adapters one representative workflow at a time without promoting beyond observed evidence.';
  state.mission.pending_external_user_step='None for the proven smoke scope. Protected login/2FA and high-impact confirmations remain user-local when a future mission requires them.';
  state.claims_limit='This PASS covers the host control plane and the actual staged local-browser smoke roundtrip on the user phone. It does not certify every website/action or grant external account permissions.';
  write('hakim/HAKIM_STATE.json',state);

  const staged=read('hakim/REMOTE_MISSION.json');
  if(staged.mission_id===mission.mission_id){staged.enabled=false;staged.completed_by_evidence='hakim/FIELD_BRIDGE_EVIDENCE.json';write('hakim/REMOTE_MISSION.json',staged)}
}

export function ingest(body, author, opts={}){
  const mission=opts.mission||read('hakim/REMOTE_MISSION.json');
  const report=parseReport(body);
  const validation=validateReport(report,mission,{author,owner:opts.owner});
  if(!validation.pass) throw new Error('REPORT_REJECTED:'+validation.errors.join(','));
  const evidence={
    schema_version:'1.0.0',
    evidence_type:'HAKIM_LOCAL_BROWSER_FIELD_REPORT',
    mission_id:mission.mission_id,
    result:report.status,
    scope:validation.scope,
    trusted_actor:author,
    report:{mission_id:report.mission_id,status:report.status,action_index:report.action_index,action_type:report.action_type,host:report.host,path:report.path,error_code:report.error_code||'',timestamp:report.timestamp},
    claims_limit:report.status==='PASS'?'PASS is limited to the staged smoke mission and observed phone/browser environment; no universal site/action certification.':'Failure evidence only; no PASS promotion.',
    ingested_at:new Date().toISOString()
  };
  write('hakim/FIELD_BRIDGE_EVIDENCE.json',evidence);
  if(report.status==='PASS') promotePass(report,mission);
  else {
    const state=read('hakim/HAKIM_STATE.json');
    const bh=state.bridge_health.find(x=>x.id==='local_browser_agent');
    if(bh){bh.state='FAIL_FIELD_EVIDENCE';bh.evidence='Actual phone smoke mission reported FAIL; see hakim/FIELD_BRIDGE_EVIDENCE.json.'}
    state.evidence ||= {};
    state.evidence.staged_field_mission={status:'FAIL_FIELD_EVIDENCE',mission_id:mission.mission_id,source:'hakim/FIELD_BRIDGE_EVIDENCE.json'};
    state.mission.current_bottleneck='Root-cause repair of the actual phone bridge failure.';
    state.mission.next_highest_safe_action='Inspect sanitized failure code, repair the causal selector/transport/state condition, rerun static tests, then stage a fresh bounded smoke mission.';
    write('hakim/HAKIM_STATE.json',state);
  }
  return evidence;
}

function main(){
  const body=process.env.HAKIM_REPORT_BODY||'';
  const author=process.env.HAKIM_REPORT_AUTHOR||'';
  const expected=process.env.HAKIM_EXPECTED_OWNER||'smileeyes1';
  try{console.log(JSON.stringify(ingest(body,author,{owner:expected}),null,2))}
  catch(e){console.error(JSON.stringify({pass:false,error:e.message},null,2));process.exitCode=1}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();

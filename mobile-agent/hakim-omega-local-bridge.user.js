// ==UserScript==
// @name         حكيم Ω — الجسر المحلي المجاني
// @namespace    hakim-omega-local-bridge
// @version      0.1.3
// @description  جسر محلي آمن على Firefox/Violentmonkey يلتقط مهام حكيم غير السرية من GitHub وينفذها على نطاقات مسموحة مع حالة مستمرة وتقارير منقحة ومقاومة لضغط الطلبات.
// @updateURL    https://raw.githubusercontent.com/smileeyes1/HAKIM-Omega/main/mobile-agent/hakim-omega-local-bridge.user.js
// @downloadURL  https://raw.githubusercontent.com/smileeyes1/HAKIM-Omega/main/mobile-agent/hakim-omega-local-bridge.user.js
// @match        https://gemini.google.com/*
// @match        https://github.com/*
// @match        https://docs.google.com/*
// @match        https://drive.google.com/*
// @match        https://mail.google.com/*
// @match        https://calendar.google.com/*
// @match        https://notion.so/*
// @match        https://www.notion.so/*
// @match        https://app.todoist.com/*
// @match        https://www.canva.com/*
// @match        https://www.figma.com/*
// @match        https://replit.com/*
// @match        https://vercel.com/*
// @match        https://www.dropbox.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';
  const VERSION='٠٫١٫٣';
  const ROOT='hakim-omega-local-bridge';
  const K='hakim_omega_bridge_';
  const MISSION_URL='https://raw.githubusercontent.com/smileeyes1/HAKIM-Omega/main/hakim/REMOTE_MISSION.json';
  const RELAY_URL='https://github.com/smileeyes1/HAKIM-Omega/issues/1';
  const HEARTBEAT_MS=60*60*1000, MANUAL_DEBOUNCE_MS=5000, BACKOFF_BASE_MS=30000, BACKOFF_MAX_MS=15*60*1000, MAX_ACTIONS=50, MAX_WAIT=120000, MAX_DELAY=10000;
  const ALLOWED=new Set(['gemini.google.com','github.com','docs.google.com','drive.google.com','mail.google.com','calendar.google.com','notion.so','www.notion.so','app.todoist.com','www.canva.com','www.figma.com','replit.com','vercel.com','www.dropbox.com']);
  const REMOTE_CLASSES=new Set(['PUBLIC','INTERNAL_NON_SENSITIVE']);
  const SECRET=['password','passcode','otp','one-time','verification code','security code','cvv','cvc','card number','bank account','routing number','كلمة المرور','رمز التحقق','رمز الأمان','بطاقة','حساب بنكي'];
  const HIGH=['delete','remove account','purchase','buy','checkout','pay','transfer','publish','send email','send message','حذف','شراء','دفع','تحويل','نشر','إرسال بريد','إرسال رسالة'];
  const get=(n,d=null)=>GM_getValue(K+n,d), set=(n,v)=>GM_setValue(K+n,v), del=n=>GM_deleteValue(K+n);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const norm=s=>(s||'').replace(/\s+/g,' ').trim().toLowerCase();
  const visible=e=>!!(e&&e.isConnected&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none');
  const txt=e=>norm(e?.innerText||e?.textContent||e?.getAttribute?.('aria-label')||e?.getAttribute?.('placeholder')||'');
  const now=()=>new Date().toISOString();
  const safePath=()=>location.pathname.slice(0,300);
  const log=(m,c='')=>{const b=document.querySelector('#hakim-bridge-log');if(b){const d=document.createElement('div');d.textContent=m;d.className=c;b.prepend(d)}console.log('[HAKIM Ω]',m)};
  const status=m=>{set('status',m);const e=document.querySelector('#hakim-bridge-status');if(e)e.textContent=m};
  const east=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[+d]);
  function sanitizedError(e){const s=String(e?.message||e||'UNKNOWN').replace(/[\r\n]+/g,' ').slice(0,180);return s.replace(/https?:\/\/\S+/g,'[رابط]')}
  function reportBase(mission,statusValue,index,type,errorCode='') {return {mission_id:mission?.mission_id||'UNKNOWN',status:statusValue,action_index:index,action_type:type||'',host:location.hostname,path:safePath(),error_code:errorCode,timestamp:now()}}
  function containsAny(s,list){const n=norm(s);return list.some(x=>n.includes(norm(x)))}
  function allowedUrl(url,mission){let u;try{u=new URL(url,location.href)}catch{return false}if(u.protocol!=='https:'||!ALLOWED.has(u.hostname))return false;if(Array.isArray(mission.allowed_hosts)&&mission.allowed_hosts.length&&!mission.allowed_hosts.includes(u.hostname))return false;return true}
  function needsConfirm(action){return containsAny(JSON.stringify(action),HIGH)}
  function localConfirm(mission,action){if(!needsConfirm(action)&&!mission.requires_local_confirmation)return true;const key='confirmed_'+mission.mission_id;if(get(key,false))return true;const ok=window.confirm('حكيم: هذه المهمة تتضمن إجراءً عالي الأثر. هل تسمح بتنفيذها الآن؟');if(ok)set(key,true);return ok}
  function fieldIsSecret(el){const m=norm([el?.type,el?.name,el?.id,el?.getAttribute?.('aria-label'),el?.getAttribute?.('placeholder'),el?.closest?.('label')?.innerText].filter(Boolean).join(' '));return el?.type==='password'||containsAny(m,SECRET)}
  async function waitFor(fn,timeout=30000,step=300){const end=Date.now()+Math.min(timeout,MAX_WAIT);while(Date.now()<end){try{const x=fn();if(x)return x}catch{}await sleep(step)}return null}
  function setValue(el,value){if(!el)throw Error('FIELD_NOT_FOUND');if(fieldIsSecret(el))throw Error('SECRET_FIELD_BLOCKED');el.focus({preventScroll:false});if(el.tagName==='INPUT'||el.tagName==='TEXTAREA'){const p=Object.getPrototypeOf(el),setter=Object.getOwnPropertyDescriptor(p,'value')?.set;if(setter)setter.call(el,value);else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true,composed:true}));el.dispatchEvent(new Event('change',{bubbles:true,composed:true}))}else if(el.isContentEditable||el.getAttribute('contenteditable')==='true'){try{document.execCommand('selectAll',false,null);document.execCommand('insertText',false,value)}catch{el.textContent=value}if(!el.textContent?.includes(value)){el.textContent='';const p=document.createElement('p');p.textContent=value;el.appendChild(p)}el.dispatchEvent(new Event('input',{bubbles:true,composed:true}))}else throw Error('NOT_EDITABLE')}
  function findText(target,selectors='button,a,[role="button"],[role="menuitem"],[role="option"],[role="tab"],label,span,div'){const n=norm(target),els=[...document.querySelectorAll(selectors)].filter(visible).filter(e=>!e.closest('#'+ROOT));return els.find(e=>txt(e)===n)||els.find(e=>txt(e).includes(n))||null}
  function findGeminiEditor(){const sels=['rich-textarea .ql-editor[contenteditable="true"]','rich-textarea [contenteditable="true"]','.ql-editor[contenteditable="true"]','div[role="textbox"][contenteditable="true"]','[aria-label*="prompt" i][contenteditable="true"]'];for(const s of sels){const e=document.querySelector(s);if(visible(e))return e}return null}
  function findGeminiSend(){const sels=['button[aria-label="Send message"]','button.send-button','button[aria-label*="Send prompt" i]','button[aria-label*="Send" i]','button[mattooltip*="Send" i]'];for(const s of sels){const e=document.querySelector(s);if(visible(e)&&!e.disabled)return e}return null}
  async function geminiPrompt(prompt){if(location.hostname!=='gemini.google.com')throw Error('WRONG_HOST_FOR_GEMINI');const editor=await waitFor(findGeminiEditor,30000);if(!editor)throw Error('GEMINI_EDITOR_NOT_FOUND');const before=document.querySelectorAll('model-response').length;setValue(editor,prompt);await sleep(400);const send=await waitFor(findGeminiSend,10000);if(!send)throw Error('GEMINI_SEND_NOT_FOUND');send.click();const response=await waitFor(()=>{const a=[...document.querySelectorAll('model-response')];return a.length>before?a.at(-1):null},45000);if(!response)throw Error('GEMINI_RESPONSE_NOT_STARTED');let last='',stable=0;const end=Date.now()+MAX_WAIT;while(Date.now()<end){const t=(response.innerText||response.textContent||'').trim();const stop=document.querySelector('button.stop-button,[aria-label*="Stop" i]');if(t===last&&!stop)stable++;else stable=0;last=t;if(stable>=4&&t.length)break;await sleep(1000)}return {char_count:last.length}}
  function retryAfterMs(raw){if(!raw)return 0;const seconds=Number(raw);if(Number.isFinite(seconds)&&seconds>=0)return Math.min(seconds*1000,BACKOFF_MAX_MS);const t=Date.parse(raw);return Number.isFinite(t)?Math.min(Math.max(0,t-Date.now()),BACKOFF_MAX_MS):0}
  function backoffMs(attempt){const exp=Math.min(BACKOFF_MAX_MS,BACKOFF_BASE_MS*(2**Math.min(attempt,5)));const jitter=Math.floor(Math.random()*Math.min(5000,Math.max(1000,exp*0.2)));return Math.min(BACKOFF_MAX_MS,exp+jitter)}
  function recordRateLimit(waitMs,code='RATE_LIMIT'){const until=Date.now()+waitMs;set('rate_limit_until',until);set('rate_limit_code',code);set('rate_limit_attempt',(get('rate_limit_attempt',0)||0)+1);status('ضغط مؤقت على الخدمة — سيعيد حكيم التقييم لاحقًا دون تكرار مزعج');log('تم تفعيل الحماية من ضغط الطلبات: '+code,'bad')}
  function clearRateLimit(){set('rate_limit_attempt',0);del('rate_limit_until');del('rate_limit_code')}
  function fetchMission(){return new Promise((resolve,reject)=>GM_xmlhttpRequest({method:'GET',url:MISSION_URL+'?t='+Date.now(),timeout:15000,headers:{'Cache-Control':'no-cache'},onload:r=>{try{if(r.status===429||r.status===403){const wait=retryAfterMs(r.responseHeaders?.match(/retry-after:\s*([^\r\n]+)/i)?.[1])||backoffMs(get('rate_limit_attempt',0)||0);recordRateLimit(wait,'MISSION_HTTP_'+r.status);throw Error('RATE_LIMIT_'+r.status)}if(r.status<200||r.status>=300)throw Error('MISSION_HTTP_'+r.status);clearRateLimit();resolve(JSON.parse(r.responseText))}catch(e){reject(e)}},onerror:()=>reject(Error('MISSION_NETWORK')),ontimeout:()=>reject(Error('MISSION_TIMEOUT'))}))}
  function validateMission(m){if(!m||m.enabled!==true)return {ok:false,idle:true};if(!m.mission_id||!Array.isArray(m.actions))throw Error('MISSION_SCHEMA');if(m.actions.length>MAX_ACTIONS)throw Error('TOO_MANY_ACTIONS');if(!REMOTE_CLASSES.has(m.data_classification))throw Error('CLASSIFICATION_BLOCKED');if(m.expires_at&&Date.now()>Date.parse(m.expires_at))throw Error('MISSION_EXPIRED');if(Array.isArray(m.allowed_hosts)&&m.allowed_hosts.some(h=>!ALLOWED.has(h)))throw Error('UNKNOWN_HOST_IN_MISSION');const raw=norm(JSON.stringify(m));if(containsAny(raw,SECRET))throw Error('SECRET_TOKEN_IN_PUBLIC_MISSION');return {ok:true}}
  async function executeAction(m,a,i){status('تنفيذ '+east(i+1)+' من '+east(m.actions.length)+' — '+(a.type||''));if(!a?.type)throw Error('ACTION_TYPE_MISSING');if(!localConfirm(m,a))throw Error('LOCAL_CONFIRMATION_DECLINED');switch(a.type){case 'NAVIGATE':{if(!allowedUrl(a.url,m))throw Error('NAVIGATION_BLOCKED');set('action_index',i+1);set('active_mission',m);location.href=new URL(a.url,location.href).href;return {navigated:true}}case 'DELAY':await sleep(Math.min(Number(a.ms)||500,MAX_DELAY));return {};case 'WAIT_TEXT':{const x=await waitFor(()=>document.body?.innerText?.includes(a.text),a.timeout_ms||30000);if(!x)throw Error('WAIT_TEXT_TIMEOUT');return {}}case 'WAIT_SELECTOR':{const x=await waitFor(()=>{const e=document.querySelector(a.selector);return visible(e)&&e},a.timeout_ms||30000);if(!x)throw Error('WAIT_SELECTOR_TIMEOUT');return {}}case 'CLICK_TEXT':{const e=await waitFor(()=>findText(a.text),a.timeout_ms||15000);if(!e)throw Error('CLICK_TEXT_NOT_FOUND');e.click();return {}}case 'CLICK_SELECTOR':{const e=await waitFor(()=>{const x=document.querySelector(a.selector);return visible(x)&&x},a.timeout_ms||15000);if(!e)throw Error('CLICK_SELECTOR_NOT_FOUND');e.click();return {}}case 'FILL_SELECTOR':{const e=await waitFor(()=>{const x=document.querySelector(a.selector);return visible(x)&&x},a.timeout_ms||15000);if(!e)throw Error('FILL_SELECTOR_NOT_FOUND');setValue(e,String(a.value??''));return {}}case 'ASSERT_TEXT':if(!document.body?.innerText?.includes(a.text))throw Error('ASSERT_TEXT_FAIL');return {};case 'GEMINI_PROMPT':return await geminiPrompt(String(a.prompt||''));case 'SNAPSHOT_META':return {title:(document.title||'').slice(0,120),char_count:(document.body?.innerText||'').length};case 'REPORT':return {};default:throw Error('UNKNOWN_ACTION')}}
  async function runMission(m,resume=false){if(get('running',false))return;set('running',true);set('active_mission',m);let i=resume?(get('action_index',0)||0):0;if(!resume)set('action_index',0);try{for(;i<m.actions.length;i++){if(get('paused',false))throw Error('PAUSED_BY_USER');const a=m.actions[i];set('action_index',i);const r=await executeAction(m,a,i);if(r?.navigated){set('running',false);return}set('last_step',{i,type:a.type,at:now(),meta:r||{}});set('action_index',i+1)}const rep=reportBase(m,'PASS',m.actions.length,'COMPLETE','');set('last_completed_mission_id',m.mission_id);set('last_report',rep);set('running',false);status('اكتملت المهمة محليًا');await sendReport(rep)}catch(e){const rep=reportBase(m,'FAIL',i,m.actions[i]?.type||'',sanitizedError(e));set('last_report',rep);set('running',false);status('توقف آمن: '+sanitizedError(e));log('فشل: '+sanitizedError(e),'bad');await sendReport(rep)}}
  async function sendReport(rep){set('pending_report',rep);if(location.hostname==='github.com'&&location.pathname==='/smileeyes1/HAKIM-Omega/issues/1'){await postPendingReport();return}location.href=RELAY_URL+'?hakim_report=1'}
  async function postPendingReport(){const rep=get('pending_report',null);if(!rep)return;const box=await waitFor(()=>{const sels=['textarea[name="comment[body]"]','#new_comment_field','textarea[placeholder*="comment" i]','[contenteditable="true"][role="textbox"]'];for(const s of sels){const e=document.querySelector(s);if(visible(e))return e}return null},15000);if(!box){status('يلزم تسجيل الدخول إلى GitHub مرة واحدة لإرسال تقرير الجسر');return}const body='HAKIM_BRIDGE_RESULT\n```json\n'+JSON.stringify(rep,null,2)+'\n```';setValue(box,body);const submit=await waitFor(()=>{const candidates=[...document.querySelectorAll('button[type="submit"],button')].filter(visible);return candidates.find(b=>/comment|submit|تعليق|إرسال/.test(txt(b))&&!b.disabled)},10000);if(!submit){status('تعذر العثور على زر إرسال تقرير GitHub');return}submit.click();del('pending_report');status('أُرسل تقرير الحالة المنقح');try{history.replaceState(null,'',RELAY_URL)}catch{}}
  async function poll(manual=false){
    if(get('poll_inflight',false)){if(manual)status('الفحص جارٍ بالفعل — لن يكرر حكيم الطلب');return}
    if(get('running',false)){if(manual)status('هناك مهمة قيد التنفيذ الآن');return}
    if(!get('enabled',false)){if(manual)status('الجسر متوقف — اضغط «تفعيل» أولًا');return}
    const until=Number(get('rate_limit_until',0)||0);if(until>Date.now()){if(manual)status('الحماية من ضغط الطلبات فعّالة — انتظر قليلًا ثم حاول مرة واحدة');return}
    if(manual){const lastManual=Number(get('last_manual_poll_at',0)||0);if(Date.now()-lastManual<MANUAL_DEBOUNCE_MS){status('تم تجاهل الضغط المتكرر — فحص واحد يكفي');return}set('last_manual_poll_at',Date.now());status('جارٍ الفحص الآن…');log('بدأ فحص يدوي')}
    set('poll_inflight',true);
    try{
      const m=await fetchMission();
      const v=validateMission(m);
      set('last_check_at',now());
      if(v.idle){if(manual){status('تم الفحص — لا توجد مهمة جديدة، الجسر يعمل');log('الفحص ناجح — لا توجد مهمة جديدة')}return}
      const last=get('last_completed_mission_id','');
      const active=get('active_mission',null);
      if(active?.mission_id===m.mission_id&&(get('action_index',0)||0)>0){if(manual)status('تم العثور على مهمة غير مكتملة — جارٍ الاستئناف');await runMission(m,true);return}
      if(m.mission_id===last){if(manual){status('تم الفحص — آخر مهمة منفذة بالفعل');log('لا توجد مهمة جديدة بعد آخر نجاح')}return}
      set('paused',false);
      if(manual)status('تم العثور على مهمة جديدة — بدء التنفيذ');
      await runMission(m,false)
    }catch(e){const code=sanitizedError(e);if(/^RATE_LIMIT_/.test(code)){status('ضغط مؤقت على الخدمة — لن يعيد حكيم الطلب حتى انتهاء فترة الحماية')}else{status('الجسر جاهز — تعذر جلب مهمة: '+code);log('فشل الفحص: '+code,'bad')}}finally{set('poll_inflight',false)}
  }
  function panel(){if(document.getElementById(ROOT))return;const r=document.createElement('section');r.id=ROOT;r.dir='rtl';r.innerHTML=`<style>#${ROOT}{position:fixed;z-index:2147483647;right:10px;bottom:10px;width:min(92vw,410px);background:#fff;color:#111;border:1px solid #bbb;border-radius:16px;padding:11px;box-shadow:0 8px 28px #0003;font-family:system-ui;direction:rtl;text-align:right}#${ROOT} button{padding:8px 11px;margin:3px;border:0;border-radius:10px;background:#eee;font-weight:700;transition:transform .08s ease,opacity .08s ease}#${ROOT} button:active{transform:scale(.96);opacity:.72}#${ROOT} .go{background:#111;color:#fff}#hakim-bridge-status{background:#f4f4f4;padding:8px;border-radius:9px;margin:7px 0;min-height:1.5em}#hakim-bridge-log{max-height:110px;overflow:auto;font-size:11px;border-top:1px solid #ddd;margin-top:6px;padding-top:5px}.bad{color:#a40000}</style><b>حكيم Ω — الجسر المحلي المجاني ${VERSION}</b><div id="hakim-bridge-status" aria-live="polite">${get('status','متوقف محليًا')}</div><button class="go" id="hakim-bridge-on">تفعيل</button><button id="hakim-bridge-off">إيقاف</button><button id="hakim-bridge-check">فحص الآن</button><button id="hakim-bridge-report">آخر تقرير</button><div id="hakim-bridge-log"></div>`;document.body.appendChild(r);document.querySelector('#hakim-bridge-on').onclick=()=>{set('enabled',true);set('paused',false);status('مفعّل — جارٍ فحص الاتصال الآن');log('تم تفعيل الجسر محليًا');poll(true)};document.querySelector('#hakim-bridge-off').onclick=()=>{set('enabled',false);set('paused',true);status('متوقف محليًا');log('تم إيقاف الجسر محليًا')};document.querySelector('#hakim-bridge-check').onclick=()=>poll(true);document.querySelector('#hakim-bridge-report').onclick=()=>{status('عرض آخر تقرير محلي');const x=get('last_report',null);alert(x?JSON.stringify(x,null,2):'لا يوجد تقرير بعد')}}
  function boot(){panel();if(location.hostname==='github.com'&&location.pathname==='/smileeyes1/HAKIM-Omega/issues/1'&&get('pending_report',null))setTimeout(postPendingReport,1200);const active=get('active_mission',null);if(get('enabled',false)&&active&&get('action_index',0)>0&&!get('running',false))setTimeout(()=>runMission(active,true),1200);setInterval(()=>poll(false),HEARTBEAT_MS);setTimeout(()=>{if(get('enabled',false))poll(false)},1500)}
  const mo=new MutationObserver(panel);mo.observe(document.documentElement,{childList:true,subtree:true});boot();
})();
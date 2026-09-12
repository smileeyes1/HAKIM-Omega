import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const assert = (c, m) => { if (!c) throw new Error(m); };

const manifestPath = 'android-hakim/app/src/main/AndroidManifest.xml';
const policyPath = 'android-hakim/app/src/main/java/ps/hakim/omega/HakimPolicy.java';
const missionClientPath = 'android-hakim/app/src/main/java/ps/hakim/omega/MissionClient.java';
const activityPath = 'android-hakim/app/src/main/java/ps/hakim/omega/MainActivity.java';
const servicePath = 'android-hakim/app/src/main/java/ps/hakim/omega/HakimAccessibilityService.java';
const accessPath = 'android-hakim/app/src/main/res/xml/accessibility_service_config.xml';
const buildPath = 'android-hakim/app/build.gradle';
const baselinePath = 'android-hakim/SAFE_CORE_BASELINE.json';

const manifest = read(manifestPath);
const policy = read(policyPath);
const missionClient = read(missionClientPath);
const activity = read(activityPath);
const build = read(buildPath);
const baseline = JSON.parse(read(baselinePath));
const relay = read('mobile-agent/hakim-android-report-relay.user.js');
const mission = JSON.parse(read('hakim/HAKIM_ANDROID_MISSION.json'));

assert(baseline.baseline_id === 'HAKIM_ANDROID_SAFE_CORE', 'safe-core baseline id drifted');
assert(baseline.version === '0.2.0-debug', 'safe-core baseline version drifted');
assert(baseline.package === 'ps.hakim.safe.debug', 'safe-core baseline package drifted');
assert(baseline.mode === 'SAFE_CORE_NO_ACCESSIBILITY', 'safe-core baseline mode drifted');
assert(baseline.cost_policy === 'FREE_OR_INCLUDED_ONLY', 'safe-core baseline cost policy drifted');
assert(baseline.field_status === 'FIELD_PENDING', 'safe-core baseline must remain field-pending');
assert(Array.isArray(baseline.permissions) && baseline.permissions.length === 1 && baseline.permissions[0] === 'android.permission.INTERNET', 'safe-core baseline permission set drifted');
assert(Array.isArray(baseline.allowed_remote_actions) && JSON.stringify(baseline.allowed_remote_actions) === JSON.stringify(['OPEN_URL','WAIT','STATUS','REPORT']), 'safe-core baseline action set drifted');
assert(baseline.forbidden_capabilities.includes('AccessibilityService') && baseline.forbidden_capabilities.includes('BIND_ACCESSIBILITY_SERVICE'), 'safe-core forbidden Accessibility capability missing');
assert(/Never ask the user to disable or bypass Play Protect/i.test(baseline.play_protect_rule), 'Play Protect no-bypass rule missing');
assert(/never equals actual-phone PASS/i.test(baseline.field_rule), 'host-vs-field truth boundary missing');

assert(/android:allowBackup="false"/.test(manifest), 'backup must stay disabled');
assert(/android:usesCleartextTraffic="false"/.test(manifest), 'cleartext traffic must stay disabled');
assert(/android\.permission\.INTERNET/.test(manifest), 'internet permission missing');
assert(!/READ_CONTACTS|READ_SMS|RECORD_AUDIO|CAMERA|ACCESS_FINE_LOCATION|MANAGE_EXTERNAL_STORAGE/.test(manifest), 'unexpected dangerous permission');
assert(!/BIND_ACCESSIBILITY_SERVICE|AccessibilityService/.test(manifest), 'safe core must not expose accessibility service');
assert(/android:label="حكيم الآمن"/.test(manifest), 'safe-core app label drifted');
assert(!fs.existsSync(servicePath), 'accessibility service source must be absent from safe core');
assert(!fs.existsSync(accessPath), 'accessibility configuration must be absent from safe core');

assert(/applicationId 'ps\.hakim\.safe'/.test(build), 'safe-core package identity drifted');
assert(/versionCode 2/.test(build), 'safe-core versionCode drifted');
assert(/versionName '0\.2\.0'/.test(build), 'safe-core Gradle version drifted');
assert(/APP_VERSION = "٠٫٢٫٠"/.test(policy), 'policy/app version drifted');
assert(/SAFE_CORE_NO_ACCESSIBILITY/.test(policy), 'safe-core mode missing');
assert(/"FREE", "INCLUDED"/.test(policy), 'free/included cost allowlist missing');
assert(!/ALLOWED_COST[^\n]*METERED/.test(policy), 'metered cost became auto-allowed');
assert(/MISSION_URL/.test(policy) && /RELAY_INSTALL_URL/.test(policy), 'mission or relay binding missing');
assert(/ALL_EIGHT/.test(policy) && /HOW_SEVEN/.test(policy) && /WISDOM_SEVEN/.test(policy) && /INNOVATION_SEVEN/.test(policy), 'governing engines missing');
assert(/BLOCKED_BY_COST/.test(missionClient), 'cost fail-closed gate missing');
assert(/MISSION_EXPIRED/.test(missionClient) && /MISSION_LIFETIME_TOO_LONG/.test(missionClient), 'mission time boundary missing');
assert(/HIGH_IMPACT_REMOTE_BLOCKED/.test(missionClient), 'remote high-impact block missing');
assert(/SECRET_MARKER_BLOCKED/.test(missionClient), 'secret mission block missing');
assert(/ACTION_TYPE_BLOCKED_SAFE_CORE/.test(missionClient), 'safe-core action gate missing');
assert(!/SET_TEXT|CLICK_TEXT|ASSERT_TEXT/.test(missionClient), 'safe core must not accept UI automation actions');
assert(!/Settings\.ACTION_ACCESSIBILITY_SETTINGS|AccessibilityServiceInfo|AccessibilityManager/.test(activity), 'activity must not request accessibility');
assert(!/WebView/.test(activity), 'embedded WebView must not replace trusted external login surfaces');
assert(/تثبيت قناة التقرير المجانية/.test(activity), 'free report relay installer missing');
assert(/صلاحية حساسة: صفر/.test(activity), 'visible no-sensitive-permission statement missing');
assert(/Base64\.URL_SAFE/.test(activity) && /HAKIM_ANDROID/.test(activity), 'sanitized Android report binding missing');

assert(mission.enabled === true, 'field mission must be staged');
assert(mission.cost_class === 'FREE', 'field mission must remain free');
assert(mission.data_classification === 'PUBLIC', 'field mission must remain public');
assert(/^[A-Z0-9_\-]{1,120}$/.test(mission.mission_id), 'mission id invalid');
const created = Date.parse(mission.created_at), expires = Date.parse(mission.expires_at);
assert(Number.isFinite(created) && Number.isFinite(expires) && expires > created, 'mission time invalid');
assert(expires - created <= 14 * 24 * 3600 * 1000, 'mission lifetime too long');
assert(Array.isArray(mission.actions) && mission.actions.length > 0 && mission.actions.length <= 20, 'mission action count invalid');
for (const a of mission.actions) assert(baseline.allowed_remote_actions.includes(a.type), `blocked safe-core action: ${a.type}`);
assert(JSON.stringify(mission).length < 6000, 'mission unexpectedly large');

assert(/hakim_android_result/.test(relay), 'Android relay fragment binding missing');
assert(/SOURCE_BLOCKED/.test(relay) && /REPORT_SECRET_BLOCKED/.test(relay), 'relay fail-closed validation missing');
assert(/HAKIM_ANDROID_RESULT/.test(relay), 'relay evidence marker missing');

const all = [manifest, build, policy, missionClient, activity, relay, JSON.stringify(mission), JSON.stringify(baseline)].join('\n').toLowerCase();
for (const marker of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=', 'hook.eu1.make.com/', 'ntfy.sh/hakim-cmd-']) {
  assert(!all.includes(marker), `possible secret/private endpoint persisted: ${marker}`);
}

console.log(JSON.stringify({pass:true, gate:'HAKIM_ANDROID_SAFE_CORE_FAIL_CLOSED', mode:baseline.mode, package:baseline.package, version:baseline.version, permissions:baseline.permissions, field_status:baseline.field_status, mission:mission.mission_id, actions:mission.actions.length}, null, 2));

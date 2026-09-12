import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const assert = (c, m) => { if (!c) throw new Error(m); };

const manifest = read('android-hakim/app/src/main/AndroidManifest.xml');
const policy = read('android-hakim/app/src/main/java/ps/hakim/omega/HakimPolicy.java');
const missionClient = read('android-hakim/app/src/main/java/ps/hakim/omega/MissionClient.java');
const service = read('android-hakim/app/src/main/java/ps/hakim/omega/HakimAccessibilityService.java');
const activity = read('android-hakim/app/src/main/java/ps/hakim/omega/MainActivity.java');
const access = read('android-hakim/app/src/main/res/xml/accessibility_service_config.xml');
const relay = read('mobile-agent/hakim-android-report-relay.user.js');
const mission = JSON.parse(read('hakim/HAKIM_ANDROID_MISSION.json'));

assert(/android:allowBackup="false"/.test(manifest), 'backup must stay disabled');
assert(/android:usesCleartextTraffic="false"/.test(manifest), 'cleartext traffic must stay disabled');
assert(/android\.permission\.INTERNET/.test(manifest), 'internet permission missing');
assert(!/READ_CONTACTS|READ_SMS|RECORD_AUDIO|CAMERA|ACCESS_FINE_LOCATION|MANAGE_EXTERNAL_STORAGE/.test(manifest), 'unexpected dangerous permission');
assert(/BIND_ACCESSIBILITY_SERVICE/.test(manifest), 'accessibility service binding missing');
assert(/android:packageNames="org\.mozilla\.firefox,com\.android\.chrome,com\.google\.android\.googlequicksearchbox"/.test(access), 'accessibility package allowlist changed');

assert(/"FREE", "INCLUDED"/.test(policy), 'free/included cost allowlist missing');
assert(!/ALLOWED_COST[^\n]*METERED/.test(policy), 'metered cost became auto-allowed');
assert(/MISSION_URL/.test(policy) && /RELAY_INSTALL_URL/.test(policy), 'mission or relay binding missing');
assert(/ALL_EIGHT/.test(policy) && /HOW_SEVEN/.test(policy) && /WISDOM_SEVEN/.test(policy) && /INNOVATION_SEVEN/.test(policy), 'governing engines missing');
assert(/BLOCKED_BY_COST/.test(missionClient), 'cost fail-closed gate missing');
assert(/MISSION_EXPIRED/.test(missionClient) && /MISSION_LIFETIME_TOO_LONG/.test(missionClient), 'mission time boundary missing');
assert(/HIGH_IMPACT_REMOTE_BLOCKED/.test(missionClient), 'remote high-impact block missing');
assert(/SECRET_MARKER_BLOCKED/.test(missionClient), 'secret mission block missing');
assert(/FOREGROUND_PACKAGE_BLOCKED/.test(service), 'foreground package gate missing');
assert(/isPassword\(\)/.test(service) && /containsSecretMarker/.test(service), 'secret-field defense missing');
assert(/Base64\.URL_SAFE/.test(service) && /HAKIM_ANDROID/.test(service), 'sanitized Android report binding missing');
assert(!/WebView/.test(activity), 'embedded WebView must not replace external trusted login surfaces');
assert(/تثبيت قناة التقرير المجانية/.test(activity), 'free report relay installer missing');
assert(/COST|Credit|Metered|FREE\/INCLUDED/.test(activity), 'visible cost policy missing');

assert(mission.enabled === true, 'field mission must be staged');
assert(mission.cost_class === 'FREE', 'field mission must remain free');
assert(mission.data_classification === 'PUBLIC', 'field mission must remain public');
assert(/^[A-Z0-9_\-]{1,120}$/.test(mission.mission_id), 'mission id invalid');
const created = Date.parse(mission.created_at), expires = Date.parse(mission.expires_at);
assert(Number.isFinite(created) && Number.isFinite(expires) && expires > created, 'mission time invalid');
assert(expires - created <= 14 * 24 * 3600 * 1000, 'mission lifetime too long');
assert(Array.isArray(mission.actions) && mission.actions.length > 0 && mission.actions.length <= 30, 'mission action count invalid');
for (const a of mission.actions) assert(['OPEN_URL','WAIT','SET_TEXT','CLICK_TEXT','ASSERT_TEXT','STATUS','REPORT'].includes(a.type), `blocked mission action: ${a.type}`);
assert(JSON.stringify(mission).length < 6000, 'mission unexpectedly large');

assert(/hakim_android_result/.test(relay), 'Android relay fragment binding missing');
assert(/SOURCE_BLOCKED/.test(relay) && /REPORT_SECRET_BLOCKED/.test(relay), 'relay fail-closed validation missing');
assert(/HAKIM_ANDROID_RESULT/.test(relay), 'relay evidence marker missing');

const all = [manifest, policy, missionClient, service, activity, access, relay, JSON.stringify(mission)].join('\n').toLowerCase();
for (const marker of ['password=', 'api_key=', 'authorization: bearer ', 'session_cookie=', 'recovery_code=', 'hook.eu1.make.com/', 'ntfy.sh/hakim-cmd-']) {
  assert(!all.includes(marker), `possible secret/private endpoint persisted: ${marker}`);
}

console.log(JSON.stringify({pass:true, gate:'HAKIM_ANDROID_STATIC_FAIL_CLOSED', mission:mission.mission_id, actions:mission.actions.length}, null, 2));

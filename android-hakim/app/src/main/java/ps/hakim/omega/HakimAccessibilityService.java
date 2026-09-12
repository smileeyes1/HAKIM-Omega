package ps.hakim.omega;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public final class HakimAccessibilityService extends AccessibilityService {
    private static final String PREFS = "hakim_state";
    private static final long POLL_MS = 30000L;
    private static volatile HakimAccessibilityService instance;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    private final AtomicBoolean polling = new AtomicBoolean(false);
    private final Runnable periodicPoll = () -> pollNow("دوري");

    private JSONObject mission;
    private JSONArray actions;
    private int actionIndex;

    public static void requestImmediatePoll(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean("poll_requested", true).apply();
        HakimAccessibilityService s = instance;
        if (s != null) s.pollNow("يدوي");
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        setStatus("خدمة حكيم المحلية متصلة");
        if (isEnabledByUser()) handler.postDelayed(() -> pollNow("بدء"), 600);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // لا نجمع محتوى الأحداث. نقرأ شجرة الواجهة فقط أثناء فعل محدود ومصرح به.
    }

    @Override
    public void onInterrupt() {
        setStatus("توقفت خدمة إمكانية الوصول مؤقتًا");
    }

    @Override
    public void onDestroy() {
        instance = null;
        handler.removeCallbacksAndMessages(null);
        network.shutdownNow();
        super.onDestroy();
    }

    private boolean isEnabledByUser() {
        return getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean("enabled", false);
    }

    private void scheduleNext() {
        handler.removeCallbacks(periodicPoll);
        if (isEnabledByUser()) handler.postDelayed(periodicPoll, POLL_MS);
    }

    private void pollNow(String source) {
        handler.removeCallbacks(periodicPoll);
        if (!isEnabledByUser()) {
            setStatus("حكيم متوقف محليًا");
            return;
        }
        if (!polling.compareAndSet(false, true)) {
            setStatus("فحص سابق ما زال يعمل");
            return;
        }
        setStatus("جارٍ الفحص الآن — " + source);
        network.execute(() -> {
            try {
                JSONObject fetched = MissionClient.fetchMission();
                handler.post(() -> beginMission(fetched));
            } catch (Exception e) {
                handler.post(() -> {
                    String code = sanitize(e.getMessage());
                    if ("MISSION_IDLE".equals(code)) setStatus("الجسر يعمل — لا توجد مهمة جديدة");
                    else setStatus("توقف آمن: " + code);
                    polling.set(false);
                    scheduleNext();
                });
            }
        });
    }

    private void beginMission(JSONObject fetched) {
        try {
            String id = fetched.getString("mission_id");
            String last = getSharedPreferences(PREFS, MODE_PRIVATE).getString("last_completed_mission_id", "");
            if (id.equals(last)) {
                setStatus("الجسر يعمل — المهمة الحالية منفذة سابقًا");
                polling.set(false);
                scheduleNext();
                return;
            }
            mission = fetched;
            actions = mission.getJSONArray("actions");
            actionIndex = 0;
            setStatus("عُثر على مهمة آمنة: " + id);
            executeNext();
        } catch (Exception e) {
            failMission(e);
        }
    }

    private void executeNext() {
        if (!isEnabledByUser()) {
            failMission(new IllegalStateException("PAUSED_BY_USER"));
            return;
        }
        if (actions == null || actionIndex >= actions.length()) {
            completeMission();
            return;
        }
        try {
            JSONObject a = actions.getJSONObject(actionIndex);
            String type = a.getString("type");
            setStatus("تنفيذ " + eastern(actionIndex + 1) + " من " + eastern(actions.length()) + " — " + type);
            switch (type) {
                case "OPEN_URL":
                    doOpenUrl(a.getString("url"));
                    actionIndex++;
                    handler.postDelayed(this::executeNext, 1600);
                    break;
                case "WAIT":
                    long ms = Math.max(0, Math.min(a.optLong("ms", 600), 10000));
                    actionIndex++;
                    handler.postDelayed(this::executeNext, ms);
                    break;
                case "SET_TEXT":
                    ensureAllowedForegroundPackage();
                    doSetText(a.getString("text"));
                    actionIndex++;
                    handler.postDelayed(this::executeNext, 500);
                    break;
                case "CLICK_TEXT":
                    ensureAllowedForegroundPackage();
                    doClickText(a.getString("text"));
                    actionIndex++;
                    handler.postDelayed(this::executeNext, 700);
                    break;
                case "ASSERT_TEXT":
                    ensureAllowedForegroundPackage();
                    if (!containsVisibleText(a.getString("text"))) throw new IllegalStateException("ASSERT_TEXT_FAIL");
                    actionIndex++;
                    executeNext();
                    break;
                case "STATUS":
                    setStatus(a.optString("text", "حكيم يعمل"));
                    actionIndex++;
                    executeNext();
                    break;
                case "REPORT":
                    relayResult("PASS");
                    actionIndex++;
                    handler.postDelayed(this::executeNext, 500);
                    break;
                default:
                    throw new IllegalStateException("ACTION_TYPE_BLOCKED");
            }
        } catch (Exception e) {
            failMission(e);
        }
    }

    private void doOpenUrl(String value) {
        if (!HakimPolicy.isAllowedUrl(value)) throw new IllegalStateException("URL_BLOCKED");
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(value));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(i);
    }

    private void ensureAllowedForegroundPackage() {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null || root.getPackageName() == null || !HakimPolicy.isAllowedPackage(root.getPackageName().toString())) {
            throw new IllegalStateException("FOREGROUND_PACKAGE_BLOCKED");
        }
    }

    private void doSetText(String text) {
        if (HakimPolicy.containsSecretMarker(text) || HakimPolicy.isHighImpact(text)) throw new IllegalStateException("TEXT_BLOCKED");
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) throw new IllegalStateException("WINDOW_NOT_READY");
        AccessibilityNodeInfo editable = findSafeEditable(root);
        if (editable == null) throw new IllegalStateException("EDITABLE_NOT_FOUND");
        Bundle args = new Bundle();
        args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
        if (!editable.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) throw new IllegalStateException("SET_TEXT_FAILED");
    }

    private AccessibilityNodeInfo findSafeEditable(AccessibilityNodeInfo root) {
        Queue<AccessibilityNodeInfo> q = new ArrayDeque<>();
        q.add(root);
        while (!q.isEmpty()) {
            AccessibilityNodeInfo n = q.remove();
            CharSequence hint = n.getHintText();
            String meta = String.valueOf(n.getText()) + " " + String.valueOf(n.getContentDescription()) + " " + String.valueOf(hint) + " " + String.valueOf(n.getViewIdResourceName());
            if (n.isEditable() && n.isEnabled() && n.isVisibleToUser() && !n.isPassword() && !HakimPolicy.containsSecretMarker(meta)) return n;
            for (int i = 0; i < n.getChildCount(); i++) {
                AccessibilityNodeInfo child = n.getChild(i);
                if (child != null) q.add(child);
            }
        }
        return null;
    }

    private void doClickText(String text) {
        if (HakimPolicy.isHighImpact(text) || HakimPolicy.containsSecretMarker(text)) throw new IllegalStateException("CLICK_BLOCKED");
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) throw new IllegalStateException("WINDOW_NOT_READY");
        List<AccessibilityNodeInfo> matches = root.findAccessibilityNodeInfosByText(text);
        if (matches == null || matches.isEmpty()) throw new IllegalStateException("CLICK_TEXT_NOT_FOUND");
        for (AccessibilityNodeInfo n : matches) {
            AccessibilityNodeInfo target = clickableAncestor(n);
            if (target != null && target.isEnabled() && target.isVisibleToUser() && target.performAction(AccessibilityNodeInfo.ACTION_CLICK)) return;
        }
        throw new IllegalStateException("CLICK_FAILED");
    }

    private AccessibilityNodeInfo clickableAncestor(AccessibilityNodeInfo n) {
        AccessibilityNodeInfo x = n;
        for (int i = 0; i < 5 && x != null; i++) {
            if (x.isClickable()) return x;
            x = x.getParent();
        }
        return null;
    }

    private boolean containsVisibleText(String text) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return false;
        List<AccessibilityNodeInfo> matches = root.findAccessibilityNodeInfosByText(text);
        if (matches == null) return false;
        for (AccessibilityNodeInfo n : matches) if (n.isVisibleToUser()) return true;
        return false;
    }

    private void completeMission() {
        String id = mission == null ? "UNKNOWN" : mission.optString("mission_id", "UNKNOWN");
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString("last_completed_mission_id", id).apply();
        setStatus("اكتملت المهمة محليًا — " + id);
        polling.set(false);
        scheduleNext();
    }

    private void failMission(Exception e) {
        String code = sanitize(e.getMessage());
        setStatus("توقف آمن: " + code);
        relayResult("FAIL:" + code);
        polling.set(false);
        scheduleNext();
    }

    private void relayResult(String result) {
        try {
            JSONObject report = new JSONObject();
            report.put("source", "HAKIM_ANDROID");
            report.put("mission_id", mission == null ? "UNKNOWN" : mission.optString("mission_id", "UNKNOWN"));
            report.put("status", result);
            report.put("action_index", actionIndex);
            report.put("app_version", HakimPolicy.APP_VERSION);
            report.put("timestamp", Instant.now().toString());
            String data = Base64.encodeToString(report.toString().getBytes(StandardCharsets.UTF_8), Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(HakimPolicy.RELAY_ISSUE + "#hakim_android_result=" + data));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception ignored) {
            setStatus("المهمة انتهت محليًا؛ تعذر فتح قناة التقرير دون كشف بيانات خاصة");
        }
    }

    private void setStatus(String value) {
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString("status", value).putLong("status_at", System.currentTimeMillis()).apply();
    }

    private String sanitize(String value) {
        if (value == null || value.trim().isEmpty()) return "UNKNOWN";
        String safe = value.replaceAll("https?://\\S+", "[رابط]").replaceAll("[\\r\\n]+", " ").trim();
        return safe.substring(0, Math.min(160, safe.length()));
    }

    private String eastern(int n) {
        char[] west = String.valueOf(n).toCharArray();
        String digits = "٠١٢٣٤٥٦٧٨٩";
        StringBuilder out = new StringBuilder();
        for (char c : west) out.append(Character.isDigit(c) ? digits.charAt(c - '0') : c);
        return out.toString();
    }
}

package ps.hakim.omega;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final String PREFS = "hakim_state";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    private TextView status;
    private volatile boolean running;
    private JSONObject mission;
    private JSONArray actions;
    private int actionIndex;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        setContentView(buildUi());
        refreshStatus();
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshStatus();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        network.shutdownNow();
        super.onDestroy();
    }

    private View buildUi() {
        ScrollView scroll = new ScrollView(this);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.RIGHT);
        int p = dp(18);
        root.setPadding(p, p, p, p);
        scroll.addView(root, new ScrollView.LayoutParams(ScrollView.LayoutParams.MATCH_PARENT, ScrollView.LayoutParams.WRAP_CONTENT));

        TextView title = new TextView(this);
        title.setText("حكيم");
        title.setTextSize(34);
        title.setGravity(Gravity.CENTER);
        root.addView(title, full());

        TextView subtitle = new TextView(this);
        subtitle.setText("النواة الآمنة المحلية — بلا صلاحيات حساسة — مجاني/مشمول فقط");
        subtitle.setTextSize(16);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, dp(8), 0, dp(14));
        root.addView(subtitle, full());

        status = new TextView(this);
        status.setTextSize(18);
        status.setGravity(Gravity.RIGHT);
        status.setPadding(dp(12), dp(12), dp(12), dp(12));
        root.addView(status, full());

        root.addView(button("تشغيل حكيم الآمن", v -> {
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean("enabled", true).apply();
            setStatus("حكيم الآمن مفعّل — لا توجد صلاحيات حساسة");
            runCheckNow();
        }), full());
        root.addView(button("فحص الآن", v -> runCheckNow()), full());
        root.addView(button("إيقاف حكيم", v -> {
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean("enabled", false).apply();
            setStatus("حكيم متوقف محليًا");
        }), full());
        root.addView(button("فتح ChatGPT", v -> openAllowed("https://chatgpt.com/")), full());
        root.addView(button("فتح Gemini", v -> openAllowed("https://gemini.google.com/app")), full());
        root.addView(button("تثبيت قناة التقرير المجانية", v -> openRelayInstaller()), full());
        root.addView(button("حالة الكلفة والحماية", v -> showPolicyState()), full());
        root.addView(button("دستور حكيم المختصر", v -> showConstitution()), full());

        TextView footer = new TextView(this);
        footer.setText("إصدار " + HakimPolicy.APP_VERSION + " — النواة الآمنة\nصلاحية حساسة: صفر • لا Accessibility • لا API مدفوع • لا Credits تلقائية • لا كلمات مرور/OTP");
        footer.setTextSize(14);
        footer.setGravity(Gravity.CENTER);
        footer.setPadding(0, dp(18), 0, dp(24));
        root.addView(footer, full());
        return scroll;
    }

    private Button button(String label, View.OnClickListener listener) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(18);
        b.setAllCaps(false);
        b.setOnClickListener(listener);
        return b;
    }

    private LinearLayout.LayoutParams full() {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, dp(5), 0, dp(5));
        return lp;
    }

    private int dp(int x) {
        return Math.round(x * getResources().getDisplayMetrics().density);
    }

    private void runCheckNow() {
        if (!getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean("enabled", false)) {
            setStatus("حكيم متوقف — اضغط «تشغيل حكيم الآمن» أولًا");
            return;
        }
        if (running) {
            setStatus("هناك فحص يعمل الآن");
            return;
        }
        running = true;
        setStatus("جارٍ فحص المهمة المجانية الآمنة…");
        network.execute(() -> {
            try {
                JSONObject fetched = MissionClient.fetchMission();
                handler.post(() -> beginMission(fetched));
            } catch (Exception e) {
                handler.post(() -> {
                    running = false;
                    setStatus("توقف آمن: " + sanitize(e.getMessage()));
                });
            }
        });
    }

    private void beginMission(JSONObject fetched) {
        try {
            String id = fetched.getString("mission_id");
            String last = getSharedPreferences(PREFS, MODE_PRIVATE).getString("last_completed_mission_id", "");
            if (id.equals(last)) {
                running = false;
                setStatus("تم الفحص — المهمة الحالية منفذة سابقًا");
                return;
            }
            mission = fetched;
            actions = mission.getJSONArray("actions");
            actionIndex = 0;
            setStatus("عُثر على مهمة آمنة — بدء التنفيذ المحدود");
            executeNext();
        } catch (Exception e) {
            failMission(e);
        }
    }

    private void executeNext() {
        if (!getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean("enabled", false)) {
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
            switch (type) {
                case "OPEN_URL":
                    openAllowed(a.getString("url"));
                    actionIndex++;
                    handler.postDelayed(this::executeNext, 1200);
                    break;
                case "WAIT":
                    long ms = Math.max(0, Math.min(a.optLong("ms", 500), 10000));
                    actionIndex++;
                    handler.postDelayed(this::executeNext, ms);
                    break;
                case "STATUS":
                    setStatus(a.optString("text", "حكيم يعمل"));
                    actionIndex++;
                    executeNext();
                    break;
                case "REPORT":
                    relayResult("PASS");
                    actionIndex++;
                    handler.postDelayed(this::executeNext, 300);
                    break;
                default:
                    throw new IllegalStateException("ACTION_TYPE_BLOCKED_SAFE_CORE");
            }
        } catch (Exception e) {
            failMission(e);
        }
    }

    private void openAllowed(String url) {
        if (!HakimPolicy.isAllowedUrl(url)) {
            Toast.makeText(this, "حُظر الرابط بسياسة حكيم", Toast.LENGTH_SHORT).show();
            return;
        }
        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
    }

    private void openRelayInstaller() {
        String url = HakimPolicy.RELAY_INSTALL_URL;
        if (!HakimPolicy.isRelayInstallUrl(url) || !url.startsWith("https://raw.githubusercontent.com/")) {
            Toast.makeText(this, "حُظر رابط التثبيت بسياسة حكيم", Toast.LENGTH_SHORT).show();
            return;
        }
        setStatus("قناة التقرير اختيارية ومجانية ومحلية؛ لا تحتوي مفتاح API أو رصيدًا مدفوعًا");
        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
    }

    private void completeMission() {
        String id = mission == null ? "UNKNOWN" : mission.optString("mission_id", "UNKNOWN");
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString("last_completed_mission_id", id).apply();
        running = false;
        setStatus("اكتملت المهمة الآمنة محليًا — " + id);
    }

    private void failMission(Exception e) {
        running = false;
        setStatus("توقف آمن: " + sanitize(e.getMessage()));
    }

    private void relayResult(String result) {
        try {
            JSONObject report = new JSONObject();
            report.put("source", "HAKIM_ANDROID");
            report.put("mode", HakimPolicy.MODE);
            report.put("mission_id", mission == null ? "UNKNOWN" : mission.optString("mission_id", "UNKNOWN"));
            report.put("status", result);
            report.put("action_index", actionIndex);
            report.put("app_version", HakimPolicy.APP_VERSION);
            report.put("timestamp", Instant.now().toString());
            String data = Base64.encodeToString(report.toString().getBytes(StandardCharsets.UTF_8), Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(HakimPolicy.RELAY_ISSUE + "#hakim_android_result=" + data)));
        } catch (Exception e) {
            setStatus("اكتملت المهمة محليًا؛ تعذر فتح قناة التقرير الاختيارية");
        }
    }

    private void refreshStatus() {
        if (status == null) return;
        boolean enabled = getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean("enabled", false);
        String last = getSharedPreferences(PREFS, MODE_PRIVATE).getString("status", "جاهز — بلا صلاحيات حساسة");
        status.setText("الحالة: " + (enabled ? "مفعّل" : "متوقف") + "\nالحماية: لا توجد خدمة إمكانية وصول\nآخر حالة: " + last);
    }

    private void setStatus(String value) {
        String safe = sanitize(value);
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString("status", safe).apply();
        if (status != null) status.setText("الحالة: " + safe);
    }

    private void showPolicyState() {
        setStatus("بوابة الكلفة: FREE/INCLUDED فقط تلقائيًا\nالصلاحيات الحساسة: صفر\nلا Accessibility ولا قراءة شاشة\nأي Credit أو Metered أو كلفة مجهولة: مرفوض تلقائيًا");
    }

    private void showConstitution() {
        setStatus("كل شيء×٨ يمنع سقوط جانب مادي. كيف×٧ يحكم طريقة التنفيذ. الحكمة×٧ تختار الأنسب. الابتكار×٧ يوسّع الحلول. الحكم النهائي للناتج الفعلي والدليل، مع رجوع آمن عند الفشل.");
    }

    private String sanitize(String value) {
        if (value == null || value.trim().isEmpty()) return "UNKNOWN";
        String safe = value.replaceAll("https?://\\S+", "[رابط]").replaceAll("[\\r\\n]+", " ").trim();
        return safe.substring(0, Math.min(220, safe.length()));
    }
}

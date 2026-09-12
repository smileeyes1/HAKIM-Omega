package ps.hakim.omega;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.List;

public final class MainActivity extends Activity {
    private static final String PREFS = "hakim_state";
    private TextView status;

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
        subtitle.setText("القيادة المحلية — مجاني/مشمول فقط — الحقيقة قبل الادعاء");
        subtitle.setTextSize(16);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, dp(8), 0, dp(14));
        root.addView(subtitle, full());

        status = new TextView(this);
        status.setTextSize(18);
        status.setGravity(Gravity.RIGHT);
        status.setPadding(dp(12), dp(12), dp(12), dp(12));
        root.addView(status, full());

        root.addView(button("تشغيل حكيم", v -> enableHakim()), full());
        root.addView(button("فحص الآن", v -> runCheckNow()), full());
        root.addView(button("إيقاف حكيم", v -> {
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean("enabled", false).apply();
            status.setText("الحالة: حكيم متوقف محليًا");
        }), full());

        root.addView(button("فتح ChatGPT", v -> openAllowed("https://chatgpt.com/")), full());
        root.addView(button("فتح Gemini", v -> openAllowed("https://gemini.google.com/app")), full());
        root.addView(button("إعدادات إمكانية الوصول", v -> startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))), full());
        root.addView(button("تثبيت قناة التقرير المجانية", v -> openRelayInstaller()), full());
        root.addView(button("حالة الكلفة والصلاحيات", v -> showPolicyState()), full());
        root.addView(button("دستور حكيم المختصر", v -> showConstitution()), full());

        TextView footer = new TextView(this);
        footer.setText("إصدار التطبيق " + HakimPolicy.APP_VERSION + "\nلا API مدفوع • لا Credits تلقائية • لا كلمات مرور/OTP • لا إجراء عالي الأثر عن بُعد");
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

    private void enableHakim() {
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean("enabled", true).putBoolean("poll_requested", true).apply();
        if (!isHakimAccessibilityEnabled()) {
            status.setText("الحالة: التشغيل مطلوب — فعّل «حكيم» مرة واحدة من إمكانية الوصول ثم ارجع.");
            startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
        } else {
            status.setText("الحالة: حكيم مفعّل — جارٍ الفحص");
            HakimAccessibilityService.requestImmediatePoll(this);
        }
    }

    private void runCheckNow() {
        if (!getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean("enabled", false)) {
            status.setText("الحالة: حكيم متوقف — اضغط «تشغيل حكيم» أولًا.");
            return;
        }
        if (!isHakimAccessibilityEnabled()) {
            status.setText("الحالة: يلزم تفعيل إمكانية الوصول لحكيم أولًا.");
            startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
            return;
        }
        status.setText("الحالة: بدأ الفحص الآن…");
        HakimAccessibilityService.requestImmediatePoll(this);
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
        status.setText("قناة التقرير مجانية ومحلية: افتح الرابط في Firefox/Violentmonkey وثبّتها مرة واحدة فقط.");
        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
    }

    private void refreshStatus() {
        if (status == null) return;
        boolean enabled = getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean("enabled", false);
        boolean accessibility = isHakimAccessibilityEnabled();
        String last = getSharedPreferences(PREFS, MODE_PRIVATE).getString("status", "لم يبدأ فحص بعد");
        status.setText("الحالة: " + (enabled ? "مفعّل" : "متوقف") + "\nإمكانية الوصول: " + (accessibility ? "ممنوحة" : "غير مفعّلة") + "\nآخر حالة: " + last);
    }

    private void showPolicyState() {
        boolean accessibility = isHakimAccessibilityEnabled();
        status.setText("بوابة الكلفة: FREE/INCLUDED فقط تلقائيًا\nأي Credit أو Metered أو كلفة مجهولة: مرفوض تلقائيًا\nإمكانية الوصول: " + (accessibility ? "ممنوحة" : "غير مفعّلة") + "\nالصلاحيات لا تُوسَّع من التطبيق نفسه.");
    }

    private void showConstitution() {
        status.setText("كل شيء×٨ يمنع سقوط جانب مادي.\nكيف×٧ يحكم طريقة التنفيذ.\nالحكمة×٧ تختار الأنسب والأقل ندمًا.\nالابتكار×٧ يوسّع الحلول دون تغيير لمجرد الجِدّة.\nالحكم النهائي: الناتج الفعلي والدليل، مع رجوع آمن عند الفشل.");
    }

    private boolean isHakimAccessibilityEnabled() {
        android.view.accessibility.AccessibilityManager am = (android.view.accessibility.AccessibilityManager) getSystemService(Context.ACCESSIBILITY_SERVICE);
        if (am == null) return false;
        List<AccessibilityServiceInfo> enabled = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
        String expected = getPackageName() + "/" + HakimAccessibilityService.class.getName();
        for (AccessibilityServiceInfo info : enabled) {
            if (info.getResolveInfo() == null || info.getResolveInfo().serviceInfo == null) continue;
            String actual = info.getResolveInfo().serviceInfo.packageName + "/" + info.getResolveInfo().serviceInfo.name;
            if (actual.equals(expected) || info.getResolveInfo().serviceInfo.name.equals(HakimAccessibilityService.class.getName())) return true;
        }
        return false;
    }
}

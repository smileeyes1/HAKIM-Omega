package ps.hakim.omega;

import java.net.URI;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public final class HakimPolicy {
    private HakimPolicy() {}

    public static final String APP_VERSION = "٠٫٢٫٠";
    public static final String MODE = "SAFE_CORE_NO_ACCESSIBILITY";
    public static final String MISSION_URL = "https://raw.githubusercontent.com/smileeyes1/HAKIM-Omega/hakim-next-android/hakim/HAKIM_ANDROID_MISSION.json";
    public static final String RELAY_ISSUE = "https://github.com/smileeyes1/HAKIM-Omega/issues/1";
    public static final String RELAY_INSTALL_URL = "https://raw.githubusercontent.com/smileeyes1/HAKIM-Omega/hakim-next-android/mobile-agent/hakim-android-report-relay.user.js";

    public static final String[] ALL_EIGHT = {
            "الغاية والنتيجة", "الواقع والدليل", "الأسباب والتبعيات", "الخيارات والأدوات",
            "التنفيذ والتكامل", "التحقق والواقع", "التعافي والتعلم والاستدامة", "أعلى فجوة تالية"
    };

    public static final String[] HOW_SEVEN = {
            "كيف نفهم؟", "كيف نعرف؟", "كيف نحل السبب الجذري؟", "كيف نختار؟",
            "كيف ننفذ؟", "كيف نتحقق ونتعافى؟", "كيف نتعلم ونستمر؟"
    };

    public static final String[] WISDOM_SEVEN = {
            "الحقيقة والواقع", "الغاية والحقوق", "التناسب", "العواقب والتوقيت",
            "أقل تدخل كافٍ", "القابلية للرجوع والمرونة", "الإنسان والسياق والعدل والرحمة"
    };

    public static final String[] INNOVATION_SEVEN = {
            "إعادة صياغة المشكلة", "التبسيط", "التركيب", "العكس والوقاية",
            "الأتمتة", "المحلية والملكية", "التقوية وإعادة الاستخدام"
    };

    private static final Set<String> ALLOWED_COST = new HashSet<>(Arrays.asList("FREE", "INCLUDED"));
    private static final Set<String> ALLOWED_CLASSIFICATION = new HashSet<>(Arrays.asList("PUBLIC", "INTERNAL_NON_SENSITIVE"));
    private static final Set<String> ALLOWED_HOSTS = new HashSet<>(Arrays.asList(
            "chatgpt.com", "www.chatgpt.com", "gemini.google.com", "github.com"
    ));

    private static final String[] SECRET_MARKERS = {
            "password", "passcode", "otp", "one-time", "verification code", "security code",
            "cvv", "cvc", "card number", "bank account", "recovery code", "api key", "bearer ",
            "كلمة المرور", "رمز التحقق", "رمز الأمان", "بطاقة", "حساب بنكي", "رمز الاسترداد"
    };

    private static final String[] HIGH_IMPACT_MARKERS = {
            "delete", "remove account", "purchase", "buy", "checkout", "pay", "transfer",
            "publish", "send email", "send message", "حذف", "شراء", "دفع", "تحويل", "نشر",
            "إرسال بريد", "إرسال رسالة"
    };

    public static boolean isAllowedCost(String costClass) {
        return costClass != null && ALLOWED_COST.contains(costClass.trim().toUpperCase(Locale.ROOT));
    }

    public static boolean isAllowedClassification(String classification) {
        return classification != null && ALLOWED_CLASSIFICATION.contains(classification.trim().toUpperCase(Locale.ROOT));
    }

    public static boolean containsSecretMarker(String text) {
        String n = normalize(text);
        for (String marker : SECRET_MARKERS) if (n.contains(normalize(marker))) return true;
        return false;
    }

    public static boolean isHighImpact(String text) {
        String n = normalize(text);
        for (String marker : HIGH_IMPACT_MARKERS) if (n.contains(normalize(marker))) return true;
        return false;
    }

    public static boolean isAllowedUrl(String value) {
        try {
            URI uri = new URI(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null && ALLOWED_HOSTS.contains(uri.getHost().toLowerCase(Locale.ROOT));
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isRelayInstallUrl(String value) {
        return RELAY_INSTALL_URL.equals(value);
    }

    public static String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }
}

package ps.hakim.omega;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public final class MissionClient {
    private MissionClient() {}

    public static JSONObject fetchMission() throws Exception {
        URL url = new URL(HakimPolicy.MISSION_URL + "?t=" + System.currentTimeMillis());
        HttpURLConnection c = (HttpURLConnection) url.openConnection();
        c.setConnectTimeout(10000);
        c.setReadTimeout(12000);
        c.setRequestProperty("Cache-Control", "no-cache");
        c.setRequestProperty("User-Agent", "Hakim-Android/0.1");
        int code = c.getResponseCode();
        if (code < 200 || code >= 300) throw new IllegalStateException("MISSION_HTTP_" + code);
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
        } finally {
            c.disconnect();
        }
        JSONObject mission = new JSONObject(sb.toString());
        validateMission(mission);
        return mission;
    }

    public static void validateMission(JSONObject m) {
        if (!m.optBoolean("enabled", false)) throw new IllegalStateException("MISSION_IDLE");
        if (m.optString("mission_id", "").isEmpty()) throw new IllegalStateException("MISSION_ID_MISSING");
        if (!HakimPolicy.isAllowedCost(m.optString("cost_class", "COST_UNKNOWN"))) throw new IllegalStateException("BLOCKED_BY_COST");
        if (!HakimPolicy.isAllowedClassification(m.optString("data_classification", ""))) throw new IllegalStateException("CLASSIFICATION_BLOCKED");
        JSONArray actions = m.optJSONArray("actions");
        if (actions == null || actions.length() == 0 || actions.length() > 30) throw new IllegalStateException("MISSION_ACTIONS_INVALID");
        String raw = m.toString();
        if (HakimPolicy.containsSecretMarker(raw)) throw new IllegalStateException("SECRET_MARKER_BLOCKED");
        if (HakimPolicy.isHighImpact(raw)) throw new IllegalStateException("HIGH_IMPACT_REMOTE_BLOCKED");
        for (int i = 0; i < actions.length(); i++) {
            JSONObject a = actions.optJSONObject(i);
            if (a == null) throw new IllegalStateException("ACTION_INVALID");
            String type = a.optString("type", "");
            if (!(type.equals("OPEN_URL") || type.equals("WAIT") || type.equals("SET_TEXT") || type.equals("CLICK_TEXT") || type.equals("ASSERT_TEXT") || type.equals("STATUS") || type.equals("REPORT"))) {
                throw new IllegalStateException("ACTION_TYPE_BLOCKED");
            }
            if (type.equals("OPEN_URL") && !HakimPolicy.isAllowedUrl(a.optString("url", ""))) throw new IllegalStateException("URL_BLOCKED");
            if (type.equals("SET_TEXT") && HakimPolicy.containsSecretMarker(a.optString("text", ""))) throw new IllegalStateException("SECRET_TEXT_BLOCKED");
        }
    }
}

package ps.hakim.omega;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

public final class MissionClient {
    private MissionClient() {}

    public static JSONObject fetchMission() throws Exception {
        URL url = new URL(HakimPolicy.MISSION_URL + "?t=" + System.currentTimeMillis());
        HttpURLConnection c = (HttpURLConnection) url.openConnection();
        c.setConnectTimeout(10000);
        c.setReadTimeout(12000);
        c.setRequestProperty("Cache-Control", "no-cache");
        c.setRequestProperty("User-Agent", "Hakim-Android-Safe/0.2");
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
        String id = m.optString("mission_id", "");
        if (id.isEmpty() || !id.matches("[A-Z0-9_\\-]{1,120}")) throw new IllegalStateException("MISSION_ID_INVALID");
        if (!HakimPolicy.isAllowedCost(m.optString("cost_class", "COST_UNKNOWN"))) throw new IllegalStateException("BLOCKED_BY_COST");
        if (!HakimPolicy.isAllowedClassification(m.optString("data_classification", ""))) throw new IllegalStateException("CLASSIFICATION_BLOCKED");

        String created = m.optString("created_at", "");
        String expires = m.optString("expires_at", "");
        if (created.isEmpty() || expires.isEmpty()) throw new IllegalStateException("MISSION_TIME_BOUNDARY_MISSING");
        try {
            Instant c = Instant.parse(created);
            Instant x = Instant.parse(expires);
            Instant now = Instant.now();
            if (!x.isAfter(c)) throw new IllegalStateException("MISSION_TIME_RANGE_INVALID");
            if (now.isAfter(x)) throw new IllegalStateException("MISSION_EXPIRED");
            if (c.isAfter(now.plusSeconds(300))) throw new IllegalStateException("MISSION_NOT_YET_VALID");
            if (x.isAfter(c.plusSeconds(14L * 24L * 3600L))) throw new IllegalStateException("MISSION_LIFETIME_TOO_LONG");
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("MISSION_TIME_INVALID");
        }

        JSONArray actions = m.optJSONArray("actions");
        if (actions == null || actions.length() == 0 || actions.length() > 20) throw new IllegalStateException("MISSION_ACTIONS_INVALID");
        String raw = m.toString();
        if (HakimPolicy.containsSecretMarker(raw)) throw new IllegalStateException("SECRET_MARKER_BLOCKED");
        if (HakimPolicy.isHighImpact(raw)) throw new IllegalStateException("HIGH_IMPACT_REMOTE_BLOCKED");
        for (int i = 0; i < actions.length(); i++) {
            JSONObject a = actions.optJSONObject(i);
            if (a == null) throw new IllegalStateException("ACTION_INVALID");
            String type = a.optString("type", "");
            if (!(type.equals("OPEN_URL") || type.equals("WAIT") || type.equals("STATUS") || type.equals("REPORT"))) {
                throw new IllegalStateException("ACTION_TYPE_BLOCKED_SAFE_CORE");
            }
            if (type.equals("OPEN_URL") && !HakimPolicy.isAllowedUrl(a.optString("url", ""))) throw new IllegalStateException("URL_BLOCKED");
            if (type.equals("WAIT") && (a.optLong("ms", 0) < 0 || a.optLong("ms", 0) > 10000)) throw new IllegalStateException("WAIT_BLOCKED");
            if (type.equals("STATUS") && (HakimPolicy.containsSecretMarker(a.optString("text", "")) || HakimPolicy.isHighImpact(a.optString("text", "")))) throw new IllegalStateException("STATUS_TEXT_BLOCKED");
        }
    }
}

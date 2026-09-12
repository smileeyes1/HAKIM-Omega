package ps.hakim.omega;

import org.junit.Test;

import static org.junit.Assert.*;

public class HakimPolicyTest {
    @Test public void costGateAllowsOnlyFreeOrIncluded() {
        assertTrue(HakimPolicy.isAllowedCost("FREE"));
        assertTrue(HakimPolicy.isAllowedCost("included"));
        assertFalse(HakimPolicy.isAllowedCost("METERED"));
        assertFalse(HakimPolicy.isAllowedCost("COST_UNKNOWN"));
        assertFalse(HakimPolicy.isAllowedCost(null));
    }

    @Test public void urlGateIsHttpsAndAllowlisted() {
        assertTrue(HakimPolicy.isAllowedUrl("https://chatgpt.com/"));
        assertTrue(HakimPolicy.isAllowedUrl("https://gemini.google.com/app"));
        assertFalse(HakimPolicy.isAllowedUrl("http://chatgpt.com/"));
        assertFalse(HakimPolicy.isAllowedUrl("https://example.com/"));
    }

    @Test public void secretsAndHighImpactAreFailClosed() {
        assertTrue(HakimPolicy.containsSecretMarker("OTP 123456"));
        assertTrue(HakimPolicy.containsSecretMarker("كلمة المرور"));
        assertFalse(HakimPolicy.containsSecretMarker("افتح ChatGPT"));
        assertTrue(HakimPolicy.isHighImpact("delete account"));
        assertTrue(HakimPolicy.isHighImpact("إرسال رسالة"));
        assertFalse(HakimPolicy.isHighImpact("افتح الصفحة"));
    }

    @Test public void governingEnginesRemainStructurallyPresent() {
        assertEquals(8, HakimPolicy.ALL_EIGHT.length);
        assertEquals(7, HakimPolicy.HOW_SEVEN.length);
        assertEquals(7, HakimPolicy.WISDOM_SEVEN.length);
        assertEquals(7, HakimPolicy.INNOVATION_SEVEN.length);
    }
}

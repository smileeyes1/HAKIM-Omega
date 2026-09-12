# HAKIM RATE-LIMIT RESILIENCE CONTRACT

Status: ACTIVE_CANDIDATE

This contract applies to Hakim Original Phone App backends and bridges only; it does not create another Hakim.

P0 rules:
- EVENT_FIRST/PUSH_FIRST is preferred.
- Background heartbeat fallback is hourly, not dense polling.
- Manual checks are immediate but debounced to prevent repeated user taps from creating duplicate requests.
- Only one mission-fetch request may be in flight at a time.
- HTTP 429 and rate-limit-like 403 responses activate BLOCKED_BY_RATE_LIMIT_TEMPORARY.
- Retry-After is honored when present; otherwise bounded exponential backoff with jitter is used.
- A rate-limited request is not immediately retried and does not cause parallel fallback storms.
- Last proven state is preserved; rate-limit pressure is a means constraint, not goal failure.
- No paid/credit-consuming bypass is allowed automatically.
- FIELD PASS still requires a request-bound HAKIM_BRIDGE_RESULT from the actual phone.

Promotion requires exact-head CI PASS and no regression of secret, authority, high-impact, cost, or field-evidence gates.

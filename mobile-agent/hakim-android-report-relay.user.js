// ==UserScript==
// @name         حكيم — قناة تقرير أندرويد المحلية
// @namespace    hakim-android-report-relay
// @version      0.1.0
// @description  يستقبل فقط تقرير حكيم أندرويد المنقح من fragment محلي وينشره في قناة الإثبات عبر جلسة GitHub الموجودة، بلا API أو مفاتيح أو Credits.
// @match        https://github.com/smileeyes1/HAKIM-Omega/issues/1*
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';
  const PREFIX = '#hakim_android_result=';
  const SECRET = ['password','passcode','otp','verification code','security code','api key','bearer ','recovery code','كلمة المرور','رمز التحقق','رمز الأمان','رمز الاسترداد'];
  const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const visible = e => !!(e && e.isConnected && e.getClientRects().length && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden');
  const hasSecret = s => SECRET.some(x => norm(s).includes(norm(x)));

  function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function validate(raw) {
    if (raw.length > 2000 || hasSecret(raw)) throw new Error('REPORT_BLOCKED');
    const x = JSON.parse(raw);
    if (x.source !== 'HAKIM_ANDROID') throw new Error('SOURCE_BLOCKED');
    if (!/^[A-Z0-9_\-]{1,120}$/.test(String(x.mission_id || ''))) throw new Error('MISSION_ID_BLOCKED');
    if (!/^(PASS|FAIL:)/.test(String(x.status || ''))) throw new Error('STATUS_BLOCKED');
    const safe = {
      source: 'HAKIM_ANDROID',
      mission_id: String(x.mission_id),
      status: String(x.status).slice(0, 180),
      action_index: Number.isInteger(x.action_index) ? x.action_index : 0,
      app_version: String(x.app_version || '').slice(0, 40),
      timestamp: String(x.timestamp || '').slice(0, 50)
    };
    const out = JSON.stringify(safe);
    if (hasSecret(out)) throw new Error('REPORT_SECRET_BLOCKED');
    return safe;
  }

  async function waitFor(fn, timeout = 15000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      try { const x = fn(); if (x) return x; } catch {}
      await sleep(250);
    }
    return null;
  }

  function setValue(el, value) {
    el.focus();
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const p = Object.getPrototypeOf(el);
      const setter = Object.getOwnPropertyDescriptor(p, 'value')?.set;
      if (setter) setter.call(el, value); else el.value = value;
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
    } else if (el.isContentEditable) {
      el.textContent = value;
      el.dispatchEvent(new Event('input', {bubbles:true}));
    } else throw new Error('COMMENT_BOX_NOT_EDITABLE');
  }

  async function main() {
    if (!location.hash.startsWith(PREFIX)) return;
    try {
      const raw = decodeBase64Url(location.hash.slice(PREFIX.length));
      const report = validate(raw);
      const box = await waitFor(() => {
        for (const s of ['textarea[name="comment[body]"]','#new_comment_field','textarea[placeholder*="comment" i]','[contenteditable="true"][role="textbox"]']) {
          const e = document.querySelector(s); if (visible(e)) return e;
        }
        return null;
      });
      if (!box) throw new Error('GITHUB_LOGIN_OR_COMMENT_BOX_REQUIRED');
      const body = 'HAKIM_ANDROID_RESULT\n```json\n' + JSON.stringify(report, null, 2) + '\n```';
      setValue(box, body);
      const submit = await waitFor(() => [...document.querySelectorAll('button[type="submit"],button')].filter(visible).find(b => /comment|submit|تعليق|إرسال/i.test((b.innerText || b.textContent || '').trim()) && !b.disabled), 10000);
      if (!submit) throw new Error('SUBMIT_NOT_FOUND');
      submit.click();
      history.replaceState(null, '', location.pathname);
    } catch (e) {
      console.error('[HAKIM Android relay]', e?.message || e);
      alert('حكيم: تعذر إرسال التقرير المنقح — ' + String(e?.message || e).slice(0, 120));
    }
  }

  main();
})();

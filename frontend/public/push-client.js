/* Web push opt-in (t128). Shows a small "Notify me" pill after a delay; the
 * browser permission prompt only fires on the user's click (Chrome punishes
 * page-load prompts). Subscriptions go to the central push service tagged by
 * site. Include as:
 *   <script src="/push-client.js" data-site="modbus" defer></script>
 */
(function () {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
  var script = document.currentScript;
  var SITE = (script && script.getAttribute('data-site')) || 'modbus';
  var API = 'https://modbussimulator.com';
  var OPTED = 'push_opted_' + SITE;
  var DISMISSED = 'push_dismissed_' + SITE;
  try {
    if (localStorage.getItem(OPTED) || localStorage.getItem(DISMISSED)) return;
  } catch (e) { return; }
  if (Notification.permission === 'denied') return;

  function urlB64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  function subscribe() {
    navigator.serviceWorker.register('/push-sw.js')
      .then(function (reg) {
        return fetch(API + '/api/push/vapid-public')
          .then(function (r) { return r.json(); })
          .then(function (k) {
            return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(k.publicKey) });
          });
      })
      .then(function (sub) {
        return fetch(API + '/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: SITE, subscription: sub })
        });
      })
      .then(function () { try { localStorage.setItem(OPTED, '1'); } catch (e) {} hide(); })
      .catch(function (e) { console.error('[push] subscribe failed:', e); hide(); });
  }

  var wrap;
  function hide() { if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap); }

  function show() {
    wrap = document.createElement('div');
    wrap.setAttribute('style', 'position:fixed;bottom:18px;left:18px;z-index:99990;display:flex;align-items:center;gap:6px;background:#111827;color:#f9fafb;border:1px solid #374151;border-radius:999px;padding:8px 8px 8px 14px;font:13px/1.2 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)');
    var label = document.createElement('span');
    label.textContent = 'Get product updates';
    var yes = document.createElement('button');
    yes.textContent = 'Notify me';
    yes.setAttribute('style', 'border:none;border-radius:999px;background:#2563eb;color:#fff;padding:6px 12px;font:600 12px system-ui,sans-serif;cursor:pointer');
    yes.onclick = function () { subscribe(); };
    var no = document.createElement('button');
    no.textContent = '×';
    no.setAttribute('aria-label', 'Dismiss');
    no.setAttribute('style', 'border:none;background:transparent;color:#9ca3af;font-size:16px;cursor:pointer;padding:2px 6px');
    no.onclick = function () { try { localStorage.setItem(DISMISSED, '1'); } catch (e) {} hide(); };
    wrap.appendChild(label); wrap.appendChild(yes); wrap.appendChild(no);
    document.body.appendChild(wrap);
  }

  setTimeout(show, 9000);
})();

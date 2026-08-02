'use strict';

/*
 * WebToApp popup.
 *
 * The analysis runs inside the tab you are looking at, using the activeTab
 * permission granted when you click the toolbar icon. Nothing is uploaded:
 * every result you see was measured in your own browser.
 */

const $ = (id) => document.getElementById(id);

const RESTRICTED = /^(chrome|edge|about|devtools|view-source|chrome-extension|moz-extension):/i;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

let currentUrl = '';
let currentChecks = [];
let currentAnalysis = null;

document.addEventListener('DOMContentLoaded', () => {
  $('analyzeBtn').addEventListener('click', analyze);
  $('convertBtn').addEventListener('click', openConverter);
  $('copyBtn').addEventListener('click', copyReport);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (tab && tab.url && !RESTRICTED.test(tab.url)) {
      currentUrl = tab.url;
      try {
        $('siteUrl').textContent = new URL(currentUrl).hostname;
        $('siteUrl').title = currentUrl;
      } catch {
        $('siteUrl').textContent = currentUrl;
      }
      analyze();
    } else {
      $('siteUrl').textContent = 'No website in this tab';
      $('analyzeBtn').disabled = true;
      showBlocked('Chrome does not let extensions read this kind of page. Open the website you want to check and try again.');
    }
  });
});

function showBlocked(message) {
  const el = $('blocked');
  el.textContent = message;
  el.classList.remove('hidden');
}

function openConverter() {
  let origin = currentUrl;
  try { origin = new URL(currentUrl).origin; } catch { /* use the raw value */ }
  chrome.tabs.create({
    url: `https://websitetoapp.app/dashboard?url=${encodeURIComponent(origin)}&ref=chrome-extension`,
  });
}

async function analyze() {
  $('analyzeBtn').disabled = true;
  $('blocked').classList.add('hidden');
  $('analysisResults').classList.add('hidden');
  $('convertBtn').classList.add('hidden');
  $('copyBtn').classList.add('hidden');
  $('loading').classList.remove('hidden');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || RESTRICTED.test(tab.url)) {
      throw new Error('This page cannot be read by an extension.');
    }
    currentUrl = tab.url;
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: analyzePage,
    });
    const analysis = results && results[0] ? results[0].result : null;
    if (!analysis) throw new Error('The page did not return any data.');
    currentAnalysis = analysis;
    showResults(analysis);
  } catch (err) {
    currentAnalysis = null;
    showBlocked(`Could not analyze this page: ${err && err.message ? err.message : 'unknown error'}`);
  }

  $('loading').classList.add('hidden');
  $('analyzeBtn').disabled = false;
}

function buildChecks(a) {
  const checks = [];
  const add = (status, label, detail) => checks.push({ status, label, detail });

  add(a.https ? 'pass' : 'fail', 'HTTPS',
    a.https ? 'Secure connection' : 'Plain HTTP — Android blocks it by default and service workers will not run');

  add(a.viewportDeviceWidth ? 'pass' : a.hasViewport ? 'warn' : 'fail', 'Mobile viewport',
    a.viewportDeviceWidth ? 'width=device-width is set'
      : a.hasViewport ? `Viewport tag present but not width=device-width: "${a.viewportContent}"`
        : 'No viewport tag — the page will be shrunk to fit');

  add(a.horizontalOverflow ? 'warn' : 'pass', 'Fits the screen width',
    a.horizontalOverflow
      ? `Content is ${a.scrollWidth}px wide in a ${a.clientWidth}px window — users will have to scroll sideways`
      : 'No sideways scrolling at this width');

  add(a.mediaQueryCount > 0 ? 'pass' : a.stylesheetsReadable === 0 ? 'warn' : 'warn', 'Responsive CSS',
    a.mediaQueryCount > 0 ? `${a.mediaQueryCount} responsive style rules found`
      : a.stylesheetsReadable === 0 ? 'Stylesheets are loaded from another domain, so they could not be inspected'
        : 'No media queries found — the layout may not adapt to phone screens');

  add(a.baseFontSize >= 14 ? 'pass' : 'warn', 'Readable text size',
    a.baseFontSize ? `Body text is ${a.baseFontSize}px` : 'Could not measure the body text size');

  add(a.bestIconSize >= 192 ? 'pass' : a.bestIconSize > 0 ? 'warn' : 'fail', 'App icon',
    a.bestIconSize >= 192 ? `Largest declared icon is ${a.bestIconSize}px — big enough for a launcher icon`
      : a.bestIconSize > 0 ? `Largest declared icon is only ${a.bestIconSize}px; 192px or more looks sharp on phones`
        : 'No apple-touch-icon or manifest icon found');

  add(a.hasManifest ? (a.manifestReadable ? 'pass' : 'warn') : 'warn', 'Web app manifest',
    !a.hasManifest ? 'None declared — app name and colours have to be set manually'
      : a.manifestReadable ? `Found: "${a.manifestName || 'unnamed'}"`
        : 'Declared but could not be read from this page');

  add(a.hasServiceWorker ? 'pass' : 'warn', 'Service worker',
    a.hasServiceWorker ? 'Registered — some content can work offline'
      : 'None registered — the app will need a connection for every screen');

  add(a.themeColor ? 'pass' : 'warn', 'Theme colour',
    a.themeColor ? `${a.themeColor} (used for the status bar)` : 'Not set — the status bar will fall back to a default');

  add(a.mixedContentCount === 0 ? 'pass' : 'fail', 'No mixed content',
    a.mixedContentCount === 0
      ? (a.https ? 'Every resource is loaded over HTTPS' : 'Not applicable on an HTTP page')
      : `${a.mixedContentCount} resource${a.mixedContentCount > 1 ? 's are' : ' is'} loaded over plain HTTP and will be blocked`);

  add(a.brokenImages === 0 ? 'pass' : 'warn', 'Images load',
    a.imageCount === 0 ? 'No images on this page'
      : a.brokenImages === 0 ? `All ${a.imageCount} images loaded`
        : `${a.brokenImages} of ${a.imageCount} images failed to load`);

  add(a.hasLang ? 'pass' : 'warn', 'Language set',
    a.hasLang ? `lang="${a.lang}"` : 'No lang attribute — screen readers and stores use it');

  return checks;
}

function showResults(a) {
  const checks = buildChecks(a);
  currentChecks = checks;

  const passed = checks.filter((c) => c.status === 'pass').length;
  const warns = checks.filter((c) => c.status === 'warn').length;
  const fails = checks.filter((c) => c.status === 'fail').length;
  const score = Math.round(((passed + warns * 0.5) / checks.length) * 100);

  $('scoreValue').textContent = score;
  if (score >= 75) {
    $('scoreCircle').className = 'score-circle good';
    $('scoreDesc').textContent = 'Ready to package as an app.';
  } else if (score >= 50) {
    $('scoreCircle').className = 'score-circle ok';
    $('scoreDesc').textContent = 'Usable, but worth fixing the points below first.';
  } else {
    $('scoreCircle').className = 'score-circle bad';
    $('scoreDesc').textContent = 'Needs work before it will feel like an app.';
  }
  $('scoreLabel').textContent = `${passed} passed · ${warns} to improve · ${fails} problem${fails === 1 ? '' : 's'}`;

  const icons = {
    pass: '<svg class="check-icon check-pass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    warn: '<svg class="check-icon check-warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    fail: '<svg class="check-icon check-fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  };

  const order = { fail: 0, warn: 1, pass: 2 };
  const sorted = checks.slice().sort((x, y) => order[x.status] - order[y.status]);

  $('checksList').innerHTML = sorted.map((c) => `
    <div class="check-item ${c.status}">
      ${icons[c.status]}
      <span class="check-body">
        <span class="check-text">${esc(c.label)}</span>
        <span class="check-detail">${esc(c.detail)}</span>
      </span>
    </div>`).join('');

  const details = [];
  if (a.appName) details.push(['App name', a.appName]);
  if (a.manifestShortName) details.push(['Short name', a.manifestShortName]);
  if (a.display) details.push(['Display mode', a.display]);
  if (a.startUrl) details.push(['Start URL', a.startUrl]);
  if (a.bestIconSize) details.push(['Largest icon', `${a.bestIconSize}px`]);
  if (a.themeColor) details.push(['Theme colour', a.themeColor]);

  $('appDetails').innerHTML = details.length
    ? `<span class="label">What an app would use</span>` + details.map(([k, v]) =>
      `<div class="detail-row"><span class="dk">${esc(k)}</span><span class="dv">${esc(v)}</span></div>`).join('')
    : '';

  $('analysisResults').classList.remove('hidden');
  $('convertBtn').classList.remove('hidden');
  $('copyBtn').classList.remove('hidden');
}

async function copyReport() {
  if (!currentAnalysis) return;
  const lines = [
    `Mobile readiness — ${currentAnalysis.url}`,
    '',
    ...currentChecks.map((c) => `[${c.status.toUpperCase()}] ${c.label}: ${c.detail}`),
    '',
    'Checked with the WebToApp extension — websitetoapp.app',
  ];
  const btn = $('copyBtn');
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    btn.textContent = 'Report copied';
  } catch {
    btn.textContent = 'Copy failed';
  }
  setTimeout(() => { btn.textContent = 'Copy report'; }, 1500);
}

/* ---------------- injected into the page ---------------- */

async function analyzePage() {
  const result = {
    url: location.href,
    https: location.protocol === 'https:',
    title: document.title || '',
    lang: document.documentElement.lang || '',
    hasViewport: false,
    viewportContent: '',
    viewportDeviceWidth: false,
    scrollWidth: 0,
    clientWidth: 0,
    horizontalOverflow: false,
    mediaQueryCount: 0,
    stylesheetsReadable: 0,
    baseFontSize: 0,
    bestIconSize: 0,
    hasManifest: false,
    manifestReadable: false,
    manifestName: '',
    manifestShortName: '',
    display: '',
    startUrl: '',
    themeColor: '',
    hasServiceWorker: false,
    mixedContentCount: 0,
    imageCount: 0,
    brokenImages: 0,
  };
  result.hasLang = result.lang.length > 0;

  // viewport
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    result.hasViewport = true;
    result.viewportContent = viewport.content || '';
    result.viewportDeviceWidth = /width\s*=\s*device-width/i.test(result.viewportContent);
  }

  // horizontal overflow
  const de = document.documentElement;
  result.scrollWidth = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0);
  result.clientWidth = de.clientWidth;
  result.horizontalOverflow = result.scrollWidth > result.clientWidth + 4;

  // responsive CSS — cross-origin stylesheets throw when read
  Array.from(document.styleSheets).forEach((sheet) => {
    let rules = null;
    try { rules = sheet.cssRules; } catch { return; }
    if (!rules) return;
    result.stylesheetsReadable++;
    const walk = (list) => {
      Array.from(list).forEach((rule) => {
        if (rule.type === 4 /* CSSMediaRule */) {
          if (/(max|min)-width/i.test(rule.conditionText || rule.media.mediaText || '')) result.mediaQueryCount++;
          if (rule.cssRules) walk(rule.cssRules);
        } else if (rule.cssRules) {
          walk(rule.cssRules);
        }
      });
    };
    walk(rules);
  });
  document.querySelectorAll('link[rel="stylesheet"][media]').forEach((l) => {
    if (/(max|min)-width/i.test(l.media)) result.mediaQueryCount++;
  });

  // base font size
  if (document.body) {
    const size = parseFloat(getComputedStyle(document.body).fontSize);
    if (!Number.isNaN(size)) result.baseFontSize = Math.round(size);
  }

  // icons: apple-touch-icon sizes plus any rel=icon sizes
  const iconSize = (el) => {
    const sizes = el.getAttribute('sizes') || '';
    const match = sizes.match(/(\d+)\s*[xX]\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  document.querySelectorAll('link[rel~="apple-touch-icon"], link[rel~="icon"]').forEach((el) => {
    result.bestIconSize = Math.max(result.bestIconSize, iconSize(el));
  });

  // theme colour
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta && themeMeta.content) result.themeColor = themeMeta.content.trim();

  // manifest — same-origin fetch only; anything else is reported as unreadable
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink && manifestLink.href) {
    result.hasManifest = true;
    try {
      const response = await fetch(manifestLink.href, { credentials: 'same-origin' });
      if (response.ok) {
        const manifest = await response.json();
        result.manifestReadable = true;
        result.manifestName = manifest.name || '';
        result.manifestShortName = manifest.short_name || '';
        result.display = manifest.display || '';
        result.startUrl = manifest.start_url || '';
        if (!result.themeColor && manifest.theme_color) result.themeColor = manifest.theme_color;
        if (Array.isArray(manifest.icons)) {
          manifest.icons.forEach((icon) => {
            const match = String(icon.sizes || '').match(/(\d+)\s*[xX]\s*(\d+)/);
            if (match) result.bestIconSize = Math.max(result.bestIconSize, parseInt(match[1], 10));
          });
        }
      }
    } catch { /* left as unreadable */ }
  }

  result.appName = result.manifestName
    || (document.querySelector('meta[property="og:site_name"]') || {}).content
    || result.title;

  // service worker
  try {
    if ('serviceWorker' in navigator) {
      if (navigator.serviceWorker.controller) {
        result.hasServiceWorker = true;
      } else {
        const registrations = await navigator.serviceWorker.getRegistrations();
        result.hasServiceWorker = registrations.length > 0;
      }
    }
  } catch { /* not available on this origin */ }

  // mixed content — only meaningful on an HTTPS page
  if (result.https) {
    const seen = new Set();
    document.querySelectorAll('img[src], script[src], iframe[src], video[src], audio[src], source[src], link[rel="stylesheet"][href]').forEach((el) => {
      const raw = el.getAttribute('src') || el.getAttribute('href') || '';
      if (/^http:\/\//i.test(raw)) seen.add(raw);
    });
    result.mixedContentCount = seen.size;
  }

  // images
  const imgs = document.querySelectorAll('img');
  result.imageCount = imgs.length;
  imgs.forEach((img) => {
    if (img.complete && img.naturalWidth === 0) result.brokenImages++;
  });

  return result;
}

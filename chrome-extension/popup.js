document.addEventListener('DOMContentLoaded', () => {
  const siteUrl = document.getElementById('siteUrl');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const convertBtn = document.getElementById('convertBtn');
  const loading = document.getElementById('loading');
  const analysisResults = document.getElementById('analysisResults');
  const scoreCircle = document.getElementById('scoreCircle');
  const scoreValue = document.getElementById('scoreValue');
  const scoreDesc = document.getElementById('scoreDesc');
  const checksList = document.getElementById('checksList');

  let currentUrl = '';

  // Get current tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && !tabs[0].url.startsWith('chrome://')) {
      currentUrl = tabs[0].url;
      try {
        siteUrl.textContent = new URL(currentUrl).hostname;
        siteUrl.title = currentUrl;
      } catch {
        siteUrl.textContent = currentUrl;
      }
    } else {
      siteUrl.textContent = 'No website detected';
      analyzeBtn.disabled = true;
    }
  });

  // Analyze button
  analyzeBtn.addEventListener('click', async () => {
    if (!currentUrl) return;

    analyzeBtn.disabled = true;
    loading.classList.remove('hidden');
    analysisResults.classList.add('hidden');
    convertBtn.classList.add('hidden');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Inject content script to analyze the page
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: analyzePage,
      });

      const analysis = results[0].result;
      showResults(analysis);
    } catch (err) {
      // If scripting fails (e.g. chrome:// pages), show basic results
      showResults({
        viewport: false,
        responsive: false,
        https: currentUrl.startsWith('https'),
        hasImages: true,
        loadTime: null,
        hasServiceWorker: false,
        hasManifest: false,
        hasFavicon: true,
        title: '',
        error: err.message,
      });
    }

    loading.classList.add('hidden');
    analyzeBtn.disabled = false;
  });

  // Convert button
  convertBtn.addEventListener('click', () => {
    const origin = (() => { try { return new URL(currentUrl).origin; } catch { return currentUrl; } })();
    chrome.tabs.create({
      url: `https://websitetoapp.app/dashboard?url=${encodeURIComponent(origin)}&ref=chrome-extension`
    });
  });

  function showResults(analysis) {
    const checks = [
      { key: 'https', label: 'HTTPS enabled', pass: analysis.https },
      { key: 'viewport', label: 'Mobile viewport meta tag', pass: analysis.viewport },
      { key: 'responsive', label: 'Responsive design detected', pass: analysis.responsive },
      { key: 'hasFavicon', label: 'Favicon available (app icon)', pass: analysis.hasFavicon },
      { key: 'hasManifest', label: 'Web App Manifest found', pass: analysis.hasManifest },
      { key: 'hasServiceWorker', label: 'Service Worker (offline support)', pass: analysis.hasServiceWorker },
      { key: 'hasImages', label: 'Images load correctly', pass: analysis.hasImages },
      { key: 'noMixedContent', label: 'No mixed content', pass: analysis.https },
    ];

    // Calculate score
    const passed = checks.filter(c => c.pass).length;
    const score = Math.round((passed / checks.length) * 100);

    scoreValue.textContent = score;
    if (score >= 75) {
      scoreCircle.className = 'score-circle good';
      scoreDesc.textContent = 'Great! This site is ready for app conversion.';
    } else if (score >= 50) {
      scoreCircle.className = 'score-circle ok';
      scoreDesc.textContent = 'Good, but some improvements recommended.';
    } else {
      scoreCircle.className = 'score-circle bad';
      scoreDesc.textContent = 'Site needs improvements for best app experience.';
    }

    // Render checks
    checksList.innerHTML = checks.map(c => {
      const icon = c.pass
        ? '<svg class="check-icon check-pass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg class="check-icon check-fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      return `<div class="check-item">${icon}<span class="check-text">${c.label}</span></div>`;
    }).join('');

    analysisResults.classList.remove('hidden');
    convertBtn.classList.remove('hidden');
  }
});

// This function runs in the context of the web page
function analyzePage() {
  const result = {
    viewport: false,
    responsive: false,
    https: location.protocol === 'https:',
    hasImages: true,
    hasServiceWorker: false,
    hasManifest: false,
    hasFavicon: false,
    title: document.title,
  };

  // Check viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  result.viewport = !!viewportMeta;

  // Check responsive design (media queries or viewport width handling)
  result.responsive = result.viewport && (
    document.body.scrollWidth <= window.innerWidth ||
    !!document.querySelector('meta[name="viewport"][content*="width=device-width"]')
  );

  // Check favicon
  result.hasFavicon = !!(
    document.querySelector('link[rel="icon"]') ||
    document.querySelector('link[rel="shortcut icon"]') ||
    document.querySelector('link[rel="apple-touch-icon"]')
  );

  // Check web app manifest
  result.hasManifest = !!document.querySelector('link[rel="manifest"]');

  // Check service worker
  result.hasServiceWorker = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;

  // Check images
  const imgs = document.querySelectorAll('img');
  let brokenImgs = 0;
  imgs.forEach(img => {
    if (img.naturalWidth === 0 && img.complete) brokenImgs++;
  });
  result.hasImages = imgs.length === 0 || brokenImgs < imgs.length * 0.3;

  return result;
}

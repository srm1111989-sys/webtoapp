const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')

// Load config
const configPath = path.join(__dirname, 'config.json')
let config = {
  app_name: 'WebToApp Desktop',
  app_url: 'https://example.com',
  desktop: {
    window_width: 1280,
    window_height: 800,
    min_width: 800,
    min_height: 600,
    show_title_bar: true,
    show_menu_bar: false,
    enable_system_tray: false,
    start_maximized: false,
    start_fullscreen: false,
  },
}

try {
  const raw = fs.readFileSync(configPath, 'utf-8')
  config = { ...config, ...JSON.parse(raw) }
} catch (e) {
  console.warn('Failed to load config.json, using defaults:', e.message)
}

const desktop = config.desktop || {}
const iconPath = path.join(__dirname, '..', 'assets', 'icon.png')
const primaryColor = config.primary_color || '#2563eb'

// The app icon as a data URI, for the branded splash screen.
function iconDataUri() {
  try {
    if (fs.existsSync(iconPath)) {
      return 'data:image/png;base64,' + fs.readFileSync(iconPath).toString('base64')
    }
  } catch (e) { /* ignore */ }
  return null
}

const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/"/g, '&quot;')

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

let mainWindow = null
let splashWindow = null
let tray = null

// Branded startup screen shown while the site loads — no blank white window,
// so the app looks like a real product instead of a browser opening a page.
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420, height: 300, frame: false, resizable: false, center: true, show: false,
    backgroundColor: '#ffffff', alwaysOnTop: true, skipTaskbar: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: { contextIsolation: true, nodeIntegration: false, devTools: false },
  })
  const icon = iconDataUri()
  const name = esc(config.app_name || 'App')
  const logo = icon
    ? `<img src="${icon}" width="88" height="88" style="border-radius:20px;object-fit:cover" alt="">`
    : `<div style="width:88px;height:88px;border-radius:20px;background:${primaryColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700">${esc((config.app_name || 'A').trim().charAt(0).toUpperCase())}</div>`
  const html = `<body style="margin:0;background:#ffffff;color:#111827;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;-webkit-user-select:none">`
    + logo
    + `<div style="font-size:20px;font-weight:700;margin-top:20px">${name}</div>`
    + `<div style="margin-top:22px;width:26px;height:26px;border:3px solid #e5e7eb;border-top-color:${primaryColor};border-radius:50%;animation:sp .8s linear infinite"></div>`
    + `<style>@keyframes sp{to{transform:rotate(360deg)}}</style></body>`
  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  splashWindow.once('ready-to-show', () => { try { splashWindow.show() } catch (e) {} })
}

function closeSplash() {
  if (splashWindow) {
    try { splashWindow.close() } catch (e) {}
    splashWindow = null
  }
}

// Branded "can't connect" page instead of the Chrome error screen (browser giveaway).
function brandedErrorUrl() {
  const name = esc(config.app_name || 'App')
  const html = `<body style="margin:0;background:#ffffff;color:#374151;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;-webkit-user-select:none">`
    + `<div style="font-size:19px;font-weight:700;color:#111827">${name}</div>`
    + `<div style="font-size:14px;margin-top:10px;max-width:340px;line-height:1.5">We couldn't connect. Please check your internet connection and try again.</div>`
    + `<a href="${esc(config.app_url)}" style="margin-top:20px;padding:9px 22px;border-radius:8px;background:${primaryColor};color:#fff;font-size:14px;font-weight:600;text-decoration:none">Retry</a>`
    + `</body>`
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
}

function createWindow() {
  createSplash()

  mainWindow = new BrowserWindow({
    width: desktop.window_width || 1280,
    height: desktop.window_height || 800,
    minWidth: desktop.min_width || 800,
    minHeight: desktop.min_height || 600,
    title: config.app_name,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    backgroundColor: '#ffffff',
    frame: desktop.show_title_bar !== false,
    autoHideMenuBar: !desktop.show_menu_bar,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // No DevTools in the shipped app — this is a product, not a browser.
      devTools: !app.isPackaged,
    },
  })

  // Never show the browser-style menu bar (File / View / Toggle DevTools …).
  if (!desktop.show_menu_bar) {
    mainWindow.setMenuBarVisibility(false)
    Menu.setApplicationMenu(null)
  }

  // Show only when the content has rendered (no blank white flash), then drop the splash.
  mainWindow.once('ready-to-show', () => {
    if (desktop.start_fullscreen) mainWindow.setFullScreen(true)
    else if (desktop.start_maximized) mainWindow.maximize()
    mainWindow.show()
    closeSplash()
  })

  // Keep DevTools out of the shipped app: block its shortcuts and auto-close it
  // if anything tries to open it.
  if (app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const key = (input.key || '').toLowerCase()
      const devtoolsKey =
        key === 'f12' ||
        ((input.control || input.meta) && input.shift && ['i', 'j', 'c'].includes(key))
      if (devtoolsKey) event.preventDefault()
    })
    mainWindow.webContents.on('devtools-opened', () => {
      try { mainWindow.webContents.closeDevTools() } catch (e) {}
    })
  }

  // Minimal right-click menu (copy/paste only — no browser Back/Forward/Reload/Inspect).
  mainWindow.webContents.on('context-menu', (event, params) => {
    const items = []
    if (params.isEditable) {
      items.push({ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { type: 'separator' }, { role: 'selectAll' })
    } else if (params.selectionText && params.selectionText.trim().length) {
      items.push({ role: 'copy' }, { role: 'selectAll' })
    }
    if (items.length && mainWindow) Menu.buildFromTemplate(items).popup({ window: mainWindow })
  })

  // Watermark for free plan
  if (config.show_watermark) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(`
        if (!document.getElementById('webtoapp-watermark')) {
          const bar = document.createElement('div');
          bar.id = 'webtoapp-watermark';
          bar.innerHTML = '<a href="https://websitetoapp.app" target="_blank" style="color:#6B7280;text-decoration:none;font-size:11px;">Powered by WebToApp</a>';
          bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#F3F4F6;text-align:center;padding:4px 0;z-index:999999;';
          document.body.appendChild(bar);
          document.body.style.paddingBottom = '24px';
        }
      `).catch(() => {})
    })
  }

  // Load the app URL
  mainWindow.loadURL(config.app_url)

  // If the site can't load, show the branded page (not the Chrome error screen)
  // and make sure the splash never hangs forever.
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc, validatedURL, isMainFrame) => {
    if (isMainFrame && errorCode !== -3) { // -3 = ERR_ABORTED (normal navigation), ignore
      mainWindow.loadURL(brandedErrorUrl())
      if (!mainWindow.isVisible()) { mainWindow.show(); closeSplash() }
    }
  })

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const appHost = new URL(config.app_url).host
      const linkHost = new URL(url).host
      if (linkHost !== appHost) {
        shell.openExternal(url)
        return { action: 'deny' }
      }
    } catch (e) { /* ignore */ }
    return { action: 'allow' }
  })

  // Also handle navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appHost = new URL(config.app_url).host
    try {
      const navHost = new URL(url).host
      if (navHost !== appHost) {
        event.preventDefault()
        shell.openExternal(url)
      }
    } catch {
      // Invalid URL, ignore
    }
  })

  // System tray
  if (desktop.enable_system_tray) {
    setupSystemTray()
    mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault()
        mainWindow.hide()
      }
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function setupSystemTray() {
  let trayIcon
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  } else {
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)
  tray.setToolTip(config.app_name)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// App lifecycle
app.whenReady().then(createWindow)

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  app.isQuitting = true
})

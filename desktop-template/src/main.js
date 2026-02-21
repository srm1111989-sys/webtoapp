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

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

let mainWindow = null
let tray = null

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png')

  mainWindow = new BrowserWindow({
    width: desktop.window_width || 1280,
    height: desktop.window_height || 800,
    minWidth: desktop.min_width || 800,
    minHeight: desktop.min_height || 600,
    title: config.app_name,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: desktop.show_title_bar !== false,
    autoHideMenuBar: !desktop.show_menu_bar,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Hide menu bar if configured
  if (!desktop.show_menu_bar) {
    mainWindow.setMenuBarVisibility(false)
    Menu.setApplicationMenu(null)
  }

  // Start maximized or fullscreen
  if (desktop.start_fullscreen) {
    mainWindow.setFullScreen(true)
  } else if (desktop.start_maximized) {
    mainWindow.maximize()
  }

  // Load the app URL
  mainWindow.loadURL(config.app_url)

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const appHost = new URL(config.app_url).host
    const linkHost = new URL(url).host
    if (linkHost !== appHost) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
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
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png')
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

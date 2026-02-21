const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal API to the renderer process
contextBridge.exposeInMainWorld('WebToAppDesktop', {
  platform: 'desktop',
  getAppInfo: () => ({
    platform: 'desktop',
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  }),
})

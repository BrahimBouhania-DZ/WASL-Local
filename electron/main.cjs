const { app, BrowserWindow, shell, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

let mainWindow
let serverProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    title: 'WASL Local وَصْل',
    webPreferences: {
      nodeIntegration: false,       // ✅ prevents renderer from accessing Node
      contextIsolation: true,       // ✅ isolates preload context
      sandbox: true,                // ✅ extra OS-level sandboxing
      webSecurity: true,            // ✅ enforces same-origin policy
      allowRunningInsecureContent: false  // ✅ blocks mixed content
    }
  })

  mainWindow.loadURL('http://localhost:5173')

  // ─── Block navigation to external URLs ────────────────────────────────
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url)
    const allowed = ['localhost', '127.0.0.1']
    const isLocalNetwork = parsedUrl.hostname.startsWith('192.168.') ||
                           parsedUrl.hostname.startsWith('10.') ||
                           parsedUrl.hostname.startsWith('172.')
    if (!allowed.includes(parsedUrl.hostname) && !isLocalNetwork) {
      event.preventDefault()
      shell.openExternal(url)  // Open in default OS browser instead
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function startServer() {
  serverProcess = spawn('npm', ['run', 'dev:server'], {
    cwd: path.join(__dirname, '..'),
    shell: true,
    stdio: 'inherit'
  })
}

app.whenReady().then(() => {
  startServer()
  setTimeout(createWindow, 5000)
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    try { serverProcess.kill() } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ─── Auto-purge session data before quit ─────────────────────────────────
app.on('before-quit', () => {
  try {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/session/purge',
      method: 'POST',
      headers: { 'Content-Length': 0 }
    })
    req.end()
  } catch (_) {}
})

// ─── Disable IPC for dangerous operations ──────────────────────────────
// Only safe, non-destructive IPC handlers are allowed.
// ipcMain.handle('example', ...) <- add here only if needed

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

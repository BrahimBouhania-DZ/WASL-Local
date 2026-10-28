const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

let mainWindow
let serverProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'LinkDesk Local',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.loadURL('http://localhost:5173')

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
    try {
      serverProcess.kill()
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// main.js - Main Electron process
const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    transparent: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Allow loading local files
    }
  });

  // Set window to be always on top
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  
  // Initial state - ignore mouse events to allow clicking through
  // We use forward: true to still get mouse position for bird following
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  
  mainWindow.loadFile('index.html');
  
  // DevTools disabled for production
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Handle IPC messages from renderer
ipcMain.on('toggle-mouse-ignore', (event, shouldIgnore) => {
  console.log('Toggle mouse ignore:', shouldIgnore);
  if (mainWindow) {
    // Always use forward: true to get mouse position even when ignoring mouse events
    // This ensures the bird following feature works while maintaining clickthrough
    mainWindow.setIgnoreMouseEvents(shouldIgnore, { forward: true });
  }
});

ipcMain.on('exit-app', () => {
  app.quit();
});
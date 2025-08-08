const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false
  });

  mainWindow.loadFile('src/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window controls
  ipcMain.handle('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    mainWindow.close();
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow.isMaximized();
  });
}

// API and caching handlers
ipcMain.handle('fetch-pokemon-data', async (event, url) => {
  try {
    const response = await axios.get(url);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cache-data', async (event, key, data) => {
  try {
    const cacheDir = path.join(app.getPath('userData'), 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const filePath = path.join(cacheDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-cached-data', async (event, key) => {
  try {
    const cacheDir = path.join(app.getPath('userData'), 'cache');
    const filePath = path.join(cacheDir, `${key}.json`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    } else {
      return { success: false, error: 'Cache not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-sprite', async (event, url, filename) => {
  try {
    const spritesDir = path.join(app.getPath('userData'), 'sprites');
    if (!fs.existsSync(spritesDir)) {
      fs.mkdirSync(spritesDir, { recursive: true });
    }

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const filePath = path.join(spritesDir, filename);
    fs.writeFileSync(filePath, response.data);
    
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-sprite-path', async (event, filename) => {
  try {
    const spritesDir = path.join(app.getPath('userData'), 'sprites');
    const filePath = path.join(spritesDir, filename);
    
    if (fs.existsSync(filePath)) {
      return { success: true, path: `file://${filePath}` };
    } else {
      return { success: false };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-internet', async () => {
  try {
    await axios.get('https://pokeapi.co/api/v2/pokemon/1', { timeout: 5000 });
    return { online: true };
  } catch (error) {
    return { online: false };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
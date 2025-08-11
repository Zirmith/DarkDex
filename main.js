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
      // Use async read for better performance
      const data = await fs.promises.readFile(filePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    } else {
      return { success: false, error: 'Cache not found' };
    }
  } catch (error) {
    console.error(`Cache read failed for ${key}:`, error.message);
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

ipcMain.handle('download-audio', async (event, url, filename) => {
  try {
    const audioDir = path.join(app.getPath('userData'), 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const filePath = path.join(audioDir, filename);
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

ipcMain.handle('get-audio-path', async (event, filename) => {
  try {
    const audioDir = path.join(app.getPath('userData'), 'audio');
    const filePath = path.join(audioDir, filename);
    
    if (fs.existsSync(filePath)) {
      return { success: true, path: `file://${filePath}` };
    } else {
      return { success: false };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-cache', async (event, cacheType) => {
  try {
    const userDataPath = app.getPath('userData');
    let targetDir;
    
    switch (cacheType) {
      case 'all':
        // Clear all cache directories
        const dirs = ['cache', 'sprites', 'audio'];
        for (const dir of dirs) {
          const dirPath = path.join(userDataPath, dir);
          if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
          }
        }
        break;
      case 'data':
        targetDir = path.join(userDataPath, 'cache');
        break;
      case 'sprites':
        targetDir = path.join(userDataPath, 'sprites');
        break;
      case 'audio':
        targetDir = path.join(userDataPath, 'audio');
        break;
      default:
        return { success: false, error: 'Invalid cache type' };
    }
    
    if (targetDir && fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-cache-stats', async (event) => {
  try {
    const userDataPath = app.getPath('userData');
    const stats = {
      data: { size: 0, files: 0 },
      sprites: { size: 0, files: 0 },
      audio: { size: 0, files: 0 },
      total: { size: 0, files: 0 }
    };
    
    const calculateDirStats = (dirPath) => {
      if (!fs.existsSync(dirPath)) return { size: 0, files: 0 };
      
      let size = 0;
      let files = 0;
      
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isFile()) {
          size += stat.size;
          files++;
        }
      }
      
      return { size, files };
    };
    
    stats.data = calculateDirStats(path.join(userDataPath, 'cache'));
    stats.sprites = calculateDirStats(path.join(userDataPath, 'sprites'));
    stats.audio = calculateDirStats(path.join(userDataPath, 'audio'));
    
    stats.total.size = stats.data.size + stats.sprites.size + stats.audio.size;
    stats.total.files = stats.data.files + stats.sprites.files + stats.audio.files;
    
    return { success: true, stats };
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
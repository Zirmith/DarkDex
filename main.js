const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

let mainWindow;
let updaterWindow;
let updaterWindow;

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

function createUpdaterWindow() {
  updaterWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    alwaysOnTop: true
  });

  updaterWindow.loadFile('src/updater.html');

  updaterWindow.once('ready-to-show', () => {
    updaterWindow.show();
  });

  updaterWindow.on('closed', () => {
    updaterWindow = null;
  });
}

function createUpdaterWindow() {
  updaterWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    alwaysOnTop: true
  });

  updaterWindow.loadFile('src/updater.html');

  updaterWindow.once('ready-to-show', () => {
    updaterWindow.show();
  });

  updaterWindow.on('closed', () => {
    updaterWindow = null;
  });
}

// ====== GitHub Update + Backup ======

// Helper: SHA-256 hash for content comparison
const hashContent = (content) => crypto.createHash('sha256').update(content).digest('hex');

// Helper: Fetch JSON file list from GitHub API recursively
async function fetchGitHubFiles(owner, repo, branch, dir) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dir}?ref=${branch}`;
  const res = await axios.get(apiUrl, { headers: { 'User-Agent': 'Electron-App' } });

  let files = [];
  for (const item of res.data) {
    if (item.type === 'file') {
      files.push(item.path);
    } else if (item.type === 'dir') {
      files = files.concat(await fetchGitHubFiles(owner, repo, branch, item.path));
    }
  }
  return files;
}

// Helper: Download raw file from GitHub
async function downloadGitHubFile(owner, repo, branch, filePath) {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  const res = await axios.get(rawUrl, { responseType: 'text' });
  return res.data;
}

// Helper: Make backup of `src` folder
function backupSrcFolder() {
  const srcPath = path.join(__dirname, 'src');
  if (!fs.existsSync(srcPath)) return null;

  const backupDir = path.join(__dirname, 'backup_src');
  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `src_backup_${timestamp}`);
  fs.mkdirSync(backupPath, { recursive: true });

  copyFolderRecursiveSync(srcPath, backupPath);
  return backupPath;
}

// Helper: Recursively copy folder
function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });

  for (const file of fs.readdirSync(source)) {
    const srcFile = path.join(source, file);
    const destFile = path.join(target, file);
    if (fs.lstatSync(srcFile).isDirectory()) {
      copyFolderRecursiveSync(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}

// Auto-update src folder
async function checkForUpdates() {
  const owner = 'Zirmith';
  const repo = 'DarkDex';
  const branch = 'main';
  const srcFolder = 'src';

  try {
    console.log('Checking for updates...');
    if (updaterWindow) {
      updaterWindow.webContents.send('update-status', { status: 'checking' });
    }
    
    if (updaterWindow) {
      updaterWindow.webContents.send('update-status', { status: 'checking' });
    }
    
    const files = await fetchGitHubFiles(owner, repo, branch, srcFolder);
    let updatedFiles = [];
    let hasUpdates = false;

    // Check which files need updating without actually updating them
    for (const file of files) {
      const localPath = path.join(__dirname, file);
      const remoteContent = await downloadGitHubFile(owner, repo, branch, file);
      const remoteHash = hashContent(remoteContent);

      let localHash = null;
      if (fs.existsSync(localPath)) {
        const localContent = fs.readFileSync(localPath, 'utf8');
        localHash = hashContent(localContent);
      }

      if (remoteHash !== localHash) {
        updatedFiles.push(file);
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      console.log(`Updates available for: ${updatedFiles.join(', ')}`);
      if (updaterWindow) {
        updaterWindow.webContents.send('update-status', { 
          status: 'available',
          updateInfo: {
            files: updatedFiles,
            lastUpdate: new Date().toISOString()
          }
        });
            files: updatedFiles,
            lastUpdate: new Date().toISOString()
          }
        });
      }
    } else {
      console.log('No updates found.');
      if (updaterWindow) {
        updaterWindow.webContents.send('update-status', { status: 'up-to-date' });
      }
    }
    
    return { hasUpdates, files: updatedFiles };
  } catch (err) {
    console.error('Update check failed:', err.message);
    if (updaterWindow) {
      updaterWindow.webContents.send('update-status', { 
        status: 'error', 
        error: err.message 
      });
    }
    return { hasUpdates: false, files: [], error: err.message };
  }
}

async function performUpdate(filesToUpdate) {
  const owner = 'Zirmith';
  const repo = 'DarkDex';
  const branch = 'main';
  
  try {
    if (updaterWindow) {
      updaterWindow.webContents.send('update-status', { status: 'downloading' });
    }
    
    // Backup before updating
    const backupPath = backupSrcFolder();
    if (backupPath) {
      console.log(`Backup created at: ${backupPath}`);
    }

    let completedFiles = 0;
    const totalFiles = filesToUpdate.length;

    for (const file of filesToUpdate) {
      const localPath = path.join(__dirname, file);
      const remoteContent = await downloadGitHubFile(owner, repo, branch, file);
      
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, remoteContent, 'utf8');
      
      completedFiles++;
      const progress = Math.round((completedFiles / totalFiles) * 100);
      
      if (updaterWindow) {
        updaterWindow.webContents.send('update-progress', {
          percent: progress,
          message: `Updating ${path.basename(file)}... (${completedFiles}/${totalFiles})`
        });
      }
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    } else {
      console.log('No updates found.');
      if (updaterWindow) {
        updaterWindow.webContents.send('update-status', { status: 'up-to-date' });
    setTimeout(() => {
  } catch (error) {
    
    return { hasUpdates, files: updatedFiles };
    console.error('Update failed:', error.message);
    if (updaterWindow) {
      updaterWindow.webContents.send('update-status', { 
        status: 'error', 
        error: error.message 
      });
    }
  }
}

// IPC handlers for updater
ipcMain.on('check-for-updates', async () => {
  await checkForUpdates();
});

ipcMain.on('start-update', async () => {
  const updateCheck = await checkForUpdates();
  if (updateCheck.hasUpdates) {
    await performUpdate(updateCheck.files);
  }
});

ipcMain.on('skip-update', () => {
  if (updaterWindow) {
    updaterWindow.close();
  }
  // Continue with normal app startup
  if (!mainWindow) {
    createWindow();
  }
});

// Show updater window and check for updates
async function showUpdaterAndCheck() {
  createUpdaterWindow();
  
  // Wait a moment for the updater window to be ready
  setTimeout(async () => {
    const updateResult = await checkForUpdates();
    
    // If no updates and no error, automatically continue after a delay
    if (!updateResult.hasUpdates && !updateResult.error) {
      setTimeout(() => {
        if (updaterWindow) {
          updaterWindow.close();
        }
        if (!mainWindow) {
          createWindow();
        }
      }, 3000);
    }
  }, 1000);
}

// Modified updateSrcFromGitHub for backward compatibility
async function updateSrcFromGitHub() {
  // This function is now just a wrapper for the new update system
  const updateResult = await checkForUpdates();
  if (updateResult.hasUpdates) {
    await performUpdate(updateResult.files);
  }
}

// Handle updater window closed
ipcMain.on('updater-closed', () => {
  if (!mainWindow) {
    createWindow();
  }
});

// Listen for updater window close
app.on('window-all-closed', () => {
  // Don't quit if only updater window is closed
  if (process.platform !== 'darwin' && !updaterWindow) {
    app.quit();
    if (updaterWindow) {
      updaterWindow.webContents.send('update-status', { 
        status: 'error', 
        error: err.message 
      });
    }
    return { hasUpdates: false, files: [], error: err.message };
  }
});

async function performUpdate(filesToUpdate) {
  const owner = 'Zirmith';
  const repo = 'DarkDex';
  const branch = 'main';
  
  try {
    if (updaterWindow) {
      updaterWindow.webContents.send('update-status', { status: 'downloading' });
    }
    
    // Backup before updating
    const backupPath = backupSrcFolder();
    if (backupPath) {
      console.log(`Backup created at: ${backupPath}`);
    }

    let completedFiles = 0;
    const totalFiles = filesToUpdate.length;

    for (const file of filesToUpdate) {
      const localPath = path.join(__dirname, file);
      const remoteContent = await downloadGitHubFile(owner, repo, branch, file);
      
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, remoteContent, 'utf8');
      
      completedFiles++;
      const progress = Math.round((completedFiles / totalFiles) * 100);
      
      if (updaterWindow) {
        updaterWindow.webContents.send('update-progress', {
          percent: progress,
          message: `Updating ${path.basename(file)}... (${completedFiles}/${totalFiles})`
        });
      }
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Successfully updated ${filesToUpdate.length} files`);
    
    if (updaterWindow) {
      updaterWindow.webContents.send('update-status', { status: 'complete' });
    }
    
    // Close updater and show restart dialog
    setTimeout(() => {
      if (updaterWindow) {
        updaterWindow.close();
      }
      
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Complete',
        message: 'DarkDex has been updated successfully. The application will restart now.',
        buttons: ['Restart Now']
      }).then(() => {
        app.relaunch();
        app.exit();
      });
    }, 2000);
    
  } catch (error) {
    console.error('Update failed:', error.message);
    if (updaterWindow) {
      updaterWindow.webContents.send('update-status', { 
        status: 'error', 
        error: error.message 
      });
    }
  }
}

// IPC handlers for updater
ipcMain.on('check-for-updates', async () => {
  await checkForUpdates();
});

ipcMain.on('start-update', async () => {
  const updateCheck = await checkForUpdates();
  if (updateCheck.hasUpdates) {
    await performUpdate(updateCheck.files);
  }
});

ipcMain.on('skip-update', () => {
  if (updaterWindow) {
    updaterWindow.close();
  }
  // Continue with normal app startup
  if (!mainWindow) {
    createWindow();
  }
});

// Show updater window and check for updates
async function showUpdaterAndCheck() {
  createUpdaterWindow();
  
  // Wait a moment for the updater window to be ready
  setTimeout(async () => {
    const updateResult = await checkForUpdates();
    
    // If no updates and no error, automatically continue after a delay
    if (!updateResult.hasUpdates && !updateResult.error) {
      setTimeout(() => {
        if (updaterWindow) {
          updaterWindow.close();
        }
        if (!mainWindow) {
          createWindow();
        }
      }, 3000);
    }
  }, 1000);
}

// Modified updateSrcFromGitHub for backward compatibility
async function updateSrcFromGitHub() {
  // This function is now just a wrapper for the new update system
  const updateResult = await checkForUpdates();
  if (updateResult.hasUpdates) {
    await performUpdate(updateResult.files);
  }
}

// Handle updater window closed
ipcMain.on('updater-closed', () => {
  if (!mainWindow) {
    createWindow();
  }
});

// Listen for updater window close
app.on('window-all-closed', () => {
  // Don't quit if only updater window is closed
  if (process.platform !== 'darwin' && !updaterWindow) {
    app.quit();
  }
});

// Update the window-all-closed handler
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    } else {
      app.quit();
    }
});


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
    const response = await axios.get('https://pokeapi.co/api/v2/pokemon/1', { timeout: 5000 });
    if (response.status === 200) {
      return { online: true };
    } else {
      return { online: false };
    }
  } catch (error) {
    console.log('Internet check failed:', error.message);
    return { online: false };
  }
});

ipcMain.handle('test-connection', async () => {
  try {
    const response = await axios.get('https://httpbin.org/status/200', { timeout: 3000 });
    return { online: true };
  } catch (error) {
    return { online: false };
  }
});

// =====================
// App lifecycle
// =====================
app.whenReady().then(async () => {
  // Show updater first, then main window
  await showUpdaterAndCheck();
});
  // Show updater first, then main window
  await showUpdaterAndCheck();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    showUpdaterAndCheck();
  }
});

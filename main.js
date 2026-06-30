const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 750,
    minWidth: 350,
    minHeight: 300,
    autoHideMenuBar: true, 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('popup.html');

  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- AYARLAR ÜÇÜN IPC KODLARI ---
ipcMain.on('toggle-startup', (event, enable) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    path: app.getPath('exe')
  });
});

ipcMain.on('toggle-mini-mode', (event, enable) => {
  if (enable) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setSize(350, 350);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setSize(450, 750);
  }
});

// --- YENİLƏNMƏ KODLARI (SƏSSİZ) ---
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({ type: 'info', title: 'Tapıldı!', message: 'Yeni versiya tapıldı! Arxa planda yüklənir...' });
});

autoUpdater.on('error', (err) => {
  dialog.showErrorBox('Yenilənmə Xətası!', err == null ? "Bilinməyən xəta" : (err.stack || err).toString());
});

autoUpdater.on('update-downloaded', () => {
  const dialogOpts = {
    type: 'info',
    buttons: ['İndi Yenidən Başlat', 'Sonra'],
    title: 'Tətbiq Yenilənməsi',
    message: 'Yeni versiya tam yükləndi!',
    detail: 'Dəyişikliklərin tətbiq edilməsi üçün proqram yenidən başladılmalıdır.'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      // true, true edərək "Next, Next" pəncərələrini ləğv edib səssiz quraşdırırıq
      autoUpdater.quitAndInstall(true, true);
    }
  });
});
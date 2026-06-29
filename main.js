const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 750,
    minWidth: 420,
    minHeight: 600,
    autoHideMenuBar: true, 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('popup.html');

  mainWindow.once('ready-to-show', () => {
    // Proqram açılanda yenilənməni yoxlamağa başlayır
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

// --- YENİLƏNMƏ ÜÇÜN TEST (DEBUG) KODLARI ---

autoUpdater.on('checking-for-update', () => {
  // dialog.showMessageBox({ type: 'info', title: 'Test', message: 'Yenilənmə yoxlanılır...' }); 
  // (Bunu aktiv etmirik ki, hər dəfə proqram açılanda bezdirməsin)
});

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({ type: 'info', title: 'Tapıldı!', message: 'Yeni versiya tapıldı! Arxa planda yüklənir, zəhmət olmasa gözləyin...' });
});

autoUpdater.on('update-not-available', (info) => {
  // dialog.showMessageBox({ type: 'info', title: 'Ən son versiya', message: 'Hazırda ən son versiyanı istifadə edirsiniz.' });
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
      autoUpdater.quitAndInstall();
    }
  });
});
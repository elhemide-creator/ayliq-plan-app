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

  // Pəncərə açılanda yenilənmələri yoxla
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- AVTOMATİK YENİLƏNMƏ EVENTLƏRİ ---

// Yeni versiya tapıldıqda
autoUpdater.on('update-available', () => {
  console.log('Yeni versiya tapıldı, yüklənir...');
});

// Yeni versiya yükləndikdə
autoUpdater.on('update-downloaded', () => {
  const dialogOpts = {
    type: 'info',
    buttons: ['İndi Yenidən Başlat', 'Sonra'],
    title: 'Tətbiq Yenilənməsi',
    message: 'Yeni versiya yükləndi!',
    detail: 'Dəyişikliklərin tətbiq edilməsi üçün proqram yenidən başladılmalıdır.'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall(); // Proqramı bağla və yeni versiyanı qur
    }
  });
});
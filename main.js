const { app, BrowserWindow, dialog, ipcMain, screen } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let normalBounds = {};

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 750,
    minWidth: 300,
    minHeight: 350,
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

// --- AYARLAR VƏ WIDGET (MİNİ-REJİM) KODLARI ---
ipcMain.on('toggle-startup', (event, enable) => {
  app.setLoginItemSettings({ openAtLogin: enable, path: app.getPath('exe') });
});

ipcMain.on('toggle-mini-mode', (event, enable) => {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  if (enable) {
    normalBounds = mainWindow.getBounds(); // Normal ölçünü yadda saxla
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    // Ekranın sağ kənarına qısılmış (gizli) vəziyyətdə göndəririk
    mainWindow.setBounds({ x: width - 40, y: Math.floor(height / 2 - 200), width: 300, height: 400 });
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setBounds(normalBounds); // Əvvəlki yerinə qaytar
  }
});

// Mouse üzərinə gələndə və gedəndə ölçünü dəyişmək üçün
ipcMain.on('widget-state', (event, state) => {
  const display = screen.getPrimaryDisplay();
  const { width } = display.workAreaSize;
  const bounds = mainWindow.getBounds();

  if (state === 'expand') { // Açılır
    mainWindow.setBounds({ x: width - 300, y: bounds.y, width: 300, height: bounds.height });
  } else if (state === 'collapse') { // Gizlənir
    mainWindow.setBounds({ x: width - 40, y: bounds.y, width: 300, height: bounds.height });
  }
});

// --- YENİLƏNMƏ KODLARI ---
autoUpdater.on('update-available', () => { dialog.showMessageBox({ type: 'info', title: 'Tapıldı!', message: 'Yeni versiya tapıldı! Arxa planda yüklənir...' }); });
autoUpdater.on('error', (err) => { dialog.showErrorBox('Yenilənmə Xətası!', err == null ? "Bilinməyən xəta" : (err.stack || err).toString()); });
autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({ type: 'info', buttons: ['İndi Yenidən Başlat', 'Sonra'], title: 'Yenilənmə', message: 'Yükləndi!' }).then((res) => {
    if (res.response === 0) autoUpdater.quitAndInstall(true, true);
  });
});
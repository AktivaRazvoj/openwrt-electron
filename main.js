const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { handleSSHCommands } = require('./src/api');

const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');


function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.setMenuBarVisibility(false);
  win.loadFile('public/index.html');
}

app.whenReady().then(() => {
  createWindow();

  // Check for updates after app is ready
  autoUpdater.checkForUpdatesAndNotify();

  // Optional: Listen for update events
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Na voljo je posodobitev',
      message: 'Na voljo je nova različica. Prenašam ...',
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Posodobitev pripravljena',
      message: 'Nova različica je bila prenesena. Želite ponovno zagnati za namestitev?',
      buttons: ['Ponovni zagon', 'Kasneje'],
    }).then(result => {
      if (result.response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => {
    dialog.showErrorBox('Napaka pri posodobitvi', err == null ? "neznano" : (err.stack || err).toString());
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// SSH command handlers
handleSSHCommands(ipcMain);

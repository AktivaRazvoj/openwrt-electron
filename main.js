const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { handleSSHCommands } = require('./src/api');

const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');


function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    resizable:false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

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
      title: 'Update available',
      message: 'A new version is available. Downloading now...',
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update ready',
      message: 'A new version has been downloaded. Restart to install?',
      buttons: ['Restart', 'Later'],
    }).then(result => {
      if (result.response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => {
    dialog.showErrorBox('Update error', err == null ? "unknown" : (err.stack || err).toString());
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// SSH command handlers
handleSSHCommands(ipcMain);

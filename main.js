const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { handleSSHCommands } = require('./src/api');


const { dialog } = require('electron');


function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    resizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
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


});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// SSH command handlers
handleSSHCommands(ipcMain);

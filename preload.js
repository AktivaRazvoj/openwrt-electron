const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendSSHCommand: (cmd, params) => ipcRenderer.invoke('ssh-command', cmd, params),
});

const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('bryteDesktop', {
  beeperRequest: (request) => ipcRenderer.invoke('beeper:request', request),
});
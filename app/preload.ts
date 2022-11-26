const { contextBridge, ipcRenderer } = require ('electron');

contextBridge.exposeInMainWorld ('store', {
  getSetting: (key) => ipcRenderer.invoke ('store:getSetting', key),
  setSetting: (key, value) => ipcRenderer.invoke ('store:setSetting', key, value)
});

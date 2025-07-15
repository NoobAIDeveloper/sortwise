const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolders: () => ipcRenderer.invoke('dialog:openDirectory'),
  sortFiles: (options) => ipcRenderer.invoke('sort:files', options),
  onSortProgress: (callback) => ipcRenderer.on('sort:progress', callback),
  undoSort: (logFile) => ipcRenderer.invoke('undo:sort', logFile),
});

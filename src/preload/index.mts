import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  connectToFtp: (url, username, password, folder) =>
    ipcRenderer.invoke('connectToFtp', url, username, password, folder),
  convertFile: (fileUrl, oldFilePath, localFolder) =>
    ipcRenderer.invoke('convertFile', fileUrl, oldFilePath, localFolder),
  selectFolder: (folderPath?: string) => ipcRenderer.invoke('selectFolder', folderPath),
  getConnections: () => ipcRenderer.invoke('getConnections')
}

// Use `contextBridge` APIs to expose Electron APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

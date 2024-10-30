import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electron', {
      connectToFtp: (url, username, password) =>
        ipcRenderer.invoke('connectToFtp', url, username, password)
    })
    contextBridge.exposeInMainWorld('electron', {
      ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        invoke: (channel, data) => ipcRenderer.invoke(channel, data)
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
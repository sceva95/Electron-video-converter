import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import elemon from 'elemon'
import { Client } from 'basic-ftp'
import { countItems, getFolderStructure, handleFileConversion } from './ftp/ftpConversion'
import Store from 'electron-store'
import { STORE_KEYS } from '../utils/type'
import icon from '../../resources/icon.png?asset'
const store = new Store()

export function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

await app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }

  store.delete(STORE_KEYS.FOLDERS)
})

ipcMain.handle('selectFolder', async (_, folderPath) => {
  let selectedFolder = folderPath

  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    defaultPath: selectedFolder || undefined
  })
  if (canceled || filePaths.length === 0) {
    return null
  }
  selectedFolder = filePaths[0]

  return selectedFolder
})

await ipcMain.handle('connectToFtp', async (event, url, username, password, folder) => {
  const client = new Client()
  client.ftp.verbose = true

  const connections = store.get(STORE_KEYS.CONNECTIONS) || []
  const currentConnection = { url, username, password, folder }
  const index = connections.findIndex(
    (connection) =>
      connection.url === currentConnection.url &&
      connection.username === currentConnection.username &&
      connection.password === currentConnection.password
  )

  if (index < 0) {
    connections.push(currentConnection)
  } else {
    connections[index] = currentConnection
  }

  try {
    await client.access({
      host: url,
      user: username,
      password: password,
      secure: false
    })

    store.set(STORE_KEYS.CONNECTIONS, connections)
    store.set(STORE_KEYS.FTPCONNECTION, currentConnection)

    event.sender.send('progress-update', 0)

    const totalItems = await countItems(client, folder)

    event.sender.send('progress-update', 10)

    const folderStructure = await getFolderStructure(client, event, folder, totalItems)
    return folderStructure
  } catch (error: any) {
    console.error('Error:', error)
    return []
  } finally {
    client.close()
  }
})

await ipcMain.handle('convertFile', async (event, fileUrl, oldFilePath, localFolder) => {
  const savedConnection = store.get(STORE_KEYS.FTPCONNECTION)
  handleFileConversion(savedConnection, fileUrl, oldFilePath, localFolder)
    .then(() => {
      event.reply('conversion-success')
    })
    .catch((error) => {
      event.reply('conversion-error', error.message)
    })
})

await ipcMain.handle('getConnections', async () => {
  const connections = store.get(STORE_KEYS.CONNECTIONS) || []
  return connections
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Configura Elemon per il live reload
  if (is.dev) {
    console.log('Dev mode')

    elemon({
      app: app,
      mainFile: join(__dirname, 'main.js'),
      watchRenderer: true
    })
  }
})

import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import elemon from 'elemon'
import { readdirSync, lstatSync } from 'fs'
import { Client } from 'basic-ftp'
import { countItems, createWindow, downloadFile, getFolderStructure } from './utils'

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('select-folder', async (_, folderPath) => {
  let selectedFolder = folderPath

  // Se non viene specificato alcun percorso, apri un dialog per selezionare una cartella
  if (!selectedFolder) {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled || filePaths.length === 0) {
      return []
    }
    selectedFolder = filePaths[0]
  }

  // Leggi il contenuto della cartella selezionata
  return readdirSync(selectedFolder).map((file) => ({
    name: file,
    path: join(selectedFolder, file),
    isDirectory: lstatSync(join(selectedFolder, file)).isDirectory()
  }))
})

ipcMain.handle('connectToFtp', async (event, url, username, password, folder) => {
  const client = new Client()
  client.ftp.verbose = true
  try {
    await client.access({
      host: url,
      user: username,
      password: password,
      secure: false
    })

    const totalItems = await countItems(client, folder)

    const folderStructure = await getFolderStructure(client, event, folder, totalItems)
    return folderStructure
  } catch (error: any) {
    console.error('Error:', error)
    return { error: error?.message }
  } finally {
    client.close()
  }
})

ipcMain.handle('downloadFile', async (event, { files, ftpCredentials }) => {
  const { url, username, password } = ftpCredentials // Estrarre le credenziali
  const client = new Client()
  client.ftp.verbose = true

  try {
    await client.access({
      host: url,
      user: username,
      password: password,
      secure: false
    })

    const localFolder = '/path/to/your/local/folder' // Definisci la cartella locale dove salvare i file

    for (const file of files) {
      await downloadFile(client, file, localFolder, true, 1080) // Modifica maxResolution se necessario
    }
  } catch (error) {
    console.error('Error downloading files:', error)
  } finally {
    client.close()
  }
})

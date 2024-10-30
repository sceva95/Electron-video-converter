import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import elemon from 'elemon'
import fs, { createWriteStream } from 'fs'
import path from 'path'
import ftp from 'basic-ftp'
import EventEmitter = require('events')
import { finished } from 'stream/promises'

async function countItems(client, path = '/') {
  const files = await client.list(path)
  let count = files.length

  for (const file of files) {
    const currentPath = `${path}/${file.name}`
    if (file.isDirectory) {
      count += await countItems(client, currentPath)
    }
  }
  return count
}

async function getFolderStructure(
  client,
  event,
  path = '/',
  totalItems = 1,
  processedItems = { count: 0 }
) {
  const files = await client.list(path)
  const structure = []

  for (const file of files) {
    const currentPath = `${path}/${file.name}`
    processedItems.count += 1
    const percentage = Math.round((processedItems.count / totalItems) * 100)

    // Invia aggiornamento di avanzamento
    event.sender.send('progress-update', percentage)

    if (file.isDirectory) {
      const children = await getFolderStructure(
        client,
        event,
        currentPath,
        totalItems,
        processedItems
      )
      structure.push({
        name: file.name,
        type: 'directory',
        selected: false,
        resolution: 1080,
        path: currentPath,
        children
      })
    } else {
      structure.push({
        name: file.name,
        selected: false,
        resolution: 1080,
        type: 'file',
        path: currentPath
      })
    }
  }
  return structure
}

async function downloadFile(client, file, localFolder, retryOnError, maxResolution) {
  const existingFile = get_keyword(file.name)

  // Controllo se ho già analizzato il file e se era andato in errore
  if (existingFile) {
    if (retryOnError && existingFile.error) {
      console.log(`File ${file.name} already executed. It was on error, Restart.`)
    } else if (existingFile.maxResolution > maxResolution) {
      console.log(`File ${file.name} already executed. Max resolution higher, Restart.`)
    } else {
      console.log(`File ${file.name} already executed. Skip.`)
      return
    }
  }

  const localPath = path.join(localFolder, file.name)

  // Controlla se il file esiste localmente e se la dimensione è la stessa
  if (fs.existsSync(localPath) && fs.statSync(localPath).size === file.size) {
    console.log(`File ${file.name} already exists locally with the same size. Skipping download.`)
    return
  }

  // Crea un stream per il file locale e gestisci il download
  const localFileStream = createWriteStream(localPath)

  try {
    // Usa downloadTo per scaricare il file e gestire il progresso
    await client.downloadTo(localFileStream, file.path, {
      onProgress: (bytes) => {
        console.log(`Downloaded ${bytes} bytes for ${file.name}`)
      }
    })

    console.log(`Downloaded ${file.name} from FTP to ${localPath}`)
  } catch (error) {
    console.error(`Error downloading file ${file.name}: ${error.message}`)
  } finally {
    localFileStream.end()
    await finished(localFileStream) // Aspetta che il file stream sia chiuso
  }

  return localPath
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
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
  return fs.readdirSync(selectedFolder).map((file) => ({
    name: file,
    path: path.join(selectedFolder, file),
    isDirectory: fs.lstatSync(path.join(selectedFolder, file)).isDirectory()
  }))
})

ipcMain.handle('connectToFtp', async (event, url, username, password, folder) => {
  const client = new ftp.Client()
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
  } catch (error) {
    console.error('Error:', error)
    return { error: error.message }
  } finally {
    client.close()
  }
})

ipcMain.handle('downloadFile', async (event, { files, ftpCredentials }) => {
  const { url, username, password } = ftpCredentials // Estrarre le credenziali
  const client = new ftp.Client()
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

import { shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createWriteStream, statSync, existsSync } from 'fs'
import { finished } from 'stream/promises'

export async function downloadFile(client, file, localFolder, retryOnError, maxResolution) {
  const existingFile = undefined //get_keyword(file.name)

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

  const localPath = join(localFolder, file.name)

  // Controlla se il file esiste localmente e se la dimensione è la stessa
  if (existsSync(localPath) && statSync(localPath).size === file.size) {
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

export function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
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

export async function getFolderStructure(
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

export async function countItems(client, path = '/') {
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

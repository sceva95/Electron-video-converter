import path from 'path'
import ffmpegPath from 'ffmpeg-static'
import { exec } from 'child_process'
import { Client } from 'basic-ftp'
import { FolderTreeNode, STORE_KEYS } from '../../utils/type'
import { updateProgress, isVideoFile, getVideoInfo } from '../utils'
import Store from 'electron-store'

const store = new Store()

export const downloadFile = async (
  ftpDetails: { url: string; username: string; password: string },
  outputPath: string,
  fileUrl: string
) => {
  const client = new Client()
  client.ftp.verbose = true

  try {
    await client.access({
      host: ftpDetails.url,
      user: ftpDetails.username,
      password: ftpDetails.password,
      secure: false
    })

    await client.downloadTo(outputPath, fileUrl)
    console.log(`File scaricato in: ${outputPath}`)
  } catch (error) {
    console.error('Errore durante il download:', error)
    throw error
  } finally {
    client.close()
  }
}

// Funzione per convertire un file usando ffmpeg
const convertFile = (inputFile: string, outputFile: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ffmpegCommand = `${ffmpegPath} -i "${inputFile}" -c:v libx265 -preset fast -b:v 0 -crf 24 -c:a copy -movflags +faststart "${outputFile}"`

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing FFmpeg: ${error}`)
        return reject(error)
      }
      console.log(`FFmpeg stdout: ${stdout}`)
      console.error(`FFmpeg stderr: ${stderr}`)
      resolve()
    })
  })
}

const uploadFile = async (
  ftpDetails: { url: string; username: string; password: string },
  localFilePath: string,
  remoteFilePath: string
): Promise<void> => {
  const client = new Client()
  client.ftp.verbose = true // Abilita la modalità verbosa per il debug

  try {
    // Connetti al server FTP
    await client.access({
      host: ftpDetails.url,
      user: ftpDetails.username,
      password: ftpDetails.password,
      secure: false
    })

    // Carica il file locale nel percorso remoto
    await client.uploadFrom(localFilePath, remoteFilePath)
    console.log(`File caricato: ${localFilePath} -> ${remoteFilePath}`)
  } catch (error) {
    console.error("Errore durante l'upload:", error)
    throw error // Rilancia l'errore per gestirlo a un livello superiore
  } finally {
    client.close()
  }
}

export async function getFolderStructure(
  client,
  event,
  path = '/',
  totalItems = 1,
  processedItems = { count: 0 },
  processingTimes: number[] = []
) {
  const files = await client.list(path)
  const structure: FolderTreeNode[] = []
  const foldersDB = store.get(STORE_KEYS.FOLDERS) || []

  for (const file of files) {
    const startTime = Date.now()
    const currentPath = `${path}/${file.name}`
    processedItems.count += 1
    const percentage = Math.max(10, Math.round((processedItems.count / totalItems) * 100))

    const fileInFolder = foldersDB?.find((el) => el.key === currentPath)

    if (
      fileInFolder &&
      fileInFolder.timeToLive &&
      new Date(fileInFolder.timeToLive) > new Date() &&
      fileInFolder.date === file.date
    ) {
      structure.push(fileInFolder)
      processingTimes.push(Date.now() - startTime)
      updateProgress(event, percentage, processingTimes, totalItems - processedItems.count)
      continue
    }

    let newItem: FolderTreeNode = {
      key: currentPath,
      name: file.name,
      selected: false,
      resolution: 1080,
      path: currentPath,
      date: file.date
    }

    if (file.isDirectory) {
      const children = await getFolderStructure(
        client,
        event,
        currentPath,
        totalItems,
        processedItems,
        processingTimes
      )

      newItem = {
        ...newItem,
        type: 'directory',
        size: children?.reduce((acc, el) => (acc += Number(el?.size) || 0), 0),
        children
      }
      foldersDB.push(newItem)
      structure.push(newItem)
    } else {
      const isVideo = isVideoFile(file.name)
      let videoInfo
      if (isVideo) {
        videoInfo = await getVideoInfo(currentPath)
      }
      newItem = {
        ...newItem,
        type: 'file',
        isVideo: isVideo,
        path: currentPath,
        date: file.date,
        ...videoInfo
      }

      foldersDB.push({ ...newItem, timeToLive: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
      structure.push(newItem)
    }

    processingTimes.push(Date.now() - startTime)
    updateProgress(event, percentage, processingTimes, totalItems - processedItems.count)
  }
  store.set(STORE_KEYS.FOLDERS, foldersDB)
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

export const handleFileConversion = async (
  ftpDetails: { url: string; username: string; password: string },
  fileUrl: string,
  oldFilePath: string,
  localFolder: string
) => {
  const localFilePath = path.join(localFolder, path.basename(fileUrl))
  const outputFilePath = path.join(localFolder, path.basename(fileUrl) + '.mp4')

  try {
    // Passo 1: Scarica il file
    await downloadFile(ftpDetails, localFilePath, fileUrl)
    console.log(`File downloaded to ${localFilePath}`)

    // Passo 2: Converti il file
    await convertFile(localFilePath, outputFilePath)
    console.log(`File converted to ${outputFilePath}`)

    // Passo 3: Carica il nuovo file sul server FTP
    // await uploadFile(ftpDetails, outputFilePath, `/path/on/server/${newFileName}`)
    // console.log(`File uploaded to FTP server`)

    // Passo 4: Elimina il file locale e quello vecchio
    // fs.unlinkSync(localFilePath)
    // fs.unlinkSync(oldFilePath)
    console.log(`Cleaned up local files`)
  } catch (error) {
    console.error(`Error in file conversion process: ${error}`)
  }
}

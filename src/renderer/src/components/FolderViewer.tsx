import { useState } from 'react'

interface FileItem {
  name: string
  path: string
  isDirectory: boolean
}

export default function FolderViewer() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folderStack, setFolderStack] = useState<string[]>([])

  // Funzione per selezionare una cartella iniziale
  const selectFolder = async (folderPath?: string) => {
    const fileList: FileItem[] = await window.electron.ipcRenderer.invoke(
      'select-folder',
      folderPath
    )
    setFiles(fileList)
    if (folderPath) {
      setFolderStack((prevStack) => [...prevStack, folderPath])
    }
  }

  // Funzione per navigare all'interno di una cartella
  const openFolder = (folderPath: string) => {
    selectFolder(folderPath)
  }

  // Funzione per tornare indietro nella cartella precedente
  const goBack = () => {
    if (folderStack.length > 1) {
      const newStack = [...folderStack]
      newStack.pop()
      const previousFolder = newStack[newStack.length - 1]
      setFolderStack(newStack)
      selectFolder(previousFolder)
    } else {
      // Se siamo nella cartella iniziale, reimposta lo stack e i file
      setFolderStack([])
      setFiles([])
    }
  }

  return (
    <div>
      <button onClick={() => selectFolder()}>Select Folder</button>
      {folderStack.length > 0 && <button onClick={goBack}>Back</button>}
      <ul>
        {files.map((file) => (
          <li key={file.path} onClick={() => file.isDirectory && openFolder(file.path)}>
            {file.isDirectory ? '📁' : '📄'} {file.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

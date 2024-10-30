import { useEffect, useState } from 'react'
import { FolderTree } from './components/FolderTree'

function App(): JSX.Element {
  const [ftpUrl, setFtpUrl] = useState<string>('192.168.1.64')
  const [folder, setFolder] = useState<string>('/downloads')
  const [username, setUsername] = useState<string>('dietpi')
  const [password, setPassword] = useState<string>('plasma')
  const [folderTree, setFolderTree] = useState<any>(null)
  const [progress, setProgress] = useState<any>()

  useEffect(() => {
    window.electron.ipcRenderer.on('progress-update', (event, percentage) => {
      setProgress(percentage)
    })

    return () => {
      window.electron.ipcRenderer.removeAllListeners('progress-update')
    }
  }, [])

  const connectToFtp = async () => {
    try {
      const folderStructure = await window.electron.ipcRenderer.invoke(
        'connectToFtp',
        ftpUrl,
        username,
        password,
        folder
      )
      setFolderTree(folderStructure)
    } catch (error) {
      console.error('Error connecting to FTP:', error)
    }
  }

  const onClickConvert = () => {
    // Funzione ricorsiva per filtrare i file selezionati
    const findSelectedFiles = (nodes) => {
      let selectedFiles = []

      for (const node of nodes) {
        // Se il nodo è un file e è selezionato, aggiungilo all'array
        if (node.type === 'file' && node.selected) {
          selectedFiles.push(node)
        }

        // Se il nodo ha figli, chiamare ricorsivamente la funzione su di essi
        if (node.children) {
          selectedFiles = selectedFiles.concat(findSelectedFiles(node.children))
        }
      }

      return selectedFiles
    }

    // Trova i file selezionati dalla cartella
    const selectedFiles = findSelectedFiles(folderTree)

    // Fai il console log dei file selezionati
    console.log('Selected files:', selectedFiles)
  }

  return (
    <>
      <input placeholder="FTP URL" value={ftpUrl} onChange={(e) => setFtpUrl(e.target.value)} />
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        placeholder="Starting folder"
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
      />
      <button onClick={() => connectToFtp()}>Connect</button>
      {progress}
      {folderTree ? (
        <>
          <button onClick={onClickConvert}>Convert</button>
          <FolderTree folderTree={folderTree} setFolderTree={setFolderTree} />
        </>
      ) : (
        <p>No connection yet.</p>
      )}
    </>
  )
}

export default App

import { useEffect, useState } from 'react'
import { FolderTree } from './components/FolderTree'
import Header from './components/Header'
import { Progress, Spin } from 'antd'

function App(): JSX.Element {
  const [folderTree, setFolderTree] = useState<any>()
  const [progress, setProgress] = useState<any>()
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    window.electron.ipcRenderer.on('progress-update', (event, percentage) => {
      setProgress(percentage)
      if (isLoading) {
        setIsLoading(false)
        setFolderTree(undefined)
      }
    })

    return () => {
      window.electron.ipcRenderer.removeAllListeners('progress-update')
    }
  }, [])

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
      <Header setIsLoading={setIsLoading} setFolderTree={setFolderTree} />
      {!folderTree && (isLoading ? <Spin spinning /> : <Progress percent={progress} />)}
      {folderTree && (
        <>
          <button onClick={onClickConvert}>Convert</button>
          <FolderTree folderTree={folderTree} setFolderTree={setFolderTree} />
        </>
      )}
    </>
  )
}

export default App

import React from 'react'
import { styles } from './Style.module.ts'

type FolderTreeProps = {
  folderTree: any
  setFolderTree: (tree: any) => void
}

export const FolderTree: React.FC<FolderTreeProps> = ({ folderTree, setFolderTree }) => {
  const findNode = (nodes, name) => {
    for (const node of nodes) {
      if (node.name === name) return node // Modifica qui se utilizzi un identificatore diverso
      const childNode = findNode(node.children || [], name)
      if (childNode) return childNode
    }
    return null // Se il nodo non è trovato
  }

  const onChangeResolution = (event, node) => {
    const newResolution = event.target.value

    // Funzione ricorsiva per aggiornare la risoluzione del nodo e dei suoi figli
    const updateResolution = (currentNode) => {
      currentNode.resolution = newResolution
      if (currentNode.children) {
        currentNode.children.forEach(updateResolution)
      }
    }

    // Aggiorna il nodo selezionato e i suoi figli
    const updatedTree = [...folderTree] // Crea una copia dell'albero
    const nodeToUpdate = findNode(updatedTree, node.name) // Trova il nodo da aggiornare
    if (nodeToUpdate) {
      updateResolution(nodeToUpdate)
      setFolderTree(updatedTree) // Aggiorna lo stato dell'albero
    }
  }

  const onChangeSelection = (event, node) => {
    const isSelected = event.target.checked

    // Funzione ricorsiva per aggiornare la selezione del nodo e dei suoi figli
    const updateSelection = (currentNode) => {
      currentNode.selected = isSelected
      if (currentNode.children) {
        currentNode.children.forEach(updateSelection)
      }
    }

    // Aggiorna il nodo selezionato e i suoi figli
    const updatedTree = [...folderTree] // Crea una copia dell'albero
    const nodeToUpdate = findNode(updatedTree, node.name) // Trova il nodo da aggiornare
    if (nodeToUpdate) {
      updateSelection(nodeToUpdate)
      setFolderTree(updatedTree) // Aggiorna lo stato dell'albero
    }
  }

  const renderTree = (nodes: any, depth = 0) => (
    <>
      {nodes.map((node: any, index: number) => (
        <>
          <div key={index} style={{ ...styles.item, marginLeft: `${depth * 20}px` }}>
            <input
              onChange={(event) => onChangeSelection(event, node)}
              type="checkbox"
              checked={node.selected}
            />
            <span>{node.name}</span>
            <select
              value={node.resolution}
              style={{ marginLeft: 'auto' }}
              onChange={(event) => onChangeResolution(event, node)}
            >
              <option value={1080}>1080p</option>
              <option value={720}>720p</option>
            </select>
          </div>
          <>
            {node.children && node.children.length > 0 ? (
              <div key={`children-${index}`}>{renderTree(node.children, depth + 1)}</div>
            ) : null}
          </>
        </>
      ))}
    </>
  )

  return <div style={styles.container}>{renderTree(folderTree)}</div>
}

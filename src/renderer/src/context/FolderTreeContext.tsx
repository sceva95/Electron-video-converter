import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import { FolderTreeNode } from '../../../utils/type'

interface FolderTreeContextType {
  folderTree: FolderTreeNode[]
  selectedItems: Omit<FolderTreeNode, 'children'>[]
  flatFolderTree: Omit<FolderTreeNode, 'children'>[]
  setFolderTree: React.Dispatch<React.SetStateAction<FolderTreeNode[]>>
}

const FolderTreeContext = createContext<FolderTreeContextType | undefined>(undefined)

interface FolderTreeProviderProps {
  children: ReactNode
}

export const FolderTreeProvider: React.FC<FolderTreeProviderProps> = ({ children }) => {
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([])

  const flatFolderTree = useMemo(() => {
    const currentTree = [...folderTree]

    const getFlat = (elements) => {
      let flatTree: any = []

      elements.forEach((element) => {
        if (element?.type !== 'directory' && element?.isVideo) {
          flatTree.push(element)
        }

        if (element?.children && element.children.length > 0) {
          flatTree = flatTree.concat(getFlat(element.children))
        }
      })

      return flatTree
    }

    return getFlat(currentTree)
  }, [folderTree])

  const selectedItems: Omit<FolderTreeNode, 'children'>[] = useMemo(() => {
    const currentTree = [...folderTree]

    const getSelectedElements = (elements) => {
      let selectedElements: any = []

      elements.forEach((element) => {
        if (element?.selected && element?.type !== 'directory') {
          selectedElements.push(element)
        }

        if (element?.children && element.children.length > 0) {
          selectedElements = selectedElements.concat(getSelectedElements(element.children))
        }
      })

      return selectedElements
    }

    return getSelectedElements(currentTree)
  }, [folderTree])

  return (
    <FolderTreeContext.Provider
      value={{ folderTree, selectedItems, flatFolderTree, setFolderTree }}
    >
      {children}
    </FolderTreeContext.Provider>
  )
}

export const useFolderTree = (): FolderTreeContextType => {
  const context = useContext(FolderTreeContext)
  if (context === undefined) {
    throw new Error("useFolderTree deve essere usato all'interno di FolderTreeProvider")
  }
  return context
}

import React from 'react'
import { FolderTree } from '../FolderTree'

type FTPContentProps = {
  listVisualization: string
  isLoading: boolean
}

const FTPContent: React.FC<FTPContentProps> = ({ isLoading, listVisualization }) => {
  return (
    <div style={{ overflowY: 'auto', minHeight: '40vh' }}>
      <FolderTree listVisualization={listVisualization} isLoading={isLoading} />
    </div>
  )
}

export default FTPContent

import React, { useState } from 'react'
import { Button, Input, Segmented } from 'antd'
import FolderViewer from '../FolderViewer'

type HeaderProps = {
  setFolderTree: (tree: any) => void
  setIsLoading: (value: boolean) => void
}

const Header: React.FC<HeaderProps> = ({ setFolderTree, setIsLoading }) => {
  const options = ['FTP', 'Folder']

  const [ftpUrl, setFtpUrl] = useState<string>('192.168.1.64')
  const [folder, setFolder] = useState<string>('/downloads')
  const [username, setUsername] = useState<string>('dietpi')
  const [password, setPassword] = useState<string>('plasma')
  const [currentView, setCurrentView] = useState(options[0])

  const connectToFtp = async () => {
    setIsLoading(true)
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
      setIsLoading(false)
      console.error('Error connecting to FTP:', error)
    }
  }

  const getCurrentView = (): React.ReactNode => {
    switch (currentView) {
      //FTP
      case options[0]: {
        return (
          <>
            <Input
              placeholder="FTP URL"
              value={ftpUrl}
              onChange={(e) => setFtpUrl(e.target.value)}
            />
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              placeholder="Starting folder"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
            <Button onClick={() => connectToFtp()}>Connect</Button>
          </>
        )
      }
      //Folder
      case options[1]: {
        return <FolderViewer />
      }

      default:
        return <></>
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <Segmented onChange={setCurrentView} options={options} block />
      {getCurrentView()}
    </div>
  )
}

export default Header

import { Button, Flex, Input, Progress, Space } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { useFolderTree } from '../../context/FolderTreeContext'
import Typography from 'antd/es/typography/Typography'
import { formatTime } from '../../utils'

type FooterContentProps = {
  isLoading: boolean
  onClickConvert: (localFolder: string) => void
}

const FooterContent: React.FC<FooterContentProps> = ({ isLoading, onClickConvert }) => {
  const { selectedItems } = useFolderTree()

  const intervalRef = useRef<any>(null)

  const [localFolder, setLocalFolder] = useState<string>('')
  const [progress, setProgress] = useState<{ percentage?: number; estimatedTimeLeft?: number }>({
    percentage: 0,
    estimatedTimeLeft: 0
  })

  useEffect(() => {
    const handleProgressUpdate = (_, value) => {
      setProgress(value)

      // Se `estimatedTimeLeft` è diverso da 0, avvia l'intervallo se non è già attivo
      if (value.estimatedTimeLeft > 0 && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setProgress((prev) => ({
            ...prev,
            estimatedTimeLeft: Math.max((prev?.estimatedTimeLeft || 0) - 1, 0)
          }))
        }, 1000)
      }
    }

    // Ascolta l'evento di aggiornamento del progresso
    window.electron.ipcRenderer.on('progress-update', handleProgressUpdate)

    return () => {
      window.electron.ipcRenderer.removeListener('progress-update', handleProgressUpdate)

      // Pulisci l'intervallo al termine del componente o quando viene rimossa la sottoscrizione
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  const selectFolder = async () => {
    const fileList = await window.api.selectFolder(localFolder)

    setLocalFolder(fileList)
  }

  return (
    <Flex justify="space-between" gap={32} align="center">
      {isLoading ? (
        <Progress
          percent={progress?.percentage}
          format={() => formatTime(progress?.estimatedTimeLeft)}
        />
      ) : (
        <>
          <Flex align="center" gap={16} style={{ width: '100%' }}>
            <Typography style={{ textWrap: 'nowrap' }}>
              Items to convert: {selectedItems?.length}
            </Typography>
            <Space.Compact style={{ minWidth: '300px' }}>
              <Input
                size="small"
                onChange={(event) => setLocalFolder(event.target.value)}
                value={localFolder}
                placeholder="Local folder"
              />
              <Button
                size="small"
                onClick={() => selectFolder()}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentcolor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M245,110.64A16,16,0,0,0,232,104H216V88a16,16,0,0,0-16-16H130.67L102.94,51.2a16.14,16.14,0,0,0-9.6-3.2H40A16,16,0,0,0,24,64V208h0a8,8,0,0,0,8,8H211.1a8,8,0,0,0,7.59-5.47l28.49-85.47A16.05,16.05,0,0,0,245,110.64ZM93.34,64,123.2,86.4A8,8,0,0,0,128,88h72v16H69.77a16,16,0,0,0-15.18,10.94L40,158.7V64Zm112,136H43.1l26.67-80H232Z"></path>
                  </svg>
                }
                type="default"
              ></Button>
            </Space.Compact>
          </Flex>
          <Flex justify="flex-end">
            <Button
              disabled={!selectedItems?.length || selectedItems.length <= 0 || !localFolder}
              onClick={() => (localFolder ? onClickConvert(localFolder) : undefined)}
              type="primary"
              size="small"
            >
              Convert
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  )
}

export default FooterContent

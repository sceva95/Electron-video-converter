import { useState } from 'react'
import Header from './components/Header'
import { Flex, Layout, Radio, RadioChangeEvent, theme } from 'antd'
import FTPContent from './components/FTPContent'
import FooterContent from './components/FooterContent'
import { useFolderTree } from './context/FolderTreeContext'
import WaitingModal from './components/WaitingModal'
const { useToken } = theme

const { Header: AntHeader, Content, Footer } = Layout

function App(): JSX.Element {
  const { selectedItems, setFolderTree } = useFolderTree()
  const { token } = useToken()
  const [isLoading, setIsLoading] = useState(false)
  const [value, setValue] = useState('tree')
  const [visible, setVisible] = useState(false)
  const onSubmit = async (form, type: string) => {
    setIsLoading(true)
    setVisible(true)
    if (type === 'FTP') {
      try {
        const folderStructure = await window.api.connectToFtp(
          form.url,
          form.username,
          form.password,
          form.folder
        )
        setFolderTree(folderStructure)
      } catch (error) {
        setIsLoading(false)
        console.error('Error connecting to FTP:', error)
      }
    }

    setIsLoading(false)
    setVisible(false)
  }

  const handleConvert = async (localFolder: string) => {
    selectedItems.forEach(async (el) => {
      try {
        await window.api.convertFile(el.path, el.path, localFolder)
      } catch (error) {
        console.log(error)
      }
    })
  }

  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value)
  }

  return (
    <Layout
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        width: '100%',
        height: '100vh'
      }}
    >
      <AntHeader style={{ height: '120px', display: 'flex', alignItems: 'center' }}>
        <Header onSubmit={onSubmit} isLoading={isLoading} />
      </AntHeader>
      <Content
        style={{ padding: token.padding, maxWidth: '100vw', maxHeight: 'calc(100vh - 170px)' }}
      >
        <Flex vertical gap={16} style={{ height: '100%' }}>
          <Radio.Group onChange={onChange} value={value}>
            <Radio.Button value={'tree'}>Tree</Radio.Button>
            <Radio.Button value={'flat'}>List</Radio.Button>
          </Radio.Group>
          <FTPContent listVisualization={value} isLoading={isLoading} />
        </Flex>
      </Content>
      <Footer>
        <FooterContent isLoading={isLoading} onClickConvert={handleConvert} />
      </Footer>
      <WaitingModal visible={visible} onCancel={() => setVisible(false)} />
    </Layout>
  )
}

export default App

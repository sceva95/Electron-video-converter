import React, { useEffect, useState } from 'react'
import { Button, Dropdown, Flex, Form, Input, MenuProps, Segmented, Space, theme } from 'antd'
import { Connection } from '@/src/utils/type'

type HeaderProps = {
  isLoading: boolean
  onSubmit: (values, type) => void
}

const Header: React.FC<HeaderProps> = ({ isLoading, onSubmit }) => {
  const [form] = Form.useForm()
  const { useToken } = theme
  const { token } = useToken()
  const options = ['FTP', 'Folder']

  const [currentView, setCurrentView] = useState(options[0])
  const [connections, setConnections] = useState<Connection[]>([])
  const [localFolder, setLocalFolder] = useState<string>('')

  useEffect(() => {
    getConnections()
  }, [])

  const getConnections = async () => {
    const connectionsStored = await window.api.getConnections()
    setConnections(connectionsStored)
  }

  const selectFolder = async () => {
    const fileList = await window.api.selectFolder(localFolder)

    setLocalFolder(fileList)
  }

  const getCurrentView = (): React.ReactNode => {
    switch (currentView) {
      //FTP
      case options[0]: {
        const handleOnClickMenu: MenuProps['onClick'] = async (e) => {
          const item = connections.find((el) => `${el.username}-${el.password}-${el.url}` === e.key)

          if (item)
            form.setFieldsValue({
              url: item.url,
              username: item.username,
              password: item.password,
              folder: item.folder
            })
        }

        return (
          <Form
            onFinish={(values) => onSubmit(values, 'FTP')}
            disabled={isLoading}
            layout={'inline'}
            form={form}
            style={{ width: '100%' }}
          >
            <Form.Item name="url">
              <Input size="small" placeholder="FTP URL" />
            </Form.Item>
            <Form.Item name="username">
              <Input size="small" placeholder="Username" />
            </Form.Item>

            <Form.Item name="password">
              <Input size="small" type="password" placeholder="Password" />
            </Form.Item>

            <Form.Item name="folder">
              <Input size="small" placeholder="Starting folder" />
            </Form.Item>
            <Form.Item>
              <Dropdown.Button
                size="small"
                loading={isLoading}
                type="primary"
                htmlType="submit"
                trigger={['click']}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentcolor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                  </svg>
                }
                menu={{
                  items: connections.map((el) => ({
                    label: `${el.username}@${el.url}`,
                    key: `${el.username}-${el.password}-${el.url}`
                  })),
                  onClick: handleOnClickMenu,
                  onMouseEnter: getConnections
                }}
              >
                Connect
              </Dropdown.Button>
            </Form.Item>
          </Form>
        )
      }
      //Folder
      case options[1]: {
        return (
          <Flex gap={16} style={{ minWidth: '890px' }}>
            <Space.Compact style={{ width: '100%' }}>
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

            <Button
              style={{ minWidth: '80px' }}
              size="small"
              loading={isLoading}
              type="primary"
              htmlType="submit"
            >
              Find
            </Button>
          </Flex>
        )
      }

      default:
        return <></>
    }
  }

  return (
    <Flex
      vertical
      gap={12}
      style={{
        padding: '16px',
        backgroundColor: token.colorBgBase,
        borderRadius: token.borderRadius
      }}
    >
      <Segmented
        style={{ minWidth: '400px', maxWidth: 'fit-content' }}
        size="small"
        block
        onChange={setCurrentView}
        options={options}
      />
      {getCurrentView()}
    </Flex>
  )
}

export default Header

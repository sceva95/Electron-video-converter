import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './main.css'
import { ConfigProvider } from 'antd'
import { FolderTreeProvider } from './context/FolderTreeContext'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 4
        }
      }}
    >
      <FolderTreeProvider>
        <App />
      </FolderTreeProvider>
    </ConfigProvider>
  </React.StrictMode>
)

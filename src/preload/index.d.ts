import { ElectronAPI } from '@electron-toolkit/preload'
import { Connection } from '../utils/type'
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      connectToFtp(url: string, username: string, password: string, folder: string): Promise<any>
      convertFile(fileUrl: string, oldFilePath: string, localFolder: string): Promise<any>
      selectFolder(folderPath?: string): Promise<any>
      getConnections(): Promise<Connection[]>
    }
  }
}

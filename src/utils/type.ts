export enum STORE_KEYS {
  CONNECTIONS = 'connections',
  FTPCONNECTION = 'ftpConnection',
  FOLDERS = 'folders'
}

export interface Connection {
  url: string
  username: string
  password: string
  folder?: string
}

export interface FolderTreeNode {
  key: string | number
  name: string
  type?: 'directory' | 'file'
  selected: boolean
  resolution: number
  path: string
  size?: number
  isVideo?: boolean
  children?: FolderTreeNode[]
  duration?: any
  language?: any
  modifiedAt?: any
  rawModifiedAt?: any
  date?: any
  audio?: any
  video?: any
  subtitle?: any
}

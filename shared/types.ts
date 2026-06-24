export interface FileItem {
  id: string
  name: string
  storedName: string
  size: number
  type: string
  uploadTime: string
  expireTime: string | null
}

export interface DirectoryItem {
  name: string
  path: string
}

export interface FileMetadata {
  files: FileItem[]
}

export interface UploadResponse {
  success: boolean
  file?: FileItem
  error?: string
}

export interface FileListResponse {
  success: boolean
  files: FileItem[]
  currentDirectory: string
  directories: DirectoryItem[]
  stats: {
    totalFiles: number
    totalSize: number
  }
}

export interface DirectoryResponse {
  success: boolean
  currentDirectory: string
  directories: DirectoryItem[]
  files: FileItem[]
  error?: string
}

export interface DeleteResponse {
  success: boolean
  message?: string
  error?: string
}

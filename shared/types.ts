export interface FileItem {
  id: string
  name: string
  storedName: string
  size: number
  type: string
  uploadTime: string
  expireTime: string
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
  stats: {
    totalFiles: number
    totalSize: number
  }
}

export interface DeleteResponse {
  success: boolean
  message?: string
  error?: string
}

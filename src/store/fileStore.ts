import { create } from 'zustand'
import type { FileItem, DirectoryItem } from '../../shared/types'

interface FileState {
  files: FileItem[]
  directories: DirectoryItem[]
  currentDirectory: string
  stats: { totalFiles: number; totalSize: number }
  uploading: boolean
  uploadProgress: number
  uploadingFileName: string
  previewFile: FileItem | null
  fetchFiles: () => Promise<void>
  uploadFile: (file: File, expireHours?: number) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  setPreviewFile: (file: FileItem | null) => void
  setDirectory: (dirPath: string) => Promise<void>
  goToParentDirectory: () => Promise<void>
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  directories: [],
  currentDirectory: '',
  stats: { totalFiles: 0, totalSize: 0 },
  uploading: false,
  uploadProgress: 0,
  uploadingFileName: '',
  previewFile: null,

  fetchFiles: async () => {
    try {
      const res = await fetch('/api/files')
      const data = await res.json()
      if (data.success) {
        set({ 
          files: data.files, 
          directories: data.directories || [],
          currentDirectory: data.currentDirectory || '',
          stats: data.stats 
        })
      }
    } catch (error) {
      console.error('Failed to fetch files:', error)
    }
  },

  uploadFile: async (file: File, expireHours?: number) => {
    set({ uploading: true, uploadProgress: 0, uploadingFileName: file.name })

    const formData = new FormData()
    const filenameEncoded = btoa(unescape(encodeURIComponent(file.name)))
    formData.append('filename', filenameEncoded)
    formData.append('file', file)
    if (expireHours) {
      formData.append('expireHours', String(expireHours))
    }

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload')

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          set({ uploadProgress: progress })
        }
      }

      xhr.onload = () => {
        set({ uploading: false, uploadProgress: 0, uploadingFileName: '' })
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          if (data.success) {
            get().fetchFiles()
            resolve()
          } else {
            reject(new Error(data.error || '上传失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      }

      xhr.onerror = () => {
        set({ uploading: false, uploadProgress: 0, uploadingFileName: '' })
        reject(new Error('网络错误'))
      }

      xhr.send(formData)
    })
  },

  deleteFile: async (id: string) => {
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        get().fetchFiles()
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  },

  setPreviewFile: (file: FileItem | null) => {
    set({ previewFile: file })
  },

  setDirectory: async (dirPath: string) => {
    try {
      const res = await fetch('/api/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: dirPath })
      })
      const data = await res.json()
      if (data.success) {
        set({
          files: data.files,
          directories: data.directories,
          currentDirectory: data.currentDirectory,
          stats: {
            totalFiles: data.files.length,
            totalSize: data.files.reduce((sum: number, f: FileItem) => sum + f.size, 0)
          }
        })
      }
    } catch (error) {
      console.error('Failed to set directory:', error)
    }
  },

  goToParentDirectory: async () => {
    const currentDir = get().currentDirectory
    if (!currentDir || currentDir === '/') return
    
    const parentDir = currentDir.substring(0, currentDir.lastIndexOf('/')) || '/'
    await get().setDirectory(parentDir)
  }
}))

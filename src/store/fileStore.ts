import { create } from 'zustand'
import type { FileItem } from '../../shared/types'

interface FileState {
  files: FileItem[]
  stats: { totalFiles: number; totalSize: number }
  uploading: boolean
  uploadProgress: number
  uploadingFileName: string
  previewFile: FileItem | null
  fetchFiles: () => Promise<void>
  uploadFile: (file: File, expireHours?: number) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  setPreviewFile: (file: FileItem | null) => void
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
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
        set({ files: data.files, stats: data.stats })
      }
    } catch (error) {
      console.error('Failed to fetch files:', error)
    }
  },

  uploadFile: async (file: File, expireHours?: number) => {
    set({ uploading: true, uploadProgress: 0, uploadingFileName: file.name })

    const formData = new FormData()
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
  }
}))

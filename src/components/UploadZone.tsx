import { useState, useCallback } from 'react'
import { UploadCloud, FileUp } from 'lucide-react'
import { useFileStore } from '@/store/fileStore'

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const { uploadFile, uploading, uploadProgress, uploadingFileName } = useFileStore()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => {
      uploadFile(file).catch(err => alert(err.message))
    })
  }, [uploadFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      uploadFile(file).catch(err => alert(err.message))
    })
    e.target.value = ''
  }, [uploadFile])

  return (
    <div className="mb-8">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative block cursor-pointer rounded-2xl border-2 border-dashed p-12
          transition-all duration-300 ease-out
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-lg shadow-indigo-200' 
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
          }
          ${uploading ? 'pointer-events-none opacity-80' : ''}
        `}
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center text-center">
          <div className={`
            mb-4 rounded-full p-4 transition-all duration-300
            ${isDragging ? 'bg-indigo-100 scale-110' : 'bg-white'}
          `}>
            {uploading ? (
              <FileUp className="h-12 w-12 text-indigo-500 animate-bounce" />
            ) : (
              <UploadCloud className={`h-12 w-12 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
            )}
          </div>
          
          {uploading ? (
            <div className="w-full max-w-xs">
              <p className="mb-2 text-sm font-medium text-gray-700 truncate">
                正在上传: {uploadingFileName}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <p className="mb-2 text-lg font-semibold text-gray-700">
                点击或拖拽文件到这里上传
              </p>
              <p className="text-sm text-gray-500">
                支持任意文件格式，单文件最大 500MB
              </p>
              <p className="mt-2 text-xs text-gray-400">
                文件默认 24 小时后自动删除
              </p>
            </>
          )}
        </div>
      </label>
    </div>
  )
}

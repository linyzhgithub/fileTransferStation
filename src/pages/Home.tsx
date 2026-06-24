import { useEffect, useState } from 'react'
import { HardDrive, FileText, Inbox, FolderOpen, RefreshCw } from 'lucide-react'
import UploadZone from '@/components/UploadZone'
import FileItem from '@/components/FileItem'
import PreviewModal from '@/components/PreviewModal'
import { DirectoryPicker } from '@/components/DirectoryPicker'
import { useFileStore } from '@/store/fileStore'
import { formatFileSize } from '@/utils/format'

export default function Home() {
  const { files, stats, currentDirectory, fetchFiles, directories } = useFileStore()
  const [showDirectoryPicker, setShowDirectoryPicker] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchFiles()
    const interval = setInterval(fetchFiles, 30000)
    return () => clearInterval(interval)
  }, [fetchFiles])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchFiles()
    setIsRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-16">
        <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-4 inline-flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-200">
                <HardDrive className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            文件中转站
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            无需登录 · 即时传输 · 跨设备共享
          </p>
        </div>

        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <button
            onClick={() => setShowDirectoryPicker(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
              <FolderOpen className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">当前目录</p>
              <p className="font-medium text-gray-800 truncate font-mono text-sm">{currentDirectory || '加载中...'}</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <FileText className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalFiles}</p>
                <p className="text-xs text-gray-500">文件数量</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <HardDrive className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{formatFileSize(stats.totalSize)}</p>
                <p className="text-xs text-gray-500">已用空间</p>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <UploadZone />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          {files.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700">文件列表</h2>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-600 transition-colors"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  刷新
                </button>
              </div>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div 
                    key={file.id} 
                    className="animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    <FileItem file={file} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-6">
                <Inbox className="h-12 w-12 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">暂无文件</p>
              <p className="mt-1 text-sm text-gray-400">上传文件开始跨设备传输</p>
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-xs text-gray-400 animate-in fade-in duration-700 delay-700">
          <p>上传的文件将在 24 小时后自动删除 · 目录中已有文件不会自动删除</p>
        </div>
      </div>

      <PreviewModal />
      
      {showDirectoryPicker && (
        <DirectoryPicker onClose={() => setShowDirectoryPicker(false)} />
      )}
    </div>
  )
}

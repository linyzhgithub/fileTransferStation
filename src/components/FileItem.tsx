import { Download, Trash2, QrCode, Copy, Check, Eye } from 'lucide-react'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { FileItem as FileItemType } from '../../shared/types'
import { formatFileSize, formatTime, getTimeRemaining, getFileIcon, isImage } from '@/utils/format'
import { useFileStore } from '@/store/fileStore'

interface FileItemProps {
  file: FileItemType
}

export default function FileItem({ file }: FileItemProps) {
  const { deleteFile, setPreviewFile } = useFileStore()
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)

  const handleDownload = () => {
    window.open(`/api/download/${file.id}`, '_blank')
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/api/download/${file.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    if (confirm(`确定要删除文件 "${file.name}" 吗？`)) {
      deleteFile(file.id)
    }
  }

  const handlePreview = () => {
    if (isImage(file.type)) {
      setPreviewFile(file)
    }
  }

  return (
    <div className="group relative flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-gray-100">
      <div 
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-3xl cursor-pointer hover:scale-105 transition-transform"
        onClick={handlePreview}
      >
        {isImage(file.type) ? (
          <img 
            src={`/api/preview/${file.id}`} 
            alt={file.name}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          getFileIcon(file.type)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-800" title={file.name}>
          {file.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span>{formatFileSize(file.size)}</span>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span>{formatTime(file.uploadTime)}</span>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span className="text-amber-600">{getTimeRemaining(file.expireTime)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isImage(file.type) && (
          <button
            onClick={handlePreview}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            title="预览"
          >
            <Eye className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => setShowQr(!showQr)}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          title="二维码"
        >
          <QrCode className="h-5 w-5" />
        </button>
        <button
          onClick={handleCopyLink}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          title="复制链接"
        >
          {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
        </button>
        <button
          onClick={handleDownload}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          title="下载"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          onClick={handleDelete}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
          title="删除"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {showQr && (
        <div className="absolute right-4 top-full z-10 mt-2 rounded-xl bg-white p-4 shadow-xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col items-center">
            <div className="p-2 bg-white rounded-lg">
              <QRCodeSVG 
                value={`${window.location.origin}/api/download/${file.id}`}
                size={130}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">扫码下载文件</p>
          </div>
        </div>
      )}
    </div>
  )
}

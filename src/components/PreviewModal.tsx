import { X, Download } from 'lucide-react'
import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useFileStore } from '@/store/fileStore'
import { formatFileSize, formatTime } from '@/utils/format'

export default function PreviewModal() {
  const { previewFile, setPreviewFile } = useFileStore()

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewFile(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [setPreviewFile])

  if (!previewFile) return null

  const downloadUrl = `${window.location.origin}/api/download/${previewFile.id}`

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => setPreviewFile(null)}
    >
      <div 
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 truncate pr-8" title={previewFile.name}>
              {previewFile.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatFileSize(previewFile.size)} · {formatTime(previewFile.uploadTime)}
            </p>
          </div>
          <button
            onClick={() => setPreviewFile(null)}
            className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl p-4 min-h-[300px]">
              <img 
                src={`/api/preview/${previewFile.id}`}
                alt={previewFile.name}
                className="max-w-full max-h-[500px] rounded-lg object-contain shadow-md"
              />
            </div>
            
            <div className="md:w-48 flex flex-col items-center justify-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                <QRCodeSVG 
                  value={downloadUrl}
                  size={150}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">扫码下载到手机</p>
              <a
                href={`/api/download/${previewFile.id}`}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4" />
                下载文件
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

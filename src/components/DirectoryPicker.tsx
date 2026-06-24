import { useState, useRef, useEffect } from 'react'
import { useFileStore } from '../store/fileStore'
import { clsx } from 'clsx'

interface DirectoryPickerProps {
  onClose?: () => void
}

export function DirectoryPicker({ onClose }: DirectoryPickerProps) {
  const { currentDirectory, setDirectory, goToParentDirectory, directories } = useFileStore()
  const [inputPath, setInputPath] = useState(currentDirectory)
  const [showInput, setShowInput] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputPath(currentDirectory)
  }, [currentDirectory])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleGoToPath = () => {
    if (inputPath.trim()) {
      setDirectory(inputPath.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPath()
    }
  }

  const pathSegments = currentDirectory.split('/').filter(Boolean)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">选择目录</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={goToParentDirectory}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="上级目录"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              {showInput ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={inputPath}
                    onChange={(e) => setInputPath(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    placeholder="/path/to/directory"
                    autoFocus
                  />
                  <button
                    onClick={handleGoToPath}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    跳转
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowInput(true)}
                  className="flex-1 px-4 py-2 bg-gray-50 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors truncate font-mono text-sm"
                  title={currentDirectory}
                >
                  {currentDirectory}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
              <button
                onClick={() => setDirectory('/')}
                className="px-2 py-1 hover:bg-blue-50 rounded text-blue-600 transition-colors"
              >
                /
              </button>
              {pathSegments.map((segment, index) => (
                <span key={index} className="flex items-center gap-1">
                  <span className="text-gray-300">/</span>
                  <button
                    onClick={() => setDirectory('/' + pathSegments.slice(0, index + 1).join('/'))}
                    className="px-2 py-1 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                  >
                    {segment}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-3 px-2">子目录</p>
          {directories.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-sm">没有子目录</p>
            </div>
          ) : (
            <div className="space-y-1">
              {directories.map((dir) => (
                <button
                  key={dir.path}
                  onClick={() => setDirectory(dir.path)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group',
                    'hover:bg-blue-50 hover:shadow-sm'
                  )}
                >
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-gray-800 truncate">{dir.name}</p>
                    <p className="text-xs text-gray-400 truncate font-mono">{dir.path}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

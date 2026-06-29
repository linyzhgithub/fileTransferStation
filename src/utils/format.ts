export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}

export function getTimeRemaining(expireTime: string | null): string {
  if (!expireTime) return '永久'
  const expire = new Date(expireTime)
  const now = new Date()
  const diff = expire.getTime() - now.getTime()
  
  if (diff <= 0) return '已过期'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    return `${days}天后过期`
  }
  if (hours > 0) return `${hours}小时后过期`
  return `${minutes}分钟后过期`
}

export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️'
  if (type.startsWith('video/')) return '🎬'
  if (type.startsWith('audio/')) return '🎵'
  if (type.includes('pdf')) return '📄'
  if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gz')) return '📦'
  if (type.includes('word') || type.includes('doc')) return '📝'
  if (type.includes('excel') || type.includes('sheet') || type.includes('xls')) return '📊'
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return '📽️'
  if (type.includes('text')) return '📃'
  if (type.includes('json') || type.includes('javascript') || type.includes('typescript') || type.includes('python') || type.includes('java') || type.includes('html') || type.includes('css')) return '💻'
  return '📁'
}

export function isImage(type: string): boolean {
  return type.startsWith('image/')
}

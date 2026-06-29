import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import type { FileItem } from '../../shared/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_DIR = path.resolve(__dirname, '../../')
const DEFAULT_UPLOADS_DIR = path.resolve(__dirname, '../../uploads')
const METADATA_DIR = path.resolve(__dirname, '../../metadata')
const METADATA_FILE = path.join(METADATA_DIR, 'files.json')

const DEFAULT_EXPIRE_HOURS = 24
const CLEANUP_INTERVAL = 60 * 60 * 1000

interface UploadedFileMeta {
  id: string
  name: string
  storedName: string
  size: number
  type: string
  uploadTime: string
  expireTime: string
  directory: string
}

interface MetadataStore {
  files: UploadedFileMeta[]
  currentDirectory: string
}

async function ensureDirectories() {
  try {
    await fs.access(DEFAULT_UPLOADS_DIR)
  } catch {
    await fs.mkdir(DEFAULT_UPLOADS_DIR, { recursive: true })
  }
  try {
    await fs.access(METADATA_DIR)
  } catch {
    await fs.mkdir(METADATA_DIR, { recursive: true })
  }
  try {
    await fs.access(METADATA_FILE)
  } catch {
    const initialMeta: MetadataStore = {
      files: [],
      currentDirectory: DEFAULT_UPLOADS_DIR
    }
    await fs.writeFile(METADATA_FILE, JSON.stringify(initialMeta, null, 2))
  }
}

async function readMetadata(): Promise<MetadataStore> {
  await ensureDirectories()
  const data = await fs.readFile(METADATA_FILE, 'utf-8')
  const meta = JSON.parse(data)
  if (!meta.currentDirectory) {
    meta.currentDirectory = DEFAULT_UPLOADS_DIR
  }
  if (!meta.files) {
    meta.files = []
  } else {
    let hasChanges = false
    for (const file of meta.files) {
      if (!file.directory) {
        file.directory = DEFAULT_UPLOADS_DIR
        hasChanges = true
      }
    }
    if (hasChanges) {
      await writeMetadata(meta)
    }
  }
  return meta
}

async function writeMetadata(metadata: MetadataStore): Promise<void> {
  await ensureDirectories()
  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2))
}

export async function getCurrentDirectory(): Promise<string> {
  const meta = await readMetadata()
  return meta.currentDirectory
}

export async function setCurrentDirectory(dirPath: string): Promise<string> {
  const resolvedPath = path.resolve(dirPath)
  try {
    const stat = await fs.stat(resolvedPath)
    if (!stat.isDirectory()) {
      throw new Error('路径不是目录')
    }
  } catch {
    await fs.mkdir(resolvedPath, { recursive: true })
  }
  
  const meta = await readMetadata()
  meta.currentDirectory = resolvedPath
  await writeMetadata(meta)
  return resolvedPath
}

function getSafePath(dirPath: string): boolean {
  const normalized = path.resolve(dirPath)
  return normalized.startsWith(path.resolve(BASE_DIR)) || 
         normalized.startsWith('/tmp') ||
         normalized.startsWith('/home') ||
         normalized.startsWith('/root') ||
         normalized.startsWith('/data') ||
         normalized.startsWith('/mnt') ||
         normalized.startsWith('/workspace')
}

export async function listDirectory(dirPath: string): Promise<{
  directories: { name: string; path: string }[]
  files: FileItem[]
}> {
  const resolvedPath = path.resolve(dirPath)
  
  const entries = await fs.readdir(resolvedPath, { withFileTypes: true })
  
  const directories: { name: string; path: string }[] = []
  const fileNames: string[] = []
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      directories.push({
        name: entry.name,
        path: path.join(resolvedPath, entry.name)
      })
    } else if (entry.isFile()) {
      fileNames.push(entry.name)
    }
  }
  
  const meta = await readMetadata()
  const dirFiles = meta.files.filter(f => {
    return f.directory === resolvedPath
  })
  
  const fileItems: FileItem[] = []
  const processedNames = new Set<string>()
  
  for (const fileMeta of dirFiles) {
    processedNames.add(fileMeta.storedName)
    fileItems.push({
      id: fileMeta.id,
      name: fileMeta.name,
      storedName: fileMeta.storedName,
      size: fileMeta.size,
      type: fileMeta.type,
      uploadTime: fileMeta.uploadTime,
      expireTime: fileMeta.expireTime
    })
  }
  
  for (const fileName of fileNames) {
    if (processedNames.has(fileName)) continue
    
    const filePath = path.join(resolvedPath, fileName)
    try {
      const stat = await fs.stat(filePath)
      const ext = path.extname(fileName).toLowerCase()
      let mimeType = 'application/octet-stream'
      
      const mimeTypes: Record<string, string> = {
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.wav': 'audio/wav',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.doc': 'application/msword',
        '.xls': 'application/vnd.ms-excel',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.epub': 'application/epub+zip',
        '.md': 'text/markdown',
        '.csv': 'text/csv'
      }
      
      if (mimeTypes[ext]) {
        mimeType = mimeTypes[ext]
      }
      
      fileItems.push({
        id: `local_${Buffer.from(filePath).toString('base64').replace(/=/g, '')}`,
        name: fileName,
        storedName: fileName,
        size: stat.size,
        type: mimeType,
        uploadTime: stat.mtime.toISOString(),
        expireTime: null
      })
    } catch {
    }
  }
  
  return {
    directories: directories.sort((a, b) => a.name.localeCompare(b.name)),
    files: fileItems.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())
  }
}

export async function saveFile(
  originalName: string,
  buffer: Buffer,
  mimeType: string,
  expireHours?: number
): Promise<FileItem> {
  await ensureDirectories()
  
  const currentDir = await getCurrentDirectory()
  try {
    await fs.access(currentDir)
  } catch {
    await fs.mkdir(currentDir, { recursive: true })
  }
  
  const id = uuidv4()
  const ext = path.extname(originalName)
  const storedName = `${id}${ext}`
  const filePath = path.join(currentDir, storedName)
  
  await fs.writeFile(filePath, buffer)
  
  const hours = expireHours || DEFAULT_EXPIRE_HOURS
  const now = new Date()
  const expireTime = new Date(now.getTime() + hours * 60 * 60 * 1000)
  
  const fileMeta: UploadedFileMeta = {
    id,
    name: originalName,
    storedName,
    size: buffer.length,
    type: mimeType,
    uploadTime: now.toISOString(),
    expireTime: expireTime.toISOString(),
    directory: currentDir
  }
  
  const meta = await readMetadata()
  meta.files.push(fileMeta)
  await writeMetadata(meta)
  
  return {
    id,
    name: originalName,
    storedName,
    size: buffer.length,
    type: mimeType,
    uploadTime: now.toISOString(),
    expireTime: expireTime.toISOString()
  }
}

export async function getFileList(): Promise<{ 
  files: FileItem[]
  stats: { totalFiles: number, totalSize: number }
}> {
  const currentDir = await getCurrentDirectory()
  const result = await listDirectory(currentDir)
  
  const totalSize = result.files.reduce((sum, f) => sum + f.size, 0)
  
  return {
    files: result.files,
    stats: {
      totalFiles: result.files.length,
      totalSize
    }
  }
}

export async function getFileById(id: string): Promise<{ file: FileItem | null; path: string; isLocal: boolean }> {
  if (id.startsWith('local_')) {
    const encodedPath = id.replace('local_', '')
    const filePath = Buffer.from(encodedPath, 'base64').toString('utf-8')
    const currentDir = await getCurrentDirectory()
    
    const resolvedPath = path.resolve(filePath)
    const dirFiles = await listDirectory(currentDir)
    const found = dirFiles.files.find(f => f.id === id)
    
    if (found) {
      return { file: found, path: resolvedPath, isLocal: true }
    }
    return { file: null, path: '', isLocal: false }
  }
  
  const meta = await readMetadata()
  const fileMeta = meta.files.find(f => f.id === id)
  
  if (!fileMeta) {
    return { file: null, path: '', isLocal: false }
  }
  
  return {
    file: {
      id: fileMeta.id,
      name: fileMeta.name,
      storedName: fileMeta.storedName,
      size: fileMeta.size,
      type: fileMeta.type,
      uploadTime: fileMeta.uploadTime,
      expireTime: fileMeta.expireTime
    },
    path: path.join(fileMeta.directory, fileMeta.storedName),
    isLocal: false
  }
}

export async function getFilePath(fileItem: FileItem): Promise<string> {
  const result = await getFileById(fileItem.id)
  return result.path
}

export async function deleteFile(id: string): Promise<boolean> {
  const result = await getFileById(id)
  
  if (!result.file) {
    return false
  }
  
  try {
    await fs.unlink(result.path)
  } catch {
  }
  
  if (!result.isLocal) {
    const meta = await readMetadata()
    meta.files = meta.files.filter(f => f.id !== id)
    await writeMetadata(meta)
  }
  
  return true
}

export async function cleanupExpiredFiles(): Promise<number> {
  const meta = await readMetadata()
  const now = Date.now()
  
  const expiredFiles = meta.files.filter(f => new Date(f.expireTime).getTime() <= now)
  const validFiles = meta.files.filter(f => new Date(f.expireTime).getTime() > now)
  
  for (const file of expiredFiles) {
    const filePath = path.join(file.directory, file.storedName)
    try {
      await fs.unlink(filePath)
    } catch {
    }
  }
  
  meta.files = validFiles
  await writeMetadata(meta)
  
  return expiredFiles.length
}

export function startCleanupTask() {
  cleanupExpiredFiles().then(count => {
    if (count > 0) {
      console.log(`Cleaned up ${count} expired files`)
    }
  })
  
  setInterval(() => {
    cleanupExpiredFiles().then(count => {
      if (count > 0) {
        console.log(`Cleaned up ${count} expired files`)
      }
    })
  }, CLEANUP_INTERVAL)
}

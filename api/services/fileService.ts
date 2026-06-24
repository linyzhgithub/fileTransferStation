import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import type { FileItem, FileMetadata } from '../../shared/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads')
const METADATA_DIR = path.resolve(__dirname, '../../metadata')
const METADATA_FILE = path.join(METADATA_DIR, 'files.json')

const DEFAULT_EXPIRE_HOURS = 24
const CLEANUP_INTERVAL = 60 * 60 * 1000

async function ensureDirectories() {
  try {
    await fs.access(UPLOADS_DIR)
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
  }
  try {
    await fs.access(METADATA_DIR)
  } catch {
    await fs.mkdir(METADATA_DIR, { recursive: true })
  }
  try {
    await fs.access(METADATA_FILE)
  } catch {
    await fs.writeFile(METADATA_FILE, JSON.stringify({ files: [] }, null, 2))
  }
}

async function readMetadata(): Promise<FileMetadata> {
  await ensureDirectories()
  const data = await fs.readFile(METADATA_FILE, 'utf-8')
  return JSON.parse(data)
}

async function writeMetadata(metadata: FileMetadata): Promise<void> {
  await ensureDirectories()
  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2))
}

export async function saveFile(
  originalName: string,
  buffer: Buffer,
  mimeType: string,
  expireHours?: number
): Promise<FileItem> {
  await ensureDirectories()
  
  const id = uuidv4()
  const ext = path.extname(originalName)
  const storedName = `${id}${ext}`
  const filePath = path.join(UPLOADS_DIR, storedName)
  
  await fs.writeFile(filePath, buffer)
  
  const hours = expireHours || DEFAULT_EXPIRE_HOURS
  const now = new Date()
  const expireTime = new Date(now.getTime() + hours * 60 * 60 * 1000)
  
  const fileItem: FileItem = {
    id,
    name: originalName,
    storedName,
    size: buffer.length,
    type: mimeType,
    uploadTime: now.toISOString(),
    expireTime: expireTime.toISOString()
  }
  
  const metadata = await readMetadata()
  metadata.files.push(fileItem)
  await writeMetadata(metadata)
  
  return fileItem
}

export async function getFileList(): Promise<{ files: FileItem[], stats: { totalFiles: number, totalSize: number } }> {
  const metadata = await readMetadata()
  const now = Date.now()
  
  const validFiles = metadata.files.filter(f => new Date(f.expireTime).getTime() > now)
  
  if (validFiles.length !== metadata.files.length) {
    metadata.files = validFiles
    await writeMetadata(metadata)
  }
  
  const totalSize = validFiles.reduce((sum, f) => sum + f.size, 0)
  
  return {
    files: validFiles.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()),
    stats: {
      totalFiles: validFiles.length,
      totalSize
    }
  }
}

export async function getFileById(id: string): Promise<FileItem | null> {
  const metadata = await readMetadata()
  return metadata.files.find(f => f.id === id) || null
}

export async function getFilePath(fileItem: FileItem): Promise<string> {
  return path.join(UPLOADS_DIR, fileItem.storedName)
}

export async function deleteFile(id: string): Promise<boolean> {
  const metadata = await readMetadata()
  const fileIndex = metadata.files.findIndex(f => f.id === id)
  
  if (fileIndex === -1) {
    return false
  }
  
  const fileItem = metadata.files[fileIndex]
  const filePath = path.join(UPLOADS_DIR, fileItem.storedName)
  
  try {
    await fs.unlink(filePath)
  } catch {
  }
  
  metadata.files.splice(fileIndex, 1)
  await writeMetadata(metadata)
  
  return true
}

export async function cleanupExpiredFiles(): Promise<number> {
  const metadata = await readMetadata()
  const now = Date.now()
  
  const expiredFiles = metadata.files.filter(f => new Date(f.expireTime).getTime() <= now)
  const validFiles = metadata.files.filter(f => new Date(f.expireTime).getTime() > now)
  
  for (const file of expiredFiles) {
    const filePath = path.join(UPLOADS_DIR, file.storedName)
    try {
      await fs.unlink(filePath)
    } catch {
    }
  }
  
  metadata.files = validFiles
  await writeMetadata(metadata)
  
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

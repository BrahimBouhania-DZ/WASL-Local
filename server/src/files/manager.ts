import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
const TMP_DIR = path.resolve(process.cwd(), 'tmp')
const META_FILE = path.join(UPLOAD_DIR, '.files_meta.json')

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

export interface FileMetadata {
  id: string
  originalName: string
  savedName: string
  size: number
  uploadedAt: number
  extension: string
  senderDeviceId?: string
  senderName?: string
  targetDeviceIds?: string[] // if empty or undefined, accessible by all paired devices
}

let fileRegistry: Map<string, FileMetadata> = new Map()

function loadMeta() {
  try {
    if (fs.existsSync(META_FILE)) {
      const data = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'))
      fileRegistry = new Map(data.map((item: FileMetadata) => [item.savedName, item]))
    }
  } catch (err) {
    fileRegistry = new Map()
  }
}

function saveMeta() {
  try {
    const list = Array.from(fileRegistry.values())
    fs.writeFileSync(META_FILE, JSON.stringify(list, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to save file metadata:', err)
  }
}

loadMeta()

export function getSafeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const name = crypto.randomUUID() + ext
  return name
}

export function recordFile(
  originalName: string,
  savedName: string,
  size: number,
  senderDeviceId?: string,
  senderName?: string,
  targetDeviceIds?: string[]
): FileMetadata {
  const meta: FileMetadata = {
    id: crypto.randomUUID(),
    originalName,
    savedName,
    size,
    uploadedAt: Date.now(),
    extension: path.extname(originalName).toLowerCase(),
    senderDeviceId,
    senderName,
    targetDeviceIds: targetDeviceIds && targetDeviceIds.length > 0 ? targetDeviceIds : undefined
  }
  fileRegistry.set(savedName, meta)
  saveMeta()
  return meta
}

export function getFiles(): FileMetadata[] {
  // Sync with actual files on disk
  const existingFiles = new Set(fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR) : [])
  const list: FileMetadata[] = []

  for (const [savedName, meta] of fileRegistry.entries()) {
    if (existingFiles.has(savedName)) {
      list.push(meta)
    } else {
      fileRegistry.delete(savedName)
    }
  }

  // Also include any files not in registry
  for (const file of existingFiles) {
    if (file === '.files_meta.json') continue
    if (!fileRegistry.has(file)) {
      const filePath = path.join(UPLOAD_DIR, file)
      const stat = fs.statSync(filePath)
      const inferredMeta: FileMetadata = {
        id: crypto.randomUUID(),
        originalName: file,
        savedName: file,
        size: stat.size,
        uploadedAt: stat.mtimeMs,
        extension: path.extname(file).toLowerCase()
      }
      fileRegistry.set(file, inferredMeta)
      list.push(inferredMeta)
    }
  }
  return list.sort((a, b) => b.uploadedAt - a.uploadedAt)
}

export function getFileBySavedName(savedName: string): FileMetadata | undefined {
  return fileRegistry.get(savedName)
}

export function deleteFile(savedName: string): boolean {
  if (savedName.includes('..') || savedName.includes('/') || savedName.includes('\\')) {
    return false
  }
  const filePath = path.join(UPLOAD_DIR, savedName)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  fileRegistry.delete(savedName)
  saveMeta()
  return true
}

export function getUploadPath(filename: string): string {
  return path.join(UPLOAD_DIR, filename)
}

export function getTempPath(filename: string): string {
  return path.join(TMP_DIR, filename)
}

export function clearAllFiles(): boolean {
  try {
    for (const [savedName] of fileRegistry.entries()) {
      const filePath = path.join(UPLOAD_DIR, savedName)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    fileRegistry.clear()
    if (fs.existsSync(META_FILE)) {
      fs.unlinkSync(META_FILE)
    }
    return true
  } catch (err) {
    console.error('Failed to clear files:', err)
    return false
  }
}

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

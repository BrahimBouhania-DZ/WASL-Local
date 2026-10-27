import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
const TMP_DIR = path.resolve(process.cwd(), 'tmp')

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

export function getSafeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const name = crypto.randomUUID() + ext
  return name
}

export function getUploadPath(filename: string): string {
  return path.join(UPLOAD_DIR, filename)
}

export function getTempPath(filename: string): string {
  return path.join(TMP_DIR, filename)
}

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

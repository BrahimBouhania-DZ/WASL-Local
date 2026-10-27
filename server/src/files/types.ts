export const ALLOWED_EXTENSIONS = [
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.heic', '.heif',
  // Documents
  '.pdf', '.txt', '.md', '.csv', '.json', '.xml', '.log',
  // Microsoft Office
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // OpenDocument
  '.odt', '.ods', '.odp',
  // Archives
  '.zip', '.7z', '.rar', '.tar', '.gz', '.bz2',
  // Code/Text
  '.js', '.ts', '.py', '.java', '.cpp', '.c', '.html', '.css', '.sql', '.sh',
  // Audio/Video
  '.mp3', '.mp4', '.m4a', '.webm', '.ogg', '.wav'
]

export const BLOCKED_EXTENSIONS = [
  '.exe', '.msi', '.bat', '.cmd', '.ps1',
  '.app', '.dmg', '.pkg', '.deb', '.rpm',
  '.apk', '.bin'
]

export const MAX_FILE_SIZE = Number.MAX_SAFE_INTEGER

export function isAllowedFile(filename: string): { allowed: boolean; reason?: string } {
  const lower = filename.toLowerCase()
  if (lower.includes('..') || lower.includes('/') || lower.includes('\\')) {
    return { allowed: false, reason: 'invalid_path' }
  }
  const ext = lower.substring(lower.lastIndexOf('.'))
  if (!ext || ext === lower) {
    return { allowed: false, reason: 'no_extension' }
  }
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { allowed: false, reason: 'blocked_extension' }
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { allowed: false, reason: 'extension_not_allowed' }
  }
  return { allowed: true }
}

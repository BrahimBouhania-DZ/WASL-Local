/**
 * Utility to accurately detect and format the device brand, model, and platform
 * for clear recognition in local pairing.
 */

export interface DeviceInfo {
  name: string
  type: 'pc' | 'phone'
  brand: string
  os: string
}

export function detectCurrentDevice(): DeviceInfo {
  if (typeof window === 'undefined' || !navigator) {
    return { name: 'Device', type: 'pc', brand: 'Generic', os: 'Unknown' }
  }

  const ua = navigator.userAgent || ''
  const platform = navigator.platform || ''

  let type: 'pc' | 'phone' = 'pc'
  let brand = 'Unknown'
  let os = 'Unknown'

  // Detect OS
  if (/Android/i.test(ua)) {
    type = 'phone'
    os = 'Android'
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    type = 'phone'
    os = 'iOS'
    brand = 'Apple'
  } else if (/Windows/i.test(ua)) {
    type = 'pc'
    os = 'Windows'
  } else if (/Macintosh|Mac OS/i.test(ua)) {
    type = 'pc'
    os = 'macOS'
    brand = 'Apple'
  } else if (/Linux/i.test(ua) || /Linux/i.test(platform)) {
    type = 'pc'
    os = 'Linux'
  }

  // Detect Android Brands & Models
  if (os === 'Android') {
    if (/SM-|Samsung|SCH-|GT-|Galaxy/i.test(ua)) {
      brand = 'Samsung Galaxy'
    } else if (/Redmi|POCO|Xiaomi|MI\s/i.test(ua)) {
      brand = 'Xiaomi'
      if (/Redmi/i.test(ua)) brand = 'Xiaomi Redmi'
      if (/POCO/i.test(ua)) brand = 'Xiaomi POCO'
    } else if (/Huawei|Honor/i.test(ua)) {
      brand = 'Huawei'
    } else if (/Pixel/i.test(ua)) {
      brand = 'Google Pixel'
    } else if (/OnePlus/i.test(ua)) {
      brand = 'OnePlus'
    } else if (/OPPO|CPH/i.test(ua)) {
      brand = 'Oppo'
    } else if (/vivo|V2/i.test(ua)) {
      brand = 'Vivo'
    } else if (/Realme/i.test(ua)) {
      brand = 'Realme'
    } else {
      brand = 'Android Phone'
    }
  }

  // Detect PC Brands/Types
  if (os === 'Linux') {
    brand = 'Linux PC'
  } else if (os === 'Windows') {
    brand = 'Windows PC'
  } else if (os === 'macOS') {
    brand = 'MacBook'
  } else if (os === 'iOS') {
    brand = /iPad/i.test(ua) ? 'Apple iPad' : 'Apple iPhone'
  }

  // Construct a user-friendly recognizable name
  let name = brand
  if (type === 'phone' && !name.includes('Phone') && !name.includes('iPhone') && !name.includes('Galaxy') && !name.includes('Pixel')) {
    name = `${brand} Phone`
  }

  return {
    name,
    type,
    brand,
    os
  }
}

import { seedUnits } from '../data/seedUnits.js'

const KEY = 'vocab-units-v1'

export function loadUnits() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // dữ liệu hỏng -> dùng unit mặc định
  }
  // lần đầu mở app: nạp sẵn unit của khóa học
  return seedUnits()
}

export function saveUnits(units) {
  localStorage.setItem(KEY, JSON.stringify(units))
}

export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)
}

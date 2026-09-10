import { SEED_VERSION, seedUnits, seedUnitUpdates } from '../data/seedUnits.js'

const KEY = 'vocab-units-v1'

export function loadUnits() {
  // khóa cũ của cơ chế cập nhật seed, không dùng nữa
  localStorage.removeItem('vocab-seed-version')

  let units = null
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) units = JSON.parse(raw)
  } catch {
    // dữ liệu hỏng -> dùng unit mặc định
  }
  // lần đầu mở app (hoặc dữ liệu hỏng): nạp sẵn unit của khóa học
  if (!Array.isArray(units)) return seedUnits()
  return mergeSeedAdditions(units)
}

export function saveUnits(units) {
  localStorage.setItem(KEY, JSON.stringify(units))
}

// Khi app được cập nhật thêm từ mới cho unit có sẵn, nối các từ đó vào
// unit tương ứng đã lưu trong trình duyệt (giữ nguyên tiến độ đã học).
// Phiên bản seed đã nối nằm ngay trong unit (`seedVersion`, thiếu = 1),
// nên hàm này thuần túy và gọi lại bao nhiêu lần cũng cho cùng kết quả.
// Từ đã có (trùng id hoặc trùng chữ) thì bỏ qua.
function mergeSeedAdditions(units) {
  const next = [...units]
  for (const seed of seedUnitUpdates()) {
    let i = next.findIndex((u) => u.id === seed.id)
    if (i < 0 && seed.nameMatch) {
      // người dùng tự tạo lại unit (id khác) -> khớp theo tên
      i = next.findIndex((u) => seed.nameMatch.test(u.name || ''))
    }
    if (i < 0) continue

    const u = next[i]
    const have = Number(u.seedVersion) || 1
    if (have >= SEED_VERSION) continue

    const ids = new Set(u.words.map((w) => w.id))
    const texts = new Set(u.words.map((w) => w.word.trim().toLowerCase()))
    const fresh = seed.groups
      .filter((g) => g.version > have)
      .flatMap((g) => g.words)
      .filter((w) => !ids.has(w.id) && !texts.has(w.word.trim().toLowerCase()))
    const name = seed.previousNames.includes(u.name) ? seed.name : u.name
    next[i] = { ...u, name, seedVersion: SEED_VERSION, words: [...u.words, ...fresh] }
  }
  return next
}

export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)
}

import { SEED_VERSION, seedUnits, seedUnitUpdates } from '../data/seedUnits.js'

// Khóa localStorage của bản cũ (trước khi có đăng nhập theo tên). Người dùng
// đầu tiên đăng nhập trên trình duyệt đó sẽ kế thừa dữ liệu này.
const LEGACY_KEY = 'vocab-units-v1'

// Chuẩn hóa danh sách unit lấy từ máy chủ / bộ nhớ đệm: không có (người dùng
// mới) thì nạp unit mẫu; có rồi thì nối thêm từ mới của seed và điền tên phần.
export function normalizeUnits(units) {
  if (!Array.isArray(units)) return seedUnits()
  return fillSections(mergeSeedAdditions(units))
}

// Lấy (và đánh dấu đã chuyển) dữ liệu của bản cũ; null nếu không có.
export function takeLegacyUnits() {
  localStorage.removeItem('vocab-seed-version')
  let units = null
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (raw) {
      units = JSON.parse(raw)
      localStorage.setItem(LEGACY_KEY + '-migrated', raw)
      localStorage.removeItem(LEGACY_KEY)
    }
  } catch {
    // dữ liệu hỏng -> coi như không có
  }
  return Array.isArray(units) ? units : null
}

// Unit đã lưu tương ứng với unit mẫu: ưu tiên trùng id; nếu không có
// (người dùng tự tạo lại unit) thì lấy unit có tên khớp mẫu.
function findSeedTarget(units, seed) {
  let i = units.findIndex((u) => u.id === seed.id)
  if (i < 0 && seed.nameMatch) i = units.findIndex((u) => seed.nameMatch.test(u.name || ''))
  return i
}

// Khi app được cập nhật thêm từ mới cho unit có sẵn, nối các từ đó vào
// unit tương ứng đã lưu trong trình duyệt (giữ nguyên tiến độ đã học).
// Phiên bản seed đã nối nằm ngay trong unit (`seedVersion`, thiếu = 1),
// nên hàm này thuần túy và gọi lại bao nhiêu lần cũng cho cùng kết quả.
// Từ đã có (trùng id hoặc trùng chữ) thì bỏ qua.
function mergeSeedAdditions(units) {
  const next = [...units]
  for (const seed of seedUnitUpdates()) {
    const i = findSeedTarget(next, seed)
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

// Gán tên phần cho những từ chưa có (dữ liệu lưu từ trước khi unit được
// chia phần): tra theo id hoặc theo chữ trong dữ liệu mẫu. Từ không khớp
// (người dùng tự thêm) giữ nguyên.
function fillSections(units) {
  const next = [...units]
  for (const seed of seedUnitUpdates()) {
    const i = findSeedTarget(next, seed)
    if (i < 0) continue
    const u = next[i]
    if (u.words.every((w) => w.section)) continue

    const byId = new Map()
    const byText = new Map()
    for (const g of seed.groups) {
      for (const w of g.words) {
        byId.set(w.id, w.section)
        byText.set(w.word.trim().toLowerCase(), w.section)
      }
    }
    let changed = false
    const words = u.words.map((w) => {
      if (w.section) return w
      const section = byId.get(w.id) || byText.get(w.word.trim().toLowerCase())
      if (!section) return w
      changed = true
      return { ...w, section }
    })
    if (changed) next[i] = { ...u, words }
  }
  return next
}

export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)
}

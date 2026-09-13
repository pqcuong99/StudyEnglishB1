// Tiến độ luyện nghe (nằm trong dữ liệu của người dùng, lưu trên máy chủ):
// { [exerciseId]: { [levelId]: { best, total, done, attempts } } }
const LEGACY_KEY = 'listening-progress-v1'
const LEVEL_KEY = 'listening-level'

// Lấy (và đánh dấu đã chuyển) tiến độ nghe của bản cũ lưu trong trình duyệt.
export function takeLegacyListeningProgress() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    localStorage.setItem(LEGACY_KEY + '-migrated', raw)
    localStorage.removeItem(LEGACY_KEY)
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

// Ghi kết quả một lượt làm; trả về tiến độ mới (hàm thuần, không tự lưu).
// `done` giữ true nếu đã từng điền đúng hết ở mức đó.
export function recordListeningResult(progress, exerciseId, levelId, correct, total) {
  const prev = progress[exerciseId]?.[levelId] || { best: 0, total, done: false, attempts: 0 }
  const entry = {
    best: Math.max(prev.best, correct),
    total,
    done: prev.done || correct === total,
    attempts: prev.attempts + 1,
  }
  return { ...progress, [exerciseId]: { ...(progress[exerciseId] || {}), [levelId]: entry } }
}

// Mức độ chọn lần cuối là sở thích của trình duyệt, không cần đồng bộ.
export function loadLastLevel() {
  try {
    return localStorage.getItem(LEVEL_KEY) || 'easy'
  } catch {
    return 'easy'
  }
}

export function saveLastLevel(levelId) {
  try {
    localStorage.setItem(LEVEL_KEY, levelId)
  } catch {
    // bỏ qua
  }
}

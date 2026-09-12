// Tiến độ luyện nghe lưu trong trình duyệt:
// { [exerciseId]: { [levelId]: { best, total, done, attempts } } }
const KEY = 'listening-progress-v1'
const LEVEL_KEY = 'listening-level'

export function loadListeningProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    const data = raw ? JSON.parse(raw) : null
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

// Ghi kết quả một lượt làm; trả về tiến độ mới. `done` giữ true nếu đã từng
// điền đúng hết ở mức đó.
export function recordListeningResult(progress, exerciseId, levelId, correct, total) {
  const prev = progress[exerciseId]?.[levelId] || { best: 0, total, done: false, attempts: 0 }
  const entry = {
    best: Math.max(prev.best, correct),
    total,
    done: prev.done || correct === total,
    attempts: prev.attempts + 1,
  }
  const next = { ...progress, [exerciseId]: { ...(progress[exerciseId] || {}), [levelId]: entry } }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // hết chỗ lưu -> bỏ qua, tiến độ vẫn giữ trong phiên hiện tại
  }
  return next
}

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

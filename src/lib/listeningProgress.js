// Tiến độ luyện nghe (listening.json của mỗi người trên máy chủ):
// { [exerciseId]: { [levelId]: { best, total, done, attempts } } }
// recordListeningResult dùng chung với server (server/store.js).
const LEVEL_KEY = 'listening-level'

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

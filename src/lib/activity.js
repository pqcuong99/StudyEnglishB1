// Nhật ký hoạt động theo ngày (activity.json của mỗi người trên máy chủ):
//   { 'YYYY-MM-DD': { answers, correct, reviews, learned, listening, listeningDone } }
//   answers / correct : số câu trả lời trắc nghiệm + kiểm tra viết, và số câu đúng
//   reviews / learned : số lần đánh dấu thẻ (✅/❌), và số từ chuyển từ chưa thuộc -> thuộc
//   listening / listeningDone : số lượt nộp bài nghe, và số lượt điền đúng hết
// Ngày tính theo giờ máy của người học (client gửi kèm khóa ngày, máy chủ cộng
// dồn). Bảng điều khiển quản trị gộp nhật ký này của mọi người để báo cáo theo
// ngày / tháng. File này dùng chung cho client và server: không import gì của
// trình duyệt hay Node.

export const ACTIVITY_FIELDS = ['answers', 'correct', 'reviews', 'learned', 'listening', 'listeningDone']

const pad = (n) => String(n).padStart(2, '0')

// 'YYYY-MM-DD' theo giờ địa phương
export function dateKey(ts = Date.now()) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function monthKey(key) {
  return key.slice(0, 7)
}

// Cộng dồn `patch` ({ answers: 1, correct: 0, ... }) vào ngày `key` (mặc định
// hôm nay); hàm thuần.
export function bumpActivity(activity, patch, key = dateKey()) {
  const prev = activity?.[key] || {}
  const next = { ...prev }
  for (const [k, v] of Object.entries(patch)) if (v) next[k] = (prev[k] || 0) + v
  return { ...(activity || {}), [key]: next }
}

export function emptyTotals() {
  return Object.fromEntries(ACTIVITY_FIELDS.map((f) => [f, 0]))
}

export function addTotals(acc, entry) {
  for (const f of ACTIVITY_FIELDS) acc[f] += entry?.[f] || 0
  return acc
}

// Cộng các ngày trong khoảng [from, to] (khóa 'YYYY-MM-DD', bao gồm hai đầu)
export function sumRange(activity, from, to) {
  const acc = emptyTotals()
  for (const [k, e] of Object.entries(activity || {})) if (k >= from && k <= to) addTotals(acc, e)
  return acc
}

export function shiftDays(key, days) {
  const [y, m, d] = key.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + days).getTime())
}

// ---------- hiển thị ----------
export function formatDate(key) {
  const [y, m, d] = key.split('-')
  return `${d}/${m}/${y}`
}

export function formatMonth(key) {
  const [y, m] = key.split('-')
  return `Tháng ${Number(m)}/${y}`
}

export function formatDateTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function relativeTime(ts, now = Date.now()) {
  if (!ts) return 'chưa có'
  const diff = now - ts
  const min = Math.round(diff / 60000)
  if (min < 1) return 'vừa xong'
  if (min < 60) return `${min} phút trước`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} giờ trước`
  const days = Math.round(h / 24)
  if (days === 1) return 'hôm qua'
  if (days < 30) return `${days} ngày trước`
  return formatDate(dateKey(ts))
}

export function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0
}

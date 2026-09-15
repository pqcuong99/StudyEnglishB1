// Thống kê trả lời của từng từ (trắc nghiệm + kiểm tra viết), nằm ngay trong
// từ đó (`word.stats`) nên đi cùng file phần trên máy chủ:
//   { wrong, correct, streak, lastAt, lastWrongAt }
//   wrong / correct : tổng số lần sai / đúng
//   streak          : số lần đúng liên tiếp gần nhất (về 0 khi sai)
//
// File này dùng chung cho client (src/) và server (server/): không được import
// gì của trình duyệt hay Node.

export const HARD_WRONG_MIN = 2 // sai từ 2 lần trở lên -> vào nhóm "hay sai"
export const MASTER_STREAK = 3 // đúng 3 lần liên tiếp -> rời nhóm "hay sai"
export const HARD_SHARE = 0.4 // ~40% đề kiểm tra ngẫu nhiên lấy từ nhóm hay sai

// Thống kê mới của một từ sau một câu trả lời (hàm thuần)
export function recordAnswer(prev, correct, now = Date.now()) {
  const p = prev || { wrong: 0, correct: 0, streak: 0 }
  return correct
    ? { ...p, correct: (p.correct || 0) + 1, streak: (p.streak || 0) + 1, lastAt: now }
    : { ...p, wrong: (p.wrong || 0) + 1, streak: 0, lastAt: now, lastWrongAt: now }
}

// Từ "hay sai": đã sai đủ nhiều và chưa chứng minh là đã thuộc (chuỗi đúng
// liên tiếp chưa đủ). Thuộc rồi mà sai lại thì chuỗi về 0 -> quay lại nhóm.
export function isHard(entry) {
  return !!entry && (entry.wrong || 0) >= HARD_WRONG_MIN && (entry.streak || 0) < MASTER_STREAK
}

// Số đếm của một phần (ghi trong mục lục unit để trang chủ / bảng điều khiển
// không phải tải từ): { total, known, hard }
export function sectionSummary(words) {
  let known = 0
  let hard = 0
  for (const w of words) {
    if (w.known) known++
    if (isHard(w.stats)) hard++
  }
  return { total: words.length, known, hard }
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Lọc các từ hay sai trong danh sách items ({ word }), sai nhiều xếp trước
export function hardItems(items) {
  return items
    .filter(({ word }) => isHard(word.stats))
    .sort((a, b) => {
      const ea = a.word.stats
      const eb = b.word.stats
      return eb.wrong - ea.wrong || ea.streak - eb.streak || (eb.lastWrongAt || 0) - (ea.lastWrongAt || 0)
    })
}

// Bốc đề kiểm tra ngẫu nhiên min..max từ: một phần (HARD_SHARE) ưu tiên lấy
// từ nhóm hay sai, phần còn lại bốc ngẫu nhiên trong các từ khác.
export function pickRandomTest(items, min = 10, max = 15) {
  const n = Math.min(items.length, min + Math.floor(Math.random() * (max - min + 1)))
  const hard = shuffle(hardItems(items))
  const chosenHard = hard.slice(0, Math.min(hard.length, Math.round(n * HARD_SHARE)))
  const taken = new Set(chosenHard.map(({ word }) => word.id))
  const rest = shuffle(items.filter(({ word }) => !taken.has(word.id))).slice(0, n - chosenHard.length)
  return shuffle([...chosenHard, ...rest])
}

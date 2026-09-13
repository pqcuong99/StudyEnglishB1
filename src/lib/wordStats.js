// Thống kê trả lời theo từng từ (trắc nghiệm + kiểm tra viết), lưu cùng dữ
// liệu người dùng:  { [wordId]: { wrong, correct, streak, lastAt, lastWrongAt } }
//   wrong / correct : tổng số lần sai / đúng
//   streak          : số lần đúng liên tiếp gần nhất (về 0 khi sai)

export const HARD_WRONG_MIN = 2 // sai từ 2 lần trở lên -> vào nhóm "hay sai"
export const MASTER_STREAK = 3 // đúng 3 lần liên tiếp -> rời nhóm "hay sai"
export const HARD_SHARE = 0.4 // ~40% đề kiểm tra ngẫu nhiên lấy từ nhóm hay sai

export function recordAnswer(stats, wordId, correct) {
  const prev = stats[wordId] || { wrong: 0, correct: 0, streak: 0 }
  const now = Date.now()
  const entry = correct
    ? { ...prev, correct: prev.correct + 1, streak: prev.streak + 1, lastAt: now }
    : { ...prev, wrong: prev.wrong + 1, streak: 0, lastAt: now, lastWrongAt: now }
  return { ...stats, [wordId]: entry }
}

// Từ "hay sai": đã sai đủ nhiều và chưa chứng minh là đã thuộc (chuỗi đúng
// liên tiếp chưa đủ). Thuộc rồi mà sai lại thì chuỗi về 0 -> quay lại nhóm.
export function isHard(entry) {
  return !!entry && entry.wrong >= HARD_WRONG_MIN && entry.streak < MASTER_STREAK
}

// Lọc các từ hay sai trong danh sách items ({unitId, word}), sai nhiều xếp trước
export function hardItems(items, stats) {
  return items
    .filter(({ word }) => isHard(stats[word.id]))
    .sort((a, b) => {
      const ea = stats[a.word.id]
      const eb = stats[b.word.id]
      return eb.wrong - ea.wrong || ea.streak - eb.streak || (eb.lastWrongAt || 0) - (ea.lastWrongAt || 0)
    })
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Bốc đề kiểm tra ngẫu nhiên min..max từ: một phần (HARD_SHARE) ưu tiên lấy
// từ nhóm hay sai, phần còn lại bốc ngẫu nhiên trong các từ khác.
export function pickRandomTest(items, stats, min = 10, max = 15) {
  const n = Math.min(items.length, min + Math.floor(Math.random() * (max - min + 1)))
  const hard = shuffle(hardItems(items, stats))
  const chosenHard = hard.slice(0, Math.min(hard.length, Math.round(n * HARD_SHARE)))
  const taken = new Set(chosenHard.map(({ word }) => word.id))
  const rest = shuffle(items.filter(({ word }) => !taken.has(word.id))).slice(0, n - chosenHard.length)
  return shuffle([...chosenHard, ...rest])
}

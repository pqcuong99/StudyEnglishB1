// Tạo bài điền từ (cloze) cho luyện nghe: tách hội thoại thành token và chọn
// ngẫu nhiên một số từ để ẩn đi tùy theo mức độ.

export const LEVELS = [
  { id: 'easy', label: 'Dễ', icon: '🌱', count: 5, minLen: 4, contractions: false },
  { id: 'medium', label: 'Trung bình', icon: '🌿', count: 7, minLen: 3, contractions: false },
  { id: 'hard', label: 'Khó', icon: '🌳', count: 10, minLen: 3, contractions: true },
]

export function levelById(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0]
}

// Từ chức năng: nghe không có giá trị luyện tập, không ẩn
const STOP_WORDS = new Set(
  `a an the and but or so to of in on at it its is was be am are were been i you he she we they
  me him her us them my your his our their this that these those do did does not no yes oh mm
  well hi ok if as for from with than then there here what when who how why have has had can
  will would could should shall may might get got go one all just too very much more up out
  off now about like only also any some s t ll ve re d m yeah wow`
    .split(/\s+/)
    .filter(Boolean),
)

// Token của một dòng: { type: 'text' | 'word', text }. `word` = chữ cái, có thể
// kèm phần rút gọn ("wasn't", "friends'll"). `text` là dấu câu/khoảng trắng.
const WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g

export function tokenize(text) {
  const tokens = []
  let last = 0
  for (const m of text.matchAll(WORD_RE)) {
    if (m.index > last) tokens.push({ type: 'text', text: text.slice(last, m.index) })
    tokens.push({ type: 'word', text: m[0] })
    last = m.index + m[0].length
  }
  if (last < text.length) tokens.push({ type: 'text', text: text.slice(last) })
  return tokens
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Từ đứng đầu câu (đầu dòng hoặc sau . ! ?) thì viết hoa là bình thường;
// viết hoa ở giữa câu thường là tên riêng (Ben, Jamie, Dad) -> không ẩn.
function isSentenceStart(tokens, i) {
  for (let k = i - 1; k >= 0; k--) {
    const t = tokens[k]
    if (t.type === 'word') return false
    if (/[.!?…]/.test(t.text)) return true
  }
  return true
}

function isCandidate(tokens, i, level) {
  const w = tokens[i].text
  const hasApostrophe = /['’]/.test(w)
  if (hasApostrophe && !level.contractions) return false
  const core = w.replace(/['’].*$/, '') // "wasn't" -> "wasn"
  if (core.length < level.minLen) return false
  if (STOP_WORDS.has(w.toLowerCase()) || STOP_WORDS.has(core.toLowerCase())) return false
  if (/^[A-Z]/.test(w) && !isSentenceStart(tokens, i)) return false
  if (/^[A-Z]+$/.test(w)) return false // OK, TV...
  return true
}

// Trả về bài điền từ: mỗi dòng gồm token, token bị ẩn có `blank` = số thứ tự
// chỗ trống (0-based). `blanks[k]` = { line, token, answer }.
// Quy tắc chọn: ngẫu nhiên trong toàn bộ từ hợp lệ, không ẩn hai từ liền
// nhau, ưu tiên không lặp lại cùng một từ và không dồn quá nhiều vào một dòng.
export function makeCloze(lines, level) {
  const tokenized = lines.map((l) => tokenize(l.t))

  const all = []
  tokenized.forEach((tokens, line) => {
    tokens.forEach((t, i) => {
      if (t.type === 'word' && isCandidate(tokens, i, level)) all.push({ line, token: i })
    })
  })
  const perLineCount = tokenized.map((_, line) => all.filter((c) => c.line === line).length)
  // mỗi dòng nhận tối đa số chỗ trống tỉ lệ với số từ hợp lệ của dòng (+1)
  const cap = perLineCount.map((n) => Math.ceil((level.count * n) / Math.max(1, all.length)) + 1)

  const chosen = new Set() // "line:token"
  const usedWords = new Set()
  const lineCount = tokenized.map(() => 0)
  const picks = []

  const neighborTaken = (line, i) => {
    const tokens = tokenized[line]
    for (const dir of [-1, 1]) {
      for (let k = i + dir; k >= 0 && k < tokens.length; k += dir) {
        if (tokens[k].type === 'word') {
          if (chosen.has(`${line}:${k}`)) return true
          break
        }
      }
    }
    return false
  }

  const take = (c) => {
    chosen.add(`${c.line}:${c.token}`)
    usedWords.add(tokenized[c.line][c.token].text.toLowerCase())
    lineCount[c.line] += 1
    picks.push(c)
  }

  const order = shuffle(all)
  // vòng 1: không lặp từ, không quá cap của dòng; vòng 2: nới lỏng nếu chưa đủ
  for (const c of order) {
    if (picks.length >= level.count) break
    const word = tokenized[c.line][c.token].text.toLowerCase()
    if (usedWords.has(word) || lineCount[c.line] >= cap[c.line]) continue
    if (chosen.has(`${c.line}:${c.token}`) || neighborTaken(c.line, c.token)) continue
    take(c)
  }
  for (const c of order) {
    if (picks.length >= level.count) break
    if (chosen.has(`${c.line}:${c.token}`) || neighborTaken(c.line, c.token)) continue
    take(c)
  }

  // đánh số chỗ trống theo thứ tự xuất hiện trong bài
  picks.sort((a, b) => a.line - b.line || a.token - b.token)
  const blanks = picks.map((p, k) => ({ ...p, answer: tokenized[p.line][p.token].text }))
  const result = tokenized.map((tokens, line) => ({
    s: lines[line].s,
    tokens: tokens.map((t, i) => {
      const k = blanks.findIndex((b) => b.line === line && b.token === i)
      return k >= 0 ? { ...t, blank: k } : t
    }),
  }))
  return { lines: result, blanks }
}

export function normalizeAnswer(s) {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[.,!?;:"…]+$/g, '')
    .replace(/\s+/g, ' ')
}

export function isCorrect(answer, expected) {
  return normalizeAnswer(answer) === normalizeAnswer(expected)
}

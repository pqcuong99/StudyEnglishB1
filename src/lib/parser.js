// Parse vocabulary lists in the course-handout format:
//    word (pos) /IPA/: nghĩa tiếng Việt
// Lines that don't look like vocabulary entries (unit titles, notes,
// example sentences...) are ignored, but the unit title is picked up
// to suggest a name for the new unit.

const BULLET = /^[\s•·●▪‣⁃*\-–—]+/

// word (pos) /ipa/ : meaning
const FULL_RE = /^(.+?)\s*\(([^)]{1,25})\)\s*\/(.+?)\/\s*:?\s*(.+)$/
// word /ipa/ : meaning  (no part of speech)
const NO_POS_RE = /^(.+?)\s*\/(.+?)\/\s*:?\s*(.+)$/
// word (pos): meaning  (no IPA)
const NO_IPA_RE = /^([A-Za-z][A-Za-z'’ .\-]{0,40}?)\s*\(([^)]{1,25})\)\s*:\s*(.+)$/

function looksLikeWord(s) {
  // reject headings such as "UNIT 1" / "Session 2" / "I/ TỪ VỰNG"
  if (!s) return false
  if (/\d/.test(s)) return false
  if (s.length > 45) return false
  if (s === s.toUpperCase() && s.length > 3) return false
  return /^[A-Za-z]/.test(s)
}

export function parseVocabText(text) {
  const words = []
  let unitTitle = ''
  let sessionTitle = ''

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(BULLET, '').trim()
    if (!line) continue

    const unitMatch = line.match(/^UNIT\s*\d+.*$/i)
    if (unitMatch && !unitTitle) {
      unitTitle = titleCase(line)
      continue
    }
    const sessionMatch = line.match(/^Session\s*\d+.*$/i)
    if (sessionMatch && !sessionTitle) {
      sessionTitle = line
      continue
    }
    // skip notes / examples
    if (/^(lưu ý|ghi chú|ex|note|ví dụ)\b/i.test(line)) continue

    let m = line.match(FULL_RE)
    if (m && looksLikeWord(m[1])) {
      words.push({ word: m[1].trim(), pos: m[2].trim(), ipa: m[3].trim(), meaning: m[4].trim() })
      continue
    }
    m = line.match(NO_POS_RE)
    if (m && looksLikeWord(m[1])) {
      words.push({ word: m[1].trim(), pos: '', ipa: m[2].trim(), meaning: m[3].trim() })
      continue
    }
    m = line.match(NO_IPA_RE)
    if (m && looksLikeWord(m[1])) {
      words.push({ word: m[1].trim(), pos: m[2].trim(), ipa: '', meaning: m[3].trim() })
      continue
    }
  }

  let suggestedName = ''
  if (unitTitle && sessionTitle) suggestedName = `${unitTitle} – ${sessionTitle}`
  else if (unitTitle) suggestedName = unitTitle
  else if (sessionTitle) suggestedName = sessionTitle

  return { words, suggestedName }
}

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/(^|[\s:])\S/g, (c) => c.toUpperCase())
}

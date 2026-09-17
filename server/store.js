// Lưu trữ tiến độ học trên đĩa — mỗi người một thư mục, mỗi phần của unit một
// file, để API chỉ đọc/ghi đúng phần đang học dù có bao nhiêu unit / người dùng.
//
//   server/data/users/<tên>-<hash>/
//     profile.json                    { id, name, createdAt, updatedAt }
//     units.json                      MỤC LỤC: [{ id, name, createdAt, seedVersion,
//                                       sections: [{ id, name, total, known, hard }] }]
//     units/<unitId>/<sectionId>.json { words: [{ id, word, pos, ipa, meaning, seed, known, stats? }] }
//     activity.json                   nhật ký theo ngày (src/lib/activity.js)
//     listening.json                  tiến độ nghe (src/lib/listeningProgress.js)
//
// Số đếm trong mục lục được tính lại mỗi khi ghi một phần, nên trang chủ và
// bảng điều khiển chỉ cần đọc mục lục. Dữ liệu kiểu cũ (một file JSON cho cả
// người dùng) được tự chuyển sang cấu trúc này khi API khởi động (migrateLegacy).
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { SEED_VERSION, seedUnits, seedUnitUpdates } from '../src/data/seedUnits.js'
import { isHard, pickRandomTest, recordAnswer, sectionSummary } from '../src/lib/wordStats.js'
import { bumpActivity, dateKey } from '../src/lib/activity.js'
import { recordListeningResult } from '../src/lib/listeningProgress.js'

// id của unit / phần / từ đặt tên file nên chỉ cho chữ, số, `-`, `_`
export const ID_RE = /^[\w-]{1,64}$/
export const isId = (v) => typeof v === 'string' && ID_RE.test(v)

// tên phần mặc định cho unit không chia phần (unit tự tạo / dữ liệu cũ)
export const MAIN_SECTION = { id: 'main', name: 'Từ vựng' }
const OTHER_SECTION = { id: 'other', name: 'Từ khác' }

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const textKey = (w) => String(w.word || '').trim().toLowerCase()

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

// ghi tạm rồi đổi tên để file không bao giờ bị hỏng nửa chừng
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(value))
  fs.renameSync(tmp, file)
}

// Làm sạch một từ nhận từ client (chỉ giữ các trường app dùng)
export function cleanWord(w, fallbackId) {
  if (!w || typeof w !== 'object') return null
  const id = isId(w.id) ? w.id : fallbackId
  const word = String(w.word ?? '').trim()
  const meaning = String(w.meaning ?? '').trim()
  if (!id || !word || !meaning) return null
  const out = {
    id,
    word,
    pos: String(w.pos ?? '').trim(),
    ipa: String(w.ipa ?? '').trim(),
    meaning,
    seed: Number.isFinite(w.seed) ? w.seed : Math.floor(Math.random() * 100000),
    known: !!w.known,
  }
  if (w.example) out.example = String(w.example)
  if (w.exampleVi) out.exampleVi = String(w.exampleVi)
  if (w.stats && typeof w.stats === 'object') {
    out.stats = {
      wrong: Number(w.stats.wrong) || 0,
      correct: Number(w.stats.correct) || 0,
      streak: Number(w.stats.streak) || 0,
      lastAt: Number(w.stats.lastAt) || undefined,
      lastWrongAt: Number(w.stats.lastWrongAt) || undefined,
    }
  }
  return out
}

export function createStore({ dataDir, log = () => {} }) {
  const usersDir = path.join(dataDir, 'users')
  const legacyDir = path.join(dataDir, 'legacy')
  fs.mkdirSync(usersDir, { recursive: true })

  // tên thư mục dễ đọc (giữ chữ có dấu) + hash ngắn để không đụng nhau
  function dirFor(key) {
    const slug = key.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '') || 'user'
    const hash = crypto.createHash('sha1').update(key).digest('hex').slice(0, 8)
    return path.join(usersDir, `${slug}-${hash}`)
  }
  const profileFile = (key) => path.join(dirFor(key), 'profile.json')
  const unitsFile = (key) => path.join(dirFor(key), 'units.json')
  const activityFile = (key) => path.join(dirFor(key), 'activity.json')
  const listeningFile = (key) => path.join(dirFor(key), 'listening.json')
  const unitDir = (key, unitId) => path.join(dirFor(key), 'units', unitId)
  const sectionFile = (key, unitId, sectionId) => path.join(unitDir(key, unitId), `${sectionId}.json`)

  const readProfile = (key) => readJson(profileFile(key), null)
  const readUnits = (key) => {
    const v = readJson(unitsFile(key), [])
    return Array.isArray(v) ? v : []
  }
  const readWords = (key, unitId, sectionId) => {
    const v = readJson(sectionFile(key, unitId, sectionId), null)
    return v && Array.isArray(v.words) ? v.words : null
  }

  // ---------- danh sách người dùng trong bộ nhớ (GET /api/users không đọc đĩa) ----------
  const index = new Map() // key -> { name, updatedAt }

  function touch(key, patch = {}) {
    const prev = readProfile(key)
    if (!prev) return null
    const profile = { ...prev, ...patch, updatedAt: Date.now() }
    writeJson(profileFile(key), profile)
    index.set(key, { name: profile.name, updatedAt: profile.updatedAt })
    return profile
  }

  function writeSection(key, unitId, sectionId, words) {
    writeJson(sectionFile(key, unitId, sectionId), { words })
    const units = readUnits(key)
    const u = units.find((x) => x.id === unitId)
    const s = u?.sections.find((x) => x.id === sectionId)
    if (s) {
      Object.assign(s, sectionSummary(words))
      writeJson(unitsFile(key), units)
    }
    return s
  }

  // Ghi các file phần của một unit (xóa thư mục cũ nếu có), trả về mục của
  // unit đó cho units.json — chưa ghi vào mục lục
  function writeUnitFiles(key, unit) {
    const dir = unitDir(key, unit.id)
    fs.rmSync(dir, { recursive: true, force: true })
    const entry = {
      id: unit.id,
      name: unit.name,
      createdAt: unit.createdAt || Date.now(),
      sections: [],
    }
    if (unit.seedVersion) entry.seedVersion = unit.seedVersion
    for (const s of unit.sections) {
      writeJson(sectionFile(key, unit.id, s.id), { words: s.words })
      entry.sections.push({ id: s.id, name: s.name, ...sectionSummary(s.words) })
    }
    return entry
  }

  // Ghi cả unit (tạo mới / thay thế): { id, name, createdAt, seedVersion?, sections: [{ id, name, words }] }
  function writeUnit(key, unit) {
    const entry = writeUnitFiles(key, unit)
    const units = readUnits(key)
    const i = units.findIndex((x) => x.id === unit.id)
    if (i < 0) units.push(entry)
    else units[i] = entry
    writeJson(unitsFile(key), units)
    return entry
  }

  // ---------- chuyển dữ liệu kiểu cũ (một file / người) ----------
  // Tên phần trong dữ liệu cũ -> id phần: unit mẫu tra theo tên phần của seed,
  // còn lại đánh số s1, s2... Từ không có tên phần: unit không chia phần thì vào
  // phần `main`, unit có chia phần thì vào `other`.
  function convertLegacyUnit(u, stats) {
    const seed = seedUnitUpdates().find(
      (s) => s.id === u.id || (s.nameMatch && s.nameMatch.test(u.name || '')),
    )
    const seedSectionByName = new Map((seed?.sections || []).map((s) => [s.name, s.id]))
    const words = Array.isArray(u.words) ? u.words : []
    const hasSections = words.some((w) => w.section)
    const sections = [] // [{ id, name, words }]
    const byName = new Map()
    let n = 0
    for (const w of words) {
      const name = hasSections ? w.section || OTHER_SECTION.name : MAIN_SECTION.name
      let s = byName.get(name)
      if (!s) {
        let id
        if (!hasSections) id = MAIN_SECTION.id
        else if (!w.section) id = OTHER_SECTION.id
        else id = seedSectionByName.get(name) || `s${++n}`
        s = { id, name, words: [] }
        byName.set(name, s)
        sections.push(s)
      }
      const { section: _section, ...rest } = w
      const clean = cleanWord({ ...rest, stats: stats[w.id] }, `w${s.words.length + 1}`)
      if (clean) s.words.push(clean)
    }
    return {
      id: isId(u.id) ? u.id : crypto.randomUUID(),
      name: String(u.name || 'Unit'),
      createdAt: u.createdAt || Date.now(),
      seedVersion: u.seedVersion || (seed ? 1 : undefined),
      sections,
    }
  }

  function migrateLegacyFile(file) {
    const doc = readJson(file, null)
    if (!doc?.key || !doc?.name || !doc.data) return false
    const key = doc.key
    if (readProfile(key)) {
      log('WARN da co thu muc moi, bo qua file cu:', path.basename(file))
      return false
    }
    const d = doc.data
    const stats = obj(d.wordStats)
    writeJson(profileFile(key), {
      id: key,
      name: doc.name,
      createdAt: doc.createdAt || Date.now(),
      updatedAt: doc.updatedAt || Date.now(),
    })
    writeJson(unitsFile(key), [])
    for (const u of Array.isArray(d.units) ? d.units : []) {
      writeUnit(key, convertLegacyUnit(u, stats))
    }
    writeJson(activityFile(key), obj(d.activity))
    writeJson(listeningFile(key), obj(d.listening))
    fs.mkdirSync(legacyDir, { recursive: true })
    fs.renameSync(file, path.join(legacyDir, path.basename(file)))
    return true
  }

  // Gọi một lần khi khởi động: chuyển file cũ, nạp danh sách người dùng
  function init() {
    let migrated = 0
    for (const f of fs.readdirSync(usersDir)) {
      const full = path.join(usersDir, f)
      if (f.endsWith('.json') && fs.statSync(full).isFile()) {
        try {
          if (migrateLegacyFile(full)) migrated++
        } catch (e) {
          log('WARN khong chuyen duoc file cu', f, e.message)
        }
      }
    }
    if (migrated) log(`Da chuyen ${migrated} nguoi dung sang cau truc moi (file cu o ${legacyDir})`)
    for (const f of fs.readdirSync(usersDir)) {
      const p = readJson(path.join(usersDir, f, 'profile.json'), null)
      if (p?.id && p?.name) index.set(p.id, { name: p.name, updatedAt: p.updatedAt || 0 })
    }
  }

  // ---------- unit mẫu ----------
  // Nối từ mới của seed vào unit tương ứng của người dùng (giữ tiến độ, không
  // thêm lại từ đã có theo id hoặc chữ). Unit mẫu ra đời sau khi người này
  // đăng ký (chưa có trong mục lục) thì tạo cả unit. Hàm thuần theo dữ liệu
  // trên đĩa: gọi bao nhiêu lần cũng cho cùng kết quả.
  function syncSeed(key) {
    const units = readUnits(key)
    let changed = false
    const seeds = seedUnitUpdates()
    const findUnit = (seed) =>
      units.find((x) => x.id === seed.id) ||
      (seed.nameMatch ? units.find((x) => seed.nameMatch.test(x.name || '')) : undefined)
    for (const seed of seeds) {
      const u = findUnit(seed)
      if (!u) {
        const fresh = seedUnits().find((x) => x.id === seed.id)
        if (!fresh) continue
        // xếp ngay sau unit mẫu đứng trước nó để thứ tự giống người dùng mới
        const at = seeds
          .slice(0, seeds.indexOf(seed))
          .reduce((max, s) => Math.max(max, units.indexOf(findUnit(s))), -1)
        units.splice(at + 1, 0, writeUnitFiles(key, fresh))
        changed = true
        continue
      }
      const have = Number(u.seedVersion) || 1
      if (have >= SEED_VERSION) continue

      const loaded = new Map() // sectionId -> words
      for (const s of u.sections) loaded.set(s.id, readWords(key, u.id, s.id) || [])
      const ids = new Set()
      const texts = new Set()
      for (const ws of loaded.values()) {
        for (const w of ws) {
          ids.add(w.id)
          texts.add(textKey(w))
        }
      }
      const dirty = new Set()
      for (const g of seed.groups) {
        if (g.version <= have) continue
        if (!loaded.has(g.sectionId)) {
          const def = seed.sections.find((s) => s.id === g.sectionId)
          u.sections.push({ id: g.sectionId, name: def?.name || g.sectionId, total: 0, known: 0, hard: 0 })
          loaded.set(g.sectionId, [])
        }
        const ws = loaded.get(g.sectionId)
        for (const w of g.words) {
          if (ids.has(w.id) || texts.has(textKey(w))) continue
          ws.push(w)
          ids.add(w.id)
          texts.add(textKey(w))
          dirty.add(g.sectionId)
        }
      }
      for (const sid of dirty) {
        const ws = loaded.get(sid)
        writeJson(sectionFile(key, u.id, sid), { words: ws })
        Object.assign(u.sections.find((s) => s.id === sid), sectionSummary(ws))
      }
      if (seed.previousNames.includes(u.name)) u.name = seed.name
      u.seedVersion = SEED_VERSION
      changed = true
    }
    if (changed) writeJson(unitsFile(key), units)
    return changed
  }

  // ---------- người dùng ----------
  function overview(key) {
    const p = readProfile(key)
    if (!p) return null
    return { id: p.id, name: p.name, createdAt: p.createdAt, updatedAt: p.updatedAt, units: readUnits(key) }
  }

  // Đăng nhập: tạo người dùng mới với unit mẫu, hoặc nối từ mẫu mới cho người cũ
  function open(key, name) {
    let created = false
    if (!readProfile(key)) {
      const now = Date.now()
      writeJson(profileFile(key), { id: key, name, createdAt: now, updatedAt: now })
      writeJson(unitsFile(key), [])
      for (const u of seedUnits()) writeUnit(key, u)
      writeJson(activityFile(key), {})
      writeJson(listeningFile(key), {})
      index.set(key, { name, updatedAt: now })
      created = true
    } else if (syncSeed(key)) {
      touch(key)
    }
    return { created, overview: overview(key) }
  }

  function section(key, unitId, sectionId) {
    const u = readUnits(key).find((x) => x.id === unitId)
    const s = u?.sections.find((x) => x.id === sectionId)
    if (!s) return null
    return { id: s.id, name: s.name, unitId, words: readWords(key, unitId, sectionId) || [] }
  }

  function unit(key, unitId) {
    const u = readUnits(key).find((x) => x.id === unitId)
    if (!u) return null
    return {
      id: u.id,
      name: u.name,
      createdAt: u.createdAt,
      sections: u.sections.map((s) => ({ id: s.id, name: s.name, words: readWords(key, unitId, s.id) || [] })),
    }
  }

  // Tạo / thay thế unit từ client: { name, createdAt?, sections: [{ id, name, words }] }
  function putUnit(key, unitId, body) {
    if (!readProfile(key)) return null
    const name = String(body?.name ?? '').trim()
    if (!name) throw Object.assign(new Error('Thiếu tên unit'), { status: 400 })
    const rawSections = Array.isArray(body.sections) ? body.sections : []
    const sections = []
    const seen = new Set()
    rawSections.forEach((s, i) => {
      const id = isId(s?.id) ? s.id : `s${i + 1}`
      if (seen.has(id)) return
      seen.add(id)
      const words = (Array.isArray(s?.words) ? s.words : [])
        .map((w, j) => cleanWord(w, `w${j + 1}`))
        .filter(Boolean)
      sections.push({ id, name: String(s?.name ?? '').trim() || MAIN_SECTION.name, words })
    })
    if (sections.length === 0) throw Object.assign(new Error('Unit chưa có từ nào'), { status: 400 })
    const prev = readUnits(key).find((x) => x.id === unitId)
    const entry = writeUnit(key, {
      id: unitId,
      name,
      createdAt: prev?.createdAt || Number(body.createdAt) || Date.now(),
      seedVersion: prev?.seedVersion,
      sections,
    })
    touch(key)
    return entry
  }

  function renameUnit(key, unitId, name) {
    const units = readUnits(key)
    const u = units.find((x) => x.id === unitId)
    if (!u) return null
    u.name = String(name ?? '').trim() || u.name
    writeJson(unitsFile(key), units)
    touch(key)
    return u
  }

  function deleteUnit(key, unitId) {
    const units = readUnits(key)
    const i = units.findIndex((x) => x.id === unitId)
    if (i < 0) return false
    units.splice(i, 1)
    writeJson(unitsFile(key), units)
    fs.rmSync(unitDir(key, unitId), { recursive: true, force: true })
    touch(key)
    return true
  }

  const validDay = (d) => (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : dateKey())

  function bump(key, patch, day) {
    const act = obj(readJson(activityFile(key), {}))
    writeJson(activityFile(key), bumpActivity(act, patch, validDay(day)))
  }

  // Sửa một từ: { known?, seed?, answer?, day? }
  //   known  : đánh dấu thuộc / chưa thuộc (flashcard, ô tick) -> ghi nhật ký lượt ôn
  //   answer : true/false = trả lời đúng/sai trong bài kiểm tra -> cập nhật thống kê
  //            đúng/sai, cờ thuộc và nhật ký câu trả lời
  //   seed   : đổi ảnh minh họa
  function updateWord(key, unitId, sectionId, wordId, body) {
    const words = readWords(key, unitId, sectionId)
    if (!words) return null
    const i = words.findIndex((w) => w.id === wordId)
    if (i < 0) return null
    const prev = words[i]
    const next = { ...prev }
    const activity = {}
    if (Number.isFinite(body?.seed)) next.seed = body.seed
    if (typeof body?.answer === 'boolean') {
      next.stats = recordAnswer(prev.stats, body.answer)
      next.known = body.answer
      activity.answers = 1
      activity.correct = body.answer ? 1 : 0
    } else if (typeof body?.known === 'boolean') {
      next.known = body.known
      activity.reviews = 1
      activity.learned = body.known && !prev.known ? 1 : 0
    }
    words[i] = next
    const summary = writeSection(key, unitId, sectionId, words)
    if (Object.keys(activity).length) bump(key, activity, body.day)
    touch(key)
    return { word: next, summary }
  }

  function deleteWord(key, unitId, sectionId, wordId) {
    const words = readWords(key, unitId, sectionId)
    if (!words) return null
    const rest = words.filter((w) => w.id !== wordId)
    if (rest.length === words.length) return null
    const summary = writeSection(key, unitId, sectionId, rest)
    touch(key)
    return { summary }
  }

  // Mọi từ của người dùng: [{ unitId, sectionId, word }] (chỉ khi cần học
  // tổng hợp / bốc đề ngẫu nhiên)
  function allItems(key, { unknownOnly = false } = {}) {
    const out = []
    for (const u of readUnits(key)) {
      for (const s of u.sections) {
        for (const w of readWords(key, u.id, s.id) || []) {
          if (unknownOnly && w.known) continue
          out.push({ unitId: u.id, sectionId: s.id, word: w })
        }
      }
    }
    return out
  }

  function randomTest(key, n) {
    const items = allItems(key)
    const size = Math.max(2, Math.min(50, Number(n) || 0))
    return n ? pickRandomTest(items, size, size) : pickRandomTest(items)
  }

  // ---------- nghe ----------
  const listening = (key) => (readProfile(key) ? obj(readJson(listeningFile(key), {})) : null)

  function recordListening(key, exerciseId, levelId, body) {
    if (!readProfile(key)) return null
    const correct = Number(body?.correct) || 0
    const total = Number(body?.total) || 0
    const progress = recordListeningResult(listening(key), exerciseId, levelId, correct, total)
    writeJson(listeningFile(key), progress)
    bump(key, { listening: 1, listeningDone: total > 0 && correct === total ? 1 : 0 }, body?.day)
    touch(key)
    return progress[exerciseId][levelId]
  }

  // ---------- quản trị ----------
  // Một người học cho bảng điều khiển: mục lục unit (số đếm), từ hay sai, tổng
  // đúng/sai, tiến độ nghe, nhật ký — không gửi phiên âm / ảnh / toàn bộ từ.
  function reportUser(key) {
    const p = readProfile(key)
    if (!p) return null
    const units = readUnits(key)
    const hard = []
    let correct = 0
    let wrong = 0
    for (const u of units) {
      for (const s of u.sections) {
        for (const w of readWords(key, u.id, s.id) || []) {
          if (!w.stats) continue
          correct += w.stats.correct || 0
          wrong += w.stats.wrong || 0
          if (isHard(w.stats)) {
            hard.push({ id: w.id, word: w.word, meaning: w.meaning, wrong: w.stats.wrong, correct: w.stats.correct || 0 })
          }
        }
      }
    }
    hard.sort((a, b) => b.wrong - a.wrong)
    return {
      name: p.name,
      key: p.id,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      units: units.map((u) => ({ id: u.id, name: u.name, sections: u.sections })),
      hard,
      correct,
      wrong,
      listening: obj(readJson(listeningFile(key), {})),
      activity: obj(readJson(activityFile(key), {})),
    }
  }

  function report() {
    const users = []
    for (const k of index.keys()) {
      const r = reportUser(k)
      if (r) users.push(r)
    }
    users.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    return { generatedAt: Date.now(), users }
  }

  return {
    init,
    index,
    usersDir,
    exists: (key) => !!readProfile(key),
    open,
    overview,
    unit,
    putUnit,
    renameUnit,
    deleteUnit,
    section,
    updateWord,
    deleteWord,
    allItems,
    randomTest,
    listening,
    recordListening,
    report,
  }
}

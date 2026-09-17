import { useEffect, useRef, useState } from 'react'
import { recordListeningResult } from './lib/listeningProgress.js'
import { isHard, recordAnswer, sectionSummary } from './lib/wordStats.js'
import { dateKey } from './lib/activity.js'
import {
  adminLogin,
  adminLogout,
  fetchAllItems,
  fetchListening,
  fetchOverview,
  fetchRandomTest,
  fetchSection,
  fetchUnit,
  openUser as apiOpenUser,
  userPath,
  wordPath,
} from './lib/api.js'
import { userKey } from './lib/userKey.js'
import {
  cached,
  createQueue,
  getAdminToken,
  getCurrentUser,
  hasPendingOps,
  readCache,
  setAdminToken,
  setCurrentUser,
  writeCache,
} from './lib/sync.js'
import Login from './components/Login.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import Home from './components/Home.jsx'
import CreateUnit from './components/CreateUnit.jsx'
import UnitDetail from './components/UnitDetail.jsx'
import Flashcards from './components/Flashcards.jsx'
import Quiz from './components/Quiz.jsx'
import WritingTest from './components/WritingTest.jsx'
import Settings from './components/Settings.jsx'
import Listening from './components/Listening.jsx'
import { findListeningSet, listeningSetsForUnit } from './data/listening.js'

// Dữ liệu người dùng nằm trên máy chủ, chia nhỏ theo unit / phần (server/store.js).
// Trình duyệt chỉ giữ những gì đã tải:
//   units     = MỤC LỤC: [{ id, name, sections: [{ id, name, total, known, hard }] }]
//               (tải khi đăng nhập; số đếm cập nhật tại chỗ khi học)
//   words     = từ đã tải, khóa `unitId/sectionId/wordId` -> word (kèm `known`, `stats`)
//   loaded    = phần đã tải trọn vẹn: khóa `unitId/sectionId` -> [wordId] theo thứ tự
//   listening = tiến độ nghe (tải khi mở bài nghe; xem lib/listeningProgress.js)
// Mỗi thay đổi (đánh dấu từ, trả lời, nộp bài nghe...) áp dụng ngay tại chỗ rồi
// xếp vào hàng đợi gửi lên máy chủ (lib/sync.js).
const emptyStore = (units) => ({ units, words: {}, loaded: {}, listening: null })

const sKey = (unitId, sectionId) => `${unitId}/${sectionId}`
const wKey = (unitId, sectionId, wordId) => `${unitId}/${sectionId}/${wordId}`
const itemKey = (item) => wKey(item.unitId, item.sectionId, item.word.id)
// item: { unitId, sectionId, word } — đơn vị đi qua mọi màn học / kiểm tra
const toItems = (unitId, sectionId, words) => words.map((word) => ({ unitId, sectionId, word }))

// Đưa danh sách từ (của một phần hoặc một đề) vào store; `full` = đây là trọn
// vẹn phần đó (ghi thứ tự vào `loaded`)
function mergeItems(s, items, full = null) {
  const words = { ...s.words }
  for (const it of items) words[itemKey(it)] = it.word
  const loaded = full ? { ...s.loaded, [sKey(full.unitId, full.sectionId)]: items.map((it) => it.word.id) } : s.loaded
  return { ...s, words, loaded }
}

// Cộng chênh lệch số đếm vào mục lục
function bumpSummary(units, unitId, sectionId, delta) {
  return units.map((u) =>
    u.id !== unitId
      ? u
      : {
          ...u,
          sections: u.sections.map((sec) =>
            sec.id !== sectionId
              ? sec
              : {
                  ...sec,
                  total: sec.total + (delta.total || 0),
                  known: sec.known + (delta.known || 0),
                  hard: sec.hard + (delta.hard || 0),
                },
          ),
        },
  )
}

// view shapes:
//   { name: 'home' } | { name: 'create' } | { name: 'settings' }
//   { name: 'unit', unitId, sectionId? }   sectionId = phần đang mở trong unit
//   { name: 'flashcards' | 'quiz' | 'writing', deck, pool, title, startAt?, back? }
//       back = màn quay về khi bấm Thoát (unit/phần vừa học); không có -> trang chủ
//       deck/pool = [{ unitId, sectionId, wordId }], từ được tra sống trong store
//       pool = toàn bộ từ của phần gốc (để "xáo trộn làm lại" phủ hết cả phần)
//       startAt = vị trí thẻ mở đầu (bấm vào một từ trong danh sách)
//   { name: 'listening', setId, unitId }   bài luyện nghe (điền từ vào script)
export default function App() {
  // session: { status: 'boot' | 'login' | 'loading' | 'ready' | 'error' | 'admin',
  //            name?, key?, message?, token? }
  const [session, setSession] = useState({ status: 'boot' })
  const [store, setStore] = useState(null)
  const [syncStatus, setSyncStatus] = useState('saved') // 'saving' | 'saved' | 'offline'
  const [view, setView] = useState({ name: 'home' })
  const [busy, setBusy] = useState(false) // đang tải từ cho một màn học
  const [notice, setNotice] = useState(null) // lỗi tải gần nhất (hiện ở trang chủ / unit)
  const queueRef = useRef(null)
  const storeRef = useRef(null) // bản mới nhất của store cho các hàm async
  const loadSeqRef = useRef(0) // bỏ qua kết quả của lượt tải cũ nếu người dùng đổi tên giữa chừng
  storeRef.current = store

  // mở app: tab này đang ở bảng điều khiển quản trị thì vào lại đó; đã nhớ tên
  // người học trên trình duyệt này thì vào thẳng; không thì hỏi tên
  useEffect(() => {
    const token = getAdminToken()
    const name = getCurrentUser()
    if (token) setSession({ status: 'admin', token })
    else if (name) openUser(name)
    else setSession({ status: 'login' })
    return () => queueRef.current?.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Quản trị viên: gõ tên "admin" + mật khẩu ở màn đăng nhập. Máy chủ kiểm tra
  // mật khẩu và cấp token; sai thì ném lỗi (status 401) để Login hiện thông báo.
  async function openAdmin(password) {
    const result = await adminLogin(password)
    // 404 = API đang chạy là bản cũ, chưa có endpoint quản trị
    if (!result?.token) {
      throw new Error('máy chủ tiến độ đang chạy bản cũ, hãy khởi động lại API (update-vps.bat / restart-api.bat)')
    }
    setAdminToken(result.token)
    setSession({ status: 'admin', token: result.token })
  }

  // `message` (tùy chọn): lý do bị đưa về màn đăng nhập, vd. token hết hạn
  function closeAdmin(message) {
    const token = session.token
    setAdminToken(null)
    setSession({ status: 'login', message })
    if (token) adminLogout(token).catch(() => {})
  }

  async function openUser(name) {
    const key = userKey(name)
    const seq = ++loadSeqRef.current
    setSession({ status: 'loading', name })
    queueRef.current?.dispose()
    queueRef.current = null

    // thay đổi còn dồn từ lần trước (đóng tab khi chưa kịp gửi) -> gửi trước
    const queue = createQueue({ key, onStatus: setSyncStatus })
    if (hasPendingOps(key)) await queue.flush()
    if (seq !== loadSeqRef.current) {
      queue.dispose()
      return
    }

    let overview
    let offline
    try {
      ;({ data: overview, offline } = await cached(key, 'overview', () => apiOpenUser(key, name)))
    } catch (err) {
      queue.dispose()
      if (seq !== loadSeqRef.current) return
      setSession({
        status: 'error',
        name,
        message: err.status
          ? `Máy chủ tiến độ báo lỗi: ${err.message}`
          : 'Không kết nối được máy chủ tiến độ và trình duyệt này chưa có dữ liệu của tên này.',
      })
      return
    }
    if (seq !== loadSeqRef.current) {
      queue.dispose()
      return
    }
    if (!overview) {
      // 404: API đang chạy là bản cũ, chưa có endpoint mới
      queue.dispose()
      setSession({ status: 'error', name, message: 'Máy chủ tiến độ đang chạy bản cũ, hãy khởi động lại API (update-vps.bat).' })
      return
    }

    queueRef.current = queue
    setSyncStatus(offline ? 'offline' : queue.hasPending() ? 'saving' : 'saved')
    setStore(emptyStore(overview.units))
    setView({ name: 'home' })
    setNotice(null)
    setCurrentUser(overview.name)
    setSession({ status: 'ready', name: overview.name, key })
  }

  function logout() {
    queueRef.current?.flush()
    queueRef.current?.dispose()
    queueRef.current = null
    setCurrentUser(null)
    setStore(null)
    setView({ name: 'home' })
    setSession({ status: 'login' })
  }

  const key = session.key
  const push = (op) => queueRef.current?.push(op)

  // Tải lại mục lục (số đếm) từ máy chủ — chỉ khi không còn thay đổi chờ gửi,
  // để không ghi đè số đếm vừa cập nhật tại chỗ
  async function refreshOverview() {
    if (!key || queueRef.current?.hasPending()) return
    try {
      const ov = await fetchOverview(key)
      if (ov && storeRef.current) {
        writeCache(key, 'overview', ov)
        setStore((s) => (s ? { ...s, units: ov.units } : s))
      }
    } catch {
      // mất mạng: giữ mục lục đang có
    }
  }

  // ---------- tải từ ----------
  // Từ của một phần (tải một lần, sau đó lấy trong store); mất mạng thì dùng bản đệm
  async function loadSection(unitId, sectionId) {
    const s = storeRef.current
    const ids = s?.loaded[sKey(unitId, sectionId)]
    if (ids) return ids.map((id) => ({ unitId, sectionId, word: s.words[wKey(unitId, sectionId, id)] }))
    const { data } = await cached(key, `sec:${sKey(unitId, sectionId)}`, () => fetchSection(key, unitId, sectionId))
    if (!data) throw new Error('Phần này không còn trên máy chủ')
    const items = toItems(unitId, sectionId, data.words)
    setStore((st) => mergeItems(st, items, { unitId, sectionId }))
    return items
  }

  // Toàn bộ từ của một unit (mọi phần)
  async function loadUnit(unitId) {
    const s = storeRef.current
    const unit = s.units.find((u) => u.id === unitId)
    if (!unit) throw new Error('Không tìm thấy unit')
    const missing = unit.sections.filter((sec) => !s.loaded[sKey(unitId, sec.id)])
    if (missing.length === 0) return unit.sections.flatMap((sec) => sectionItems(s, unitId, sec.id))
    if (missing.length === 1) {
      await loadSection(unitId, missing[0].id)
      return loadUnit(unitId)
    }
    let full
    try {
      full = await fetchUnit(key, unitId)
      if (!full) throw new Error('Unit này không còn trên máy chủ')
      for (const sec of full.sections) writeCache(key, `sec:${sKey(unitId, sec.id)}`, { words: sec.words })
    } catch (err) {
      if (err.status) throw err
      // mất mạng: gom từ bản đệm của từng phần
      full = {
        sections: unit.sections.map((sec) => {
          const c = readCache(key, `sec:${sKey(unitId, sec.id)}`)
          if (!c) throw err
          return { id: sec.id, words: c.words }
        }),
      }
    }
    const bySection = full.sections.map((sec) => ({ sectionId: sec.id, items: toItems(unitId, sec.id, sec.words) }))
    setStore((st) => bySection.reduce((next, b) => mergeItems(next, b.items, { unitId, sectionId: b.sectionId }), st))
    return bySection.flatMap((b) => b.items)
  }

  function sectionItems(s, unitId, sectionId) {
    const ids = s.loaded[sKey(unitId, sectionId)]
    if (!ids) return null
    return ids.map((id) => ({ unitId, sectionId, word: s.words[wKey(unitId, sectionId, id)] }))
  }

  // Từ của mọi unit (học tổng hợp) / đề ngẫu nhiên do máy chủ bốc
  async function loadAll({ unknownOnly = false } = {}) {
    const items = await fetchAllItems(key, { unknownOnly })
    setStore((st) => mergeItems(st, items))
    return items
  }

  async function loadRandomTest() {
    const items = await fetchRandomTest(key)
    setStore((st) => mergeItems(st, items))
    return items
  }

  async function loadListening() {
    if (storeRef.current?.listening) return
    const { data } = await cached(key, 'listening', () => fetchListening(key))
    setStore((st) => ({ ...st, listening: data || {} }))
  }

  // Chạy một lượt tải rồi mở màn học; lỗi thì hiện thông báo thay vì treo
  async function withItems(load, then) {
    setBusy(true)
    setNotice(null)
    try {
      then(await load())
    } catch (err) {
      setNotice(`Không tải được từ: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  // ---------- thay đổi dữ liệu ----------
  const today = () => dateKey()

  // Sửa tại chỗ một từ đã tải + cập nhật số đếm trong mục lục
  function applyWord(item, next) {
    setStore((s) => {
      const k = itemKey(item)
      const prev = s.words[k] || item.word
      const delta = { known: (next.known ? 1 : 0) - (prev.known ? 1 : 0), hard: (isHard(next.stats) ? 1 : 0) - (isHard(prev.stats) ? 1 : 0) }
      return { ...s, words: { ...s.words, [k]: next }, units: bumpSummary(s.units, item.unitId, item.sectionId, delta) }
    })
  }

  // Đánh dấu thuộc / chưa thuộc (flashcard, ô tick) hoặc đổi ảnh: { known } | { seed }
  function updateWord(item, patch) {
    const prev = storeRef.current.words[itemKey(item)] || item.word
    applyWord(item, { ...prev, ...patch })
    push({ method: 'PATCH', path: wordPath(key, item.unitId, item.sectionId, item.word.id), body: { ...patch, day: today() } })
  }

  // Trả lời trong bài kiểm tra (trắc nghiệm / viết): cờ thuộc + thống kê đúng/sai
  function answerWord(item, correct) {
    const prev = storeRef.current.words[itemKey(item)] || item.word
    applyWord(item, { ...prev, known: correct, stats: recordAnswer(prev.stats, correct) })
    push({ method: 'PATCH', path: wordPath(key, item.unitId, item.sectionId, item.word.id), body: { answer: correct, day: today() } })
  }

  function deleteWord(item) {
    setStore((s) => {
      const k = itemKey(item)
      const w = s.words[k]
      const words = { ...s.words }
      delete words[k]
      const lk = sKey(item.unitId, item.sectionId)
      const loaded = s.loaded[lk] ? { ...s.loaded, [lk]: s.loaded[lk].filter((id) => id !== item.word.id) } : s.loaded
      const delta = { total: -1, known: w?.known ? -1 : 0, hard: isHard(w?.stats) ? -1 : 0 }
      return { ...s, words, loaded, units: bumpSummary(s.units, item.unitId, item.sectionId, delta) }
    })
    push({ method: 'DELETE', path: wordPath(key, item.unitId, item.sectionId, item.word.id) })
  }

  // unit mới từ CreateUnit: { id, name, createdAt, sections: [{ id, name, words }] }
  function addUnit(unit) {
    const entry = {
      id: unit.id,
      name: unit.name,
      createdAt: unit.createdAt,
      sections: unit.sections.map((sec) => ({ id: sec.id, name: sec.name, ...sectionSummary(sec.words) })),
    }
    setStore((s) => {
      let next = { ...s, units: [...s.units, entry] }
      for (const sec of unit.sections) next = mergeItems(next, toItems(unit.id, sec.id, sec.words), { unitId: unit.id, sectionId: sec.id })
      return next
    })
    push({ method: 'PUT', path: `${userPath(key)}/units/${encodeURIComponent(unit.id)}`, body: unit })
    setView({ name: 'unit', unitId: unit.id })
  }

  function renameUnit(unitId, name) {
    setStore((s) => ({ ...s, units: s.units.map((u) => (u.id !== unitId ? u : { ...u, name })) }))
    push({ method: 'PATCH', path: `${userPath(key)}/units/${encodeURIComponent(unitId)}`, body: { name } })
  }

  function recordListening(exerciseId, levelId, correct, total) {
    setStore((s) => ({ ...s, listening: recordListeningResult(s.listening || {}, exerciseId, levelId, correct, total) }))
    push({
      method: 'POST',
      path: `${userPath(key)}/listening/${encodeURIComponent(exerciseId)}/${encodeURIComponent(levelId)}`,
      body: { correct, total, day: today() },
    })
  }

  if (session.status === 'boot') return null
  if (session.status === 'login') {
    return <Login onLogin={openUser} onAdminLogin={openAdmin} error={session.message} />
  }
  if (session.status === 'admin') return <AdminDashboard token={session.token} onLogout={closeAdmin} />
  if (session.status === 'loading') {
    return (
      <div className="page">
        <div className="card empty">
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          Đang tải tiến độ của <b>{session.name}</b>…
        </div>
      </div>
    )
  }
  if (session.status === 'error') {
    return (
      <div className="page">
        <div className="card empty">
          <p className="err-note">⚠️ {session.message}</p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => openUser(session.name)}>
              🔄 Thử lại
            </button>
            <button className="btn btn-outline" onClick={logout}>
              Nhập tên khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { units } = store

  // Tra sống các từ của một đề từ store (để cờ thuộc / thống kê luôn mới)
  function resolveDeck(deck) {
    return deck
      .map(({ unitId, sectionId, wordId }) => {
        const word = store.words[wKey(unitId, sectionId, wordId)]
        return word ? { unitId, sectionId, word } : null
      })
      .filter(Boolean)
  }

  // `pool` = toàn bộ từ của "phần đang học" (unit/phần gốc). Nó đi kèm suốt các
  // bước con (học lại từ sai, kiểm tra lại...) để nút "xáo trộn làm lại" có thể
  // kiểm tra lại TẤT CẢ các từ trong phần đó, chứ không chỉ nhóm nhỏ đang mở.
  // Nếu không truyền pool thì mặc định lấy chính danh sách từ đang học.
  const toDeck = (items) => items.map(({ unitId, sectionId, word }) => ({ unitId, sectionId, wordId: word.id }))

  // Màn quay về khi thoát: suy ra từ các từ đang học — cùng một phần -> mở lại
  // đúng phần đó, cùng unit -> trang unit, còn lại (nhiều unit / bốc ngẫu nhiên) -> trang chủ
  function backOf(items) {
    if (!items.length) return undefined
    const { unitId, sectionId } = items[0]
    if (!items.every((it) => it.unitId === unitId)) return undefined
    const sameSection = items.every((it) => it.sectionId === sectionId)
    return { name: 'unit', unitId, sectionId: sameSection ? sectionId : undefined }
  }

  // `round` để React dựng lại Flashcards (về thẻ đầu / thẻ `startAt`) mỗi lần bắt đầu
  function startFlashcards(items, title, pool, startAt = 0) {
    setView({
      name: 'flashcards',
      deck: toDeck(items),
      pool: toDeck(pool ?? items),
      title,
      startAt,
      round: Date.now(),
      back: backOf(pool ?? items),
    })
  }

  function startQuiz(items, title, pool) {
    setView({ name: 'quiz', deck: toDeck(items), pool: toDeck(pool ?? items), title, back: backOf(pool ?? items) })
  }

  function startWriting(items, title, pool) {
    setView({ name: 'writing', deck: toDeck(items), pool: toDeck(pool ?? items), title, back: backOf(pool ?? items) })
  }

  // Đề ngẫu nhiên: máy chủ bốc lại cả số câu lẫn từ mỗi lần; `random` đánh dấu để
  // nút "kiểm tra lại" bốc đề mới thay vì xáo trộn lại đúng bộ từ cũ, `round` để
  // React dựng lại Quiz với bộ câu hỏi mới.
  function startRandomTest() {
    withItems(loadRandomTest, (items) =>
      setView({
        name: 'quiz',
        deck: toDeck(items),
        pool: toDeck(items),
        title: `🎲 Kiểm tra ngẫu nhiên (${items.length} từ)`,
        random: true,
        round: Date.now(),
      }),
    )
  }

  function goHome() {
    setView({ name: 'home' })
    refreshOverview()
  }

  // thoát khỏi màn học: về unit/phần vừa học nếu biết, không thì về trang chủ
  function exitStudy() {
    setView(view.back ?? { name: 'home' })
    refreshOverview()
  }

  const studyProps = { onStartFlashcards: startFlashcards, onStartQuiz: startQuiz, onStartWriting: startWriting }
  const currentUnit = view.unitId ? units.find((u) => u.id === view.unitId) : null

  return (
    <div className="app">
      {view.name === 'home' && (
        <Home
          units={units}
          userName={session.name}
          syncStatus={syncStatus}
          busy={busy}
          notice={notice}
          onLogout={logout}
          onCreate={() => setView({ name: 'create' })}
          onOpenUnit={(unitId) => setView({ name: 'unit', unitId })}
          onOpenSettings={() => setView({ name: 'settings' })}
          onRandomTest={startRandomTest}
          onStudyUnknown={() =>
            withItems(
              () => loadAll({ unknownOnly: true }),
              (items) => startFlashcards(items, '🔥 Học từ chưa thuộc'),
            )
          }
          onQuizAll={() => withItems(loadAll, (items) => startQuiz(items, '📝 Kiểm tra tổng hợp'))}
          onWritingAll={() => withItems(loadAll, (items) => startWriting(items, '✍️ Kiểm tra viết tổng hợp'))}
          onUnitStudy={(unitId, start) => withItems(() => loadUnit(unitId), start)}
          {...studyProps}
        />
      )}
      {view.name === 'settings' && <Settings onBack={goHome} />}
      {view.name === 'create' && <CreateUnit onSave={addUnit} onCancel={goHome} />}
      {view.name === 'unit' && (
        <UnitDetail
          unit={currentUnit}
          initialSection={view.sectionId}
          getSection={(sectionId) => sectionItems(store, view.unitId, sectionId)}
          loadSection={(sectionId) => loadSection(view.unitId, sectionId)}
          loadUnit={() => loadUnit(view.unitId)}
          onBack={goHome}
          onDeleteWord={deleteWord}
          onUpdateWord={updateWord}
          onRename={renameUnit}
          listeningSets={listeningSetsForUnit(currentUnit)}
          onOpenListening={(set) =>
            withItems(loadListening, () => setView({ name: 'listening', setId: set.id, unitId: view.unitId }))
          }
          busy={busy}
          notice={notice}
          {...studyProps}
        />
      )}
      {view.name === 'listening' && (
        <Listening
          set={findListeningSet(view.setId)}
          progress={store.listening || {}}
          onResult={recordListening}
          onExit={() => setView({ name: 'unit', unitId: view.unitId })}
        />
      )}
      {view.name === 'flashcards' && (
        <Flashcards
          key={view.round}
          items={resolveDeck(view.deck)}
          pool={view.pool ? resolveDeck(view.pool) : undefined}
          title={view.title}
          startIndex={view.startAt}
          onUpdateWord={updateWord}
          onExit={exitStudy}
          onStartQuiz={startQuiz}
          onStartWriting={startWriting}
          onRestart={(items, title, pool) => startFlashcards(items, title, pool)}
        />
      )}
      {view.name === 'quiz' && (
        <Quiz
          key={view.round}
          items={resolveDeck(view.deck)}
          pool={view.pool ? resolveDeck(view.pool) : undefined}
          title={view.title}
          onAnswer={answerWord}
          onExit={exitStudy}
          onStartFlashcards={startFlashcards}
          onStartWriting={startWriting}
          onRestart={view.random ? startRandomTest : undefined}
        />
      )}
      {view.name === 'writing' && (
        <WritingTest
          items={resolveDeck(view.deck)}
          pool={view.pool ? resolveDeck(view.pool) : undefined}
          title={view.title}
          onAnswer={answerWord}
          onExit={exitStudy}
          onStartFlashcards={startFlashcards}
          onStartQuiz={startQuiz}
        />
      )}
    </div>
  )
}

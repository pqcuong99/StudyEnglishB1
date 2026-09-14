import { useEffect, useRef, useState } from 'react'
import { normalizeUnits, takeLegacyUnits } from './lib/storage.js'
import { takeLegacyListeningProgress, recordListeningResult } from './lib/listeningProgress.js'
import { recordAnswer } from './lib/wordStats.js'
import { bumpActivity } from './lib/activity.js'
import { adminLogin, adminLogout, fetchUser } from './lib/api.js'
import { userKey } from './lib/userKey.js'
import {
  createSaver,
  getAdminToken,
  getCurrentUser,
  readCache,
  setAdminToken,
  setCurrentUser,
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

// Dữ liệu của một người dùng (lưu trên máy chủ, đệm trong trình duyệt):
//   { units, listening, wordStats, activity }
//   units     = các unit + từ (kèm cờ `known`)
//   listening = tiến độ luyện nghe (xem lib/listeningProgress.js)
//   wordStats = thống kê đúng/sai từng từ (xem lib/wordStats.js)
//   activity  = số câu trả lời / từ đánh dấu thuộc / bài nghe theo từng ngày
//               (xem lib/activity.js) — bảng điều khiển quản trị dùng để báo cáo
function makeStore(data) {
  const obj = (v) => (v && typeof v === 'object' ? v : {})
  return {
    units: normalizeUnits(data?.units),
    listening: obj(data?.listening),
    wordStats: obj(data?.wordStats),
    activity: obj(data?.activity),
  }
}

// view shapes:
//   { name: 'home' }
//   { name: 'create' }
//   { name: 'unit', unitId }
//   { name: 'flashcards', deck, pool, title }   deck/pool = [{unitId, wordId}]
//   { name: 'quiz', deck, pool, title }
//   { name: 'writing', deck, pool, title }
//   { name: 'listening', setId, unitId }     bài luyện nghe (điền từ vào script)
//   pool = toàn bộ từ của phần gốc (để "xáo trộn làm lại" phủ hết cả phần)
export default function App() {
  // session: { status: 'boot' | 'login' | 'loading' | 'ready' | 'error' | 'admin',
  //            name?, key?, message?, token? }
  const [session, setSession] = useState({ status: 'boot' })
  const [store, setStore] = useState(null)
  const [syncStatus, setSyncStatus] = useState('saved') // 'saving' | 'saved' | 'offline'
  const [view, setView] = useState({ name: 'home' })
  const saverRef = useRef(null)
  const lastSavedRef = useRef('') // JSON của bản đã lưu (hoặc vừa tải) để không lưu thừa
  const loadSeqRef = useRef(0) // bỏ qua kết quả của lượt tải cũ nếu người dùng đổi tên giữa chừng

  // mở app: tab này đang ở bảng điều khiển quản trị thì vào lại đó; đã nhớ tên
  // người học trên trình duyệt này thì vào thẳng; không thì hỏi tên
  useEffect(() => {
    const token = getAdminToken()
    const name = getCurrentUser()
    if (token) setSession({ status: 'admin', token })
    else if (name) openUser(name)
    else setSession({ status: 'login' })
    return () => saverRef.current?.dispose()
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
    saverRef.current?.dispose()
    saverRef.current = null

    let doc = null
    let offline = false
    try {
      doc = await fetchUser(key)
    } catch {
      offline = true
    }
    if (seq !== loadSeqRef.current) return
    const cached = readCache(key)

    let data = null
    let displayName = name
    let mustPush = false // bản đang dùng chưa có trên máy chủ -> đẩy lên ngay
    if (offline) {
      if (!cached) {
        setSession({
          status: 'error',
          name,
          message: 'Không kết nối được máy chủ tiến độ và trình duyệt này chưa có dữ liệu của tên này.',
        })
        return
      }
      data = cached
    } else if (doc) {
      displayName = doc.name
      // lần trước đóng tab khi chưa kịp lưu -> bản đệm trong máy mới hơn bản máy chủ
      const cacheNewer = cached && (cached.updatedAt || 0) > (doc.data?.updatedAt || 0)
      data = cacheNewer ? cached : doc.data
      mustPush = !!cacheNewer
    } else {
      // người dùng mới: kế thừa dữ liệu của bản cũ (trước khi có đăng nhập) nếu
      // trình duyệt này còn giữ, không thì bắt đầu với unit mẫu
      const legacyUnits = takeLegacyUnits()
      const legacyListening = takeLegacyListeningProgress()
      data = cached || (legacyUnits ? { units: legacyUnits, listening: legacyListening } : null)
      mustPush = true
    }

    const next = makeStore(data)
    lastSavedRef.current = JSON.stringify(next)
    saverRef.current = createSaver({ key, name: displayName, onStatus: setSyncStatus })
    setSyncStatus(offline ? 'offline' : 'saved')
    setStore(next)
    setView({ name: 'home' })
    setCurrentUser(displayName)
    setSession({ status: 'ready', name: displayName, key })
    if (mustPush) saverRef.current.schedule({ ...next, updatedAt: Date.now() }, 0)
  }

  // mọi thay đổi dữ liệu -> đệm trong máy + lưu lên máy chủ (gộp, tự thử lại)
  useEffect(() => {
    if (session.status !== 'ready' || !store || !saverRef.current) return
    const json = JSON.stringify(store)
    if (json === lastSavedRef.current) return
    lastSavedRef.current = json
    saverRef.current.schedule({ ...store, updatedAt: Date.now() })
  }, [store, session.status])

  function logout() {
    saverRef.current?.flush()
    saverRef.current?.dispose()
    saverRef.current = null
    setCurrentUser(null)
    setStore(null)
    setView({ name: 'home' })
    setSession({ status: 'login' })
  }

  const setUnits = (fn) => setStore((s) => ({ ...s, units: typeof fn === 'function' ? fn(s.units) : fn }))

  function addUnit(unit) {
    setUnits((us) => [...us, unit])
    setView({ name: 'unit', unitId: unit.id })
  }

  function appendWords(unitId, words) {
    setUnits((us) => us.map((u) => (u.id !== unitId ? u : { ...u, words: [...u.words, ...words] })))
    setView({ name: 'unit', unitId })
  }

  function deleteUnit(unitId) {
    setUnits((us) => us.filter((u) => u.id !== unitId))
    setView({ name: 'home' })
  }

  // Sửa một từ. Đánh dấu thuộc/chưa thuộc (flashcard, ô tick ở trang unit) được
  // ghi vào nhật ký ngày: mỗi lần đánh dấu là một lượt ôn, chưa thuộc -> thuộc
  // tính là một từ mới học được.
  function updateWord(unitId, wordId, patch) {
    setStore((s) => {
      let learned = 0
      const units = s.units.map((u) =>
        u.id !== unitId
          ? u
          : {
              ...u,
              words: u.words.map((w) => {
                if (w.id !== wordId) return w
                if ('known' in patch && patch.known && !w.known) learned = 1
                return { ...w, ...patch }
              }),
            },
      )
      if (!('known' in patch)) return { ...s, units }
      return { ...s, units, activity: bumpActivity(s.activity, { reviews: 1, learned }) }
    })
  }

  // Trả lời trong bài kiểm tra (trắc nghiệm / viết): cập nhật cờ thuộc/chưa
  // thuộc và ghi thống kê đúng/sai để tìm ra các từ hay sai.
  function answerWord(unitId, wordId, correct) {
    setStore((s) => ({
      ...s,
      units: s.units.map((u) =>
        u.id !== unitId
          ? u
          : { ...u, words: u.words.map((w) => (w.id !== wordId ? w : { ...w, known: correct })) },
      ),
      wordStats: recordAnswer(s.wordStats, wordId, correct),
      activity: bumpActivity(s.activity, { answers: 1, correct: correct ? 1 : 0 }),
    }))
  }

  function recordListening(exerciseId, levelId, correct, total) {
    setStore((s) => ({
      ...s,
      listening: recordListeningResult(s.listening, exerciseId, levelId, correct, total),
      activity: bumpActivity(s.activity, { listening: 1, listeningDone: correct === total ? 1 : 0 }),
    }))
  }

  function deleteWord(unitId, wordId) {
    setUnits((us) =>
      us.map((u) =>
        u.id !== unitId ? u : { ...u, words: u.words.filter((w) => w.id !== wordId) },
      ),
    )
  }

  function renameUnit(unitId, name) {
    setUnits((us) => us.map((u) => (u.id !== unitId ? u : { ...u, name })))
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

  const { units, listening, wordStats } = store

  // Build a study deck: list of {unitId, word} resolved live from state
  function resolveDeck(deck) {
    const byUnit = new Map(units.map((u) => [u.id, u]))
    return deck
      .map(({ unitId, wordId }) => {
        const u = byUnit.get(unitId)
        const w = u?.words.find((w) => w.id === wordId)
        return w ? { unitId, word: w } : null
      })
      .filter(Boolean)
  }

  // `pool` = toàn bộ từ của "phần đang học" (unit/phần gốc). Nó đi kèm suốt các
  // bước con (học lại từ sai, kiểm tra lại...) để nút "xáo trộn làm lại" có thể
  // kiểm tra lại TẤT CẢ các từ trong phần đó, chứ không chỉ nhóm nhỏ đang mở.
  // Nếu không truyền pool thì mặc định lấy chính danh sách từ đang học.
  const toDeck = (items) => items.map(({ unitId, word }) => ({ unitId, wordId: word.id }))

  function startFlashcards(items, title, pool) {
    setView({ name: 'flashcards', deck: toDeck(items), pool: toDeck(pool ?? items), title })
  }

  function startQuiz(items, title, pool) {
    setView({ name: 'quiz', deck: toDeck(items), pool: toDeck(pool ?? items), title })
  }

  function startWriting(items, title, pool) {
    setView({ name: 'writing', deck: toDeck(items), pool: toDeck(pool ?? items), title })
  }

  const goHome = () => setView({ name: 'home' })

  return (
    <div className="app">
      {view.name === 'home' && (
        <Home
          units={units}
          wordStats={wordStats}
          userName={session.name}
          syncStatus={syncStatus}
          onLogout={logout}
          onCreate={() => setView({ name: 'create' })}
          onOpenUnit={(unitId) => setView({ name: 'unit', unitId })}
          onStartFlashcards={startFlashcards}
          onStartQuiz={startQuiz}
          onStartWriting={startWriting}
          onOpenSettings={() => setView({ name: 'settings' })}
        />
      )}
      {view.name === 'settings' && <Settings onBack={goHome} />}
      {view.name === 'create' && (
        <CreateUnit
          onSave={addUnit}
          onAppend={appendWords}
          appendTo={view.appendTo ? units.find((u) => u.id === view.appendTo) : null}
          onCancel={view.appendTo ? () => setView({ name: 'unit', unitId: view.appendTo }) : goHome}
        />
      )}
      {view.name === 'unit' && (
        <UnitDetail
          unit={units.find((u) => u.id === view.unitId)}
          wordStats={wordStats}
          onBack={goHome}
          onDeleteUnit={deleteUnit}
          onDeleteWord={deleteWord}
          onUpdateWord={updateWord}
          onRename={renameUnit}
          onStartFlashcards={startFlashcards}
          onStartQuiz={startQuiz}
          onStartWriting={startWriting}
          onImportMore={() => setView({ name: 'create', appendTo: view.unitId })}
          listeningSets={listeningSetsForUnit(units.find((u) => u.id === view.unitId))}
          onOpenListening={(set) => setView({ name: 'listening', setId: set.id, unitId: view.unitId })}
        />
      )}
      {view.name === 'listening' && (
        <Listening
          set={findListeningSet(view.setId)}
          progress={listening}
          onResult={recordListening}
          onExit={() => setView({ name: 'unit', unitId: view.unitId })}
        />
      )}
      {view.name === 'flashcards' && (
        <Flashcards
          items={resolveDeck(view.deck)}
          pool={view.pool ? resolveDeck(view.pool) : undefined}
          title={view.title}
          onUpdateWord={updateWord}
          onExit={goHome}
          onStartQuiz={startQuiz}
          onStartWriting={startWriting}
          onRestart={(items, title, pool) => startFlashcards(items, title, pool)}
        />
      )}
      {view.name === 'quiz' && (
        <Quiz
          items={resolveDeck(view.deck)}
          pool={view.pool ? resolveDeck(view.pool) : undefined}
          title={view.title}
          onAnswer={answerWord}
          onExit={goHome}
          onStartFlashcards={startFlashcards}
          onStartWriting={startWriting}
        />
      )}
      {view.name === 'writing' && (
        <WritingTest
          items={resolveDeck(view.deck)}
          pool={view.pool ? resolveDeck(view.pool) : undefined}
          title={view.title}
          onAnswer={answerWord}
          onExit={goHome}
          onStartFlashcards={startFlashcards}
          onStartQuiz={startQuiz}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import { randomSeed } from '../lib/image.js'
import { speak } from '../lib/speech.js'
import WordImage from './WordImage.jsx'
import { MASTER_STREAK, isHard } from '../lib/wordStats.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Gom từ theo phần (giữ thứ tự xuất hiện). Từ không có tên phần được xếp
// vào nhóm "Từ khác" ở cuối. Unit không chia phần -> trả về [] để hiển thị
// một danh sách phẳng như cũ.
function groupBySection(words) {
  const map = new Map()
  for (const w of words) {
    const key = w.section || ''
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(w)
  }
  const named = [...map.entries()].filter(([name]) => name)
  if (named.length === 0) return []
  const groups = named.map(([name, ws]) => ({ name, words: ws }))
  if (map.has('')) groups.push({ name: 'Từ khác', words: map.get('') })
  return groups
}

function Stats({ words }) {
  const known = words.filter((w) => w.known).length
  return (
    <>
      <p>
        <b>{words.length}</b> từ · đã thuộc <b>{known}</b> · chưa thuộc{' '}
        <b>{words.length - known}</b>
      </p>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${words.length ? (known / words.length) * 100 : 0}%` }}
        />
      </div>
    </>
  )
}

// Bộ nút học/kiểm tra dùng chung cho cả unit lẫn từng phần
function StudyButtons({
  label,
  items,
  size,
  onStartFlashcards,
  onStartQuiz,
  onStartWriting,
}) {
  const unknownItems = items.filter(({ word }) => !word.known)
  const sm = size === 'sm' ? ' btn-sm' : ''
  return (
    <div className="btn-row">
      <button
        className={`btn btn-primary${sm}`}
        disabled={items.length === 0}
        onClick={() => onStartFlashcards(items, `🃏 ${label}`)}
      >
        🃏 Học flashcard
      </button>
      <button
        className={`btn btn-warning${sm}`}
        disabled={unknownItems.length === 0}
        onClick={() => onStartFlashcards(unknownItems, `🔥 Từ chưa thuộc – ${label}`, items)}
      >
        🔥 Học từ chưa thuộc ({unknownItems.length})
      </button>
      <button
        className={`btn btn-outline${sm}`}
        disabled={items.length < 2}
        onClick={() => onStartQuiz(shuffle(items), `📝 ${label}`)}
      >
        📝 Kiểm tra
      </button>
      <button
        className={`btn btn-outline${sm}`}
        disabled={items.length === 0}
        onClick={() => onStartWriting(shuffle(items), `✍️ ${label}`)}
      >
        ✍️ Kiểm tra viết
      </button>
    </div>
  )
}

// `stat`: thống kê đúng/sai của từ (lib/wordStats.js) để gắn nhãn "hay sai"
function WordCard({ unitId, w, stat, onUpdateWord, onDeleteWord }) {
  const hard = isHard(stat)
  return (
    <div className={`word-card card ${w.known ? 'is-known' : ''}`}>
      <div className="word-img-wrap">
        <WordImage
          word={w.word}
          meaning={w.meaning}
          seed={w.seed}
          showRefresh
          onNewSeed={() => onUpdateWord(unitId, w.id, { seed: randomSeed() })}
        />
      </div>
      <div className="word-info">
        <div className="word-line">
          <b>{w.word}</b> {w.pos && <span className="pos">({w.pos})</span>}
          <button className="btn-speak" title="Nghe phát âm" onClick={() => speak(w.word)}>
            🔊
          </button>
          {hard && (
            <span
              className="hard-badge"
              title={`Đã sai ${stat.wrong} lần · đúng liên tiếp ${stat.streak}/${MASTER_STREAK}`}
            >
              🔥 hay sai
            </span>
          )}
        </div>
        {w.ipa && <div className="ipa">/{w.ipa}/</div>}
        <div className="meaning">{w.meaning}</div>
      </div>
      <div className="word-actions">
        <label className="known-toggle">
          <input
            type="checkbox"
            checked={!!w.known}
            onChange={(e) => onUpdateWord(unitId, w.id, { known: e.target.checked })}
          />
          Đã thuộc
        </label>
        <button
          className="btn btn-ghost btn-sm"
          title="Xóa từ"
          onClick={() => onDeleteWord(unitId, w.id)}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

export default function UnitDetail({
  unit,
  wordStats = {},
  onBack,
  onDeleteUnit,
  onDeleteWord,
  onUpdateWord,
  onRename,
  onStartFlashcards,
  onStartQuiz,
  onStartWriting,
  listeningSets = [],
  onOpenListening,
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  // tên phần đang mở (null = màn chọn phần)
  const [openSection, setOpenSection] = useState(null)

  if (!unit) {
    return (
      <div className="page">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Quay lại
        </button>
        <p>Không tìm thấy unit này.</p>
      </div>
    )
  }

  const toItems = (words) => words.map((word) => ({ unitId: unit.id, word }))
  const sections = groupBySection(unit.words)
  const studyProps = { onStartFlashcards, onStartQuiz, onStartWriting }
  const cardProps = { unitId: unit.id, onUpdateWord, onDeleteWord }
  const current = openSection ? sections.find((s) => s.name === openSection) : null

  // ---------- màn danh sách từ của một phần ----------
  if (current) {
    return (
      <div className="page">
        <header className="page-header">
          <button className="btn btn-ghost" onClick={() => setOpenSection(null)}>
            ← Chọn phần
          </button>
          <div>
            <h1>{current.name}</h1>
            <p className="part-sub">{unit.name}</p>
          </div>
        </header>

        <div className="card part-card">
          <Stats words={current.words} />
          <StudyButtons
            label={`${current.name} – ${unit.name}`}
            items={toItems(current.words)}
            {...studyProps}
          />
        </div>

        <div className="word-grid">
          {current.words.map((w) => (
            <WordCard key={w.id} w={w} stat={wordStats[w.id]} {...cardProps} />
          ))}
        </div>
      </div>
    )
  }

  // ---------- màn unit: chọn phần (hoặc danh sách phẳng nếu unit không chia phần) ----------
  return (
    <div className="page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Quay lại
        </button>
        {editingName ? (
          <span className="rename-row">
            <input
              className="input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              autoFocus
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (nameDraft.trim()) onRename(unit.id, nameDraft.trim())
                setEditingName(false)
              }}
            >
              Lưu
            </button>
          </span>
        ) : (
          <h1
            title="Bấm để đổi tên"
            className="clickable"
            onClick={() => {
              setNameDraft(unit.name)
              setEditingName(true)
            }}
          >
            {unit.name} ✏️
          </h1>
        )}
      </header>

      {sections.length > 0 && (
        <div className="section-head">
          <h2>Cả unit</h2>
        </div>
      )}

      <div className="card">
        <Stats words={unit.words} />
        <StudyButtons
          label={unit.name}
          items={toItems(unit.words)}
          size={sections.length > 0 ? 'sm' : undefined}
          {...studyProps}
        />
      </div>

      {sections.length > 0 && (
        <>
          <div className="section-head">
            <h2>Chọn phần để học</h2>
            <span className="hint">Bấm vào thẻ để xem danh sách từ của phần</span>
          </div>
          <div className="unit-grid">
            {sections.map((s) => {
              const known = s.words.filter((w) => w.known).length
              const unknown = s.words.filter((w) => !w.known)
              const label = `${s.name} – ${unit.name}`
              const items = toItems(s.words)
              return (
                <div
                  key={s.name}
                  className="unit-card card"
                  onClick={() => setOpenSection(s.name)}
                >
                  <h3>{s.name}</h3>
                  <p className="unit-meta">
                    {s.words.length} từ · đã thuộc {known}/{s.words.length}
                  </p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${s.words.length ? (known / s.words.length) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="btn-row" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onStartFlashcards(items, `🃏 ${label}`)}
                    >
                      🃏 Học
                    </button>
                    <button
                      className="btn btn-warning btn-sm"
                      disabled={unknown.length === 0}
                      onClick={() =>
                        onStartFlashcards(toItems(unknown), `🔥 Từ chưa thuộc – ${label}`, items)
                      }
                    >
                      🔥 Chưa thuộc ({unknown.length})
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={s.words.length < 2}
                      onClick={() => onStartQuiz(shuffle(items), `📝 ${label}`)}
                    >
                      📝 Kiểm tra
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => onStartWriting(shuffle(items), `✍️ ${label}`)}
                    >
                      ✍️ Viết
                    </button>
                  </div>
                  <div className="hint">Xem danh sách từ →</div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {listeningSets.length > 0 && (
        <>
          <div className="section-head">
            <h2>🎧 Luyện nghe</h2>
            <span className="hint">Nghe audio và điền từ bị ẩn trong recording script</span>
          </div>
          <div className="unit-grid">
            {listeningSets.map((set) => (
              <div key={set.id} className="unit-card card listen-set-card" onClick={() => onOpenListening(set)}>
                <h3>🎧 {set.name}</h3>
                <p className="unit-meta">{set.subtitle}</p>
                <p className="unit-meta">
                  {set.exercises.length} bài nghe · 3 mức độ (dễ / trung bình / khó)
                </p>
                <div className="btn-row" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-primary btn-sm" onClick={() => onOpenListening(set)}>
                    🎧 Vào luyện nghe
                  </button>
                </div>
                <div className="hint">Xem danh sách bài nghe →</div>
              </div>
            ))}
          </div>
        </>
      )}

      {sections.length === 0 && (
        <div className="word-grid">
          {unit.words.map((w) => (
            <WordCard key={w.id} w={w} stat={wordStats[w.id]} {...cardProps} />
          ))}
        </div>
      )}

      <div className="danger-zone">
        <button
          className="btn btn-danger-outline"
          onClick={() => {
            if (confirm(`Xóa unit "${unit.name}" và toàn bộ ${unit.words.length} từ?`)) {
              onDeleteUnit(unit.id)
            }
          }}
        >
          🗑️ Xóa unit này
        </button>
      </div>
    </div>
  )
}

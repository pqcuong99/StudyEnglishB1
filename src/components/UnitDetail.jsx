import { useEffect, useState } from 'react'
import { randomSeed } from '../lib/image.js'
import { speak } from '../lib/speech.js'
import WordImage from './WordImage.jsx'
import { MASTER_STREAK, isHard, sectionSummary, shuffle } from '../lib/wordStats.js'

function Stats({ summary }) {
  const { total, known } = summary
  return (
    <>
      <p>
        <b>{total}</b> từ · đã thuộc <b>{known}</b> · chưa thuộc <b>{total - known}</b>
      </p>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${total ? (known / total) * 100 : 0}%` }} />
      </div>
    </>
  )
}

// Bộ nút học/kiểm tra dùng chung cho cả unit lẫn từng phần. Từ chỉ được tải
// khi bấm nút (`load` trả về items), số đếm để bật/tắt nút lấy từ `summary`.
// `short`: nhãn ngắn cho thẻ phần (chỗ hẹp)
function StudyButtons({ label, summary, load, size, short, onStartFlashcards, onStartQuiz, onStartWriting, onError }) {
  const [loading, setLoading] = useState(false)
  const unknown = summary.total - summary.known
  const sm = size === 'sm' ? ' btn-sm' : ''

  async function run(start) {
    setLoading(true)
    try {
      start(await load())
    } catch (err) {
      onError?.(`Không tải được từ: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="btn-row">
      <button
        className={`btn btn-primary${sm}`}
        disabled={loading || summary.total === 0}
        onClick={() => run((items) => onStartFlashcards(items, `🃏 ${label}`))}
      >
        {loading ? '⏳' : '🃏'} {short ? 'Học' : 'Học flashcard'}
      </button>
      <button
        className={`btn btn-warning${sm}`}
        disabled={loading || unknown === 0}
        onClick={() =>
          run((items) =>
            onStartFlashcards(
              items.filter(({ word }) => !word.known),
              `🔥 Từ chưa thuộc – ${label}`,
              items,
            ),
          )
        }
      >
        🔥 {short ? 'Chưa thuộc' : 'Học từ chưa thuộc'} ({unknown})
      </button>
      <button
        className={`btn btn-outline${sm}`}
        disabled={loading || summary.total < 2}
        onClick={() => run((items) => onStartQuiz(shuffle(items), `📝 ${label}`))}
      >
        📝 Kiểm tra
      </button>
      <button
        className={`btn btn-outline${sm}`}
        disabled={loading || summary.total === 0}
        onClick={() => run((items) => onStartWriting(shuffle(items), `✍️ ${label}`))}
      >
        ✍️ {short ? 'Viết' : 'Kiểm tra viết'}
      </button>
    </div>
  )
}

// `item` = { unitId, sectionId, word } — thống kê đúng/sai nằm trong word.stats
function WordCard({ item, onUpdateWord, onDeleteWord }) {
  const w = item.word
  const stat = w.stats
  const hard = isHard(stat)
  return (
    <div className={`word-card card ${w.known ? 'is-known' : ''}`}>
      <div className="word-img-wrap">
        <WordImage
          word={w.word}
          meaning={w.meaning}
          seed={w.seed}
          showRefresh
          onNewSeed={() => onUpdateWord(item, { seed: randomSeed() })}
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
            onChange={(e) => onUpdateWord(item, { known: e.target.checked })}
          />
          Đã thuộc
        </label>
        <button className="btn btn-ghost btn-sm" title="Xóa từ" onClick={() => onDeleteWord(item)}>
          🗑️
        </button>
      </div>
    </div>
  )
}

// Danh sách từ của một phần: tải khi mở (getSection trả null nếu chưa tải)
function WordList({ items, loading, error, onUpdateWord, onDeleteWord }) {
  if (error && !items) return <p className="err-note">⚠️ {error}</p>
  if (!items) {
    return (
      <div className="card empty">
        <div className="spinner" style={{ margin: '0 auto 10px' }} />
        {loading ? 'Đang tải danh sách từ…' : ''}
      </div>
    )
  }
  return (
    <>
      {error && <p className="err-note">⚠️ {error}</p>}
      <div className="word-grid">
        {items.map((it) => (
          <WordCard key={it.word.id} item={it} onUpdateWord={onUpdateWord} onDeleteWord={onDeleteWord} />
        ))}
      </div>
    </>
  )
}

// `unit` là mục lục: { id, name, sections: [{ id, name, total, known, hard }] }.
// Từ của một phần chỉ được tải khi mở phần đó / bấm nút học (loadSection,
// loadUnit); `getSection(sectionId)` trả về từ đã tải hoặc null.
export default function UnitDetail({
  unit,
  getSection,
  loadSection,
  loadUnit,
  busy,
  notice,
  onBack,
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
  // id phần đang mở (null = màn chọn phần)
  const [openSection, setOpenSection] = useState(null)
  const [loadingSection, setLoadingSection] = useState(null)
  const [error, setError] = useState(null)

  const sections = unit?.sections || []
  // unit không chia phần (một phần duy nhất) -> danh sách phẳng ngay trong trang unit
  const flat = sections.length <= 1
  const shownSection = flat ? sections[0]?.id || null : openSection

  // tải từ của phần đang mở (nếu chưa có)
  useEffect(() => {
    if (!unit || !shownSection || getSection(shownSection)) return
    let alive = true
    setLoadingSection(shownSection)
    setError(null)
    loadSection(shownSection)
      .catch((err) => alive && setError(`Không tải được từ: ${err.message}`))
      .finally(() => alive && setLoadingSection(null))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit?.id, shownSection])

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

  // số đếm: phần đã tải thì tính từ danh sách từ (cập nhật tức thì), chưa thì lấy mục lục
  const summaryOf = (s) => {
    const items = getSection(s.id)
    return items ? sectionSummary(items.map((it) => it.word)) : s
  }
  const unitSummary = sections.reduce(
    (acc, s) => {
      const t = summaryOf(s)
      return { total: acc.total + t.total, known: acc.known + t.known }
    },
    { total: 0, known: 0 },
  )
  const studyProps = { onStartFlashcards, onStartQuiz, onStartWriting, onError: setError }
  const listProps = { onUpdateWord, onDeleteWord }
  const current = !flat && openSection ? sections.find((s) => s.id === openSection) : null

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
          <Stats summary={summaryOf(current)} />
          <StudyButtons
            label={`${current.name} – ${unit.name}`}
            summary={summaryOf(current)}
            load={() => loadSection(current.id)}
            {...studyProps}
          />
        </div>

        <WordList
          items={getSection(current.id)}
          loading={loadingSection === current.id}
          error={error}
          {...listProps}
        />
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

      {(notice || (error && flat)) && <p className="err-note">⚠️ {notice || error}</p>}

      {!flat && (
        <div className="section-head">
          <h2>Cả unit</h2>
        </div>
      )}

      <div className="card">
        <Stats summary={unitSummary} />
        <StudyButtons
          label={unit.name}
          summary={unitSummary}
          load={loadUnit}
          size={flat ? undefined : 'sm'}
          {...studyProps}
        />
      </div>

      {!flat && (
        <>
          <div className="section-head">
            <h2>Chọn phần để học</h2>
            <span className="hint">Bấm vào thẻ để xem danh sách từ của phần</span>
          </div>
          <div className="unit-grid">
            {sections.map((s) => {
              const t = summaryOf(s)
              return (
                <div key={s.id} className="unit-card card" onClick={() => setOpenSection(s.id)}>
                  <h3>{s.name}</h3>
                  <p className="unit-meta">
                    {t.total} từ · đã thuộc {t.known}/{t.total}
                    {t.hard > 0 && ` · 🔥 ${t.hard}`}
                  </p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${t.total ? (t.known / t.total) * 100 : 0}%` }} />
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <StudyButtons
                      label={`${s.name} – ${unit.name}`}
                      summary={t}
                      load={() => loadSection(s.id)}
                      size="sm"
                      short
                      {...studyProps}
                    />
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
              <div key={set.id} className="unit-card card listen-set-card" onClick={() => !busy && onOpenListening(set)}>
                <h3>🎧 {set.name}</h3>
                <p className="unit-meta">{set.subtitle}</p>
                <p className="unit-meta">
                  {set.exercises.length} bài nghe · 3 mức độ (dễ / trung bình / khó)
                </p>
                <div className="btn-row" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onOpenListening(set)}>
                    {busy ? '⏳' : '🎧'} Vào luyện nghe
                  </button>
                </div>
                <div className="hint">Xem danh sách bài nghe →</div>
              </div>
            ))}
          </div>
        </>
      )}

      {flat && shownSection && (
        <WordList
          items={getSection(shownSection)}
          loading={loadingSection === shownSection}
          error={null}
          {...listProps}
        />
      )}
    </div>
  )
}

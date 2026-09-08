import { useState } from 'react'
import { randomSeed } from '../lib/image.js'
import { speak } from '../lib/speech.js'
import WordImage from './WordImage.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function UnitDetail({
  unit,
  onBack,
  onDeleteUnit,
  onDeleteWord,
  onUpdateWord,
  onRename,
  onStartFlashcards,
  onStartQuiz,
  onStartWriting,
  onImportMore,
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

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

  const known = unit.words.filter((w) => w.known).length
  const items = unit.words.map((word) => ({ unitId: unit.id, word }))
  const unknownItems = items.filter(({ word }) => !word.known)

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

      <div className="card">
        <p>
          <b>{unit.words.length}</b> từ · đã thuộc <b>{known}</b> · chưa thuộc{' '}
          <b>{unit.words.length - known}</b>
        </p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${unit.words.length ? (known / unit.words.length) * 100 : 0}%` }}
          />
        </div>
        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={() => onStartFlashcards(items, `🃏 ${unit.name}`)}
          >
            🃏 Học flashcard
          </button>
          <button
            className="btn btn-warning"
            disabled={unknownItems.length === 0}
            onClick={() => onStartFlashcards(unknownItems, `🔥 Từ chưa thuộc – ${unit.name}`)}
          >
            🔥 Học từ chưa thuộc ({unknownItems.length})
          </button>
          <button
            className="btn btn-outline"
            disabled={unit.words.length < 2}
            onClick={() => onStartQuiz(shuffle(items), `📝 ${unit.name}`)}
          >
            📝 Kiểm tra
          </button>
          <button
            className="btn btn-outline"
            onClick={() => onStartWriting(shuffle(items), `✍️ ${unit.name}`)}
          >
            ✍️ Kiểm tra viết
          </button>
          <button className="btn btn-outline" onClick={onImportMore}>
            ➕ Import thêm từ
          </button>
        </div>
      </div>

      <div className="word-grid">
        {unit.words.map((w) => (
          <div key={w.id} className={`word-card card ${w.known ? 'is-known' : ''}`}>
            <div className="word-img-wrap">
              <WordImage
                word={w.word}
                meaning={w.meaning}
                seed={w.seed}
                showRefresh
                onNewSeed={() => onUpdateWord(unit.id, w.id, { seed: randomSeed() })}
              />
            </div>
            <div className="word-info">
              <div className="word-line">
                <b>{w.word}</b> {w.pos && <span className="pos">({w.pos})</span>}
                <button className="btn-speak" title="Nghe phát âm" onClick={() => speak(w.word)}>
                  🔊
                </button>
              </div>
              {w.ipa && <div className="ipa">/{w.ipa}/</div>}
              <div className="meaning">{w.meaning}</div>
            </div>
            <div className="word-actions">
              <label className="known-toggle">
                <input
                  type="checkbox"
                  checked={!!w.known}
                  onChange={(e) => onUpdateWord(unit.id, w.id, { known: e.target.checked })}
                />
                Đã thuộc
              </label>
              <button
                className="btn btn-ghost btn-sm"
                title="Xóa từ"
                onClick={() => onDeleteWord(unit.id, w.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

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

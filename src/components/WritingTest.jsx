import { useEffect, useRef, useState } from 'react'
import { speak } from '../lib/speech.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalize(s) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[’']/g, "'")
}

export default function WritingTest({ items, title, onUpdateWord, onExit, onStartFlashcards }) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(null) // null | true | false
  const [hint, setHint] = useState(false)
  const [results, setResults] = useState({}) // wordId -> true/false
  const inputRef = useRef(null)

  const done = index >= items.length
  const current = !done ? items[index] : null

  useEffect(() => {
    setAnswer('')
    setChecked(null)
    setHint(false)
    inputRef.current?.focus()
  }, [index])

  if (items.length === 0) {
    return (
      <div className="page study-page">
        <header className="page-header">
          <button className="btn btn-ghost" onClick={onExit}>
            ← Thoát
          </button>
          <h1>{title}</h1>
        </header>
        <div className="card empty">Không có từ nào để kiểm tra.</div>
      </div>
    )
  }

  function check() {
    if (!answer.trim() || checked !== null) return
    const correct = normalize(answer) === normalize(current.word.word)
    setChecked(correct)
    setResults((r) => ({ ...r, [current.word.id]: correct }))
    onUpdateWord(current.unitId, current.word.id, { known: correct })
    speak(current.word.word)
  }

  function next() {
    setIndex((i) => i + 1)
  }

  function onSubmit(e) {
    e.preventDefault()
    if (checked === null) check()
    else next()
  }

  if (done) {
    const correctCount = Object.values(results).filter(Boolean).length
    const wrongItems = items.filter(({ word }) => results[word.id] === false)
    const pct = Math.round((correctCount / items.length) * 100)
    return (
      <div className="page study-page">
        <header className="page-header">
          <button className="btn btn-ghost" onClick={onExit}>
            ← Thoát
          </button>
          <h1>{title}</h1>
        </header>
        <div className="card finish-card">
          <h2>
            {pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📖'} Kết quả: {correctCount}/{items.length} (
            {pct}%)
          </h2>
          {wrongItems.length === 0 ? (
            <p>Xuất sắc! Bạn viết đúng tất cả các từ. 🎉</p>
          ) : (
            <>
              <p>Các từ viết sai (đã chuyển về "chưa thuộc"):</p>
              <ul className="wrong-list">
                {wrongItems.map(({ word }) => (
                  <li key={word.id}>
                    <b>{word.word}</b>
                    {word.ipa && <span className="ipa"> /{word.ipa}/</span>} — {word.meaning}
                    <button className="btn-speak" onClick={() => speak(word.word)}>
                      🔊
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="btn-col">
            {wrongItems.length > 0 && (
              <button
                className="btn btn-warning btn-lg"
                onClick={() => onStartFlashcards(shuffle(wrongItems), '🔥 Học lại từ viết sai')}
              >
                🔥 Học lại {wrongItems.length} từ sai bằng flashcard
              </button>
            )}
            <button className="btn btn-ghost" onClick={onExit}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  const w = current.word
  return (
    <div className="page study-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={onExit}>
          ← Thoát
        </button>
        <h1>{title}</h1>
      </header>

      <div className="study-progress">
        <span>
          {index + 1}/{items.length}
        </span>
        <div className="progress-bar grow">
          <div
            className="progress-fill"
            style={{ width: `${((index + 1) / items.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="card quiz-card">
        <div className="quiz-question-label">✍️ Viết từ tiếng Anh có nghĩa là:</div>
        <div className="quiz-word">“{w.meaning}”</div>
        {w.pos && <div className="pos">({w.pos})</div>}

        <div className="writing-hint-row">
          {hint ? (
            <span className="writing-hint">
              Gợi ý: <b>{w.word[0]}</b>
              {w.word.slice(1).replace(/[^ ]/g, ' _')}
            </span>
          ) : (
            checked === null && (
              <button className="btn btn-ghost btn-sm" onClick={() => setHint(true)}>
                💡 Gợi ý chữ cái đầu
              </button>
            )
          )}
        </div>

        <form className="writing-row" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            className={`input writing-input ${
              checked === true ? 'input-correct' : checked === false ? 'input-wrong' : ''
            }`}
            placeholder="Gõ từ tiếng Anh..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            readOnly={checked !== null}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {checked === null && (
            <button type="submit" className="btn btn-primary" disabled={!answer.trim()}>
              Kiểm tra
            </button>
          )}
        </form>

        {checked !== null && (
          <div className="quiz-feedback">
            {checked ? (
              <span className="ok">
                ✅ Chính xác! <b>{w.word}</b>
                {w.ipa && <span className="ipa"> /{w.ipa}/</span>}
                <button className="btn-speak" onClick={() => speak(w.word)}>
                  🔊
                </button>
              </span>
            ) : (
              <span className="bad">
                ❌ Chưa đúng. Đáp án: <b>{w.word}</b>
                {w.ipa && <span className="ipa"> /{w.ipa}/</span>}
                <button className="btn-speak" onClick={() => speak(w.word)}>
                  🔊
                </button>
              </span>
            )}
            <button className="btn btn-primary" onClick={next} autoFocus>
              {index + 1 === items.length ? 'Xem kết quả' : 'Tiếp theo →'}
            </button>
          </div>
        )}
        <div className="hint center" style={{ marginTop: 12 }}>
          Nhấn <kbd>Enter</kbd> để kiểm tra / sang câu tiếp theo
        </div>
      </div>
    </div>
  )
}

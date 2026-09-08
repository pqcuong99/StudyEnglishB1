import { useState } from 'react'
import { speak } from '../lib/speech.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function sampleDistractors(items, current, field, count) {
  const pool = [
    ...new Set(
      items
        .filter(({ word }) => word.id !== current.word.id)
        .map(({ word }) => word[field])
        .filter((v) => v && v !== current.word[field]),
    ),
  ]
  return shuffle(pool).slice(0, count)
}

function buildQuestions(items) {
  return items.map((item) => {
    // half of the questions: word -> meaning; the other half: meaning -> word
    const type = Math.random() < 0.5 ? 'word2meaning' : 'meaning2word'
    const field = type === 'word2meaning' ? 'meaning' : 'word'
    const distractors = sampleDistractors(items, item, field, 3)
    const options = shuffle([item.word[field], ...distractors])
    return { item, type, options, answer: item.word[field] }
  })
}

export default function Quiz({ items, title, onUpdateWord, onExit, onStartFlashcards }) {
  const [questions] = useState(() => buildQuestions(items))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null) // option value chosen
  const [results, setResults] = useState({}) // wordId -> true/false

  if (items.length < 2) {
    return (
      <div className="page study-page">
        <header className="page-header">
          <button className="btn btn-ghost" onClick={onExit}>
            ← Thoát
          </button>
          <h1>{title}</h1>
        </header>
        <div className="card empty">Cần ít nhất 2 từ để làm bài kiểm tra.</div>
      </div>
    )
  }

  const done = index >= questions.length
  const q = !done ? questions[index] : null

  function choose(option) {
    if (selected !== null) return
    const correct = option === q.answer
    setSelected(option)
    setResults((r) => ({ ...r, [q.item.word.id]: correct }))
    // cập nhật trạng thái thuộc/chưa thuộc theo kết quả trả lời
    onUpdateWord(q.item.unitId, q.item.word.id, { known: correct })
  }

  function next() {
    setSelected(null)
    setIndex((i) => i + 1)
  }

  if (done) {
    const correctCount = Object.values(results).filter(Boolean).length
    const wrongItems = items.filter(({ word }) => results[word.id] === false)
    const pct = Math.round((correctCount / questions.length) * 100)
    return (
      <div className="page study-page">
        <header className="page-header">
          <button className="btn btn-ghost" onClick={onExit}>
            ← Thoát
          </button>
          <h1>{title}</h1>
        </header>
        <div className="card finish-card">
          <h2>{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📖'} Kết quả: {correctCount}/{questions.length} ({pct}%)</h2>
          {wrongItems.length === 0 ? (
            <p>Tuyệt vời! Bạn đã thuộc tất cả các từ trong lượt này. 🎉</p>
          ) : (
            <>
              <p>Các từ trả lời sai (đã chuyển về "chưa thuộc"):</p>
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
                onClick={() => onStartFlashcards(shuffle(wrongItems), '🔥 Học lại từ trả lời sai')}
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

  const w = q.item.word
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
          {index + 1}/{questions.length}
        </span>
        <div className="progress-bar grow">
          <div
            className="progress-fill"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="card quiz-card">
        {q.type === 'word2meaning' ? (
          <>
            <div className="quiz-question-label">Nghĩa của từ này là gì?</div>
            <div className="quiz-word">
              {w.word} {w.pos && <span className="pos">({w.pos})</span>}
              <button className="btn-speak" onClick={() => speak(w.word)}>
                🔊
              </button>
            </div>
            {w.ipa && <div className="ipa">/{w.ipa}/</div>}
          </>
        ) : (
          <>
            <div className="quiz-question-label">Từ tiếng Anh nào có nghĩa là:</div>
            <div className="quiz-word">“{w.meaning}”</div>
            {w.pos && <div className="pos">({w.pos})</div>}
          </>
        )}

        <div className="quiz-options">
          {q.options.map((opt) => {
            let cls = 'quiz-option'
            if (selected !== null) {
              if (opt === q.answer) cls += ' correct'
              else if (opt === selected) cls += ' wrong'
              else cls += ' disabled'
            }
            return (
              <button key={opt} className={cls} onClick={() => choose(opt)}>
                {opt}
              </button>
            )
          })}
        </div>

        {selected !== null && (
          <div className="quiz-feedback">
            {selected === q.answer ? (
              <span className="ok">✅ Chính xác!</span>
            ) : (
              <span className="bad">
                ❌ Chưa đúng. Đáp án: <b>{q.answer}</b>
              </span>
            )}
            <button className="btn btn-primary" onClick={next} autoFocus>
              {index + 1 === questions.length ? 'Xem kết quả' : 'Tiếp theo →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

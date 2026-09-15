import { useState } from 'react'
import { speak } from '../lib/speech.js'
import { playCorrect, CORRECT_SOUND_MS } from '../lib/sound.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// bỏ emoji/ký hiệu ở đầu tiêu đề để ghép với emoji khác
function plainTitle(title) {
  return (title || '').replace(/^[^\p{L}\p{N}]+/u, '')
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

export default function Quiz({
  items,
  pool,
  title,
  onAnswer,
  onExit,
  onStartFlashcards,
  onStartWriting,
  onRestart, // đề ngẫu nhiên: bốc lại đề mới (số câu + từ khác) thay vì xáo trộn bộ cũ
}) {
  // toàn bộ từ của phần gốc; "làm lại" xáo trộn cả nhóm này, không chỉ lượt hiện tại
  const fullPool = pool && pool.length ? pool : items
  const [questions, setQuestions] = useState(() => buildQuestions(items))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // question index -> option đã chọn

  // làm lại: xáo trộn lại TẤT CẢ các từ trong phần (và đáp án) để tránh học vẹt
  function restart() {
    setQuestions(buildQuestions(shuffle(fullPool)))
    setAnswers({})
    setIndex(0)
  }

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
  const selected = !done && answers[index] !== undefined ? answers[index] : null
  const answeredCount = Object.keys(answers).length

  function choose(option) {
    if (selected !== null) return
    const correct = option === q.answer
    setAnswers((a) => ({ ...a, [index]: option }))
    // cập nhật trạng thái thuộc/chưa thuộc + thống kê đúng/sai của từ
    onAnswer(q.item, correct)
    if (correct) {
      playCorrect()
      // câu "nghĩa -> từ": vừa chọn đúng thì đọc luôn cách phát âm của từ đó
      if (q.type === 'meaning2word') setTimeout(() => speak(q.item.word.word), CORRECT_SOUND_MS)
    }
  }

  function next() {
    setIndex((i) => i + 1)
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1))
  }

  if (done) {
    // kết quả theo từng từ, lấy từ các câu đã trả lời
    const results = {}
    questions.forEach((question, i) => {
      if (answers[i] !== undefined) results[question.item.word.id] = answers[i] === question.answer
    })
    const correctCount = Object.values(results).filter(Boolean).length
    // các từ của lượt hiện tại lấy từ câu hỏi đã dựng (có thể là cả phần sau khi làm lại)
    const roundItems = questions.map((question) => question.item)
    const wrongItems = roundItems.filter(({ word }) => results[word.id] === false)
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

          <div className="finish-ask">🔁 Bạn muốn làm gì tiếp theo?</div>
          <div className="btn-col">
            {onRestart ? (
              <button className="btn btn-primary btn-lg" onClick={onRestart}>
                🎲 Kiểm tra lại (bốc đề ngẫu nhiên mới)
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={restart}>
                🔁 Kiểm tra lại (xáo trộn {fullPool.length} từ)
              </button>
            )}
            <button
              className="btn btn-outline btn-lg"
              onClick={() =>
                onStartWriting(shuffle(roundItems), `✍️ Kiểm tra viết – ${plainTitle(title)}`, fullPool)
              }
            >
              ✍️ Làm kiểm tra viết
            </button>
            {wrongItems.length > 0 && (
              <button
                className="btn btn-warning btn-lg"
                onClick={() =>
                  onStartFlashcards(shuffle(wrongItems), '🔥 Học lại từ trả lời sai', fullPool)
                }
              >
                🔥 Học lại {wrongItems.length} từ sai bằng flashcard
              </button>
            )}
            <button className="btn btn-outline" onClick={() => setIndex(questions.length - 1)}>
              ← Xem lại các câu hỏi
            </button>
            <button className="btn btn-ghost" onClick={onExit}>
              🏁 Kết thúc, về trang chủ
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

        <div className="quiz-feedback">
          {selected !== null ? (
            selected === q.answer ? (
              <span className="ok">
                ✅ Chính xác!
                {/* câu "nghĩa -> từ": kèm từ + phiên âm + nút nghe phát âm */}
                {q.type === 'meaning2word' && (
                  <>
                    {' '}
                    <b>{w.word}</b>
                    {w.ipa && <span className="ipa"> /{w.ipa}/</span>}
                    <button className="btn-speak" title="Nghe phát âm" onClick={() => speak(w.word)}>
                      🔊
                    </button>
                  </>
                )}
              </span>
            ) : (
              <span className="bad">
                ❌ Chưa đúng. Đáp án: <b>{q.answer}</b>
                {q.type === 'meaning2word' && (
                  <>
                    {w.ipa && <span className="ipa"> /{w.ipa}/</span>}
                    <button className="btn-speak" title="Nghe phát âm" onClick={() => speak(w.word)}>
                      🔊
                    </button>
                  </>
                )}
              </span>
            )
          ) : (
            <span className="hint">
              {answeredCount > 0 ? `Đã trả lời ${answeredCount}/${questions.length} từ` : ''}
            </span>
          )}
          <div className="quiz-actions">
            <button
              className="btn btn-outline"
              disabled={index === 0}
              title="Xem lại từ trước"
              onClick={prev}
            >
              ← Từ trước
            </button>
            {selected !== null && (
              <button className="btn btn-primary" onClick={next} autoFocus>
                {index + 1 === questions.length ? 'Xem kết quả' : 'Tiếp theo →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

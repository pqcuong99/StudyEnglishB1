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

// số ký tự (không tính khoảng trắng) — là số lần có thể mở gợi ý
function letterCount(word) {
  return [...word].filter((c) => c !== ' ').length
}

// hiện dần từng chữ cái từ trái sang phải: `count` chữ đầu hiện thật, còn lại là "_"
function renderHint(word, count) {
  let shown = 0
  return [...word].map((ch, i) => {
    if (ch === ' ') return <span key={i} className="hint-gap"> </span>
    const revealed = shown < count
    shown += 1
    return (
      <span key={i} className={revealed ? 'hint-on' : 'hint-off'}>
        {revealed ? ch : '_'}
      </span>
    )
  })
}

// lấy phần "chủ đề" trong tiêu đề để dựng tiêu đề bài trắc nghiệm khi làm lại
function topicOf(title) {
  return (title || '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/^Kiểm tra viết\s*[–:-]\s*/iu, '')
    .trim()
}

export default function WritingTest({
  items,
  pool,
  title,
  onAnswer,
  onExit,
  onStartFlashcards,
  onStartQuiz,
}) {
  // toàn bộ từ của phần gốc; nút "làm lại" xáo trộn cả nhóm này, không chỉ lượt hiện tại
  const fullPool = pool && pool.length ? pool : items
  const [queue, setQueue] = useState(items) // thứ tự các từ trong lượt hiện tại
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(null) // null | true | false
  const [hintCount, setHintCount] = useState(0) // số chữ cái đang được gợi ý
  const [results, setResults] = useState({}) // wordId -> true/false
  const inputRef = useRef(null)

  const done = index >= queue.length
  const current = !done ? queue[index] : null

  useEffect(() => {
    setAnswer('')
    setChecked(null)
    setHintCount(0)
    inputRef.current?.focus()
  }, [index])

  if (queue.length === 0) {
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
    onAnswer(current.unitId, current.word.id, correct)
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

  // làm lại bài viết: xáo trộn lại TẤT CẢ các từ trong phần (không chỉ nhóm nhỏ
  // đang mở, ví dụ nhóm từ viết sai) để tránh học vẹt
  function restart() {
    setQueue(shuffle(fullPool))
    setResults({})
    setIndex(0)
  }

  if (done) {
    const correctCount = Object.values(results).filter(Boolean).length
    const wrongItems = queue.filter(({ word }) => results[word.id] === false)
    const pct = Math.round((correctCount / queue.length) * 100)
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
            {pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📖'} Kết quả: {correctCount}/{queue.length} (
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

          <div className="finish-ask">🔁 Bạn muốn làm gì tiếp theo?</div>
          <div className="btn-col">
            {wrongItems.length > 0 && (
              <button
                className="btn btn-warning btn-lg"
                onClick={() =>
                  onStartFlashcards(shuffle(wrongItems), '🔥 Học lại từ viết sai', fullPool)
                }
              >
                🔥 Học lại {wrongItems.length} từ sai bằng flashcard
              </button>
            )}
            {queue.length >= 2 && (
              <button
                className="btn btn-outline btn-lg"
                onClick={() =>
                  onStartQuiz(shuffle(queue), `📝 Kiểm tra – ${topicOf(title)}`, fullPool)
                }
              >
                📝 Kiểm tra lại (trắc nghiệm)
              </button>
            )}
            <button className="btn btn-primary btn-lg" onClick={restart}>
              ✍️ Kiểm tra viết lại (xáo trộn {fullPool.length} từ)
            </button>
            <button className="btn btn-ghost" onClick={onExit}>
              🏁 Kết thúc, về trang chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  const w = current.word
  const total = letterCount(w.word)
  const revealMore = () => setHintCount((c) => Math.min(total, c + 1))
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
          {index + 1}/{queue.length}
        </span>
        <div className="progress-bar grow">
          <div
            className="progress-fill"
            style={{ width: `${((index + 1) / queue.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="card quiz-card">
        <div className="quiz-question-label">✍️ Viết từ tiếng Anh có nghĩa là:</div>
        <div className="quiz-word">“{w.meaning}”</div>
        {w.pos && <div className="pos">({w.pos})</div>}

        <div className="writing-hint-row">
          {checked === null &&
            (hintCount === 0 ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={revealMore}
              >
                💡 Gợi ý chữ cái
              </button>
            ) : (
              <span className="writing-hint">
                Gợi ý: <span className="hint-letters">{renderHint(w.word, hintCount)}</span>
                {hintCount < total && (
                  <button
                    type="button"
                    className="hint-more"
                    title="Hiện thêm một chữ cái"
                    onClick={revealMore}
                  >
                    💡
                  </button>
                )}
                <span className="hint-count">
                  {hintCount}/{total}
                </span>
              </span>
            ))}
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
              {index + 1 === queue.length ? 'Xem kết quả' : 'Tiếp theo →'}
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

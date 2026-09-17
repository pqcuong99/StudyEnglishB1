import { useEffect, useMemo, useState } from 'react'
import { speak } from '../lib/speech.js'
import { getExample } from '../data/examples.js'
import WordImage from './WordImage.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Flashcards({
  items,
  pool,
  title,
  onUpdateWord,
  onExit,
  onStartQuiz,
  onStartWriting,
  onRestart,
  // thẻ mở đầu (mở flashcard từ danh sách từ của phần)
  startIndex = 0,
}) {
  // toàn bộ từ của phần gốc, truyền tiếp cho các bước sau (kiểm tra viết/trắc nghiệm)
  const fullPool = pool && pool.length ? pool : items
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startIndex), items.length))
  const [flipped, setFlipped] = useState(false)
  // remember the marks made during this session to show a summary
  const [marks, setMarks] = useState({}) // wordId -> true/false

  const done = index >= items.length
  const current = !done ? items[index] : null

  useEffect(() => {
    setFlipped(false)
  }, [index])

  // keyboard shortcuts: space = flip, 1 = chưa thuộc, 2 = đã thuộc, arrows = nav
  useEffect(() => {
    function onKey(e) {
      if (done) return
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === '1') mark(false)
      else if (e.key === '2') mark(true)
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(items.length, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const knownCount = useMemo(() => Object.values(marks).filter(Boolean).length, [marks])
  const unknownCount = useMemo(
    () => Object.values(marks).filter((v) => v === false).length,
    [marks],
  )

  if (items.length === 0) {
    return (
      <div className="page study-page">
        <header className="page-header">
          <button className="btn btn-ghost" onClick={onExit}>
            ← Thoát
          </button>
          <h1>{title}</h1>
        </header>
        <div className="card empty">Không có từ nào để học.</div>
      </div>
    )
  }

  function mark(known) {
    if (!current) return
    onUpdateWord(current, { known })
    setMarks((m) => ({ ...m, [current.word.id]: known }))
    setIndex((i) => i + 1)
  }

  if (done) {
    const unknownItems = items.filter(({ word }) => marks[word.id] === false)
    return (
      <div className="page study-page">
        <header className="page-header">
          <button className="btn btn-ghost" onClick={onExit}>
            ← Thoát
          </button>
          <h1>{title}</h1>
        </header>
        <div className="card finish-card">
          <h2>🎉 Hoàn thành lượt học!</h2>
          <p>
            ✅ Đã thuộc: <b>{knownCount}</b> từ &nbsp;·&nbsp; ❌ Chưa thuộc:{' '}
            <b>{unknownCount}</b> từ
          </p>
          <div className="btn-col">
            {unknownItems.length > 0 && (
              <button
                className="btn btn-warning btn-lg"
                onClick={() =>
                  onRestart(shuffle(unknownItems), '🔥 Ôn lại từ chưa thuộc', fullPool)
                }
              >
                🔥 Học lại {unknownItems.length} từ chưa thuộc
              </button>
            )}
            {items.length >= 2 && (
              <button
                className="btn btn-primary btn-lg"
                onClick={() => onStartQuiz(shuffle(items), `📝 Kiểm tra: ${title}`, fullPool)}
              >
                📝 Kiểm tra lại ngay ({items.length} từ)
              </button>
            )}
            <button
              className="btn btn-outline btn-lg"
              onClick={() => onStartWriting(shuffle(items), `✍️ Kiểm tra viết: ${title}`, fullPool)}
            >
              ✍️ Kiểm tra viết ({items.length} từ)
            </button>
            <button
              className="btn btn-outline"
              onClick={() => onRestart(shuffle(items), title, fullPool)}
            >
              🔁 Học lại từ đầu
            </button>
            <button className="btn btn-ghost" onClick={onExit}>
              ← Thoát
            </button>
          </div>
        </div>
      </div>
    )
  }

  const w = current.word
  const example = getExample(w)
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
          <div className="progress-fill" style={{ width: `${((index + 1) / items.length) * 100}%` }} />
        </div>
      </div>

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <WordImage className="flash-img" word={w.word} meaning={w.meaning} seed={w.seed} />
            <div className="flash-word">
              {w.word} {w.pos && <span className="pos">({w.pos})</span>}
            </div>
            <button
              className="btn-speak big"
              onClick={(e) => {
                e.stopPropagation()
                speak(w.word)
              }}
            >
              🔊
            </button>
            <div className="flip-hint">Bấm vào thẻ để xem nghĩa</div>
          </div>
          <div className="flashcard-face flashcard-back">
            <div className="flash-word">{w.word}</div>
            {w.ipa && <div className="ipa big-ipa">/{w.ipa}/</div>}
            {w.pos && <div className="pos">({w.pos})</div>}
            <div className="flash-meaning">{w.meaning}</div>
            <button
              className="btn-speak big"
              onClick={(e) => {
                e.stopPropagation()
                speak(w.word)
              }}
            >
              🔊
            </button>
            {example && (
              <div className="flash-example">
                <div className="flash-example-en">
                  <span className="flash-example-label">Ví dụ:</span> {example.en}
                  <button
                    className="btn-speak"
                    title="Nghe câu ví dụ"
                    onClick={(e) => {
                      e.stopPropagation()
                      speak(example.en)
                    }}
                  >
                    🔊
                  </button>
                </div>
                {example.vi && <div className="flash-example-vi">{example.vi}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="btn-row mark-row">
        <button className="btn btn-danger btn-lg grow" onClick={() => mark(false)}>
          ❌ Chưa thuộc
        </button>
        <button className="btn btn-success btn-lg grow" onClick={() => mark(true)}>
          ✅ Đã thuộc
        </button>
      </div>
      <div className="hint center">
        Phím tắt: <kbd>Space</kbd> lật thẻ · <kbd>1</kbd> chưa thuộc · <kbd>2</kbd> đã thuộc
      </div>
    </div>
  )
}

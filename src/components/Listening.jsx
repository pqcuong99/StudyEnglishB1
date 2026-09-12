import { useEffect, useMemo, useRef, useState } from 'react'
import { LEVELS, levelById, makeCloze, isCorrect } from '../lib/cloze.js'
import {
  loadListeningProgress,
  recordListeningResult,
  loadLastLevel,
  saveLastLevel,
} from '../lib/listeningProgress.js'

const SPEAKER = {
  F: { icon: '👧', label: 'F' },
  M: { icon: '👦', label: 'M' },
}

// ---------- chọn mức độ ----------
function LevelPicker({ value, onChange, size }) {
  return (
    <div className="level-row">
      {LEVELS.map((l) => (
        <button
          key={l.id}
          type="button"
          className={`level-pill${value === l.id ? ' active' : ''}${size === 'sm' ? ' sm' : ''}`}
          onClick={() => onChange(l.id)}
          title={`Ẩn ${l.count} từ`}
        >
          {l.icon} {l.label} <span className="level-count">({l.count} từ)</span>
        </button>
      ))}
    </div>
  )
}

// ---------- danh sách bài nghe của một bộ ----------
function ExerciseList({ set, levelId, onChangeLevel, progress, onOpen, onExit }) {
  const level = levelById(levelId)
  const doneCount = set.exercises.filter((ex) => progress[ex.id]?.[levelId]?.done).length
  return (
    <div className="page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={onExit}>
          ← Quay lại unit
        </button>
        <div>
          <h1>🎧 {set.name}</h1>
          <p className="part-sub">{set.subtitle}</p>
        </div>
      </header>

      <div className="card">
        <p className="listen-guide">
          Mỗi bài là một đoạn audio ngắn kèm recording script. Một số từ trong script bị ẩn ngẫu
          nhiên – hãy nghe và điền vào chỗ trống, rồi bấm <b>Nộp bài</b> để kiểm tra. Mỗi lần làm lại
          sẽ ẩn các từ khác nhau.
        </p>
        <div className="field-label">Mức độ (số từ bị ẩn mỗi lần nghe)</div>
        <LevelPicker value={levelId} onChange={onChangeLevel} />
        <p className="hint" style={{ marginTop: 10 }}>
          Đã hoàn thành ở mức {level.label}: <b>{doneCount}/{set.exercises.length}</b> bài
        </p>
      </div>

      <div className="section-head">
        <h2>Chọn bài nghe</h2>
        <span className="hint">Nguồn: {set.source}</span>
      </div>
      <div className="unit-grid">
        {set.exercises.map((ex, i) => {
          const p = progress[ex.id] || {}
          return (
            <div key={ex.id} className="unit-card card listen-card" onClick={() => onOpen(ex.id)}>
              <h3>{ex.title}</h3>
              <p className="unit-meta">Trang {ex.page} · {ex.lines.length} lượt thoại</p>
              <p className="listen-intro-preview">“{ex.intro}”</p>
              <div className="listen-badges">
                {LEVELS.map((l) => {
                  const r = p[l.id]
                  const cls = r?.done ? 'done' : r ? 'tried' : ''
                  return (
                    <span key={l.id} className={`listen-badge ${cls}`} title={l.label}>
                      {r?.done ? '✅' : r ? '🔸' : '⬜'} {l.label}
                      {r && !r.done ? ` ${r.best}/${r.total}` : ''}
                    </span>
                  )
                })}
              </div>
              <div className="btn-row" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-primary btn-sm" onClick={() => onOpen(ex.id)}>
                  🎧 Nghe & điền từ ({level.label})
                </button>
              </div>
              <div className="hint">Bài {i + 1}/{set.exercises.length} →</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- trình phát audio ----------
function AudioPlayer({ src }) {
  const ref = useRef(null)
  const [rate, setRate] = useState(1)
  const [plays, setPlays] = useState(0)

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = rate
  }, [rate])

  function restart() {
    const a = ref.current
    if (!a) return
    a.currentTime = 0
    a.play()
  }
  function back(sec) {
    const a = ref.current
    if (!a) return
    a.currentTime = Math.max(0, a.currentTime - sec)
    if (a.paused) a.play()
  }

  return (
    <div className="card listen-audio">
      <div className="listen-audio-head">
        <span>🎧 Audio</span>
        {plays > 0 && <span className="hint">đã nghe {plays} lần</span>}
      </div>
      <audio
        ref={ref}
        controls
        preload="auto"
        src={src}
        className="listen-audio-el"
        onPlay={(e) => {
          if (e.currentTarget.currentTime < 0.5) setPlays((n) => n + 1)
        }}
      />
      <div className="btn-row listen-audio-btns">
        <button type="button" className="btn btn-outline btn-sm" onClick={restart}>
          ⏮ Nghe lại từ đầu
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => back(5)}>
          ⏪ Lùi 5 giây
        </button>
        <button
          type="button"
          className={`btn btn-sm ${rate !== 1 ? 'btn-warning' : 'btn-ghost'}`}
          onClick={() => setRate((r) => (r === 1 ? 0.75 : 1))}
          title="Nghe chậm lại"
        >
          {rate === 1 ? '🐢 Nghe chậm (0.75x)' : '🐇 Tốc độ thường (1x)'}
        </button>
      </div>
    </div>
  )
}

// ---------- một chỗ trống ----------
function Blank({ k, answer, value, hint, state, onChange, onHint, onEnter, inputRef }) {
  const len = answer.length
  // placeholder: chữ cái đã gợi ý + "_" cho phần còn lại
  const placeholder = [...answer].map((ch, i) => (i < hint ? ch : '_')).join('')
  const width = `${Math.max(len, 3) + 2}ch`
  const locked = state === 'ok' || state === 'bad'
  return (
    <span className={`blank-wrap ${state}`}>
      <span className="blank-num">{k + 1}</span>
      <input
        ref={inputRef}
        className={`blank-input ${state}`}
        style={{ width }}
        value={value}
        placeholder={placeholder}
        readOnly={locked}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onEnter()
          }
        }}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={`Chỗ trống ${k + 1}`}
      />
      {state === 'open' && hint < len && (
        <button
          type="button"
          className="hint-more blank-hint"
          title="Gợi ý thêm một chữ cái"
          onClick={onHint}
        >
          💡
        </button>
      )}
      {state === 'bad' && <span className="blank-answer">→ {answer}</span>}
    </span>
  )
}

// ---------- một bài nghe + điền từ ----------
function ListeningExercise({
  set,
  exercise,
  index,
  levelId,
  onChangeLevel,
  onRetry,
  onNext,
  onBackToList,
  onExit,
  onResult,
}) {
  const level = levelById(levelId)
  const cloze = useMemo(() => makeCloze(exercise.lines, level), [exercise, level])
  const n = cloze.blanks.length

  const [values, setValues] = useState(() => Array(n).fill(''))
  const [hints, setHints] = useState(() => Array(n).fill(0))
  // null = chưa nộp; mảng true/false theo từng chỗ trống sau khi nộp
  const [graded, setGraded] = useState(null)
  // chỗ trống đã đúng ở lượt trước (khi "sửa lại các từ sai") thì khóa lại
  const [locked, setLocked] = useState(() => Array(n).fill(false))
  const [choice, setChoice] = useState(null) // câu hỏi trắc nghiệm
  const inputRefs = useRef([])
  const resultRef = useRef(null)

  const submitted = graded !== null
  const filled = values.filter((v) => v.trim()).length
  const correctCount = submitted ? graded.filter(Boolean).length : 0
  const allCorrect = submitted && correctCount === n
  const next = set.exercises[index + 1] || null

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (submitted) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [submitted])

  function stateOf(k) {
    if (graded) return graded[k] ? 'ok' : 'bad'
    if (locked[k]) return 'ok'
    return 'open'
  }

  function focusNextOpen(from) {
    for (let k = from + 1; k < n; k++) {
      if (stateOf(k) === 'open' && !values[k].trim()) {
        inputRefs.current[k]?.focus()
        return true
      }
    }
    for (let k = 0; k < n; k++) {
      if (stateOf(k) === 'open' && !values[k].trim()) {
        inputRefs.current[k]?.focus()
        return true
      }
    }
    return false
  }

  function submit() {
    if (submitted) return
    const g = cloze.blanks.map((b, k) => locked[k] || isCorrect(values[k], b.answer))
    setGraded(g)
    onResult(exercise.id, levelId, g.filter(Boolean).length, n)
  }

  // mở lại các ô sai, giữ nguyên ô đúng
  function fixWrong() {
    if (!graded) return
    setLocked(graded)
    setGraded(null)
    setTimeout(() => {
      const k = graded.findIndex((ok) => !ok)
      inputRefs.current[k]?.focus()
    }, 0)
  }

  const mcCorrect = choice !== null && choice === exercise.answer
  const harder = LEVELS[LEVELS.findIndex((l) => l.id === levelId) + 1] || null

  return (
    <div className="page listen-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={onBackToList}>
          ← Danh sách bài
        </button>
        <div>
          <h1>🎧 {exercise.title}</h1>
          <p className="part-sub">
            {set.name} · trang {exercise.page} · mức {level.icon} {level.label} ({n} từ ẩn)
          </p>
        </div>
      </header>

      <div className="study-progress">
        <span>
          Bài {index + 1}/{set.exercises.length}
        </span>
        <div className="progress-bar grow">
          <div
            className="progress-fill"
            style={{ width: `${((index + 1) / set.exercises.length) * 100}%` }}
          />
        </div>
      </div>

      <AudioPlayer src={exercise.audio} />

      <div className="card script-card">
        <div className="script-head">
          <span>📄 Recording script</span>
          {!submitted && (
            <span className="hint">
              Đã điền {filled}/{n} · nhấn <kbd>Enter</kbd> để sang ô tiếp theo · 💡 gợi ý chữ cái
            </span>
          )}
        </div>
        <p className="script-intro">
          {index + 1}. {exercise.intro}
        </p>
        <div className="script">
          {cloze.lines.map((line, li) => {
            const sp = SPEAKER[line.s] || { icon: '🗣️', label: line.s }
            return (
              <div key={li} className={`script-line sp-${line.s}`}>
                <span className="speaker" title={line.s === 'F' ? 'Female' : 'Male'}>
                  {sp.icon} {sp.label}:
                </span>
                <span className="script-text">
                  {line.tokens.map((t, ti) =>
                    t.blank == null ? (
                      <span key={ti}>{t.text}</span>
                    ) : (
                      <Blank
                        key={ti}
                        k={t.blank}
                        answer={cloze.blanks[t.blank].answer}
                        value={values[t.blank]}
                        hint={hints[t.blank]}
                        state={stateOf(t.blank)}
                        inputRef={(el) => (inputRefs.current[t.blank] = el)}
                        onChange={(v) =>
                          setValues((vs) => vs.map((x, i) => (i === t.blank ? v : x)))
                        }
                        onHint={() =>
                          setHints((hs) => hs.map((h, i) => (i === t.blank ? h + 1 : h)))
                        }
                        onEnter={() => {
                          if (!focusNextOpen(t.blank) && filled > 0) submit()
                        }}
                      />
                    ),
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card question-card">
        <div className="script-head">
          <span>❓ Câu hỏi thi (tùy chọn)</span>
        </div>
        <p className="question-text">{exercise.question}</p>
        <div className="question-options">
          {exercise.options.map((opt, i) => {
            let cls = 'quiz-option'
            if (submitted) {
              if (i === exercise.answer) cls += ' correct'
              else if (i === choice) cls += ' wrong'
              else cls += ' disabled'
            } else if (i === choice) cls += ' selected'
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={submitted}
                onClick={() => setChoice(i)}
              >
                <b>{String.fromCharCode(65 + i)}</b> {opt}
              </button>
            )
          })}
        </div>
        {submitted && (
          <p className="question-key">
            📌 Câu chứa đáp án: <i>“{exercise.key}”</i>
          </p>
        )}
      </div>

      {!submitted ? (
        <div className="listen-submit">
          <button
            className="btn btn-primary btn-lg"
            disabled={filled === 0}
            onClick={submit}
            title={filled < n ? `Còn ${n - filled} ô chưa điền` : 'Kiểm tra kết quả'}
          >
            ✅ Nộp bài {filled < n ? `(còn ${n - filled} ô trống)` : ''}
          </button>
        </div>
      ) : (
        <div className="card finish-card listen-result" ref={resultRef}>
          {allCorrect ? (
            <>
              <h2>🎉 Chúc mừng! Bạn điền đúng tất cả {n} từ!</h2>
              <p>
                Nghe rất tốt.{' '}
                {choice !== null &&
                  (mcCorrect
                    ? 'Câu hỏi thi cũng trả lời đúng ✅'
                    : `Câu hỏi thi chọn chưa đúng ❌ (đáp án ${String.fromCharCode(
                        65 + exercise.answer,
                      )}).`)}
              </p>
            </>
          ) : (
            <>
              <h2>
                {correctCount / n >= 0.6 ? '💪' : '📖'} Bạn đúng {correctCount}/{n} từ
              </h2>
              <p>
                Các từ sai được đánh dấu đỏ kèm đáp án đúng ở trên.{' '}
                {choice !== null &&
                  (mcCorrect
                    ? 'Câu hỏi thi trả lời đúng ✅'
                    : `Câu hỏi thi chọn chưa đúng ❌ (đáp án ${String.fromCharCode(
                        65 + exercise.answer,
                      )}).`)}
              </p>
            </>
          )}

          <div className="finish-ask">
            {allCorrect
              ? '🔁 Bạn muốn làm lại bài nghe này hay chuyển sang bài tiếp theo?'
              : '🔁 Bạn muốn làm gì tiếp theo?'}
          </div>
          <div className="btn-col">
            {!allCorrect && (
              <button className="btn btn-warning btn-lg" onClick={fixWrong}>
                ✏️ Nghe lại và sửa {n - correctCount} từ sai
              </button>
            )}
            <button className="btn btn-outline btn-lg" onClick={onRetry}>
              🔁 Làm lại bài này (ẩn {n} từ khác)
            </button>
            {allCorrect && harder && (
              <button className="btn btn-outline btn-lg" onClick={() => onChangeLevel(harder.id)}>
                {harder.icon} Thử lại ở mức {harder.label} ({harder.count} từ)
              </button>
            )}
            {next ? (
              <button className="btn btn-primary btn-lg" onClick={onNext}>
                ➡️ Bài tiếp theo: {next.title}
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={onBackToList}>
                🏁 Đây là bài cuối – về danh sách bài nghe
              </button>
            )}
            <button className="btn btn-ghost" onClick={onExit}>
              Thoát về unit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- màn luyện nghe của một bộ bài ----------
export default function Listening({ set, onExit }) {
  const [exerciseId, setExerciseId] = useState(null)
  const [levelId, setLevelIdRaw] = useState(loadLastLevel)
  const [attempt, setAttempt] = useState(0)
  const [progress, setProgress] = useState(loadListeningProgress)

  function setLevelId(id) {
    setLevelIdRaw(id)
    saveLastLevel(id)
    setAttempt((a) => a + 1)
  }

  if (!set) {
    return (
      <div className="page">
        <button className="btn btn-ghost" onClick={onExit}>
          ← Quay lại
        </button>
        <p>Không tìm thấy bài nghe này.</p>
      </div>
    )
  }

  const index = set.exercises.findIndex((e) => e.id === exerciseId)
  const exercise = index >= 0 ? set.exercises[index] : null

  if (!exercise) {
    return (
      <ExerciseList
        set={set}
        levelId={levelId}
        onChangeLevel={setLevelId}
        progress={progress}
        onOpen={(id) => {
          setExerciseId(id)
          setAttempt((a) => a + 1)
        }}
        onExit={onExit}
      />
    )
  }

  return (
    <ListeningExercise
      key={`${exercise.id}-${levelId}-${attempt}`}
      set={set}
      exercise={exercise}
      index={index}
      levelId={levelId}
      onChangeLevel={setLevelId}
      onRetry={() => setAttempt((a) => a + 1)}
      onNext={() => {
        const nx = set.exercises[index + 1]
        if (nx) {
          setExerciseId(nx.id)
          setAttempt((a) => a + 1)
        }
      }}
      onBackToList={() => setExerciseId(null)}
      onExit={onExit}
      onResult={(exId, lv, correct, total) =>
        setProgress(recordListeningResult(progress, exId, lv, correct, total))
      }
    />
  )
}

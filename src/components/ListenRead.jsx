import { useEffect, useMemo, useRef, useState } from 'react'

// Chế độ "Nghe & đọc" của một bài nghe có mốc thời gian (xem U2_SP3_SPORTS_CENTRE
// trong data/listening.js): phát audio, phụ đề chạy theo – tô sáng lượt thoại và
// từng chữ đang đọc, bấm vào câu / chữ để nghe lại từ chỗ đó.

const SPEAKER = {
  A: { icon: '🧑', label: 'Student A' },
  B: { icon: '👩', label: 'Student B' },
}

const KIND = {
  agree: { icon: '👍', label: 'Đồng ý (hoàn toàn / một phần)' },
  disagree: { icon: '✋', label: 'Không đồng ý' },
  ask: { icon: '💬', label: 'Hỏi ý kiến / đề xuất' },
}

const OPTS_KEY = 'listen-read-options'
const DEFAULT_OPTS = { sub: true, vi: false, phrases: true, pauseEach: false }

function loadOpts() {
  try {
    return { ...DEFAULT_OPTS, ...JSON.parse(localStorage.getItem(OPTS_KEY) || '{}') }
  } catch {
    return DEFAULT_OPTS
  }
}

function saveOpts(o) {
  try {
    localStorage.setItem(OPTS_KEY, JSON.stringify(o))
  } catch {
    // không lưu được thì thôi, lần sau dùng mặc định
  }
}

// Tách câu thành từ (theo khoảng trắng, khớp với mảng `w`) và khoảng trắng; gắn
// loại cụm từ (agree / disagree / ask) cho các phần nằm trong một cụm.
function prepareLine(line, phrases) {
  const ranges = []
  for (const p of phrases || []) {
    const at = line.t.indexOf(p.text)
    if (at >= 0) ranges.push({ from: at, to: at + p.text.length, kind: p.kind })
  }
  const tokens = []
  let wi = 0
  for (const m of line.t.matchAll(/\S+|\s+/g)) {
    const space = /^\s/.test(m[0])
    const r = ranges.find((x) => m.index >= x.from && m.index < x.to)
    tokens.push({ text: m[0], start: m.index, space, w: space ? null : wi++, kind: r?.kind || null })
  }
  return tokens
}

function lineAt(lines, t) {
  let li = 0
  for (let i = 0; i < lines.length; i++) if (lines[i].at[0] <= t + 0.05) li = i
  return li
}

function wordAt(line, t) {
  if (t > line.at[1] + 0.15) return -1
  let wi = -1
  for (let i = 0; i < line.w.length; i++) if (line.w[i] <= t + 0.03) wi = i
  return wi
}

export default function ListenRead({ set, exercise, index, onBackToList, onExit, onCloze }) {
  const lines = exercise.lines
  const prepared = useMemo(() => lines.map((l) => prepareLine(l, exercise.phrases)), [exercise])
  const audioRef = useRef(null)
  const lineRefs = useRef([])
  const pausedAtRef = useRef(null)
  const [opts, setOptsRaw] = useState(loadOpts)
  const optsRef = useRef(opts)
  const [pos, setPos] = useState({ li: -1, wi: -1 })
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [revealed, setRevealed] = useState(() => new Set())
  const [zoom, setZoom] = useState(false)
  const [choice, setChoice] = useState(null)

  function setOpt(k, v) {
    const o = { ...optsRef.current, [k]: v }
    optsRef.current = o
    setOptsRaw(o)
    saveOpts(o)
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate
  }, [rate])

  // theo dõi vị trí phát mỗi khung hình (timeupdate quá thưa để tô từng chữ,
  // nhưng vẫn dùng làm dự phòng khi trình duyệt tạm dừng requestAnimationFrame)
  const syncRef = useRef(() => {})
  useEffect(() => {
    let raf
    let last = ''
    const sync = () => {
      const a = audioRef.current
      if (a && (a.currentTime > 0 || !a.paused)) {
        const t = a.currentTime
        const li = lineAt(lines, t)
        // chế độ "dừng sau mỗi lượt": hết lượt thì tạm dừng để nói đuổi
        if (optsRef.current.pauseEach && !a.paused && t >= lines[li].at[1] - 0.02 && pausedAtRef.current !== li) {
          pausedAtRef.current = li
          a.pause()
        }
        const wi = wordAt(lines[li], t)
        const key = `${li}:${wi}`
        if (key !== last) {
          last = key
          setPos({ li, wi })
        }
      }
    }
    const tick = () => {
      sync()
      raf = requestAnimationFrame(tick)
    }
    syncRef.current = sync
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [lines])

  // cuộn lượt thoại đang đọc vào giữa màn hình (mép trên bị thanh phát che)
  useEffect(() => {
    if (pos.li >= 0 && playing) lineRefs.current[pos.li]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [pos.li, playing])

  function seek(t) {
    const a = audioRef.current
    if (!a) return
    pausedAtRef.current = null
    a.currentTime = Math.max(0, t - 0.05)
    a.play()
  }

  function togglePlay() {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play()
    else a.pause()
  }

  function back(sec) {
    const a = audioRef.current
    if (!a) return
    pausedAtRef.current = null
    a.currentTime = Math.max(0, a.currentTime - sec)
    if (a.paused) a.play()
  }

  function nextLine() {
    const li = pos.li < 0 ? 0 : Math.min(pos.li + 1, lines.length - 1)
    seek(lines[li].at[0])
  }

  function reveal(li) {
    setRevealed((s) => new Set(s).add(li))
  }

  // vị trí đầu tiên của mỗi cụm từ trong bài (để bấm nghe)
  const phraseSpots = useMemo(
    () =>
      (exercise.phrases || []).map((p) => {
        for (let li = 0; li < lines.length; li++) {
          const at = lines[li].t.indexOf(p.text)
          const tok = at >= 0 && prepared[li].find((x) => x.w != null && x.start >= at)
          if (tok) return { ...p, li, t: lines[li].w[tok.w] }
        }
        return { ...p, li: -1, t: null }
      }),
    [exercise, prepared],
  )

  const answered = choice !== null

  return (
    <div className="page listen-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={onBackToList}>
          ← Danh sách bài
        </button>
        <div>
          <h1>📖 {exercise.title}</h1>
          <p className="part-sub">
            {set.name}
            {exercise.page ? ` · trang ${exercise.page}` : ''} · Nghe & đọc phụ đề
          </p>
        </div>
      </header>

      {exercise.image && (
        <div className="card lr-picture-card">
          <button type="button" className="lr-picture-btn" onClick={() => setZoom(true)} title="Bấm để phóng to">
            <img src={exercise.image} alt="Các hoạt động cho trung tâm thể thao" className="lr-picture" />
          </button>
          {exercise.task && <p className="lr-task">📝 {exercise.task}</p>}
        </div>
      )}
      {zoom && (
        <div className="lr-zoom" onClick={() => setZoom(false)}>
          <img src={exercise.image} alt="" />
          <span className="lr-zoom-close">✕ Đóng</span>
        </div>
      )}

      <div className="card listen-audio lr-player">
        <audio
          ref={audioRef}
          preload="auto"
          src={exercise.audio}
          className="listen-audio-el"
          controls
          onPlay={() => setPlaying(true)}
          onTimeUpdate={() => syncRef.current()}
          onSeeked={() => syncRef.current()}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        <div className="btn-row listen-audio-btns">
          <button type="button" className="btn btn-primary btn-sm" onClick={togglePlay}>
            {playing ? '⏸ Tạm dừng' : '▶️ Phát'}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => seek(0)}>
            ⏮ Từ đầu
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => back(5)}>
            ⏪ Lùi 5 giây
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={nextLine}>
            ⏭ Lượt sau
          </button>
          <button
            type="button"
            className={`btn btn-sm ${rate !== 1 ? 'btn-warning' : 'btn-ghost'}`}
            onClick={() => setRate((r) => (r === 1 ? 0.75 : 1))}
          >
            {rate === 1 ? '🐢 Chậm (0.75x)' : '🐇 Thường (1x)'}
          </button>
        </div>
        <div className="lr-opts">
          {[
            ['sub', '💬 Phụ đề'],
            ['vi', '🌏 Dịch tiếng Việt'],
            ['phrases', '🎨 Tô cụm đồng ý / không đồng ý'],
            ['pauseEach', '⏸ Dừng sau mỗi lượt (nói đuổi)'],
          ].map(([k, label]) => (
            <label key={k} className={`lr-opt${opts[k] ? ' on' : ''}`}>
              <input type="checkbox" checked={opts[k]} onChange={(e) => setOpt(k, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className={`card script-card lr-script${opts.phrases ? ' show-phrases' : ''}`}>
        <div className="script-head">
          <span>🎬 Hội thoại</span>
          <span className="hint">Bấm vào một chữ để nghe từ chỗ đó · bấm tên người nói để nghe lại cả lượt</span>
        </div>
        <p className="script-intro">
          {index + 1}. {exercise.intro}
        </p>
        <div className="lr-lines">
          {lines.map((line, li) => {
            const sp = SPEAKER[line.s] || { icon: '🗣️', label: line.s }
            const current = li === pos.li
            const hidden = !opts.sub && !revealed.has(li)
            return (
              <div
                key={li}
                ref={(el) => (lineRefs.current[li] = el)}
                className={`lr-line sp-${line.s}${current ? ' current' : ''}${li < pos.li ? ' past' : ''}`}
              >
                <button type="button" className="lr-speaker" onClick={() => seek(line.at[0])} title="Nghe lượt này">
                  <span className="lr-avatar">{sp.icon}</span>
                  <span>{sp.label}</span>
                  <span className="lr-replay">{current && playing ? '🔊' : '▶'}</span>
                </button>
                <div className="lr-bubble">
                  {hidden ? (
                    <button type="button" className="lr-hidden" onClick={() => reveal(li)}>
                      {line.t.replace(/\S/g, '•')}
                      <span className="lr-hidden-tip">👁 Bấm để xem câu này</span>
                    </button>
                  ) : (
                    <p className="lr-en">
                      {prepared[li].map((tok, ti) => {
                        const ph = tok.kind ? ` ph ph-${tok.kind}` : ''
                        if (tok.space) return <span key={ti} className={ph.trim()}>{tok.text}</span>
                        let st = ''
                        if (current && pos.wi >= 0) st = tok.w === pos.wi ? ' w-now' : tok.w < pos.wi ? ' w-past' : ' w-next'
                        return (
                          <span
                            key={ti}
                            className={`lr-w${ph}${st}`}
                            onClick={() => seek(line.w[tok.w])}
                          >
                            {tok.text}
                          </span>
                        )
                      })}
                    </p>
                  )}
                  {opts.vi && line.vi && <p className="lr-vi">{line.vi}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {phraseSpots.length > 0 && (
        <div className="card lr-phrases">
          <div className="script-head">
            <span>🗝️ Cụm từ hay trong bài (Agreeing &amp; Disagreeing)</span>
            <span className="hint">Bấm để nghe</span>
          </div>
          <div className="lr-phrase-groups">
            {Object.entries(KIND).map(([kind, k]) => (
              <div key={kind} className={`lr-phrase-group pk-${kind}`}>
                <h4>
                  {k.icon} {k.label}
                </h4>
                {phraseSpots
                  .filter((p) => p.kind === kind)
                  .map((p) => (
                    <button
                      key={p.text}
                      type="button"
                      className="lr-phrase"
                      disabled={p.t == null}
                      onClick={() => seek(p.t)}
                    >
                      <b>{p.text}</b>
                      <span>{p.vi}</span>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {exercise.question && (
        <div className="card question-card">
          <div className="script-head">
            <span>❓ Câu hỏi kiểm tra</span>
          </div>
          <p className="question-text">{exercise.question}</p>
          <div className="question-options">
            {exercise.options.map((opt, i) => {
              let cls = 'quiz-option'
              if (answered) {
                if (i === exercise.answer) cls += ' correct'
                else if (i === choice) cls += ' wrong'
                else cls += ' disabled'
              }
              return (
                <button key={i} type="button" className={cls} disabled={answered} onClick={() => setChoice(i)}>
                  <b>{String.fromCharCode(65 + i)}</b> {opt}
                </button>
              )
            })}
          </div>
          {answered && (
            <p className="question-key">
              {choice === exercise.answer ? '✅ Đúng rồi! ' : '❌ Chưa đúng. '}📌 Câu chứa đáp án: <i>“{exercise.key}”</i>
            </p>
          )}
        </div>
      )}

      <div className="btn-col lr-footer">
        <button className="btn btn-primary btn-lg" onClick={onCloze}>
          🎧 Luyện nghe & điền từ bài này
        </button>
        <button className="btn btn-outline" onClick={onBackToList}>
          ← Danh sách bài
        </button>
        <button className="btn btn-ghost" onClick={onExit}>
          Thoát về unit
        </button>
      </div>
    </div>
  )
}

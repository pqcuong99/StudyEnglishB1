import { useEffect, useMemo, useState } from 'react'
import { fetchAdminReport } from '../lib/api.js'
import { isHard } from '../lib/wordStats.js'
import { LEVELS } from '../lib/cloze.js'
import { LISTENING_SETS } from '../data/listening.js'
import {
  addTotals,
  dateKey,
  emptyTotals,
  formatDate,
  formatDateTime,
  formatMonth,
  monthKey,
  percent,
  relativeTime,
  shiftDays,
  sumRange,
} from '../lib/activity.js'

// Bảng điều khiển quản trị: đăng nhập bằng tên "admin" + mật khẩu (App.jsx).
// Dữ liệu lấy từ GET /api/admin/report — mọi người học kèm unit (chỉ cờ thuộc),
// thống kê đúng/sai, tiến độ nghe và nhật ký hoạt động theo ngày (lib/activity.js).
// Không có màn học: quản trị viên chỉ xem, không sửa được tiến độ của ai.

const CHART_DAYS = 30
const HARD_PREVIEW = 10

// tên bài nghe theo id để hiện trong phần chi tiết
const EXERCISE_TITLE = new Map(
  LISTENING_SETS.flatMap((s) => s.exercises.map((e) => [e.id, `${s.name} · ${e.title}`])),
)

// "lượt học" trong một ngày = câu trả lời + thẻ đã đánh dấu + bài nghe đã nộp
const effort = (t) => (t.answers || 0) + (t.reviews || 0) + (t.listening || 0)
const isActive = (t) => !!t && effort(t) > 0

// ---------- tính toán ----------
function summarize(u) {
  const { units, wordStats, listening, activity } = u.data
  const words = units.flatMap((unit) => unit.words)
  const total = words.length
  const known = words.filter((w) => w.known).length
  let correct = 0
  let wrong = 0
  for (const e of Object.values(wordStats)) {
    correct += e.correct || 0
    wrong += e.wrong || 0
  }
  const hard = words
    .filter((w) => isHard(wordStats[w.id]))
    .sort((a, b) => wordStats[b.id].wrong - wordStats[a.id].wrong)

  let listenAttempts = 0
  let listenDone = 0 // số bài đã điền đúng hết ở ít nhất một mức
  for (const levels of Object.values(listening)) {
    let done = false
    for (const lv of Object.values(levels)) {
      listenAttempts += lv.attempts || 0
      if (lv.done) done = true
    }
    if (done) listenDone++
  }

  const activeDays = Object.keys(activity).filter((k) => isActive(activity[k])).sort()
  const totals = Object.values(activity).reduce(addTotals, emptyTotals())

  return {
    ...u,
    total,
    known,
    correct,
    wrong,
    answers: correct + wrong,
    hard,
    listenAttempts,
    listenDone,
    activeDays,
    totals,
  }
}

// Gộp nhật ký của mọi người theo khóa ngày ('YYYY-MM-DD') hoặc tháng ('YYYY-MM'):
// { [key]: { totals, users: [{ name, totals }], days: Set } }
function groupActivity(users, keyOf) {
  const groups = new Map()
  for (const u of users) {
    for (const [day, entry] of Object.entries(u.data.activity)) {
      if (!isActive(entry)) continue
      const k = keyOf(day)
      let g = groups.get(k)
      if (!g) {
        g = { key: k, totals: emptyTotals(), users: new Map(), days: new Set() }
        groups.set(k, g)
      }
      addTotals(g.totals, entry)
      g.days.add(day)
      const ut = g.users.get(u.name) || emptyTotals()
      g.users.set(u.name, addTotals(ut, entry))
    }
  }
  return [...groups.values()]
    .map((g) => ({
      ...g,
      users: [...g.users.entries()]
        .map(([name, totals]) => ({ name, totals }))
        .sort((a, b) => effort(b.totals) - effort(a.totals)),
    }))
    .sort((a, b) => (a.key < b.key ? 1 : -1))
}

// ---------- các mảnh giao diện ----------
function Kpi({ icon, label, value, sub }) {
  return (
    <div className="kpi card">
      <div className="kpi-label">
        {icon} {label}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

function Bar({ part, total, className = '' }) {
  return (
    <div className={`progress-bar ${className}`}>
      <div className="progress-fill" style={{ width: `${percent(part, total)}%` }} />
    </div>
  )
}

// Cột "lượt học" của 30 ngày gần nhất (tất cả người học), rê chuột xem chi tiết
function ActivityChart({ users, today }) {
  const [hover, setHover] = useState(null)
  const days = useMemo(() => {
    const out = []
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const key = shiftDays(today, -i)
      const totals = emptyTotals()
      const names = []
      for (const u of users) {
        const e = u.data.activity[key]
        if (!isActive(e)) continue
        addTotals(totals, e)
        names.push(u.name)
      }
      out.push({ key, totals, names, effort: effort(totals) })
    }
    return out
  }, [users, today])
  const max = Math.max(1, ...days.map((d) => d.effort))
  const cur = hover === null ? null : days[hover]

  return (
    <div className="card">
      <div className="section-head" style={{ margin: '0 0 6px' }}>
        <h2>📈 Lượt học {CHART_DAYS} ngày qua</h2>
        <span className="admin-note">lượt học = câu trả lời + thẻ đã đánh dấu + bài nghe đã nộp</span>
      </div>
      <div className="chart-tip">
        {cur ? (
          <>
            <b>{formatDate(cur.key)}</b>: <b>{cur.effort}</b> lượt học
            {cur.names.length > 0 && (
              <>
                {' '}
                · {cur.names.length} người ({cur.names.join(', ')}) · ✍️ {cur.totals.answers} câu (
                {percent(cur.totals.correct, cur.totals.answers)}% đúng) · 🃏 {cur.totals.reviews} thẻ
                · 🎧 {cur.totals.listening} bài
              </>
            )}
          </>
        ) : (
          <span className="admin-note">Rê chuột vào cột để xem chi tiết từng ngày</span>
        )}
      </div>
      <div className="bar-chart" onMouseLeave={() => setHover(null)}>
        {days.map((d, i) => (
          <div
            key={d.key}
            className={`bar-col ${i === hover ? 'is-hover' : ''} ${d.key === today ? 'is-today' : ''}`}
            onMouseEnter={() => setHover(i)}
            title={`${formatDate(d.key)}: ${d.effort} lượt học`}
          >
            <div className="bar" style={{ height: `${(d.effort / max) * 100}%` }} />
            {(i % 5 === CHART_DAYS % 5 || i === CHART_DAYS - 1) && (
              <span className="bar-label">{d.key.slice(8)}/{Number(d.key.slice(5, 7))}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function LearnerChips({ users }) {
  return (
    <span className="learner-chips">
      {users.map((u) => (
        <span
          key={u.name}
          className="chip chip-static"
          title={`${u.name}: ✍️ ${u.totals.answers} câu · 🃏 ${u.totals.reviews} thẻ · 🎧 ${u.totals.listening} bài`}
        >
          {u.name} <small>{effort(u.totals)}</small>
        </span>
      ))}
    </span>
  )
}

function ActivityTable({ groups, unit }) {
  if (groups.length === 0) return <p className="empty">Chưa có hoạt động nào được ghi lại.</p>
  return (
    <div className="table-wrap">
      <table className="word-table admin-table">
        <thead>
          <tr>
            <th>{unit === 'day' ? 'Ngày' : 'Tháng'}</th>
            <th>Người học</th>
            {unit === 'month' && <th className="num">Ngày có học</th>}
            <th className="num">Câu trả lời</th>
            <th className="num">Đúng</th>
            <th className="num">Từ mới thuộc</th>
            <th className="num">Thẻ đã ôn</th>
            <th className="num">Bài nghe</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.key}>
              <td className="nowrap">
                <b>{unit === 'day' ? formatDate(g.key) : formatMonth(g.key)}</b>
              </td>
              <td>
                <b>{g.users.length}</b> <LearnerChips users={g.users} />
              </td>
              {unit === 'month' && <td className="num">{g.days.size}</td>}
              <td className="num">{g.totals.answers}</td>
              <td className="num">
                {g.totals.answers ? `${percent(g.totals.correct, g.totals.answers)}%` : '—'}
              </td>
              <td className="num">{g.totals.learned}</td>
              <td className="num">{g.totals.reviews}</td>
              <td className="num">
                {g.totals.listening}
                {g.totals.listeningDone > 0 && <small> ({g.totals.listeningDone} đúng hết)</small>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Báo cáo theo ngày (chọn tháng) / theo tháng
function Reports({ users, today }) {
  const [tab, setTab] = useState('day')
  const [month, setMonth] = useState(monthKey(today))
  const byDay = useMemo(() => groupActivity(users, (d) => d), [users])
  const byMonth = useMemo(() => groupActivity(users, monthKey), [users])
  const daysInMonth = byDay.filter((g) => monthKey(g.key) === month)

  function moveMonth(delta) {
    const [y, m] = month.split('-').map(Number)
    setMonth(monthKey(dateKey(new Date(y, m - 1 + delta, 1).getTime())))
  }

  return (
    <div className="card">
      <div className="section-head" style={{ margin: '0 0 10px' }}>
        <h2>📅 Báo cáo hoạt động</h2>
        <div className="tabs">
          <button className={`tab ${tab === 'day' ? 'active' : ''}`} onClick={() => setTab('day')}>
            Theo ngày
          </button>
          <button className={`tab ${tab === 'month' ? 'active' : ''}`} onClick={() => setTab('month')}>
            Theo tháng
          </button>
        </div>
      </div>
      {tab === 'day' ? (
        <>
          <div className="month-nav">
            <button className="btn btn-outline btn-sm" onClick={() => moveMonth(-1)}>
              ◀
            </button>
            <b>{formatMonth(month)}</b>
            <button
              className="btn btn-outline btn-sm"
              disabled={month >= monthKey(today)}
              onClick={() => moveMonth(1)}
            >
              ▶
            </button>
            <span className="admin-note">
              {daysInMonth.length} ngày có hoạt động
            </span>
          </div>
          <ActivityTable groups={daysInMonth} unit="day" />
        </>
      ) : (
        <ActivityTable groups={byMonth} unit="month" />
      )}
      <p className="admin-note" style={{ marginTop: 10 }}>
        Nhật ký theo ngày được ghi từ khi có bảng điều khiển này; hoạt động trước đó chỉ còn
        trong tổng đúng/sai và cờ đã thuộc của từng người.
      </p>
    </div>
  )
}

// Chi tiết một người học: từng unit / phần, từ hay sai, bài nghe, 14 ngày gần nhất
function LearnerDetail({ u, today }) {
  const [showAllHard, setShowAllHard] = useState(false)
  const hard = showAllHard ? u.hard : u.hard.slice(0, HARD_PREVIEW)
  const recent = []
  for (let i = 13; i >= 0; i--) {
    const key = shiftDays(today, -i)
    const e = u.data.activity[key]
    if (isActive(e)) recent.push({ key, ...e })
  }
  const months = useMemo(() => groupActivity([u], monthKey), [u])
  const listening = Object.entries(u.data.listening).filter(([, levels]) =>
    Object.values(levels).some((lv) => lv.attempts > 0),
  )

  return (
    <div className="learner-detail">
      <div className="detail-grid">
        <div>
          <h4>📚 Theo unit</h4>
          {u.data.units.map((unit) => {
            const known = unit.words.filter((w) => w.known).length
            const sections = [...new Set(unit.words.map((w) => w.section).filter(Boolean))]
            return (
              <div key={unit.id} className="detail-unit">
                <div className="detail-line">
                  <span>{unit.name}</span>
                  <b>
                    {known}/{unit.words.length}
                  </b>
                </div>
                <Bar part={known} total={unit.words.length} />
                {sections.length > 1 &&
                  sections.map((s) => {
                    const ws = unit.words.filter((w) => w.section === s)
                    const k = ws.filter((w) => w.known).length
                    return (
                      <div key={s} className="detail-line detail-section">
                        <span>↳ {s}</span>
                        <span>
                          {k}/{ws.length} ({percent(k, ws.length)}%)
                        </span>
                      </div>
                    )
                  })}
              </div>
            )
          })}

          <h4>🎧 Luyện nghe</h4>
          {listening.length === 0 ? (
            <p className="admin-note">Chưa làm bài nghe nào.</p>
          ) : (
            <ul className="detail-list">
              {listening.map(([id, levels]) => (
                <li key={id}>
                  <span>{EXERCISE_TITLE.get(id) || id}</span>
                  <span className="detail-levels">
                    {LEVELS.filter((l) => levels[l.id]?.attempts > 0).map((l) => {
                      const lv = levels[l.id]
                      return (
                        <span
                          key={l.id}
                          className={`listen-badge ${lv.done ? 'done' : ''}`}
                          title={`${l.label}: tốt nhất ${lv.best}/${lv.total}, ${lv.attempts} lượt`}
                        >
                          {l.icon} {lv.best}/{lv.total}
                          {lv.done ? ' ✓' : ''}
                        </span>
                      )
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4>🔥 Từ hay sai ({u.hard.length})</h4>
          {u.hard.length === 0 ? (
            <p className="admin-note">Không có từ nào sai từ 2 lần trở lên.</p>
          ) : (
            <ul className="detail-list">
              {hard.map((w) => {
                const e = u.data.wordStats[w.id]
                return (
                  <li key={w.id}>
                    <span>
                      <b>{w.word}</b> — {w.meaning}
                    </span>
                    <span className="nowrap">
                      <span className="hard-wrong">❌ {e.wrong}</span> · ✅ {e.correct}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {u.hard.length > HARD_PREVIEW && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAllHard((v) => !v)}>
              {showAllHard ? '▲ Thu gọn' : `▼ Xem thêm ${u.hard.length - HARD_PREVIEW} từ`}
            </button>
          )}

          <h4>🗓️ 14 ngày gần nhất</h4>
          {recent.length === 0 ? (
            <p className="admin-note">Không có hoạt động nào được ghi trong 14 ngày qua.</p>
          ) : (
            <ul className="detail-list">
              {recent.reverse().map((d) => (
                <li key={d.key}>
                  <span>{formatDate(d.key)}</span>
                  <span className="nowrap">
                    ✍️ {d.answers || 0}
                    {d.answers ? ` (${percent(d.correct || 0, d.answers)}%)` : ''} · 🃏 {d.reviews || 0}{' '}
                    · ⭐ {d.learned || 0} · 🎧 {d.listening || 0}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {months.length > 0 && (
            <>
              <h4>📆 Theo tháng</h4>
              <ul className="detail-list">
                {months.map((m) => (
                  <li key={m.key}>
                    <span>{formatMonth(m.key)}</span>
                    <span className="nowrap">
                      {m.days.size} ngày · ✍️ {m.totals.answers} · 🃏 {m.totals.reviews} · ⭐{' '}
                      {m.totals.learned} · 🎧 {m.totals.listening}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      <p className="admin-note">
        ✍️ câu trả lời (tỉ lệ đúng) · 🃏 thẻ đã đánh dấu · ⭐ từ chuyển sang đã thuộc · 🎧 bài nghe đã
        nộp
      </p>
    </div>
  )
}

function LearnerTable({ users, today }) {
  const [open, setOpen] = useState(null)
  if (users.length === 0) {
    return <p className="empty">Chưa có ai đăng nhập học trên máy chủ này.</p>
  }
  return (
    <div className="table-wrap">
      <table className="word-table admin-table learner-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Tiến độ từ vựng</th>
            <th className="num">Trả lời</th>
            <th className="num">Hay sai</th>
            <th className="num">Bài nghe</th>
            <th className="num">Ngày học</th>
            <th>Hoạt động gần nhất</th>
            <th>Tham gia</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const todayEntry = u.data.activity[today]
            const expanded = open === u.key
            return [
              <tr
                key={u.key}
                className={`learner-row ${expanded ? 'is-open' : ''}`}
                onClick={() => setOpen(expanded ? null : u.key)}
                title="Bấm để xem chi tiết"
              >
                <td className="nowrap">
                  <b>{expanded ? '▾' : '▸'} 👤 {u.name}</b>
                  {isActive(todayEntry) && <span className="today-dot" title="Có học hôm nay" />}
                </td>
                <td className="progress-cell">
                  <div className="detail-line">
                    <span>
                      {u.known}/{u.total} từ
                    </span>
                    <b>{percent(u.known, u.total)}%</b>
                  </div>
                  <Bar part={u.known} total={u.total} className="progress-slim" />
                </td>
                <td className="num">
                  {u.answers ? (
                    <>
                      {u.correct}/{u.answers}
                      <small> ({percent(u.correct, u.answers)}%)</small>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="num">{u.hard.length > 0 ? <span className="hard-wrong">🔥 {u.hard.length}</span> : '0'}</td>
                <td className="num">
                  {u.listenAttempts ? (
                    <>
                      {u.listenDone} bài<small> · {u.listenAttempts} lượt</small>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="num">{u.activeDays.length || '—'}</td>
                <td className="nowrap" title={formatDateTime(u.updatedAt)}>
                  {relativeTime(u.updatedAt)}
                </td>
                <td className="nowrap">{u.createdAt ? formatDate(dateKey(u.createdAt)) : '—'}</td>
              </tr>,
              expanded && (
                <tr key={u.key + '-detail'} className="learner-detail-row">
                  <td colSpan={8}>
                    <LearnerDetail u={u} today={today} />
                  </td>
                </tr>
              ),
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminDashboard({ token, onLogout }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setReport(await fetchAdminReport(token))
    } catch (e) {
      if (e.status === 401) {
        onLogout('Phiên quản trị đã hết hạn, hãy đăng nhập lại.')
        return
      }
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const today = dateKey()
  const users = useMemo(() => (report ? report.users.map(summarize) : []), [report])

  const weekAgo = shiftDays(today, -6)
  const monthStart = today.slice(0, 8) + '01'
  const activeToday = users.filter((u) => isActive(u.data.activity[today]))
  const activeWeek = users.filter((u) => effort(sumRange(u.data.activity, weekAgo, today)) > 0)
  const todayTotals = users.reduce((acc, u) => addTotals(acc, u.data.activity[today]), emptyTotals())
  const monthTotals = users.reduce(
    (acc, u) => addTotals(acc, sumRange(u.data.activity, monthStart, today)),
    emptyTotals(),
  )
  const knownAll = users.reduce((n, u) => n + u.known, 0)
  const totalAll = users.reduce((n, u) => n + u.total, 0)

  return (
    <div className="page admin-page">
      <header className="app-header">
        <h1>🛡️ Bảng điều khiển</h1>
        <p className="subtitle">Tình hình học của mọi người trên máy chủ này</p>
        <div className="user-bar">
          <span className="user-name">🔐 admin</span>
          {report && (
            <span className="sync-badge sync-saved" title={formatDateTime(report.generatedAt)}>
              ☁️ Cập nhật {relativeTime(report.generatedAt)}
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            {loading ? '⏳ Đang tải…' : '🔄 Tải lại'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onLogout()}>
            Đăng xuất
          </button>
        </div>
      </header>

      {error && (
        <div className="card">
          <p className="err-note">⚠️ Không tải được báo cáo: {error}</p>
          <button className="btn btn-primary" onClick={load}>
            🔄 Thử lại
          </button>
        </div>
      )}

      {!report && loading && (
        <div className="card empty">
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          Đang tải dữ liệu người học…
        </div>
      )}

      {report && (
        <>
          <div className="kpi-row">
            <Kpi icon="👥" label="Người học" value={users.length} />
            <Kpi
              icon="🟢"
              label="Học hôm nay"
              value={activeToday.length}
              sub={activeToday.map((u) => u.name).join(', ') || 'chưa có ai'}
            />
            <Kpi icon="📅" label="Học trong 7 ngày qua" value={activeWeek.length} />
            <Kpi
              icon="✍️"
              label="Câu trả lời hôm nay"
              value={todayTotals.answers}
              sub={`tháng này: ${monthTotals.answers} câu · ${percent(monthTotals.correct, monthTotals.answers)}% đúng`}
            />
            <Kpi
              icon="✅"
              label="Từ đã thuộc (mọi người)"
              value={`${percent(knownAll, totalAll)}%`}
              sub={`${knownAll}/${totalAll} từ`}
            />
          </div>

          <ActivityChart users={users} today={today} />

          <div className="section-head">
            <h2>👥 Tiến độ người học ({users.length})</h2>
            <span className="admin-note">Bấm vào một dòng để xem chi tiết</span>
          </div>
          <div className="card" style={{ padding: 10 }}>
            <LearnerTable users={users} today={today} />
          </div>

          <Reports users={users} today={today} />
        </>
      )}
    </div>
  )
}

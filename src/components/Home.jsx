import { HARD_SHARE, HARD_WRONG_MIN, MASTER_STREAK, shuffle } from '../lib/wordStats.js'

const SYNC_LABEL = {
  saving: { icon: '⏳', text: 'Đang lưu…', title: 'Đang lưu tiến độ lên máy chủ' },
  saved: { icon: '☁️', text: 'Đã lưu', title: 'Tiến độ đã lưu trên máy chủ' },
  offline: {
    icon: '⚠️',
    text: 'Chưa lưu được',
    title: 'Không kết nối được máy chủ – tiến độ tạm giữ trong trình duyệt, sẽ tự thử lại',
  },
}

// Cộng số đếm các phần của một unit (mục lục do máy chủ tính, không cần tải từ)
export function unitTotals(u) {
  return u.sections.reduce(
    (acc, s) => ({ total: acc.total + s.total, known: acc.known + s.known, hard: acc.hard + s.hard }),
    { total: 0, known: 0, hard: 0 },
  )
}

// Trang chủ chỉ có MỤC LỤC (`units`: tên + số đếm từng phần). Các nút học cần
// từ thì gọi App tải (onRandomTest, onStudyUnknown, onQuizAll, onWritingAll,
// onUnitStudy) — `busy` = đang tải, `notice` = lỗi tải gần nhất.
export default function Home({
  units,
  userName,
  syncStatus,
  busy,
  notice,
  onLogout,
  onCreate,
  onOpenUnit,
  onOpenSettings,
  onRandomTest,
  onStudyUnknown,
  onQuizAll,
  onWritingAll,
  onUnitStudy,
  onStartFlashcards,
  onStartQuiz,
  onStartWriting,
}) {
  const all = units.reduce(
    (acc, u) => {
      const t = unitTotals(u)
      return { total: acc.total + t.total, known: acc.known + t.known, hard: acc.hard + t.hard }
    },
    { total: 0, known: 0, hard: 0 },
  )
  const unknown = all.total - all.known
  const sync = SYNC_LABEL[syncStatus] || SYNC_LABEL.saved

  return (
    <div className="page">
      <header className="app-header">
        <button className="btn btn-ghost settings-btn" title="Cài đặt ảnh AI" onClick={onOpenSettings}>
          ⚙️
        </button>
        <h1>📚 Học Từ Vựng B1</h1>
        <p className="subtitle">Học từ mới theo unit với flashcard và bài kiểm tra</p>
        <div className="user-bar">
          <span className="user-name">👤 {userName}</span>
          <span className={`sync-badge sync-${syncStatus}`} title={sync.title}>
            {sync.icon} {sync.text}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onLogout} title="Đăng nhập bằng tên khác">
            Đổi người dùng
          </button>
        </div>
      </header>

      {notice && <p className="err-note">⚠️ {notice}</p>}

      {all.total > 0 && (
        <div className="global-stats card">
          <div className="stat-row">
            <span>
              Tổng cộng: <b>{all.total}</b> từ · Đã thuộc: <b>{all.known}</b> · Chưa thuộc: <b>{unknown}</b>
              {all.hard > 0 && (
                <>
                  {' '}
                  ·{' '}
                  <span
                    title={`${all.hard} từ đã trả lời sai từ ${HARD_WRONG_MIN} lần trở lên (nhãn 🔥 trong trang unit). Kiểm tra ngẫu nhiên dành khoảng ${Math.round(HARD_SHARE * 100)}% đề cho các từ này; trả lời đúng ${MASTER_STREAK} lần liên tiếp thì từ rời khỏi nhóm.`}
                  >
                    🔥 Hay sai: <b>{all.hard}</b>
                  </span>
                </>
              )}
              {busy && <span className="hint"> · ⏳ đang tải từ…</span>}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${all.total ? (all.known / all.total) * 100 : 0}%` }} />
          </div>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              disabled={busy || all.total < 2}
              title={
                all.hard > 0
                  ? `Khoảng ${Math.round(HARD_SHARE * 100)}% đề ưu tiên lấy từ ${all.hard} từ hay sai, phần còn lại bốc ngẫu nhiên trong tất cả các unit`
                  : 'Bốc ngẫu nhiên 10-15 từ trong tất cả các unit'
              }
              onClick={onRandomTest}
            >
              🎲 Kiểm tra ngẫu nhiên (10-15 từ)
            </button>
            <button className="btn btn-warning" disabled={busy || unknown === 0} onClick={onStudyUnknown}>
              🔥 Học từ chưa thuộc ({unknown})
            </button>
            <button className="btn btn-outline" disabled={busy || all.total < 2} onClick={onQuizAll}>
              📝 Kiểm tra tổng hợp
            </button>
            <button className="btn btn-outline" disabled={busy || all.total === 0} onClick={onWritingAll}>
              ✍️ Kiểm tra viết
            </button>
          </div>
        </div>
      )}

      <div className="section-head">
        <h2>Các Unit của bạn</h2>
        <button className="btn btn-primary" onClick={onCreate}>
          ＋ Tạo Unit mới
        </button>
      </div>

      {units.length === 0 ? (
        <div className="empty card">
          <p>
            Chưa có unit nào. Bấm <b>＋ Tạo Unit mới</b> rồi import file từ vựng (PDF) của bạn để
            bắt đầu học nhé!
          </p>
        </div>
      ) : (
        <div className="unit-grid">
          {units.map((u) => {
            const t = unitTotals(u)
            return (
              <div key={u.id} className="unit-card card" onClick={() => onOpenUnit(u.id)}>
                <h3>{u.name}</h3>
                <p className="unit-meta">
                  {t.total} từ · đã thuộc {t.known}/{t.total}
                  {u.sections.length > 1 && ` · ${u.sections.length} phần`}
                </p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${t.total ? (t.known / t.total) * 100 : 0}%` }} />
                </div>
                <div className="btn-row" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={busy || t.total === 0}
                    onClick={() => onUnitStudy(u.id, (items) => onStartFlashcards(items, `🃏 ${u.name}`))}
                  >
                    🃏 Học
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={busy || t.total < 2}
                    onClick={() => onUnitStudy(u.id, (items) => onStartQuiz(shuffle(items), `📝 ${u.name}`))}
                  >
                    📝 Kiểm tra
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={busy || t.total === 0}
                    onClick={() => onUnitStudy(u.id, (items) => onStartWriting(shuffle(items), `✍️ ${u.name}`))}
                  >
                    ✍️ Viết
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

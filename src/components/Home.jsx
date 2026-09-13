import { useState } from 'react'
import { speak } from '../lib/speech.js'
import { HARD_WRONG_MIN, MASTER_STREAK, hardItems, pickRandomTest } from '../lib/wordStats.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const SYNC_LABEL = {
  saving: { icon: '⏳', text: 'Đang lưu…', title: 'Đang lưu tiến độ lên máy chủ' },
  saved: { icon: '☁️', text: 'Đã lưu', title: 'Tiến độ đã lưu trên máy chủ' },
  offline: {
    icon: '⚠️',
    text: 'Chưa lưu được',
    title: 'Không kết nối được máy chủ – tiến độ tạm giữ trong trình duyệt, sẽ tự thử lại',
  },
}

const HARD_PREVIEW = 8 // số từ hay sai hiện sẵn, còn lại ẩn sau nút "xem thêm"

// Khối thống kê các từ hay trả lời sai + nút ôn riêng nhóm này
function HardWords({ items, stats, onStartFlashcards, onStartQuiz, onStartWriting }) {
  const [expanded, setExpanded] = useState(false)
  const hard = hardItems(items, stats)
  if (hard.length === 0) return null
  const shown = expanded ? hard : hard.slice(0, HARD_PREVIEW)

  return (
    <div className="card hard-card">
      <div className="section-head" style={{ margin: 0 }}>
        <h2>🔥 Từ hay sai ({hard.length})</h2>
      </div>
      <p className="hard-help">
        Từ trả lời sai từ <b>{HARD_WRONG_MIN} lần</b> trở lên sẽ vào đây và được ưu tiên bốc vào
        bài kiểm tra ngẫu nhiên. Trả lời đúng <b>{MASTER_STREAK} lần liên tiếp</b> thì tự rời khỏi
        danh sách.
      </p>
      <ul className="hard-list">
        {shown.map(({ word }) => {
          const e = stats[word.id]
          return (
            <li key={word.id}>
              <div className="hard-word">
                <b>{word.word}</b>
                {word.ipa && <span className="ipa"> /{word.ipa}/</span>} — {word.meaning}
                <button className="btn-speak" onClick={() => speak(word.word)}>
                  🔊
                </button>
              </div>
              <div className="hard-meta">
                <span className="hard-wrong">❌ sai {e.wrong}</span>
                <span>✅ đúng {e.correct}</span>
                <span className="hard-streak" title="Số lần đúng liên tiếp cần có để rời danh sách">
                  🎯 {e.streak}/{MASTER_STREAK}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
      {hard.length > HARD_PREVIEW && (
        <button className="btn btn-ghost btn-sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '▲ Thu gọn' : `▼ Xem thêm ${hard.length - HARD_PREVIEW} từ`}
        </button>
      )}
      <div className="btn-row">
        <button
          className="btn btn-warning"
          onClick={() => onStartFlashcards(shuffle(hard), '🔥 Ôn từ hay sai')}
        >
          🃏 Ôn lại nhóm này
        </button>
        <button
          className="btn btn-outline"
          disabled={hard.length < 2}
          onClick={() => onStartQuiz(shuffle(hard), '📝 Kiểm tra từ hay sai')}
        >
          📝 Kiểm tra
        </button>
        <button
          className="btn btn-outline"
          onClick={() => onStartWriting(shuffle(hard), '✍️ Viết từ hay sai')}
        >
          ✍️ Kiểm tra viết
        </button>
      </div>
    </div>
  )
}

export default function Home({
  units,
  wordStats,
  userName,
  syncStatus,
  onLogout,
  onCreate,
  onOpenUnit,
  onStartFlashcards,
  onStartQuiz,
  onStartWriting,
  onOpenSettings,
}) {
  const allItems = units.flatMap((u) => u.words.map((word) => ({ unitId: u.id, word })))
  const unknownItems = allItems.filter(({ word }) => !word.known)
  const totalKnown = allItems.length - unknownItems.length
  const hardCount = hardItems(allItems, wordStats).length
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

      {allItems.length > 0 && (
        <div className="global-stats card">
          <div className="stat-row">
            <span>
              Tổng cộng: <b>{allItems.length}</b> từ · Đã thuộc: <b>{totalKnown}</b> · Chưa thuộc:{' '}
              <b>{unknownItems.length}</b>
              {hardCount > 0 && (
                <>
                  {' '}
                  · Hay sai: <b>{hardCount}</b>
                </>
              )}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${allItems.length ? (totalKnown / allItems.length) * 100 : 0}%` }}
            />
          </div>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              disabled={allItems.length < 2}
              title={
                hardCount > 0
                  ? 'Một phần đề ưu tiên lấy từ nhóm từ hay sai'
                  : 'Bốc ngẫu nhiên 10-15 từ trong tất cả các unit'
              }
              onClick={() => {
                const picked = pickRandomTest(allItems, wordStats)
                onStartQuiz(picked, `🎲 Kiểm tra ngẫu nhiên (${picked.length} từ)`)
              }}
            >
              🎲 Kiểm tra ngẫu nhiên (10-15 từ)
            </button>
            <button
              className="btn btn-warning"
              disabled={unknownItems.length === 0}
              onClick={() => onStartFlashcards(shuffle(unknownItems), '🔥 Học từ chưa thuộc')}
            >
              🔥 Học từ chưa thuộc ({unknownItems.length})
            </button>
            <button
              className="btn btn-outline"
              disabled={allItems.length < 2}
              onClick={() => onStartQuiz(shuffle(allItems), '📝 Kiểm tra tổng hợp')}
            >
              📝 Kiểm tra tổng hợp
            </button>
            <button
              className="btn btn-outline"
              onClick={() => onStartWriting(shuffle(allItems), '✍️ Kiểm tra viết tổng hợp')}
            >
              ✍️ Kiểm tra viết
            </button>
          </div>
        </div>
      )}

      <HardWords
        items={allItems}
        stats={wordStats}
        onStartFlashcards={onStartFlashcards}
        onStartQuiz={onStartQuiz}
        onStartWriting={onStartWriting}
      />

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
            const known = u.words.filter((w) => w.known).length
            return (
              <div key={u.id} className="unit-card card" onClick={() => onOpenUnit(u.id)}>
                <h3>{u.name}</h3>
                <p className="unit-meta">
                  {u.words.length} từ · đã thuộc {known}/{u.words.length}
                </p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${u.words.length ? (known / u.words.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="btn-row" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      onStartFlashcards(
                        u.words.map((word) => ({ unitId: u.id, word })),
                        `🃏 ${u.name}`,
                      )
                    }
                  >
                    🃏 Học
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={u.words.length < 2}
                    onClick={() =>
                      onStartQuiz(
                        shuffle(u.words.map((word) => ({ unitId: u.id, word }))),
                        `📝 ${u.name}`,
                      )
                    }
                  >
                    📝 Kiểm tra
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() =>
                      onStartWriting(
                        shuffle(u.words.map((word) => ({ unitId: u.id, word }))),
                        `✍️ ${u.name}`,
                      )
                    }
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

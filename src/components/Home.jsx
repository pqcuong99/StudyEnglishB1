function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Chọn ngẫu nhiên 10-15 từ (hoặc ít hơn nếu chưa đủ từ) cho bài kiểm tra nhanh
function pickRandom(items, min = 10, max = 15) {
  const n = Math.min(items.length, min + Math.floor(Math.random() * (max - min + 1)))
  return shuffle(items).slice(0, n)
}

export default function Home({
  units,
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

  return (
    <div className="page">
      <header className="app-header">
        <button className="btn btn-ghost settings-btn" title="Cài đặt ảnh AI" onClick={onOpenSettings}>
          ⚙️
        </button>
        <h1>📚 Học Từ Vựng B1</h1>
        <p className="subtitle">Học từ mới theo unit với flashcard và bài kiểm tra</p>
      </header>

      {allItems.length > 0 && (
        <div className="global-stats card">
          <div className="stat-row">
            <span>
              Tổng cộng: <b>{allItems.length}</b> từ · Đã thuộc: <b>{totalKnown}</b> · Chưa thuộc:{' '}
              <b>{unknownItems.length}</b>
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
              onClick={() => {
                const picked = pickRandom(allItems)
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

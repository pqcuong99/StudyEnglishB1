import { useEffect, useState } from 'react'
import { apiBase, listUsers } from '../lib/api.js'
import { NAME_MAX, isValidName, normalizeName, userKey } from '../lib/userKey.js'
import { getRecentUsers } from '../lib/sync.js'

// Màn hình nhập tên: tiến độ học được lưu theo tên trên máy chủ, tên được nhớ
// trong trình duyệt để lần sau vào thẳng.
export default function Login({ onLogin, error }) {
  const [name, setName] = useState('')
  const [serverUsers, setServerUsers] = useState(null) // null = đang tải
  const [serverError, setServerError] = useState(null)
  const recent = getRecentUsers()

  useEffect(() => {
    let alive = true
    listUsers()
      .then((list) => alive && setServerUsers(list || []))
      .catch((e) => alive && setServerError(e.message))
    return () => {
      alive = false
    }
  }, [])

  const valid = isValidName(name)

  function submit(e) {
    e.preventDefault()
    if (valid) onLogin(normalizeName(name))
  }

  // tên trên máy chủ chưa có trong "gần đây" của máy này
  const recentKeys = new Set(recent.map(userKey))
  const others = (serverUsers || []).filter((u) => !recentKeys.has(userKey(u.name)))

  return (
    <div className="page login-page">
      <header className="app-header">
        <h1>📚 Học Từ Vựng B1</h1>
        <p className="subtitle">Học từ mới theo unit với flashcard và bài kiểm tra</p>
      </header>

      <form className="card login-card" onSubmit={submit}>
        <h2>👋 Bạn là ai?</h2>
        <p className="login-help">
          Nhập tên để lưu <b>tiến trình học của riêng bạn</b> (từ đã thuộc, từ hay sai, bài
          nghe đã làm). Lần sau mở lại trên trình duyệt này sẽ vào thẳng, không cần nhập lại.
        </p>
        <div className="login-row">
          <input
            className="input"
            autoFocus
            maxLength={NAME_MAX}
            placeholder="Tên của bạn (vd. Hồng)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-primary btn-lg" type="submit" disabled={!valid}>
            Bắt đầu học →
          </button>
        </div>

        {recent.length > 0 && (
          <div className="login-chips">
            <span className="login-chips-label">Gần đây trên máy này:</span>
            {recent.map((n) => (
              <button key={n} type="button" className="chip" onClick={() => onLogin(n)}>
                👤 {n}
              </button>
            ))}
          </div>
        )}

        {others.length > 0 && (
          <div className="login-chips">
            <span className="login-chips-label">Đã có tiến độ trên máy chủ:</span>
            {others.map((u) => (
              <button key={u.name} type="button" className="chip" onClick={() => onLogin(u.name)}>
                👤 {u.name}
              </button>
            ))}
          </div>
        )}

        {serverUsers === null && !serverError && <p className="login-note">Đang kết nối máy chủ…</p>}
        {serverError && (
          <p className="login-note err-note">
            ⚠️ Không kết nối được máy chủ tiến độ ({apiBase()}): {serverError}. Bạn vẫn có thể
            học tiếp nếu tên này đã từng dùng trên trình duyệt này; kết quả sẽ được đồng bộ khi
            máy chủ hoạt động trở lại.
          </p>
        )}
        {error && <p className="login-note err-note">⚠️ {error}</p>}
      </form>
    </div>
  )
}

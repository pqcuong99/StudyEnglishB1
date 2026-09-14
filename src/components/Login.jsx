import { useEffect, useState } from 'react'
import { apiBase, listUsers } from '../lib/api.js'
import { NAME_MAX, isAdminName, isValidName, normalizeName } from '../lib/userKey.js'

// Màn hình nhập tên: tiến độ học được lưu theo tên trên máy chủ, tên được nhớ
// trong trình duyệt để lần sau vào thẳng. Không gợi ý tên người khác (mỗi người
// tự gõ tên mình). Gõ tên "admin" (không phân biệt hoa thường) thì hiện thêm ô
// mật khẩu để vào bảng điều khiển quản trị.
export default function Login({ onLogin, onAdminLogin, error }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [adminError, setAdminError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)

  // chỉ để báo sớm nếu không kết nối được máy chủ tiến độ
  useEffect(() => {
    let alive = true
    listUsers().catch((e) => alive && setServerError(e.message))
    return () => {
      alive = false
    }
  }, [])

  const admin = isAdminName(name)
  const valid = admin ? password.length > 0 && !busy : isValidName(name)

  async function submit(e) {
    e.preventDefault()
    if (!valid) return
    if (!admin) {
      onLogin(normalizeName(name))
      return
    }
    setBusy(true)
    setAdminError(null)
    try {
      await onAdminLogin(password)
    } catch (err) {
      setAdminError(err.status === 401 ? 'Sai mật khẩu, thử lại nhé.' : `Không đăng nhập được: ${err.message}`)
      setBusy(false)
    }
  }

  return (
    <div className="page login-page">
      <header className="app-header">
        <h1>📚 Học Từ Vựng B1</h1>
        <p className="subtitle">Học từ mới theo unit với flashcard và bài kiểm tra</p>
      </header>

      <form className={`card login-card ${admin ? 'login-admin' : ''}`} onSubmit={submit}>
        <h2>{admin ? '🔐 Quản trị viên' : '👋 Bạn là ai?'}</h2>
        {admin ? (
          <p className="login-help">
            Nhập mật khẩu để mở <b>bảng điều khiển</b>: danh sách người đã học, tiến độ từng
            người và báo cáo theo ngày / tháng. Tài khoản này không có màn học.
          </p>
        ) : (
          <p className="login-help">
            Nhập tên để lưu <b>tiến trình học của riêng bạn</b> (từ đã thuộc, từ hay sai, bài
            nghe đã làm). Lần sau mở lại trên trình duyệt này sẽ vào thẳng, không cần nhập lại.
          </p>
        )}
        <div className="login-row">
          <input
            className="input"
            autoFocus
            maxLength={NAME_MAX}
            placeholder="Tên của bạn (vd. Hồng)"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setAdminError(null)
            }}
          />
          {admin && (
            <input
              className="input"
              type="password"
              autoFocus
              autoComplete="current-password"
              placeholder="Mật khẩu quản trị"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setAdminError(null)
              }}
            />
          )}
          <button className="btn btn-primary btn-lg" type="submit" disabled={!valid}>
            {admin ? (busy ? 'Đang kiểm tra…' : 'Vào bảng điều khiển →') : 'Bắt đầu học →'}
          </button>
        </div>
        {adminError && <p className="login-note err-note">⚠️ {adminError}</p>}

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

import { useEffect, useState } from 'react'
import { sendFeedback } from '../lib/api.js'

// Popup "Liên hệ / góp ý" ở trang chủ: hiện kênh liên hệ trực tiếp và một form
// gửi góp ý lên máy chủ (POST /api/feedback). Góp ý chỉ quản trị viên xem được
// trong bảng điều khiển; người gửi phải để lại sđt hoặc email để được liên hệ lại.

const TELEGRAM = 'https://t.me/pq_cuong'
const PHONE = '0967231263'
const MAX_LEN = 2000

const PHONE_RE = /^\+?[0-9 .-]{8,15}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function FeedbackModal({ userName, onClose }) {
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    const c = contact.trim()
    const m = message.trim()
    if (!PHONE_RE.test(c) && !EMAIL_RE.test(c)) {
      setError('Hãy nhập số điện thoại hoặc email hợp lệ để mình liên hệ lại.')
      return
    }
    if (m.length < 3) {
      setError('Hãy nhập nội dung góp ý.')
      return
    }
    setError(null)
    setStatus('sending')
    try {
      await sendFeedback({ name: userName, contact: c, message: m })
      setStatus('sent')
    } catch (err) {
      setError(err.status ? err.message : 'Không kết nối được máy chủ, hãy thử lại.')
      setStatus('idle')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-ghost btn-sm modal-close" onClick={onClose} title="Đóng">
          ✕
        </button>
        <h2>💬 Liên hệ & góp ý</h2>

        <div className="contact-list">
          <a className="contact-item" href={TELEGRAM} target="_blank" rel="noreferrer">
            <span>✈️ Telegram</span>
            <b>@pq_cuong</b>
          </a>
          <a className="contact-item" href={`tel:${PHONE}`}>
            <span>📞 Điện thoại</span>
            <b>{PHONE}</b>
          </a>
        </div>

        {status === 'sent' ? (
          <div className="feedback-sent">
            <p>✅ Đã gửi góp ý. Cảm ơn bạn! Mình sẽ liên hệ lại qua {contact.trim()} nếu cần.</p>
            <button className="btn btn-primary" onClick={onClose}>
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="admin-note">Hoặc gửi góp ý trực tiếp tại đây:</p>
            <label className="field-label" htmlFor="fb-contact">
              Số điện thoại hoặc email <span className="hard-wrong">*</span>
            </label>
            <input
              id="fb-contact"
              className="input"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="VD: 09xxxxxxxx hoặc ban@gmail.com"
              maxLength={120}
              autoFocus
            />
            <label className="field-label" htmlFor="fb-message" style={{ marginTop: 12 }}>
              Nội dung góp ý <span className="hard-wrong">*</span>
            </label>
            <textarea
              id="fb-message"
              className="input textarea"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bạn thấy chỗ nào chưa ổn, muốn thêm tính năng gì…"
              maxLength={MAX_LEN}
            />
            <div className="admin-note" style={{ textAlign: 'right', marginTop: -6 }}>
              {message.length}/{MAX_LEN}
            </div>
            {error && <p className="err-note">⚠️ {error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
                {status === 'sending' ? '⏳ Đang gửi…' : '📨 Gửi góp ý'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

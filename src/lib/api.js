// Gọi API tiến độ (server/index.js). Mặc định API chạy cùng máy với trang web
// ở cổng 37390; đổi bằng biến VITE_API_BASE khi build (vd. http://1.2.3.4:4000).
const API_BASE =
  (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '') ||
  `${location.protocol}//${location.hostname}:37390`

export function apiBase() {
  return API_BASE
}

async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      msg = (await res.json()).error || msg
    } catch {
      // không phải JSON
    }
    throw new Error(msg)
  }
  return res.json()
}

// [{ name, updatedAt }] — mới hoạt động xếp trước
export function listUsers() {
  return request('/api/users')
}

// { name, key, createdAt, updatedAt, data } hoặc null nếu chưa có
export function fetchUser(key) {
  return request(`/api/users/${encodeURIComponent(key)}`)
}

// `keepalive` để request vẫn đi khi đang đóng tab — trình duyệt chỉ cho phép
// với dữ liệu < 64 KB, lớn hơn thì gửi kiểu thường (bản đệm sẽ đẩy lại sau)
const KEEPALIVE_MAX = 60000

export function saveUser(key, name, data, { keepalive = false } = {}) {
  const body = JSON.stringify({ name, data })
  return request(`/api/users/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body,
    keepalive: keepalive && body.length < KEEPALIVE_MAX,
  })
}

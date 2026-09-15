// Gọi API tiến độ (server/index.js). Mặc định gọi cùng địa chỉ với trang web
// (`/api/...`): trên VPS, IIS chuyển tiếp /api sang Node (server/install-proxy.bat),
// ở máy dev Vite proxy sang cổng 37390 (vite.config.js). Muốn gọi thẳng API ở địa
// chỉ khác thì đặt VITE_API_BASE=http://host:port khi build.
//
// Dữ liệu được chia nhỏ: tổng quan (mục lục unit + số đếm) tải khi đăng nhập,
// từ của từng phần chỉ tải khi mở phần đó, mỗi thay đổi là một request nhỏ.
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')

export function apiBase() {
  return API_BASE || `${location.origin}/api`
}

// Gửi một request; 404 -> null; lỗi khác -> Error có `status` (undefined = mất mạng)
export async function request(path, { method = 'GET', body, headers, keepalive } = {}) {
  const res = await fetch(API_BASE + path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    keepalive,
  })
  if (res.status === 404) return null
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      msg = (await res.json()).error || msg
    } catch {
      // không phải JSON
    }
    throw Object.assign(new Error(msg), { status: res.status })
  }
  return res.json()
}

const enc = encodeURIComponent
export const userPath = (key) => `/api/users/${enc(key)}`
export const sectionPath = (key, unitId, sectionId) => `${userPath(key)}/units/${enc(unitId)}/sections/${enc(sectionId)}`
export const wordPath = (key, unitId, sectionId, wordId) => `${sectionPath(key, unitId, sectionId)}/words/${enc(wordId)}`

// ---------- quản trị ----------
// Đăng nhập admin: { token, expiresAt }; sai mật khẩu -> lỗi có status 401
export function adminLogin(password) {
  return request('/api/admin/login', { method: 'POST', body: { password } })
}

export function adminLogout(token) {
  return request('/api/admin/logout', { method: 'POST', headers: { 'X-Admin-Token': token } })
}

// { generatedAt, users: [{ name, key, createdAt, updatedAt, units, hard, correct,
//   wrong, listening, activity }] } — token hết hạn -> lỗi có status 401
export function fetchAdminReport(token) {
  return request('/api/admin/report', { headers: { 'X-Admin-Token': token } })
}

// ---------- người dùng ----------
// [{ name, updatedAt }] — mới hoạt động xếp trước
export function listUsers() {
  return request('/api/users')
}

// Đăng nhập: tạo người dùng nếu chưa có (kèm unit mẫu) rồi trả về tổng quan
//   { id, name, createdAt, updatedAt, units: [{ id, name, sections: [{ id, name, total, known, hard }] }] }
export function openUser(key, name) {
  return request(userPath(key), { method: 'PUT', body: { name } })
}

export function fetchOverview(key) {
  return request(userPath(key))
}

// { id, name, unitId, words } hoặc null nếu phần không còn
export function fetchSection(key, unitId, sectionId) {
  return request(sectionPath(key, unitId, sectionId))
}

// { id, name, createdAt, sections: [{ id, name, words }] }
export function fetchUnit(key, unitId) {
  return request(`${userPath(key)}/units/${enc(unitId)}`)
}

// mọi từ (hoặc chỉ từ chưa thuộc): [{ unitId, sectionId, word }]
export function fetchAllItems(key, { unknownOnly = false } = {}) {
  return request(`${userPath(key)}/words${unknownOnly ? '?unknown=1' : ''}`)
}

// đề kiểm tra ngẫu nhiên 10-15 từ do máy chủ bốc (ưu tiên từ hay sai)
export function fetchRandomTest(key) {
  return request(`${userPath(key)}/random-test`)
}

export function fetchListening(key) {
  return request(`${userPath(key)}/listening`)
}

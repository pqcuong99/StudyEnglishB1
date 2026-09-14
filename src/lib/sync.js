// Đồng bộ dữ liệu người dùng lên máy chủ (server/index.js).
//
// Máy chủ là nguồn chính. Trình duyệt giữ thêm một bản đệm theo từng người
// (`progress:<key>`) để: (1) vẫn học được khi mất mạng, (2) không mất những
// thay đổi cuối cùng nếu đóng tab trước khi kịp lưu — lần mở sau, bản nào có
// `updatedAt` mới hơn sẽ thắng.
import { saveUser } from './api.js'

const CURRENT_KEY = 'current-user' // tên người đang đăng nhập trên trình duyệt này
const RECENT_KEY = 'recent-users' // vài tên gần đây để chọn nhanh ở màn đăng nhập
const CACHE_PREFIX = 'progress:'

const SAVE_DELAY = 700 // gộp các thay đổi liên tiếp trong 0.7s thành một lần lưu
const RETRY_DELAY = 8000 // lưu lỗi (mất mạng / server tắt) -> thử lại sau 8s
const ADMIN_TOKEN_KEY = 'admin-token' // sessionStorage: chỉ sống trong tab này

// Token quản trị nhớ theo tab (F5 vẫn ở bảng điều khiển; đóng tab là hết),
// không nhớ lâu như tên người học vì phải nhập lại mật khẩu mới an toàn.
export function getAdminToken() {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || null
  } catch {
    return null
  }
}

export function setAdminToken(token) {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  } catch {
    // không lưu được thì F5 phải nhập lại mật khẩu
  }
}

export function getCurrentUser() {
  try {
    return localStorage.getItem(CURRENT_KEY) || null
  } catch {
    return null
  }
}

export function setCurrentUser(name) {
  try {
    if (name) {
      localStorage.setItem(CURRENT_KEY, name)
      const recent = [name, ...getRecentUsers().filter((n) => n.toLowerCase() !== name.toLowerCase())]
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)))
    } else {
      localStorage.removeItem(CURRENT_KEY)
    }
  } catch {
    // không lưu được thì lần sau phải nhập lại tên
  }
}

export function getRecentUsers() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return Array.isArray(list) ? list.filter((n) => typeof n === 'string') : []
  } catch {
    return []
  }
}

export function readCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    const data = raw ? JSON.parse(raw) : null
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

export function writeCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data))
  } catch {
    // hết chỗ lưu -> chỉ còn bản trên máy chủ
  }
}

// Bộ lưu có gộp + thử lại. `onStatus` nhận 'saving' | 'saved' | 'offline'.
export function createSaver({ key, name, onStatus }) {
  let pending = null // dữ liệu mới nhất chưa đẩy lên máy chủ
  let timer = null
  let inflight = false
  let disposed = false

  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function schedule(data, delay = SAVE_DELAY) {
    if (disposed) return
    pending = data
    writeCache(key, data)
    onStatus?.('saving')
    clearTimer()
    timer = setTimeout(flush, delay)
  }

  async function flush({ keepalive = false } = {}) {
    clearTimer()
    if (!pending || inflight || disposed) return
    const data = pending
    pending = null
    inflight = true
    try {
      await saveUser(key, name, data, { keepalive })
      if (!pending) onStatus?.('saved')
    } catch {
      if (!pending) pending = data // giữ bản mới nhất để thử lại
      onStatus?.('offline')
      if (!disposed) timer = setTimeout(flush, RETRY_DELAY)
    } finally {
      inflight = false
      // có thay đổi mới trong lúc đang lưu -> lưu tiếp
      if (pending && !timer && !disposed) timer = setTimeout(flush, SAVE_DELAY)
    }
  }

  // Tab sắp bị ẩn / đóng: đẩy ngay bằng keepalive (trình duyệt vẫn gửi nốt sau
  // khi đóng nếu dữ liệu nhỏ; nếu không được thì bản đệm sẽ đẩy lên ở lần mở sau)
  function onVisibility() {
    if (document.visibilityState === 'hidden') flush({ keepalive: true })
  }
  const onPageHide = () => flush({ keepalive: true })
  const onOnline = () => flush()
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('online', onOnline)

  function dispose() {
    disposed = true
    clearTimer()
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('online', onOnline)
  }

  return { schedule, flush, dispose, hasPending: () => !!pending }
}

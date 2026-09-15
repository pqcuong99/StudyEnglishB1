// Đồng bộ với máy chủ (server/index.js).
//
// Máy chủ là nguồn chính, mọi thay đổi là một request nhỏ (đánh dấu một từ,
// trả lời một câu, nộp một bài nghe...). Các request được xếp vào HÀNG ĐỢI
// ghi trong localStorage (`ops:<key>`) rồi gửi lần lượt: mất mạng / đóng tab
// giữa chừng thì không mất, lần mở sau gửi tiếp. Dữ liệu đã tải (tổng quan,
// từng phần, tiến độ nghe) được đệm trong `cache:<key>:<tên>` để vẫn học được
// khi không kết nối được máy chủ.
import { request } from './api.js'

const CURRENT_KEY = 'current-user' // tên người đang đăng nhập trên trình duyệt này
const ADMIN_TOKEN_KEY = 'admin-token' // sessionStorage: chỉ sống trong tab này
const OPS_PREFIX = 'ops:'
const CACHE_PREFIX = 'cache:'
// khóa của bản cũ (cả dữ liệu người dùng trong một khóa) — không dùng nữa, dọn đi
const LEGACY_KEYS = ['recent-users', 'vocab-units-v1', 'vocab-units-v1-migrated', 'vocab-seed-version', 'listening-progress-v1', 'listening-progress-v1-migrated']

const SEND_DELAY = 300 // gộp các thay đổi liên tiếp trong 0.3s rồi gửi
const RETRY_DELAY = 8000 // gửi lỗi (mất mạng / server tắt) -> thử lại sau 8s

function lsGet(k) {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}

function lsSet(k, v) {
  try {
    if (v === null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  } catch {
    // hết chỗ lưu / bị chặn -> chỉ còn bản trên máy chủ
  }
}

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
  return lsGet(CURRENT_KEY)
}

export function setCurrentUser(name) {
  lsSet(CURRENT_KEY, name || null)
  for (const k of LEGACY_KEYS) lsSet(k, null)
  // bản đệm cũ (cả dữ liệu trong một khóa) không còn dùng
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('progress:')) localStorage.removeItem(k)
  } catch {
    // bỏ qua
  }
}

// ---------- bộ đệm đọc ----------
export function readCache(key, name) {
  try {
    const raw = lsGet(`${CACHE_PREFIX}${key}:${name}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeCache(key, name, value) {
  lsSet(`${CACHE_PREFIX}${key}:${name}`, value === null ? null : JSON.stringify(value))
}

// Tải từ máy chủ, đệm lại; máy chủ không trả lời thì dùng bản đệm (nếu có).
// Trả về { data, offline }; không có cả hai thì ném lỗi.
export async function cached(key, name, fetcher) {
  try {
    const data = await fetcher()
    writeCache(key, name, data)
    return { data, offline: false }
  } catch (err) {
    if (err.status) throw err // lỗi từ máy chủ (400/500) chứ không phải mất mạng
    const data = readCache(key, name)
    if (data === null) throw err
    return { data, offline: true }
  }
}

// ---------- hàng đợi ghi ----------
function readOps(key) {
  try {
    const v = JSON.parse(lsGet(OPS_PREFIX + key) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function hasPendingOps(key) {
  return readOps(key).length > 0
}

// `onStatus` nhận 'saving' | 'saved' | 'offline'
export function createQueue({ key, onStatus }) {
  let ops = readOps(key)
  let timer = null
  let inflight = false
  let disposed = false

  const persist = () => lsSet(OPS_PREFIX + key, ops.length ? JSON.stringify(ops) : null)

  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  // op = { method, path, body? } — path là đường dẫn API (bắt đầu bằng /api)
  function push(op) {
    if (disposed) return
    ops.push(op)
    persist()
    onStatus?.('saving')
    clearTimer()
    timer = setTimeout(flush, SEND_DELAY)
  }

  async function flush({ keepalive = false } = {}) {
    clearTimer()
    if (inflight || disposed) return
    if (ops.length === 0) {
      onStatus?.('saved')
      return
    }
    inflight = true
    onStatus?.('saving')
    try {
      while (ops.length) {
        const op = ops[0]
        try {
          await request(op.path, { method: op.method, body: op.body, keepalive })
        } catch (err) {
          // máy chủ từ chối (dữ liệu đã bị xóa / không hợp lệ): bỏ qua op này,
          // không để nó chặn cả hàng đợi. Mất mạng thì giữ lại và thử lại sau.
          if (!err.status || err.status >= 500) throw err
          console.warn('Bỏ qua thay đổi bị máy chủ từ chối:', op, err.message)
        }
        ops.shift()
        persist()
      }
      onStatus?.('saved')
    } catch {
      onStatus?.('offline')
      if (!disposed) timer = setTimeout(flush, RETRY_DELAY)
    } finally {
      inflight = false
      if (ops.length && !timer && !disposed) timer = setTimeout(flush, SEND_DELAY)
    }
  }

  // Tab sắp bị ẩn / đóng: đẩy ngay bằng keepalive (trình duyệt vẫn gửi nốt sau
  // khi đóng; không được thì hàng đợi trong localStorage sẽ gửi ở lần mở sau)
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

  return { push, flush, dispose, hasPending: () => ops.length > 0 }
}

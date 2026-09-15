// API lưu tiến độ học theo từng người dùng — chạy trên VPS cạnh IIS.
// Không cần cài thêm gói nào (chỉ dùng module có sẵn của Node >= 16).
//
//   node server/index.js            (mặc định cổng 37390)
//   PORT=4000 node server/index.js
//
// Dữ liệu: server/data/users/<tên>-<hash>/ (mỗi người một thư mục, mỗi phần
//          của unit một file — xem server/store.js). Log: server/data/api.log
//
// Endpoints (JSON, CORS mở vì không dùng cookie). `:id` = tên đăng nhập (đã
// mã hóa URL), mọi id khác chỉ gồm chữ, số, `-`, `_`:
//   GET    /api/health                                   -> { ok, users }
//   GET    /api/users                                    -> [{ name, updatedAt }]
//   PUT    /api/users/:id            body { name }       -> đăng nhập: tạo nếu chưa có (kèm unit
//                                                           mẫu) / nối từ mẫu mới; trả về tổng quan
//   GET    /api/users/:id                                -> tổng quan { id, name, createdAt,
//                                                           updatedAt, units: [mục lục] } | 404
//   GET    /api/users/:id/words[?unknown=1]              -> mọi từ [{ unitId, sectionId, word }]
//   GET    /api/users/:id/random-test[?n=]               -> đề ngẫu nhiên (ưu tiên từ hay sai)
//   GET    /api/users/:id/units/:unitId                  -> cả unit kèm từ của mọi phần
//   PUT    /api/users/:id/units/:unitId  body { name, sections: [{ id, name, words }] } -> tạo / thay
//   PATCH  /api/users/:id/units/:unitId  body { name }   -> đổi tên
//   DELETE /api/users/:id/units/:unitId
//   GET    /api/users/:id/units/:unitId/sections/:sectionId              -> { id, name, words }
//   PATCH  /api/users/:id/units/:unitId/sections/:sectionId/words/:wordId
//            body { known? | answer?, seed?, day? }      -> { word, summary }
//   DELETE /api/users/:id/units/:unitId/sections/:sectionId/words/:wordId -> { summary }
//   GET    /api/users/:id/listening                      -> tiến độ nghe
//   POST   /api/users/:id/listening/:exerciseId/:levelId body { correct, total, day? }
//
// Quản trị (đăng nhập bằng tên "admin" + mật khẩu, xem ADMIN_PASSWORD bên dưới):
//   POST /api/admin/login     -> body { password }  ->  { token, expiresAt } | 401
//   POST /api/admin/logout    -> header X-Admin-Token
//   GET  /api/admin/report    -> header X-Admin-Token -> { generatedAt, users: [...] }
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { ADMIN_KEY, isValidName, normalizeName, userKey } from '../src/lib/userKey.js'
import { createStore, isId } from './store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 37390
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const LOG_FILE = path.join(DATA_DIR, 'api.log')
const MAX_BODY = 5 * 1024 * 1024 // 5 MB — chỉ PUT cả unit mới lớn, còn lại vài chục byte

// Mật khẩu vào bảng điều khiển quản trị (đổi bằng biến môi trường ADMIN_PASSWORD).
// Đăng nhập đúng thì nhận một token tạm (giữ trong bộ nhớ, hết hạn sau 12 giờ
// hoặc khi API khởi động lại) để gọi các endpoint /api/admin/*.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Cuongpham@99'
const ADMIN_TOKEN_TTL = 12 * 60 * 60 * 1000
const ADMIN_FAIL_DELAY = 800 // ms chờ khi sai mật khẩu, để không dò được nhanh

fs.mkdirSync(DATA_DIR, { recursive: true })

function log(...parts) {
  const line = `[${new Date().toISOString()}] ${parts.join(' ')}`
  console.log(line)
  try {
    fs.appendFileSync(LOG_FILE, line + '\n')
  } catch {
    // không ghi được log thì thôi
  }
}

const store = createStore({ dataDir: DATA_DIR, log })
store.init()

// ---------- quản trị ----------
const adminTokens = new Map() // token -> hết hạn (ms)

function passwordMatches(given) {
  const a = Buffer.from(String(given ?? ''))
  const b = Buffer.from(ADMIN_PASSWORD)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function issueAdminToken() {
  for (const [t, exp] of adminTokens) if (exp < Date.now()) adminTokens.delete(t)
  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = Date.now() + ADMIN_TOKEN_TTL
  adminTokens.set(token, expiresAt)
  return { token, expiresAt }
}

// token gửi trong header riêng (không dùng Authorization để IIS không đụng vào)
function adminToken(req) {
  const t = String(req.headers['x-admin-token'] || '')
  const exp = adminTokens.get(t)
  if (!exp) return null
  if (exp < Date.now()) {
    adminTokens.delete(t)
    return null
  }
  return t
}

// ---------- HTTP ----------
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
  'Access-Control-Max-Age': '86400',
}

function send(res, status, body) {
  const json = JSON.stringify(body)
  res.writeHead(status, {
    ...CORS,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    'Cache-Control': 'no-store',
  })
  res.end(json)
}

const fail = (status, message) => Object.assign(new Error(message), { status })
const notFound = (res) => send(res, 404, { error: 'Không tìm thấy' })

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(fail(413, 'Dữ liệu quá lớn'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null)
      } catch {
        reject(fail(400, 'JSON không hợp lệ'))
      }
    })
    req.on('error', reject)
  })
}

// Các endpoint của người dùng: `seg` = các đoạn đường dẫn sau /api/users/:id
async function handleUser(req, res, key, seg, url) {
  const m = req.method
  const [a, unitId, b, sectionId, c, wordId] = seg

  // /api/users/:id
  if (seg.length === 0) {
    if (m === 'GET') {
      const ov = store.overview(key)
      return ov ? send(res, 200, ov) : send(res, 404, { error: 'Chưa có người dùng này' })
    }
    if (m === 'PUT' || m === 'POST') {
      const body = await readBody(req)
      const name = normalizeName(body?.name)
      if (!isValidName(name) || userKey(name) !== key) throw fail(400, 'Tên không khớp với khóa')
      const { created, overview } = store.open(key, name)
      log(created ? 'NEW ' : 'OPEN', name)
      return send(res, 200, overview)
    }
    return notFound(res)
  }

  // mọi thứ bên dưới đòi hỏi người dùng đã tồn tại
  if (!store.exists(key)) return send(res, 404, { error: 'Chưa có người dùng này' })

  if (a === 'words' && seg.length === 1 && m === 'GET') {
    return send(res, 200, store.allItems(key, { unknownOnly: url.searchParams.get('unknown') === '1' }))
  }
  if (a === 'random-test' && seg.length === 1 && m === 'GET') {
    return send(res, 200, store.randomTest(key, url.searchParams.get('n')))
  }

  if (a === 'listening') {
    if (seg.length === 1 && m === 'GET') return send(res, 200, store.listening(key))
    if (seg.length === 3 && m === 'POST' && isId(seg[1]) && isId(seg[2])) {
      const body = await readBody(req)
      return send(res, 200, store.recordListening(key, seg[1], seg[2], body))
    }
    return notFound(res)
  }

  if (a !== 'units' || !isId(unitId)) return notFound(res)

  // /api/users/:id/units/:unitId
  if (seg.length === 2) {
    if (m === 'GET') {
      const u = store.unit(key, unitId)
      return u ? send(res, 200, u) : notFound(res)
    }
    if (m === 'PUT') {
      const body = await readBody(req)
      const entry = store.putUnit(key, unitId, body)
      log('UNIT', key, unitId, `${entry.sections.reduce((n, s) => n + s.total, 0)} tu`)
      return send(res, 200, entry)
    }
    if (m === 'PATCH') {
      const body = await readBody(req)
      const u = store.renameUnit(key, unitId, body?.name)
      return u ? send(res, 200, u) : notFound(res)
    }
    if (m === 'DELETE') {
      if (!store.deleteUnit(key, unitId)) return notFound(res)
      log('DEL UNIT', key, unitId)
      return send(res, 200, { ok: true })
    }
    return notFound(res)
  }

  if (b !== 'sections' || !isId(sectionId)) return notFound(res)

  // /api/users/:id/units/:unitId/sections/:sectionId
  if (seg.length === 4) {
    if (m !== 'GET') return notFound(res)
    const s = store.section(key, unitId, sectionId)
    return s ? send(res, 200, s) : notFound(res)
  }

  if (c !== 'words' || !isId(wordId) || seg.length !== 6) return notFound(res)

  // /api/users/:id/units/:unitId/sections/:sectionId/words/:wordId
  if (m === 'PATCH') {
    const body = await readBody(req)
    const r = store.updateWord(key, unitId, sectionId, wordId, body)
    return r ? send(res, 200, r) : notFound(res)
  }
  if (m === 'DELETE') {
    const r = store.deleteWord(key, unitId, sectionId, wordId)
    return r ? send(res, 200, r) : notFound(res)
  }
  return notFound(res)
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const { pathname } = url

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS)
    res.end()
    return
  }

  // nhận mọi method để kiểm tra proxy (IIS) có chuyển tiếp cả PUT hay không
  if (pathname === '/api/health') {
    send(res, 200, { ok: true, users: store.index.size, method: req.method })
    return
  }

  if (req.method === 'GET' && pathname === '/api/users') {
    const list = [...store.index.values()].sort((a, b) => b.updatedAt - a.updatedAt)
    send(res, 200, list)
    return
  }

  if (pathname === '/api/admin/login' && req.method === 'POST') {
    const body = await readBody(req)
    if (!passwordMatches(body?.password)) {
      log('ADMIN sai mat khau tu', req.socket.remoteAddress || '?')
      await new Promise((r) => setTimeout(r, ADMIN_FAIL_DELAY))
      send(res, 401, { error: 'Sai mật khẩu' })
      return
    }
    log('ADMIN dang nhap')
    send(res, 200, issueAdminToken())
    return
  }

  if (pathname.startsWith('/api/admin/')) {
    const token = adminToken(req)
    if (!token) {
      send(res, 401, { error: 'Phiên quản trị đã hết hạn, hãy đăng nhập lại' })
      return
    }
    if (pathname === '/api/admin/logout' && req.method === 'POST') {
      adminTokens.delete(token)
      send(res, 200, { ok: true })
      return
    }
    if (pathname === '/api/admin/report' && req.method === 'GET') {
      send(res, 200, store.report())
      return
    }
    notFound(res)
    return
  }

  // /api/users/:id/... -> tên đã giải mã, kiểm tra hợp lệ rồi thành khóa
  const m = pathname.match(/^\/api\/users\/([^/]+)(\/.*)?$/)
  if (m) {
    let raw
    try {
      raw = decodeURIComponent(m[1])
    } catch {
      raw = ''
    }
    if (isValidName(raw)) {
      const key = userKey(raw)
      if (key === ADMIN_KEY) {
        // tên "admin" chỉ để mở bảng điều khiển, không có tiến độ học
        send(res, req.method === 'GET' ? 404 : 403, { error: 'Tên này dành cho quản trị viên' })
        return
      }
      const seg = (m[2] || '').split('/').filter(Boolean)
      await handleUser(req, res, key, seg, url)
      return
    }
  }

  notFound(res)
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    log('ERR ', req.method, req.url, err.message)
    if (!res.headersSent) send(res, err.status || 500, { error: err.message })
    else res.end()
  })
})

server.listen(PORT, () => {
  // không dấu để hiện đúng trên cửa sổ cmd của VPS (log file vẫn UTF-8)
  log(`API tien do chay tai http://0.0.0.0:${PORT}  (du lieu: ${store.usersDir}, ${store.index.size} nguoi dung)`)
})

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    log('Dung API (' + sig + ')')
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 1000).unref()
  })
}

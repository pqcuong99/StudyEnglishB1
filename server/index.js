// API lưu tiến độ học theo từng người dùng — chạy trên VPS cạnh IIS.
// Không cần cài thêm gói nào (chỉ dùng module có sẵn của Node >= 16).
//
//   node server/index.js            (mặc định cổng 37390)
//   PORT=4000 node server/index.js
//
// Dữ liệu: server/data/users/<tên>-<hash>.json, mỗi người một file.
// Log:     server/data/api.log
//
// Endpoints (JSON, CORS mở vì không dùng cookie):
//   GET  /api/health          -> { ok, users }
//   GET  /api/users           -> [{ name, updatedAt }]
//   GET  /api/users/:key      -> { name, key, createdAt, updatedAt, data } | 404
//   PUT  /api/users/:key      -> body { name, data }  ->  { ok, updatedAt }
//
// Quản trị (đăng nhập bằng tên "admin" + mật khẩu, xem ADMIN_PASSWORD bên dưới):
//   POST /api/admin/login     -> body { password }  ->  { token, expiresAt } | 401
//   POST /api/admin/logout    -> header X-Admin-Token
//   GET  /api/admin/report    -> header X-Admin-Token -> { generatedAt, users: [...] }
//                                (dữ liệu mọi người học, đã lược bớt để vẽ bảng điều khiển)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { ADMIN_KEY, isValidName, normalizeName, userKey } from '../src/lib/userKey.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 37390
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const USERS_DIR = path.join(DATA_DIR, 'users')
const LOG_FILE = path.join(DATA_DIR, 'api.log')
const MAX_BODY = 5 * 1024 * 1024 // 5 MB — dữ liệu một người chỉ vài chục KB

// Mật khẩu vào bảng điều khiển quản trị (đổi bằng biến môi trường ADMIN_PASSWORD).
// Đăng nhập đúng thì nhận một token tạm (giữ trong bộ nhớ, hết hạn sau 12 giờ
// hoặc khi API khởi động lại) để gọi các endpoint /api/admin/*.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Cuongpham@99'
const ADMIN_TOKEN_TTL = 12 * 60 * 60 * 1000
const ADMIN_FAIL_DELAY = 800 // ms chờ khi sai mật khẩu, để không dò được nhanh

fs.mkdirSync(USERS_DIR, { recursive: true })

function log(...parts) {
  const line = `[${new Date().toISOString()}] ${parts.join(' ')}`
  console.log(line)
  try {
    fs.appendFileSync(LOG_FILE, line + '\n')
  } catch {
    // không ghi được log thì thôi
  }
}

// ---------- lưu trữ ----------
// tên file dễ đọc (giữ chữ có dấu) + hash ngắn để không đụng nhau
function fileFor(key) {
  const slug = key.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '') || 'user'
  const hash = crypto.createHash('sha1').update(key).digest('hex').slice(0, 8)
  return path.join(USERS_DIR, `${slug}-${hash}.json`)
}

function readUser(key) {
  try {
    return JSON.parse(fs.readFileSync(fileFor(key), 'utf8'))
  } catch {
    return null
  }
}

// ghi tạm rồi đổi tên để file không bao giờ bị hỏng nửa chừng
function writeUser(key, doc) {
  const file = fileFor(key)
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(doc))
  fs.renameSync(tmp, file)
}

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

// Dữ liệu một người học cho bảng điều khiển: bỏ phiên âm, ảnh, ví dụ... chỉ giữ
// những gì cần để tính tiến độ (mỗi người còn vài KB thay vì vài chục KB).
function reportUser(doc) {
  const d = doc.data || {}
  const units = Array.isArray(d.units)
    ? d.units.map((u) => ({
        id: u.id,
        name: u.name,
        words: (u.words || []).map((w) => ({
          id: w.id,
          word: w.word,
          meaning: w.meaning,
          section: w.section,
          known: !!w.known,
        })),
      }))
    : []
  const obj = (v) => (v && typeof v === 'object' ? v : {})
  return {
    name: doc.name,
    key: doc.key,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    data: { units, wordStats: obj(d.wordStats), listening: obj(d.listening), activity: obj(d.activity) },
  }
}

// danh sách người dùng giữ trong bộ nhớ để GET /api/users không phải đọc hết file
const index = new Map() // key -> { name, updatedAt }
for (const f of fs.readdirSync(USERS_DIR)) {
  if (!f.endsWith('.json')) continue
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(USERS_DIR, f), 'utf8'))
    if (doc?.key && doc?.name) index.set(doc.key, { name: doc.name, updatedAt: doc.updatedAt || 0 })
  } catch {
    log('WARN file hỏng, bỏ qua:', f)
  }
}

// ---------- HTTP ----------
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Dữ liệu quá lớn'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null)
      } catch {
        reject(Object.assign(new Error('JSON không hợp lệ'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
}

// /api/users/<key> -> key đã giải mã, hoặc null nếu không hợp lệ
function keyFromPath(pathname) {
  const m = pathname.match(/^\/api\/users\/([^/]+)$/)
  if (!m) return null
  let raw
  try {
    raw = decodeURIComponent(m[1])
  } catch {
    return null
  }
  if (!isValidName(raw)) return null
  return userKey(raw)
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
    send(res, 200, { ok: true, users: index.size, method: req.method })
    return
  }

  if (req.method === 'GET' && pathname === '/api/users') {
    const list = [...index.values()].sort((a, b) => b.updatedAt - a.updatedAt)
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
      const users = []
      for (const k of index.keys()) {
        const doc = readUser(k)
        if (doc) users.push(reportUser(doc))
      }
      users.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      send(res, 200, { generatedAt: Date.now(), users })
      return
    }
    send(res, 404, { error: 'Không tìm thấy' })
    return
  }

  const key = keyFromPath(pathname)
  if (key === ADMIN_KEY) {
    // tên "admin" chỉ để mở bảng điều khiển, không có tiến độ học
    send(res, req.method === 'GET' ? 404 : 403, { error: 'Tên này dành cho quản trị viên' })
    return
  }
  if (key) {
    if (req.method === 'GET') {
      const doc = readUser(key)
      if (!doc) {
        send(res, 404, { error: 'Chưa có người dùng này' })
        return
      }
      send(res, 200, doc)
      return
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readBody(req)
      if (!body || typeof body !== 'object' || !body.data || typeof body.data !== 'object') {
        send(res, 400, { error: 'Thiếu trường data' })
        return
      }
      const name = normalizeName(body.name)
      if (!isValidName(name) || userKey(name) !== key) {
        send(res, 400, { error: 'Tên không khớp với khóa' })
        return
      }
      const prev = readUser(key)
      const now = Date.now()
      const doc = {
        name,
        key,
        createdAt: prev?.createdAt || now,
        updatedAt: now,
        data: body.data,
      }
      writeUser(key, doc)
      index.set(key, { name, updatedAt: now })
      log(prev ? 'SAVE' : 'NEW ', name)
      send(res, 200, { ok: true, updatedAt: now })
      return
    }
  }

  send(res, 404, { error: 'Không tìm thấy' })
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
  log(`API tien do chay tai http://0.0.0.0:${PORT}  (du lieu: ${USERS_DIR}, ${index.size} nguoi dung)`)
})

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    log('Dung API (' + sig + ')')
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 1000).unref()
  })
}

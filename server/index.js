// API lưu tiến độ học theo từng người dùng — chạy trên VPS cạnh IIS.
// Không cần cài thêm gói nào (chỉ dùng module có sẵn của Node >= 18).
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
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { isValidName, normalizeName, userKey } from '../src/lib/userKey.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 37390
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const USERS_DIR = path.join(DATA_DIR, 'users')
const LOG_FILE = path.join(DATA_DIR, 'api.log')
const MAX_BODY = 5 * 1024 * 1024 // 5 MB — dữ liệu một người chỉ vài chục KB

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
  'Access-Control-Allow-Headers': 'Content-Type',
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

  if (req.method === 'GET' && pathname === '/api/health') {
    send(res, 200, { ok: true, users: index.size })
    return
  }

  if (req.method === 'GET' && pathname === '/api/users') {
    const list = [...index.values()].sort((a, b) => b.updatedAt - a.updatedAt)
    send(res, 200, list)
    return
  }

  const key = keyFromPath(pathname)
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
  log(`API tiến độ chạy tại http://0.0.0.0:${PORT}  (dữ liệu: ${USERS_DIR}, ${index.size} người dùng)`)
})

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    log('Dừng API (' + sig + ')')
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 1000).unref()
  })
}

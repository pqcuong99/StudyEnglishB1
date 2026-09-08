import { useEffect, useState } from 'react'
import { aiImageUrl } from '../lib/image.js'
import { localImageFor, slugify } from '../lib/localImages.js'
import { getCachedImage } from '../lib/imagedb.js'
import { activeProvider } from '../lib/settings.js'
import { generateAndCache, regenerateImage } from '../lib/aiGen.js'

// Thứ tự ưu tiên ảnh cho một từ:
//   1. Ảnh AI đã tạo bằng API key của người dùng (cache trong IndexedDB)
//   2. Ảnh SVG vẽ sẵn đóng gói trong app (src/assets/words/)
//   3. Có API key -> tự tạo ảnh mới (hàng đợi tuần tự)
//   4. Không có key -> Pollinations.ai (miễn phí, tải tuần tự + thử lại)

// --- hàng đợi tải ảnh Pollinations (bị giới hạn tần suất) ---
const pollResults = new Map()
let pollQueue = Promise.resolve()

function tryLoad(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

function loadPollinations(url) {
  if (pollResults.has(url)) {
    const r = pollResults.get(url)
    return typeof r === 'string' ? Promise.resolve(r) : r
  }
  const p = (pollQueue = pollQueue
    .then(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (await tryLoad(url)) return 'ok'
        await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)))
      }
      return 'error'
    })
    .then((status) => {
      pollResults.set(url, status)
      return status
    }))
  pollResults.set(url, p)
  return p
}

export default function WordImage({ word, meaning, seed, className, showRefresh, onNewSeed }) {
  const slug = slugify(word)
  const svgUrl = localImageFor(word)
  const pollUrl = aiImageUrl(word, seed)

  // phase: init | genReady | svg | generating | genError | pollLoading | pollOk | pollError
  const [phase, setPhase] = useState('init')
  const [genUrl, setGenUrl] = useState(null)
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    let alive = true
    setPhase('init')
    setGenUrl(null)
    setErrMsg('')
    ;(async () => {
      const cached = await getCachedImage(slug).catch(() => null)
      if (!alive) return
      if (cached) {
        setGenUrl(cached)
        setPhase('genReady')
        return
      }
      if (svgUrl) {
        setPhase('svg')
        return
      }
      if (activeProvider()) {
        setPhase('generating')
        try {
          const url = await generateAndCache(word, meaning)
          if (alive) {
            setGenUrl(url)
            setPhase('genReady')
          }
        } catch (e) {
          if (alive) {
            setErrMsg(String(e.message || e))
            setPhase('genError')
          }
        }
        return
      }
      setPhase('pollLoading')
      const status = await loadPollinations(pollUrl)
      if (alive) setPhase(status === 'ok' ? 'pollOk' : 'pollError')
    })()
    return () => {
      alive = false
    }
  }, [slug, pollUrl])

  async function regen() {
    if (activeProvider()) {
      setPhase('generating')
      setErrMsg('')
      try {
        const url = await regenerateImage(word, meaning)
        setGenUrl(url)
        setPhase('genReady')
      } catch (e) {
        setErrMsg(String(e.message || e))
        setPhase('genError')
      }
    } else if (onNewSeed) {
      pollResults.delete(pollUrl)
      onNewSeed()
    }
  }

  // nút 🔄 chỉ hiện khi bấm có tác dụng
  const canRefresh =
    showRefresh && (activeProvider() || (!svgUrl && onNewSeed && phase !== 'pollLoading'))

  let content
  if (phase === 'genReady' && genUrl) {
    content = <img className={className} src={genUrl} alt={word} />
  } else if (phase === 'svg') {
    content = <img className={className} src={svgUrl} alt={word} />
  } else if (phase === 'pollOk') {
    content = <img className={className} src={pollUrl} alt={word} />
  } else if (phase === 'generating') {
    content = (
      <div className={`img-placeholder ${className || ''}`}>
        {svgUrl ? (
          <img className={className} src={svgUrl} alt={word} style={{ opacity: 0.4 }} />
        ) : (
          <>
            <div className="spinner" />
            <span>Đang tạo ảnh AI...</span>
          </>
        )}
      </div>
    )
  } else if (phase === 'genError') {
    content = (
      <div className={`img-placeholder ${className || ''}`}>
        <span className="err-note" title={errMsg}>
          ⚠️ Lỗi tạo ảnh
        </span>
        <span className="err-detail">{errMsg.slice(0, 120)}</span>
        <button
          className="btn btn-outline btn-sm"
          onClick={(e) => {
            e.stopPropagation()
            regen()
          }}
        >
          🔄 Thử lại
        </button>
      </div>
    )
  } else if (phase === 'pollError') {
    content = (
      <div className={`img-placeholder ${className || ''}`}>
        <button
          className="btn btn-outline btn-sm"
          onClick={(e) => {
            e.stopPropagation()
            pollResults.delete(pollUrl)
            setPhase('pollLoading')
            loadPollinations(pollUrl).then((s) => setPhase(s === 'ok' ? 'pollOk' : 'pollError'))
          }}
        >
          🔄 Tải lại ảnh
        </button>
      </div>
    )
  } else {
    content = (
      <div className={`img-placeholder ${className || ''}`}>
        <div className="spinner" />
        {phase === 'pollLoading' && <span>Đang tạo ảnh AI...</span>}
      </div>
    )
  }

  return (
    <>
      {content}
      {canRefresh && (
        <button
          className="img-refresh"
          title="Tạo ảnh khác"
          onClick={(e) => {
            e.stopPropagation()
            regen()
          }}
        >
          🔄
        </button>
      )}
    </>
  )
}

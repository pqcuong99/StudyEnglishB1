// Tạo ảnh flashcard bằng API của người dùng (Gemini hoặc OpenAI).
// Ảnh tạo xong được thu nhỏ và lưu vào IndexedDB — mỗi từ chỉ tốn 1 lần gọi API.
import { getSettings, activeProvider } from './settings.js'
import { getCachedImage, putCachedImage, deleteCachedImage } from './imagedb.js'
import { slugify } from './localImages.js'

function buildPrompt(word, meaning) {
  return (
    `A simple, cute flat cartoon illustration for an English vocabulary flashcard. ` +
    `The word is "${word}"` +
    (meaning ? ` (Vietnamese meaning: "${meaning}")` : '') +
    `. Clearly illustrate this exact meaning so a learner can guess the word from the picture. ` +
    `Minimal flat design, soft pastel colors, friendly style. ` +
    `IMPORTANT: no text, no letters, no words anywhere in the image.`
  )
}

async function genGemini(prompt, key) {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 400)}`)
  }
  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const imgPart = parts.find((p) => p.inlineData?.data)
  if (!imgPart) throw new Error('Gemini không trả về ảnh (có thể model/key không hỗ trợ tạo ảnh)')
  return `data:${imgPart.inlineData.mimeType || 'image/png'};base64,${imgPart.inlineData.data}`
}

async function genOpenAI(prompt, key) {
  const call = (body) =>
    fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    })

  let res = await call({ model: 'gpt-image-1', prompt, size: '1024x1024', n: 1 })
  if (res.status === 403 || res.status === 404) {
    // gpt-image-1 cần tổ chức đã xác minh — thử DALL-E 3
    res = await call({ model: 'dall-e-3', prompt, size: '1024x1024', n: 1, response_format: 'b64_json' })
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`)
  }
  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error('OpenAI không trả về ảnh')
  return `data:image/png;base64,${b64}`
}

// Thu nhỏ ảnh về 512x384 JPEG để cache nhẹ
function shrink(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 384
        const ctx = canvas.getContext('2d')
        const scale = Math.max(512 / img.width, 384 / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (512 - w) / 2, (384 - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// Hàng đợi tuần tự + gộp yêu cầu trùng để không dội API
const inFlight = new Map()
let queue = Promise.resolve()

export function generateAndCache(word, meaning) {
  const slug = slugify(word)
  if (inFlight.has(slug)) return inFlight.get(slug)

  const p = (queue = queue
    .catch(() => {})
    .then(async () => {
      const cached = await getCachedImage(slug).catch(() => null)
      if (cached) return cached
      const provider = activeProvider()
      if (!provider) throw new Error('Chưa có API key')
      const s = getSettings()
      const prompt = buildPrompt(word, meaning)
      const raw =
        provider === 'gemini' ? await genGemini(prompt, s.geminiKey) : await genOpenAI(prompt, s.openaiKey)
      const small = await shrink(raw)
      await putCachedImage(slug, small).catch(() => {})
      return small
    }))
  inFlight.set(slug, p)
  p.finally(() => inFlight.delete(slug))
  return p
}

export async function regenerateImage(word, meaning) {
  await deleteCachedImage(slugify(word)).catch(() => {})
  return generateAndCache(word, meaning)
}

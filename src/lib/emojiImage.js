// Ảnh minh họa bằng emoji cho các từ không có SVG vẽ sẵn (chủ yếu là 2000 từ
// theo chủ đề — Pollinations.ai giờ bắt trả phí khi tạo ảnh mới). Emoji của
// từng từ nằm trong src/data/wordEmoji.js; hình vẽ lấy từ bộ Twemoji (SVG,
// qua CDN jsDelivr) để giống nhau trên mọi máy — tải lỗi thì dùng emoji của hệ điều hành.
import { WORD_EMOJI } from '../data/wordEmoji.js'

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/'

export function emojiFor(word) {
  return WORD_EMOJI[String(word || '').trim()] || null
}

// Tên file Twemoji: mã các ký tự nối bằng "-", bỏ U+FE0F nếu không phải chuỗi ZWJ
export function twemojiUrl(emoji) {
  const cps = [...emoji].map((c) => c.codePointAt(0))
  const keep = cps.includes(0x200d) ? cps : cps.filter((cp) => cp !== 0xfe0f)
  return TWEMOJI_BASE + keep.map((cp) => cp.toString(16)).join('-') + '.svg'
}

// nền màu nhạt cố định theo từ để các thẻ không đơn điệu
const TINTS = ['#e0f2fe', '#fef3c7', '#dcfce7', '#fce7f3', '#ede9fe', '#ffedd5', '#e0e7ff', '#ccfbf1']

export function emojiTint(word) {
  let h = 0
  for (const ch of String(word)) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return TINTS[h % TINTS.length]
}

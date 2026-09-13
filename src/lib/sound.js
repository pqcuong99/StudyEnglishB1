// Âm báo ngắn khi trả lời đúng, tạo bằng Web Audio (không cần file âm thanh).
// AudioContext chỉ được tạo sau thao tác của người dùng (bấm chọn / Enter) nên
// trình duyệt không chặn; máy không hỗ trợ thì bỏ qua trong im lặng.
let ctx = null

function getContext() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// một nốt sine tắt dần: `at` tính theo đồng hồ của AudioContext (giây)
function note(freq, at, dur, vol) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, at)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

// tổng thời gian âm báo đúng (ms) — dùng để đọc từ sau khi âm báo kết thúc
export const CORRECT_SOUND_MS = 420

// "ting-ting" đi lên (C6 → E6) — nhẹ, vui, không gắt
export function playCorrect() {
  try {
    if (!getContext()) return
    const t = ctx.currentTime
    note(1046.5, t, 0.18, 0.22)
    note(1318.5, t + 0.11, 0.32, 0.22)
  } catch {
    /* trình duyệt không hỗ trợ Web Audio -> bỏ qua */
  }
}

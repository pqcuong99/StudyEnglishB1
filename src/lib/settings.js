const KEY = 'vocab-settings-v1'

export function getSettings() {
  try {
    return { geminiKey: '', openaiKey: '', provider: 'auto', ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { geminiKey: '', openaiKey: '', provider: 'auto' }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

// Nhà cung cấp AI đang dùng được (null nếu chưa có key nào)
export function activeProvider() {
  const s = getSettings()
  if (s.provider === 'gemini' && s.geminiKey) return 'gemini'
  if (s.provider === 'openai' && s.openaiKey) return 'openai'
  if (s.geminiKey) return 'gemini'
  if (s.openaiKey) return 'openai'
  return null
}

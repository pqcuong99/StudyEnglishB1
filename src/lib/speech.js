let voice = null

function pickVoice() {
  if (voice) return voice
  const voices = window.speechSynthesis?.getVoices() || []
  voice =
    voices.find((v) => v.lang === 'en-GB') ||
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang && v.lang.startsWith('en')) ||
    null
  return voice
}

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voice = null
    pickVoice()
  }
}

export function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-GB'
  u.rate = 0.9
  const v = pickVoice()
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}

// Free AI image generation via Pollinations.ai — no API key needed.
// The image is generated on first request of the URL, so it may take
// a little while to load the first time; after that it is cached.
export function aiImageUrl(word, seed = 1) {
  const prompt =
    `simple colorful flat cartoon illustration that represents the English word "${word}", ` +
    `educational vocabulary flashcard style, cute, minimal background, no text, no letters`
  return (
    'https://image.pollinations.ai/prompt/' +
    encodeURIComponent(prompt) +
    `?width=512&height=384&nologo=true&seed=${seed}`
  )
}

export function randomSeed() {
  return Math.floor(Math.random() * 1000000) + 1
}

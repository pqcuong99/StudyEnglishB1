// Ảnh minh họa đóng gói sẵn trong app, khớp theo từ đã slug hóa (chữ thường,
// khoảng trắng -> "-"), ví dụ "be-keen-on.svg":
//   src/assets/words/*.svg    ảnh vẽ tay cho các unit của khóa học
//   src/assets/topics/*.webp  ảnh AI (Pollinations) tạo sẵn cho 2000 từ theo chủ đề
// Trùng tên thì SVG được ưu tiên.
const files = {
  ...import.meta.glob('../assets/topics/*.webp', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/words/*.svg', { eager: true, query: '?url', import: 'default' }),
}

const map = {}
for (const [path, url] of Object.entries(files)) {
  const name = path.split('/').pop().replace(/\.(svg|webp)$/, '')
  if (!map[name] || path.endsWith('.svg')) map[name] = url
}

export function slugify(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function localImageFor(word) {
  return map[slugify(word)] || null
}

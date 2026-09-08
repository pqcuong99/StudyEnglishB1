// Ảnh minh họa vẽ tay (SVG) đóng gói sẵn trong app, khớp theo từ.
// Thêm ảnh mới: đặt file .svg vào src/assets/words/ với tên là từ đã
// slug hóa (chữ thường, khoảng trắng -> "-"), ví dụ "be-keen-on.svg".
const files = import.meta.glob('../assets/words/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const map = {}
for (const [path, url] of Object.entries(files)) {
  const name = path.split('/').pop().replace(/\.svg$/, '')
  map[name] = url
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

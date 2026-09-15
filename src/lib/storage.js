// Sinh id cho unit / từ do người dùng tự tạo. Id chỉ được chứa chữ, số, `-`,
// `_` vì máy chủ dùng nó đặt tên file (server/store.js).
export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)
}

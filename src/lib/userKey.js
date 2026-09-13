// Chuẩn hóa tên người dùng — dùng chung cho client (src/) và server (server/),
// nên file này không được import gì của trình duyệt hay Node.
export const NAME_MAX = 30

// bỏ khoảng trắng thừa, thống nhất dạng Unicode để "Hồng" gõ ở máy khác vẫn khớp
export function normalizeName(name) {
  return String(name ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
}

// khóa định danh: không phân biệt hoa/thường ("Hồng" và "hồng" là một người)
export function userKey(name) {
  return normalizeName(name).toLowerCase()
}

export function isValidName(name) {
  const n = normalizeName(name)
  return n.length >= 1 && n.length <= NAME_MAX && !/[\p{C}\/\\]/u.test(n)
}

// Unit có sẵn khi mở app lần đầu (khi trình duyệt chưa có dữ liệu).
// Dữ liệu lấy từ các file NC_U1_Session 2.pdf, NC_U1_Session 3.pdf và
// vở ghi trên lớp (Unit 1) của khóa học.
//
// Cách thêm từ mới cho unit có sẵn: thêm một nhóm mới vào `groups` với
// `version` = SEED_VERSION + 1, rồi tăng SEED_VERSION. storage.js sẽ tự
// nối các từ của nhóm mới vào unit đã lưu trong trình duyệt của người dùng
// (giữ nguyên tiến độ đã học, không thêm lại từ đã có). Phiên bản seed đã
// nối được lưu ngay trong unit (`seedVersion`) để luôn đi cùng dữ liệu.

export const SEED_VERSION = 2

// Mỗi dòng: [từ, loại từ, IPA, nghĩa]

// NC_U1_Session 2.pdf – Giving personal information
const U1S2_WORDS = [
  ['prefer', 'v', 'prɪˈfɜːr', 'thích hơn'],
  ['article', 'n', 'ˈɑːtɪkl', 'bài báo, bài viết'],
  ['extreme sport', 'n', 'ɪkˌstriːm ˈspɔːt', 'thể thao mạo hiểm'],
  ['terrible at', 'adj', 'ˈterəbl æt', 'rất dở/kém về'],
  ['fiction', 'n', 'ˈfɪkʃn', 'truyện hư cấu, tiểu thuyết'],
  ['opposite', 'adj/prep', 'ˈɒpəzɪt', 'đối diện, trái ngược'],
  ['encourage', 'v', 'ɪnˈkʌrɪdʒ', 'khuyến khích, động viên'],
  ['be keen on', 'adj', 'biː kiːn ɒn', 'thích, đam mê'],
  ['audience', 'n', 'ˈɔːdiəns', 'khán giả'],
  ['traditional', 'adj', 'trəˈdɪʃənl', 'truyền thống'],
  ['perform', 'v', 'pəˈfɔːm', 'biểu diễn'],
  ['protect', 'v', 'prəˈtekt', 'bảo vệ'],
  ['environment', 'n', 'ɪnˈvaɪrənmənt', 'môi trường'],
  ['be brought up', 'phr v', 'biː brɔːt ʌp', 'được nuôi dưỡng, lớn lên'],
  ['imagination', 'n', 'ɪˌmædʒɪˈneɪʃn', 'sự tưởng tượng'],
  ['take part in', 'phr v', 'teɪk pɑːt ɪn', 'tham gia'],
  ['enjoy', 'v', 'ɪnˈdʒɔɪ', 'thích thú, tận hưởng'],
  ['exchange', 'v', 'ɪksˈtʃeɪndʒ', 'trao đổi'],
  ['story', 'n', 'ˈstɔːri', 'câu chuyện'],
  ['theatre', 'n', 'ˈθɪətə', 'nhà hát, sân khấu'],
  ['interest', 'n', 'ˈɪntrest', 'sự quan tâm, hứng thú'],
  ['painting', 'n', 'ˈpeɪntɪŋ', 'bức tranh, hội họa'],
  ['recipe', 'n', 'ˈresəpi', 'công thức nấu ăn'],
  ['nervous', 'adj', 'ˈnɜːvəs', 'lo lắng, hồi hộp'],
  ['competition', 'n', 'ˌkɒmpəˈtɪʃn', 'cuộc thi'],
]

// NC_U1_Session 3.pdf – Being at school
const U1S3_WORDS = [
  ['hall', 'n', 'hɔːl', 'đại sảnh, hành lang, hội trường'],
  ['reception', 'n', 'rɪˈsepʃn', 'quầy lễ tân; tiệc chiêu đãi'],
  ['tennis court', 'n', 'ˈtenɪs kɔːt', 'sân quần vợt'],
  ['sport field', 'n', 'spɔːt fiːld', 'sân thể thao'],
  ['science lab', 'n', 'ˈsaɪəns læb', 'phòng thí nghiệm khoa học'],
  ['decorate', 'v', 'ˈdekəreɪt', 'trang trí'],
  ['immediately', 'adv', 'ɪˈmiːdiətli', 'ngay lập tức'],
  ['comfortable', 'adj', 'ˈkʌmfətəbl', 'thoải mái, dễ chịu'],
  ['concentrate', 'v', 'ˈkɒnsəntreɪt', 'tập trung'],
  ['disappoint', 'v', 'ˌdɪsəˈpɔɪnt', 'làm thất vọng'],
  ['French', 'n/adj', 'frentʃ', 'tiếng Pháp; người Pháp'],
  ['Polish', 'n/v', 'ˈpɒlɪʃ', '(n) tiếng Ba Lan; (v) đánh bóng'],
  ['communicate', 'v', 'kəˈmjuːnɪkeɪt', 'giao tiếp, truyền đạt'],
]

// Vở ghi trên lớp – Unit 1
const U1_NOTES_WORDS = [
  ['e-pal', 'n', 'ˈiː pæl', 'bạn trực tuyến, bạn qua mạng'],
  ['originally', 'adv', 'əˈrɪdʒənəli', 'ban đầu, lúc đầu; có xuất xứ / nguồn gốc từ'],
  ['messy', 'adj', 'ˈmesi', 'bừa bộn, lộn xộn'],
  ['tidy', 'adj', 'ˈtaɪdi', 'gọn gàng, ngăn nắp'],
  ['reason', 'n', 'ˈriːzn', 'lý do'],
  ['racket', 'n', 'ˈrækɪt', 'vợt (tennis, cầu lông)'],
  ['be interested in', 'adj', 'biː ˈɪntrəstɪd ɪn', 'thích, quan tâm đến (+ V-ing)'],
  ['stage', 'n', 'steɪdʒ', 'sân khấu (on the stage: trên sân khấu)'],
  ['extreme', 'adj', 'ɪkˈstriːm', 'cực đoan, khắc nghiệt'],
  ['extreme weather', 'n', 'ɪkˌstriːm ˈweðə', 'thời tiết cực đoan, khắc nghiệt'],
  ['both', 'det/pron', 'bəʊθ', 'cả hai (từ 3 trở lên dùng "all")'],
  ['especially', 'adv', 'ɪˈspeʃəli', 'đặc biệt là'],
  ['lots of', 'det', 'lɒts əv', 'nhiều'],
]

const UNITS = [
  {
    // giữ id cũ để khớp với dữ liệu đã lưu trong trình duyệt
    id: 'u1s2',
    name: 'Unit 1: All About Me',
    // tên cũ; nếu người dùng chưa tự đổi tên thì được đổi sang tên mới khi cập nhật
    previousNames: ['Unit 1: All About Me – Session 2: Giving personal information'],
    // nếu không có unit trùng id (người dùng tự import lại PDF) thì nối từ
    // vào unit có tên khớp mẫu này
    nameMatch: /^\s*unit\s*1\b/i,
    groups: [
      { version: 1, prefix: 'u1s2', seedBase: 100, rows: U1S2_WORDS },
      { version: 2, prefix: 'u1s3', seedBase: 200, rows: U1S3_WORDS },
      { version: 2, prefix: 'u1n', seedBase: 300, rows: U1_NOTES_WORDS },
    ],
  },
]

function buildWords(group) {
  return group.rows.map(([word, pos, ipa, meaning], i) => ({
    id: `${group.prefix}-${String(i + 1).padStart(2, '0')}`,
    word,
    pos,
    ipa,
    meaning,
    seed: group.seedBase + i + 1,
    known: false,
  }))
}

// Toàn bộ unit mẫu (dùng khi trình duyệt chưa có dữ liệu)
export function seedUnits() {
  return UNITS.map((u) => ({
    id: u.id,
    name: u.name,
    createdAt: Date.now(),
    seedVersion: SEED_VERSION,
    words: u.groups.flatMap(buildWords),
  }))
}

// Mô tả các unit mẫu kèm từng nhóm từ theo phiên bản
// (để storage.js nối từ mới vào unit đã lưu trong trình duyệt)
export function seedUnitUpdates() {
  return UNITS.map((u) => ({
    id: u.id,
    name: u.name,
    previousNames: u.previousNames || [],
    nameMatch: u.nameMatch || null,
    groups: u.groups.map((g) => ({ version: g.version, words: buildWords(g) })),
  }))
}

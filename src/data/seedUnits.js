// Unit có sẵn khi mở app lần đầu (khi trình duyệt chưa có dữ liệu).
// Dữ liệu lấy từ các file NC_U1_Session 2.pdf, NC_U1_Session 3.pdf,
// vở ghi trên lớp (Unit 1) và bảng từ vựng "II/ VOCAB" của khóa học.
//
// Cách thêm từ mới cho unit có sẵn: thêm một nhóm mới vào `groups` với
// `version` = SEED_VERSION + 1 (và `section` là id phần muốn nối vào; thêm
// phần mới vào `sections` nếu cần), rồi tăng SEED_VERSION. Máy chủ
// (server/store.js) sẽ tự nối các từ của nhóm mới vào unit đã lưu của từng
// người (giữ nguyên tiến độ đã học, không thêm lại từ đã có). Phiên bản seed
// đã nối được lưu ngay trong unit (`seedVersion`) để luôn đi cùng dữ liệu.
//
// File này không được import gì của trình duyệt hay Node: server dùng chung.

export const SEED_VERSION = 4

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

// Bảng từ vựng "II/ VOCAB" (phần 3). "encourage" đã có ở phần 1 nên không
// thêm lại.
const U1_VOCAB3_WORDS = [
  ['routine', 'n', 'ruːˈtiːn', 'thói quen, nếp sinh hoạt; thường lệ'],
  ['organise', 'v', 'ˈɔːɡənaɪz', 'tổ chức, sắp xếp'],
  ['gym', 'n', 'dʒɪm', 'phòng tập thể hình, phòng thể dục'],
  ['cycling', 'n', 'ˈsaɪklɪŋ', 'môn đạp xe, việc đi xe đạp'],
  ['confident', 'adj', 'ˈkɒnfɪdənt', 'tự tin'],
  ['excellent', 'adj', 'ˈeksələnt', 'xuất sắc, tuyệt vời'],
  ['case', 'n', 'keɪs', 'trường hợp, vụ việc, cái hộp'],
  ['development', 'n', 'dɪˈveləpmənt', 'sự phát triển, sự tiến triển'],
  ['prevent', 'v', 'prɪˈvent', 'ngăn ngừa, ngăn chặn'],
  ['course', 'n', 'kɔːs', 'khóa học, sân chạy, hướng đi'],
  ['ceremony', 'n', 'ˈserəməni', 'nghi lễ, buổi lễ'],
  ['degree', 'n', 'dɪˈɡriː', 'bằng cấp, mức độ, độ (nhiệt, góc,...)'],
]

// Vở ghi trên lớp – trang tiếp theo của phần 3 (từ "baseball" trở đi).
// Ô "2" (has to / doesn't have to / should / must not) là ghi chú ngữ pháp,
// không phải từ vựng nên không thêm.
const U1_VOCAB3B_WORDS = [
  ['baseball', 'n', 'ˈbeɪsbɔːl', 'bóng chày (baseball field: sân bóng chày)'],
  ['take up', 'phr v', 'teɪk ʌp', 'bắt đầu một sở thích / thói quen mới'],
  ['arrive', 'v', 'əˈraɪv', 'đến, tới nơi'],
  ['attend', 'v', 'əˈtend', 'tham gia, tham dự'],
  ['get', 'v', 'ɡet', 'lấy, nhận được'],
  ['hand in', 'phr v', 'hænd ɪn', 'đưa, nộp (bài, đơn,...)'],
  ['take', 'v', 'teɪk', 'cầm lấy, lấy'],
  ['wear', 'v', 'weə', 'đeo, mặc'],
  ['expect', 'v', 'ɪkˈspekt', 'mong đợi, kì vọng'],
  ['charity', 'n', 'ˈtʃærəti', 'thiện nguyện, từ thiện; tổ chức từ thiện'],
  ['strict', 'adj', 'strɪkt', 'nghiêm khắc'],
  ['make progress', 'phr', 'meɪk ˈprəʊɡres', 'có tiến bộ, tiến triển'],
  ['prepare', 'v', 'prɪˈpeə', 'chuẩn bị'],
  ['scared', 'adj', 'skeəd', 'sợ hãi, hoảng sợ'],
  ['crowd', 'n', 'kraʊd', 'đám đông'],
  ['quiet', 'adj', 'ˈkwaɪət', 'yên tĩnh, im lặng'],
  ['impressed', 'adj', 'ɪmˈprest', 'ấn tượng'],
]

const UNITS = [
  {
    // giữ id cũ để khớp với dữ liệu đã lưu
    id: 'u1s2',
    name: 'Unit 1: All About Me',
    // tên cũ; nếu người dùng chưa tự đổi tên thì được đổi sang tên mới khi cập nhật
    previousNames: ['Unit 1: All About Me – Session 2: Giving personal information'],
    // nếu không có unit trùng id (người dùng tự import lại PDF) thì nối từ
    // vào unit có tên khớp mẫu này
    nameMatch: /^\s*unit\s*1\b/i,
    // các phần của unit: mỗi phần có id riêng, máy chủ lưu và trả về từng phần
    sections: [
      { id: 'p1', name: 'Phần 1 – Session 2' },
      { id: 'p2', name: 'Phần 2 – Session 3 & vở ghi' },
      { id: 'p3', name: 'Phần 3 – Vocab' },
    ],
    // `section`: id phần mà nhóm từ này thuộc về
    groups: [
      { version: 1, prefix: 'u1s2', seedBase: 100, section: 'p1', rows: U1S2_WORDS },
      { version: 2, prefix: 'u1s3', seedBase: 200, section: 'p2', rows: U1S3_WORDS },
      { version: 2, prefix: 'u1n', seedBase: 300, section: 'p2', rows: U1_NOTES_WORDS },
      { version: 3, prefix: 'u1v3', seedBase: 400, section: 'p3', rows: U1_VOCAB3_WORDS },
      { version: 4, prefix: 'u1v3b', seedBase: 500, section: 'p3', rows: U1_VOCAB3B_WORDS },
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

// Toàn bộ unit mẫu cho người dùng mới:
//   [{ id, name, createdAt, seedVersion, sections: [{ id, name, words }] }]
export function seedUnits() {
  return UNITS.map((u) => ({
    id: u.id,
    name: u.name,
    createdAt: Date.now(),
    seedVersion: SEED_VERSION,
    sections: u.sections.map((s) => ({
      id: s.id,
      name: s.name,
      words: u.groups.filter((g) => g.section === s.id).flatMap(buildWords),
    })),
  }))
}

// Mô tả các unit mẫu kèm từng nhóm từ theo phiên bản: máy chủ dùng để nối từ
// mới vào unit đã lưu của người dùng và để chuyển dữ liệu cũ sang cấu trúc phần
export function seedUnitUpdates() {
  return UNITS.map((u) => ({
    id: u.id,
    name: u.name,
    previousNames: u.previousNames || [],
    nameMatch: u.nameMatch || null,
    sections: u.sections.map((s) => ({ id: s.id, name: s.name })),
    groups: u.groups.map((g) => ({ version: g.version, sectionId: g.section, words: buildWords(g) })),
  }))
}

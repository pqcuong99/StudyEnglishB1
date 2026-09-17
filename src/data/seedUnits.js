// Unit có sẵn khi mở app lần đầu (khi trình duyệt chưa có dữ liệu).
// Unit 1 lấy từ các file NC_U1_Session 2.pdf, NC_U1_Session 3.pdf,
// vở ghi trên lớp (Unit 1), bảng từ vựng "II/ VOCAB" và "I/ VOCAB" (Session 5:
// Writing Part 1) của khóa học, cùng vở ghi Speaking Part 1 và vở ghi tiếp theo.
// Unit 2 lấy từ bảng từ vựng "I/ VOCABULARY" của Session 6 (Vocabulary +
// Reading Part 4).
//
// Cách thêm từ mới cho unit có sẵn: thêm một nhóm mới vào `groups` với
// `version` = SEED_VERSION + 1 (và `section` là id phần muốn nối vào; thêm
// phần mới vào `sections` nếu cần), rồi tăng SEED_VERSION. Máy chủ
// (server/store.js) sẽ tự nối các từ của nhóm mới vào unit đã lưu của từng
// người (giữ nguyên tiến độ đã học, không thêm lại từ đã có). Phiên bản seed
// đã nối được lưu ngay trong unit (`seedVersion`) để luôn đi cùng dữ liệu.
// Thêm cả một unit mới cũng vậy: thêm vào `UNITS` với nhóm từ mang `version`
// mới — người dùng cũ chưa có unit đó sẽ được máy chủ tạo cho khi đăng nhập.
//
// File này không được import gì của trình duyệt hay Node: server dùng chung.

export const SEED_VERSION = 8

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

// Bảng từ vựng "I/ VOCAB" – Session 5: Writing Part 1 (phần 4)
const U1_VOCAB4_WORDS = [
  ['apologise', 'v', 'əˈpɒlədʒaɪz', 'xin lỗi'],
  ['please', 'v', 'pliːz', 'làm hài lòng, làm vui lòng'],
  ['transport', 'n/v', 'ˈtrænspɔːt', 'phương tiện giao thông, vận chuyển'],
  ['offer', 'n/v', 'ˈɒfə(r)', 'đề nghị, cung cấp, mời'],
  ['suggest', 'v', 'səˈdʒest', 'gợi ý, đề xuất'],
  ['advise', 'v', 'ədˈvaɪz', 'khuyên bảo, tư vấn'],
]

// Vở ghi trên lớp – Speaking Part 1 (nối vào phần 4)
const U1_SPEAK1_WORDS = [
  ['probably', 'adv', 'ˈprɒbəbli', 'có lẽ, có thể'],
  ['correct', 'adj', 'kəˈrekt', 'chính xác, đúng'],
  ['unfortunately', 'adv', 'ʌnˈfɔːtʃənətli', 'không may, kém may mắn'],
  ["can't stand", 'phr', 'kɑːnt stænd', 'không thể chịu được'],
  ['consider', 'v', 'kənˈsɪdə(r)', 'coi (cái gì đó là), cân nhắc'],
  ['few', 'det', 'fjuː', 'một vài (danh từ đếm được)'],
  ['low', 'adj', 'ləʊ', 'thấp'],
  ['little', 'det', 'ˈlɪtl', 'một chút (danh từ không đếm được)'],
  ['situation', 'n', 'ˌsɪtʃuˈeɪʃn', 'tình huống'],
  ['refuse', 'v', 'rɪˈfjuːz', 'từ chối'],
  ['avoid', 'v', 'əˈvɔɪd', 'tránh'],
  ['gain', 'v', 'ɡeɪn', 'nhận được, đạt được'],
  ['possibility', 'n', 'ˌpɒsəˈbɪləti', 'khả năng'],
  ['benefit', 'n', 'ˈbenɪfɪt', 'lợi ích'],
  ['experienced', 'adj', 'ɪkˈspɪəriənst', 'có kinh nghiệm'],
  ['involved', 'adj', 'ɪnˈvɒlvd', 'có liên quan, tham gia vào'],
  ['prevent sb from doing sth', 'phr', 'prɪˈvent', 'ngăn cản ai đó làm gì'],
]

// Vở ghi trên lớp – trang tiếp theo (phần 5)
const U1_NOTES5_WORDS = [
  ['wait for', 'phr', 'weɪt fɔː(r)', 'chờ đợi cái gì / chờ đợi ai'],
  ['match', 'n', 'mætʃ', 'trận đấu'],
  ['glad', 'adj', 'ɡlæd', 'vui mừng, hài lòng'],
  ['be able to', 'phr', 'bi ˈeɪbl tuː', 'có thể, có khả năng'],
  ["I'd rather + V1 than + V2", 'phr', 'aɪd ˈrɑːðə(r)', 'thà ... hơn ... (thích làm gì hơn làm gì)'],
  ['instead', 'adv', 'ɪnˈsted', 'thay vào đó, thay vì'],
  ['describing', 'n', 'dɪˈskraɪbɪŋ', 'mô tả'],
  ['explaining', 'n', 'ɪkˈspleɪnɪŋ', 'giải thích'],
  ['persuading', 'n', 'pəˈsweɪdɪŋ', 'thuyết phục'],
  ['If I were you', 'phr', 'ɪf aɪ wɜː juː', 'nếu tôi là bạn'],
  ['straight', 'adj/adv', 'streɪt', 'thẳng'],
  ['although', 'conj', 'ɔːlˈðəʊ', 'mặc dù'],
  ['despite', 'prep', 'dɪˈspaɪt', 'mặc dù (= in spite of)'],
  ['in spite of', 'prep', 'ɪn spaɪt ɒv', 'mặc dù (= despite)'],
  ['forgotten', 'adj', 'fəˈɡɒtn', 'bị lãng quên'],
  ['appointment', 'n', 'əˈpɔɪntmənt', 'cuộc hẹn, lịch hẹn'],
  ['remind', 'v', 'rɪˈmaɪnd', 'nhắc, nhắc nhở'],
  ['horse riding', 'n', 'hɔːs ˈraɪdɪŋ', 'cưỡi ngựa'],
]

// Unit 2 – bảng từ vựng "I/ VOCABULARY", Session 6: Vocabulary + Reading Part 4
const U2S6_WORDS = [
  ['gymnastics', 'n', 'dʒɪmˈnæstɪks', 'môn thể dục dụng cụ'],
  ['cycling', 'n', 'ˈsaɪklɪŋ', 'môn đạp xe, việc đạp xe'],
  ['athlete', 'n', 'ˈæθliːt', 'vận động viên'],
  ['competition', 'n', 'ˌkɒmpəˈtɪʃən', 'cuộc thi, sự cạnh tranh'],
  ['amateur', 'n/adj', 'ˈæmətə(r)', 'nghiệp dư'],
  ['participate', 'v', 'pɑːˈtɪsɪpeɪt', 'tham gia'],
  ['majority', 'n', 'məˈdʒɒrəti', 'phần lớn, đa số'],
  ['opportunity', 'n', 'ˌɒpəˈtjuːnəti', 'cơ hội'],
  ['defeat', 'v/n', 'dɪˈfiːt', 'đánh bại, đánh thắng; sự thất bại'],
  ['medal', 'n', 'ˈmedəl', 'huy chương'],
  ['huge', 'adj', 'hjuːdʒ', 'khổng lồ, rất lớn'],
  ['as a result', 'phr', 'æz ə rɪˈzʌlt', 'kết quả là, vì vậy'],
  ['impress', 'v', 'ɪmˈpres', 'gây ấn tượng'],
  ['international', 'adj', 'ˌɪntəˈnæʃənəl', 'quốc tế'],
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
      { id: 'p4', name: 'Phần 4 – Session 5: Writing Part 1' },
      { id: 'p5', name: 'Phần 5 – Vở ghi trên lớp (tiếp)' },
    ],
    // `section`: id phần mà nhóm từ này thuộc về
    groups: [
      { version: 1, prefix: 'u1s2', seedBase: 100, section: 'p1', rows: U1S2_WORDS },
      { version: 2, prefix: 'u1s3', seedBase: 200, section: 'p2', rows: U1S3_WORDS },
      { version: 2, prefix: 'u1n', seedBase: 300, section: 'p2', rows: U1_NOTES_WORDS },
      { version: 3, prefix: 'u1v3', seedBase: 400, section: 'p3', rows: U1_VOCAB3_WORDS },
      { version: 4, prefix: 'u1v3b', seedBase: 500, section: 'p3', rows: U1_VOCAB3B_WORDS },
      { version: 5, prefix: 'u1v4', seedBase: 600, section: 'p4', rows: U1_VOCAB4_WORDS },
      { version: 6, prefix: 'u1s1', seedBase: 700, section: 'p4', rows: U1_SPEAK1_WORDS },
      { version: 7, prefix: 'u1n5', seedBase: 800, section: 'p5', rows: U1_NOTES5_WORDS },
    ],
  },
  {
    id: 'u2',
    name: 'Unit 2: Winning & Losing',
    nameMatch: /^\s*unit\s*2\b/i,
    sections: [{ id: 'p1', name: 'Phần 1 – Session 6: Vocabulary' }],
    groups: [{ version: 8, prefix: 'u2s6', seedBase: 900, section: 'p1', rows: U2S6_WORDS }],
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

// Unit có sẵn khi mở app lần đầu (khi trình duyệt chưa có dữ liệu).
// Unit 1 lấy từ các file NC_U1_Session 2.pdf, NC_U1_Session 3.pdf,
// vở ghi trên lớp (Unit 1), bảng từ vựng "II/ VOCAB" và "I/ VOCAB" (Session 5:
// Writing Part 1) của khóa học, cùng vở ghi Speaking Part 1 và vở ghi tiếp theo.
// Unit 2 lấy từ bảng từ vựng "I/ VOCABULARY" của Session 6 (Vocabulary +
// Reading Part 4), bảng "II/ VOCAB" tiếp theo, và bảng từ vựng + cụm động từ
// với "in" của Vocabulary + Reading Part 5 (kèm vở ghi trên lớp), bảng từ
// mới tiếp theo (phần 4) và bảng "I/ VOCAB" của Session 9: Writing Part 2 +
// Speaking Part 3 (phần 5).
// Unit 3 lấy từ bảng "I/ VOCAB" của Session 11: Listening Part 4 + Speaking
// Part 4 (phần 1), vở ghi từ vựng tiếp theo (phần 2), bảng từ vựng tiếp theo
// cùng vở ghi trên lớp (phần 3) và vở ghi từ vựng tiếp theo (phần 4).
// Unit 4 lấy từ bảng từ vựng đầu tiên của unit (phần 1).
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
// Ngoài các unit của khóa học còn có 39 "unit chủ đề" (`kind: 'topic'`, dữ
// liệu ở topicUnits.js): trang chủ hiển thị riêng ở khối "Từ vựng theo chủ đề",
// thống kê / kiểm tra tổng hợp của các unit không tính các từ này.
//
// File này không được import gì của trình duyệt hay Node: server dùng chung.

import { TOPICS } from './topicUnits.js'

export const SEED_VERSION = 18

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

// Unit 2 – bảng từ vựng "II/ VOCAB" (phần 2)
const U2_VOCAB2_WORDS = [
  ['expensive', 'adj', 'ɪkˈspensɪv', 'đắt, tốn kém'],
  ['positive', 'adj', 'ˈpɒzətɪv', 'tích cực, lạc quan'],
  ['negative', 'adj', 'ˈneɡətɪv', 'tiêu cực, phủ định'],
  ['interrupt', 'v', 'ˌɪntəˈrʌpt', 'gián đoạn, ngắt lời'],
  ['incomplete', 'adj', 'ˌɪnkəmˈpliːt', 'chưa hoàn thành, không đầy đủ'],
  ['among', 'prep', 'əˈmʌŋ', 'trong số, giữa (nhiều người/vật)'],
  ['ambition', 'n', 'æmˈbɪʃən', 'tham vọng, hoài bão'],
  ['difficulty', 'n', 'ˈdɪfɪkəlti', 'sự khó khăn'],
  ['arrange', 'v', 'əˈreɪndʒ', 'sắp xếp, thu xếp'],
]

// Unit 2 – Vocabulary + Reading Part 5 (phần 3): bảng từ vựng, bảng cụm động
// từ với "in" và 4 từ ghi trong vở trên lớp
const U2_VOCAB3_WORDS = [
  ['attitude', 'n', 'ˈætɪtjuːd', 'thái độ, quan điểm'],
  ['defeat', 'v/n', 'dɪˈfiːt', 'đánh bại; sự thất bại'],
  ['succeed', 'v', 'səkˈsiːd', 'thành công'],
  ['achieve', 'v', 'əˈtʃiːv', 'đạt được, giành được'],
  ['respect', 'v/n', 'rɪˈspekt', 'tôn trọng'],
  ['record', 'n', 'ˈrekɔːd', 'kỷ lục; hồ sơ'],
  ['opportunity', 'n', 'ˌɒpəˈtjuːnəti', 'cơ hội'],
  ['support', 'v/n', 'səˈpɔːt', 'hỗ trợ, ủng hộ'],
  ['accord', 'n', 'əˈkɔːd', 'sự đồng thuận, hiệp định'],
  ['opponent', 'n', 'əˈpəʊnənt', 'đối thủ'],
  ['important', 'adj', 'ɪmˈpɔːtənt', 'quan trọng'],
  ['burst into tears', 'phr', 'bɜːst ˈɪntə tɪəz', 'bật khóc'],
  ['believe in', 'phr v', 'bɪˈliːv ɪn', 'tin vào'],
  ['get in', 'phr v', 'ɡet ɪn', 'vào; lên (xe); gia nhập'],
  ['give in', 'phr v', 'ɡɪv ɪn', 'đầu hàng; nhượng bộ'],
  ['join in', 'phr v', 'dʒɔɪn ɪn', 'tham gia cùng'],
  ['stay in', 'phr v', 'steɪ ɪn', 'ở trong (nhà); không ra ngoài'],
  ['essay', 'n', 'ˈeseɪ', 'bài luận'],
  ['report', 'n/v', 'rɪˈpɔːt', 'báo cáo'],
  ['diving', 'n', 'ˈdaɪvɪŋ', 'môn lặn'],
  ['particular', 'adj', 'pəˈtɪkjələ', 'cụ thể, đặc biệt'],
]

// Unit 2 – bảng từ mới tiếp theo (phần 4)
const U2_VOCAB4_WORDS = [
  ['supply', 'v/n', 'səˈplaɪ', 'cung cấp; nguồn cung cấp'],
  ['admit', 'v', 'ədˈmɪt', 'thừa nhận, công nhận'],
  ['accident', 'n', 'ˈæksɪdənt', 'tai nạn; sự tình cờ'],
  ['rude', 'adj', 'ruːd', 'thô lỗ, bất lịch sự'],
  ['polite', 'adj', 'pəˈlaɪt', 'lịch sự, lễ độ'],
  ['beat', 'v', 'biːt', 'đánh bại, thắng; đập (tim), đánh (trứng)'],
  ['beat a record', 'phr', 'biːt ə ˈrekɔːd', 'phá kỷ lục'],
  ['defeat sb', 'phr', 'dɪˈfiːt ˌsʌmbədi', 'đánh bại ai đó'],
  ['increase', 'v/n', 'ɪnˈkriːs', 'tăng, tăng lên; sự tăng'],
  ['grow', 'v', 'ɡrəʊ', 'mọc, lớn lên, phát triển'],
  ['fantastic', 'adj', 'fænˈtæstɪk', 'tuyệt vời, xuất sắc'],
  ['teenagers', 'n', 'ˈtiːneɪdʒəz', 'thanh thiếu niên (13–19 tuổi)'],
  ['dreams', 'n', 'driːmz', 'giấc mơ; ước mơ, mơ ước'],
  ['individual', 'n/adj', 'ˌɪndɪˈvɪdʒuəl', 'cá nhân; riêng lẻ, từng người'],
  ['activity', 'n', 'ækˈtɪvəti', 'hoạt động'],
  ['embarrassed', 'adj', 'ɪmˈbærəst', 'bối rối, ngượng, xấu hổ'],
  ['reach', 'v', 'riːtʃ', 'đến, tới; với tới, đạt tới'],
  ['effort', 'n', 'ˈefət', 'sự nỗ lực, sự cố gắng'],
  ['separate', 'v/adj', 'ˈsepəreɪt', 'tách ra, chia ra; riêng biệt'],
  ['general', 'adj/n', 'ˈdʒenrəl', 'chung, tổng quát; (n) tướng (quân đội)'],
  ['produce', 'v', 'prəˈdjuːs', 'sản xuất, tạo ra'],
  ['deliver', 'v', 'dɪˈlɪvə(r)', 'giao, chuyển phát'],
  ['challenge', 'n/v', 'ˈtʃælɪndʒ', 'thử thách; thách thức'],
]

// Unit 2 – bảng "I/ VOCAB", Session 9: Writing Part 2 + Speaking Part 3 (phần 5)
const U2_VOCAB5_WORDS = [
  ['curious', 'adj', 'ˈkjʊə.ri.əs', 'tò mò'],
  ['sleepover', 'n', 'ˈsliːp.əʊ.və(r)', 'buổi ngủ lại nhà bạn'],
  ['unusual', 'adj', 'ʌnˈjuː.ʒu.əl', 'khác thường'],
  ['receive', 'v', 'rɪˈsiːv', 'nhận'],
  ['adventurous', 'adj', 'ədˈven.tʃər.əs', 'thích phiêu lưu'],
  ['description', 'n', 'dɪˈskrɪp.ʃən', 'sự mô tả'],
  ['nervous', 'adj', 'ˈnɜː.vəs', 'lo lắng, hồi hộp'],
  ['embarrass', 'v', 'ɪmˈbær.əs', 'làm xấu hổ'],
  ['delight', 'n/v', 'dɪˈlaɪt', 'niềm vui; làm ai vui thích'],
  ['introduction', 'n', 'ˌɪn.trəˈdʌk.ʃən', 'phần giới thiệu'],
  ['spelling', 'n', 'ˈspel.ɪŋ', 'chính tả'],
  ['category', 'n', 'ˈkæt.ə.ɡə.ri', 'loại, hạng mục'],
  ['statement', 'n', 'ˈsteɪt.mənt', 'câu phát biểu, tuyên bố'],
  ['agree / disagree', 'v', 'əˈɡriː / ˌdɪs.əˈɡriː', 'đồng ý / không đồng ý'],
]

// Unit 3 – bảng "I/ VOCAB", Session 11: Listening Part 4 + Speaking Part 4 (phần 1)
const U3S11_WORDS = [
  ['sweatshirt', 'n', 'ˈswet.ʃɜːt', 'áo len/áo nỉ chui đầu'],
  ['trainers', 'n', 'ˈtreɪ.nəz', 'giày thể thao'],
  ['jewellery', 'n', 'ˈdʒuː.əl.ri', 'trang sức'],
  ['material', 'n', 'məˈtɪə.ri.əl', 'chất liệu'],
  ['range', 'n', 'reɪndʒ', 'loạt, dòng sản phẩm; phạm vi'],
  ['magazine', 'n', 'ˌmæɡ.əˈziːn', 'tạp chí'],
  ['department store', 'n', 'dɪˈpɑːt.mənt stɔː(r)', 'cửa hàng bách hóa'],
  ['order', 'v/n', 'ˈɔː.də(r)', 'đặt hàng; đơn hàng'],
  ['expensive', 'adj', 'ɪkˈspen.sɪv', 'đắt'],
  ['jumper', 'n', 'ˈdʒʌm.pə(r)', 'áo len chui đầu'],
  ['bracelet', 'n', 'ˈbreɪ.slət', 'vòng đeo tay, lắc tay'],
  ['gloves', 'n', 'ɡlʌvz', 'găng tay'],
  ['collar', 'n', 'ˈkɒl.ə(r)', 'cổ áo'],
  ['sleeve', 'n', 'sliːv', 'tay áo, ống tay áo'],
  ['leather', 'n', 'ˈleð.ə(r)', 'da (thuộc)'],
  ['wool', 'n', 'wʊl', 'len, sợi len'],
]

// Unit 3 – vở ghi từ vựng tiếp theo (phần 2)
const U3_VOCAB2_WORDS = [
  ['invitation', 'n', 'ˌɪn.vɪˈteɪ.ʃən', 'thư mời, thiệp mời'],
  ['weird', 'adj', 'wɪəd', 'kỳ quặc'],
  ['decide', 'v', 'dɪˈsaɪd', 'quyết định'],
  ['suddenly', 'adv', 'ˈsʌd.ən.li', 'đột nhiên'],
  ['letter', 'n', 'ˈlet.ə(r)', 'bức thư'],
  ['silly thing', 'n', 'ˈsɪl.i θɪŋ', 'thứ ngớ ngẩn, điều ngớ ngẩn'],
  ['happen', 'v', 'ˈhæp.ən', 'xảy ra'],
  ['background', 'n', 'ˈbæk.ɡraʊnd', 'bối cảnh; phông nền'],
  ['paragraph', 'n', 'ˈpær.ə.ɡrɑːf', 'đoạn văn'],
  ['exhausted', 'adj', 'ɪɡˈzɔː.stɪd', 'kiệt sức, mệt lả'],
  ['busy', 'adj', 'ˈbɪz.i', 'đông đúc; bận rộn'],
  ['modern', 'adj', 'ˈmɒd.ən', 'hiện đại'],
  ['carefully', 'adv', 'ˈkeə.fəl.i', 'cẩn thận'],
  ['careless', 'adj', 'ˈkeə.ləs', 'bất cẩn'],
]

// Unit 3 – bảng từ vựng tiếp theo + vở ghi trên lớp (phần 3)
const U3_VOCAB3_WORDS = [
  ['kit', 'n', 'kɪt', 'trang phục & dụng cụ thi đấu (trong thể thao)'],
  ['maximum', 'adj/n', 'ˈmæk.sɪ.məm', 'tối đa'],
  ['available', 'adj', 'əˈveɪ.lə.bəl', 'có sẵn; có thể sử dụng'],
  ['publish', 'v', 'ˈpʌb.lɪʃ', 'xuất bản, công bố'],
  ['inexpensive', 'adj', 'ˌɪn.ɪkˈspen.sɪv', 'rẻ, không đắt'],
  ['fast food restaurant', 'n', 'ˌfɑːst ˈfuːd ˌres.tər.ɒnt', 'nhà hàng thức ăn nhanh'],
  ['queue', 'n/v', 'kjuː', 'hàng (người) chờ; xếp hàng'],
  ['forbid', 'v', 'fəˈbɪd', 'cấm'],
  ['inform', 'v', 'ɪnˈfɔːm', 'thông báo, báo tin'],
  ['depart', 'v', 'dɪˈpɑːt', 'khởi hành, rời đi'],
  ['arrangement', 'n', 'əˈreɪndʒ.mənt', 'sự sắp xếp, sự chuẩn bị'],
  ['refund', 'n/v', 'ˈriː.fʌnd', 'tiền hoàn lại; hoàn tiền'],
  ['reduced item', 'n', 'rɪˈdjuːst ˈaɪ.təm', 'hàng giảm giá'],
  ['delivery', 'n', 'dɪˈlɪv.ər.i', 'sự giao hàng'],
  ['questionnaire', 'n', 'ˌkwes.tʃəˈneə(r)', 'bảng câu hỏi, phiếu khảo sát'],
  ['passenger', 'n', 'ˈpæs.ən.dʒə(r)', 'hành khách'],
  ['formal', 'adj', 'ˈfɔː.məl', 'trang trọng'],
]

// Unit 3 – vở ghi từ vựng tiếp theo (phần 4)
const U3_VOCAB4_WORDS = [
  ['lively', 'adj', 'ˈlaɪv.li', 'sống động, sôi nổi'],
  ['variety', 'n', 'vəˈraɪ.ə.ti', 'sự đa dạng, nhiều loại'],
  ['attractive', 'adj', 'əˈtræk.tɪv', 'hấp dẫn, thu hút'],
  ['brave', 'adj', 'breɪv', 'dũng cảm'],
  ['calm', 'adj', 'kɑːm', 'bình tĩnh, yên tĩnh'],
  ['cheerful', 'adj', 'ˈtʃɪə.fəl', 'vui vẻ, tươi tắn'],
  ['pleasure', 'n', 'ˈpleʒ.ə(r)', 'niềm vui, sự hài lòng'],
  ['flavour', 'n', 'ˈfleɪ.və(r)', 'hương vị'],
  ['destination', 'n', 'ˌdes.tɪˈneɪ.ʃən', 'điểm đến'],
  ['benefit', 'n', 'ˈbenɪfɪt', 'lợi ích'],
  ['access to', 'n/v', 'ˈæk.ses tə', 'sự tiếp cận; truy cập vào'],
  ['behaviour', 'n', 'bɪˈheɪ.vjə(r)', 'cách cư xử, hành vi'],
  ['casual', 'adj', 'ˈkæʒ.ju.əl', 'thường ngày, giản dị'],
  ['baggy', 'adj', 'ˈbæɡ.i', 'rộng thùng thình'],
  ['loose jeans', 'n', 'luːs dʒiːnz', 'quần jeans ống rộng'],
  ['personality', 'n', 'ˌpɜː.sənˈæl.ə.ti', 'tính cách, cá tính'],
  ['nowadays', 'adv', 'ˈnaʊ.ə.deɪz', 'ngày nay'],
  ['stylish', 'adj', 'ˈstaɪ.lɪʃ', 'hợp thời trang, sành điệu'],
]

// Unit 4 – bảng từ vựng (phần 1)
const U4_VOCAB1_WORDS = [
  ['adventure', 'n', 'ədˈven.tʃə(r)', 'cuộc phiêu lưu'],
  ['dangerous', 'adj', 'ˈdeɪn.dʒər.əs', 'nguy hiểm'],
  ['science fiction', 'n', 'ˌsaɪ.əns ˈfɪk.ʃən', 'khoa học viễn tưởng'],
  ['essential', 'adj', 'ɪˈsen.ʃəl', 'thiết yếu'],
  ['ingredient', 'n', 'ɪnˈɡriː.di.ənt', 'thành phần (nguyên liệu)'],
  ['quality', 'n', 'ˈkwɒl.ə.ti', 'phẩm chất, chất lượng'],
  ['equipment', 'n', 'ɪˈkwɪp.mənt', 'trang thiết bị'],
  ['ordinary', 'adj', 'ˈɔː.dən.ri', 'bình thường'],
  ['fantastic', 'adj', 'fænˈtæs.tɪk', 'tuyệt vời'],
  ['frighten', 'v', 'ˈfraɪ.tən', 'làm sợ, làm hoảng hốt'],
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
    sections: [
      { id: 'p1', name: 'Phần 1 – Session 6: Vocabulary' },
      { id: 'p2', name: 'Phần 2 – Vocab' },
      { id: 'p3', name: 'Phần 3 – Vocabulary + Reading Part 5' },
      { id: 'p4', name: 'Phần 4 – Vocab (tiếp)' },
      { id: 'p5', name: 'Phần 5 – Session 9: Writing Part 2 + Speaking Part 3' },
    ],
    groups: [
      { version: 8, prefix: 'u2s6', seedBase: 900, section: 'p1', rows: U2S6_WORDS },
      { version: 9, prefix: 'u2v2', seedBase: 1000, section: 'p2', rows: U2_VOCAB2_WORDS },
      { version: 10, prefix: 'u2v3', seedBase: 1100, section: 'p3', rows: U2_VOCAB3_WORDS },
      { version: 11, prefix: 'u2v4', seedBase: 1200, section: 'p4', rows: U2_VOCAB4_WORDS },
      { version: 12, prefix: 'u2v5', seedBase: 1300, section: 'p5', rows: U2_VOCAB5_WORDS },
    ],
  },
  {
    id: 'u3',
    name: 'Unit 3: Let’s Shop',
    nameMatch: /^\s*unit\s*3\b/i,
    sections: [
      { id: 'p1', name: 'Phần 1 – Session 11: Listening Part 4 + Speaking Part 4' },
      { id: 'p2', name: 'Phần 2 – Vocab' },
      { id: 'p3', name: 'Phần 3 – Vocab (tiếp)' },
      { id: 'p4', name: 'Phần 4 – Vocab (tiếp)' },
    ],
    groups: [
      { version: 14, prefix: 'u3s11', seedBase: 1400, section: 'p1', rows: U3S11_WORDS },
      { version: 15, prefix: 'u3v2', seedBase: 1500, section: 'p2', rows: U3_VOCAB2_WORDS },
      { version: 16, prefix: 'u3v3', seedBase: 1600, section: 'p3', rows: U3_VOCAB3_WORDS },
      { version: 17, prefix: 'u3v4', seedBase: 1700, section: 'p4', rows: U3_VOCAB4_WORDS },
    ],
  },
  {
    id: 'u4',
    name: 'Unit 4',
    nameMatch: /^\s*unit\s*4\b/i,
    sections: [{ id: 'p1', name: 'Phần 1 – Vocab' }],
    groups: [
      { version: 18, prefix: 'u4v1', seedBase: 1800, section: 'p1', rows: U4_VOCAB1_WORDS },
    ],
  },
  ...TOPICS.map(topicUnit),
]

// Một chủ đề -> unit chủ đề, chia thành các phần khoảng 25-30 từ để học vừa sức
function topicUnit(t, i) {
  const parts = Math.ceil(t.rows.length / 30)
  const size = Math.ceil(t.rows.length / parts)
  const sections = []
  const groups = []
  for (let p = 0; p < parts; p++) {
    const rows = t.rows.slice(p * size, (p + 1) * size)
    const from = p * size + 1
    sections.push({ id: `p${p + 1}`, name: `Phần ${p + 1} (từ ${from}–${from + rows.length - 1})` })
    groups.push({
      version: 13,
      prefix: `${t.id}p${p + 1}`,
      seedBase: 10000 + i * 100 + p * size,
      section: `p${p + 1}`,
      rows: rows.map(([word, meaning]) => [word, '', '', meaning]),
    })
  }
  return { id: t.id, name: `${t.name} – ${t.en}`, kind: 'topic', icon: t.icon, sections, groups }
}

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
    ...(u.kind && { kind: u.kind, icon: u.icon }),
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

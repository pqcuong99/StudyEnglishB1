// Câu ví dụ đơn giản (trình độ B1) cho các từ có sẵn, hiện ở mặt sau của
// flashcard. Tra theo chữ của từ (không phân biệt hoa/thường) chứ không lưu
// vào dữ liệu người dùng, nên từ đã lưu trên máy chủ từ trước vẫn có ví dụ.
//
// Từ do người dùng tự thêm có thể mang sẵn `example` / `exampleVi` trong
// object từ; nếu có thì ưu tiên dùng.
//
// Mỗi dòng: [từ, câu tiếng Anh, nghĩa tiếng Việt của câu]
const ROWS = [
  // Phần 1 – Session 2
  ['prefer', 'I prefer tea to coffee.', 'Tôi thích trà hơn cà phê.'],
  ['article', 'I read an interesting article about space.', 'Tôi đã đọc một bài báo thú vị về vũ trụ.'],
  ['extreme sport', 'Skydiving is an extreme sport.', 'Nhảy dù là một môn thể thao mạo hiểm.'],
  ['terrible at', "I'm terrible at singing.", 'Tôi hát rất dở.'],
  ['fiction', 'She loves reading science fiction.', 'Cô ấy thích đọc truyện khoa học viễn tưởng.'],
  ['opposite', 'The bank is opposite the post office.', 'Ngân hàng ở đối diện bưu điện.'],
  ['encourage', 'My teacher encourages me to read more.', 'Cô giáo khuyến khích tôi đọc nhiều hơn.'],
  ['be keen on', 'He is keen on football.', 'Anh ấy rất thích bóng đá.'],
  ['audience', 'The audience clapped at the end of the show.', 'Khán giả vỗ tay khi buổi diễn kết thúc.'],
  ['traditional', 'We wore traditional clothes at the festival.', 'Chúng tôi mặc trang phục truyền thống trong lễ hội.'],
  ['perform', 'The band will perform tonight.', 'Ban nhạc sẽ biểu diễn tối nay.'],
  ['protect', 'Sunglasses protect your eyes from the sun.', 'Kính râm bảo vệ mắt bạn khỏi ánh nắng.'],
  ['environment', 'We should protect the environment.', 'Chúng ta nên bảo vệ môi trường.'],
  ['be brought up', 'I was brought up in a small village.', 'Tôi lớn lên ở một ngôi làng nhỏ.'],
  ['imagination', 'Children have a great imagination.', 'Trẻ em có trí tưởng tượng phong phú.'],
  ['take part in', 'I took part in a singing competition.', 'Tôi đã tham gia một cuộc thi hát.'],
  ['enjoy', 'I enjoy playing the guitar.', 'Tôi thích chơi ghi-ta.'],
  ['exchange', 'We exchanged phone numbers.', 'Chúng tôi trao đổi số điện thoại.'],
  ['story', 'My grandmother told me a story.', 'Bà kể cho tôi nghe một câu chuyện.'],
  ['theatre', 'We went to the theatre last night.', 'Tối qua chúng tôi đi xem kịch ở nhà hát.'],
  ['interest', 'She has a great interest in music.', 'Cô ấy rất hứng thú với âm nhạc.'],
  ['painting', 'There is a beautiful painting on the wall.', 'Có một bức tranh đẹp trên tường.'],
  ['recipe', "This is my mum's recipe for chicken soup.", 'Đây là công thức nấu súp gà của mẹ tôi.'],
  ['nervous', 'I feel nervous before exams.', 'Tôi thấy lo lắng trước kì thi.'],
  ['competition', 'She won the dance competition.', 'Cô ấy đã thắng cuộc thi nhảy.'],

  // Phần 2 – Session 3
  ['hall', 'The students waited in the hall.', 'Học sinh đợi ở hội trường.'],
  ['reception', 'Please wait at the reception.', 'Vui lòng đợi ở quầy lễ tân.'],
  ['tennis court', 'Our school has a new tennis court.', 'Trường tôi có sân quần vợt mới.'],
  ['sport field', 'The boys are playing on the sport field.', 'Các cậu bé đang chơi trên sân thể thao.'],
  ['science lab', 'We do experiments in the science lab.', 'Chúng tôi làm thí nghiệm trong phòng thí nghiệm khoa học.'],
  ['decorate', 'We decorated the classroom for the party.', 'Chúng tôi trang trí lớp học cho bữa tiệc.'],
  ['immediately', 'Call me immediately if you need help.', 'Gọi cho tôi ngay lập tức nếu bạn cần giúp.'],
  ['comfortable', 'This chair is very comfortable.', 'Cái ghế này rất thoải mái.'],
  ['concentrate', "I can't concentrate when it's noisy.", 'Tôi không thể tập trung khi ồn ào.'],
  ['disappoint', "I don't want to disappoint my parents.", 'Tôi không muốn làm bố mẹ thất vọng.'],
  ['French', 'She speaks French very well.', 'Cô ấy nói tiếng Pháp rất giỏi.'],
  ['Polish', 'He is learning Polish.', 'Anh ấy đang học tiếng Ba Lan.'],
  ['communicate', 'We communicate by email every day.', 'Chúng tôi trao đổi qua email mỗi ngày.'],

  // Phần 2 – vở ghi
  ['e-pal', 'I have an e-pal in Japan.', 'Tôi có một người bạn qua mạng ở Nhật.'],
  ['originally', 'My family is originally from Hanoi.', 'Gia đình tôi có nguồn gốc từ Hà Nội.'],
  ['messy', 'Your room is so messy!', 'Phòng của bạn bừa bộn quá!'],
  ['tidy', 'Her desk is always tidy.', 'Bàn của cô ấy luôn gọn gàng.'],
  ['reason', 'What is the reason for being late?', 'Lý do đến muộn là gì?'],
  ['racket', 'I bought a new tennis racket.', 'Tôi đã mua một cây vợt tennis mới.'],
  ['be interested in', "I'm interested in learning English.", 'Tôi thích học tiếng Anh.'],
  ['stage', 'The singer walked onto the stage.', 'Ca sĩ bước lên sân khấu.'],
  ['extreme', 'The heat was extreme last summer.', 'Cái nóng mùa hè năm ngoái thật khắc nghiệt.'],
  ['extreme weather', 'Extreme weather can be dangerous.', 'Thời tiết cực đoan có thể nguy hiểm.'],
  ['both', 'Both my parents are teachers.', 'Cả bố và mẹ tôi đều là giáo viên.'],
  ['especially', 'I love fruit, especially mangoes.', 'Tôi thích trái cây, đặc biệt là xoài.'],
  ['lots of', 'There are lots of books in the library.', 'Có nhiều sách trong thư viện.'],

  // Phần 3 – Vocab
  ['routine', 'Exercise is part of my daily routine.', 'Tập thể dục là một phần trong nếp sinh hoạt hàng ngày của tôi.'],
  ['organise', 'We are organising a party for Tom.', 'Chúng tôi đang tổ chức một bữa tiệc cho Tom.'],
  ['gym', 'I go to the gym three times a week.', 'Tôi đến phòng tập ba lần một tuần.'],
  ['cycling', 'Cycling is good for your health.', 'Đạp xe tốt cho sức khỏe của bạn.'],
  ['confident', 'She feels confident about the test.', 'Cô ấy cảm thấy tự tin về bài kiểm tra.'],
  ['excellent', 'Your English is excellent!', 'Tiếng Anh của bạn xuất sắc!'],
  ['case', 'In that case, we can go tomorrow.', 'Trong trường hợp đó, chúng ta có thể đi vào ngày mai.'],
  ['development', "Sleep is important for a child's development.", 'Giấc ngủ rất quan trọng cho sự phát triển của trẻ.'],
  ['prevent', 'Washing your hands prevents illness.', 'Rửa tay giúp ngăn ngừa bệnh tật.'],
  ['course', "I'm taking an English course this summer.", 'Hè này tôi đang học một khóa tiếng Anh.'],
  ['ceremony', 'The opening ceremony starts at 9 a.m.', 'Lễ khai mạc bắt đầu lúc 9 giờ sáng.'],
  ['degree', 'She has a degree in Maths.', 'Cô ấy có bằng cử nhân Toán.'],

  // Phần 3 – vở ghi
  ['baseball', 'We played baseball in the park.', 'Chúng tôi chơi bóng chày trong công viên.'],
  ['take up', 'I took up swimming last year.', 'Năm ngoái tôi bắt đầu tập bơi.'],
  ['arrive', "The train arrives at 6 o'clock.", 'Tàu đến lúc 6 giờ.'],
  ['attend', 'All students must attend the meeting.', 'Tất cả học sinh phải tham dự buổi họp.'],
  ['get', 'I got a letter from my friend.', 'Tôi nhận được một lá thư từ bạn tôi.'],
  ['hand in', 'Please hand in your homework tomorrow.', 'Hãy nộp bài tập về nhà vào ngày mai.'],
  ['take', "Take an umbrella, it's going to rain.", 'Cầm theo ô đi, trời sắp mưa đấy.'],
  ['wear', 'She is wearing a red dress.', 'Cô ấy đang mặc một chiếc váy đỏ.'],
  ['expect', 'I expect to pass the exam.', 'Tôi mong sẽ đậu kì thi.'],
  ['charity', 'We raised money for charity.', 'Chúng tôi gây quỹ cho từ thiện.'],
  ['strict', 'Our teacher is very strict.', 'Thầy giáo của chúng tôi rất nghiêm khắc.'],
  ['make progress', 'You are making good progress in English.', 'Bạn đang tiến bộ tốt trong tiếng Anh.'],
  ['prepare', "I'm preparing for my exam.", 'Tôi đang chuẩn bị cho kì thi.'],
  ['scared', "I'm scared of spiders.", 'Tôi sợ nhện.'],
  ['crowd', 'A big crowd watched the match.', 'Một đám đông lớn xem trận đấu.'],
  ['quiet', 'Please be quiet in the library.', 'Vui lòng giữ yên lặng trong thư viện.'],
  ['impressed', 'I was impressed by her singing.', 'Tôi rất ấn tượng với giọng hát của cô ấy.'],

  // Phần 4 – Session 5: Writing Part 1
  ['apologise', 'I apologise for being late.', 'Tôi xin lỗi vì đến muộn.'],
  ['please', 'It is hard to please everyone.', 'Thật khó để làm hài lòng tất cả mọi người.'],
  ['transport', 'The bus is the cheapest form of transport here.', 'Xe buýt là phương tiện giao thông rẻ nhất ở đây.'],
  ['offer', 'She offered me a cup of tea.', 'Cô ấy mời tôi một tách trà.'],
  ['suggest', 'I suggest we go by train.', 'Tôi đề xuất chúng ta đi bằng tàu.'],
  ['advise', 'The doctor advised me to rest.', 'Bác sĩ khuyên tôi nên nghỉ ngơi.'],

  // Phần 4 – vở ghi Speaking Part 1
  ['probably', 'It will probably rain tomorrow.', 'Ngày mai có lẽ trời sẽ mưa.'],
  ['correct', 'All your answers are correct.', 'Tất cả câu trả lời của bạn đều chính xác.'],
  ['unfortunately', 'Unfortunately, I missed the bus.', 'Không may là tôi đã lỡ xe buýt.'],
  ["can't stand", "I can't stand hot weather.", 'Tôi không thể chịu được thời tiết nóng.'],
  ['consider', 'I consider him a good friend.', 'Tôi coi anh ấy là một người bạn tốt.'],
  ['few', 'I have a few books about history.', 'Tôi có một vài cuốn sách về lịch sử.'],
  ['low', 'Prices are low in this shop.', 'Giá ở cửa hàng này thấp.'],
  ['little', 'There is a little milk left.', 'Còn lại một chút sữa.'],
  ['situation', 'It was a difficult situation.', 'Đó là một tình huống khó khăn.'],
  ['refuse', 'He refused to help me.', 'Anh ấy từ chối giúp tôi.'],
  ['avoid', 'I avoid eating too much sugar.', 'Tôi tránh ăn quá nhiều đường.'],
  ['gain', 'She gained a lot of experience at work.', 'Cô ấy nhận được nhiều kinh nghiệm ở chỗ làm.'],
  ['possibility', 'There is a possibility of snow tonight.', 'Có khả năng tối nay có tuyết.'],
  ['benefit', 'Exercise has many benefits for your health.', 'Tập thể dục có nhiều lợi ích cho sức khỏe.'],
  ['experienced', 'She is an experienced teacher.', 'Cô ấy là một giáo viên có kinh nghiệm.'],
  ['involved', 'Many students were involved in the project.', 'Nhiều học sinh đã tham gia vào dự án.'],
  ['prevent sb from doing sth', 'The rain prevented us from going out.', 'Cơn mưa ngăn chúng tôi ra ngoài.'],
]

const key = (s) => String(s || '').trim().toLowerCase()

const BY_WORD = new Map(ROWS.map(([word, en, vi]) => [key(word), { en, vi }]))

// Câu ví dụ cho một từ: { en, vi } hoặc null nếu không có.
export function getExample(word) {
  if (!word) return null
  if (word.example) return { en: word.example, vi: word.exampleVi || '' }
  return BY_WORD.get(key(word.word)) || null
}

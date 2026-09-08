// Unit có sẵn khi mở app lần đầu (khi trình duyệt chưa có dữ liệu).
// Dữ liệu lấy từ file NC_U1_Session 2.pdf của khóa học.
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

export function seedUnits() {
  return [
    {
      id: 'u1s2',
      name: 'Unit 1: All About Me – Session 2: Giving personal information',
      createdAt: Date.now(),
      words: U1S2_WORDS.map(([word, pos, ipa, meaning], i) => ({
        id: `u1s2-${String(i + 1).padStart(2, '0')}`,
        word,
        pos,
        ipa,
        meaning,
        seed: i + 101,
        known: false,
      })),
    },
  ]
}

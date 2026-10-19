// Bài luyện nghe có sẵn của khóa học.
//
// Nguồn: Session 3.pptx – trang 6 là file audio LISTENING PART 2 ("Being at
// school"), trang 7-12 là recording script + câu hỏi của 6 bài. File audio
// gốc (media2.mp3, 4:46) được tách theo các khoảng lặng 5 giây thành 6 file
// trong src/assets/listening/, mỗi file ứng với một trang script.
//
// Mỗi bài: `intro` là câu dẫn ("You will hear..."), `lines` là hội thoại
// (s = người nói: F/M), `question` + `options` + `answer` (chỉ số 0-2) là câu
// hỏi trắc nghiệm của đề thi, `key` là câu chứa đáp án (được gạch chân trong
// script gốc).

import q1 from '../assets/listening/u1-session3-part2-q1.mp3'
import q2 from '../assets/listening/u1-session3-part2-q2.mp3'
import q3 from '../assets/listening/u1-session3-part2-q3.mp3'
import q4 from '../assets/listening/u1-session3-part2-q4.mp3'
import q5 from '../assets/listening/u1-session3-part2-q5.mp3'
import q6 from '../assets/listening/u1-session3-part2-q6.mp3'
import u2q1 from '../assets/listening/u2-wb03-part3-q1.mp3'
import u2q2 from '../assets/listening/u2-wb03-part3-q2.mp3'
import u2q3 from '../assets/listening/u2-wb03-part3-q3.mp3'
import u2q4 from '../assets/listening/u2-wb03-part3-q4.mp3'
import u2q5 from '../assets/listening/u2-wb03-part3-q5.mp3'
import u2sp3 from '../assets/listening/u2-sp3-sports-centre.mp3'
import u2sp3Img from '../assets/listening/u2-sp3-sports-centre.svg'

const U1_SESSION3_PART2 = [
  {
    id: 'u1s3-p2-q1',
    page: 7,
    title: 'Bài 1 – New school hall',
    audio: q1,
    intro: 'You will hear two friends talking about their new school hall.',
    lines: [
      { s: 'F', t: 'Hi, Ben. What do you think of the new school hall?' },
      {
        s: 'M',
        t: "Well, it wasn't finished before the summer holidays, was it, so I really didn't know what to expect. But it's much better!",
      },
      { s: 'F', t: "I love the colours they've used to paint it all." },
      {
        s: 'M',
        t: "Yeah, they're your favourites, aren't they? And now they've put in more windows, it's a bit brighter in there than in the old hall. But it's just so much larger than what we had before – incredible! That means we'll be able to use it in lots of different ways!",
      },
      { s: 'F', t: 'Absolutely.' },
    ],
    question: 'What is the boy most impressed by?',
    options: ['the space it has inside', "the way it's decorated", 'the amount of light coming in'],
    answer: 0,
    key: "But it's just so much larger than what we had before – incredible!",
  },
  {
    id: 'u1s3-p2-q2',
    page: 8,
    title: 'Bài 2 – School concert',
    audio: q2,
    intro: 'You will hear a girl talking to her brother about a concert.',
    lines: [
      { s: 'F', t: 'Have you decided yet about going to the school concert, Jamie?' },
      {
        s: 'M',
        t: "Oh, I'll be there – but they're asking people to pay for concert tickets this year!",
      },
      {
        s: 'F',
        t: "Well, it's to raise money for charity – and if money's a problem, I can get one for you. Anyway, if you took part, you could go for free!",
      },
      { s: 'M', t: "Is that what you're going to do, then?" },
      {
        s: 'F',
        t: "Absolutely! I'm singing! Come on! Loads of your friends'll come and watch – they love it when you play guitar.",
      },
      { s: 'M', t: 'Well, OK – but only if my mates get tickets!' },
    ],
    question: 'What is she trying to persuade him to do?',
    options: ['buy her a concert ticket', 'go with her to watch the concert', 'perform in the concert'],
    answer: 2,
    key: "Anyway, if you took part, you could go for free! … Come on! Loads of your friends'll come and watch – they love it when you play guitar.",
  },
  {
    id: 'u1s3-p2-q3',
    page: 9,
    title: 'Bài 3 – New secondary school',
    audio: q3,
    intro: "You will hear two friends talking about the new school they've just moved to.",
    lines: [
      { s: 'M', t: 'Do you like our new secondary school, Hazel?' },
      {
        s: 'F',
        t: "Yeah, it's cool! The thing is, I came from a really small primary school, so it's taken me a while to feel at home here – but it's better now than when I started.",
      },
      { s: 'M', t: "Yeah, it's a big place, isn't it?" },
      {
        s: 'F',
        t: "Huge! But at least they're not at all strict about our uniforms and stuff. And my mum and dad said it was just like that when they studied at the school, too – and they got really good results!",
      },
      { s: 'M', t: "Well, that's good to hear, because that's why my parents chose it for me!" },
    ],
    question: 'What does the girl say about the school?',
    options: [
      'The rules there are quite relaxed.',
      "It's changed since her parents were there.",
      'She immediately felt comfortable there.',
    ],
    answer: 0,
    key: "But at least they're not at all strict about our uniforms and stuff.",
  },
  {
    id: 'u1s3-p2-q4',
    page: 10,
    title: 'Bài 4 – Learning the piano',
    audio: q4,
    intro: 'You will hear a boy telling his friend about problems learning the piano.',
    lines: [
      { s: 'F', t: "How's the piano playing going, Mark?" },
      {
        s: 'M',
        t: "Well, I'm really enjoying playing, but I'm not making much progress. My teacher's a bit disappointed, I think.",
      },
      {
        s: 'F',
        t: "Well, having a teacher is a great way to learn – but maybe you could try just taking a favourite song, say, and learn to play that really well, before you move on and try playing something else. I mean, you've got loads of piano music on your laptop – you're always listening to that. So just choose something from there.",
      },
      { s: 'M', t: "Yeah, it'll be easy to find something I like. Thanks!" },
    ],
    question: 'What does the girl advise him to do?',
    options: ['take up piano lessons', 'concentrate on one piece of music', 'listen to more piano music'],
    answer: 1,
    key: 'Maybe you could try just taking a favourite song, say, and learn to play that really well, before you move on and try playing something else.',
  },
  {
    id: 'u1s3-p2-q5',
    page: 11,
    title: 'Bài 5 – Hockey match',
    audio: q5,
    intro: 'You will hear two friends talking about a hockey match that the girl played in.',
    lines: [
      { s: 'M', t: 'How did the hockey match go, Karen?' },
      {
        s: 'F',
        t: "Well, I arrived at the sports field late, so I didn't have much time to prepare. But the match started and all of our team played brilliantly – including me! I mean, we didn't actually manage to beat the other team because no one scored. But that means we're going to play them again next week – so you can be there this time. It wasn't the same without you in the crowd!",
      },
      {
        s: 'M',
        t: "I know – but don't worry. I'm really looking forward to watching your next match!",
      },
    ],
    question: 'How did she feel about it?',
    options: [
      "sad that her team didn't win",
      "worried that she didn't play well",
      "disappointed that her friend didn't see it",
    ],
    answer: 2,
    key: "It wasn't the same without you in the crowd!",
  },
  {
    id: 'u1s3-p2-q6',
    page: 12,
    title: 'Bài 6 – Summer holidays',
    audio: q6,
    intro: 'You will hear two friends talking about breaking up for the summer holidays.',
    lines: [
      { s: 'M', t: 'Wow! The school summer holidays start soon!' },
      { s: 'F', t: "I know! I'm helping Dad in his shop, so I'll be really busy!" },
      {
        s: 'M',
        t: "Mm, I'm going to do something like that – I'm going to be bored otherwise. And lots of people we know in our class are going away for the holiday, so it'll be really quiet.",
      },
      {
        s: 'F',
        t: "I know what you mean … I hate not seeing them during the holidays. Anyway, I'm just off to get the library books we need for our school reading project. I'm looking forward to it!",
      },
      { s: 'M', t: "Really? I've read most of them already – but I'll come with you!" },
    ],
    question: 'What do they agree about the holiday?',
    options: [
      "They'll have a lot of schoolwork to do.",
      "They'll miss their friends from their class.",
      "They'll get bored before the holidays finish.",
    ],
    answer: 1,
    key: "And lots of people we know in our class are going away for the holiday, so it'll be really quiet. … I know what you mean … I hate not seeing them during the holidays.",
  },
]

// Unit 2 – Workbook audio COMPACT_PFS_WB_03.mp3 (Listening Part 3, 2:34): một
// người nói (W = Susan Chapman). Audio được cắt tại các khoảng lặng thành 5
// đoạn trong src/assets/listening/, mỗi đoạn là một bài; `lines` là các đoạn
// văn của bài nói, không có `page`.
const U2_WB03_PART3 = [
  {
    id: 'u2wb3-p3-q1',
    title: 'Bài 1 – The centre reopens',
    audio: u2q1,
    intro:
      'You will hear a woman called Susan Chapman telling a group of secondary school pupils about a sports centre.',
    lines: [
      {
        s: 'W',
        t: "Good morning. My name's Susan Chapman. I'm the manager of the Westfield Sports Centre, and I'm here today to tell you all about it.",
      },
      {
        s: 'W',
        t: 'Now, as some of you may know, the centre was closed for a few months for improvements. We were hoping to be able to open again last July, but the work took longer than planned, and we have only just opened now, in September.',
      },
    ],
    question: 'When did the sports centre open again?',
    options: ['last July', 'in September', 'a few months ago'],
    answer: 1,
    key: 'We were hoping to be able to open again last July, but the work took longer than planned, and we have only just opened now, in September.',
  },
  {
    id: 'u2wb3-p3-q2',
    title: 'Bài 2 – New gym & indoor pool',
    audio: u2q2,
    intro: 'Susan talks about what the centre built with its new money.',
    lines: [
      {
        s: 'W',
        t: 'We were lucky, as we got a grant from the local council. And, with this money, we were able to build a separate gym just for young people aged twelve to sixteen.',
      },
      {
        s: 'W',
        t: "And now, as well as the old outdoor swimming pool for the summer, we have a new indoor one. It's fifty metres long and twenty five metres wide, so perfect for serious swimmers to practise for competitions.",
      },
    ],
    question: 'What did the centre use the money from the local council for?',
    options: ['a new indoor swimming pool', 'a gym for young people', 'a pool for competitions'],
    answer: 1,
    key: 'With this money, we were able to build a separate gym just for young people aged twelve to sixteen.',
  },
  {
    id: 'u2wb3-p3-q3',
    title: 'Bài 3 – Team sports',
    audio: u2q3,
    intro: 'Susan talks about the team sports at the centre.',
    lines: [
      {
        s: 'W',
        t: 'As well as the gym and the pool, we have a whole range of other sports and activities that you might be interested in.',
      },
      {
        s: 'W',
        t: "We have several team sports. In addition to basketball and football, which we've always had, we are now offering hockey on Saturday mornings.",
      },
    ],
    question: 'Which team sport is new at the centre?',
    options: ['basketball', 'football', 'hockey'],
    answer: 2,
    key: 'We are now offering hockey on Saturday mornings.',
  },
  {
    id: 'u2wb3-p3-q4',
    title: 'Bài 4 – Individual sports & classes',
    audio: u2q4,
    intro: 'Susan talks about individual sports, volleyball and dance classes.',
    lines: [
      {
        s: 'W',
        t: "We also have individual sports. We're continuing our programme of classes for badminton, tennis and squash, and we've just opened a new one for gymnastics.",
      },
      {
        s: 'W',
        t: 'Oh, and I forgot to mention before that, next to our tennis courts, we now have a couple of courts for volleyball, a game which is becoming very popular.',
      },
      {
        s: 'W',
        t: 'And we have various dance and fitness classes for people of all ages, both young and old.',
      },
    ],
    question: 'What has the centre just started a new class for?',
    options: ['squash', 'gymnastics', 'volleyball'],
    answer: 1,
    key: "We're continuing our programme of classes for badminton, tennis and squash, and we've just opened a new one for gymnastics.",
  },
  {
    id: 'u2wb3-p3-q5',
    title: 'Bài 5 – Membership prices',
    audio: u2q5,
    intro: 'Susan talks about how much it costs to join the centre.',
    lines: [
      {
        s: 'W',
        t: "In case you're wondering how much it costs to sign up to Westfield, the good news is it's not very much.",
      },
      {
        s: 'W',
        t: "To encourage young people to get fit, there is currently a fifty percent discount on membership for anyone under eighteen. And it's twenty five percent for over eighteens, so tell your parents.",
      },
    ],
    question: 'How much discount do people under eighteen get on membership?',
    options: ['18%', '25%', '50%'],
    answer: 2,
    key: 'There is currently a fifty percent discount on membership for anyone under eighteen.',
  },
]

// Unit 2 – Student's Book trang 21, Speaking Part 3 (Exam task): hai học sinh
// (A, B) thảo luận các hoạt động trong tranh cho một trung tâm thể thao và chọn
// ra hai hoạt động tốt nhất. Không có audio gốc: audio được tạo bằng giọng đọc
// AI (edge-tts, A = en-GB-RyanNeural, B = en-GB-LibbyNeural), các lượt thoại
// nối liền cách nhau 0,6 giây. Bài có thêm chế độ "Nghe & đọc" (ListenRead.jsx):
//   `image`  tranh vẽ lại có màu của trang sách
//   `vi`     nghĩa tiếng Việt của lượt thoại
//   `at`     [giây bắt đầu, giây kết thúc] của lượt thoại trong file audio
//   `w`      giây bắt đầu của từng từ (tách theo khoảng trắng) – để tô phụ đề theo từng chữ
//   `phrases` các cụm đồng ý / không đồng ý / hỏi ý kiến được tô màu trong phụ đề
const U2_SP3_SPORTS_CENTRE = [
  {
    id: 'u2-sp3-q1',
    page: 21,
    title: 'Sports & activity centre',
    audio: u2sp3,
    image: u2sp3Img,
    intro:
      'Two students are talking about activities for a new sports and activity centre. They have to choose the two best ones.',
    task: 'Đề bài (Speaking Part 3): Hai bạn thảo luận các hoạt động trong tranh cho một trung tâm thể thao mới, nêu ý kiến đồng ý / không đồng ý với nhau, rồi chọn ra 2 hoạt động tốt nhất.',
    lines: [
      {
        s: 'A',
        t: "Shall I start first? Looking at these ideas for the sports and activity centre, how about mountain biking or rock climbing? They seem really exciting for young people.",
        vi: "Mình bắt đầu trước nhé? Nhìn các ý tưởng cho trung tâm thể thao và hoạt động này, đạp xe địa hình hoặc leo núi đá thì sao? Chúng có vẻ rất thú vị với các bạn trẻ.",
        at: [0.0, 12.53],
        w: [0.1,0.37,0.48,0.82,2.4,2.82,2.93,3.2,3.68,3.77,3.9,4.37,4.48,4.98,5.69,5.84,6.15,6.59,7.09,7.24,7.62,9.18,9.44,9.75,10.05,10.65,10.78,11.07],
      },
      {
        s: 'B',
        t: "I agree with you to some extent, because extreme sports give teenagers an adrenaline rush. However, I'm not really sure about rock climbing. It can be quite risky and requires a lot of specialized safety gear. What do you think about surfing or sailing on the water?",
        vi: "Mình đồng ý với bạn ở một mức độ nào đó, vì các môn thể thao mạo hiểm mang lại cho tuổi teen cảm giác phấn khích tột độ. Tuy nhiên, mình không chắc lắm về leo núi đá. Nó có thể khá nguy hiểm và cần rất nhiều đồ bảo hộ chuyên dụng. Bạn nghĩ sao về lướt sóng hoặc đi thuyền buồm trên mặt nước?",
        at: [13.18, 34.2],
        w: [13.28,13.47,13.84,13.97,14.18,14.29,14.5,15.39,15.74,16.28,16.73,16.96,17.57,17.78,18.32,19.81,20.74,21.06,21.33,21.71,22.06,22.33,22.67,24.24,24.36,24.56,24.74,25.15,25.78,26.14,26.75,26.89,27.13,27.28,28.07,28.53,29.93,30.13,30.28,30.43,30.68,31.0,31.71,31.97,32.44,32.54,32.65],
      },
      {
        s: 'A',
        t: "I see what you mean, but not everyone knows how to swim, and sailing often depends heavily on good weather conditions. Don't you think horse riding could be a gentler alternative for nature lovers?",
        vi: "Mình hiểu ý bạn, nhưng không phải ai cũng biết bơi, và đi thuyền buồm thường phụ thuộc rất nhiều vào thời tiết đẹp. Bạn không nghĩ cưỡi ngựa có thể là lựa chọn nhẹ nhàng hơn cho những người yêu thiên nhiên sao?",
        at: [34.85, 47.42],
        w: [34.95,35.14,35.4,35.6,35.72,36.24,36.4,36.66,37.11,37.49,37.67,37.81,38.49,38.62,39.06,39.38,39.81,40.18,40.37,40.6,40.87,42.6,42.89,42.98,43.23,43.54,43.92,44.1,44.22,44.31,44.82,45.47,45.59,45.93],
      },
      {
        s: 'B',
        t: "I'm afraid I disagree. Horse riding can be quite expensive to organize, and some people might even be scared of big animals. In my opinion, team sports would be much more suitable for bringing people together. Look at volleyball!",
        vi: "Mình e là mình không đồng ý. Tổ chức cưỡi ngựa có thể khá tốn kém, và một số người thậm chí có thể sợ những con vật to lớn. Theo mình, các môn thể thao đồng đội sẽ phù hợp hơn nhiều để gắn kết mọi người. Nhìn bóng chuyền xem!",
        at: [48.07, 66.6],
        w: [48.18,48.39,48.92,49.14,50.8,51.16,51.7,51.85,52.0,52.34,53.0,53.17,54.1,54.42,54.68,55.11,55.48,55.82,56.01,56.39,56.52,56.77,58.44,58.59,58.87,59.55,60.06,60.59,60.78,60.95,61.28,61.54,62.13,62.27,62.65,63.03,64.51,64.74,64.91],
      },
      {
        s: 'A',
        t: "That's a very good point! I completely agree. Volleyball is energetic, fun, and encourages great teamwork without needing too much expensive equipment. It can be played both indoors and outdoors.",
        vi: "Ý đó rất hay! Mình hoàn toàn đồng ý. Bóng chuyền sôi động, vui và khuyến khích tinh thần đồng đội rất tốt mà không cần quá nhiều dụng cụ đắt tiền. Nó có thể chơi được cả trong nhà lẫn ngoài trời.",
        at: [67.25, 82.56],
        w: [67.35,67.62,67.69,68.03,68.27,69.76,69.92,70.5,72.01,72.68,72.8,73.59,74.09,74.24,74.87,75.25,75.75,76.1,76.46,76.69,76.97,77.5,79.04,79.25,79.4,79.53,79.89,80.16,80.69,80.83],
      },
      {
        s: 'B',
        t: "Exactly! And what about table tennis? It's also an indoor game, easy to set up, and very safe for everyone, even complete beginners.",
        vi: "Chính xác! Còn bóng bàn thì sao? Đó cũng là một môn chơi trong nhà, dễ bố trí, và rất an toàn cho mọi người, kể cả người mới tập hoàn toàn.",
        at: [83.21, 95.33],
        w: [83.31,85.07,85.25,85.49,85.84,86.27,87.85,88.02,88.51,88.57,88.94,89.59,90.0,90.12,90.34,90.84,91.1,91.44,91.79,91.92,92.84,93.22,93.72],
      },
      {
        s: 'A',
        t: "You're absolutely right. It is great when the weather is bad outside. So, we need to choose the two best activities for this centre. Shall we go with volleyball and table tennis?",
        vi: "Bạn hoàn toàn đúng. Nó rất tuyệt khi thời tiết bên ngoài xấu. Vậy, chúng ta cần chọn hai hoạt động tốt nhất cho trung tâm này. Mình chọn bóng chuyền và bóng bàn nhé?",
        at: [95.98, 110.14],
        w: [96.08,96.39,97.14,98.58,98.8,98.93,99.33,99.49,99.59,99.97,100.12,100.41,102.15,102.7,102.86,103.08,103.17,103.53,103.65,103.95,104.34,104.98,105.1,105.33,106.77,107.1,107.21,107.4,107.59,108.1,108.2,108.61],
      },
      {
        s: 'B',
        t: "Yes, I definitely agree with that. They are affordable, safe, and fun for all students. That's a great final decision!",
        vi: "Ừ, mình chắc chắn đồng ý với điều đó. Chúng có giá phải chăng, an toàn và vui cho tất cả học sinh. Đó là một quyết định cuối cùng tuyệt vời!",
        at: [110.78, 121.94],
        w: [110.89,111.57,111.84,112.51,112.84,112.99,114.45,114.67,114.79,115.54,116.21,116.49,116.91,117.09,117.39,119.13,119.43,119.52,119.91,120.35],
      },
    ],
    phrases: [
      { kind: 'ask', text: 'Shall I start first?', vi: 'Mình bắt đầu trước nhé?' },
      { kind: 'ask', text: 'how about', vi: '… thì sao? (đề xuất)' },
      { kind: 'agree', text: 'I agree with you to some extent', vi: 'Mình đồng ý với bạn ở một mức độ nào đó' },
      { kind: 'disagree', text: "However, I'm not really sure about", vi: 'Tuy nhiên, mình không chắc lắm về …' },
      { kind: 'ask', text: 'What do you think about', vi: 'Bạn nghĩ sao về …?' },
      { kind: 'disagree', text: 'I see what you mean, but', vi: 'Mình hiểu ý bạn, nhưng …' },
      { kind: 'ask', text: "Don't you think", vi: 'Bạn không nghĩ là … sao?' },
      { kind: 'disagree', text: "I'm afraid I disagree.", vi: 'Mình e là mình không đồng ý.' },
      { kind: 'ask', text: 'In my opinion,', vi: 'Theo mình, …' },
      { kind: 'agree', text: "That's a very good point!", vi: 'Ý đó rất hay!' },
      { kind: 'agree', text: 'I completely agree.', vi: 'Mình hoàn toàn đồng ý.' },
      { kind: 'agree', text: 'Exactly!', vi: 'Chính xác!' },
      { kind: 'ask', text: 'what about', vi: 'Còn … thì sao?' },
      { kind: 'agree', text: "You're absolutely right.", vi: 'Bạn hoàn toàn đúng.' },
      { kind: 'ask', text: 'Shall we go with', vi: 'Mình chọn … nhé?' },
      { kind: 'agree', text: 'Yes, I definitely agree with that.', vi: 'Ừ, mình chắc chắn đồng ý với điều đó.' },
    ],
    question: 'Which two activities do the students choose in the end?',
    options: ['mountain biking and rock climbing', 'surfing and sailing', 'volleyball and table tennis'],
    answer: 2,
    key: 'Shall we go with volleyball and table tennis? … Yes, I definitely agree with that.',
  },
]

export const LISTENING_SETS = [
  {
    id: 'u1-session3-part2',
    // unit chứa bộ bài nghe: trùng id, hoặc (nếu người dùng tự tạo lại unit)
    // tên khớp mẫu
    unitId: 'u1s2',
    unitMatch: /^\s*unit\s*1\b/i,
    name: 'Luyện nghe – Session 3',
    subtitle: 'Listening Part 2: Being at school (trang 7–12)',
    source: 'Session 3.pptx',
    exercises: U1_SESSION3_PART2,
  },
  {
    id: 'u2-wb03-part3',
    unitId: 'u2',
    unitMatch: /^\s*unit\s*2\b/i,
    name: 'Luyện nghe – Listening Part 3',
    subtitle: 'Westfield Sports Centre (bài nói của Susan Chapman)',
    source: 'COMPACT_PFS_WB_03.mp3',
    exercises: U2_WB03_PART3,
  },
  {
    id: 'u2-sp3-sports-centre',
    unitId: 'u2',
    unitMatch: /^\s*unit\s*2\b/i,
    name: 'Luyện nghe – Speaking Part 3',
    subtitle: 'Choosing activities for a sports centre: agreeing & disagreeing (trang 21)',
    source: "Student's Book Unit 2 trang 21 (audio giọng đọc AI)",
    exercises: U2_SP3_SPORTS_CENTRE,
  },
]

export function listeningSetsForUnit(unit) {
  if (!unit) return []
  return LISTENING_SETS.filter(
    (s) => s.unitId === unit.id || (s.unitMatch && s.unitMatch.test(unit.name || '')),
  )
}

export function findListeningSet(setId) {
  return LISTENING_SETS.find((s) => s.id === setId) || null
}

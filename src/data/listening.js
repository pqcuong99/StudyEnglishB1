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

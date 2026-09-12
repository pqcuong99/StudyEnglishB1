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

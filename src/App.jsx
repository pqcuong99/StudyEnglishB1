import { useEffect, useState } from 'react'
import { loadUnits, saveUnits } from './lib/storage.js'
import Home from './components/Home.jsx'
import CreateUnit from './components/CreateUnit.jsx'
import UnitDetail from './components/UnitDetail.jsx'
import Flashcards from './components/Flashcards.jsx'
import Quiz from './components/Quiz.jsx'
import WritingTest from './components/WritingTest.jsx'
import Settings from './components/Settings.jsx'
import Listening from './components/Listening.jsx'
import { findListeningSet, listeningSetsForUnit } from './data/listening.js'

// view shapes:
//   { name: 'home' }
//   { name: 'create' }
//   { name: 'unit', unitId }
//   { name: 'flashcards', deck, pool, title }   deck/pool = [{unitId, wordId}]
//   { name: 'quiz', deck, pool, title }
//   { name: 'writing', deck, pool, title }
//   { name: 'listening', setId, unitId }     bài luyện nghe (điền từ vào script)
//   pool = toàn bộ từ của phần gốc (để "xáo trộn làm lại" phủ hết cả phần)
export default function App() {
  const [units, setUnits] = useState(loadUnits)
  const [view, setView] = useState({ name: 'home' })

  useEffect(() => {
    saveUnits(units)
  }, [units])

  function addUnit(unit) {
    setUnits((us) => [...us, unit])
    setView({ name: 'unit', unitId: unit.id })
  }

  function appendWords(unitId, words) {
    setUnits((us) => us.map((u) => (u.id !== unitId ? u : { ...u, words: [...u.words, ...words] })))
    setView({ name: 'unit', unitId })
  }

  function deleteUnit(unitId) {
    setUnits((us) => us.filter((u) => u.id !== unitId))
    setView({ name: 'home' })
  }

  function updateWord(unitId, wordId, patch) {
    setUnits((us) =>
      us.map((u) =>
        u.id !== unitId
          ? u
          : { ...u, words: u.words.map((w) => (w.id !== wordId ? w : { ...w, ...patch })) },
      ),
    )
  }

  function deleteWord(unitId, wordId) {
    setUnits((us) =>
      us.map((u) =>
        u.id !== unitId ? u : { ...u, words: u.words.filter((w) => w.id !== wordId) },
      ),
    )
  }

  function renameUnit(unitId, name) {
    setUnits((us) => us.map((u) => (u.id !== unitId ? u : { ...u, name })))
  }

  // Build a study deck: list of {unitId, word} resolved live from state
  function resolveDeck(deck) {
    const byUnit = new Map(units.map((u) => [u.id, u]))
    return deck
      .map(({ unitId, wordId }) => {
        const u = byUnit.get(unitId)
        const w = u?.words.find((w) => w.id === wordId)
        return w ? { unitId, word: w } : null
      })
      .filter(Boolean)
  }

  // `pool` = toàn bộ từ của "phần đang học" (unit/phần gốc). Nó đi kèm suốt các
  // bước con (học lại từ sai, kiểm tra lại...) để nút "xáo trộn làm lại" có thể
  // kiểm tra lại TẤT CẢ các từ trong phần đó, chứ không chỉ nhóm nhỏ đang mở.
  // Nếu không truyền pool thì mặc định lấy chính danh sách từ đang học.
  const toDeck = (items) => items.map(({ unitId, word }) => ({ unitId, wordId: word.id }))

  function startFlashcards(items, title, pool) {
    setView({ name: 'flashcards', deck: toDeck(items), pool: toDeck(pool ?? items), title })
  }

  function startQuiz(items, title, pool) {
    setView({ name: 'quiz', deck: toDeck(items), pool: toDeck(pool ?? items), title })
  }

  function startWriting(items, title, pool) {
    setView({ name: 'writing', deck: toDeck(items), pool: toDeck(pool ?? items), title })
  }

  const goHome = () => setView({ name: 'home' })

  return (
    <div className="app">
      {view.name === 'home' && (
        <Home
          units={units}
          onCreate={() => setView({ name: 'create' })}
          onOpenUnit={(unitId) => setView({ name: 'unit', unitId })}
          onStartFlashcards={startFlashcards}
          onStartQuiz={startQuiz}
          onStartWriting={startWriting}
          onOpenSettings={() => setView({ name: 'settings' })}
        />
      )}
      {view.name === 'settings' && <Settings onBack={goHome} />}
      {view.name === 'create' && (
        <CreateUnit
          onSave={addUnit}
          onAppend={appendWords}
          appendTo={view.appendTo ? units.find((u) => u.id === view.appendTo) : null}
          onCancel={view.appendTo ? () => setView({ name: 'unit', unitId: view.appendTo }) : goHome}
        />
      )}
      {view.name === 'unit' && (
        <UnitDetail
          unit={units.find((u) => u.id === view.unitId)}
          onBack={goHome}
          onDeleteUnit={deleteUnit}
          onDeleteWord={deleteWord}
          onUpdateWord={updateWord}
          onRename={renameUnit}
          onStartFlashcards={startFlashcards}
          onStartQuiz={startQuiz}
          onStartWriting={startWriting}
          onImportMore={() => setView({ name: 'create', appendTo: view.unitId })}
          listeningSets={listeningSetsForUnit(units.find((u) => u.id === view.unitId))}
          onOpenListening={(set) => setView({ name: 'listening', setId: set.id, unitId: view.unitId })}
        />
      )}
      {view.name === 'listening' && (
        <Listening
          set={findListeningSet(view.setId)}
          onExit={() => setView({ name: 'unit', unitId: view.unitId })}
        />
      )}
      {view.name === 'flashcards' && (
        <Flashcards
          items={resolveDeck(view.deck)}
          pool={view.pool ? resolveDeck(view.pool) : undefined}
          title={view.title}
          onUpdateWord={updateWord}
          onExit={goHome}
          onStartQuiz={startQuiz}
          onStartWriting={startWriting}
          onRestart={(items, title, pool) => startFlashcards(items, title, pool)}
        />
      )}
      {view.name === 'quiz' && (
        <Quiz
          items={resolveDeck(view.deck)}
          pool={view.pool ? resolveDeck(view.pool) : undefined}
          title={view.title}
          onUpdateWord={updateWord}
          onExit={goHome}
          onStartFlashcards={startFlashcards}
          onStartWriting={startWriting}
        />
      )}
      {view.name === 'writing' && (
        <WritingTest
          items={resolveDeck(view.deck)}
          pool={view.pool ? resolveDeck(view.pool) : undefined}
          title={view.title}
          onUpdateWord={updateWord}
          onExit={goHome}
          onStartFlashcards={startFlashcards}
          onStartQuiz={startQuiz}
        />
      )}
    </div>
  )
}

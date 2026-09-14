import { useRef, useState } from 'react'
import { parseVocabText } from '../lib/parser.js'
import { extractPdfText } from '../lib/pdf.js'
import { newId } from '../lib/storage.js'
import { randomSeed } from '../lib/image.js'

export default function CreateUnit({ onSave, onCancel }) {
  const [unitName, setUnitName] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  function applyParsed(text, fallbackName) {
    const { words, suggestedName } = parseVocabText(text)
    if (words.length === 0) {
      setStatus(
        '⚠️ Không nhận diện được từ nào. Hãy kiểm tra định dạng: mỗi dòng dạng "từ (loại từ) /phiên âm/: nghĩa". Bạn cũng có thể thêm từ thủ công bên dưới.',
      )
    } else {
      setStatus(`✅ Đã nhận diện ${words.length} từ. Kiểm tra lại bảng bên dưới rồi bấm Lưu.`)
    }
    setRows((prev) => [...prev, ...words])
    if (!unitName) setUnitName(suggestedName || fallbackName || '')
  }

  async function handleFile(file) {
    if (!file) return
    setStatus('⏳ Đang đọc file...')
    try {
      let text
      if (file.name.toLowerCase().endsWith('.pdf')) {
        text = await extractPdfText(file)
      } else {
        text = await file.text()
      }
      applyParsed(text, file.name.replace(/\.(pdf|txt)$/i, ''))
    } catch (err) {
      console.error(err)
      setStatus('❌ Không đọc được file này: ' + err.message)
    }
  }

  function handlePaste() {
    if (!pasteText.trim()) return
    applyParsed(pasteText)
    setPasteText('')
  }

  function updateRow(i, field, value) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }

  function removeRow(i) {
    setRows((rs) => rs.filter((_, idx) => idx !== i))
  }

  function addEmptyRow() {
    setRows((rs) => [...rs, { word: '', pos: '', ipa: '', meaning: '' }])
  }

  function save() {
    const words = rows
      .filter((r) => r.word.trim() && r.meaning.trim())
      .map((r) => ({
        id: newId(),
        word: r.word.trim(),
        pos: r.pos.trim(),
        ipa: r.ipa.trim(),
        meaning: r.meaning.trim(),
        seed: randomSeed(),
        known: false,
      }))
    if (words.length === 0) {
      setStatus('⚠️ Chưa có từ nào hợp lệ để lưu (cần ít nhất Từ + Nghĩa).')
      return
    }
    onSave({
      id: newId(),
      name: unitName.trim() || 'Unit chưa đặt tên',
      createdAt: Date.now(),
      words,
    })
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={onCancel}>
          ← Quay lại
        </button>
        <h1>Tạo Unit mới</h1>
      </header>

      <div className="card">
        <label className="field-label">Tên Unit</label>
        <input
          className="input"
          placeholder="VD: Unit 1 – Session 2: Giving personal information"
          value={unitName}
          onChange={(e) => setUnitName(e.target.value)}
        />
      </div>

      <div className="card">
        <label className="field-label">Import file từ vựng (PDF hoặc TXT)</label>
        <div
          className={`dropzone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files[0])
          }}
        >
          📄 Kéo thả file vào đây hoặc <u>bấm để chọn file</u>
          <div className="hint">Hỗ trợ file PDF từ vựng của khóa học (dạng: từ (loại) /phiên âm/: nghĩa)</div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt"
          hidden
          onChange={(e) => {
            handleFile(e.target.files[0])
            e.target.value = ''
          }}
        />

        <label className="field-label" style={{ marginTop: 16 }}>
          Hoặc dán danh sách từ vào đây
        </label>
        <textarea
          className="input textarea"
          rows={5}
          placeholder={'prefer (v) /prɪˈfɜːr/: thích hơn\narticle (n) /ˈɑːtɪkl/: bài báo, bài viết'}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <button className="btn btn-outline" onClick={handlePaste} disabled={!pasteText.trim()}>
          Nhận diện từ đã dán
        </button>
      </div>

      {status && <div className="status card">{status}</div>}

      {rows.length > 0 && (
        <div className="card">
          <h3>Danh sách từ ({rows.length})</h3>
          <p className="hint">
            Bạn có thể sửa trực tiếp trong bảng. Ảnh minh họa AI sẽ được tự động tạo cho từng từ
            sau khi lưu.
          </p>
          <div className="table-wrap">
            <table className="word-table">
              <thead>
                <tr>
                  <th>Từ</th>
                  <th>Loại</th>
                  <th>Phiên âm</th>
                  <th>Nghĩa</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        className="input input-sm"
                        value={r.word}
                        onChange={(e) => updateRow(i, 'word', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input input-sm input-pos"
                        value={r.pos}
                        onChange={(e) => updateRow(i, 'pos', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input input-sm"
                        value={r.ipa}
                        onChange={(e) => updateRow(i, 'ipa', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input input-sm"
                        value={r.meaning}
                        onChange={(e) => updateRow(i, 'meaning', e.target.value)}
                      />
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeRow(i)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-ghost" onClick={addEmptyRow}>
            ＋ Thêm từ thủ công
          </button>
        </div>
      )}

      {rows.length === 0 && (
        <div className="card">
          <button className="btn btn-ghost" onClick={addEmptyRow}>
            ＋ Hoặc thêm từ thủ công
          </button>
        </div>
      )}

      <div className="btn-row sticky-actions">
        <button className="btn btn-primary btn-lg" onClick={save} disabled={rows.length === 0}>
          💾 Lưu Unit (
          {rows.filter((r) => r.word.trim() && r.meaning.trim()).length} từ)
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>
          Hủy
        </button>
      </div>
    </div>
  )
}

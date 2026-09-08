import { useState } from 'react'
import { getSettings, saveSettings } from '../lib/settings.js'
import { clearImageCache } from '../lib/imagedb.js'

export default function Settings({ onBack }) {
  const [s, setS] = useState(getSettings)
  const [saved, setSaved] = useState(false)
  const [cleared, setCleared] = useState(false)

  function update(patch) {
    setS((old) => ({ ...old, ...patch }))
    setSaved(false)
  }

  function save() {
    saveSettings(s)
    setSaved(true)
  }

  return (
    <div className="page study-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Quay lại
        </button>
        <h1>⚙️ Cài đặt ảnh AI</h1>
      </header>

      <div className="card">
        <p className="hint" style={{ marginTop: 0 }}>
          Dán API key của bạn để app tự tạo ảnh minh họa đúng nghĩa cho từ mới (app sẽ gửi cả
          nghĩa tiếng Việt vào prompt). Mỗi từ chỉ tạo <b>1 lần</b> rồi lưu lại trong máy. Key
          chỉ lưu trong trình duyệt của bạn và chỉ gửi thẳng đến Google/OpenAI.
        </p>

        <label className="field-label">🔷 Gemini API key (khuyên dùng — có hạn mức miễn phí)</label>
        <input
          className="input"
          type="password"
          placeholder="AIza..."
          value={s.geminiKey}
          onChange={(e) => update({ geminiKey: e.target.value.trim() })}
        />
        <div className="hint">
          Lấy key miễn phí tại <b>aistudio.google.com/apikey</b>. App dùng model
          gemini-2.5-flash-image.
        </div>

        <label className="field-label" style={{ marginTop: 18 }}>
          🟢 OpenAI API key
        </label>
        <input
          className="input"
          type="password"
          placeholder="sk-..."
          value={s.openaiKey}
          onChange={(e) => update({ openaiKey: e.target.value.trim() })}
        />
        <div className="hint">
          Lưu ý: gói ChatGPT Plus/Pro <b>không bao gồm</b> API — cần nạp credit riêng tại
          <b> platform.openai.com</b> (~$0.02–0.04/ảnh). App dùng gpt-image-1, tự chuyển sang
          DALL-E 3 nếu cần.
        </div>

        <label className="field-label" style={{ marginTop: 18 }}>
          Ưu tiên dùng
        </label>
        <div className="btn-row" style={{ marginTop: 4 }}>
          {[
            ['auto', 'Tự động'],
            ['gemini', 'Gemini'],
            ['openai', 'OpenAI'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`btn btn-sm ${s.provider === value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => update({ provider: value })}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn btn-primary btn-lg" onClick={save}>
            💾 Lưu cài đặt
          </button>
          {saved && <span className="ok-note">✅ Đã lưu!</span>}
        </div>
      </div>

      <div className="card">
        <p className="hint" style={{ marginTop: 0 }}>
          Nếu muốn tạo lại toàn bộ ảnh (ví dụ sau khi đổi nhà cung cấp), xóa cache rồi mở lại
          unit — ảnh sẽ được tạo mới. Ảnh của từng từ cũng có nút 🔄 riêng trong trang unit.
        </p>
        <button
          className="btn btn-danger-outline"
          onClick={async () => {
            if (confirm('Xóa toàn bộ ảnh AI đã tạo và cache?')) {
              await clearImageCache()
              setCleared(true)
            }
          }}
        >
          🗑️ Xóa cache ảnh đã tạo
        </button>
        {cleared && <span className="ok-note"> ✅ Đã xóa.</span>}
      </div>

      <div className="card">
        <p className="hint" style={{ margin: 0 }}>
          Không có API key? Không sao — app vẫn dùng bộ ảnh vẽ sẵn cho các từ đã có, và
          Pollinations.ai (miễn phí) cho các từ còn lại.
        </p>
      </div>
    </div>
  )
}

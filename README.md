# 📚 Học Từ Vựng B1

App học từ vựng tiếng Anh theo unit, xây dựng bằng ReactJS + Vite.

## Chạy app

```bash
npm install
npm run dev
```

Rồi mở trình duyệt tại **http://localhost:5173**

## Tính năng

- **Tạo Unit**: import file PDF từ vựng của khóa học (dạng `từ (loại từ) /phiên âm/: nghĩa`),
  hoặc dán danh sách từ, hoặc thêm thủ công. App tự nhận diện từ, loại từ, phiên âm IPA, nghĩa
  và tự gợi ý tên unit.
- **Ảnh minh họa**: thứ tự ưu tiên cho mỗi từ:
  1. Ảnh AI tạo bằng **API key của bạn** (nếu đã cài trong ⚙️ Cài đặt) — cache trong máy,
     mỗi từ chỉ tốn 1 lần gọi API. Hỗ trợ **Gemini** (`gemini-2.5-flash-image`, có hạn mức
     miễn phí tại aistudio.google.com) và **OpenAI** (gpt-image-1 / DALL-E 3, tính phí).
  2. Bộ **ảnh SVG vẽ sẵn** đóng gói trong app (`src/assets/words/`) — hiện có đủ 51 từ của
     Unit 1 (Session 2, Session 3 và vở ghi). Muốn thêm ảnh cho từ mới: nhờ Claude vẽ thêm
     file SVG vào thư mục đó (tên file = từ viết thường, khoảng trắng thành `-`, ví dụ
     `be-keen-on.svg`).
  3. Pollinations.ai (AI miễn phí, không cần key) cho các từ còn lại.
  Bấm 🔄 trên ảnh (trang unit) để tạo ảnh khác.
- **Học flashcard**: lật thẻ xem nghĩa + phiên âm, nghe phát âm (🔊), tự đánh dấu
  ✅ đã thuộc / ❌ chưa thuộc. Phím tắt: `Space` lật thẻ, `1` chưa thuộc, `2` đã thuộc.
- **Kiểm tra lại**: trắc nghiệm 2 chiều (từ → nghĩa và nghĩa → từ). Trả lời sai thì từ đó
  tự chuyển về "chưa thuộc" và có nút học lại ngay các từ sai.
- **Kiểm tra viết (✍️)**: hiện nghĩa tiếng Việt, bạn gõ từ tiếng Anh đúng chính tả.
  Có nút 💡 gợi ý chữ cái đầu + số ký tự. Nhấn `Enter` để kiểm tra / sang câu tiếp theo.
  Viết sai thì từ tự chuyển về "chưa thuộc" như phần trắc nghiệm.
- **Học ngẫu nhiên**: trộn từ của tất cả các unit, hoặc chỉ học các từ chưa thuộc.

## Dữ liệu có sẵn

- **Unit 1: All About Me** (51 từ) được nạp sẵn từ `src/data/seedUnits.js`: 25 từ của
  `NC_U1_Session 2.pdf`, 13 từ của `NC_U1_Session 3.pdf` và 13 từ ghi trên lớp.
- Muốn thêm từ vào unit có sẵn cho mọi trình duyệt đã dùng app: thêm một nhóm từ mới vào
  `seedUnits.js` với `version` mới và tăng `SEED_VERSION`. Khi mở app, các từ mới sẽ tự được
  nối vào unit đã lưu (giữ nguyên tiến độ đã học, không thêm lại từ đã có).

## Lưu ý

- Dữ liệu lưu trong trình duyệt (localStorage) — dùng cùng một trình duyệt để giữ tiến độ học.
- Ảnh AI cần mạng internet và được tạo lần lượt từng ảnh (lần đầu hơi chậm, sau đó có cache).
- Phát âm dùng giọng đọc tiếng Anh có sẵn của trình duyệt.

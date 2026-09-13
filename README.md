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
- **Đăng nhập bằng tên (👤)**: lần đầu mở app trên một trình duyệt sẽ hỏi tên. Tiến độ (từ đã
  thuộc, thống kê từ hay sai, bài nghe đã làm, unit tự tạo) được lưu **trên máy chủ theo tên**
  đó, nên cùng tên ở máy/điện thoại khác vẫn thấy tiến độ. Tên được nhớ trong trình duyệt để lần
  sau vào thẳng; nút "Đổi người dùng" ở trang chủ để đăng nhập tên khác. Không phân biệt hoa/thường.
  Nếu mất kết nối máy chủ, app vẫn học tiếp bằng bản đệm trong trình duyệt và tự đồng bộ lại khi
  kết nối được (huy hiệu ☁️ Đã lưu / ⏳ Đang lưu / ⚠️ Chưa lưu được ở trang chủ). Dữ liệu của
  bản cũ (trước khi có đăng nhập) được chuyển sang cho người đầu tiên đăng nhập trên trình duyệt đó.
- **Từ hay sai (🔥)**: mỗi câu trả lời trong trắc nghiệm / kiểm tra viết được ghi lại theo từng từ
  (số lần sai, số lần đúng, chuỗi đúng liên tiếp). Từ sai từ **2 lần** trở lên vào nhóm "Từ hay
  sai" ở trang chủ (kèm nút ôn flashcard / kiểm tra / viết riêng nhóm này, nhãn 🔥 trên thẻ từ).
  **🎲 Kiểm tra ngẫu nhiên** dành ~40% đề cho nhóm này. Trả lời đúng **3 lần liên tiếp** thì từ tự
  rời khỏi nhóm; sai lại thì quay vào. Ngưỡng chỉnh ở `src/lib/wordStats.js`.
- **Luyện nghe (🎧)**: trong trang unit có khối "Luyện nghe" gồm các bài nghe ngắn kèm
  recording script. Mỗi bài: nghe audio (có nút nghe lại từ đầu, lùi 5 giây, nghe chậm 0.75x),
  điền các từ bị **ẩn ngẫu nhiên** trong script rồi bấm **Nộp bài**. Ba mức độ: 🌱 Dễ (ẩn 5 từ),
  🌿 Trung bình (7 từ), 🌳 Khó (10 từ, có cả dạng rút gọn như `wasn't`). Mỗi lần làm lại ẩn
  các từ khác nhau. Từ sai được đánh dấu đỏ kèm đáp án; có nút 💡 gợi ý từng chữ cái, nút "sửa
  lại các từ sai", "làm lại bài này" và "bài tiếp theo". Điền đúng hết sẽ được chúc mừng và hỏi
  muốn làm lại hay sang bài kế. Kèm câu hỏi trắc nghiệm A/B/C của đề thi (tùy chọn) và câu chứa
  đáp án. Tiến độ (đã hoàn thành ở mức nào) lưu trong trình duyệt.

## Dữ liệu có sẵn

- **Unit 1: All About Me** (51 từ) được nạp sẵn từ `src/data/seedUnits.js`, chia làm 2 phần:
  **Phần 1 – Session 2** (25 từ của `NC_U1_Session 2.pdf`) và **Phần 2 – Session 3 & vở ghi**
  (13 từ của `NC_U1_Session 3.pdf` + 13 từ ghi trên lớp).
- **Luyện nghe – Session 3** (Unit 1): 6 bài Listening Part 2 "Being at school" lấy từ
  `Session 3.pptx` (audio ở trang 6, script + câu hỏi ở trang 7–12). File audio gốc được tách
  theo các khoảng lặng 5 giây thành 6 file `src/assets/listening/u1-session3-part2-q1..6.mp3`;
  script, câu hỏi và đáp án nằm trong `src/data/listening.js`. Muốn thêm bộ bài nghe mới: thêm
  một phần tử vào `LISTENING_SETS` (gắn với unit qua `unitId` hoặc `unitMatch`) và đặt file
  mp3 vào thư mục trên. Thuật toán chọn từ để ẩn nằm trong `src/lib/cloze.js` (bỏ qua từ chức
  năng, tên riêng, không ẩn hai từ liền nhau, rải đều giữa các câu).
- **Phần trong unit**: mỗi từ có thể mang tên phần (`section`). Mở một unit có chia phần sẽ
  thấy khối "Cả unit" (thống kê + nút học toàn bộ unit + Import) ở trên, bên dưới là màn
  **Chọn phần**: mỗi phần là một thẻ có thống kê, thanh tiến độ và nút học flashcard / từ chưa
  thuộc / kiểm tra / kiểm tra viết riêng; bấm vào thẻ để xem danh sách từ của phần đó. Khi "Import thêm từ",
  có ô nhập tên phần (mặc định "Phần N+1"; để trống nếu không muốn chia phần). Unit không chia
  phần hiển thị danh sách từ phẳng như cũ.
- Muốn thêm từ vào unit có sẵn cho mọi trình duyệt đã dùng app: thêm một nhóm từ mới vào
  `seedUnits.js` với `version` mới và tăng `SEED_VERSION`. Khi mở app, các từ mới sẽ tự được
  nối vào unit đã lưu (giữ nguyên tiến độ đã học, không thêm lại từ đã có).

## Máy chủ lưu tiến độ (server/)

Tiến độ của mỗi người dùng do `server/index.js` quản lý — một API nhỏ viết bằng Node thuần
(không cần `npm install`), mỗi người một file JSON trong `server/data/users/` (thư mục này
không đưa lên git — nhớ **backup** khi chuyển VPS). Log ở `server/data/api.log`.

Mặc định trang web gọi API ở **cùng địa chỉ với trang, cổng 37390** (trang ở
`http://103.249.117.233:37389` thì API là `http://103.249.117.233:37390`). Muốn đổi địa chỉ:
đặt biến `VITE_API_BASE=http://host:port` khi `npm run build`; đổi cổng API bằng biến môi
trường `PORT` (và sửa cổng trong `server/install-api.ps1`).

**Cài trên VPS Windows (làm một lần):**

1. Cài Node.js (từ bản 16 trở lên) — https://nodejs.org. **Windows Server 2012 R2 / 8.1** chỉ
   chạy được Node 16: tải `node-v16.x.x-x64.msi` tại https://nodejs.org/dist/latest-v16.x/.
   Kiểm tra bằng cách mở cmd mới gõ `node -v`.
2. Trong thư mục repo trên VPS, chuột phải `server\install-api.bat` → **Run as administrator**.
   Script tạo tác vụ `StudyEnglishB1-API` tự chạy khi Windows khởi động (tự khởi động lại nếu
   lỗi), mở cổng 37390 trên Windows Firewall rồi chạy API ngay.
3. Kiểm tra: mở `http://103.249.117.233:37390/api/health` → thấy `{"ok":true,...}`. Nếu không vào
   được từ ngoài, kiểm tra thêm firewall của nhà cung cấp VPS (security group) đã mở cổng 37390.
4. Các lần cập nhật sau chỉ cần chạy `update-vps.bat` như cũ — script đã tự khởi động lại API.
   Khởi động lại thủ công: `server\restart-api.bat`.

Chạy thử ở máy dev: `node server/index.js` (cổng 37390) song song với `npm run dev`.

Endpoints: `GET /api/health`, `GET /api/users`, `GET|PUT /api/users/:tên`.

## Lưu ý

- Tiến độ lưu trên máy chủ theo tên đăng nhập (xem mục *Máy chủ lưu tiến độ*); cài đặt API key
  ảnh AI và cache ảnh vẫn nằm riêng trong từng trình duyệt.
- Ảnh AI cần mạng internet và được tạo lần lượt từng ảnh (lần đầu hơi chậm, sau đó có cache).
- Phát âm dùng giọng đọc tiếng Anh có sẵn của trình duyệt.

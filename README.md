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
  Mặt sau thẻ có thêm **một câu ví dụ đơn giản** dùng từ đó (kèm nghĩa tiếng Việt của câu và
  nút 🔊 đọc cả câu). Câu ví dụ của các từ có sẵn nằm trong `src/data/examples.js`, tra theo
  chữ của từ nên không cần cập nhật dữ liệu đã lưu; muốn thêm ví dụ cho từ mới thì thêm dòng
  `[từ, câu tiếng Anh, nghĩa câu]` vào đó (từ tự tạo cũng có thể mang sẵn `example` /
  `exampleVi`). Từ chưa có ví dụ thì mặt sau hiển thị như cũ.
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
- **Bảng điều khiển quản trị (🛡️)**: ở màn nhập tên, gõ **`admin`** (không phân biệt hoa/thường)
  thì hiện thêm ô mật khẩu; mật khẩu do máy chủ kiểm tra (`ADMIN_PASSWORD` trong
  `server/index.js`, đổi bằng biến môi trường cùng tên). Đúng mật khẩu thì vào **bảng điều
  khiển** thay vì màn học: số người học, ai học hôm nay / 7 ngày qua, biểu đồ lượt học 30 ngày,
  bảng tiến độ từng người (từ đã thuộc, tỉ lệ trả lời đúng, từ hay sai, bài nghe, hoạt động gần
  nhất — bấm vào một dòng để xem chi tiết theo unit / phần, từ hay sai, bài nghe, 14 ngày gần nhất)
  và **báo cáo theo ngày / theo tháng** (ai học, bao nhiêu câu, tỉ lệ đúng, từ mới thuộc, thẻ đã ôn,
  bài nghe). Tài khoản này chỉ xem, không có tiến độ học; tên `admin` không đăng ký học được.
  Phiên quản trị nhớ theo tab (F5 vẫn ở lại, đóng tab là phải nhập lại mật khẩu), hết hạn sau 12 giờ
  hoặc khi API khởi động lại. Báo cáo theo ngày lấy từ **nhật ký hoạt động** (`activity` trong dữ
  liệu mỗi người, xem `src/lib/activity.js`): số câu trả lời / đúng, thẻ đã đánh dấu, từ chuyển sang
  đã thuộc, bài nghe đã nộp — tính theo ngày giờ máy người học, chỉ có từ khi cập nhật này trở đi.
- **Từ hay sai (🔥)**: mỗi câu trả lời trong trắc nghiệm / kiểm tra viết được ghi lại theo từng từ
  (số lần sai, số lần đúng, chuỗi đúng liên tiếp). Từ sai từ **2 lần** trở lên được coi là "hay
  sai": trang chủ chỉ hiện số lượng (🔥 Hay sai: N, rê chuột xem giải thích), thẻ từ trong trang unit
  mang nhãn 🔥. Không có khối ôn riêng — thay vào đó **🎲 Kiểm tra ngẫu nhiên** dành ~40% đề cho
  nhóm này (ít từ hay sai thì chúng luôn có mặt trong đề). Trả lời đúng **3 lần liên tiếp** thì từ
  tự rời khỏi nhóm; sai lại thì quay vào. Ngưỡng chỉnh ở `src/lib/wordStats.js`.
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
  thấy khối "Cả unit" (thống kê + nút học toàn bộ unit) ở trên, bên dưới là màn
  **Chọn phần**: mỗi phần là một thẻ có thống kê, thanh tiến độ và nút học flashcard / từ chưa
  thuộc / kiểm tra / kiểm tra viết riêng; bấm vào thẻ để xem danh sách từ của phần đó. Unit không
  chia phần hiển thị danh sách từ phẳng như cũ. Tên phần chỉ đến từ dữ liệu mẫu (`seedUnits.js`);
  unit tự tạo không chia phần.
- Muốn thêm từ vào unit có sẵn (cách duy nhất, vì trang unit không còn nút "Import thêm từ"): thêm một nhóm từ mới vào
  `seedUnits.js` với `version` mới và tăng `SEED_VERSION`. Khi mở app, các từ mới sẽ tự được
  nối vào unit đã lưu (giữ nguyên tiến độ đã học, không thêm lại từ đã có).

## Máy chủ lưu tiến độ (server/)

Tiến độ của mỗi người dùng do `server/index.js` quản lý — một API nhỏ viết bằng Node thuần
(không cần `npm install`), mỗi người một file JSON trong `server/data/users/` (thư mục này
không đưa lên git — nhớ **backup** khi chuyển VPS). Log ở `server/data/api.log`.

Trang web gọi API ở **cùng địa chỉ với chính nó** (`/api/...`): trên VPS, IIS chuyển tiếp
`/api/*` sang Node đang nghe ở `localhost:37390` (nhờ URL Rewrite + ARR, cài bằng
`server\install-proxy.bat`) — nên chỉ cần **một cổng công khai** (37389) như trước, không phải
nhờ nhà cung cấp mở thêm cổng. Ở máy dev, Vite proxy `/api` sang cổng 37390 (`vite.config.js`).
Muốn gọi thẳng API ở địa chỉ khác: đặt `VITE_API_BASE=http://host:port` khi `npm run build`.
Đổi cổng API bằng biến môi trường `PORT` (và sửa cổng trong hai file `install-*.ps1`).

**Cài trên VPS Windows (làm một lần):**

1. Cài Node.js (từ bản 16 trở lên) — https://nodejs.org. **Windows Server 2012 R2 / 8.1** chỉ
   chạy được Node 16: tải `node-v16.x.x-x64.msi` tại https://nodejs.org/dist/latest-v16.x/.
   Kiểm tra bằng cách mở cmd mới gõ `node -v`.
2. Trong thư mục repo trên VPS, double-click `update-vps.bat` (script tự xin quyền Administrator).
   Lần đầu chưa có API, script tự gọi `server\install-api.ps1`: tạo tác vụ `StudyEnglishB1-API`
   tự chạy khi Windows khởi động (tự khởi động lại nếu lỗi), mở cổng 37390 trên Windows Firewall
   rồi chạy API ngay. (Cài riêng bằng tay: `server\install-api.bat` → Run as administrator.)
3. Chuột phải `server\install-proxy.bat` → **Run as administrator**: tự tải + cài IIS URL Rewrite
   2.1 và Application Request Routing 3.0, bật proxy, thêm rule chuyển tiếp `/api` cho site đang
   trỏ tới `dist` (nếu không tự tìm được site: `install-proxy.bat "Tên site"`), rồi tự kiểm tra
   GET/PUT qua IIS. Rule nằm trong `applicationHost.config`, không đụng `web.config` của `dist`.
   Nếu sau đó **cả trang trả 503** (IIS tự tắt app pool vì không nạp được module mới — bản
   URL Rewrite 2025 cần Universal CRT, Server 2012 R2 chưa vá thì thiếu): chạy `serverix-iis.bat`
   (Run as administrator) — gỡ tạm module lỗi để trang lên lại, cài VC++ Redistributable (kèm UCRT),
   gắn lại module và kiểm tra `/api`.
4. Kiểm tra từ máy ngoài: `http://103.249.117.233:37389/api/health` → thấy `{"ok":true,...}`.
5. Các lần cập nhật sau chỉ cần double-click `update-vps.bat` — script tự xin quyền admin rồi
   chạy `server\update-vps.ps1`: `git fetch` + `reset --hard origin/main` (bỏ mọi sửa đổi tại
   chỗ trên VPS — repo ở đó chỉ để chạy, `server\data` không bị đụng), restart IIS và khởi động
   lại API bằng code mới (chưa cài API thì tự cài).
   Khởi động lại thủ công: `server\restart-api.bat`. API không trả lời thì chạy
   `server\check-api.bat` (Run as administrator): in trạng thái tác vụ, `data\task.log` (lỗi khi
   Task Scheduler khởi động node), `data\api.log` và chạy thử trực tiếp để hiện lỗi.
   Node quá mới so với Windows (mã kết thúc 216, "not compatible with the version of Windows")
   → cài Node 16.

Chạy thử ở máy dev: `node server/index.js` (cổng 37390) song song với `npm run dev` (Vite tự proxy `/api`).

Endpoints: `GET /api/health`, `GET /api/users`, `GET|PUT /api/users/:tên`. Quản trị:
`POST /api/admin/login` (body `{ password }` → `{ token }`), rồi gửi header `X-Admin-Token` cho
`GET /api/admin/report` (dữ liệu mọi người học, đã lược bớt) và `POST /api/admin/logout`.

## Lưu ý

- Tiến độ lưu trên máy chủ theo tên đăng nhập (xem mục *Máy chủ lưu tiến độ*); cài đặt API key
  ảnh AI và cache ảnh vẫn nằm riêng trong từng trình duyệt.
- Ảnh AI cần mạng internet và được tạo lần lượt từng ảnh (lần đầu hơi chậm, sau đó có cache).
- Phát âm dùng giọng đọc tiếng Anh có sẵn của trình duyệt. Trả lời đúng (trắc nghiệm, kiểm tra
  viết, điền đúng hết bài nghe) có tiếng chuông "ting-ting" tạo bằng Web Audio (`src/lib/sound.js`,
  không cần file âm thanh); câu "từ tiếng Anh nào có nghĩa là" chọn đúng thì tự đọc từ đó và
  hiện nút 🔊 để nghe lại.

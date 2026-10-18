# 🧮 Ghi chú lệnh — Bé Học Toán (Mẫu giáo & Tiểu học lớp 1–5)

> Yêu cầu: **Node.js 18 trở lên** (kiểm tra bằng `node -v`). Mở terminal tại thư mục game: `D:\MyGame\behoctoan`.

---

## 1. Lệnh hay dùng

| Việc cần làm | Lệnh |
| --- | --- |
| **Kiểm tra câu hỏi** (validate 25.000 câu sinh thử) | `node tools/check-questions.js 500` |
| **Smoke-test toàn game** (cần `npm i jsdom --no-save` 1 lần) | `node tools/smoke-test.js` |
| **Làm mới cache offline** (chạy sau mỗi lần sửa file) | `node tools/gen-sw.js` |
| Kiểm tra cú pháp 1 file JS | `node --check js/games.js` |

> 🌐 Game chạy online/offline dạng **PWA** — xem mục 4. Hiệu ứng âm thanh sinh bằng Web Audio,
> **không có file mp3**. Riêng khối Mẫu giáo, máy **đọc câu hỏi lên** bằng giọng tiếng Việt có sẵn
> của thiết bị (Web Speech API, `js/voice.js`) — xem mục 2.1.

---

## 2. Luồng chơi

```
Chọn Bé (Trai/Gái)
   → Chọn Cách Học — 3 nhánh cùng cấp:
        🎓 THEO LỚP     → Chọn lớp 1–5 → Menu 11 chế độ → Chơi
        🎮 THEO CHẾ ĐỘ  → Menu 11 chế độ → Chọn mức Dễ/Vừa/Khó → Chơi
        🌟 MẪU GIÁO    → Menu riêng 6 chế độ (Nhận Biết Số · Cộng Trừ 0–10 ·
                          So Sánh Số · To · Dài · Cao · Hình Dạng · Tư Duy & Quy Luật)
   → Chơi: câu hỏi RANDOM VÔ HẠN (không giới hạn, không điểm tích lũy)
   → Bấm ⬅️ → Popup tổng kết: X đúng / Y câu + đánh giá → Chơi Tiếp / Thoát
```

- **Không có tiến độ, không có điểm tích luỹ** — bé thoải mái chơi đến khi muốn thoát.
- Chỉ có **hiệu ứng khi trả lời ĐÚNG** (pháo bông / trái tim + âm thanh Web Audio).
- Chế độ khoá theo lớp (vd. Phân số từ lớp 3) vẫn bấm được — tự mở ở mức nhỏ nhất.
- **Mẫu giáo (tiền tiểu học):** đếm hình 0–10, cộng/trừ trong phạm vi **0–10**, so sánh bằng
  **dấu `<` `=` `>`**, to/nhỏ · dài/ngắn · cao/thấp bằng mắt, tìm quy luật, phân loại đồ vật,
  nghe tên hình rồi chọn đúng hình vẽ.

### 2.1. Âm thanh đọc câu hỏi cho bé Mẫu giáo (bé chưa biết chữ)

| Thành phần | Nơi | Việc |
| --- | --- | --- |
| Giọng đọc | `js/voice.js` (`Voice`) | Đọc tiếng Việt bằng Web Speech API — ưu tiên giọng `vi-VN` của máy |
| Câu đọc | `q.say` trong `js/data.js` (hàm `makeQ(html, choices, prompt, say)`) | Lời đọc: "Ba cộng năm bằng bao nhiêu?"… Mặc định = `prompt` |
| Nút 🔊 Nghe lại | `js/games.js` | Hiện trong câu hỏi khi bé học Mẫu giáo (cấp 0) |
| Nút 🔊/🔇 trên thanh chơi | `index.html` + `js/main.js` (`updateVoiceBtn`) | Bật/tắt đọc, nhớ trong `localStorage` (`mt.voice`) |

Quy tắc bắt buộc cho **mọi câu ở cấp 0** (được `tools/check-questions.js` kiểm tự động):

1. **Luôn có `say`** — bé nghe chứ không cần đọc.
2. **Đáp án không có chữ tiếng Việt** — chỉ là hình vẽ (SVG), emoji, chữ số hoặc dấu `<` `=` `>`.
3. Câu so sánh phải **khớp dấu với hình**: bên trái lớn hơn → `>`, nhỏ hơn → `<`, bằng → `=`
   (miệng dấu mở về phía lớn hơn, đúng quy ước lớp 1).

> Máy không có giọng tiếng Việt thì game vẫn chạy bình thường, bé nhìn hình để chơi.
> Trong trình duyệt, âm thanh chỉ phát sau khi người dùng đã bấm (lần bấm vào chế độ chính là "mở khoá").
> Mỗi câu chỉ được đọc **một lần** cho mỗi lần nghe — không đọc đáp án.

---

## 3. Sửa thường gặp

### 3.1. Thêm / sửa câu hỏi
Mọi câu sinh **random** trong `js/data.js`, hàm `QUESTIONS.<mode>(grade)`:

```js
QUESTIONS.calc = function (g) {   // g = 0 (mẫu giáo) đến 5
  ...
  return makeQ(html, numChoices(ans, min, hi), "Câu hỏi hiển thị", "Câu đọc cho bé (tuỳ chọn)");
}
```

- `numChoices(ans, min, hi)` → 4 lựa chọn số quanh đáp án (`hi` = giới hạn trên, vd. `10` cho mẫu giáo).
- `strChoices(đúng, pool)` → 4 lựa chọn chuỗi.
- Tham số thứ 4 `say` = lời đọc cho bé Mẫu giáo (bỏ trống thì lấy `prompt`).
- Sửa xong **bắt buộc chạy**:
  ```powershell
  node tools/check-questions.js 500
  node tools/gen-sw.js
  ```

### 3.2. Thêm 1 chế độ mới
1. `index.html`: thêm thẻ `<button class="mode-card" data-mode="xxx">` vào `#mode-grid`.
2. `js/data.js`: thêm vào `MODES` `{ xxx: { name: "...", icon: "...", min: 3 } }` (min = lớp mở khoá).
3. `js/data.js`: viết `QUESTIONS.xxx = function (g) { ... }` (hỗ trợ cả `g = 0` nếu muốn hiện trong menu Mẫu giáo — rồi thêm `"xxx"` vào `PRESCHOOL_MODES`; nếu là chế độ chỉ dành cho Mẫu giáo thì thêm cả tên/icon vào `PRESCHOOL_INFO`, và ở cấp 0 **phải có `say` + đáp án không dùng chữ**).
4. Chạy `node tools/check-questions.js 500` → `node tools/gen-sw.js`.

### 3.3. Thêm emoji khen
1. `js/main.js` → `UI.praise`: thêm emoji vào mảng `set`.
2. `node tools/gen-sw.js`.

### 3.4. Sửa CSS / JS / HTML
```powershell
node tools/gen-sw.js
```
Rồi upload lại. *(Chỉ mở `index.html` trực tiếp trên máy thì không cần bước này.)*

### 3.5. Đổi icon hoặc tên app
- Icon: `assets/images/icon-32.png`, `icon-180.png`, `icon-192.png`, `icon-512.png`
- Tên app: `manifest.webmanifest` (`name`, `short_name`, `theme_color`)
- Sau đó: `node tools/gen-sw.js`

---

## 4. Xuất bản lên web / cài lên iPhone

```powershell
node tools/gen-sw.js
```

1. **Khuyến nghị: GitHub Pages** (miễn phí):
   - Mở repo trên github.com → **Settings → Pages** → **Build and deployment**:
     - Source: **Deploy from a branch**
     - Branch: **main** / **/ (root)** → bấm **Save**
   - Đợi ~1 phút → `https://<user>.github.io/behoctoan/`
   - Lần sửa code sau: **push lên GitHub là site tự cập nhật**.
   - Cách khác: kéo thả cả thư mục lên [app.netlify.com/drop](https://app.netlify.com/drop).
2. Trên iPhone mở bằng **Safari** → nút **Chia sẻ** → **Thêm vào Màn hình chính**.
3. Mở từ màn hình chính: chạy toàn màn hình như app và **chơi được offline**.

**Cập nhật bản mới:** chạy `node tools/gen-sw.js` → upload lại → mở app lúc có mạng (có thể phải mở 2 lần) là tự nhận bản mới.

> Không thể copy thư mục vào iPhone rồi mở `file://` — service worker chỉ chạy trên HTTPS.

---

## 5. Kiểm tra nhanh trước khi phát hành

```powershell
node --check js/data.js; node --check js/audio.js; node --check js/voice.js; node --check js/games.js; node --check js/main.js; node --check js/pwa.js
node tools/check-questions.js 500
npm i jsdom --no-save     # lần đầu tiên thôi (cho smoke-test)
node tools/smoke-test.js
node tools/gen-sw.js
```

- [ ] Mở `index.html`, thử đủ các màn: Chọn Bé · Chọn Cách Học (3 nhánh) · Chọn Lớp · Menu · Popup chọn mức
- [ ] Luồng 🌟 Mẫu Giáo: vào thẳng menu **6 chế độ** (đúng thứ tự lộ trình), bấm mode là chơi ngay, **cộng/trừ trong 0–10**
- [ ] Câu Mẫu giáo: có nút **🔊 Nghe lại**, máy đọc câu hỏi, đáp án là hình/số/dấu (không có chữ), dấu `<` `=` `>` đúng hướng
- [ ] Lớp 1–5: **không** hiện nút đọc, âm thanh chỉ là hiệu ứng 🎉
- [ ] Chơi đủ **11 chế độ**: Sẵn Sàng Vào 1 · Học Số · Cộng & Trừ · So Sánh · Nhân & Chia · Phân Số · Số Thập Phân · Phần Trăm · Đo & Đo Lường · Hình Học · Toán Lời Văn
  *(Mẫu giáo có 6 chế độ riêng, gồm cả Đo lường ở mức "To · Dài · Cao")*
- [ ] Bấm ⬅️ khi đang chơi → popup tổng kết hiện **đúng/tổng + đánh giá**; **Chơi Tiếp** quay lại; **Thoát** về menu
- [ ] Chơi đúng → hiệu ứng 🎉 + âm thanh; chơi sai → chỉ rung nhẹ ❌ (không hiệu ứng lớn)
- [ ] Cả màn hình **dọc và ngang** đều **không bị cuộn** (mọi thứ nằm gọn 1 viewport)
- [ ] Tắt mạng → reload vẫn chơi được (đã chạy `gen-sw.js`)
- [ ] `node tools/check-questions.js` báo **0 lỗi**

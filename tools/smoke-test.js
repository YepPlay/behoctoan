/* Smoke-test toàn luồng bằng jsdom: chọn bé → cách học (Lớp/Chế Độ/Mẫu giáo/
   Bảng & Công Thức) → menu → chơi cả 11 chế độ → trả lời đúng/sai → popup tổng
   kết → thoát; riêng nhánh 📘 Bảng & Công Thức: học thuộc bảng 7 → kiểm tra →
   về lại màn tra cứu → tab công thức lớp 5.
   Lệnh: node tools/smoke-test.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
let fails = 0;
function ok(cond, label) {
  if (cond) console.log("  ✓ " + label);
  else { fails++; console.log("  ✗ " + label); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  /* ---- Nạp DOM ---- */
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8")
    .replace(/<script src="[^"]+"><\/script>/g, "");
  const dom = new JSDOM(html, {
    url: "http://localhost/behoctoan/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const document = window.document;

  /* Polyfill jsdom còn thiếu */
  window.ResizeObserver = class { observe() { } unobserve() { } disconnect() { } };

  /* Nạp JS: ghép THÀNH MỘT eval (trình duyệt thật thì các <script> chung global scope) */
  window.Audio = class { constructor(){this._src='';this.muted=false;this.volume=1;this.preload='auto'} play(){return Promise.resolve()} pause(){} load(){} get src(){return this._src} set src(v){this._src=v} };
  let code = ["js/voice-lines.js", "js/data.js", "js/audio.js", "js/voice.js", "js/games.js", "js/main.js"]
    .map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n;\n");
  code += `
;window.__t = { QUESTIONS: QUESTIONS, Game: Game, MODES: MODES, Voice: Voice, SHAPE_VOICE: SHAPE_VOICE };
Object.defineProperty(window, "__playCtx", { get: function () { return playCtx; } });
window.init = init;
`;
  window.eval(code);
  const ev = code => window.eval(code);
  const T = window.__t;
  const active = () => document.querySelector(".screen.active").id;

  console.log("\n[1] Khởi động");
  window.init();
  ok(active() === "screen-choose", "Mở màn Chọn Bé (sessionStorage trống)");

  console.log("\n[2] Luồng THEO LỚP");
  document.querySelector('.choose-card[data-theme="boy"]').click();
  ok(active() === "screen-way", "Chọn Bé Trai → màn Chọn Cách Học");
  document.querySelector('.choose-card[data-way="class"]').click();
  ok(active() === "screen-grade", "Chọn Theo Lớp → màn Chọn Lớp");
  document.querySelector('.grade-card[data-grade="3"]').click();
  ok(active() === "screen-menu", "Chọn lớp 3 → menu");
  ok(/Lớp 3/.test(document.querySelector("#menu-sub").textContent), "Tiêu đề menu hiện Lớp 3");
  ok(!document.querySelector('.mode-card[data-mode="frac"]').classList.contains("locked"),
    "Phân số (từ lớp 3) KHÔNG khoá");
  ok(document.querySelector('.mode-card[data-mode="pct"]').classList.contains("locked"),
    "Phần trăm (từ lớp 5) có khoá ở lớp 3");

  console.log("\n[3] Chơi Cộng & Trừ — trả lời đúng / sai");
  document.querySelector('.mode-card[data-mode="calc"]').click();
  ok(active() === "screen-play", "Vào màn chơi");
  let opts = document.querySelectorAll(".opt-btn");
  ok(opts.length >= 3 && opts.length <= 4, `Có ${opts.length} nút lựa chọn`);
  ok(document.querySelector("#play-area").innerHTML.indexOf("q-line") >= 0, "Câu hỏi hiển thị");

  /* Chơi lại đến khi nút ĐẦU TIÊN là sai (đáp án random — thử tối đa 8 lần) */
  let clickedWrong = false, s = null, totalBefore = 0, correctBefore = 0;
  for (let attempt = 0; attempt < 8 && !clickedWrong; attempt++) {
    T.Game.start("calc", 3, "Cộng & Trừ", "➕");
    totalBefore = T.Game.stats().total;
    correctBefore = T.Game.stats().correct;
    const b = document.querySelector(".opt-btn");
    b.click();
    if (b.classList.contains("bad")) clickedWrong = true;
  }
  ok(clickedWrong, "Bấm sai → nút bị ❌ rung, KHÔNG hiệu ứng đúng");
  s = T.Game.stats();
  ok(s.total === totalBefore + 1 && s.correct === correctBefore,
    `Sai: total=${s.total} (tăng 1), correct=${s.correct} (không tăng)`);

  /* Bấm tiếp đến đúng (các nút còn lại) */
  for (const b of document.querySelectorAll(".opt-btn")) {
    if (!b.disabled) b.click();
    if (b.classList.contains("good")) break;
  }
  ok(document.querySelector(".opt-btn.good") !== null, "Bấm tiếp đến đúng → nút 🟢");
  s = T.Game.stats();
  ok(s.total === totalBefore + 1 && s.correct === correctBefore, "Sửa lại đúng KHÔNG tính thêm (mỗi câu tính 1 lần)");

  await sleep(1250); /* chờ sinh câu kế */
  ok(document.querySelectorAll(".opt-btn").length >= 3, "Sinh câu mới sau khi đúng (vô hạn)");

  console.log("\n[4] Popup tổng kết");
  document.querySelector("#btn-back").click();
  ok(document.querySelector("#summary-popup").classList.contains("open"), "Bấm ⬅️ → popup tổng kết");
  const cnt = document.querySelector("#summary-correct").textContent + "/" +
    document.querySelector("#summary-total").textContent;
  ok(/\/1$/.test(cnt), `Hiện đúng/tổng = ${cnt}`);
  ok(document.querySelector("#summary-rating").textContent.length > 0, "Có đánh giá: " +
    document.querySelector("#summary-rating").textContent);
  document.querySelector("#btn-continue").click();
  ok(!document.querySelector("#summary-popup").classList.contains("open"), "\"Chơi Tiếp\" → quay lại chơi, bộ đếm giữ nguyên");
  document.querySelector("#btn-back").click();
  document.querySelector("#btn-exit").click();
  ok(active() === "screen-menu", "\"Thoát\" → về menu");
  ok(T.Game.stats().total === 0, "Thoát → bộ đếm phiên reset");

  console.log("\n[2b] Luồng MẪU GIÁO (tiền tiểu học) — cấp với The Lớp / Theo Chế Độ");
  document.querySelector("#btn-switch").click();
  document.querySelector('.choose-card[data-way="preschool"]').click();
  ok(active() === "screen-menu", "Chọn 🌟 Mẫu Giáo → vào thẳng menu (không chọn lớp)");
  ok(/Mẫu giáo/.test(document.querySelector("#menu-sub").textContent), "Tiêu đề menu hiện Mẫu giáo");
  ok(document.querySelectorAll(".mode-card:not(.hidden)").length === 6,
    "Menu mẫu giáo chỉ hiện 6 chế độ phù hợp");
  ok(document.querySelector("#mode-grid").classList.contains("grid-6"), "Lưới menu mẫu giáo: 3 cột × 2 hàng");
  ok(document.querySelector('.mode-card[data-mode="num"]').style.order === "0",
    "Mẫu giáo: lộ trình học xếp lại (Nhận Biết Số đứng đầu)");
  ok(/Nhận Biết Số/.test(document.querySelector('.mode-card[data-mode="num"] .mode-name').textContent),
    "Mẫu giáo: tên chế độ đổi cho phụ huynh dễ hiểu");
  ok(document.querySelector('.mode-card[data-mode="measure"]').classList.contains("hidden") === false,
    "Mẫu giáo: có thêm chế độ Đo lường (To · Dài · Cao)");

  /* Bé chưa biết chữ → mọi câu mẫu giáo phải có câu đọc + đáp án không phải chữ */
  const VN_CHARS = /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/;
  let sayBad = 0, wordBad = 0, preCount = 0;
  for (const mode of ["num", "calc", "cmp", "measure", "shape", "ready"]) {
    for (let i = 0; i < 25; i++) {
      const q = T.QUESTIONS[mode](0);
      preCount++;
      if (!String(q.say || "").trim()) sayBad++;
      if (!Array.isArray(q.voice) || q.voice.length === 0) sayBad++; /* coi thiếu voice cũng như thiếu say */
      if (VN_CHARS.test(q.choices.join(" "))) wordBad++;
    }
  }
  ok(sayBad === 0, `${preCount} câu mẫu giáo đều có câu đọc (say + voice) cho bé nghe`);
  ok(wordBad === 0, "Đáp án mẫu giáo 100% là hình / số / dấu — không cần đọc chữ");
  ok(T.QUESTIONS.shape(0).choices.every(c => /^<svg/.test(c)),
    "Hình Dạng mẫu giáo: nghe tên hình → bé bấm vào hình vẽ (không đọc chữ)");

  /* Câu so sánh: dấu < = > phải khớp hướng hình (không bị ngược) */
  function expSym(q) {
    const html = String(q.html);
    let m = [...html.matchAll(/cmp-box emoji">([^<]*)</g)].map(x => x[1]);
    if (m.length === 2) {
      const c1 = [...m[0]], c2 = [...m[1]];
      if (c1.length && c2.length && c1.every(ch => ch === c1[0]) && c2.every(ch => ch === c2[0]) && c1[0] === c2[0])
        return c1.length < c2.length ? "<" : c1.length > c2.length ? ">" : "=";
    }
    m = [...html.matchAll(/class="hbar" style="width:(\d+)%/g)].map(x => +x[1]);
    if (m.length === 2) return m[0] < m[1] ? "<" : m[0] > m[1] ? ">" : "=";
    m = [...html.matchAll(/class="vbar" style="height:(\d+)px/g)].map(x => +x[1]);
    if (m.length === 2) return m[0] < m[1] ? "<" : m[0] > m[1] ? ">" : "=";
    m = [...html.matchAll(/viz-emoji (big|small)/g)].map(x => x[1] === "big" ? 2 : 1);
    if (m.length === 2) return m[0] < m[1] ? "<" : m[0] > m[1] ? ">" : "=";
    return null;
  }
  let symChecked = 0, symBad2 = 0;
  for (const mode of ["cmp", "measure", "ready"]) {
    for (let i = 0; i < 40; i++) {
      const q = T.QUESTIONS[mode](0);
      const exp = expSym(q);
      if (!exp) continue;
      symChecked++;
      if (q.choices[q.answer] !== exp) symBad2++;
    }
  }
  ok(symChecked > 40 && symBad2 === 0, `${symChecked} câu so sánh mẫu giáo — dấu < = > đúng hướng`);

  ok(typeof T.Voice.speak === "function" && T.Voice.isSupported() === true,
    "Voice hỗ trợ mp3/Audio (stub) trong môi trường smoke-test");

  /* Cộng & Trừ mẫu giáo: 100% trong phạm vi 0–10 */
  let inRange = true, why = "";
  for (let i = 0; i < 60 && inRange; i++) {
    const q = T.QUESTIONS.calc(0);
    const m = /(\d+)\s*([+−-])\s*(\d+)\s*=\s*\?/.exec(String(q.html));
    if (!m) { inRange = false; why = "không khớp mẫu: " + q.html; break; }
    const a = +m[1], b = +m[3], r = m[2] === "+" ? a + b : a - b;
    if (a > 10 || b > 10 || r < 0 || r > 10) { inRange = false; why = `${a} ${m[2]} ${b} = ${r}`; }
  }
  ok(inRange, `60 câu Cộng & Trừ mẫu giáo trong phạm vi 0–10${why ? " — LỖI: " + why : ""}`);

  document.querySelector('.mode-card[data-mode="calc"]').click();
  ok(active() === "screen-play" && window.__playCtx.grade === 0,
    "Bấm ➕ Cộng & Trừ → chơi ngay cấp 0 (không popup chọn mức)");
  ok(document.querySelector("#q-say") !== null, "Màn chơi mẫu giáo có nút 🔊 Nghe lại");
  ok(!document.querySelector("#btn-voice").classList.contains("gone"),
    "Thanh chơi mẫu giáo hiện nút bật/tắt đọc câu hỏi");
  T.Game.start("measure", 0, "To · Dài · Cao", "📏");
  ok(/viz-row/.test(document.querySelector("#play-area").innerHTML),
    "📏 Mẫu giáo: to/nhỏ · dài/ngắn · cao/thấp — hai hình cạnh nhau để bé so sánh");
  T.Game.cancel();
  T.Game.start("ready", 0, "Tư Duy & Quy Luật", "🎒");
  ok(document.querySelectorAll(".opt-btn").length >= 3, "🎒 Tư Duy & Quy Luật sinh được câu ở mẫu giáo");
  T.Game.cancel();
  document.querySelector("#btn-back").click();   /* chưa trả lời → về thẳng menu */
  ok(active() === "screen-menu", "Chưa trả lời → ⬅️ về thẳng menu");

  console.log("\n[5] Luồng THEO CHẾ ĐỘ + popup chọn mức");
  document.querySelector("#btn-switch").click();
  ok(active() === "screen-way", "🔄 đổi cách học → màn Chọn Cách Học");
  document.querySelector('.choose-card[data-way="mode"]').click();
  ok(active() === "screen-menu", "Chọn Theo Chế Độ → menu ngay");
  ok(/Đo & Đo Lường/.test(document.querySelector('.mode-card[data-mode="measure"] .mode-name').textContent),
    "Rời Mẫu giáo → tên/biểu tượng chế độ trở lại như thường");
  document.querySelector('.mode-card[data-mode="frac"]').click();
  ok(document.querySelector("#level-popup").classList.contains("open"), "Bấm mode → popup chọn mức");
  document.querySelector('.level-card[data-level="1"]').click();
  ok(active() === "screen-play" && !document.querySelector("#level-popup").classList.contains("open"),
    "Chọn Dễ → vào chơi");
  ok(window.__playCtx.grade === 3, "Grade bị clamp ≥ mức mở khoá (Phân số: Dễ vẫn là 3, không rơi nhánh khó)");
  ok(document.querySelector("#q-say") === null && document.querySelector("#btn-voice").classList.contains("gone"),
    "Lớp 1–5: không có nút đọc (bé đã biết đọc)");
  ok(document.querySelectorAll(".opt-btn").length >= 3, "Phân số ở mức Dễ vẫn sinh được câu");

  console.log("\n[6] Chạy thử TẤT CẢ 12 chế độ × 6 cấp (mẫu giáo→lớp 5) — 48 câu/chế độ");
  for (const mode of ["ready", "num", "calc", "cmp", "mul", "frac", "dec", "pct", "measure", "shape", "story", "mulquiz"]) {
    let count = 0, err = null;
    for (const grade of [0, 1, 2, 3, 4, 5]) {
      const g = Math.max(grade, T.MODES[mode].min);
      for (let i = 0; i < 8; i++) {
        try {
          const q = T.QUESTIONS[mode](g);
          if (!q || !Array.isArray(q.choices) || q.choices.length < 3 || q.choices.length > 4) {
            throw new Error("lựa chọn bất thường: " + JSON.stringify(q && q.choices));
          }
          if (q.answer < 0 || q.answer >= q.choices.length) throw new Error("answer ngoài mảng");
          const hay = String(q.html) + String(q.prompt) + q.choices.join(" ");
          if (/NaN|undefined|null/.test(hay)) throw new Error("chứa NaN/undefined: " + hay.slice(0, 120));
          count++;
        } catch (e) { err = e; break; }
      }
      if (err) break;
    }
    ok(!err && count === 48, `${mode}: 48 câu sạch${err ? " — LỖI: " + err.message : ""}`);
  }

  console.log("\n[7] Render từng chế độ qua UI (không lỗi JS)");
  for (const mode of ["ready", "num", "calc", "cmp", "mul", "frac", "dec", "pct", "measure", "shape", "story", "mulquiz"]) {
    let err = null;
    try {
      T.Game.start(mode, 3, "test", "🧮");
      const n = document.querySelectorAll(".opt-btn").length;
      if (n < 3) throw new Error("ít nút: " + n);
      const inner = document.querySelector("#play-area").innerHTML;
      if (/NaN|undefined/.test(inner)) throw new Error("NaN/undefined trong HTML");
      T.Game.cancel();
    } catch (e) { err = e; }
    ok(!err, `render ${mode}${err ? " — LỖI: " + err.message : ""}`);
  }
  /* render thêm 6 chế độ ở CẤP MẪU GIÁO */
  for (const mode of ["num", "calc", "cmp", "measure", "shape", "ready"]) {
    let err = null;
    try {
      T.Game.start(mode, 0, "test", "🌟");
      const n = document.querySelectorAll(".opt-btn").length;
      if (n < 3) throw new Error("ít nút: " + n);
      const inner = document.querySelector("#play-area").innerHTML;
      if (/NaN|undefined/.test(inner)) throw new Error("NaN/undefined trong HTML");
      T.Game.cancel();
    } catch (e) { err = e; }
    ok(!err, `render ${mode} (mẫu giáo)${err ? " — LỖI: " + err.message : ""}`);
  }

  /* Hình Dạng Mẫu giáo: đủ nhiều hình để random phong phú */
  ok(Object.keys(T.SHAPE_VOICE).length >= 10,
    `Hình Dạng mẫu giáo có ${Object.keys(T.SHAPE_VOICE).length} hình (trước đây chỉ 4)`);
  const shapeSeen = new Set();
  let shapeBad = 0;
  for (let i = 0; i < 60; i++) {
    const sq = T.QUESTIONS.shape(0);
    if (sq.voice && sq.voice[0]) shapeSeen.add(sq.voice[0]);
    if (sq.choices.length !== 3) shapeBad++;   /* mẫu giáo: 3 hình to dễ bấm */
    if (String(sq.choices[sq.answer]).indexOf("shape-svg") < 0) shapeBad++;
  }
  ok(shapeBad === 0, "Hình Dạng mẫu giáo: đáp án luôn là 1 trong 3 hình vẽ");
  ok(shapeSeen.size >= 10, `Random phong phú — ${shapeSeen.size} hình khác nhau trong 60 câu`);

  /* Số tiếp theo mẫu giáo: 3 · 4 · ? → đáp án phải là 5 (KHÔNG được là 4) */
  let seqSeen = 0, seqBad = 0;
  for (let i = 0; i < 200; i++) {
    const nq = T.QUESTIONS.num(0);
    const m = /^(\d+) · (\d+) · \?$/.exec(String(nq.html).replace(/<[^>]*>/g, "").trim());
    if (!m) continue;
    seqSeen++;
    const want = +m[2] + 1;
    if (String(nq.choices[nq.answer]).trim() !== String(want)) seqBad++;
  }
  ok(seqSeen > 0 && seqBad === 0,
    `Số tiếp theo mẫu giáo đúng — ${seqSeen} câu, đáp án luôn là số đứng sau`);

  console.log("\n[8] Luồng 📘 BẢNG & CÔNG THỨC (tra cứu — không tính điểm)");
  document.querySelector("#btn-back").click();   /* chưa trả lời → về thẳng menu */
  ok(active() === "screen-menu", "Thoát màn chơi → về menu");
  document.querySelector("#btn-switch").click();
  document.querySelector('.choose-card[data-way="ref"]').click();
  ok(active() === "screen-ref", "Chọn 📘 Bảng & Công Thức → màn tra cứu");
  ok(window.sessionStorage.getItem("mt.way") === "ref", "Nhánh ref được lưu (mở lại đúng màn)");
  ok(document.querySelectorAll('#ref-chips .ref-chip').length === 8,
    "Tab Bảng Nhân: đủ 8 bảng (Bảng 2 → Bảng 9)");
  ok(document.querySelector('#ref-chips .ref-chip[data-table="7"]').classList.contains("active") === false,
    "Bảng 7 chưa được chọn (mặc định Bảng 2)");
  document.querySelector('#ref-chips .ref-chip[data-table="7"]').click();
  const learnTxt = document.querySelector("#ref-learn").textContent.replace(/\s+/g, " ");
  ok(/7 × 9 = 63/.test(learnTxt), "Học thuộc bảng 7: có dòng 7 × 9 = 63");
  ok(/7 × 10 = 70/.test(learnTxt), "Bảng nhân bảng 7: có dòng 7 × 10 = 70");
  ok(!/: \d+ =/.test(learnTxt), "Tab Bảng Nhân không trộn phép chia vào");

  /* Tab ➗ Bảng Chia — tách riêng khỏi bảng nhân */
  document.querySelector('.ref-subtab[data-refsub="div"]').click();
  const divTxt = document.querySelector("#ref-learn").textContent.replace(/\s+/g, " ");
  ok(/63 : 7 = 9/.test(divTxt), "Bảng chia bảng 7: có dòng 63 : 7 = 9");
  ok(/70 : 7 = 10/.test(divTxt), "Bảng chia bảng 7: có dòng 70 : 7 = 10");
  ok(!/×/.test(divTxt), "Tab Bảng Chia không trộn phép nhân vào");
  ok(document.querySelectorAll('#ref-chips .ref-chip').length === 8,
    "Tab Bảng Chia: đủ 8 bảng, không có 🔀 Trộn Hết");
  document.querySelector('#ref-chips .ref-chip[data-table="4"]').click();
  ok(/20 : 4 = 5/.test(document.querySelector("#ref-learn").textContent.replace(/\s+/g, " ")),
    "Đổi sang Bảng 4 ở tab chia → 20 : 4 = 5");
  document.querySelector('#ref-chips .ref-chip[data-table="7"]').click();

  /* Chuyển sang tab Kiểm Tra */
  document.querySelector('.ref-subtab[data-refsub="quiz"]').click();
  ok(document.querySelectorAll('#ref-chips .ref-chip').length === 9,
    "Ô Kiểm Tra: 8 bảng + ô 🔀 Trộn Hết");
  ok(!document.querySelector("#ref-quiz").classList.contains("gone"), "Ô Bắt Đầu Kiểm Tra hiện ra");
  ok(document.querySelector("#ref-learn").classList.contains("gone"), "Bảng học thuộc ẩn đi");
  ok(/Bảng 7/.test(document.querySelector("#ref-quiz-hint").textContent),
    "Gợi ý nhắc đúng bảng bé chọn (Bảng 7)");

  document.querySelector("#btn-ref-start").click();
  ok(active() === "screen-play", "Bắt đầu kiểm tra → màn chơi");
  ok(window.__playCtx.mode === "mulquiz" && window.__playCtx.back === "screen-ref",
    "Phiên chơi là mulquiz, biết đường quay về màn tra cứu");

  /* Trả lời đúng 1 câu (sinh câu từ bảng 7 đã chọn) */
  const qTxt = document.querySelector("#play-area .q-box").textContent.replace(/\s+/g, " ").trim();
  ok(/(^7 ×|\d+ : 7 = \?)/.test(qTxt), "Câu hỏi thuộc bảng 7: " + qTxt);
  let want = null, m2;
  if ((m2 = /^(\d+) × (\d+) = \?$/.exec(qTxt))) want = +m2[1] * +m2[2];
  else if ((m2 = /^(\d+) × \? = (\d+)$/.exec(qTxt))) want = Math.round(+m2[2] / +m2[1]);
  else if ((m2 = /^(\d+) : (\d+) = \?$/.exec(qTxt))) want = Math.round(+m2[1] / +m2[2]);
  let hit = null;
  if (want != null) {
    for (const b of document.querySelectorAll(".opt-btn")) {
      if (b.textContent.trim() === String(want)) { hit = b; break; }
    }
  }
  ok(hit !== null, `Tìm được nút đáp án ${want} trong 4 lựa chọn`);
  if (hit) hit.click();
  ok(document.querySelector(".opt-btn.good") !== null, "Bấm đúng → nút 🟢");
  ok(T.Game.stats().correct === 1, "Câu kiểm tra được tính vào phiên");

  /* Thoát → phải về lại màn tra cứu (KHÔNG rơi về menu) */
  document.querySelector("#btn-back").click();
  ok(document.querySelector("#summary-popup").classList.contains("open"), "Bấm ⬅️ → popup tổng kết");
  document.querySelector("#btn-exit").click();
  ok(active() === "screen-ref", "\"Thoát\" → về lại màn Bảng & Công Thức (không phải menu)");
  ok(T.Game.stats().total === 0, "Thoát → bộ đếm phiên reset");

  /* Quiz bảng 7 phải trộn đủ 3 dạng: nhân · số thiếu · chia */
  let mulSeen = 0, missSeen = 0, chiaSeen = 0;
  for (let i = 0; i < 60; i++) {
    const plain = String(T.QUESTIONS.mulquiz(3).html).replace(/<[^>]*>/g, "").trim();
    if (/^7 × \d+ = \?$/.test(plain)) mulSeen++;
    else if (/^7 × \? = \d+$/.test(plain)) missSeen++;
    else if (/^\d+ : 7 = \?$/.test(plain)) chiaSeen++;
  }
  ok(mulSeen > 0 && missSeen > 0 && chiaSeen > 0,
    `Quiz bảng 7 đủ 3 dạng — nhân ${mulSeen} · số thiếu ${missSeen} · chia ${chiaSeen}`);

  /* Tab Công thức */
  document.querySelector('.ref-tab[data-reftab="formula"]').click();
  ok(!document.querySelector("#ref-panel-formula").classList.contains("gone"), "Chuyển sang tab 📐 Công Thức");
  ok(document.querySelector("#ref-panel-table").classList.contains("gone"), "Panel bảng cửu chương ẩn đi");
  ok(document.querySelectorAll('#ref-grade-row .ref-chip').length === 5, "Đủ 5 chip Lớp 1 → Lớp 5");
  document.querySelector('#ref-grade-row .ref-chip[data-g="5"]').click();
  const fm5 = document.querySelector("#ref-formulas").textContent.replace(/\s+/g, " ");
  ok(/Tam giác/.test(fm5) && /S = \(a × h\) : 2/.test(fm5), "Công thức lớp 5: diện tích tam giác");
  ok(/3,14/.test(fm5), "Công thức lớp 5: hình tròn (3,14)");
  document.querySelector('#ref-grade-row .ref-chip[data-g="1"]').click();
  const fm1 = document.querySelector("#ref-formulas").textContent.replace(/\s+/g, " ");
  ok(/a \+ b = b \+ a/.test(fm1), "Công thức lớp 1: cộng hoán vị");

  /* Quay về màn Chọn Cách Học */
  document.querySelector("#btn-ref-back").click();
  ok(active() === "screen-way", "Nút 🔄 → về màn Chọn Cách Học");

  console.log("\n" + (fails ? `❌ ${fails} mục FAIL` : "✅ SMOKE-TEST TẤT CẢ OK"));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error("LỖI TEST:", e); process.exit(1); });

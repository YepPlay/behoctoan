/* Smoke-test toàn luồng bằng jsdom: chọn bé → cách học → lớp/menu →
   chơi cả 10 chế độ → trả lời đúng/sai → popup tổng kết → thoát.
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
  let code = ["js/data.js", "js/audio.js", "js/games.js", "js/main.js"]
    .map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n;\n");
  code += `
;window.__t = { QUESTIONS: QUESTIONS, Game: Game, MODES: MODES };
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

  console.log("\n[5] Luồng THEO CHẾ ĐỘ + popup chọn mức");
  document.querySelector("#btn-switch").click();
  ok(active() === "screen-way", "🔄 đổi cách học → màn Chọn Cách Học");
  document.querySelector('.choose-card[data-way="mode"]').click();
  ok(active() === "screen-menu", "Chọn Theo Chế Độ → menu ngay");
  document.querySelector('.mode-card[data-mode="frac"]').click();
  ok(document.querySelector("#level-popup").classList.contains("open"), "Bấm mode → popup chọn mức");
  document.querySelector('.level-card[data-level="1"]').click();
  ok(active() === "screen-play" && !document.querySelector("#level-popup").classList.contains("open"),
    "Chọn Dễ → vào chơi");
  ok(window.__playCtx.grade === 3, "Grade bị clamp ≥ mức mở khoá (Phân số: Dễ vẫn là 3, không rơi nhánh khó)");
  ok(document.querySelectorAll(".opt-btn").length >= 3, "Phân số ở mức Dễ vẫn sinh được câu");

  console.log("\n[6] Chạy thử TẤT CẢ 10 chế độ — mỗi chế độ 40 câu");
  for (const mode of ["num", "calc", "cmp", "mul", "frac", "dec", "pct", "measure", "shape", "story"]) {
    let count = 0, err = null;
    for (const g of [1, 2, 3, 4, 5]) {
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
    ok(!err && count === 40, `${mode}: 40 câu/lớp sạch${err ? " — LỖI: " + err.message : ""}`);
  }

  console.log("\n[7] Render từng chế độ qua UI (không lỗi JS)");
  for (const mode of ["num", "calc", "cmp", "mul", "frac", "dec", "pct", "measure", "shape", "story"]) {
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

  console.log("\n" + (fails ? `❌ ${fails} mục FAIL` : "✅ SMOKE-TEST TẤT CẢ OK"));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error("LỖI TEST:", e); process.exit(1); });

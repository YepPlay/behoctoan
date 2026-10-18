/* Kiểm tra sinh câu hỏi: mỗi mode × lớp sinh N câu, validate:
   - có đúng M lựa chọn, đáp án nằm trong lựa chọn, không trùng đáp án
   - không có NaN / undefined / chuỗi rỗng
   - phép tính lớp 1 không âm, kết quả hợp lý
   Lệnh: node tools/check-questions.js [N]   (mặc định 300 câu/mode/lớp) */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const N = parseInt(process.argv[2] || "300", 10);

const sandbox = {};
vm.createContext(sandbox);
const src = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8")
  + "\n;globalThis.__out = { QUESTIONS, MODES, vnWords, fmtN };";
vm.runInContext(src, sandbox);
const { QUESTIONS, MODES } = sandbox.__out;

let errors = 0, checked = 0;
function bad(mode, grade, msg, q) {
  errors++;
  if (errors <= 40) console.log(`  ✗ ${mode} · lớp ${grade}: ${msg}\n      ${q ? JSON.stringify(q).slice(0, 240) : "(không có câu)"}`);
}

function textOf(s) { return String(s == null ? "" : s); }

for (const mode of Object.keys(MODES)) {
  const min = MODES[mode].min;
  for (let grade = 1; grade <= 5; grade++) {
    if (grade < min && grade !== min - 0) { /* vẫn test ở mức min */ }
    const g = grade < min ? min : grade;
    for (let i = 0; i < N; i++) {
      let q;
      try { q = QUESTIONS[mode](g); }
      catch (e) { bad(mode, g, "ném lỗi: " + e.message); continue; }
      checked++;

      if (!q || typeof q !== "object") { bad(mode, g, "không phải object"); continue; }
      if (!Array.isArray(q.choices)) { bad(mode, g, "choices không phải mảng"); continue; }
      if (q.choices.length < 3 || q.choices.length > 4) bad(mode, g, `số lựa chọn = ${q.choices.length}`);
      if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.choices.length)
        bad(mode, g, `answer = ${q.answer} ngoài mảng`, q);
      if (new Set(q.choices.map(String)).size !== q.choices.length)
        bad(mode, g, "lựa chọn trùng nhau", q);

      const hay = textOf(q.html) + " " + textOf(q.prompt) + " " + q.choices.join(" ");
      if (/NaN|undefined|null|Infinity/.test(hay)) bad(mode, g, "chứa NaN/undefined", q);
      if (!textOf(q.prompt).trim() && !textOf(q.html).trim()) bad(mode, g, "câu hỏi trống", q);
      if (q.choices.some(c => !String(c).trim())) bad(mode, g, "lựa chọn rỗng", q);

      /* lớp 1: kết quả cộng/trừ phải không âm */
      if (mode === "calc" && g === 1) {
        const m = /(\d+)\s*([+−-])\s*(\d+)/.exec(hay);
        if (m) {
          const a = +m[1], b = +m[3];
          if (m[2] !== "+" && b > a) bad(mode, g, "trừ ra số âm", q);
        }
      }
    }
  }
}

console.log(`\nĐã kiểm ${checked} câu · lỗi: ${errors}`);
if (errors === 0) console.log("✅ TẤT CẢ OK — node tools/gen-sw.js rồi upload.");
process.exit(errors ? 1 : 0);

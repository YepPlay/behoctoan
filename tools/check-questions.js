/* Kiểm tra sinh câu hỏi: mỗi mode × cấp (mẫu giáo→lớp 5) sinh N câu, validate:
   - có đúng M lựa chọn, đáp án nằm trong lựa chọn, không trùng đáp án
   - không có NaN / undefined / chuỗi rỗng
   - phép tính không âm; mẫu giáo (cấp 0) nằm trong phạm vi 0–10
   Lệnh: node tools/check-questions.js [N]   (mặc định 300 câu/mode/cấp) */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const N = parseInt(process.argv[2] || "300", 10);

const sandbox = {};
vm.createContext(sandbox);
const src = fs.readFileSync(path.join(ROOT, "js", "voice-lines.js"), "utf8")
  + "\n" + fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8")
  + "\n;globalThis.__out = { QUESTIONS, MODES, PRESCHOOL_MODES, vnWords, fmtN, VOICE_LINES };";
vm.runInContext(src, sandbox);
const { QUESTIONS, MODES, PRESCHOOL_MODES, VOICE_LINES } = sandbox.__out;

let errors = 0, checked = 0;
function bad(mode, grade, msg, q) {
  errors++;
  if (errors <= 40) console.log(`  ✗ ${mode} · lớp ${grade}: ${msg}\n      ${q ? JSON.stringify(q).slice(0, 240) : "(không có câu)"}`);
}

function textOf(s) { return String(s == null ? "" : s); }

for (const mode of Object.keys(MODES)) {
  const min = MODES[mode].min;
  for (let grade = 0; grade <= 5; grade++) {
    const g = Math.max(grade, min);
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

      /* phép tính: không âm; mẫu giáo (g = 0) phải trong phạm vi 0–10 */
      if ((mode === "calc" || mode === "ready") && (g === 0 || g === 1)) {
        const m = /(\d+)\s*([+−-])\s*(\d+)/.exec(hay);
        if (m) {
          const a = +m[1], b = +m[3];
          if (m[2] !== "+" && b > a) bad(mode, g, "trừ ra số âm", q);
          if (g === 0 && (a > 10 || b > 10 || (m[2] === "+" && a + b > 10)))
            bad(mode, g, "vượt phạm vi 0–10", q);
        }
      }
    }
  }
}

/* ---------- MẪU GIÁO (cấp 0) — bé chưa biết chữ, kiểm chặt hơn ----------
   · mọi câu phải có `say` (để máy đọc lên cho bé nghe)
   · đáp án không được là CHỮ tiếng Việt (bé không đọc được)
   · câu so sánh phải có dấu < = > khớp với hình vẽ trong câu */
const VN_CHARS = /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/;

/* Đọc dấu < = > đúng theo hình đang hiển thị trong câu hỏi */
function expectedSym(q) {
  const html = String(q.html);
  let m = [...html.matchAll(/cmp-box emoji">([^<]*)</g)].map(x => x[1]);
  if (m.length === 2) {
    const c1 = [...m[0]], c2 = [...m[1]];
    if (c1.length && c2.length && c1.every(ch => ch === c1[0]) && c2.every(ch => ch === c2[0]) && c1[0] === c2[0]) {
      return c1.length < c2.length ? "<" : c1.length > c2.length ? ">" : "=";
    }
  }
  m = [...html.matchAll(/class="hbar" style="width:(\d+)%/g)].map(x => +x[1]);
  if (m.length === 2) return m[0] < m[1] ? "<" : m[0] > m[1] ? ">" : "=";
  m = [...html.matchAll(/class="vbar" style="height:(\d+)px/g)].map(x => +x[1]);
  if (m.length === 2) return m[0] < m[1] ? "<" : m[0] > m[1] ? ">" : "=";
  m = [...html.matchAll(/viz-emoji (big|small)/g)].map(x => x[1] === "big" ? 2 : 1);
  if (m.length === 2) return m[0] < m[1] ? "<" : m[0] > m[1] ? ">" : "=";
  return null;
}

let preChecked = 0, symChecked = 0, symBad = 0, sayBad = 0, wordBad = 0;
for (const mode of PRESCHOOL_MODES) {
  for (let i = 0; i < N; i++) {
    let q;
    try { q = QUESTIONS[mode](0); }
    catch (e) { bad(mode, 0, "ném lỗi: " + e.message); continue; }
    preChecked++;

    if (!String(q.say || "").trim()) {
      sayBad++;
      if (sayBad <= 6) bad(mode, 0, "thiếu câu đọc (say)", q);
    }
    /* Kiểm tra key đọc (voice) */
    const vkeys = Array.isArray(q.voice) ? q.voice : [];
    if (!vkeys.length) {
      sayBad++; /* dùng sayBad thống nhất cảnh báo nhẹ: thiếu voice */
      if (sayBad <= 10) bad(mode, 0, "thiếu voice (key mp3)", q);
    } else {
      vkeys.forEach(k => {
        if (typeof k !== "string") { bad(mode, 0, "voice key không hợp lệ", q); }
        else if (!VOICE_LINES || !VOICE_LINES[k]) { bad(mode, 0, "voice key chưa có trong VOICE_LINES: " + k, q); }
        else {
          const fp = path.join(ROOT, "assets", "voice", k + ".mp3");
          if (!fs.existsSync(fp) || fs.statSync(fp).size < 200) {
            bad(mode, 0, "file mp3 thiếu: assets/voice/" + k + ".mp3", q);
          }
        }
      });
    }
    if (VN_CHARS.test(q.choices.join(" "))) {
      wordBad++;
      if (wordBad <= 6) bad(mode, 0, "đáp án là CHỮ — bé mẫu giáo không đọc được", q);
    }
    const exp = expectedSym(q);
    if (exp) {
      symChecked++;
      if (q.choices[q.answer] !== exp) {
        symBad++;
        if (symBad <= 6) bad(mode, 0, `dấu ngược: hình cần "${exp}" nhưng đáp án là "${q.choices[q.answer]}"`, q);
      }
    }
  }
}
console.log(`Mẫu giáo: ${preChecked} câu · say thiếu/voice thiếu: ${sayBad} · đáp án chữ: ${wordBad}`
  + ` · so sánh kiểm ${symChecked} câu (sai dấu: ${symBad})`);

console.log(`\nĐã kiểm ${checked} câu · lỗi: ${errors}`);
if (errors === 0) console.log("✅ TẤT CẢ OK — node tools/gen-sw.js rồi upload.");
process.exit(errors ? 1 : 0);

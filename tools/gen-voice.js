/* Sinh file đọc câu hỏi Mẫu giáo bằng GIỌNG GOOGLE TIẾNG VIỆT.
   Chạy MỘT LẦN trên máy tính có mạng:

       node tools/gen-voice.js           (chỉ sinh file còn thiếu)
       node tools/gen-voice.js --force   (sinh lại tất cả)

   Kết quả: assets/voice/<key>.mp3 — nhờ vậy mọi thiết bị (Android,
   iPhone/iPad, máy tính) đều nghe cùng một giọng Việt, chơi offline được.
   Câu đọc sửa ở js/voice-lines.js rồi chạy lại lệnh này. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets", "voice");
const force = process.argv.includes("--force");

/* Đọc bảng câu đọc (js/voice-lines.js) */
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(ROOT, "js", "voice-lines.js"), "utf8") + "\n;globalThis.__v = { VOICE_LINES };",
  sandbox);
const { VOICE_LINES } = sandbox.__v;

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Google Translate TTS (giọng đọc giống trên translate.google.com) */
async function tts(text) {
  const url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&ttsspeed=1&tl=vi&q="
    + encodeURIComponent(text);
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/",
        },
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      const head = buf.slice(0, 3).toString("latin1");
      if (buf.length < 200 || (head !== "ID3" && buf[0] !== 0xFF)) throw new Error("dữ liệu trả về không phải MP3");
      return buf;
    } catch (e) {
      if (i === 3) throw e;
      await sleep(800 * (i + 1));   /* Google giới hạn tốc độ → chờ rồi thử lại */
    }
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const keys = Object.keys(VOICE_LINES);
  let made = 0, skip = 0, bytes = 0;
  const failed = [];

  console.log(`Sinh ${keys.length} file đọc vào assets/voice/ …\n`);
  for (const key of keys) {
    const file = path.join(OUT, key + ".mp3");
    if (!force && fs.existsSync(file) && fs.statSync(file).size > 200) {
      skip++; bytes += fs.statSync(file).size;
      continue;
    }
    process.stdout.write(`  ${key.padEnd(12)} ${VOICE_LINES[key]} … `);
    try {
      const buf = await tts(VOICE_LINES[key]);
      fs.writeFileSync(file, buf);
      made++; bytes += buf.length;
      console.log(`${(buf.length / 1024).toFixed(1)} KB`);
    } catch (e) {
      console.log("LỖI: " + e.message);
      failed.push(key);
    }
    await sleep(350);
  }

  console.log(`\nMới sinh: ${made} · đã có sẵn: ${skip} · tổng dung lượng: ${(bytes / 1024).toFixed(0)} KB`);
  if (failed.length) {
    console.log(`❌ ${failed.length} file lỗi: ${failed.join(", ")}`);
    console.log("   → chạy lại lệnh này (nó bỏ qua file đã có) để thử tiếp.");
    process.exit(1);
  }
  console.log("✅ Xong — chạy node tools/gen-sw.js để đưa các file này vào cache offline.");
})();

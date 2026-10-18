/* ============================================================
   Bé Học Toán — Voice: đọc câu hỏi cho bé MẪU GIÁO (tiền tiểu học)
   Bé chưa biết chữ nên mọi câu hỏi đều được đọc lên.

   · Giọng đọc = file MP3 có sẵn trong assets/voice/ (giọng Google
     tiếng Việt, xem js/voice-lines.js + tools/gen-voice.js)
     → mọi thiết bị (Android, iPhone/iPad, máy tính) nghe GIỐNG NHAU,
       không phụ thuộc giọng cài trong máy, và chơi offline được.
   · Câu có số thì ghép nhiều file: "ba cộng năm bằng bao nhiêu?"
     = n3.mp3 + cong.mp3 + n5.mp3 + hoiCalc.mp3
   · Web Speech chỉ là phương án DỰ PHÒNG khi thiếu file, và chỉ đọc
     khi máy có giọng tiếng Việt (không bao giờ đọc chữ Việt bằng
     giọng tiếng Anh như trước).
   ============================================================ */
const Voice = (() => {
  const KEY = "mt.voice";              /* nhớ bật/tắt đọc */
  const DIR = "assets/voice/";

  let on = true;
  try { if (localStorage.getItem(KEY) === "0") on = false; } catch (e) { }

  const canAudio = typeof window !== "undefined" && typeof window.Audio === "function";
  const canSpeech = typeof window !== "undefined"
    && "speechSynthesis" in window
    && typeof SpeechSynthesisUtterance !== "undefined";

  let seq = 0;          /* mỗi lần đọc mới tăng seq → chuỗi cũ tự dừng */
  let el = null;        /* DÙNG CHUNG 1 thẻ audio: iPhone cần vậy mới cho phát tiếp */
  let unlocked = false;
  let warmed = false;

  const srcOf = key => DIR + key + ".mp3";

  function element() {
    if (!canAudio) return null;
    if (!el) {
      el = new Audio();
      el.preload = "auto";
      try { el.volume = 1; } catch (e) { }
    }
    return el;
  }

  /* ---------- Dự phòng: đọc bằng giọng có sẵn của máy ---------- */
  let cacheVoice = null, lookedUp = false;
  function viVoice() {
    if (lookedUp && cacheVoice) return cacheVoice;
    lookedUp = true;
    let list = [];
    try { list = speechSynthesis.getVoices() || []; } catch (e) { list = []; }
    cacheVoice = list.find(v => /^vi([-_]|$)/i.test(v.lang || ""))
      || list.find(v => /viet/i.test(v.name || ""))
      || null;
    return cacheVoice;
  }

  function speakText(text) {
    if (!canSpeech || !text) return;
    try {
      const v = viVoice();
      if (!v) return;    /* máy không có giọng Việt → im lặng (không đọc tiếng Anh) */
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = "vi-VN";
      u.voice = v;
      u.rate = 0.92;
      u.pitch = 1.08;
      speechSynthesis.speak(u);
    } catch (e) { }
  }

  /* ---------- Phát lần lượt các file đọc ---------- */
  function playKeys(keys, text) {
    const a = element();
    if (!a) { speakText(text); return; }

    const id = seq;
    let i = 0;
    const step = () => {
      if (id !== seq || i >= keys.length) return;
      const key = keys[i++];
      a.onended = step;
      a.onerror = () => { if (id === seq) { seq++; speakText(text); } };
      a.src = srcOf(key);
      const p = a.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => { if (id === seq) { seq++; speakText(text); } });
      }
    };
    step();
  }

  /* Đọc 1 câu: `keys` = mảng key file (ưu tiên), `text` = câu chữ dự phòng */
  function speak(keys, text) {
    if (!on) return;
    const list = Array.isArray(keys) && keys.length ? keys : null;
    const words = String(text || (typeof keys === "string" ? keys : ""));
    if (!list && !words) return;
    seq++;                               /* cắt câu đang đọc dở */
    if (list) playKeys(list, words);
    else speakText(words);
  }

  function stop() {
    seq++;
    if (el) {
      try {
        el.onended = null;
        el.onerror = null;
        el.pause();
      } catch (e) { }
    }
    if (canSpeech) { try { speechSynthesis.cancel(); } catch (e) { } }
  }

  /* ---------- Mở khoá audio ngay trong cú bấm đầu tiên (cần cho iPhone) ---------- */
  function unlock() {
    if (unlocked || !canAudio) return;
    unlocked = true;
    const a = element();
    if (!a) return;
    try {
      a.muted = true;                     /* phát "câm" để xin quyền, không gây tiếng */
      a.src = srcOf("n1");
      const p = a.play();
      const done = () => { try { a.muted = false; } catch (e) { } };
      if (p && typeof p.then === "function") p.then(done, done);
      else done();
    } catch (e) { try { a.muted = false; } catch (e2) { } }
  }

  /* ---------- Nạp trước các file đọc (service worker cache → phát tức thì, offline) ---------- */
  function warm() {
    if (warmed || typeof fetch !== "function" || typeof VOICE_LINES === "undefined") return;
    warmed = true;
    Object.keys(VOICE_LINES).forEach(k => { try { fetch(srcOf(k)); } catch (e) { } });
  }

  /* Bật / tắt tiếng đọc (nhớ trong localStorage) */
  function toggle() {
    on = !on;
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { }
    if (!on) stop();
    return on;
  }

  if (canSpeech && typeof speechSynthesis.addEventListener === "function") {
    speechSynthesis.addEventListener("voiceschanged", () => { lookedUp = false; cacheVoice = null; });
  }

  return {
    speak, stop, unlock, warm, toggle,
    isOn: () => on,
    isSupported: () => canAudio || canSpeech,
  };
})();

/* Bé Học Toán — engine chơi: câu hỏi random vô hạn, đếm phiên đúng/tổng */
const Game = (() => {
  let state = null;
  let ticker = null;
  let sayTimer = null;

  function clearTicker() { if (ticker) { clearTimeout(ticker); ticker = null; } }
  function clearSay() { if (sayTimer) { clearTimeout(sayTimer); sayTimer = null; } }
  const area = () => document.getElementById("play-area");

  /* MẪU GIÁO (cấp 0): bé chưa biết chữ → mọi câu đều được đọc lên */
  const isPre = () => !!state && state.grade === 0;
  function sayQuestion() {
    if (!state || !isPre() || !state.q) return;
    Voice.speak(state.q.voice, state.q.say || state.q.prompt);
  }

  /* ---------- Render 1 câu hỏi ---------- */
  function render() {
    if (!state) return;
    clearTicker();
    clearSay();
    const q = QUESTIONS[state.mode](state.grade);
    state.q = q;
    state.locked = false;
    state.first = true;

    const pre = isPre();
    const ask = q.prompt ? `<p class="q-ask">${q.prompt}</p>` : "";
    const sayBtn = pre
      ? `<button class="q-say" id="q-say" type="button" aria-label="Nghe lại câu hỏi">🔊<span>Nghe lại</span></button>`
      : "";
    area().innerHTML = `
      <div class="q-center">
        ${q.html ? `<div class="q-box">${q.html}</div>` : ""}
        ${ask}
        ${sayBtn}
      </div>
      <div class="opt-grid${q.choices.length === 3 ? " opt-3" : ""}">
        ${q.choices.map((c, i) => {
          const text = !/^\s*</.test(String(c));   /* đáp án là hình vẽ (svg) thì không dùng cỡ chữ "long" */
          return `
          <button class="opt-btn" data-i="${i}">
            <span class="opt-text${text && String(c).length > 8 ? " long" : ""}">${c}</span>
          </button>`;
        }).join("")}
      </div>`;

    area().querySelectorAll(".opt-btn").forEach(btn => {
      btn.onclick = () => onAnswer(btn);
    });

    if (pre) {
      const sb = area().querySelector("#q-say");
      if (sb) sb.onclick = () => { Sfx.click(); sayQuestion(); };
      /* Câu ĐẦU TIÊN đọc ngay trong cú bấm của bé: iPhone/iPad chỉ cho
         phát tiếng khi có thao tác người dùng. Các câu sau đọc sau 1 nhịp
         để bé kịp nhìn hình. */
      if (state.firstSpeak) { state.firstSpeak = false; sayQuestion(); }
      else sayTimer = setTimeout(sayQuestion, 260);
    }
  }

  /* ---------- Trả lời ----------
     Quy ước đếm phiên: mỗi câu chỉ tính MỘT lần ngay ở lượt bấm đầu tiên.
     Bấm đầu đúng  → total++ và correct++.
     Bấm đầu sai   → total++ (sai), bé bấm lại đến khi đúng → không tính thêm. */
  function onAnswer(btn) {
    if (!state || state.locked) return;
    const i = parseInt(btn.dataset.i, 10);
    const ok = i === state.q.answer;

    if (ok) {
      state.locked = true;
      if (state.first) { state.total++; state.correct++; state.first = false; }
      Sfx.correct();
      btn.classList.add("good");
      UI.celebrate(btn);
      if (isPre()) Voice.speak(["gioiQua"], "Giỏi quá!");
      ticker = setTimeout(() => { if (state) render(); }, 1100);
    } else {
      if (state.first) { state.total++; state.first = false; }
      Sfx.wrong();
      btn.classList.add("bad");
      btn.disabled = true;
      if (isPre()) Voice.speak(["thuLai"], "Chưa đúng, bé thử lại nhé!");
    }
  }

  /* ---------- Bắt đầu / dừng ---------- */
  function start(mode, grade, name, icon) {
    cleanup();
    state = {
      mode, grade,
      name: name || (MODES[mode] || {}).name || "",
      icon: icon || (MODES[mode] || {}).icon || "🧮",
      correct: 0, total: 0,
      locked: false, first: true, firstSpeak: true, q: null,
    };
    if (grade === 0) {
      Voice.unlock();   /* xin quyền phát tiếng ngay trong cú bấm (iPhone/iPad) */
      Voice.warm();     /* nạp trước các file đọc để phát tức thì */
    }
    render();
  }

  function cleanup() { clearTicker(); clearSay(); Voice.stop(); }

  function cancel() { cleanup(); state = null; }

  /* Thống kê phiên hiện tại (cho popup tổng kết) */
  function stats() {
    return state ? { correct: state.correct, total: state.total } : { correct: 0, total: 0 };
  }
  /* true nếu phiên có câu đã chơi */
  function hasPlayed() { return !!state && state.total > 0; }

  /* Tạm dừng khi popup tổng kết mở (không sinh câu mới) */
  function pause() { clearTicker(); clearSay(); Voice.stop(); }
  function resume() { if (state && !state.q) render(); }

  return { start, cancel, stats, hasPlayed, pause, resume };
})();

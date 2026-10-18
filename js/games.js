/* Bé Học Toán — engine chơi: câu hỏi random vô hạn, đếm phiên đúng/tổng */
const Game = (() => {
  let state = null;
  let ticker = null;

  function clearTicker() { if (ticker) { clearTimeout(ticker); ticker = null; } }
  const area = () => document.getElementById("play-area");

  /* ---------- Render 1 câu hỏi ---------- */
  function render() {
    if (!state) return;
    clearTicker();
    const q = QUESTIONS[state.mode](state.grade);
    state.q = q;
    state.locked = false;
    state.first = true;

    const ask = q.prompt
      ? `<p class="q-ask">${q.prompt}</p>`
      : "";
    area().innerHTML = `
      <div class="q-center">
        ${q.html ? `<div class="q-box">${q.html}</div>` : ""}
        ${ask}
      </div>
      <div class="opt-grid${q.choices.length === 3 ? " opt-3" : ""}">
        ${q.choices.map((c, i) => `
          <button class="opt-btn" data-i="${i}">
            <span class="opt-text${c.length > 8 ? " long" : ""}">${c}</span>
          </button>`).join("")}
      </div>`;

    area().querySelectorAll(".opt-btn").forEach(btn => {
      btn.onclick = () => onAnswer(btn);
    });
    UI.setPlayTitle(`${state.icon} ${state.name}`);
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
      ticker = setTimeout(() => { if (state) render(); }, 1100);
    } else {
      if (state.first) { state.total++; state.first = false; }
      Sfx.wrong();
      btn.classList.add("bad");
      btn.disabled = true;
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
      locked: false, first: true, q: null,
    };
    UI.hideProgress();
    render();
  }

  function cleanup() { clearTicker(); }

  function cancel() { cleanup(); state = null; }

  /* Thống kê phiên hiện tại (cho popup tổng kết) */
  function stats() {
    return state ? { correct: state.correct, total: state.total } : { correct: 0, total: 0 };
  }
  /* true nếu phiên có câu đã chơi */
  function hasPlayed() { return !!state && state.total > 0; }

  /* Tạm dừng khi popup tổng kết mở (không sinh câu mới) */
  function pause() { clearTicker(); }
  function resume() { if (state && !state.q) render(); }

  return { start, cancel, stats, hasPlayed, pause, resume };
})();

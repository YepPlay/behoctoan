const $ = s => document.querySelector(s);

const THEME_KEYS = ["boy", "girl"];
const WAY_KEYS = ["class", "mode", "preschool"];

function storageGet(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }
function storageSet(key, val) { try { sessionStorage.setItem(key, val); } catch (e) { } }

/* Chỉ lưu: bé nào · cách học · lớp/mức — KHÔNG lưu tiến độ, điểm */
const store = {
  theme: THEME_KEYS.indexOf(storageGet("mt.theme")) >= 0 ? storageGet("mt.theme") : "",
  way: WAY_KEYS.indexOf(storageGet("mt.way")) >= 0 ? storageGet("mt.way") : "",
  grade: (() => {
    const g = parseInt(storageGet("mt.grade") || "1", 10);
    return g >= 1 && g <= 5 ? g : 1;
  })(),
};
function saveStore() {
  storageSet("mt.theme", store.theme);
  storageSet("mt.way", store.way);
  storageSet("mt.grade", String(store.grade));
}

/* Chế độ chơi hiện tại (menu → play) */
let playCtx = null;   // { mode, grade }

function show(id) {
  if (id !== "screen-play") Voice.stop();   /* rời màn chơi → tắt tiếng đọc */
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id));
  fitScreen(document.getElementById(id));
  requestAnimationFrame(() => fitScreen(document.getElementById(id)));
}

function fitScreen(sc) {
  if (!sc || !sc.classList.contains("active")) return;
  const fit = sc.querySelector(".fit");
  if (!fit) return;
  fit.style.transform = "";
  const host = sc.querySelector(".screen-body") || sc;
  const vw = host.clientWidth, vh = host.clientHeight;
  if (!vw || !vh) return;
  const r = fit.getBoundingClientRect();
  const needW = Math.max(r.width, fit.scrollWidth);
  const needH = Math.max(r.height, fit.scrollHeight);
  const s = Math.min(1, vw / needW, vh / needH);
  if (s < 0.999) fit.style.transform = "scale(" + s.toFixed(4) + ")";
}

/* ============================================================
   UI effects — chỉ khen khi ĐÚNG
   ============================================================ */
const UI = {
  confetti(n) {
    n = n || 12;
    if (store.theme === "girl") UI.hearts(Math.max(24, n * 2));
    else UI.fireworks(Math.max(4, Math.round(n / 4)));
  },

  _fx() { return $("#fx-layer"); },

  flash() {
    const l = UI._fx();
    if (!l) return;
    const d = document.createElement("div");
    d.className = "flash";
    l.appendChild(d);
    setTimeout(() => d.remove(), 700);
  },

  hearts(n) {
    const l = UI._fx();
    if (!l) return;
    const set = ["💗", "💖", "💕", "❤️", "💝", "🩷", "🌸"];
    n = n || 16;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "heart-fall";
      s.textContent = set[Math.floor(Math.random() * set.length)];
      s.style.left = (2 + Math.random() * 94) + "vw";
      s.style.fontSize = (16 + Math.random() * 26).toFixed(0) + "px";
      s.style.setProperty("--sway", (Math.random() * 80 - 40).toFixed(0) + "px");
      s.style.animationDuration = (1.4 + Math.random() * 1.4).toFixed(2) + "s";
      s.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
      s.addEventListener("animationend", () => s.remove());
      l.appendChild(s);
    }
  },

  fireworks(shells) {
    const l = UI._fx();
    if (!l) return;
    shells = shells || 4;
    const w = window.innerWidth, h = window.innerHeight;
    for (let i = 0; i < shells; i++) {
      const x = w * (0.08 + Math.random() * 0.84);
      const ty = h * (0.10 + Math.random() * 0.40);
      const rk = document.createElement("span");
      rk.className = "fw-rocket";
      rk.textContent = "✨";
      rk.style.left = x.toFixed(0) + "px";
      rk.style.top = h.toFixed(0) + "px";
      rk.style.fontSize = "20px";
      rk.style.setProperty("--ty", (ty - h).toFixed(0) + "px");
      rk.style.animationDuration = (0.5 + Math.random() * 0.3).toFixed(2) + "s";
      rk.style.animationDelay = (i * 0.11 + Math.random() * 0.05).toFixed(2) + "s";
      rk.addEventListener("animationend", () => {
        rk.remove();
        UI.fireBurst(x, ty, 24 + Math.floor(Math.random() * 12));
      });
      l.appendChild(rk);
    }
  },

  fireBurst(x, y, n) {
    const l = UI._fx();
    if (!l) return;
    const set = (store.theme === "boy" ? ["✨", "⭐", "🌟", "💥", "🎇", "🎆"] : ["✨", "⭐", "🌟"]);
    n = n || 26;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "fw-spark";
      s.textContent = set[Math.floor(Math.random() * set.length)];
      s.style.left = x.toFixed(0) + "px";
      s.style.top = y.toFixed(0) + "px";
      const ang = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 150;
      s.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
      s.style.setProperty("--dy", (Math.sin(ang) * dist - 20).toFixed(1) + "px");
      s.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(0) + "deg");
      s.style.fontSize = (16 + Math.random() * 20).toFixed(0) + "px";
      s.style.animationDelay = (Math.random() * 0.05).toFixed(2) + "s";
      s.addEventListener("animationend", () => s.remove());
      l.appendChild(s);
    }
  },

  burst(x, y, n) {
    const l = UI._fx();
    if (!l) return;
    const em = (THEMES[store.theme] || THEMES.boy).confetti;
    n = n || 16;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "burst-p";
      s.textContent = em[Math.floor(Math.random() * em.length)];
      s.style.left = x + "px";
      s.style.top = y + "px";
      const ang = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 160;
      s.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
      s.style.setProperty("--dy", (Math.sin(ang) * dist - 30).toFixed(1) + "px");
      s.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(0) + "deg");
      s.style.fontSize = (18 + Math.random() * 22).toFixed(0) + "px";
      s.style.animationDelay = (Math.random() * 0.08).toFixed(2) + "s";
      s.addEventListener("animationend", () => s.remove());
      l.appendChild(s);
    }
  },

  praise(emoji) {
    const l = UI._fx();
    if (!l) return;
    const set = ["👍", "💯"];
    const el = document.createElement("div");
    el.className = "praise";
    el.textContent = emoji || set[Math.floor(Math.random() * set.length)];
    l.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  },

  celebrate(el, opts) {
    const o = opts || {};
    const big = o.big !== false;
    UI.flash();
    if (store.theme === "girl") UI.hearts(big ? 40 : 20);
    else UI.fireworks(big ? 6 : 3);
    if (el) {
      const r = el.getBoundingClientRect();
      UI.burst(r.left + r.width / 2, r.top + r.height / 2, big ? 16 : 8);
    }
    if (o.praise !== false) UI.praise(o.emoji);
  },

  setPlayTitle(text) {
    const el = $("#play-progress");
    if (el) el.innerHTML = `<span class="prog-text">${text}</span>`;
  },
  hideProgress() { const el = $("#play-progress"); if (el) el.innerHTML = ""; },
};

/* ============================================================
   Decor + theme
   ============================================================ */
function buildDecor() {
  const th = THEMES[store.theme];
  const el = $("#decor");
  if (!th || !el) return;
  el.innerHTML = "";

  const vw = window.innerWidth, vh = window.innerHeight;
  const narrow = vw <= 900 || vh <= 620;

  const nLeft = th.decor.filter(d => d.side === "left").length;
  const nRight = th.decor.filter(d => d.side === "right").length;
  let iLeft = 0, iRight = 0;

  th.decor.forEach((d, i) => {
    const s = document.createElement("span");
    s.className = "deco " + d.side;
    s.textContent = d.e;
    s.style.animationDuration = (6 + (i % 4) * 1.3) + "s";
    s.style.animationDelay = (-i * 1.1) + "s";

    if (narrow) {
      const isLeft = d.side === "left";
      const idx = isLeft ? iLeft++ : iRight++;
      const n = isLeft ? nLeft : nRight;
      const size = Math.round(Math.max(20, Math.min(d.size * 0.32, 30)));
      const pad = size / 2 + 6;
      const step = (vw - pad * 2) / Math.max(1, n);
      const cx = pad + step * (idx + 0.5);
      const drift = 28;
      const y = isLeft
        ? 6 + (idx % 2) * 8
        : Math.max(4, vh - size - drift - 6 - (idx % 2) * 8);
      s.style.left = Math.round(cx - size / 2) + "px";
      s.style.top = Math.round(y) + "px";
      s.style.fontSize = size + "px";
    } else {
      const gutter = Math.max(0, (vw - Math.min(900, vw)) / 2);
      const size = Math.round(Math.min(d.size, Math.max(38, gutter * 0.95)));
      const maxX = Math.max(2, gutter - size - 6);
      const x = Math.round(maxX * d.x);
      if (d.side === "left") s.style.left = x + "px";
      else s.style.right = x + "px";
      s.style.top = d.y + "%";
      s.style.fontSize = size + "px";
    }
    el.appendChild(s);
  });
}

function applyTheme(theme) {
  store.theme = THEME_KEYS.indexOf(theme) >= 0 ? theme : "boy";
  saveStore();
  document.body.className = "theme-" + store.theme;
  buildDecor();
  const th = THEMES[store.theme] || THEMES.boy;
  ["#menu-avatar", "#menu-avatar-g"].forEach(sel => {
    const av = $(sel);
    if (av) av.textContent = th.avatar;
  });
}

/* ============================================================
   Menu: hiện mode theo cách học
   ============================================================ */
function buildMenu() {
  const sub = $("#menu-sub");
  const grid = $("#mode-grid");
  const pk = store.way === "preschool";
  if (grid) grid.classList.toggle("grid-6", pk);

  document.querySelectorAll(".mode-card").forEach(card => {
    const mode = card.dataset.mode;
    const m = MODES[mode];
    const lock = card.querySelector(".mode-lock");
    /* Mẫu giáo: chỉ hiện 6 chế độ phù hợp, xếp lại theo lộ trình học */
    const visible = !pk || PRESCHOOL_MODES.indexOf(mode) >= 0;
    card.classList.toggle("hidden", !visible);
    card.style.order = pk ? String(PRESCHOOL_MODES.indexOf(mode)) : "";
    /* Mẫu giáo: tên + biểu tượng riêng cho phụ huynh dễ hiểu */
    const info = (pk && PRESCHOOL_INFO[mode]) ? PRESCHOOL_INFO[mode] : m;
    const icoEl = card.querySelector(".mode-icon");
    const nameEl = card.querySelector(".mode-name");
    if (icoEl && info) icoEl.textContent = info.icon;
    if (nameEl && info) nameEl.textContent = info.name;

    const locked = store.way === "class" && m && store.grade < m.min;
    card.classList.toggle("locked", !!locked);
    if (lock) lock.textContent = locked ? `🔒 Từ lớp ${m.min}` : "";
  });

  if (store.way === "class") {
    if (sub) sub.textContent = `🎓 Lớp ${store.grade} — ${GRADES[store.grade]}`;
  } else if (pk) {
    if (sub) sub.textContent = "🌟 Mẫu giáo — bé nghe rồi chọn hình";
  } else {
    if (sub) sub.textContent = "🎮 Chọn mức khi chơi";
  }
}

/* Nút 🔊 trên thanh chơi: chỉ hiện khi bé học Mẫu giáo (máy đọc câu hỏi) */
function updateVoiceBtn(grade) {
  const b = $("#btn-voice");
  if (!b) return;
  const pre = grade === 0;
  b.classList.toggle("gone", !pre);
  b.textContent = Voice.isOn() ? "🔊" : "🔇";
  b.title = Voice.isOn() ? "Tắt đọc câu hỏi" : "Bật đọc câu hỏi";
}

/* Vào chơi — luôn clamp grade ≥ mức mở khoá của mode (mở nhẹ, không rơi vào nhánh khó).
   Riêng Mẫu giáo (grade 0) chạy đúng mức 0 — không áp mức mở khoá của lớp.
   store.grade KHÔNG đổi — chỉ lớp bé chọn ở màn Chọn Lớp mới ghi. */
function startMode(mode, grade) {
  const m = MODES[mode];
  const g = grade === 0 ? 0 : Math.max(grade, m.min);
  playCtx = { mode, grade: g };
  saveStore();
  const info = (g === 0 && PRESCHOOL_INFO[mode]) ? PRESCHOOL_INFO[mode] : m;
  updateVoiceBtn(g);
  show("screen-play");
  Game.start(mode, g, info.name, info.icon);
}

function exitToMenu() {
  Game.cancel();
  playCtx = null;
  buildMenu();
  show("screen-menu");
}

/* ============================================================
   Popup tổng kết phiên
   ============================================================ */
function openSummary() {
  const s = Game.stats();
  const ratio = s.total ? s.correct / s.total : 0;
  let emoji, title, rating;
  if (ratio >= 0.9) { emoji = "🏆"; title = "Giỏi quá!"; rating = "🌟 Xuất sắc"; }
  else if (ratio >= 0.7) { emoji = "🎉"; title = "Giỏi lắm!"; rating = "👍 Tốt"; }
  else if (ratio >= 0.5) { emoji = "💪"; title = "Khá giỏi!"; rating = "💪 Trung bình"; }
  else { emoji = "🌱"; title = "Cố lên nhé!"; rating = "🌱 Yếu"; }

  $("#summary-emoji").textContent = emoji;
  $("#summary-title").textContent = title;
  $("#summary-correct").textContent = s.correct;
  $("#summary-total").textContent = s.total;
  $("#summary-stars").textContent = "⭐".repeat(Math.max(1, Math.min(5, Math.ceil(ratio * 5))));
  $("#summary-rating").textContent = rating;
  $("#summary-popup").classList.add("open");
  if (ratio >= 0.7) { Sfx.win(); UI.confetti(24); }
  Game.pause();
}
function closeSummary() {
  $("#summary-popup").classList.remove("open");
}

/* ============================================================
   Init
   ============================================================ */
function init() {
  /* Chọn bé */
  document.querySelectorAll(".choose-card[data-theme]").forEach(card => {
    card.onclick = () => {
      Sfx.warm();
      Sfx.click();
      applyTheme(card.dataset.theme);
      if (store.way) { goWay(store.way); } else show("screen-way");
    };
  });

  /* Chọn cách học */
  document.querySelectorAll(".choose-card[data-way]").forEach(card => {
    card.onclick = () => {
      Sfx.click();
      goWay(card.dataset.way);
    };
  });

  function goWay(way) {
    store.way = way;
    saveStore();
    if (way === "class") show("screen-grade");
    else { buildMenu(); show("screen-menu"); }
  }

  $("#btn-grade-back").onclick = () => { Sfx.click(); show("screen-way"); };

  /* Chọn lớp */
  document.querySelectorAll(".grade-card").forEach(card => {
    card.onclick = () => {
      Sfx.click();
      store.grade = parseInt(card.dataset.grade, 10);
      saveStore();
      buildMenu();
      show("screen-menu");
    };
  });

  /* Menu: đổi cách học / đổi bé */
  $("#btn-switch").onclick = () => { Sfx.click(); show("screen-way"); };
  $("#menu-avatar").onclick = () => { Sfx.click(); applyTheme(store.theme === "girl" ? "boy" : "girl"); };

  /* Bấm mode */
  const levelPopup = $("#level-popup");
  let pendingMode = null;
  document.querySelectorAll(".mode-card").forEach(card => {
    card.onclick = () => {
      Sfx.click();
      const mode = card.dataset.mode;
      if (store.way === "preschool") {
        /* Mẫu giáo: vào chơi ngay ở mức 0–10, không cần chọn mức */
        startMode(mode, 0);
      } else if (store.way === "class") {
        /* lớp thấp → mode khoá: vẫn cho chơi ở mức nhỏ nhất của mode */
        const m = MODES[mode];
        startMode(mode, store.grade < m.min ? m.min : store.grade);
      } else {
        pendingMode = mode;
        $("#level-title").textContent = `${MODES[mode].icon} ${MODES[mode].name} — chọn mức`;
        levelPopup.classList.add("open");
      }
    };
  });
  document.querySelectorAll(".level-card").forEach(card => {
    card.onclick = () => {
      Sfx.click();
      levelPopup.classList.remove("open");
      if (pendingMode) startMode(pendingMode, parseInt(card.dataset.level, 10));
      pendingMode = null;
    };
  });
  const closeLevel = () => { Sfx.click(); levelPopup.classList.remove("open"); pendingMode = null; };
  $("#level-close").onclick = closeLevel;
  $("#level-backdrop").onclick = closeLevel;

  /* Trở về menu → popup tổng kết nếu bé đã chơi */
  $("#btn-back").onclick = () => {
    Sfx.click();
    if (Game.hasPlayed()) openSummary();
    else exitToMenu();
  };
  $("#btn-continue").onclick = () => { Sfx.click(); closeSummary(); Game.resume(); };
  $("#btn-exit").onclick = () => { Sfx.click(); closeSummary(); exitToMenu(); };

  /* 🔊 Bật / tắt đọc câu hỏi (dành cho bé Mẫu giáo) */
  const voiceBtn = $("#btn-voice");
  if (voiceBtn) voiceBtn.onclick = () => {
    Sfx.click();
    const on = Voice.toggle();
    updateVoiceBtn(playCtx ? playCtx.grade : -1);
    if (on) Voice.speak("Đã bật đọc câu hỏi");
  };

  /* Popup donate — giữ nguyên behocchu */
  const donate = $("#donate-popup");
  const closeDonate = () => { if (donate) donate.classList.remove("open"); };
  document.querySelectorAll(".donate-btn").forEach(b => b.addEventListener("click", () => {
    Sfx.click();
    if (donate) donate.classList.add("open");
  }));
  if ($("#donate-backdrop")) $("#donate-backdrop").addEventListener("click", closeDonate);
  if ($("#donate-close")) $("#donate-close").addEventListener("click", () => { Sfx.click(); closeDonate(); });

  const copyBtn = $("#donate-copy");
  if (copyBtn) copyBtn.addEventListener("click", async () => {
    const numEl = $("#donate-stk-num");
    const stk = (numEl ? numEl.textContent : "").trim();
    Sfx.click();
    let ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(stk);
        ok = true;
      }
    } catch (e) { ok = false; }
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = stk;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, stk.length);
        ok = document.execCommand("copy");
        ta.remove();
      } catch (e) { ok = false; }
    }
    copyBtn.textContent = ok ? "✅ Đã copy STK" : "❌ Không copy được";
    copyBtn.disabled = true;
    setTimeout(() => { copyBtn.textContent = "📋 Copy STK"; copyBtn.disabled = false; }, 1600);
  });

  document.addEventListener("pointerdown", () => Sfx.warm(), { once: true });

  /* Fit — mọi màn hình luôn vừa viewport, không scroll */
  const ro = new ResizeObserver(entries => {
    for (const e of entries) {
      const sc = e.target.closest(".screen");
      if (sc && sc.classList.contains("active")) fitScreen(sc);
    }
  });
  document.querySelectorAll(".screen .fit").forEach(f => ro.observe(f));

  let rzT;
  const refit = delay => {
    clearTimeout(rzT);
    rzT = setTimeout(() => {
      if (store.theme) buildDecor();
      fitScreen(document.querySelector(".screen.active"));
    }, delay);
  };
  window.addEventListener("resize", () => refit(160));
  window.addEventListener("orientationchange", () => refit(260));

  /* Màn hình đầu */
  if (!store.theme) {
    document.body.className = "theme-boy";
    show("screen-choose");
  } else if (!store.way) {
    applyTheme(store.theme);
    show("screen-way");
  } else if (store.way === "class") {
    applyTheme(store.theme);
    buildMenu();
    show("screen-grade");
  } else {
    applyTheme(store.theme);
    buildMenu();
    show("screen-menu");
  }
}

document.addEventListener("DOMContentLoaded", init);

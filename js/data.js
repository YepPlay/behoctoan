/* ============================================================
   BÉ HỌC TOÁN — Dữ liệu & sinh câu hỏi (lớp 1–5)
   ============================================================ */

/* ---------- Helper sinh số ngẫu nhiên ---------- */
function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }

/* Định dạng số: dấu chấm nghìn kiểu Việt (1.000) */
function fmtN(n) {
  if (!Number.isFinite(n)) return String(n);
  const neg = n < 0;
  n = Math.abs(n);
  const s = Number.isInteger(n) ? String(n) : String(n);
  const parts = s.split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + int + (parts[1] ? "," + parts[1] : "");
}
/* Định dạng thập phân: dấu phẩy (3,5) */
function fmtD(x, dp) {
  return x.toFixed(dp == null ? 1 : dp).replace(".", ",");
}

/* Trộn + chọn đáp án (luôn gói ≤ 4 lựa chọn, giữ chắc đáp án đúng) */
function pickIdx(strs, correct) {
  let set = strs.slice();
  if (set.indexOf(correct) < 0) set[0] = correct;
  if (set.length > 4) set = [correct].concat(set.filter(x => String(x) !== String(correct)).slice(0, 3));
  const s = shuffle(set);
  return { choices: s, answer: s.indexOf(correct) };
}
/* Đáp án số + 3 lựa chọn nhiễu gần đúng */
function numChoices(ans, min) {
  min = min == null ? 0 : min;
  const set = [ans];
  const offs = shuffle([1, -1, 2, -2, 5, -5, 10, -10, 100, -100, Math.max(3, Math.round(Math.abs(ans) * 0.1))]);
  for (const o of offs) {
    if (set.length >= 4) break;
    const c = ans + o;
    if (c === ans || c < min || !Number.isFinite(c)) continue;
    if (Number.isInteger(ans) && !Number.isInteger(c)) continue;
    if (set.indexOf(c) < 0) set.push(c);
  }
  let k = 1;
  while (set.length < 4) { if (ans + k >= min && set.indexOf(ans + k) < 0) set.push(ans + k); k++; }
  return pickIdx(set.map(fmtN), fmtN(ans));
}
/* Đáp án chuỗi + 3 chuỗi khác trong pool */
function strChoices(correct, pool) {
  const others = shuffle(pool.filter(x => x !== correct));
  const set = [correct];
  for (const o of others) { if (set.length >= 4) break; set.push(o); }
  return pickIdx(set, correct);
}
/* Câu hỏi có/không đáp án số — dùng cho gợi ý */
function makeQ(html, choicesObj, prompt) {
  return { html: html || "", prompt: prompt || "", choices: choicesObj.choices, answer: choicesObj.answer };
}

/* ---------- Số đọc bằng chữ (0–999, an toàn SGK) ---------- */
const VN_D = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
function vn2(n) {
  if (n < 10) return VN_D[n];
  if (n < 20) return "mười" + (n === 10 ? "" : (n === 15 ? " lăm" : " " + VN_D[n - 10]));
  const t = Math.floor(n / 10), o = n % 10;
  let s = VN_D[t] + " mươi";
  if (o === 0) return s;
  if (o === 1) return s + " mốt";
  if (o === 5) return s + " lăm";
  return s + " " + VN_D[o];
}
function vn3(n) {
  if (n < 100) return vn2(n);
  const h = Math.floor(n / 100), r = n % 100;
  let s = VN_D[h] + " trăm";
  if (r === 0) return s;
  if (r < 10) return s + " lẻ " + VN_D[r];
  return s + " " + vn2(r);
}
function vnWords(n) {
  if (n < 1000) return vn3(n);
  const th = Math.floor(n / 1000), r = n % 1000;
  const s = vn3(th) + " nghìn";
  if (r === 0) return s;
  /* 1.050 → "một nghìn không trăm năm mươi"; 1.005 → "một nghìn không trăm lăm" */
  if (r < 100) return s + " không trăm " + (r < 10 ? VN_D[r] : vn2(r));
  return s + " " + vn3(r);
}

/* ---------- Hình SVG ---------- */
function svgShape(name, size) {
  const S = size || 120;
  const f = "var(--primary-l)", st = "var(--primary)";
  const open = `<svg class="shape-svg" width="${S}" height="${S}" viewBox="0 0 100 100">`;
  const w = `stroke="${st}" stroke-width="5" fill="${f}"`;
  switch (name) {
    case "tròn": return open + `<circle cx="50" cy="50" r="44" ${w}/></svg>`;
    case "vuông": return open + `<rect x="9" y="9" width="82" height="82" ${w}/></svg>`;
    case "chữ nhật": return open + `<rect x="4" y="24" width="92" height="52" ${w}/></svg>`;
    case "tam giác": return open + `<polygon points="50,8 94,88 6,88" ${w}/></svg>`;
    case "ngôi sao": return open + `<polygon points="50,5 62,38 97,38 69,59 80,93 50,72 20,93 31,59 3,38 38,38" ${w}/></svg>`;
    case "ngũ giác": return open + `<polygon points="50,6 95,39 78,93 22,93 5,39" ${w}/></svg>`;
    case "lục giác": return open + `<polygon points="28,8 72,8 95,50 72,92 28,92 5,50" ${w}/></svg>`;
    case "thang": return open + `<polygon points="25,12 75,12 95,88 5,88" ${w}/></svg>`;
    case "hình bình hành": return open + `<polygon points="25,15 95,15 75,85 5,85" ${w}/></svg>`;
    default: return open + `<circle cx="50" cy="50" r="44" ${w}/></svg>`;
  }
}
const SHAPE_NAMES = ["tròn", "vuông", "chữ nhật", "tam giác", "ngôi sao", "ngũ giác", "lục giác", "thang", "hình bình hành"];
const SHAPE_SIDES = { "tròn": 0, "vuông": 4, "chữ nhật": 4, "tam giác": 3, "ngôi sao": 10, "ngũ giác": 5, "lục giác": 6, "thang": 4, "hình bình hành": 4 };

/* Phân số: hình k/ng chia ô */
function fracSvg(k, n) {
  const W = 220, H = 70, bw = W / n;
  let parts = "";
  for (let i = 0; i < n; i++) {
    parts += `<rect x="${(i * bw).toFixed(1)}" y="2" width="${bw.toFixed(1)}" height="${H - 4}" fill="${i < k ? "var(--primary-l)" : "#fff"}" stroke="var(--primary)" stroke-width="3"/>`;
  }
  return `<svg class="frac-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts}</svg>`;
}
function fracStr(k, n) { const g = gcd(k, n); return (k / g) + "/" + (n / g); }

/* ---------- CẤU HÌNH ---------- */
const MODES = {
  num:     { name: "Học Số",         icon: "🔢", min: 1 },
  calc:    { name: "Cộng & Trừ",     icon: "➕", min: 1 },
  cmp:     { name: "So Sánh",        icon: "⚖️", min: 1 },
  mul:     { name: "Nhân & Chia",     icon: "✖️", min: 2 },
  frac:    { name: "Phân Số",        icon: "🍕", min: 3 },
  dec:     { name: "Số Thập Phân",   icon: "💰", min: 4 },
  pct:     { name: "Phần Trăm",      icon: "🏷️", min: 5 },
  measure: { name: "Đo & Đo Lường",  icon: "📏", min: 2 },
  shape:   { name: "Hình Học",       icon: "🔷", min: 1 },
  story:   { name: "Toán Lời Văn",   icon: "📖", min: 1 },
};

const GRADES = {
  1: "Số 0–100 · Cộng trừ · Đếm hình",
  2: "Đến 1.000 · Bảng nhân · Đo lường",
  3: "Đến 100.000 · Phân số · Làm tròn",
  4: "Thập phân · Diện tích · Nhân chia lớn",
  5: "Phần trăm · Phân số · Vận tốc",
};

const THEMES = {
  boy: {
    label: "Bé Trai", avatar: "🧒",
    decor: [
      { e: "🚀", side: "left",  x: 0.20, y: 6,  size: 86 },
      { e: "➕", side: "right", x: 0.15, y: 10, size: 62 },
      { e: "🤖", side: "left",  x: 0.62, y: 27, size: 78 },
      { e: "⚽", side: "right", x: 0.50, y: 38, size: 92 },
      { e: "✈️", side: "left",  x: 0.10, y: 52, size: 84 },
      { e: "🧮", side: "right", x: 0.62, y: 63, size: 66 },
      { e: "🌟", side: "left",  x: 0.52, y: 76, size: 70 },
      { e: "🛰️", side: "right", x: 0.22, y: 88, size: 80 },
    ],
    confetti: ["🚀", "➕", "🤖", "⚽", "🧮", "🌟"],
  },
  girl: {
    label: "Bé Gái", avatar: "👧",
    decor: [
      { e: "🦋", side: "left",  x: 0.20, y: 6,  size: 84 },
      { e: "🌈", side: "right", x: 0.18, y: 11, size: 74 },
      { e: "🌸", side: "left",  x: 0.60, y: 26, size: 70 },
      { e: "🎀", side: "right", x: 0.48, y: 37, size: 82 },
      { e: "🦄", side: "left",  x: 0.12, y: 51, size: 90 },
      { e: "🌺", side: "right", x: 0.60, y: 62, size: 68 },
      { e: "⭐", side: "left",  x: 0.50, y: 75, size: 62 },
      { e: "✨", side: "right", x: 0.24, y: 87, size: 76 },
    ],
    confetti: ["🌸", "🎀", "🦋", "🌈", "⭐", "🌺"],
  },
};

/* ============================================================
   SINH CÂU HỎI THEO CHẾ ĐỘ
   Mỗi câu: { html, prompt, choices[], answer } — sinh vô hạn, random
   ============================================================ */
const QUESTIONS = {};

/* ---------- 1. HỌC SỐ ---------- */
QUESTIONS.num = function (g) {
  const kinds = g === 1 ? ["count", "words", "seq", "even"]
    : g === 2 ? ["words", "place", "seq", "even"]
    : g === 3 ? ["place", "round", "seq"]
    : ["place", "value", "round"];
  const k = pick(kinds);

  if (k === "count") {
    const n = ri(3, 20);
    const em = pick(["🍎", "🍬", "⚽", "🌸", "🍪", "⭐"]);
    return makeQ(`<div class="q-emoji-row">${em.repeat(n)}</div>`, numChoices(n, 0), "Có bao nhiêu hình?");
  }
  if (k === "words") {
    const n = g === 1 ? ri(11, 99) : ri(101, 999);
    return makeQ(`<div class="q-word">“${vnWords(n)}”</div>`, numChoices(n, 0), "Số nào được đọc là:");
  }
  if (k === "seq") {
    const step = ri(1, g === 1 ? 3 : 5);
    const a = ri(1, g === 1 ? 60 : 500);
    return makeQ(`<div class="q-line">${fmtN(a)} · ? · ${fmtN(a + step * 2)}</div>`, numChoices(a + step, 0), "Số thiếu là:");
  }
  if (k === "even") {
    const wantEven = Math.random() < 0.5;
    let base = ri(5, 90);
    if (wantEven) base += base % 2 === 0 ? 0 : 1; else base += base % 2 === 1 ? 0 : 1;
    const set = [base];
    while (set.length < 4) {
      const c = base + ri(1, 7) * (Math.random() < 0.5 ? 1 : -1) * 2;
      if (c > 0 && set.indexOf(c) < 0) set.push(c);
    }
    const strs = set.map(String);
    const right = wantEven
      ? set.find(x => x % 2 === 0)
      : set.find(x => x % 2 === 1);
    return makeQ("", pickIdx(strs, String(right)), wantEven ? "Số nào là số chẵn?" : "Số nào là số lẻ?");
  }
  if (k === "place") {
    const max = g === 2 ? 999 : 99999;
    const n = ri(g === 2 ? 100 : 1000, max);
    const digits = String(n).split("");
    const i = ri(0, digits.length - 1);
    const houses = ["đơn vị", "chục", "trăm", "nghìn", "chục nghìn"];
    const house = houses[digits.length - 1 - i];
    return makeQ(`<div class="q-big">${fmtN(n)}</div>`,
      strChoices(house, ["đơn vị", "chục", "trăm", "nghìn", "chục nghìn"]),
      `Chữ số ${digits[i]} ở hàng nào?`);
  }
  if (k === "value") {
    const len = ri(3, g === 5 ? 7 : 5);
    let n = ri(1, 9);
    for (let i = 1; i < len; i++) n = n * 10 + ri(0, 9);
    const digits = String(n).split("");
    const i = ri(0, digits.length - 1);
    const d = Number(digits[i]);
    if (d === 0) return QUESTIONS.num(g);
    const val = d * Math.pow(10, digits.length - 1 - i);
    return makeQ(`<div class="q-big">${fmtN(n)}</div>`, numChoices(val, 1), `Giá trị của chữ số ${d} là:`);
  }
  /* round */
  const t = pick(g === 3 ? [10, 100] : [100, 1000, 10000]);
  const a = ri(1, 50) * t + ri(1, t - 1);
  const r = Math.round(a / t) * t;
  return makeQ(`<div class="q-big">${fmtN(a)}</div>`, numChoices(r, 0),
    `Làm tròn ${fmtN(a)} đến hàng ${t === 10 ? "chục" : t === 100 ? "trăm" : t === 1000 ? "nghìn" : "chục nghìn"}:`);
};

/* ---------- 2. CỘNG & TRỪ ---------- */
QUESTIONS.calc = function (g) {
  const three = g >= 4 && Math.random() < 0.35;
  if (three) {
    const a = ri(100, g === 5 ? 50000 : 5000);
    const b = ri(10, 900);
    const c = ri(1, Math.min(b, 800));
    const ans = a + b - c;
    return makeQ(`<div class="q-line">${fmtN(a)} + ${fmtN(b)} − ${fmtN(c)} = ?</div>`, numChoices(ans, 0));
  }
  const plus = Math.random() < 0.55;
  let a, b, ans;
  if (g === 1) {
    if (plus) { a = ri(2, 80); b = ri(1, 99 - a); ans = a + b; }
    else { a = ri(5, 99); b = ri(1, a - 1); ans = a - b; }
  } else if (g === 2) {
    if (plus) { a = ri(20, 900); b = ri(10, 999 - a); ans = a + b; }
    else { a = ri(50, 999); b = ri(10, a - 1); ans = a - b; }
  } else if (g === 3) {
    if (plus) { a = ri(500, 90000); b = ri(100, 99999 - a); ans = a + b; }
    else { a = ri(1000, 99999); b = ri(100, a - 1); ans = a - b; }
  } else {
    if (plus) { a = ri(5000, 900000); b = ri(500, 999999 - a); ans = a + b; }
    else { a = ri(10000, 999999); b = ri(500, a - 1); ans = a - b; }
  }
  /* Thiếu số: a + ? = c */
  if (g >= 2 && Math.random() < 0.25) {
    const sum = a + b;
    return makeQ(`<div class="q-line">${fmtN(a)} + ? = ${fmtN(sum)}</div>`, numChoices(b, 0), "Số thiếu là:");
  }
  const op = plus ? "+" : "−";
  return makeQ(`<div class="q-line">${fmtN(a)} ${op} ${fmtN(b)} = ?</div>`, numChoices(ans, 0));
};

/* ---------- 3. SO SÁNH ---------- */
QUESTIONS.cmp = function (g) {
  const SYMS = ["<", "=", ">"];
  function q(lText, rText, lv, rv) {
    const sym = lv < rv ? "<" : lv > rv ? ">" : "=";
    return makeQ(`<div class="q-cmp"><span class="cmp-box">${lText}</span><span class="cmp-op">?</span><span class="cmp-box">${rText}</span></div>`,
      pickIdx(SYMS, sym), "Điền dấu so sánh:");
  }
  if (g === 1) {
    const a = ri(1, 99), b = Math.random() < 0.25 ? a : ri(1, 99);
    return q(fmtN(a), fmtN(b), a, b);
  }
  if (g === 2) {
    if (Math.random() < 0.5) { const a = ri(10, 999), b = Math.random() < 0.25 ? a : ri(10, 999); return q(fmtN(a), fmtN(b), a, b); }
    const a = ri(10, 400), b = ri(10, 400), c = Math.random() < 0.3 ? a + b : ri(10, 999);
    return q(`${fmtN(a)} + ${fmtN(b)}`, fmtN(c), a + b, c);
  }
  if (g === 3 || g === 4) {
    if (g === 4 && Math.random() < 0.5) {
      const a = ri(1, 90) / 10, b = Math.random() < 0.25 ? a : ri(1, 90) / 10;
      return q(fmtD(a, 1), fmtD(b, 1), a, b);
    }
    const a1 = ri(1, 50), b1 = ri(1, 50), c1 = ri(1, 50), d1 = ri(1, 50);
    if (Math.random() < 0.5) return q(`${fmtN(a1)} + ${fmtN(b1)}`, `${fmtN(c1)} + ${fmtN(d1)}`, a1 + b1, c1 + d1);
    const a = ri(10, 500), b = ri(10, 500), c = Math.random() < 0.3 ? a + b : ri(10, 999);
    return q(`${fmtN(a)} + ${fmtN(b)}`, fmtN(c), a + b, c);
  }
  /* lớp 5: phân số / thập phân */
  if (Math.random() < 0.5) {
    const n1 = ri(1, 9), d1 = ri(n1 + 1, 12);
    const n2 = Math.random() < 0.3 ? n1 : ri(1, 9), d2 = Math.random() < 0.3 ? d1 : ri(n2 + 1, 12);
    return q(`${n1}/${d1}`, `${n2}/${d2}`, n1 / d1, n2 / d2);
  }
  const a = ri(1, 999) / 100, b = Math.random() < 0.25 ? a : ri(1, 999) / 100;
  return q(fmtD(a, 2), fmtD(b, 2), a, b);
};

/* ---------- 4. NHÂN & CHIA ---------- */
QUESTIONS.mul = function (g) {
  const div = Math.random() < 0.45;
  let a, b, ans;
  if (g === 2) {
    if (div) { b = ri(2, 9); ans = ri(2, 9); a = b * ans; }
    else { a = ri(2, 9); b = ri(2, 9); ans = a * b; }
  } else if (g === 3) {
    if (div) { b = ri(2, 9); ans = ri(11, 60); a = b * ans; }
    else { a = ri(11, 99); b = ri(2, 9); ans = a * b; }
  } else if (g === 4) {
    if (div) { b = ri(3, 20); ans = ri(11, 99); a = b * ans; }
    else { a = ri(101, 999); b = ri(3, 20); ans = a * b; }
  } else {
    if (div) { b = ri(4, 30); ans = ri(11, 199); a = b * ans; }
    else { a = ri(101, 999); b = ri(4, 30); ans = a * b; }
  }
  if (!div && g >= 3 && Math.random() < 0.25) {
    return makeQ(`<div class="q-line">${fmtN(a)} × ? = ${fmtN(ans)}</div>`, numChoices(b, 1), "Số thiếu là:");
  }
  const op = div ? "÷" : "×";
  return makeQ(`<div class="q-line">${fmtN(a)} ${op} ${fmtN(b)} = ?</div>`, numChoices(ans, 0));
};

/* ---------- 5. PHÂN SỐ ---------- */
QUESTIONS.frac = function (g) {
  if (g === 3 && Math.random() < 0.5) {
    const n = ri(2, 8), k = ri(1, n - 1);
    return makeQ(`<div class="frac-wrap">${fracSvg(k, n)}</div>`,
      strChoices(`${k}/${n}`, ["1/2", "1/3", "1/4", "2/3", "3/4", "1/5", "2/5", `${k}/${n}`]),
      "Hình tô màu là phân số nào?");
  }
  if (g === 5 && Math.random() < 0.55) {
    const op = pick(["+", "−", "×", "÷"]);
    const n1 = ri(2, 9), d1 = ri(2, 9), n2 = ri(1, 9), d2 = ri(2, 9);
    let ans;
    if (op === "+" || op === "−") {
      const lcm = (d1 * d2) / gcd(d1, d2);
      const nn = op === "+" ? n1 * (lcm / d1) + n2 * (lcm / d2) : n1 * (lcm / d1) - n2 * (lcm / d2);
      if (nn <= 0) return QUESTIONS.frac(g);
      ans = fracStr(nn, lcm);
    } else if (op === "×") ans = fracStr(n1 * n2, d1 * d2);
    else { if (n2 === 0) return QUESTIONS.frac(g); ans = fracStr(n1 * d2, d1 * n2); }
    return makeQ(`<div class="q-line">${n1}/${d1} ${op} ${n2}/${d2} = ?</div>`,
      strChoices(ans, ["1/2", "1/3", "1/4", "2/3", "3/4", "1/5", "5/6", "7/8", ans]), "Chọn phân số đúng:");
  }
  /* cộng phân số bằng mẫu (lớp 3–4) */
  const n = ri(3, 10), k1 = ri(1, n - 1), k2 = ri(1, n - k1);
  const ans = fracStr(k1 + k2, n);
  return makeQ(`<div class="q-line">${k1}/${n} + ${k2}/${n} = ?</div>`,
    strChoices(ans, ["1/2", "1/3", "1/4", "2/3", "3/4", "5/8", "7/10", ans]), "Chọn phân số đúng:");
};

/* ---------- 6. SỐ THẬP PHÂN ---------- */
QUESTIONS.dec = function (g) {
  if (g === 4 && Math.random() < 0.4) {
    /* đọc số thập phân */
    const a = ri(1, 999) / 10;
    const s = fmtD(a, 1).split(",");
    const words = `${vn3(Number(s[0]))} phẩy ${vn2(Number(s[1]))}`;
    return makeQ(`<div class="q-word">“${words}”</div>`, strChoices(fmtD(a, 1),
      ["0,5", "1,5", "2,3", "4,7", "5,9", "7,2", "8,6", fmtD(a, 1)]), "Số thập phân nào được đọc là:");
  }
  const kind = pick(g === 4 ? ["add", "cmp4"] : ["add", "mul10", "sub"]);
  if (kind === "cmp4" || (kind === "sub" && false)) {
    const a = ri(1, 999) / 10, b = Math.random() < 0.25 ? a : ri(1, 999) / 10;
    const sym = a < b ? "<" : a > b ? ">" : "=";
    return makeQ(`<div class="q-cmp"><span class="cmp-box">${fmtD(a, 1)}</span><span class="cmp-op">?</span><span class="cmp-box">${fmtD(b, 1)}</span></div>`,
      pickIdx(["<", "=", ">"], sym), "Điền dấu so sánh:");
  }
  if (kind === "mul10") {
    const t = pick([10, 100, 1000]);
    const a = ri(1, 999) / 100;
    const ans = a * t;
    const dp = String(ans).split(".")[1] ? String(ans).split(".")[1].length : 0;
    return makeQ(`<div class="q-line">${fmtD(a, 2)} × ${t} = ?</div>`,
      pickIdx([fmtD(ans, Math.max(0, Math.min(2, dp))), fmtD(a, 2), fmtD(ans / 10, 2), fmtD(ans * 10, 2), fmtD(a / 10, 2)].filter((v, i, arr) => arr.indexOf(v) === i), fmtD(ans, Math.max(0, Math.min(2, dp)))),
      "Kết quả là:");
  }
  /* cộng/trừ thập phân */
  const dp = g === 4 ? 1 : 2;
  const a = ri(10, 999) / Math.pow(10, dp);
  const b = ri(1, Math.floor(a * Math.pow(10, dp)) - 1) / Math.pow(10, dp);
  const plus = Math.random() < 0.55;
  const ans = plus ? a + b : a - b;
  const res = fmtD(Number(ans.toFixed(dp)), dp);
  return makeQ(`<div class="q-line">${fmtD(a, dp)} ${plus ? "+" : "−"} ${fmtD(b, dp)} = ?</div>`,
    pickIdx([res, fmtD(Number((ans + 0.1).toFixed(dp)), dp), fmtD(Number((ans - 0.1).toFixed(dp)), dp), fmtD(Number((ans + 1).toFixed(dp)), dp), fmtD(Number((ans - 1).toFixed(dp)), dp)].filter((v, i, arr) => arr.indexOf(v) === i), res),
    "Kết quả là:");
};

/* ---------- 7. PHẦN TRĂM (lớp 5) ---------- */
QUESTIONS.pct = function (g) {
  const kind = pick(["of", "deal", "frac2pct"]);
  if (kind === "of") {
    const p = pick([10, 20, 25, 50, 75]);
    const base = ri(2, 20) * 100;
    const ans = base * p / 100;
    return makeQ(`<div class="q-line">${p}% của ${fmtN(base)} = ?</div>`, numChoices(ans, 0));
  }
  if (kind === "deal") {
    const p = pick([10, 20, 25, 50]);
    const price = ri(2, 50) * 10000;
    const save = price * p / 100;
    return makeQ(`<div class="q-money">🏷️ ${fmtN(price)}đ giảm ${p}%<br>Số tiền được giảm là:</div>`, numChoices(save, 0));
  }
  const k = pick([1, 2, 3, 4, 5]), n = pick([10, 20, 50, 100]);
  const ans = (k * 100) / n;
  return makeQ(`<div class="q-line">${k}/${n} = ? %</div>`, numChoices(ans, 0));
};

/* ---------- 8. ĐO & ĐO LƯỜNG ---------- */
QUESTIONS.measure = function (g) {
  const bank = {
    2: [["m", "cm", 100], ["giờ", "phút", 60], ["kg", "g", 1000]],
    3: [["m", "cm", 100], ["cm", "mm", 10], ["kg", "g", 1000], ["giờ", "phút", 60], ["phút", "giây", 60], ["km", "m", 1000]],
    4: [["km", "m", 1000], ["m", "dm", 10], ["kg", "g", 1000], ["giờ", "phút", 60], ["tấn", "kg", 1000]],
    5: [["l", "ml", 1000], ["m³", "l", 1000], ["km", "m", 1000], ["kg", "g", 1000], ["cm³", "ml", 1]],
  }[Math.max(2, Math.min(5, g))];
  const [big, small, k] = pick(bank);
  const n = pick([1, 2, 3, 5, 10]);
  if (g >= 4 && Math.random() < 0.35) {
    /* bài đo lời văn nhẹ */
    const t1 = 7 + ri(0, 3), m1 = ri(0, 55);
    const t2 = t1 + ri(1, 2), m2 = ri(0, 55);
    const mins = (t2 * 60 + m2) - (t1 * 60 + m1);
    return makeQ(`<div class="q-line">🚌 Từ ${t1} giờ ${m1} phút đến ${t2} giờ ${m2} phút<br>Hành trình dài bao nhiêu phút?</div>`, numChoices(mins, 1));
  }
  return makeQ(`<div class="q-line">${fmtN(n)} ${big} = ? ${small}</div>`, numChoices(n * k, 0));
};

/* ---------- 9. HÌNH HỌC ---------- */
QUESTIONS.shape = function (g) {
  if (g <= 2 && Math.random() < 0.6) {
    const name = pick(SHAPE_NAMES);
    return makeQ(`<div class="q-shape">${svgShape(name)}</div>`,
      strChoices(name === "tròn" ? "hình tròn" : name === "thang" ? "hình thang" : "hình " + name,
        ["hình tròn", "hình vuông", "hình chữ nhật", "hình tam giác", "ngôi sao", "hình ngũ giác", "hình lục giác", "hình thang"]),
      "Đây là hình gì?");
  }
  if (g <= 3) {
    const name = pick(Object.keys(SHAPE_SIDES).filter(s => SHAPE_SIDES[s] > 0));
    const sides = SHAPE_SIDES[name];
    const askVerts = Math.random() < 0.5;
    return makeQ(`<div class="q-shape">${svgShape(name)}</div>`, numChoices(sides, 1),
      askVerts ? "Hình này có bao nhiêu đỉnh?" : "Hình này có bao nhiêu cạnh?");
  }
  if (g === 4 && Math.random() < 0.5) {
    const l = ri(3, 30), w = ri(2, Math.min(20, l - 1));
    const per = 2 * (l + w);
    return makeQ(`<div class="q-line">▭ Hình chữ nhật dài ${l} cm, rộng ${w} cm<br>Chu vi = ?</div>`, numChoices(per, 4));
  }
  if (g >= 4 && Math.random() < 0.5) {
    const l = ri(3, 30), w = ri(2, Math.min(20, l - 1));
    const area = l * w;
    return makeQ(`<div class="q-line">▭ Hình chữ nhật dài ${l} cm, rộng ${w} cm<br>Diện tích = ? cm²</div>`, numChoices(area, 1));
  }
  const s = ri(2, 20);
  const kind = g >= 5 && Math.random() < 0.5 ? "area" : "per";
  return makeQ(`<div class="q-line">🟧 Hình vuông cạnh ${s} cm<br>${kind === "area" ? "Diện tích = ? cm²" : "Chu vi = ? cm"}</div>`,
    numChoices(kind === "area" ? s * s : 4 * s, 1));
};

/* ---------- 10. TOÁN LỜI VĂN ---------- */
const STORY_TPL = {
  1: [
    { t: v => `🍎 Bé có ${v.a} quả táo, mẹ cho thêm ${v.b} quả. Bé có bao nhiêu quả?`, gen: () => ({ a: ri(3, 50), b: ri(2, 40) }), f: v => v.a + v.b },
    { t: v => `🍬 Bé có ${v.a} viên kẹo, ăn mất ${v.b} viên. Còn bao nhiêu viên?`, gen: () => ({ a: ri(10, 90), b: ri(2, Math.min(40, 8)) }), f: v => v.a - v.b },
    { t: v => `🎈 Trong vườn có ${v.a} bông hoa, bé hái ${v.b} bông. Còn bao nhiêu bông?`, gen: () => ({ a: ri(15, 99), b: ri(3, 12) }), f: v => v.a - v.b },
  ],
  2: [
    { t: v => `🚗 Xe chạy ${v.a} km, dừng nghỉ rồi chạy thêm ${v.b} km. Hỏi xe đi tổng bao nhiêu km?`, gen: () => ({ a: ri(50, 500), b: ri(20, 400) }), f: v => v.a + v.b },
    { t: v => `📚 Mỗi chồng có ${v.a} quyển sách, có ${v.b} chồng. Hết bao nhiêu quyển?`, gen: () => ({ a: ri(3, 20), b: ri(2, 9) }), f: v => v.a * v.b },
    { t: v => `🏫 Lớp có ${v.a} bạn, chia đều ${v.b} nhóm. Mỗi nhóm mấy bạn?`, gen: () => ({ b: ri(2, 6), a: 0 }), f: v => v.a },
  ],
  3: [
    { t: v => `🌳 Bác trồng ${v.a} cây xoài, cây ổi nhiều hơn ${v.b} cây. Bác trồng bao nhiêu cây ổi?`, gen: () => ({ a: ri(50, 400), b: ri(10, 90) }), f: v => v.a + v.b },
    { t: v => `🎁 Tặng ${v.b} bạn, mỗi bạn ${v.a} cái bút. Đã dùng bao nhiêu cái bút?`, gen: () => ({ a: ri(3, 15), b: ri(4, 9) }), f: v => v.a * v.b },
    { t: v => `💰 Bé có ${v.a}đ, mua sách hết ${v.b}đ. Bé còn bao nhiêu tiền?`, gen: () => { const b = ri(2, 8) * 5000; return { a: b + ri(5, 50) * 5000, b }; }, f: v => v.a - v.b },
  ],
  4: [
    { t: v => `🏟️ Sân hình chữ nhật dài ${v.a} m, rộng ${v.b} m. Chu vi sân bao nhiêu mét?`, gen: () => ({ a: ri(20, 90), b: ri(10, 19) }), f: v => 2 * (v.a + v.b) },
    { t: v => `🧱 Tường dài ${v.a} m, mỗi viên gạch dài ${v.b} dm. Tường dùng bao nhiêu viên gạch?`, gen: () => ({ b: pick([2, 5, 10]), a: 0 }), f: v => (v.a * 10) / v.b },
    { t: v => `🚌 Xe bus đi ${v.a} km/h trong ${v.b} giờ. Xe đi được bao nhiêu km?`, gen: () => ({ a: ri(20, 80), b: ri(2, 6) }), f: v => v.a * v.b },
  ],
  5: [
    { t: v => `👕 Áo giá ${v.a}đ, giảm ${v.b}%. Tiết kiệm được bao nhiêu tiền?`, gen: () => ({ a: pick([200000, 350000, 480000, 500000]), b: pick([10, 20, 25, 50]) }), f: v => v.a * v.b / 100 },
    { t: v => `🍰 Bánh chia ${v.b} phần, bé ăn ${v.a} phần. Bé ăn mấy phần mười?`, gen: () => ({ b: pick([10, 20, 50]), a: 0 }), f: v => v.a },
    { t: v => `🏊 Bể bơi dài ${v.a} m, bé bơi được ${v.b}% quãng đường. Bé đã bơi bao nhiêu mét?`, gen: () => { const p = pick([25, 50, 75]); return { a: pick([40, 80, 100, 200]), b: p, _p: p }; }, f: v => v.a * v._p / 100 },
  ],
};
/* Fix các template dùng a sinh động */
STORY_TPL[2][2].gen = () => { const b = ri(2, 6); return { b, a: b * ri(3, 9) }; };
STORY_TPL[4][1].gen = () => { const b = pick([2, 5, 10]); return { b, a: ri(2, 40) }; };
STORY_TPL[5][1].gen = () => { const b = pick([10, 20, 50]); return { b, a: ri(1, b - 1) }; };

QUESTIONS.story = function (g) {
  const tpl = pick(STORY_TPL[Math.max(1, Math.min(5, g))]);
  const v = tpl.gen();
  const ans = tpl.f(v);
  if (!Number.isFinite(ans) || ans <= 0) return QUESTIONS.story(g);
  const unit = tpl.t(v).includes("đ") ? "đ" : "";
  const show = n => (unit === "đ" ? fmtN(n) + "đ" : fmtN(n));
  return makeQ(`<div class="q-story">${tpl.t(v)}</div>`,
    pickIdx([show(ans), show(Math.max(0, ans - ri(2, 9))), show(ans + ri(2, 9)), show(Math.max(0, ans - ri(10, 20)))].filter((x, i, arr) => arr.indexOf(x) === i), show(ans)));
};

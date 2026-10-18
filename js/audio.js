// Audio cho Bé Học Toán — chỉ hiệu ứng âm thanh (Sfx), KHÔNG đọc lời.
// iOS Safari: AudioContext phải được "mở khóa" trong 1 cử chỉ người dùng
// (js/main.js — listener pointerdown gọi Sfx.warm()).
const AudioCtx = (() => {
  let ctx = null;
  return function () {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
})();

const Sfx = (() => {
  const ac = AudioCtx;

  function tone(freq, t0, dur, type = "sine", vol = 0.22) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime + t0;
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  return {
    warm() { ac(); },
    click()   { tone(660, 0, 0.07, "triangle", 0.14); },
    pop()     { tone(880, 0, 0.06, "sine", 0.12); },
    correct() { tone(523, 0, 0.12); tone(659, 0.09, 0.12); tone(784, 0.18, 0.22); },
    cheer()   { [660, 880, 1047, 1319].forEach((f, i) => tone(f, i * 0.055, 0.16, "triangle", 0.16)); },
    wrong()   { tone(196, 0, 0.18, "sawtooth", 0.13); tone(147, 0.12, 0.22, "sawtooth", 0.11); },
    win()     { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, "triangle", 0.2)); },
  };
})();

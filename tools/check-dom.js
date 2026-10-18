const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = ["js/main.js", "js/games.js"].map(f => fs.readFileSync(path.join(root, f), "utf8")).join("\n");

const ids = [...js.matchAll(/\$\("#([a-zA-Z0-9-]+)"\)|getElementById\("([a-zA-Z0-9-]+)"\)/g)]
  .map(m => m[1] || m[2]);
const sels = [...new Set(ids)];
let miss = 0;
for (const id of sels) {
  if (!html.includes('id="' + id + '"')) { console.log("THIẾU id: " + id); miss++; }
}
const cls = [...js.matchAll(/querySelectorAll?\("\.([a-zA-Z0-9-]+)/g)].map(m => m[1]);
for (const c of [...new Set(cls)]) {
  if (!html.includes(c)) { console.log("THIẾU class: " + c); miss++; }
}
console.log(miss ? miss + " mục thiếu" : "✅ Đủ " + sels.length + " id + " + new Set(cls).size + " class selector");

// Sinh QR: BASE_URL + ?id=01.. -> qr/01.png ...
// Sua BASE_URL thanh link Pages that roi chay: node tools/generate-qr.js
const QR = require("qrcode");
const path = require("path");
const fs = require("fs");

const BASE_URL = "https://tenban.github.io/20-10/web2/";
const OUT_DIR = path.join(__dirname, "..", "qr");
const IDS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const id of IDS) {
    const url = `${BASE_URL}?id=${id}`;
    await QR.toFile(path.join(OUT_DIR, `${id}.png`), url, { width: 600, margin: 2 });
    console.log(id, "->", url);
  }
  console.log("Xong 12 QR trong qr/");
})().catch((e) => { console.error(e); process.exit(1); });

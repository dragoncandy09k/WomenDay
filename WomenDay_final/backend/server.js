// mở 3 API cho 2 web giao tiếp với nhau:

import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "keys.json");

const app = express();
app.use(cors()); // cho GitHub Pages (domain khác) gọi sang
app.use(express.json());

function load() {
  try {
    const d = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    return { count: d.count || 0, total: d.total || 15, visitedIds: d.visitedIds || [], gen: d.gen || 0 };
  } catch { return { count: 0, total: 15, visitedIds: [], gen: 0 }; }
}
function save() { fs.writeFileSync(DB_FILE, JSON.stringify(db)); }
let db = load();

// Web 1 polling mỗi 3s
app.get("/api/keys", (req, res) => res.json(db));

// Web 2 gọi ngầm khi quét QR — mỗi id chỉ +1 lần
app.post("/api/visit", (req, res) => {
  const id = String(req.body?.id || "");
  if (id && !db.visitedIds.includes(id)) {
    db.visitedIds.push(id);
    db.count = db.visitedIds.length;
    save();
  }
  res.json(db);
});

// Reset trước giờ G (test làm lệch số) — tăng gen để Web 1 biết mà về 0 theo
app.post("/api/reset", (req, res) => {
  db = { count: 0, total: db.total, visitedIds: [], gen: (db.gen || 0) + 1 };
  save();
  res.json(db);
});

const PORT = process.env.PORT || 3000; // Render tự cấp PORT
app.listen(PORT, () => console.log("API running on " + PORT));

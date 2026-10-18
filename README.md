# Project 20/10 — Rương & Thiệp (2 Website + Backend)

Project chạy 1 ngày, dưới 15 người.

## 1. Ý tưởng tổng quan

| Phần | Vai trò |
|---|---|
| **Web 1 — Rương** (`web1/`) | Web chính, mở ở máy chiếu. Có rương/khóa + số 🔑 tượng trưng. Bấm rương là mở luôn, không cần đủ key. |
| **Web 2 — Thiệp 20/10** (`web2/`) | Mỗi người quét 1 QR riêng (`?id=01`…`?id=15`) → hiện thiệp + lời chúc + ảnh riêng của mình. Mỗi lượt quét hợp lệ +1 🔑 cho Web 1. |
| **Backend** (`backend/`) | Node.js + Express (đơn giản kiểu project Amazon của SuperSimpleDev). Chỉ giữ 1 con số đếm key. |

```
Người quét QR (Web 2) --POST /api/visit {id}--> Backend (+1, nhớ id đã quét)
Web 1 (máy chính)     --GET /api/keys (mỗi 3s)--> Backend (đọc số → animation +🔑)
```

## 2. Cây thư mục & deploy

```
WomenDay/
├── web1/                  → GitHub Pages: .../20-10/web1/      (máy chính)
│   ├── index.html         Rương SVG + nút Mở rương + đếm key
│   ├── main.js            Tap rương (rung → hé → bung + thư trượt lên)
│   └── style.css          Header logo, rương, nút, responsive
├── web2/                  → GitHub Pages: .../20-10/web2/?id=01 (15 QR)
│   ├── index.html         Phong bì + popup thiệp
│   ├── data.js            15 người {id, name, wish, img}
│   ├── main.js            Đọc ?id → find() → hiện chúc + ảnh, POST +1 ngầm
│   └── style.css          Envelope, tim bay SVG, thiệp 880px, mobile
├── backend/               → Render Free (chỉ đếm, không host web)
│   ├── server.js          GET /api/keys · POST /api/visit · POST /api/reset
│   ├── package.json       express + cors
│   └── keys.json          {count, total: 15, visitedIds: []}
├── images/
│   ├── main1/             Ảnh Web 1 (logo1.png nền trong suốt, đã crop)
│   └── main2/             Ảnh 15 người Web 2: 01.jpg … 15.jpg (<500KB/ảnh)
├── qr/                    15 file PNG để in (01.png … 15.png)
└── tools/
    └── generate-qr.js     Sinh QR: BASE_URL + ?id=01..15
```

- Tất cả code push **1 repo GitHub duy nhất**. Pages chạy web, Render kéo `backend/` về chạy.
- GitHub Pages: free, 100GB/tháng (event này dùng <1%), không giới hạn số máy.
- Render Free: 0đ, sleep sau 15p không traffic → khắc phục bằng cách mở Web 1 trước event 10p (polling 3s giữ server tỉnh).

## 3. Web 2 — hoạt động chi tiết

1. Quét QR riêng, ví dụ `.../web2/?id=03` → đọc `id` từ URL (`URLSearchParams`).
2. `PEOPLE.find(p => p.id === id)` → hiện tên + lời chúc + ảnh riêng. Không dùng `if` từng người.
3. Hiện lời chúc **ngay**, đồng thời `POST /api/visit {id}` chạy ngầm (`sendBeacon`/`keepalive` + retry 1 lần).
4. Tap phong bì lần 1 → thiếp nhấc lên (transform GPU, không dùng hover vì mobile không có hover).
   Tap lần 2 → popup thư **trượt từ dưới lên**.
5. Thiệp: ảnh trái (tỉ lệ 4:5, từ `data.js`), chữ phải (Be Vietnam Pro dễ đọc, hỗ trợ dấu TV).
   Desktop thiệp 880px; mobile ảnh lên trên/chữ xuống dưới, chữ co theo màn hình.
6. Tim bay: 5 tim SVG (`floatUp`), chạy luôn không phụ thuộc cài đặt giảm chuyển động của máy.
7. Ảnh lỗi/thiếu → khung ảnh tự ẩn, thiệp vẫn hiện chữ.

## 4. Web 1 — hoạt động chi tiết (frontend, backend tính sau)

1. Mở trang: rương đóng ở giữa + `🔑 0/15` + nút "Mở rương".
2. Tap rương lần 1: rương rung + ổ khóa xoay, thiếp hé lên.
3. Tap lần 2: nắp bật mở + tia sáng + thư trượt từ dưới lên.
4. Tap X / nền đen: đóng thư.
5. Khi có key mới (sau này nối API): số `12/15 → 13/15` + icon 🔑 bay vào rương.
6. Header: badge 20/10 (trái) + logo lớp A2K26 nền trong suốt (phải, 92px/60px mobile, bóng đổ, cách mép 4px).
7. Thanh cuộn: giữ khả năng cuộn, giấu thanh cho đẹp (`scrollbar-width: none`).

## 5. Backend — xử lý

- `GET /api/keys` → `{count, total, visitedIds}` cho Web 1 polling.
- `POST /api/visit {id}` → nếu `id` chưa có trong `visitedIds` thì `count++`, lưu `keys.json`. F5 quét lại cùng QR **không** + thêm.
- `POST /api/reset` → về `{count: 0, visitedIds: []}` (gọi 1 lần trước giờ G vì lúc test số đã nhảy).
- Nhớ thêm `cors()` (Pages gọi chéo sang Render) và `app.listen(process.env.PORT || 3000)`.
- 15 người song song: Node xử lý nối tiếp, không mất lượt.

## 6. QR

- Mỗi QR chứa 1 link: `https://tenban.github.io/20-10/web2/?id=XX`.
- Chạy `tools/generate-qr.js` với `BASE_URL` thật 1 lần → `qr/01.png … 15.png` → in ra phát tay.
- Đổi tên/lời chúc/ảnh trong `data.js` → **không** cần làm lại QR (QR chỉ chứa `id`).
- Chỉ làm lại QR khi đổi link Pages (đổi tên repo/user).

## 7. Checklist ngày event

1. Push code cuối lên GitHub (Pages + Render tự deploy lại).
2. `POST /api/reset` → key về 0.
3. Mở Web 1 trước 10p (warm-up Render, giữ polling).
4. Phát 15 QR đúng người.
5. Quét thử 1–2 QR, xem Web 1 nhảy 🔑 là xong.

## 8. Mục tiêu

- Backend đơn giản kiểu SuperSimpleDev (Express + `fetch`, không DB).
- Từ "mỗi visit +1" chuyển sang **mỗi QR riêng + mỗi id +1 lần** (chống F5 spam, hiện `x/15` đẹp hơn).
- Frontend GitHub Pages + backend Render riêng (Pages không chạy được Node).
- Thư trượt từ dưới lên; phông Be Vietnam Pro; tim SVG bay luôn.
- Ảnh: `images/main1` (Web 1) / `images/main2` (Web 2), logo.

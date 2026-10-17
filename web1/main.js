/**
 * =========================================================
 * Web 1: Chiếc Rương 20/10 - Main Logic
 * Frontend logic: Mở rương cao cấp, nắp bật mở chân thực,
 * hiệu ứng ánh sáng bừng tỏa, zoom vào khoảng đen, bay chìa khóa
 * =========================================================
 */

// ---------------- CONFIGURATION ----------------
const CONFIG = {
  VIDEO_URL: '../web2/index.html', // URL video hoặc trang đích khi mở rương
  ENABLE_BACKEND_POLL: true,      // Bật true khi nối backend polling
  BACKEND_API_URL: 'https://womenday-lmhp.onrender.com/api/keys',    // API endpoint lấy keys
  POLL_INTERVAL: 3000              // Chu kỳ polling (ms)
};

// ---------------- DOM ELEMENTS ----------------
const chest = document.getElementById('chest');
const chestLockNode = document.getElementById('chestLockNode');
const openBtn = document.getElementById('openBtn');
const actionHint = document.getElementById('actionHint');
const keyCountEl = document.getElementById('keyCount');
const portalOverlay = document.getElementById('portalOverlay');
const flyKeyLayer = document.getElementById('flyKeyLayer');

// ---------------- STATE ----------------
let currentKeys = 0;
let isOpening = false;
let isOpened = false;

// ---------------- HÀM MỞ RƯƠNG (TAP LẦN 1) ----------------
function triggerOpenChest() {
  if (isOpening || isOpened) return;
  isOpening = true;

  // Bước 1: Rương rung lắc mạnh mẽ + ổ khóa xoay tròn 360° phát sáng (0.5s)
  chest.classList.add('shaking');
  if (chestLockNode) {
    chestLockNode.classList.add('spinning');
  }

  setTimeout(() => {
    // Bước 2: Nắp rương bật mở mượt mà + ánh sáng bừng nở từ trong rương
    chest.classList.remove('shaking');
    chest.classList.add('is-open');
    isOpened = true;

    // Ẩn nút bấm và gợi ý
    if (openBtn) {
      openBtn.style.pointerEvents = 'none';
      openBtn.style.opacity = '0';
      openBtn.style.transition = 'opacity 0.3s ease';
    }
    if (actionHint) {
      actionHint.style.opacity = '0';
      actionHint.style.transition = 'opacity 0.3s ease';
    }

    // Bước 3: Sau 0.7s (khi đã ngắm nắp mở và tia sáng bừng lên),
    // camera zoom sâu vào khoảng đen huyền bí trong rương
    setTimeout(() => {
      portalOverlay.classList.add('active');

      // Bước 4: Chuyển hướng sang URL video
      setTimeout(() => {
        if (CONFIG.VIDEO_URL && CONFIG.VIDEO_URL !== '#') {
          window.location.href = CONFIG.VIDEO_URL;
        } else {
          console.log('[Web1] Mở rương thành công! (Chưa đổi VIDEO_URL)');
        }
      }, 1200);
    }, 700);

  }, 500);
}

// Lắng nghe sự kiện Click & Bàn phím
if (chest) {
  chest.addEventListener('click', triggerOpenChest);
  chest.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerOpenChest();
    }
  });
}

if (openBtn) {
  openBtn.addEventListener('click', triggerOpenChest);
}

// ---------------- HIỆU ỨNG THÊM KEY (KHI CÓ KEY MỚI) ----------------
// Mỗi lượt quét = 1 chìa bay riêng, số tăng từng đơn vị (3→4→5→6).
// Hàng đợi: lượt mới tới giữa chừng thì nối tiếp, không nhảy cóc, không cộng lố.
/**
 * Tạo 1 icon 🔑 bay lượn từ ngoài vào rương (không đụng tới con số)
 */
function spawnFlyingKey() {
  const flyingKey = document.createElement('div');
  flyingKey.className = 'flying-key-item';
  flyingKey.textContent = '🔑';

  // Xuất phát từ cạnh trên màn hình
  const startX = Math.random() * (window.innerWidth - 80) + 40;
  const startY = -40;

  flyingKey.style.left = `${startX}px`;
  flyingKey.style.top = `${startY}px`;

  // Tọa độ tâm chiếc rương
  const chestRect = chest.getBoundingClientRect();
  const targetX = chestRect.left + chestRect.width / 2;
  const targetY = chestRect.top + chestRect.height / 2;

  const deltaX = targetX - startX;
  const deltaY = targetY - startY;

  // Quỹ đạo đường cong parabol
  const curveX = deltaX * 0.5 + (Math.random() > 0.5 ? 70 : -70);
  const curveY = deltaY * 0.3;

  flyingKey.style.setProperty('--end-x', `${deltaX}px`);
  flyingKey.style.setProperty('--end-y', `${deltaY}px`);
  flyingKey.style.setProperty('--mid-x', `${curveX}px`);
  flyingKey.style.setProperty('--mid-y', `${curveY}px`);

  flyKeyLayer.appendChild(flyingKey);

  // Dọn dẹp DOM
  setTimeout(() => {
    flyingKey.remove();
  }, 1000);
}

let pendingTarget = 0;   // đích mới nhất backend báo
let reserved = 0;        // số đã phát chìa (hiển thị sau 750ms khi chìa chạm rương)
let queueTimer = null;   // timer bơm từng chìa
let epoch = 0;           // vé: reset làm các hẹn giờ cũ hết hạn, không cộng lố

// Bơm từng chìa 1 cho tới khi đuổi kịp đích.
// Chốt số ngay lúc phát chìa (reserved), hiển thị sau 750ms → không bao giờ cộng lố.
function pumpQueue() {
  if (queueTimer) return;
  reserved = currentKeys;
  queueTimer = setInterval(() => {
    if (reserved >= pendingTarget) {
      clearInterval(queueTimer);
      queueTimer = null;
      return;
    }
    reserved++;
    spawnFlyingKey();
    const show = reserved, myEpoch = epoch;
    setTimeout(() => {
      if (myEpoch === epoch) updateKeyNumber(show);
    }, 750);
  }, 350);
}

/**
 * Cập nhật số hiển thị kèm hiệu ứng nhảy phóng to (.pop)
 */
function updateKeyNumber(count) {
  currentKeys = count;
  if (!keyCountEl) return;

  keyCountEl.textContent = currentKeys;
  keyCountEl.classList.remove('pop');
  void keyCountEl.offsetWidth; // Reflow để trigger animation
  keyCountEl.classList.add('pop');
}

// ---------------- GLOBAL API CHO BACKEND GỌI ----------------
// Có thể gọi trực tiếp từ console hoặc code backend:
// 1. window.addKey()       -> Tăng 1 chìa và kích hoạt chìa bay vào
// 2. window.setKeys(count) -> Cập nhật số chìa khóa cụ thể
window.addKey = function() {
  window.setKeys(Math.max(currentKeys, pendingTarget) + 1);
};

window.setKeys = function(newCount) {
  if (typeof newCount !== 'number') return;
  if (newCount <= currentKeys && newCount <= pendingTarget) return; // bỏ giá trị cũ/thấp hơn
  pendingTarget = Math.max(pendingTarget, newCount);
  pumpQueue();
};

// Reset tay về 0 trước giờ G (polling không tự hạ số)
window.resetKeys = function() {
  if (queueTimer) { clearInterval(queueTimer); queueTimer = null; }
  epoch++; // hủy các +1 đang bay dở
  pendingTarget = 0;
  reserved = 0;
  updateKeyNumber(0);
};

// ---------------- BACKEND POLLING (TỰ ĐỘNG BẬT KHI NỐI) ----------------
let isFirstPoll = true; // lần hỏi đầu: hiện số luôn, không bay từ 0
let lastGen = null;      // phiên bản backend: đổi gen = vừa reset → về 0 theo
async function pollKeys() {
  try {
    const response = await fetch(CONFIG.BACKEND_API_URL);
    if (response.ok) {
      const data = await response.json();
      if (typeof data.count !== 'number') return;
      if (isFirstPoll) {
        isFirstPoll = false;
        lastGen = data.gen || 0;
        epoch++;
        pendingTarget = data.count;
        reserved = data.count;
        updateKeyNumber(data.count); // hiện ngay số thật
      } else if ((data.gen || 0) !== lastGen) {
        lastGen = data.gen || 0; // backend vừa reset: về 0 theo, không bay
        if (queueTimer) { clearInterval(queueTimer); queueTimer = null; }
        epoch++;
        pendingTarget = data.count;
        reserved = data.count;
        updateKeyNumber(data.count);
      } else {
        window.setKeys(data.count);
      }
    }
  } catch (err) {
    // Backend chưa chạy
  }
}
if (CONFIG.ENABLE_BACKEND_POLL) {
  pollKeys(); // hỏi ngay khi mở trang, không đợi hết 3s
  setInterval(pollKeys, CONFIG.POLL_INTERVAL);
}

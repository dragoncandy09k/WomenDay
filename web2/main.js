// Web2: phong bi + mo thiep only. id tu ?id=01.. -> lay chuc rieng tu data.js
const API_BASE = "https://womenday-lmhp.onrender.com"; // vd: "https://xxx.onrender.com" khi deploy that, de trong khi test local

const params = new URLSearchParams(location.search);
const myId = params.get("id") || "01";
const person = (typeof PEOPLE !== "undefined" && PEOPLE.find((p) => p.id === myId)) || { name: "Ban", wish: "Chuc 20/10 vui ve!" };

const titleEl = document.getElementById("letter-title");
const contentEl = document.getElementById("letter-content");
const fullTitle = `Gửi ${person.name}!`;
const fullContent = person.wish;

// Mo thu: gan chu ngay. Hieu ung truot tu duoi len do CSS lo.
function fillLetter() {
  titleEl.textContent = fullTitle;
  contentEl.textContent = fullContent;
  const photo = document.getElementById("letter-photo");
  const frame = photo.closest(".photoFrame");
  const wrap = document.querySelector(".formLetter .wrapperLetter");
  photo.onerror = () => { frame.style.display = "none"; wrap.classList.add("no-photo"); };
  if (person.img) { frame.style.display = ""; wrap.classList.remove("no-photo"); photo.src = person.img; }
  else { frame.style.display = "none"; wrap.classList.add("no-photo"); }
}

// Tap phong bi -> thiep troi len (class GPU, muot tren mobile), tap thiep -> mo popup
document.addEventListener("DOMContentLoaded", () => {
  const card = document.querySelector(".card");
  const valentines = document.querySelector(".valentines");
  const modal = document.querySelector(".wrapperLetterForm");
  const openLetter = () => { fillLetter(); modal.classList.add("show"); document.body.classList.add("modal-open"); };
  const closeLetter = () => { modal.classList.remove("show"); document.body.classList.remove("modal-open"); };
  // Tap 1: nhac thiep len. Tap 2 (khi thiep da len): mo thu.
  // Lam tren ca valentines vi .front che mat card tren mobile.
  valentines.addEventListener("click", () => {
    if (card.classList.contains("lifted")) openLetter();
    else card.classList.add("lifted");
  });
  document.getElementById("close-letter").addEventListener("click", (e) => {
    e.stopPropagation(); closeLetter();
  });
  // Tap ra nen den thi dong (vung touch lon, de bam tren dt)
  modal.addEventListener("click", (e) => { if (e.target === modal) closeLetter(); });

  // +1 key chay ngam, khong chan hien chuc. keepalive de gui du khi user thoat som
  if (API_BASE) {
    const payload = JSON.stringify({ id: myId });
    const send = () => fetch(`${API_BASE}/api/visit`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: payload, keepalive: true
    }).catch(() => {});
    send();
    setTimeout(send, 5000); // retry 1 lan phong Render dang ngu
  }
});

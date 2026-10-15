const h1 = document.querySelector("h1");
const testo = h1.textContent;

h1.setAttribute("aria-label", testo);
h1.textContent = "";

const lettere = [...testo].map((c) => {
  const el = document.createElement("span");
  el.textContent = c;
  el.setAttribute("aria-hidden", "true");
  h1.appendChild(el);
  return { el, peso: 100 };
});

const MIN = 100;
const MAX = 900;
const RAGGIO = 320;

const mouse = { x: -9999, y: -9999, ultimoMovimento: 0 };

window.addEventListener("pointermove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.ultimoMovimento = performance.now();
});

function frame(t) {
  const inattivo = t - mouse.ultimoMovimento > 2000;

  lettere.forEach((l, i) => {
    const r = l.el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const distanza = Math.hypot(mouse.x - cx, mouse.y - cy);

    let vicinanza = Math.max(0, 1 - distanza / RAGGIO);

    if (inattivo) {
      vicinanza = ((Math.sin(t / 700 + i * 0.7) + 1) / 2) * 0.85;
    }

    const bersaglio = MIN + vicinanza * (MAX - MIN);
    l.peso += (bersaglio - l.peso) * 0.1;

    l.el.style.fontWeight = l.peso.toFixed(1);
    l.el.style.fontStyle = vicinanza > 0.6 ? "italic" : "normal";
  });

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
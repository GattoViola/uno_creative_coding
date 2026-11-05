(() => {
  'use strict';

  const FONT = 'Unisoft77';
  const PESO_CIFRA = 500;
  const DURATA_RIDOTTA = 1000;
  const SPAZIO_CIFRA = { x: 492, larghezza: 488, altezza: 726 };

  const schermata = document.getElementById('piu-due');
  if (!schermata) return;

  const quadrato = schermata.querySelector('.quadrato-piu-due');
  const cifra = schermata.querySelector('.cifra-piu-due');
  const dashboard = document.getElementById('dashboard');
  const movimentoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)');
  const misura = document.createElement('canvas').getContext('2d');
  let chiusura = null;

  function allineaAllaDashboard() {
    if (!dashboard || schermata.hidden) return;
    const area = dashboard.getBoundingClientRect();
    const riquadro = dashboard.querySelector('.riquadro');
    schermata.style.setProperty('--piu-due-x', `${area.left}px`);
    schermata.style.setProperty('--piu-due-y', `${area.top}px`);
    schermata.style.setProperty('--piu-due-larghezza', `${area.width}px`);
    schermata.style.setProperty('--piu-due-altezza', `${area.height}px`);
    if (riquadro) schermata.style.setProperty('--piu-due-raggio', getComputedStyle(riquadro).borderTopLeftRadius);
  }

  if (dashboard) {
    const osserva = new ResizeObserver(allineaAllaDashboard);
    osserva.observe(dashboard);
    osserva.observe(dashboard.parentElement);
  }
  addEventListener('resize', allineaAllaDashboard);

  function sistemaCifra() {
    misura.font = `${PESO_CIFRA} 1000px "${FONT}"`;
    const m = misura.measureText('2');
    const larghezza = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const altezza = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    if (!larghezza || !altezza) return;
    const scala = Math.min(SPAZIO_CIFRA.larghezza / larghezza, SPAZIO_CIFRA.altezza / altezza);
    cifra.setAttribute('font-size', (1000 * scala).toFixed(1));
    cifra.setAttribute('x', (SPAZIO_CIFRA.x + m.actualBoundingBoxLeft * scala).toFixed(1));
  }

  document.fonts
    .load(`${PESO_CIFRA} 100px "${FONT}"`, '2')
    .then(sistemaCifra)
    .catch(() => {});

  function nascondi() {
    clearTimeout(chiusura);
    schermata.classList.remove('attiva');
    schermata.hidden = true;
  }

  function mostra() {
    clearTimeout(chiusura);
    schermata.classList.remove('attiva');
    schermata.hidden = false;
    allineaAllaDashboard();
    sistemaCifra();
    void quadrato.offsetWidth;
    schermata.classList.add('attiva');
    if (movimentoRidotto.matches) chiusura = setTimeout(nascondi, DURATA_RIDOTTA);
  }

  quadrato.addEventListener('animationend', nascondi);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') nascondi();
  });

  window.UniPiuDue = Object.freeze({ mostra, nascondi });
})();
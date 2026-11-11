(() => {
  'use strict';

  const COLORI = ['rosso', 'giallo', 'verde', 'blu'];
  const PAUSA_FINALE = 1000;

  const schermata = document.getElementById('cambio-colore');
  if (!schermata) return;

  const quadrato = schermata.querySelector('.quadrato');
  const dashboard = document.getElementById('dashboard');
  const movimentoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)');

  let passo = 0;
  let giro = null;
  let chiusura = null;

  function allineaAllaDashboard() {
    if (!dashboard || schermata.hidden) return;
    const area = dashboard.getBoundingClientRect();
    const riquadro = dashboard.querySelector('.riquadro');
    schermata.style.setProperty('--cambio-x', `${area.left}px`);
    schermata.style.setProperty('--cambio-y', `${area.top}px`);
    schermata.style.setProperty('--cambio-larghezza', `${area.width}px`);
    schermata.style.setProperty('--cambio-altezza', `${area.height}px`);
    if (riquadro) schermata.style.setProperty('--cambio-raggio', getComputedStyle(riquadro).borderTopLeftRadius);
  }

  if (dashboard) {
    const osserva = new ResizeObserver(allineaAllaDashboard);
    osserva.observe(dashboard);
    osserva.observe(dashboard.parentElement);
  }
  addEventListener('resize', allineaAllaDashboard);

  function durataPasso() {
    const secondi = parseFloat(getComputedStyle(schermata).getPropertyValue('--durata-passo'));
    return Number.isFinite(secondi) ? secondi * 1000 : 2000;
  }

  function mostraPasso(numero) {
    passo = numero;
    quadrato.dataset.colore = COLORI[passo % COLORI.length];
    quadrato.style.setProperty('--passo', String(passo));
  }

  function fermaGiro() {
    clearInterval(giro);
    clearTimeout(chiusura);
    giro = null;
    chiusura = null;
  }

  function apri() {
    fermaGiro();
    mostraPasso(0);
    schermata.hidden = false;
    allineaAllaDashboard();
    if (movimentoRidotto.matches) return;
    requestAnimationFrame(() => requestAnimationFrame(() => mostraPasso(passo + 1)));
    giro = setInterval(() => mostraPasso(passo + 1), durataPasso());
  }

  function chiudi(colore) {
    fermaGiro();
    if (!COLORI.includes(colore)) {
      schermata.hidden = true;
      return;
    }
    quadrato.dataset.colore = colore;
    chiusura = setTimeout(() => {
      schermata.hidden = true;
    }, PAUSA_FINALE);
  }

  window.UniCambioColore = Object.freeze({ apri, chiudi });
})();
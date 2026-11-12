(() => {
  'use strict';

  const DURATA_RIDOTTA = 1000;

  const schermata = document.getElementById('piu-due');
  if (!schermata) return;

  const quadrato = schermata.querySelector('.quadrato-piu-due');
  const dashboard = document.getElementById('dashboard');
  const poster = document.getElementById('container-principale');
  const disegnoPoster = document.getElementById('disegno-lettera');
  const movimentoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)');
  let chiusura = null;
  let partenza = 0;

  function allineaAllaDashboard() {
    if (!dashboard || schermata.hidden) return;
    const area = dashboard.getBoundingClientRect();
    const riquadro = dashboard.querySelector('.riquadro');
    schermata.style.setProperty('--piu-due-x', `${area.left}px`);
    schermata.style.setProperty('--piu-due-y', `${area.top}px`);
    schermata.style.setProperty('--piu-due-larghezza', `${area.width}px`);
    schermata.style.setProperty('--piu-due-altezza', `${area.height}px`);
    if (riquadro) schermata.style.setProperty('--piu-due-raggio', getComputedStyle(riquadro).borderTopLeftRadius);
    partiDalPoster(area);
  }

  function partiDalPoster(area) {
    if (!poster || !area.width || !area.height) return;
    const partenza = poster.getBoundingClientRect();
    schermata.style.setProperty('--piu-due-da-x', `${partenza.left - area.left}px`);
    schermata.style.setProperty('--piu-due-da-y', `${partenza.top - area.top}px`);
    schermata.style.setProperty('--piu-due-da-sx', partenza.width / area.width);
    schermata.style.setProperty('--piu-due-da-sy', partenza.height / area.height);
    const raggio = parseFloat(getComputedStyle(poster).borderTopLeftRadius) || 0;
    schermata.style.setProperty('--piu-due-raggio-da', `${raggio / (partenza.width / area.width)}px`);
  }

  function copiaDelPoster() {
    if (!disegnoPoster) return;
    const copia = disegnoPoster.cloneNode(true);
    copia.querySelectorAll('[id]').forEach((elemento) => elemento.removeAttribute('id'));
    copia.querySelector('title')?.remove();
    ['id', 'role', 'aria-labelledby'].forEach((nome) => copia.removeAttribute(nome));
    copia.setAttribute('aria-hidden', 'true');
    for (const nome of poster.style) {
      if (nome.startsWith('--')) copia.style.setProperty(nome, poster.style.getPropertyValue(nome));
    }
    quadrato.replaceChildren(copia);
  }

  if (dashboard) {
    const osserva = new ResizeObserver(allineaAllaDashboard);
    osserva.observe(dashboard);
    osserva.observe(dashboard.parentElement);
  }
  addEventListener('resize', allineaAllaDashboard);

  function nascondi() {
    partenza += 1;
    clearTimeout(chiusura);
    schermata.classList.remove('attiva');
    schermata.hidden = true;
  }

  function avvia() {
    schermata.hidden = false;
    allineaAllaDashboard();
    copiaDelPoster();
    void quadrato.offsetWidth;
    schermata.classList.add('attiva');
    if (movimentoRidotto.matches) chiusura = setTimeout(nascondi, DURATA_RIDOTTA);
  }

  function mostra() {
    nascondi();
    const questa = partenza;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (questa === partenza) avvia();
      }),
    );
  }

  quadrato.addEventListener('animationend', (e) => {
    if (e.target === quadrato) nascondi();
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') nascondi();
  });

  window.UniPiuDue = Object.freeze({ mostra, nascondi });
})();
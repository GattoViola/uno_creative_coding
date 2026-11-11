(() => {
  'use strict';

  const PAUSA_INIZIALE = 500;
  const PAUSA_FINALE = 500;
  const ATTESA_FONT_MAX = 2000;
  const DURATA_MASSIMA = 4000;

  const intro = document.getElementById('intro');
  const scritte = document.getElementById('intro-scritte');
  if (!intro || !scritte) return;

  const contenuto = scritte.content.firstElementChild;
  const riquadroVuoto = contenuto.cloneNode(false);
  const dashboard = document.getElementById('dashboard');
  let giro = 0;

  function allineaAllaDashboard() {
    if (!dashboard || intro.hidden) return;
    const area = dashboard.getBoundingClientRect();
    const riquadro = dashboard.querySelector('.riquadro');
    intro.style.setProperty('--intro-x', `${area.left}px`);
    intro.style.setProperty('--intro-y', `${area.top}px`);
    intro.style.setProperty('--intro-larghezza', `${area.width}px`);
    intro.style.setProperty('--intro-altezza', `${area.height}px`);
    if (riquadro) intro.style.setProperty('--intro-raggio', getComputedStyle(riquadro).borderTopLeftRadius);
  }

  if (dashboard) {
    const osserva = new ResizeObserver(allineaAllaDashboard);
    osserva.observe(dashboard);
    osserva.observe(dashboard.parentElement);
  }
  addEventListener('resize', allineaAllaDashboard);

  const aspetta = (millisecondi) => new Promise((fine) => setTimeout(fine, millisecondi));

  async function fontPronto() {
    const pesi = [300, 400, 500, 700, 800, 900];
    const caricamento = Promise.all(pesi.map((peso) => document.fonts.load(`${peso} 100px "Unisoft77"`, 'Unisoft77')));
    await Promise.race([caricamento.catch(() => {}), aspetta(ATTESA_FONT_MAX)]);
  }

  async function avviaIntro() {
    const numero = ++giro;
    intro.replaceChildren(riquadroVuoto.cloneNode(false));
    intro.hidden = false;
    document.documentElement.setAttribute('data-intro', '');
    allineaAllaDashboard();

    await Promise.all([fontPronto(), aspetta(PAUSA_INIZIALE)]);
    if (numero !== giro) return;

    intro.replaceChildren(contenuto.cloneNode(true));
    await new Promise(requestAnimationFrame);

    const animazioni = typeof intro.getAnimations === 'function' ? intro.getAnimations({ subtree: true }) : [];
    const finite = Promise.all(animazioni.map((animazione) => animazione.finished.catch(() => {})));
    await Promise.race([finite, aspetta(DURATA_MASSIMA)]);
    await aspetta(PAUSA_FINALE);
    if (numero !== giro) return;

    intro.hidden = true;
    intro.replaceChildren();
    document.documentElement.removeAttribute('data-intro');
  }

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') avviaIntro();
  });

  avviaIntro();
})();
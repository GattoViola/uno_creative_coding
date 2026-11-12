(() => {
  'use strict';

  const FONT = 'Unisoft77';
  const TESTO_SOPRA = 'WINNER';
  const PESO_UNI = 900;
  const PESO_TITOLI = 500;
  const MANO = {
    pesoLeggero: 300,
    pesoPesante: 900,
    centro: 0.5,
    corsa: 0.3,
    zonaMorta: 0.08,
    specchio: false,
    cascata: 70,
    reattivita: 120,
    persa: 400,
  };

  const ATTESA_UNI = 900;
  const DURATA_RIDUZIONE = 900;
  const DURATA_CAMBIO = 500;
  const DURATA_SPOSTAMENTO = 700;
  const DURATA_GIOCATORE = 600;
  const DURATA_ETICHETTA = 700;
  const MARGINE_ETICHETTA = 0.35;
  const PAUSA_RIGHE = 65;
  const ATTESA_FONT_MAX = 1500;

  const MARGINE = 0.05;
  const LINEA_DI_BASE = 0.55;
  const ALTEZZA_SOPRA = 1 / 3;
  const SPAZIO_TRA_RIGHE = 0.3;
  const ALTEZZA_UNI_MAX = 0.4;
  const METRICHE = { maiuscole: 0.726, minuscole: 0.516, discendenti: 0.237 };

  const schermata = document.getElementById('finale');
  if (!schermata) return;

  const pannello = schermata.querySelector('.pannello');
  const disegno = schermata.querySelector('.disegno-finale');
  const gruppoSopra = schermata.querySelector('.parola-sopra');
  const gruppoSotto = schermata.querySelector('.parola-finale');
  const titoloUni = schermata.querySelector('[data-titolo="iniziale"]');
  const titoloSopra = schermata.querySelector('[data-titolo="sopra"]');
  const titoloSotto = schermata.querySelector('[data-titolo="vincitore"]');
  const titoloInverso = schermata.querySelector('[data-titolo="inverso"]');
  const etichetta = schermata.querySelector('.etichetta-sopra');
  const ritaglioEtichetta = schermata.querySelector('.ritaglio-etichetta');
  const rivelaSopra = schermata.querySelector('.rivela-sopra');
  const rivelaSotto = schermata.querySelector('.rivela');
  const dati = schermata.querySelector('.dati-finale');
  const colonnaPartita = schermata.querySelector('[data-colonna="partita"]');
  const colonnaGiocatori = schermata.querySelector('[data-colonna="giocatori"]');
  const guide = Object.fromEntries(
    [...schermata.querySelectorAll('[data-guida]')].map((linea) => [linea.dataset.guida, linea]),
  );
  const dashboard = document.getElementById('dashboard');
  const movimentoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)');
  const misura = document.createElement('canvas').getContext('2d');

  let giro = 0;
  let ultimoStato = null;
  let quadro = null;
  let sopra = null;
  let sotto = null;

  const aspetta = (millisecondi) => new Promise((fine) => setTimeout(fine, millisecondi));
  const tra = (da, a, t) => da + (a - da) * t;
  const limita = (valore, min = 0, max = 1) => Math.min(max, Math.max(min, valore));
  const morbido = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const uscita = (t) => 1 - (1 - t) ** 3;

  function curvaBezier(x1, y1, x2, y2) {
    const punto = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    return (x) => {
      let basso = 0;
      let alto = 1;
      for (let i = 0; i < 24; i += 1) {
        const t = (basso + alto) / 2;
        if (punto(x1, x2, t) < x) basso = t;
        else alto = t;
      }
      return punto(y1, y2, (basso + alto) / 2);
    };
  }

  const allarga = curvaBezier(0.76, 0, 0.24, 1);
  const uguali = (testo, peso) => Array.from(testo, () => peso);
  const verso = (tempo, costante) => 1 - Math.exp(-tempo / costante);

  function preparaRiga(titolo, testo) {
    titolo.replaceChildren(
      ...Array.from(testo, (lettera) => {
        const pezzo = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        pezzo.textContent = lettera;
        return pezzo;
      }),
    );
    return { testo, pezzi: [...titolo.children], medi: uguali(testo, PESO_TITOLI) };
  }

  function misuraTesto(testo, pesi, corpo) {
    const misure = Array.from(testo).map((lettera, i) => {
      misura.font = `${pesi[i]} ${corpo}px "${FONT}"`;
      return misura.measureText(lettera);
    });
    const prima = misure.slice(0, -1).reduce((somma, m) => somma + m.width, 0);
    const primo = misure[0];
    const ultimo = misure[misure.length - 1];
    return {
      sinistra: primo.actualBoundingBoxLeft,
      destra: prima + ultimo.actualBoundingBoxRight,
      larghezza: primo.actualBoundingBoxLeft + prima + ultimo.actualBoundingBoxRight,
    };
  }

  function preparaQuadro() {
    const area = pannello.getBoundingClientRect();
    if (!area.width || !area.height || !sotto) return null;

    const spazio = area.width * (1 - 2 * MARGINE);
    const corpoSotto = (100 * spazio) / misuraTesto(sotto.testo, sotto.medi, 100).larghezza;
    const corpoSopra = corpoSotto * ALTEZZA_SOPRA;
    const uni = misuraTesto('UNI', uguali('UNI', PESO_UNI), corpoSopra);
    const scalaUni = Math.min(
      spazio / uni.larghezza,
      (area.height * ALTEZZA_UNI_MAX) / (METRICHE.maiuscole * corpoSopra),
    );

    const baseSotto = area.height * LINEA_DI_BASE;
    const maiuscoleSotto = METRICHE.maiuscole * corpoSotto;
    const baseSopra = baseSotto - maiuscoleSotto * (1 + SPAZIO_TRA_RIGHE);

    disegno.setAttribute('viewBox', `0 0 ${area.width} ${area.height}`);
    titoloUni.setAttribute('font-size', corpoSopra.toFixed(2));
    titoloUni.style.fontWeight = String(PESO_UNI);
    titoloSopra.setAttribute('font-size', corpoSopra.toFixed(2));
    titoloInverso.setAttribute('font-size', corpoSopra.toFixed(2));
    titoloSotto.setAttribute('font-size', corpoSotto.toFixed(2));
    [
      [rivelaSotto, corpoSotto],
      [rivelaSopra, corpoSopra],
    ].forEach(([rettangolo, corpo]) => {
      rettangolo.setAttribute('x', (-corpo).toFixed(1));
      rettangolo.setAttribute('y', (-corpo * 2).toFixed(1));
      rettangolo.setAttribute('height', (corpo * 4).toFixed(1));
    });

    const colonna = colonnaGiocatori.getBoundingClientRect().left - area.left;
    mettiLinea('sinistra', area.width * MARGINE, 0, area.width * MARGINE, area.height);
    mettiLinea('colonna', colonna, 0, colonna, area.height);
    mettiLinea('destra', area.width * (1 - MARGINE), 0, area.width * (1 - MARGINE), area.height);

    return {
      larghezza: area.width,
      altezza: area.height,
      centroX: area.width / 2,
      centroY: area.height / 2,
      spazio,
      corpoSotto,
      corpoSopra,
      scalaUni,
      uni,
      sopra: misuraTesto(sopra.testo, sopra.medi, corpoSopra),
      baseSotto,
      baseSopra,
      raggio: parseFloat(getComputedStyle(pannello).borderTopLeftRadius) || 0,
    };
  }

  function allineaAllaDashboard() {
    if (!dashboard || schermata.hidden) return;
    const area = dashboard.getBoundingClientRect();
    const riquadro = dashboard.querySelector('.riquadro');
    schermata.style.setProperty('--finale-x', `${area.left}px`);
    schermata.style.setProperty('--finale-y', `${area.top}px`);
    schermata.style.setProperty('--finale-larghezza', `${area.width}px`);
    schermata.style.setProperty('--finale-altezza', `${area.height}px`);
    if (riquadro) schermata.style.setProperty('--finale-raggio', getComputedStyle(riquadro).borderTopLeftRadius);
    quadro = preparaQuadro();
    if (ultimoStato) disegna(ultimoStato);
  }

  if (dashboard) {
    const osserva = new ResizeObserver(allineaAllaDashboard);
    osserva.observe(dashboard);
    osserva.observe(dashboard.parentElement);
  }
  addEventListener('resize', allineaAllaDashboard);

  function mettiLinea(nome, x1, y1, x2, y2) {
    const linea = guide[nome];
    if (!linea) return;
    linea.setAttribute('x1', x1.toFixed(1));
    linea.setAttribute('y1', y1.toFixed(1));
    linea.setAttribute('x2', x2.toFixed(1));
    linea.setAttribute('y2', y2.toFixed(1));
  }

  function lineaOrizzontale(nome, y, visibile = true) {
    const linea = guide[nome];
    if (!linea) return;
    linea.style.visibility = visibile ? '' : 'hidden';
    mettiLinea(nome, 0, y, quadro.larghezza, y);
  }

  function disegnaSopra(stato) {
    const { corpoSopra, uni, centroX } = quadro;
    const scala = stato.scalaSopra;
    const parolaSopra = quadro.sopra;
    const centroInchiostro = tra(
      (uni.destra - uni.sinistra) / 2,
      (parolaSopra.destra - parolaSopra.sinistra) / 2,
      stato.cambio,
    );
    const x = centroX - centroInchiostro * scala;

    gruppoSopra.setAttribute('transform', `translate(${x.toFixed(2)} ${stato.baseSopra.toFixed(2)}) scale(${scala.toFixed(5)})`);
    titoloUni.style.opacity = (1 - stato.cambio).toFixed(3);
    titoloUni.setAttribute('x', '0');
    titoloSopra.style.opacity = stato.cambio > 0 ? '1' : '0';
    sopra.pezzi.forEach((pezzo) => {
      pezzo.style.fontWeight = String(PESO_TITOLI);
    });
    rivelaSopra.setAttribute('width', (tra(0, parolaSopra.destra + corpoSopra * 0.05, stato.rivelaSopra) + corpoSopra).toFixed(1));
    disegnaEtichetta(stato.etichetta, x, scala);

    lineaOrizzontale('maiuscole-sopra', stato.baseSopra - corpoSopra * scala * METRICHE.maiuscole);
    lineaOrizzontale('base-sopra', stato.baseSopra);
  }

  function disegnaEtichetta(apertura, spostamento, scala) {
    const maiuscole = quadro.corpoSopra * METRICHE.maiuscole;
    const bordo = maiuscole * MARGINE_ETICHETTA;
    const sinistra = (quadro.larghezza * MARGINE - spostamento) / scala;
    const destra = (quadro.larghezza * (1 - MARGINE) - spostamento) / scala;
    const sopraBordo = -maiuscole - bordo;
    const sottoBordo = bordo;
    const larghezza = (destra - sinistra) * apertura;
    const altezza = (sottoBordo - sopraBordo) * apertura;
    const x = (sinistra + destra - larghezza) / 2;
    const y = (sopraBordo + sottoBordo - altezza) / 2;
    const raggio = Math.min(quadro.raggio / scala, larghezza / 2, altezza / 2);
    [etichetta, ritaglioEtichetta].forEach((rettangolo) => {
      rettangolo.setAttribute('x', x.toFixed(2));
      rettangolo.setAttribute('y', y.toFixed(2));
      rettangolo.setAttribute('width', larghezza.toFixed(2));
      rettangolo.setAttribute('height', altezza.toFixed(2));
      rettangolo.setAttribute('rx', raggio.toFixed(2));
    });
    const visibile = apertura > 0 ? '' : 'hidden';
    etichetta.style.visibility = visibile;
    titoloInverso.style.visibility = visibile;
  }

  function disegnaSotto(stato) {
    const { corpoSotto, baseSotto, larghezza, spazio } = quadro;
    const m = misuraTesto(sotto.testo, stato.pesiSotto, corpoSotto);
    const scala = spazio / m.larghezza;
    const x = larghezza * MARGINE + m.sinistra * scala;

    gruppoSotto.setAttribute('transform', `translate(${x.toFixed(2)} ${baseSotto.toFixed(2)}) scale(${scala.toFixed(5)})`);
    sotto.pezzi.forEach((pezzo, i) => {
      pezzo.style.fontWeight = stato.pesiSotto[i].toFixed(1);
    });
    const visibile = stato.rivelaSotto > 0;
    titoloSotto.style.opacity = visibile ? '1' : '0';
    rivelaSotto.setAttribute('width', (tra(0, m.destra + corpoSotto * 0.05, stato.rivelaSotto) + corpoSotto).toFixed(1));

    const corpoVisto = corpoSotto * scala;
    lineaOrizzontale('maiuscole', baseSotto - corpoVisto * METRICHE.maiuscole, visibile);
    lineaOrizzontale('minuscole', baseSotto - corpoVisto * METRICHE.minuscole, visibile);
    lineaOrizzontale('base', baseSotto, visibile);
    lineaOrizzontale('discendenti', baseSotto + corpoVisto * METRICHE.discendenti, visibile);
  }

  function disegna(stato) {
    ultimoStato = stato;
    if (!quadro) return;
    disegnaSopra(stato);
    disegnaSotto(stato);
  }

  const alCentro = (scala) => quadro.centroY + (METRICHE.maiuscole * quadro.corpoSopra * scala) / 2;

  const statoBase = () => ({
    scalaSopra: quadro.scalaUni,
    baseSopra: alCentro(quadro.scalaUni),
    cambio: 0,
    rivelaSopra: 0,
    pesiSotto: sotto.medi,
    rivelaSotto: 0,
    etichetta: 0,
  });

  function statoRiduzione(t) {
    const scala = tra(quadro.scalaUni, 1, morbido(t));
    return { ...statoBase(), scalaSopra: scala, baseSopra: alCentro(scala) };
  }

  function statoCambio(t) {
    return { ...statoBase(), scalaSopra: 1, baseSopra: alCentro(1), cambio: uscita(t), rivelaSopra: morbido(t) };
  }

  function statoSpostamento(t) {
    return {
      ...statoBase(),
      scalaSopra: 1,
      baseSopra: tra(alCentro(1), quadro.baseSopra, morbido(t)),
      cambio: 1,
      rivelaSopra: 1,
    };
  }

  const statoEtichetta = (t) => ({ ...statoSpostamento(1), etichetta: allarga(t) });
  const statoGiocatore = (t) => ({ ...statoEtichetta(1), rivelaSotto: morbido(t) });
  const statoFermo = (pesiSotto) => ({ ...statoGiocatore(1), pesiSotto });

  const mano = { x: null, tempo: 0, spinta: 0, direzione: 1, storia: [], pesi: [] };

  addEventListener('mano-mossa', (e) => {
    const x = e.detail?.x;
    mano.x = typeof x === 'number' ? x : null;
    mano.tempo = performance.now();
  });

  function spintaDellaMano(adesso) {
    if (mano.x === null || adesso - mano.tempo > MANO.persa) return 0;
    const lato = (mano.x - MANO.centro) * (MANO.specchio ? -1 : 1);
    const oltre = Math.max(Math.abs(lato) - MANO.zonaMorta, 0);
    return Math.sign(lato) * limita(oltre / (MANO.corsa - MANO.zonaMorta));
  }

  function spintaPassata(adesso, ritardo) {
    const quando = adesso - ritardo;
    for (let i = mano.storia.length - 1; i >= 0; i -= 1) {
      if (mano.storia[i].tempo <= quando) return mano.storia[i].spinta;
    }
    return mano.storia[0]?.spinta ?? 0;
  }

  function seguiLaMano(numero) {
    const lettere = sotto.medi.length;
    mano.pesi = [...sotto.medi];
    mano.storia = [];
    mano.spinta = 0;
    let prima = performance.now();

    function passo(adesso) {
      if (numero !== giro) return;
      const trascorso = adesso - prima;
      prima = adesso;

      mano.spinta = tra(mano.spinta, spintaDellaMano(adesso), verso(trascorso, MANO.reattivita));
      if (Math.abs(mano.spinta) > 0.02) mano.direzione = Math.sign(mano.spinta);
      mano.storia.push({ tempo: adesso, spinta: mano.spinta });
      while (mano.storia.length && adesso - mano.storia[0].tempo > lettere * MANO.cascata + 200) mano.storia.shift();

      mano.pesi = mano.pesi.map((peso, i) => {
        const ordine = mano.direzione > 0 ? i : lettere - 1 - i;
        const spinta = spintaPassata(adesso, ordine * MANO.cascata);
        const scala = mano.direzione > 0 ? i / (lettere - 1) : (lettere - 1 - i) / (lettere - 1);
        const contrasto = tra(MANO.pesoLeggero, MANO.pesoPesante, scala);
        const obiettivoLettera = tra(PESO_TITOLI, contrasto, Math.abs(spinta));
        return tra(peso, obiettivoLettera, verso(trascorso, MANO.reattivita));
      });

      disegna(statoFermo(mano.pesi));
      requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  function creaGruppo(righe, vincitore = false) {
    const gruppo = document.createElement('dl');
    gruppo.className = vincitore ? 'gruppo-finale vincitore' : 'gruppo-finale';
    righe.forEach(([etichetta, valore]) => {
      const riga = document.createElement('div');
      riga.className = 'riga-finale';
      const nome = document.createElement('dt');
      const dato = document.createElement('dd');
      nome.textContent = etichetta;
      dato.textContent = String(valore);
      riga.append(nome, dato);
      gruppo.append(riga);
    });
    return gruppo;
  }

  function scriviDati(riepilogo) {
    const gruppiPartita = document.createElement('div');
    gruppiPartita.className = 'gruppi-partita';
    gruppiPartita.append(creaGruppo(riepilogo.generale), creaGruppo(riepilogo.pesi));
    colonnaPartita.replaceChildren(gruppiPartita);
    colonnaGiocatori.replaceChildren(
      ...riepilogo.giocatori.map((righe, i) => creaGruppo(righe, i + 1 === riepilogo.vincitore)),
    );
  }

  async function mostraRighe(numero) {
    const righe = [...dati.querySelectorAll('.riga-finale')];
    for (const riga of righe) {
      if (numero !== giro) return;
      riga.classList.add('visibile');
      if (!movimentoRidotto.matches) await aspetta(PAUSA_RIGHE);
    }
  }

  function anima(numero, durata, statoAl) {
    return new Promise((fine) => {
      const inizio = performance.now();
      function passo(adesso) {
        if (numero !== giro) return fine();
        const tempo = Math.min(adesso - inizio, durata);
        disegna(statoAl(tempo / durata));
        if (tempo < durata) requestAnimationFrame(passo);
        else fine();
      }
      requestAnimationFrame(passo);
    });
  }

  async function fontPronto() {
    const caratteri = `UNI ${sopra.testo} ${sotto.testo}`;
    const caricamento = Promise.all(
      [300, 400, 500, 550, 600, 700, 800, 900].map((peso) => document.fonts.load(`${peso} 100px "${FONT}"`, caratteri)),
    );
    await Promise.race([caricamento.catch(() => {}), aspetta(ATTESA_FONT_MAX)]);
  }

  async function apri(riepilogo) {
    const numero = ++giro;
    ultimoStato = null;
    sopra = preparaRiga(titoloSopra, TESTO_SOPRA);
    preparaRiga(titoloInverso, TESTO_SOPRA).pezzi.forEach((pezzo) => {
      pezzo.style.fontWeight = String(PESO_TITOLI);
    });
    sotto = preparaRiga(titoloSotto, `Player ${riepilogo.vincitore}`);
    scriviDati(riepilogo);
    disegno.style.visibility = 'hidden';
    schermata.classList.remove('colorata');
    schermata.hidden = false;
    document.documentElement.setAttribute('data-finale', '');

    await fontPronto();
    if (numero !== giro) return;
    allineaAllaDashboard();
    if (!quadro) return;
    disegno.style.visibility = '';

    if (movimentoRidotto.matches) {
      schermata.classList.add('colorata');
      disegna(statoFermo(sotto.medi));
      mostraRighe(numero);
      return;
    }

    disegna(statoBase());
    await aspetta(ATTESA_UNI);
    if (numero !== giro) return;

    await anima(numero, DURATA_RIDUZIONE, statoRiduzione);
    if (numero !== giro) return;

    await anima(numero, DURATA_CAMBIO, statoCambio);
    if (numero !== giro) return;

    await anima(numero, DURATA_SPOSTAMENTO, statoSpostamento);
    if (numero !== giro) return;

    await anima(numero, DURATA_ETICHETTA, statoEtichetta);
    if (numero !== giro) return;

    schermata.classList.add('colorata');
    await anima(numero, DURATA_GIOCATORE, statoGiocatore);
    if (numero !== giro) return;

    mostraRighe(numero);
    seguiLaMano(numero);
  }

  function chiudi() {
    giro += 1;
    ultimoStato = null;
    schermata.hidden = true;
    schermata.classList.remove('colorata');
    document.documentElement.removeAttribute('data-finale');
  }

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !schermata.hidden) chiudi();
  });

  window.UniFinale = Object.freeze({ apri, chiudi });
})();
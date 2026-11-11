(() => {
  'use strict';

  const FONT = 'Unisoft77';
  const UNITA_PER_EM = 1000;

  const PESO_MIN = 100;
  const PESO_MAX = 900;

  const NOMI_CIFRE = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

  const GLIFI_AMMESSI = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', '/'];

  const PESI = [
    [300, 'light'],
    [400, 'regular'],
    [500, 'medium'],
    [700, 'bold'],
    [800, 'black'],
    [900, 'xblack'],
  ];

  const LETTERE_GRAFICO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const ALTEZZA_MAIUSCOLE = 726;
  const INTERVALLO_GLIFI = 800;
  const PESO_MEDIO_GLIFI = 600;

  const GRAFICO = {
    altezza: 398,
    larghezza: 650,
    sinistra: 52,
    destra: 646,
    alto: 6,
    basso: 359,
    valoreMin: 300,
    valoreMax: 900,
    livelli: PESI.map(([peso]) => peso),
    distanzaTacche: 25,
    distanzaLinee: 100,
    colonne: 10,
    righelloAlto: 367,
    righelloBasso: 386,
    taccheRighello: 100,
    raggioPunti: 5,
    raggioAttivo: 9,
    margine: 12,
    onda: { periodi: 2.5, minimo: 300, massimo: 900, campioni: 240 },
  };

  const SPAZIO_TRA_SIMBOLI = 70;

  const POSTER = {
    lato: 1500,
    centroMetriche: -363,
    occupazioneMassima: 0.6,
    rientroSinistro: 32,
    rientroDestro: 57,
    distanzaScritte: 31,
    distanzaMisure: 12,
    distanzaLinee: 9,
  };

  const STORICO_ESEMPIO = [900, 800, 700, 500, 400, 300];
  const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
  const movimentoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)');

  const trova = (id) => document.getElementById(id);

  const el = {
    dashboard: trova('dashboard'),
    poster: trova('container-principale'),
    disegno: trova('disegno-lettera'),
    titoloPoster: trova('titolo-poster'),
    lettera: trova('testo-1'),
    lineaDestra: trova('linea-destra'),
    margineSinistro: trova('margine-sinistro'),
    larghezza: trova('larghezza'),
    margineDestro: trova('margine-destro'),
    grafico: trova('weight-graph'),
    graficoGlifo: trova('grafico-glifo'),
    descrizioneGrafico: trova('descrizione-grafico'),
    listeTurni: [trova('p1-numbers'), trova('p2-numbers')],
  };

  if (!el.dashboard || !el.lettera) {
    console.error('[UniDashboard] manca qualcosa nell\'HTML: controlla #dashboard e #testo-1.');
    return;
  }

  const riquadri = Array.from(el.dashboard.querySelectorAll(':scope > [data-riquadro]'));

  const stato = {
    carattere: '1',
    peso: PESI[0][0],
    corsivo: false,
  };

  const limita = (valore, min, max) => Math.min(max, Math.max(min, valore));

  function scriviTesto(id, valore) {
    const elemento = trova(id);
    if (elemento && valore !== undefined && valore !== null) {
      elemento.textContent = String(valore);
    }
  }

  const testoOnOff = (valore) => (valore ? 'on' : 'off');

  function creaSvg(tag, attributi = {}, genitore = null) {
    const elemento = document.createElementNS(NAMESPACE_SVG, tag);
    for (const [nome, valore] of Object.entries(attributi)) {
      elemento.setAttribute(nome, String(valore));
    }
    if (genitore) genitore.appendChild(elemento);
    return elemento;
  }

  function conTransizione(aggiorna) {
    if (typeof document.startViewTransition === 'function' && !movimentoRidotto.matches) {
      document.startViewTransition(aggiorna);
    } else {
      aggiorna();
    }
  }

  const NOMI_SIMBOLI = {
    ' ': ['space', 'space'],
    '!': ['exclam', 'exclamation mark'],
    '"': ['quotedbl', 'quotation mark'],
    '#': ['numbersign', 'number sign'],
    $: ['dollar', 'dollar sign'],
    '%': ['percent', 'percent sign'],
    '&': ['ampersand', 'ampersand'],
    "'": ['quotesingle', 'apostrophe'],
    '(': ['parenleft', 'left parenthesis'],
    ')': ['parenright', 'right parenthesis'],
    '*': ['asterisk', 'asterisk'],
    '+': ['plus', 'plus sign'],
    ',': ['comma', 'comma'],
    '-': ['hyphen', 'hyphen-minus'],
    '.': ['period', 'full stop'],
    '/': ['slash', 'solidus'],
    ':': ['colon', 'colon'],
    ';': ['semicolon', 'semicolon'],
    '<': ['less', 'less-than sign'],
    '=': ['equal', 'equals sign'],
    '>': ['greater', 'greater-than sign'],
    '?': ['question', 'question mark'],
    '@': ['at', 'commercial at'],
    '[': ['bracketleft', 'left square bracket'],
    '\\': ['backslash', 'reverse solidus'],
    ']': ['bracketright', 'right square bracket'],
    '^': ['asciicircum', 'circumflex accent'],
    _: ['underscore', 'low line'],
    '`': ['grave', 'grave accent'],
    '{': ['braceleft', 'left curly bracket'],
    '|': ['bar', 'vertical line'],
    '}': ['braceright', 'right curly bracket'],
    '~': ['asciitilde', 'tilde'],
    '¡': ['exclamdown', 'inverted exclamation mark'],
    '¿': ['questiondown', 'inverted question mark'],
    '§': ['section', 'section sign'],
    '©': ['copyright', 'copyright sign'],
    '®': ['registered', 'registered sign'],
    '°': ['degree', 'degree sign'],
    '±': ['plusminus', 'plus-minus sign'],
    '·': ['periodcentered', 'middle dot'],
    '×': ['multiply', 'multiplication sign'],
    '÷': ['divide', 'division sign'],
    '«': ['guillemotleft', 'left-pointing double angle quotation mark'],
    '»': ['guillemotright', 'right-pointing double angle quotation mark'],
    '–': ['endash', 'en dash'],
    '—': ['emdash', 'em dash'],
    '‘': ['quoteleft', 'left single quotation mark'],
    '’': ['quoteright', 'right single quotation mark'],
    '“': ['quotedblleft', 'left double quotation mark'],
    '”': ['quotedblright', 'right double quotation mark'],
    '…': ['ellipsis', 'horizontal ellipsis'],
    '€': ['Euro', 'euro sign'],
  };

  const LETTERE_SPECIALI = {
    ß: ['germandbls', 'latin small letter sharp S'],
    æ: ['ae', 'latin small letter AE'],
    Æ: ['AE', 'latin capital letter AE'],
    œ: ['oe', 'latin small ligature OE'],
    Œ: ['OE', 'latin capital ligature OE'],
    ø: ['oslash', 'latin small letter O with stroke'],
    Ø: ['Oslash', 'latin capital letter O with stroke'],
    đ: ['dcroat', 'latin small letter D with stroke'],
    Đ: ['Dcroat', 'latin capital letter D with stroke'],
    ł: ['lslash', 'latin small letter L with stroke'],
    Ł: ['Lslash', 'latin capital letter L with stroke'],
  };

  const NOMI_ACCENTI = {
    '\u0300': ['grave', 'grave'],
    '\u0301': ['acute', 'acute'],
    '\u0302': ['circumflex', 'circumflex'],
    '\u0303': ['tilde', 'tilde'],
    '\u0304': ['macron', 'macron'],
    '\u0306': ['breve', 'breve'],
    '\u0307': ['dotaccent', 'dot above'],
    '\u0308': ['dieresis', 'diaeresis'],
    '\u030A': ['ring', 'ring above'],
    '\u030B': ['hungarumlaut', 'double acute'],
    '\u030C': ['caron', 'caron'],
    '\u0327': ['cedilla', 'cedilla'],
    '\u0328': ['ogonek', 'ogonek'],
  };

  function nomeLetteraSemplice(carattere) {
    if (carattere >= '0' && carattere <= '9') {
      const nome = NOMI_CIFRE[carattere.charCodeAt(0) - 48];
      return [nome, `digit ${nome}`];
    }
    if (carattere >= 'A' && carattere <= 'Z') return [carattere, `latin capital letter ${carattere}`];
    if (carattere >= 'a' && carattere <= 'z') {
      return [carattere, `latin small letter ${carattere.toUpperCase()}`];
    }
    return null;
  }

  function nomeLetteraAccentata(carattere) {
    const [base, accento, ...resto] = Array.from(carattere.normalize('NFD'));
    if (!accento || resto.length || !NOMI_ACCENTI[accento]) return null;

    const nomeBase = nomeLetteraSemplice(base);
    if (!nomeBase || !/[a-z]/i.test(base)) return null;

    const [accentoGlifo, accentoUnicode] = NOMI_ACCENTI[accento];
    return [`${base}${accentoGlifo}`, `${nomeBase[1]} with ${accentoUnicode}`];
  }

  function descriviCarattere(carattere) {
    const codice = carattere.codePointAt(0);
    const esadecimale = codice.toString(16).toUpperCase();
    const esadecimale4 = esadecimale.padStart(4, '0');

    const [nomeGlifo, nomeUnicode] = nomeLetteraSemplice(carattere) ||
      NOMI_SIMBOLI[carattere] ||
      LETTERE_SPECIALI[carattere] ||
      nomeLetteraAccentata(carattere) || [`uni${esadecimale4}`, '—'];

    return {
      nomeGlifo,
      nomeUnicode,
      decimale: codice,
      esadecimale: esadecimale4,
      entita: `&#x${esadecimale};`,
    };
  }

  function descriviGlifo(testo) {
    const caratteri = Array.from(testo);
    if (caratteri.length === 1) return descriviCarattere(testo);

    const parti = caratteri.map(descriviCarattere);
    return {
      nomeGlifo: parti.map((p) => p.nomeGlifo).join('_'),
      nomeUnicode: parti.map((p) => p.nomeUnicode).join(' + '),
      decimale: parti.map((p) => p.decimale).join(' '),
      esadecimale: parti.map((p) => p.esadecimale).join(' '),
      entita: parti.map((p) => p.entita).join(''),
    };
  }

  const strumentoMisura = document.createElement('canvas').getContext('2d');

  function fontCss(peso, corsivo, dimensione) {
    return `${corsivo ? 'italic ' : ''}${peso} ${dimensione}px "${FONT}"`;
  }

  function misuraLettera(carattere, peso, corsivo) {
    strumentoMisura.font = fontCss(peso, corsivo, UNITA_PER_EM);
    const caratteri = Array.from(carattere);
    const misure = caratteri.map((c) => strumentoMisura.measureText(c));
    const spazi = misure.map((misura, i) => {
      if (i === 0) return 0;
      const prima = misure[i - 1];
      const vuoto = prima.width - prima.actualBoundingBoxRight - misura.actualBoundingBoxLeft;
      return Math.round(SPAZIO_TRA_SIMBOLI - vuoto);
    });
    const primo = misure[0];
    const ultimo = misure[misure.length - 1];
    const larghezza =
      misure.reduce((somma, misura) => somma + misura.width, 0) + spazi.reduce((somma, spazio) => somma + spazio, 0);

    return {
      larghezza: Math.round(larghezza),
      margineSinistro: Math.round(-primo.actualBoundingBoxLeft),
      margineDestro: Math.round(ultimo.width - ultimo.actualBoundingBoxRight),
      caratteri,
      spazi,
    };
  }

  function scriviLettera(caratteri, spazi) {
    el.lettera.replaceChildren(
      ...caratteri.map((carattere, i) => {
        const pezzo = document.createElementNS(NAMESPACE_SVG, 'tspan');
        pezzo.textContent = carattere;
        if (spazi[i]) pezzo.setAttribute('dx', spazi[i]);
        return pezzo;
      }),
    );
  }

  function inquadraPoster(larghezza) {
    const lato = Math.max(POSTER.lato, larghezza / POSTER.occupazioneMassima);
    const scala = lato / POSTER.lato;
    const sinistra = -lato / 2;
    const alto = POSTER.centroMetriche - lato / 2;

    el.disegno.setAttribute('viewBox', `${sinistra} ${alto} ${lato} ${lato}`);
    el.disegno.style.setProperty('--scala-poster', String(scala));

    el.disegno.querySelectorAll('.linee-orizzontali line').forEach((linea) => {
      const y = Number(linea.getAttribute('y1'));
      const nome = linea.nextElementSibling;
      const valore = nome.nextElementSibling;
      linea.setAttribute('x1', sinistra + POSTER.rientroSinistro * scala);
      linea.setAttribute('x2', -sinistra - POSTER.rientroDestro * scala);
      nome.setAttribute('x', sinistra + POSTER.rientroSinistro * scala);
      valore.setAttribute('x', -sinistra - POSTER.rientroDestro * scala);
      nome.setAttribute('y', y + POSTER.distanzaScritte * scala);
      valore.setAttribute('y', y + POSTER.distanzaScritte * scala);
    });

    el.disegno.querySelectorAll('.linee-verticali line').forEach((linea) => {
      linea.setAttribute('y1', alto);
      linea.setAttribute('y2', alto + lato);
    });

    [el.margineSinistro, el.larghezza, el.margineDestro].forEach((misura) => {
      misura.setAttribute('y', alto + lato - POSTER.distanzaMisure * scala);
    });

    return scala;
  }

  function mostraMisure({ larghezza, margineSinistro, margineDestro, caratteri, spazi }) {
    scriviLettera(caratteri, spazi);
    const scala = inquadraPoster(larghezza);
    el.disegno.style.setProperty('--larghezza-lettera', String(larghezza));

    el.lineaDestra.setAttribute('x1', larghezza);
    el.lineaDestra.setAttribute('x2', larghezza);

    el.margineSinistro.setAttribute('x', -POSTER.distanzaLinee * scala);
    el.larghezza.setAttribute('x', larghezza / 2);
    el.margineDestro.setAttribute('x', larghezza + POSTER.distanzaLinee * scala);

    el.margineSinistro.textContent = String(margineSinistro);
    el.larghezza.textContent = String(larghezza);
    el.margineDestro.textContent = String(margineDestro);
  }

  let ultimaMisura = 0;

  async function aggiornaMisure() {
    const numero = ++ultimaMisura;
    const { carattere, peso, corsivo } = stato;

    try {
      const caricati = await document.fonts.load(fontCss(peso, corsivo, 16), carattere);
      if (!caricati.length) return;
    } catch {
      return;
    }

    if (numero !== ultimaMisura) return;
    mostraMisure(misuraLettera(carattere, peso, corsivo));
  }

  async function fontPronto(carattere) {
    try {
      const caricati = await document.fonts.load(fontCss(400, false, 16), carattere);
      return caricati.length > 0;
    } catch {
      return false;
    }
  }

  function fontHaLaLettera(carattere) {
    const dimensione = 200;
    return ['monospace', 'serif'].some((riserva) => {
      strumentoMisura.font = `${dimensione}px "${FONT}", ${riserva}`;
      const conFont = strumentoMisura.measureText(carattere);
      strumentoMisura.font = `${dimensione}px ${riserva}`;
      const soloRiserva = strumentoMisura.measureText(carattere);
      return (
        conFont.width !== soloRiserva.width ||
        conFont.actualBoundingBoxRight !== soloRiserva.actualBoundingBoxRight ||
        conFont.actualBoundingBoxAscent !== soloRiserva.actualBoundingBoxAscent
      );
    });
  }

  function aggiornaTitoloPoster() {
    const corsivo = stato.corsivo ? ', italic' : '';
    el.titoloPoster.textContent = `Glyph ${stato.carattere}, weight ${stato.peso}${corsivo}`;
  }

  let ultimaLettera = 0;

  async function cambiaLettera(testo) {
    const carattere = String(testo ?? '').trim();
    if (!GLIFI_AMMESSI.includes(carattere)) {
      console.warn('[UniDashboard] cambiaLettera accetta solo 0-9, +2 e /, ricevuto:', testo);
      return false;
    }

    const numero = ++ultimaLettera;

    if ((await fontPronto(carattere)) && !fontHaLaLettera(carattere)) {
      console.warn(`[UniDashboard] "${carattere}" non è nel font Unisoft77, la lettera non cambia.`);
      return false;
    }
    if (numero !== ultimaLettera) return false;

    stato.carattere = carattere;
    el.lettera.textContent = carattere;

    const info = descriviGlifo(carattere);
    scriviTesto('glyph-name', info.nomeGlifo);
    scriviTesto('unicode-name', info.nomeUnicode);
    scriviTesto('unicode-decimal', info.decimale);
    scriviTesto('unicode-hex', info.esadecimale);
    scriviTesto('html-entity', info.entita);

    aggiornaTitoloPoster();
    aggiornaMisure();
    return true;
  }

  function cambiaStile({ peso, corsivo, colore } = {}) {
    if (peso !== undefined) {
      const valore = Number(peso);
      if (Number.isFinite(valore)) {
        stato.peso = Math.round(limita(valore, PESO_MIN, PESO_MAX));
        el.poster.style.setProperty('--peso-lettera', String(stato.peso));
        el.graficoGlifo.style.setProperty('--peso-lettera', String(stato.peso));
        scriviTesto('glyph-weight', stato.peso);
        disegnaStoricoPeso();
      }
    }

    if (corsivo !== undefined) {
      stato.corsivo = Boolean(corsivo);
      el.poster.style.setProperty('--stile-lettera', stato.corsivo ? 'italic' : 'normal');
      el.graficoGlifo.style.setProperty(
      '--stile-lettera',
      stato.corsivo ? 'italic' : 'normal'
      );
      document.documentElement.toggleAttribute('data-corsivo', stato.corsivo);
      scriviTesto('glyph-italic', testoOnOff(stato.corsivo));
    }

    if (colore !== undefined) {
      if (typeof colore === 'string' && CSS.supports('color', colore)) {
        el.poster.style.setProperty('--colore-lettera', colore);
      } else {
        console.warn('[UniDashboard] colore non valido:', colore);
      }
    }

    aggiornaTitoloPoster();
    aggiornaMisure();
  }

  const giocatoreHaIniziato = new Map();

  function aggiungiNumeroTurno(lista) {
    const prossimo = Number(lista.lastElementChild.dataset.turno) + 2;
    const numero = document.createElement('li');
    numero.dataset.turno = String(prossimo);
    numero.textContent = String(prossimo).padStart(2, '0');
    lista.appendChild(numero);
    return numero;
  }

  function centraTurnoAttivo(lista, animato = false) {
    const attivo = lista.querySelector('[aria-current]');
    if (!attivo) return;

    const posizione = attivo.offsetTop - (lista.clientHeight - attivo.offsetHeight) / 2;
    lista.scrollTo({
      top: Math.max(0, posizione),
      behavior: animato && !movimentoRidotto.matches ? 'smooth' : 'auto',
    });
  }

  function evidenziaTurno(lista, numero, animato = true) {
    Array.from(lista.children).forEach((voce) => {
      if (voce === numero) voce.setAttribute('aria-current', 'step');
      else voce.removeAttribute('aria-current');
    });
    centraTurnoAttivo(lista, animato);
  }

  function turniDelGiocatore(giocatore) {
    const numero = Number(giocatore);
    if (numero !== 1 && numero !== 2) {
      console.warn('[UniDashboard] il giocatore deve essere 1 o 2, ricevuto:', giocatore);
      return null;
    }
    return el.listeTurni[numero - 1];
  }

  function vaiAlTurno(lista, turno) {
    const valore = Math.trunc(Number(turno));
    if (!Number.isFinite(valore) || valore < 1) return;

    let numero = lista.querySelector(`[data-turno="${valore}"]`);
    while (!numero && Number(lista.lastElementChild.dataset.turno) < valore) {
      const nuovo = aggiungiNumeroTurno(lista);
      if (Number(nuovo.dataset.turno) === valore) numero = nuovo;
    }
    if (!numero) {
      console.warn(`[UniDashboard] il turno ${valore} non è di questo giocatore.`);
      return;
    }

    giocatoreHaIniziato.set(lista, true);
    evidenziaTurno(lista, numero);
  }

  function prossimoTurno(giocatore) {
    const lista = turniDelGiocatore(giocatore);
    if (!lista) return null;

    const attuale = lista.querySelector('[aria-current]') || lista.firstElementChild;
    let numero = attuale;
    if (giocatoreHaIniziato.get(lista)) {
      numero = attuale.nextElementSibling || aggiungiNumeroTurno(lista);
    }

    giocatoreHaIniziato.set(lista, true);
    evidenziaTurno(lista, numero);

    const turno = Number(numero.dataset.turno);
    scriviTesto('turn', turno);
    return turno;
  }

  function azzeraTurni() {
    el.listeTurni.forEach((lista) => {
      giocatoreHaIniziato.set(lista, false);
      evidenziaTurno(lista, lista.firstElementChild, false);
    });
    scriviTesto('turn', 1);
  }

  const COLORI = ['rosso', 'giallo', 'verde', 'blu'];
  const COLORI_IN_INGLESE = { red: 'rosso', yellow: 'giallo', green: 'verde', blue: 'blu' };
  const quadratoColore = document.querySelector('.colore-attuale');
  const testoColore = trova('testo-colore');

  function nomeColore(colore) {
    const nome = String(colore ?? '').trim().toLowerCase();
    if (COLORI.includes(nome)) return nome;
    return COLORI_IN_INGLESE[nome] ?? null;
  }

  function cambiaColore(colore) {
    const nome = nomeColore(colore);
    if (!nome) {
      console.warn('[UniDashboard] colore sconosciuto:', colore);
      return;
    }
    document.documentElement.dataset.colore = nome;
    quadratoColore.dataset.colore = nome;
    testoColore.textContent = nome;
  }

  function azzeraColore() {
    delete document.documentElement.dataset.colore;
    delete quadratoColore.dataset.colore;
    testoColore.textContent = 'blu';
  }

  function aggiornaGiocatore(giocatore, dati = {}) {
    const lista = turniDelGiocatore(giocatore);
    if (!lista) return;
    const numero = Number(giocatore);

    scriviTesto(`p${numero}-card`, dati.ultimaCarta);
    scriviTesto(`p${numero}-event`, dati.evento);
    scriviTesto(`p${numero}-color`, dati.colore);
    scriviTesto(`p${numero}-weight`, dati.peso);
    if (dati.corsivo !== undefined) scriviTesto(`p${numero}-italic`, testoOnOff(dati.corsivo));
    if (dati.turno !== undefined) vaiAlTurno(lista, dati.turno);
  }

  function aggiornaInfo(dati = {}) {
    scriviTesto('turn', dati.turno);
    scriviTesto('last-card', dati.ultimaCarta);
    scriviTesto('event', dati.evento);
    scriviTesto('glyph-color', dati.colore);
    scriviTesto('glyph-axis', dati.asse);

    if (dati.peso !== undefined || dati.corsivo !== undefined) {
      cambiaStile({ peso: dati.peso, corsivo: dati.corsivo });
    }
  }

  const parti = {};

  const xPer = (t) => GRAFICO.sinistra + t * (GRAFICO.destra - GRAFICO.sinistra);

  function yPer(valore) {
    const { valoreMin, valoreMax, alto, basso } = GRAFICO;
    const t = (limita(valore, valoreMin, valoreMax) - valoreMin) / (valoreMax - valoreMin);
    return basso - t * (basso - alto);
  }

  const arrotonda = (numero) => Number(numero.toFixed(2));

  function costruisciGlifiColore() {
  el.graficoGlifo.replaceChildren();

  parti.glifi = [0, 1].map(() =>
    creaSvg('text', {
      class: 'glifo-grafico',
      'aria-hidden': 'true',
      'text-anchor': 'middle'
    }, el.graficoGlifo)
  );

  parti.glifi[glifoVisibile].classList.add('visibile');

  impaginaGlifi();
}

  function costruisciGrafico() {
    parti.animazioneOnda?.cancel();
    parti.contenuto?.remove();
    const contenuto = creaSvg('g', { class: 'contenuto-grafico' }, el.grafico);
    parti.contenuto = contenuto;

    const griglia = creaSvg('g', { class: 'griglia-grafico', 'aria-hidden': 'true' }, contenuto);
    const tacche = creaSvg('g', { class: 'tacche', 'aria-hidden': 'true' }, contenuto);
    const numeri = creaSvg('g', { class: 'numeri-asse', 'aria-hidden': 'true' }, contenuto);

    for (let i = 0; i <= GRAFICO.colonne; i += 1) {
      const x = arrotonda(xPer(i / GRAFICO.colonne));
      creaSvg('line', { x1: x, x2: x, y1: GRAFICO.alto, y2: GRAFICO.basso }, griglia);
    }

    const asseX = GRAFICO.sinistra - 10;
    for (let valore = GRAFICO.valoreMin; valore <= GRAFICO.valoreMax; valore += GRAFICO.distanzaTacche) {
      const y = arrotonda(yPer(valore));
      const conLinea = (valore - GRAFICO.valoreMin) % GRAFICO.distanzaLinee === 0;
      const conNumero = GRAFICO.livelli.includes(valore);

      if (conLinea) {
        creaSvg(
          'line',
          { class: 'linea-tratteggiata', x1: asseX, x2: GRAFICO.destra, y1: y, y2: y },
          griglia,
        );
      }

      if (conNumero) {
        const numero = creaSvg('text', { x: 0, y, 'dominant-baseline': 'central' }, numeri);
        numero.textContent = String(valore);
      }

      creaSvg(
        'line',
        { x1: conLinea ? asseX : asseX + 3, x2: GRAFICO.sinistra - 1, y1: y, y2: y },
        tacche,
      );
    }

    for (let i = 0; i <= GRAFICO.taccheRighello; i += 1) {
      const x = arrotonda(xPer(i / GRAFICO.taccheRighello));
      creaSvg('line', { x1: x, x2: x, y1: GRAFICO.righelloAlto, y2: GRAFICO.righelloBasso }, tacche);
    }

    parti.onda = creaSvg('path', { class: 'onda', 'aria-hidden': 'true' }, contenuto);

    parti.lineaPeso = creaSvg('path', { class: 'linea-peso', 'aria-hidden': 'true' }, contenuto);
    parti.puntiPeso = creaSvg('g', { class: 'punti-peso', 'aria-hidden': 'true' }, contenuto);
  }

  function curvaMorbida(punti) {
    if (punti.length === 0) return '';
    let percorso = `M${arrotonda(punti[0].x)} ${arrotonda(punti[0].y)}`;

    const pendenze = punti.slice(1).map((a, i) => (a.y - punti[i].y) / (a.x - punti[i].x));
    const tangenti = punti.map((_, i) => {
      const prima = pendenze[i - 1] ?? pendenze[i];
      const dopo = pendenze[i] ?? pendenze[i - 1];
      if (prima * dopo <= 0) return 0;
      return (2 * prima * dopo) / (prima + dopo);
    });

    for (let i = 0; i < punti.length - 1; i += 1) {
      const da = punti[i];
      const a = punti[i + 1];
      const terzo = (a.x - da.x) / 3;

      const controllo1x = da.x + terzo;
      const controllo1y = da.y + tangenti[i] * terzo;
      const controllo2x = a.x - terzo;
      const controllo2y = a.y - tangenti[i + 1] * terzo;

      percorso += ` C${arrotonda(controllo1x)} ${arrotonda(controllo1y)}`;
      percorso += ` ${arrotonda(controllo2x)} ${arrotonda(controllo2y)}`;
      percorso += ` ${arrotonda(a.x)} ${arrotonda(a.y)}`;
    }
    return percorso;
  }

  let storicoPeso = [];
  let glifiGrafico = [...LETTERE_GRAFICO];
  let indiceGlifo = 0;
  let glifoVisibile = 0;
  let estensioneGlifi = { sopra: 963, sotto: 237 };

  async function preparaGlifiGrafico() {
    const simboli = Object.keys(NOMI_SIMBOLI).filter((simbolo) => simbolo.trim());
    if (!(await fontPronto(simboli.join('')))) return;

    glifiGrafico = [...LETTERE_GRAFICO, ...simboli.filter(fontHaLaLettera)];
    strumentoMisura.font = fontCss(400, false, UNITA_PER_EM);
    estensioneGlifi = glifiGrafico.reduce(
      (estensione, glifo) => {
        const misura = strumentoMisura.measureText(glifo);
        return {
          sopra: Math.max(estensione.sopra, misura.actualBoundingBoxAscent),
          sotto: Math.max(estensione.sotto, misura.actualBoundingBoxDescent),
        };
      },
      { sopra: 0, sotto: 0 },
    );
    impaginaGlifi();
  }

  function mettiGlifo(elemento, glifo) {
  elemento.textContent = glifo;

  elemento.setAttribute('x', 200);
  elemento.setAttribute('text-anchor', 'middle');
}

  function impaginaGlifi() {
  if (!parti.glifi) return;

  const corpo = 280;

  parti.glifi.forEach((elemento) => {
    elemento.setAttribute('font-size', corpo);
    elemento.setAttribute('x', 200);
    elemento.setAttribute('y', 200);
    elemento.setAttribute('dominant-baseline', 'central');
  });

  mettiGlifo(
    parti.glifi[glifoVisibile],
    glifiGrafico[indiceGlifo]
  );
}

  function prossimoGlifo() {
    if (!parti.glifi) return;

    indiceGlifo = (indiceGlifo + 1) % glifiGrafico.length;
    const uscente = parti.glifi[glifoVisibile];
    glifoVisibile = 1 - glifoVisibile;
    const entrante = parti.glifi[glifoVisibile];

    mettiGlifo(entrante, glifiGrafico[indiceGlifo]);
    uscente.classList.remove('visibile');
    entrante.classList.add('visibile');
  }

  function adattaGrafico() {
    const { clientWidth, clientHeight } = el.grafico;
    if (!clientWidth || !clientHeight) return;

    const larghezza = Math.round((GRAFICO.altezza * clientWidth) / clientHeight);
    if (larghezza === GRAFICO.larghezza && parti.contenuto) return;

    GRAFICO.larghezza = larghezza;
    GRAFICO.destra = larghezza - GRAFICO.margine;
    el.grafico.setAttribute('viewBox', `0 0 ${larghezza} ${GRAFICO.altezza}`);
    costruisciGrafico();
    disegnaStoricoPeso();
  }

  function disegnaStoricoPeso() {
    if (!parti.lineaPeso) return;
    const ultimo = Math.max(storicoPeso.length - 1, 1);
    const punti = storicoPeso.map((peso, i) => ({
      x: xPer(storicoPeso.length === 1 ? 1 : i / ultimo),
      y: yPer(peso),
    }));
    const attivo = storicoPeso.lastIndexOf(stato.peso);
    const pesoOnda = limita(stato.peso, GRAFICO.valoreMin, GRAFICO.valoreMax);
    const { minimo, massimo, periodi } = GRAFICO.onda;
    const centroOnda = (minimo + massimo) / 2;
    const ampiezzaOnda = (massimo - minimo) / 2;
    const faseIniziale = Math.acos(limita((centroOnda - pesoOnda) / ampiezzaOnda, -1, 1));
    let percorsoOnda = '';
    for (let i = 0; i <= GRAFICO.onda.campioni; i += 1) {
      const t = i / GRAFICO.onda.campioni;
      const fase = faseIniziale - 2 * Math.PI * periodi * t;
      const valore = centroOnda - ampiezzaOnda * Math.cos(fase);
      percorsoOnda += `${i === 0 ? 'M' : 'L'}${arrotonda(xPer(1 - t))} ${arrotonda(yPer(valore))}`;
    }

    parti.onda.setAttribute('d', percorsoOnda);
    const lunghezzaOnda = parti.onda.getTotalLength();
    parti.onda.style.strokeDasharray = `${lunghezzaOnda} ${lunghezzaOnda}`;
    parti.animazioneOnda?.cancel();
    parti.onda.style.strokeDashoffset = String(lunghezzaOnda);
    parti.animazioneOnda = parti.onda.animate(
      [{ strokeDashoffset: lunghezzaOnda }, { strokeDashoffset: 0 }],
      {
        duration: movimentoRidotto.matches ? 0 : 500,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      },
    );
    parti.lineaPeso.setAttribute('d', curvaMorbida(punti));
    parti.puntiPeso.replaceChildren(
      ...punti.map((punto, i) =>
        creaSvg('circle', {
          class: i === attivo ? 'attivo' : '',
          cx: arrotonda(punto.x),
          cy: arrotonda(punto.y),
          r: i === attivo ? GRAFICO.raggioAttivo : GRAFICO.raggioPunti,
        }),
      ),
    );

    el.descrizioneGrafico.textContent = storicoPeso.length
      ? `Weight per turn: ${storicoPeso.join(', ')}.`
      : 'No turns played yet.';
  }

  function impostaStoricoPeso(pesi) {
    if (!Array.isArray(pesi)) {
      return;
    }
    storicoPeso = pesi.map(Number).filter(Number.isFinite);
    disegnaStoricoPeso();
  }

  function trovaRiquadro(nome) {
    const riquadro = riquadri.find((r) => r.dataset.riquadro === nome);
    if (!riquadro) console.warn('[UniDashboard] riquadro sconosciuto:', nome);
    return riquadro;
  }

  function mostraSolo(nome) {
    const scelto = trovaRiquadro(nome);
    if (!scelto) return;

    conTransizione(() => {
      riquadri.forEach((riquadro) => {
        riquadro.hidden = riquadro !== scelto;
      });
      el.dashboard.dataset.solo = nome;
    });
  }

  function mostraTutti() {
    conTransizione(() => {
      riquadri.forEach((riquadro) => {
        riquadro.hidden = false;
      });
      delete el.dashboard.dataset.solo;
    });
  }

  function mostraRiquadro(nome, visibile) {
    const riquadro = trovaRiquadro(nome);
    if (!riquadro) return;
    conTransizione(() => {
      riquadro.hidden = !visibile;
    });
  }

  async function controllaFont() {
    const font = fontCss(400, false, UNITA_PER_EM);
    await document.fonts.load(font, 'Hx');
    strumentoMisura.font = font;
    const risultato = {
      capHeight: Math.round(strumentoMisura.measureText('H').actualBoundingBoxAscent),
      xHeight: Math.round(strumentoMisura.measureText('x').actualBoundingBoxAscent),
      attesi: { capHeight: 726, xHeight: 516 },
    };
    console.table(risultato);
    return risultato;
  }

  const COLORI_PER_TABELLA = { rosso: 'red', giallo: 'yellow', verde: 'green', blu: 'blue' };

  const partita = {
    turno: 0,
    colore: null,
    gradino: 0,
    coloreManuale: null,
    partenza: false,
    storia: [],
  };

  const giocatoreDelTurno = (turno) => (turno % 2 === 1 ? 1 : 2);
  const CARTA_CAMBIA_COLORE = 'change color';

  function impostaColoreManuale(colore) {
    const nome = nomeColore(colore);
    if (!nome) {
      console.warn('[UniDashboard] colore sconosciuto:', colore);
      return;
    }
    partita.coloreManuale = nome;
  }

  function giocaPartenza(carta, coloreCarta) {
    const colore = nomeColore(coloreCarta) ?? window.UniWebcam?.coloreRilevato() ?? partita.coloreManuale;
    const [peso, nomePeso] = PESI[0];
    partita.partenza = true;
    partita.gradino = 0;
    partita.colore = colore;

    cambiaLettera(carta);
    if (colore) cambiaColore(colore);
    aggiornaInfo({
      turno: 0,
      ultimaCarta: carta,
      evento: `start ${nomePeso}`,
      colore: COLORI_PER_TABELLA[colore] ?? '—',
      peso,
      corsivo: stato.corsivo,
      asse: 'weight',
    });
    impostaStoricoPeso([peso]);
    return 'partenza';
  }

  function giocaCarta(carta, coloreCarta) {
    if (!GLIFI_AMMESSI.includes(carta)) {
      console.warn('[UniDashboard] carta non ammessa:', carta);
      return false;
    }
    if (!partita.partenza && partita.turno === 0) return giocaPartenza(carta, coloreCarta);

    const colore = nomeColore(coloreCarta) ?? window.UniWebcam?.coloreRilevato() ?? partita.coloreManuale;
    const slash = carta === '/';
    const stessoColore = colore === partita.colore;
    if (colore) {
      if (!slash) partita.gradino = stessoColore ? Math.min(partita.gradino + 1, PESI.length - 1) : 0;
      partita.colore = colore;
    } else {
      console.warn('[UniDashboard] nessun colore rilevato: inquadra la carta o premi r/y/g/b.');
    }
    partita.turno += 1;

    const [peso, nomePeso] = PESI[partita.gradino];
    const corsivo = slash ? !stato.corsivo : stato.corsivo;

    const eventi = [];
    if (!colore) eventi.push('no color');
    else if (!slash) eventi.push(stessoColore ? `weight++ ${nomePeso}` : `reset ${nomePeso}`);
    if (slash) eventi.push(`italic ${testoOnOff(corsivo)}`);

    const dati = {
      turno: partita.turno,
      ultimaCarta: carta,
      evento: eventi.join(', '),
      colore: COLORI_PER_TABELLA[colore] ?? '—',
      peso,
      corsivo,
    };

    const giocatore = giocatoreDelTurno(partita.turno);
    partita.storia.push({ giocatore, carta, colore, peso, corsivo });

    cambiaLettera(carta);
    if (colore) cambiaColore(colore);
    aggiornaInfo({ ...dati, asse: carta === '/' ? 'italic' : 'weight' });
    aggiornaGiocatore(giocatore, dati);

    const storico = partita.turno === 1 && !partita.partenza ? [] : storicoPeso;
    impostaStoricoPeso([...storico, peso].slice(-(GRAFICO.colonne + 1)));
    return true;
  }

  function giocaCambioColore(coloreScelto) {
    const colore = nomeColore(coloreScelto);
    if (!colore) {
      console.warn('[UniDashboard] colore sconosciuto per il cambia colore:', coloreScelto);
      return false;
    }

    partita.gradino = 0;
    partita.colore = colore;
    partita.turno += 1;

    const [peso, nomePeso] = PESI[partita.gradino];
    const dati = {
      turno: partita.turno,
      ultimaCarta: CARTA_CAMBIA_COLORE,
      evento: `reset ${nomePeso}`,
      colore: COLORI_PER_TABELLA[colore],
      peso,
      corsivo: stato.corsivo,
    };

    const giocatore = giocatoreDelTurno(partita.turno);
    partita.storia.push({ giocatore, carta: CARTA_CAMBIA_COLORE, colore, peso, corsivo: stato.corsivo });

    cambiaColore(colore);
    aggiornaInfo({ ...dati, asse: 'weight' });
    aggiornaGiocatore(giocatore, dati);

    const storico = partita.turno === 1 && !partita.partenza ? [] : storicoPeso;
    impostaStoricoPeso([...storico, peso].slice(-(GRAFICO.colonne + 1)));
    return true;
  }

  const NOMI_PESI = { light: 'Light', regular: 'Regular', medium: 'Medium', bold: 'Bold', black: 'Black', xblack: 'XBlack' };

  function piuFrequente(valori) {
    const conti = new Map();
    valori.forEach((valore) => conti.set(valore, (conti.get(valore) ?? 0) + 1));
    let migliore = null;
    conti.forEach((conto, valore) => {
      if (!migliore || conto > migliore.conto) migliore = { valore, conto };
    });
    return migliore?.valore ?? null;
  }

  function serieDiColore(turni) {
    let migliore = null;
    let attuale = null;
    turni.forEach(({ colore }) => {
      if (!colore) return;
      attuale = attuale?.colore === colore ? { colore, lunghezza: attuale.lunghezza + 1 } : { colore, lunghezza: 1 };
      if (!migliore || attuale.lunghezza > migliore.lunghezza) migliore = attuale;
    });
    return migliore;
  }

  function riepilogoPartita() {
    const turni = partita.storia;
    const vincitore = giocatoreDelTurno(partita.turno + 1);
    const conta = (lista, condizione) => lista.filter(condizione).length;
    const inTabella = (colore) => COLORI_PER_TABELLA[colore] ?? '—';
    const colori = turni.map((turno) => turno.colore).filter(Boolean);
    const cambiColore = colori.filter((colore, i) => i > 0 && colore !== colori[i - 1]).length;
    const serie = serieDiColore(turni);
    const pesoMassimo = (lista) => (lista.length ? Math.max(...lista.map((turno) => turno.peso)) : '—');

    const generale = [
      ['Rounds', turni.length + 1],
      ['Winner', `player ${vincitore}`],
      ['Dominant color', inTabella(piuFrequente(colori))],
      ['Color switches', cambiColore],
      ['Longest streak', serie ? `${serie.lunghezza} ${inTabella(serie.colore)}` : '—'],
      ['+2 played', conta(turni, (turno) => turno.carta === '+2')],
      ['Change color cards', conta(turni, (turno) => turno.carta === CARTA_CAMBIA_COLORE)],
      ['Italic switches', conta(turni, (turno) => turno.carta === '/')],
      ['Heaviest weight', pesoMassimo(turni)],
    ];

    const pesi = PESI.map(([peso, nome]) => [`${NOMI_PESI[nome]} ${peso}`, conta(turni, (turno) => turno.peso === peso)]);

    const giocatori = [1, 2].map((numero) => {
      const suoi = turni.filter((turno) => turno.giocatore === numero);
      const haVinto = numero === vincitore;
      return [
        ['PLAYER', numero],
        ['Result', haVinto ? 'winner' : '2nd'],
        ['Cards played', suoi.length + (haVinto ? 1 : 0)],
        ['Last card', haVinto ? 'back' : (suoi[suoi.length - 1]?.carta ?? '—')],
        ['+2 played', conta(suoi, (turno) => turno.carta === '+2')],
        ['Top color', inTabella(piuFrequente(suoi.map((turno) => turno.colore).filter(Boolean)))],
        ['Max weight', pesoMassimo(suoi)],
      ];
    });

    return { vincitore, generale, pesi, giocatori };
  }

  function azzeraPartita() {
    partita.storia = [];
    partita.turno = 0;
    partita.colore = null;
    partita.gradino = 0;
    partita.partenza = false;
    azzeraTurni();
    azzeraColore();
    cambiaStile({ peso: PESI[0][0], corsivo: false });
    impostaStoricoPeso([]);
  }

  el.lettera.setAttribute('font-size', UNITA_PER_EM);

  cambiaStile({ peso: stato.peso, corsivo: stato.corsivo });
  impostaStoricoPeso(STORICO_ESEMPIO);
  adattaGrafico();
  costruisciGlifiColore();
  new ResizeObserver(adattaGrafico).observe(el.grafico);

  el.grafico.style.setProperty('--intervallo-glifi', `${INTERVALLO_GLIFI}ms`);
  preparaGlifiGrafico();
  if (!movimentoRidotto.matches) setInterval(prossimoGlifo, INTERVALLO_GLIFI);

  const osservaTurni = new ResizeObserver((cambiamenti) => {
    cambiamenti.forEach((cambiamento) => centraTurnoAttivo(cambiamento.target));
  });

  el.listeTurni.forEach((lista) => {
    if (!lista) return;
    osservaTurni.observe(lista);
    centraTurnoAttivo(lista);
  });

  cambiaLettera(el.lettera.textContent.trim() || stato.carattere);

  window.UniDashboard = Object.freeze({
    giocaCarta,
    partitaIniziata: () => partita.partenza || partita.turno > 0,
    giocaCambioColore,
    riepilogoPartita,
    azzeraPartita,
    impostaColoreManuale,
    cambiaLettera,
    cambiaStile,
    aggiornaGiocatore,
    aggiornaInfo,
    prossimoTurno,
    azzeraTurni,
    cambiaColore,
    azzeraColore,
    impostaStoricoPeso,
    mostraSolo,
    mostraTutti,
    mostraRiquadro,
    controllaFont,
  });
})();


let finisciSceltaColore = null;

function scegliColore(colore) {
  if (!finisciSceltaColore) return;
  const fine = finisciSceltaColore;
  finisciSceltaColore = null;
  window.UniVoce?.ferma();
  document.documentElement.removeAttribute('data-cambio-colore');
  fine(colore);
}

async function aspettaColore() {
  if (finisciSceltaColore) return;
  document.documentElement.setAttribute('data-cambio-colore', '');
  window.UniCambioColore?.apri();
  const scelta = new Promise((fine) => {
    finisciSceltaColore = fine;
  });
  window.UniVoce?.ascolta().then(scegliColore);
  const colore = await scelta;
  if (colore) UniDashboard.giocaCambioColore(colore);
  window.UniCambioColore?.chiudi(colore);
}

function giocaCarta(carta, colore) {
  const giocata = UniDashboard.giocaCarta(carta, colore);
  if (carta === '+2' && giocata === true) window.UniPiuDue?.mostra();
}

let cartaSulTavolo = null;

new MutationObserver(() => {
  if (document.documentElement.hasAttribute('data-intro') || !cartaSulTavolo) return;
  const { carta, colore } = cartaSulTavolo;
  cartaSulTavolo = null;
  if (!UniDashboard.partitaIniziata()) giocaCarta(carta, colore);
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-intro'] });

function finePartita() {
  if (document.documentElement.hasAttribute('data-finale')) return;
  window.UniFinale?.apri(UniDashboard.riepilogoPartita());
}

addEventListener('carta-rilevata', (e) => {
  const radice = document.documentElement;
  if (radice.hasAttribute('data-intro')) {
    if (!['cambia', 'retro'].includes(e.detail.carta)) cartaSulTavolo = e.detail;
    return;
  }
  if (radice.hasAttribute('data-finale')) return;
  if (finisciSceltaColore) return;
  if (e.detail.carta === 'cambia') aspettaColore();
  else if (e.detail.carta === 'retro') finePartita();
  else giocaCarta(e.detail.carta, e.detail.colore);
});

const TASTI_COLORE = { r: 'rosso', y: 'giallo', g: 'verde', b: 'blu' };

addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey) return;
  const radice = document.documentElement;
  if ((radice.hasAttribute('data-intro') || radice.hasAttribute('data-finale')) && e.key !== 'Escape') return;

  if (finisciSceltaColore) {
    if (TASTI_COLORE[e.key.toLowerCase()]) scegliColore(TASTI_COLORE[e.key.toLowerCase()]);
    else if (e.key === 'Escape') {
      scegliColore(null);
      UniDashboard.azzeraPartita();
    }
    return;
  }

  if (e.key.toLowerCase() === 'c') aspettaColore();
  else if (e.key.toLowerCase() === 'f') finePartita();
  else if (e.key === '+') giocaCarta('+2');
  else if (/^[0-9/]$/.test(e.key)) giocaCarta(e.key);
  else if (TASTI_COLORE[e.key.toLowerCase()]) UniDashboard.impostaColoreManuale(TASTI_COLORE[e.key.toLowerCase()]);
  else if (e.key === 'Escape') UniDashboard.azzeraPartita();
});
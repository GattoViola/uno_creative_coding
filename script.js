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
    [600, 'semibold'],
    [700, 'bold'],
    [800, 'extrabold'],
    [900, 'black'],
  ];

  const GRAFICO = {
    altezza: 398,
    larghezza: 650,
    sinistra: 52,
    destra: 646,
    alto: 6,
    basso: 359,
    valoreMin: 300,
    valoreMax: 900,
    passo: 150,
    tacchePerPasso: 5,
    colonne: 10,
    righelloAlto: 367,
    righelloBasso: 386,
    taccheRighello: 100,
    raggioPunti: 5,
    margine: 5,
    onda: { periodi: 3, minimo: 315, massimo: 800, campioni: 240 },
  };

  const STORICO_ESEMPIO = [318, 386, 487, 602, 752, 885];
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
    const misura = strumentoMisura.measureText(carattere);
    const larghezza = misura.width;
    const bordoSinistro = -misura.actualBoundingBoxLeft;
    const bordoDestro = misura.actualBoundingBoxRight;

    return {
      larghezza: Math.round(larghezza),
      margineSinistro: Math.round(bordoSinistro),
      margineDestro: Math.round(larghezza - bordoDestro),
    };
  }

  function mostraMisure({ larghezza, margineSinistro, margineDestro }) {
    el.disegno.style.setProperty('--larghezza-lettera', String(larghezza));

    el.lineaDestra.setAttribute('x1', larghezza);
    el.lineaDestra.setAttribute('x2', larghezza);

    el.larghezza.setAttribute('x', larghezza / 2);
    el.margineDestro.setAttribute('x', larghezza + 9);

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
        scriviTesto('glyph-weight', stato.peso);
      }
    }

    if (corsivo !== undefined) {
      stato.corsivo = Boolean(corsivo);
      el.poster.style.setProperty('--stile-lettera', stato.corsivo ? 'italic' : 'normal');
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

  function costruisciGrafico() {
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
    const distanzaTacche = GRAFICO.passo / GRAFICO.tacchePerPasso;

    for (let valore = GRAFICO.valoreMin; valore <= GRAFICO.valoreMax; valore += distanzaTacche) {
      const y = arrotonda(yPer(valore));
      const conNumero = (valore - GRAFICO.valoreMin) % GRAFICO.passo === 0;

      if (conNumero) {
        creaSvg(
          'line',
          { class: 'linea-tratteggiata', x1: asseX, x2: GRAFICO.destra, y1: y, y2: y },
          griglia,
        );
        const numero = creaSvg('text', { x: 0, y, 'dominant-baseline': 'central' }, numeri);
        numero.textContent = String(valore);
      }

      creaSvg(
        'line',
        { x1: conNumero ? asseX : asseX + 3, x2: GRAFICO.sinistra - 1, y1: y, y2: y },
        tacche,
      );
    }

    for (let i = 0; i <= GRAFICO.taccheRighello; i += 1) {
      const x = arrotonda(xPer(i / GRAFICO.taccheRighello));
      creaSvg('line', { x1: x, x2: x, y1: GRAFICO.righelloAlto, y2: GRAFICO.righelloBasso }, tacche);
    }

    const { periodi, minimo, massimo, campioni } = GRAFICO.onda;
    const centro = (minimo + massimo) / 2;
    const ampiezza = (massimo - minimo) / 2;
    let percorso = '';
    for (let i = 0; i <= campioni; i += 1) {
      const t = i / campioni;
      const valore = centro - ampiezza * Math.cos(2 * Math.PI * periodi * t);
      percorso += `${i === 0 ? 'M' : 'L'}${arrotonda(xPer(t))} ${arrotonda(yPer(valore))}`;
    }
    creaSvg('path', { class: 'onda', d: percorso, 'aria-hidden': 'true' }, contenuto);

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
    const punti = storicoPeso.map((peso, i) => ({ x: xPer(i / ultimo), y: yPer(peso) }));

    parti.lineaPeso.setAttribute('d', curvaMorbida(punti));
    parti.puntiPeso.replaceChildren(
      ...punti.map((punto) =>
        creaSvg('circle', {
          cx: arrotonda(punto.x),
          cy: arrotonda(punto.y),
          r: GRAFICO.raggioPunti,
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
  };

  function impostaColoreManuale(colore) {
    const nome = nomeColore(colore);
    if (!nome) {
      console.warn('[UniDashboard] colore sconosciuto:', colore);
      return;
    }
    partita.coloreManuale = nome;
  }

  function giocaCarta(carta, coloreCarta) {
    if (!GLIFI_AMMESSI.includes(carta)) {
      console.warn('[UniDashboard] carta non ammessa:', carta);
      return false;
    }

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

    cambiaLettera(carta);
    if (colore) cambiaColore(colore);
    aggiornaInfo({ ...dati, asse: carta === '/' ? 'italic' : 'weight' });
    aggiornaGiocatore(partita.turno % 2 === 1 ? 1 : 2, dati);

    const storico = partita.turno === 1 ? [] : storicoPeso;
    impostaStoricoPeso([...storico, peso].slice(-(GRAFICO.colonne + 1)));
    return true;
  }

  function azzeraPartita() {
    partita.turno = 0;
    partita.colore = null;
    partita.gradino = 0;
    azzeraTurni();
    azzeraColore();
    cambiaStile({ peso: PESI[0][0], corsivo: false });
    impostaStoricoPeso([]);
  }

  el.lettera.setAttribute('font-size', UNITA_PER_EM);

  cambiaStile({ peso: stato.peso, corsivo: stato.corsivo });
  impostaStoricoPeso(STORICO_ESEMPIO);
  adattaGrafico();
  new ResizeObserver(adattaGrafico).observe(el.grafico);

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


addEventListener('carta-rilevata', (e) => {
  UniDashboard.giocaCarta(e.detail.carta, e.detail.colore);
});

const TASTI_COLORE = { r: 'rosso', y: 'giallo', g: 'verde', b: 'blu' };

addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey) return;

  if (e.key === '+') UniDashboard.giocaCarta('+2');
  else if (/^[0-9/]$/.test(e.key)) UniDashboard.giocaCarta(e.key);
  else if (TASTI_COLORE[e.key.toLowerCase()]) UniDashboard.impostaColoreManuale(TASTI_COLORE[e.key.toLowerCase()]);
  else if (e.key === 'Escape') UniDashboard.azzeraPartita();
})
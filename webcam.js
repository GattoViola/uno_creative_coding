(() => {
  'use strict';

  // zona centrale dove vengono buttate le carte, rispetto al fotogramma
  const ZONA = { larghezza: 0.6, altezza: 0.7 };

  const PASSO = 2; // legge un pixel ogni 2, in entrambe le direzioni
  const SATURAZIONE_MIN = 0.4;
  const LUMINOSITA_MIN = 0.25;
  const SIMBOLO_MIN = 0.0005; // area minima del simbolo, rispetto al fotogramma
  const FOTOGRAMMI_STABILI = 15; // circa mezzo secondo fermo prima di leggere
  const ATTESA_RIPROVA = 700; // ms tra una lettura fallita e la successiva
  const LATO_LETTURA = 160; // il simbolo viene ingrandito a questo lato per l'OCR
  const RITOCCHI = [0, -12, 12]; // gradi attorno all'orientamento stimato (l'OCR regge circa ±15°)
  const FIDUCIA_MIN = 60;
  const FIDUCIA_SICURA = 88; // oltre questa smette di provare altre rotazioni

  // la "/" si riconosce dalla forma: un solo tratto molto allungato che riempie il suo rettangolo
  // (nel font: "/" allungamento ≥ 18 e riempimento ≈ 0.9, "1" riempimento ≤ 0.6)
  const SLASH_ALLUNGAMENTO = 8;
  const SLASH_RIEMPIMENTO = 0.75;

  const COLORI = ['rosso', 'giallo', 'verde', 'blu'];
  const GLIFI_AMMESSI = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', '/'];

  const trova = (id) => document.getElementById(id);
  const contenitore = trova('webcam');
  const video = trova('video');
  const canvas = trova('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const lettura = document.createElement('canvas');
  const ctxLettura = lettura.getContext('2d', { willReadFrequently: true });

  let flusso = null;
  let lettore = null;
  let occupato = false;
  let prossimoTentativo = 0;

  let precedente = null;
  let conteggio = 0;
  let ultimaLetta = null; // l'ultimo simbolo passato all'OCR con successo
  let ultimaGiocata = null; // { simbolo, testo } dell'ultima carta giocata
  let coloreStabile = null;

  function coloreDelPixel(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    if (max / 255 < LUMINOSITA_MIN || delta / max < SATURAZIONE_MIN) return -1;

    let tinta;
    if (max === r) tinta = ((g - b) / delta) % 6;
    else if (max === g) tinta = (b - r) / delta + 2;
    else tinta = (r - g) / delta + 4;
    tinta = (tinta * 60 + 360) % 360;

    if (tinta < 20 || tinta >= 330) return 0;
    if (tinta < 75) return 1;
    if (tinta < 170) return 2;
    if (tinta < 270) return 3;
    return -1;
  }

  // il simbolo della carta in cima è l'unico chiaro e intero dentro il colore:
  // le zone non colorate chiuse dal colore sono i simboli, quelle che toccano il bordo sono il tavolo
  function trovaSimbolo() {
    const larghezzaZona = Math.round(canvas.width * ZONA.larghezza);
    const altezzaZona = Math.round(canvas.height * ZONA.altezza);
    const zx = Math.round((canvas.width - larghezzaZona) / 2);
    const zy = Math.round((canvas.height - altezzaZona) / 2);
    const { data } = ctx.getImageData(zx, zy, larghezzaZona, altezzaZona);

    const colonne = Math.ceil(larghezzaZona / PASSO);
    const righe = Math.ceil(altezzaZona / PASSO);
    const griglia = new Int8Array(colonne * righe);
    for (let gy = 0; gy < righe; gy += 1) {
      for (let gx = 0; gx < colonne; gx += 1) {
        const i = (gy * PASSO * larghezzaZona + gx * PASSO) * 4;
        griglia[gy * colonne + gx] = coloreDelPixel(data[i], data[i + 1], data[i + 2]);
      }
    }

    const visitato = new Uint8Array(griglia.length);
    const pila = new Int32Array(griglia.length);

    function esplora(inizio) {
      const m = { n: 0, celle: [], minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      const intorno = [0, 0, 0, 0];
      let tocca = false;
      let cima = 0;
      pila[cima++] = inizio;
      visitato[inizio] = 1;

      while (cima > 0) {
        const cella = pila[--cima];
        const gx = cella % colonne;
        const gy = (cella - gx) / colonne;
        const x = zx + gx * PASSO;
        const y = zy + gy * PASSO;
        m.n += 1;
        m.celle.push(x, y);
        m.minX = Math.min(m.minX, x);
        m.maxX = Math.max(m.maxX, x);
        m.minY = Math.min(m.minY, y);
        m.maxY = Math.max(m.maxY, y);
        if (gx === 0 || gy === 0 || gx === colonne - 1 || gy === righe - 1) tocca = true;

        const vicini = [
          gx > 0 ? cella - 1 : -1,
          gx < colonne - 1 ? cella + 1 : -1,
          gy > 0 ? cella - colonne : -1,
          gy < righe - 1 ? cella + colonne : -1,
        ];
        for (const v of vicini) {
          if (v < 0) continue;
          if (griglia[v] >= 0) intorno[griglia[v]] += 1;
          else if (!visitato[v]) {
            visitato[v] = 1;
            pila[cima++] = v;
          }
        }
      }

      m.cx = (m.minX + m.maxX) / 2;
      m.cy = (m.minY + m.maxY) / 2;
      m.lato = Math.max(m.maxX - m.minX, m.maxY - m.minY) + PASSO;
      m.colore = intorno.indexOf(Math.max(...intorno));
      return tocca ? null : m;
    }

    const minimo = (SIMBOLO_MIN * canvas.width * canvas.height) / (PASSO * PASSO);
    const buchi = [];
    for (let inizio = 0; inizio < griglia.length; inizio += 1) {
      if (griglia[inizio] >= 0 || visitato[inizio]) continue;
      const buco = esplora(inizio);
      if (buco && buco.n >= minimo) buchi.push(buco);
    }
    if (!buchi.length) return null;

    // il pezzo più grande, più quelli vicini dello stesso colore (il + del +2)
    buchi.sort((a, b) => b.n - a.n);
    const [principale] = buchi;
    const gruppo = buchi.filter(
      (b) =>
        b.colore === principale.colore &&
        b.n >= principale.n * 0.15 &&
        Math.hypot(b.cx - principale.cx, b.cy - principale.cy) < principale.lato * 1.5,
    );

    const minX = Math.min(...gruppo.map((b) => b.minX));
    const maxX = Math.max(...gruppo.map((b) => b.maxX));
    const minY = Math.min(...gruppo.map((b) => b.minY));
    const maxY = Math.max(...gruppo.map((b) => b.maxY));
    const forma = misuraForma(gruppo.flatMap((b) => b.celle));

    return {
      colore: COLORI[principale.colore],
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      lato: Math.hypot(maxX - minX, maxY - minY) + PASSO * 2,
      area: gruppo.reduce((somma, b) => somma + b.n, 0),
      pezzi: gruppo.length,
      ...forma,
    };
  }

  // asse principale, allungamento e riempimento del rettangolo ruotato che contiene il simbolo
  function misuraForma(celle) {
    const n = celle.length / 2;
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < celle.length; i += 2) {
      sx += celle[i];
      sy += celle[i + 1];
    }
    const cx = sx / n;
    const cy = sy / n;

    let vxx = 0;
    let vyy = 0;
    let vxy = 0;
    for (let i = 0; i < celle.length; i += 2) {
      const dx = celle[i] - cx;
      const dy = celle[i + 1] - cy;
      vxx += dx * dx;
      vyy += dy * dy;
      vxy += dx * dy;
    }
    const meta = (vxx + vyy) / (2 * n);
    const scarto = Math.sqrt(((vxx - vyy) / (2 * n)) ** 2 + (vxy / n) ** 2);
    const asse = 0.5 * Math.atan2(2 * vxy, vxx - vyy);

    const cos = Math.cos(asse);
    const sin = Math.sin(asse);
    let u0 = Infinity;
    let u1 = -Infinity;
    let w0 = Infinity;
    let w1 = -Infinity;
    for (let i = 0; i < celle.length; i += 2) {
      const dx = celle[i] - cx;
      const dy = celle[i + 1] - cy;
      const u = dx * cos + dy * sin;
      const w = dy * cos - dx * sin;
      u0 = Math.min(u0, u);
      u1 = Math.max(u1, u);
      w0 = Math.min(w0, w);
      w1 = Math.max(w1, w);
    }

    return {
      asse,
      allungamento: (meta + scarto) / Math.max(meta - scarto, 1e-6),
      riempimento: n / (((u1 - u0) / PASSO + 1) * ((w1 - w0) / PASSO + 1)),
    };
  }

  function stessoSimbolo(a, b, tolleranza) {
    if (!a || !b || a.colore !== b.colore) return false;
    return (
      Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.lato * tolleranza &&
      Math.abs(a.lato - b.lato) < a.lato * tolleranza &&
      Math.abs(a.area - b.area) < a.area * tolleranza
    );
  }

  // ritaglia il simbolo girato di un angolo e lo lascia nero su fondo bianco
  function preparaLettura(simbolo, angolo) {
    const lato = LATO_LETTURA;
    lettura.width = lato;
    lettura.height = lato;

    const scala = lato / (simbolo.lato * 1.3);
    ctxLettura.save();
    ctxLettura.fillStyle = '#000';
    ctxLettura.fillRect(0, 0, lato, lato);
    ctxLettura.translate(lato / 2, lato / 2);
    ctxLettura.rotate(-angolo);
    ctxLettura.scale(scala, scala);
    ctxLettura.translate(-simbolo.cx, -simbolo.cy);
    ctxLettura.drawImage(canvas, 0, 0);
    ctxLettura.restore();

    const immagine = ctxLettura.getImageData(0, 0, lato, lato);
    const { data } = immagine;
    const colore = COLORI.indexOf(simbolo.colore);
    const inchiostro = new Uint8Array(lato * lato);
    for (let i = 0; i < inchiostro.length; i += 1) {
      inchiostro[i] = coloreDelPixel(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) === colore ? 0 : 1;
    }

    // quello che tocca i bordi è tavolo o altre carte, non il simbolo
    const pila = [];
    for (let k = 0; k < lato; k += 1) {
      pila.push(k, (lato - 1) * lato + k, k * lato, k * lato + lato - 1);
    }
    while (pila.length) {
      const i = pila.pop();
      if (!inchiostro[i]) continue;
      inchiostro[i] = 0;
      const x = i % lato;
      if (x > 0) pila.push(i - 1);
      if (x < lato - 1) pila.push(i + 1);
      if (i >= lato) pila.push(i - lato);
      if (i < inchiostro.length - lato) pila.push(i + lato);
    }

    for (let i = 0; i < inchiostro.length; i += 1) {
      const valore = inchiostro[i] ? 0 : 255;
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = valore;
      data[i * 4 + 3] = 255;
    }

    const pagina = document.createElement('canvas');
    pagina.width = lato + 40;
    pagina.height = lato + 40;
    const ctxPagina = pagina.getContext('2d');
    ctxPagina.fillStyle = '#fff';
    ctxPagina.fillRect(0, 0, pagina.width, pagina.height);
    ctxPagina.putImageData(immagine, 20, 20);
    return pagina;
  }

  async function leggiSimbolo(pagina) {
    const { data } = await lettore.recognize(pagina);
    const testo = data.text.replace(/\s/g, '');
    return { testo, fiducia: data.confidence };
  }

  function eSlash(simbolo) {
    return (
      simbolo.pezzi === 1 &&
      simbolo.allungamento >= SLASH_ALLUNGAMENTO &&
      simbolo.riempimento >= SLASH_RIEMPIMENTO
    );
  }

  // le cifre sono più alte che larghe, il +2 è più largo che alto: si raddrizza l'asse
  // e si provano i due versi (la carta può essere capovolta), con piccoli ritocchi
  function angoliDaProvare(simbolo) {
    const verticale = simbolo.asse - Math.PI / 2;
    const orizzontale = simbolo.asse;
    const basi = simbolo.pezzi > 1 ? [orizzontale, verticale] : [verticale, orizzontale];
    // a parità di lettura vince il verso più dritto rispetto alla camera (6 e 9 si somigliano capovolti)
    const storto = (angolo) => Math.abs(Math.atan2(Math.sin(angolo), Math.cos(angolo)));
    return basi.map((base) =>
      [0, Math.PI]
        .flatMap((verso) => RITOCCHI.map((g) => base + verso + (g * Math.PI) / 180))
        .sort((a, b) => storto(a) - storto(b)),
    );
  }

  async function riconosci(simbolo) {
    if (eSlash(simbolo)) return { testo: '/', fiducia: 100 };

    // prima l'orientamento più probabile, l'altro solo se il primo non dà niente
    for (const angoli of angoliDaProvare(simbolo)) {
      let migliore = null;
      for (const angolo of angoli) {
        const letto = await leggiSimbolo(preparaLettura(simbolo, angolo));
        const valido = GLIFI_AMMESSI.includes(letto.testo) && letto.testo !== '/';
        if (valido && (!migliore || letto.fiducia > migliore.fiducia)) migliore = letto;
        if (migliore?.fiducia >= FIDUCIA_SICURA) return migliore;
      }
      if (migliore?.fiducia >= FIDUCIA_MIN) return migliore;
    }
    return null;
  }

  async function leggiCarta(simbolo) {
    occupato = true;
    try {
      const letto = await riconosci(simbolo);
      if (letto) {
        ultimaLetta = simbolo;
        // stesso simbolo nello stesso punto: è la stessa carta che si è solo mossa un po'
        const stessa =
          ultimaGiocata?.testo === letto.testo && stessoSimbolo(simbolo, ultimaGiocata.simbolo, 0.3);
        if (stessa) return;

        ultimaGiocata = { simbolo, testo: letto.testo };
        console.debug(`[UniWebcam] carta ${letto.testo} ${simbolo.colore} (${Math.round(letto.fiducia)}%)`);
        window.dispatchEvent(
          new CustomEvent('carta-rilevata', { detail: { carta: letto.testo, colore: simbolo.colore } }),
        );
      } else {
        console.debug('[UniWebcam] simbolo non leggibile, riprovo');
        prossimoTentativo = performance.now() + ATTESA_RIPROVA;
      }
    } finally {
      occupato = false;
    }
  }

  function ciclo() {
    if (!flusso) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const simbolo = trovaSimbolo();

    conteggio = stessoSimbolo(simbolo, precedente, 0.15) ? conteggio + 1 : 0;
    precedente = simbolo;
    if (simbolo && conteggio >= FOTOGRAMMI_STABILI) coloreStabile = simbolo.colore;

    const pronto =
      simbolo &&
      lettore &&
      !occupato &&
      conteggio >= FOTOGRAMMI_STABILI &&
      performance.now() >= prossimoTentativo &&
      !stessoSimbolo(simbolo, ultimaLetta, 0.1);
    if (pronto) leggiCarta(simbolo);

    requestAnimationFrame(ciclo);
  }

  async function preparaLettore() {
    if (typeof Tesseract === 'undefined') {
      console.warn('[UniWebcam] Tesseract non caricato: la webcam legge solo il colore.');
      return;
    }
    const nuovo = await Tesseract.createWorker('eng');
    await nuovo.setParameters({
      tessedit_char_whitelist: GLIFI_AMMESSI.join(''),
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
    });
    lettore = nuovo;
  }

  async function avvia() {
    if (flusso) return true;
    try {
      flusso = await navigator.mediaDevices.getUserMedia({
        video: { width: canvas.width, height: canvas.height },
        audio: false,
      });
    } catch (errore) {
      console.warn('[UniWebcam] webcam non disponibile:', errore);
      return false;
    }

    video.srcObject = flusso;
    await video.play();
    contenitore.hidden = false;
    requestAnimationFrame(ciclo);
    return true;
  }

  function ferma() {
    flusso?.getTracks().forEach((traccia) => traccia.stop());
    flusso = null;
    coloreStabile = null;
    contenitore.hidden = true;
  }

  preparaLettore().catch((errore) => console.warn('[UniWebcam] OCR non disponibile:', errore));
  avvia();

  window.UniWebcam = Object.freeze({
    avvia,
    ferma,
    coloreRilevato: () => coloreStabile,
    // per tarare: mostra cosa vede l'OCR (la carta raddrizzata in bianco e nero)
    anteprimaLettura: (angolo = 0) => (precedente ? preparaLettura(precedente, angolo).toDataURL() : null),
    ultimoSimbolo: () => precedente,
  });
})();

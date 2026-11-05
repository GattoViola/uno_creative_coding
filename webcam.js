(() => {
  'use strict';

  const ZONA = { larghezza: 0.6, altezza: 0.7 };

  const PASSO = 2;
  const SATURAZIONE_MIN = 0.4;
  const LUMINOSITA_MIN = 0.25;
  const SIMBOLO_MIN = 0.0005;
  const FOTOGRAMMI_STABILI = 10;
  const SALTO_LUCE = 40;
  const QUOTA_MOVIMENTO = 0.04;
  const LATO_LETTURA = 160;

  const FONT_CARTE = 'Unisoft77';
  const PESI_CARTE = [300, 500, 700, 900];
  const LATO_MODELLO = 32;
  const PASSO_ROTAZIONE = 5;
  const SOMIGLIANZA_MIN = 0.55;
  const PARI_MERITO = 0.03;

  const VOTI = 9;
  const MAGGIORANZA = 7;
  const PAUSA_TURNI = 1500;
  const BUCO_MIN = 15;

  const CAMBIO_COLORE_MIN = 0.0012;
  const CAMBIO_COLORE_VICINANZA = 0.9;
  const CAMBIO_COLORE_QUOTA = 0.15;
  const CAMBIO_COLORE_CONTATTO = 3;
  const CAMBIO_COLORE_CANDIDATE = 4;

  const RETRO = {
    nero: 70,
    areaMin: 0.015,
    areaMax: 0.15,
    riempimento: 0.8,
    allungamentoMin: 1.2,
    allungamentoMax: 4.5,
    quotaNero: 0.3,
    quotaVerdeBlu: 0.03,
  };

  const RETRO_UNO = {
    areaMin: 0.015,
    areaMax: 0.15,
    quotaNero: 0.15,
    quotaRosso: 0.2,
    quotaVerdeBlu: 0.03,
    riempimento: 0.6,
    cucitura: 1,
  };

  const SLASH_ALLUNGAMENTO = 8;
  const SLASH_RIEMPIMENTO = 0.75;

  const COLORI = ['rosso', 'giallo', 'verde', 'blu'];
  const GLIFI_AMMESSI = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', '/'];
  const SIMBOLO_AL_CENTRO = { '+2': '+' };
  const LETTURA_DUE_CARTE = 'due carte';
  const DUE_CARTE_PIENEZZA = 0.85;
  const DUE_CARTE_SOMIGLIANZA = 0.84;
  const DUE_CARTE = {
    larghezza: 172,
    altezza: 255,
    raggio: 16,
    posizioni: [
      [83, 0],
      [0, 130],
    ],
  };

  const trova = (id) => document.getElementById(id);
  const contenitore = trova('webcam');
  const video = trova('video');
  const canvas = trova('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const lettura = document.createElement('canvas');
  const ctxLettura = lettura.getContext('2d', { willReadFrequently: true });

  let flusso = null;
  let modelli = null;
  let modelliDueCarte = [];

  let precedente = null;
  let conteggio = 0;
  let voti = [];
  let buchi = [];
  let ultimaGiocata = null;
  let disturbato = true;
  let lucePrecedente = null;
  let movimento = 0;
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

  function trovaSimbolo() {
    const larghezzaZona = Math.round(canvas.width * ZONA.larghezza);
    const altezzaZona = Math.round(canvas.height * ZONA.altezza);
    const zx = Math.round((canvas.width - larghezzaZona) / 2);
    const zy = Math.round((canvas.height - altezzaZona) / 2);
    const { data } = ctx.getImageData(zx, zy, larghezzaZona, altezzaZona);

    const colonne = Math.ceil(larghezzaZona / PASSO);
    const righe = Math.ceil(altezzaZona / PASSO);
    const griglia = new Int8Array(colonne * righe);
    const luce = new Uint8Array(colonne * righe);
    const nero = new Uint8Array(colonne * righe);
    for (let gy = 0; gy < righe; gy += 1) {
      for (let gx = 0; gx < colonne; gx += 1) {
        const i = (gy * PASSO * larghezzaZona + gx * PASSO) * 4;
        griglia[gy * colonne + gx] = coloreDelPixel(data[i], data[i + 1], data[i + 2]);
        luce[gy * colonne + gx] = (data[i] * 3 + data[i + 1] * 6 + data[i + 2]) / 10;
        nero[gy * colonne + gx] = Math.max(data[i], data[i + 1], data[i + 2]) < RETRO.nero ? 1 : 0;
      }
    }

    let cambiati = 0;
    if (lucePrecedente?.length === luce.length) {
      for (let i = 0; i < luce.length; i += 1) {
        if (Math.abs(luce[i] - lucePrecedente[i]) > SALTO_LUCE) cambiati += 1;
      }
    }
    movimento = cambiati / luce.length;
    lucePrecedente = luce;

    const cambio = cercaCambioColore(griglia, colonne, righe, zx, zy);
    if (cambio) return cambio;

    const retro = cercaRetro(nero, griglia, colonne, righe, zx, zy) ?? cercaRetroUno(nero, griglia, colonne, righe, zx, zy);
    if (retro) return retro;

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
      if (buco && buco.n >= 6) buchi.push(buco);
    }
    if (!buchi.some((b) => b.n >= minimo)) return null;

    const principale = buchi.reduce((a, b) => (b.n > a.n ? b : a));
    return descriviGruppo([principale]);
  }

  function cercaRetro(nero, griglia, colonne, righe, zx, zy) {
    const fuori = new Uint8Array(nero.length);
    const pila = new Int32Array(nero.length);
    let cima = 0;

    const entra = (cella) => {
      if (!fuori[cella] && !nero[cella]) {
        fuori[cella] = 1;
        pila[cima++] = cella;
      }
    };
    for (let gx = 0; gx < colonne; gx += 1) {
      entra(gx);
      entra((righe - 1) * colonne + gx);
    }
    for (let gy = 0; gy < righe; gy += 1) {
      entra(gy * colonne);
      entra(gy * colonne + colonne - 1);
    }
    while (cima > 0) {
      const cella = pila[--cima];
      const gx = cella % colonne;
      if (gx > 0) entra(cella - 1);
      if (gx < colonne - 1) entra(cella + 1);
      if (cella >= colonne) entra(cella - colonne);
      if (cella < nero.length - colonne) entra(cella + colonne);
    }

    const totale = canvas.width * canvas.height;
    const visto = new Uint8Array(nero.length);
    let migliore = null;

    for (let inizio = 0; inizio < nero.length; inizio += 1) {
      if (fuori[inizio] || visto[inizio]) continue;

      const celle = [];
      const colori = [0, 0, 0, 0];
      let neri = 0;
      let tocca = false;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      cima = 0;
      pila[cima++] = inizio;
      visto[inizio] = 1;

      while (cima > 0) {
        const cella = pila[--cima];
        const gx = cella % colonne;
        const gy = (cella - gx) / colonne;
        const x = zx + gx * PASSO;
        const y = zy + gy * PASSO;
        celle.push(x, y);
        neri += nero[cella];
        if (griglia[cella] >= 0) colori[griglia[cella]] += 1;
        if (gx === 0 || gy === 0 || gx === colonne - 1 || gy === righe - 1) tocca = true;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        const vicini = [
          gx > 0 ? cella - 1 : -1,
          gx < colonne - 1 ? cella + 1 : -1,
          gy > 0 ? cella - colonne : -1,
          gy < righe - 1 ? cella + colonne : -1,
        ];
        for (const v of vicini) {
          if (v >= 0 && !fuori[v] && !visto[v]) {
            visto[v] = 1;
            pila[cima++] = v;
          }
        }
      }

      const n = celle.length / 2;
      const area = (n * PASSO * PASSO) / totale;
      if (tocca || area < RETRO.areaMin || area > RETRO.areaMax) continue;
      if (neri / n < RETRO.quotaNero) continue;
      if ((colori[2] + colori[3]) / n > RETRO.quotaVerdeBlu) continue;

      const forma = misuraForma(celle);
      if (forma.riempimento < RETRO.riempimento) continue;
      if (forma.allungamento < RETRO.allungamentoMin || forma.allungamento > RETRO.allungamentoMax) continue;

      if (!migliore || n > migliore.area) {
        migliore = {
          colore: 'nessuno',
          retro: true,
          cx: (minX + maxX) / 2,
          cy: (minY + maxY) / 2,
          lato: Math.hypot(maxX - minX, maxY - minY) + PASSO * 2,
          area: n,
          pezzi: 1,
        };
      }
    }
    return migliore;
  }

  function espandi(maschera, colonne, righe, raggio, valore) {
    const orizzontale = new Uint8Array(maschera.length);
    for (let gy = 0; gy < righe; gy += 1) {
      for (let gx = 0; gx < colonne; gx += 1) {
        let risultato = maschera[gy * colonne + gx];
        for (let d = -raggio; d <= raggio && risultato !== valore; d += 1) {
          const vx = gx + d;
          if (vx >= 0 && vx < colonne && maschera[gy * colonne + vx] === valore) risultato = valore;
        }
        orizzontale[gy * colonne + gx] = risultato;
      }
    }
    const finale = new Uint8Array(maschera.length);
    for (let gy = 0; gy < righe; gy += 1) {
      for (let gx = 0; gx < colonne; gx += 1) {
        let risultato = orizzontale[gy * colonne + gx];
        for (let d = -raggio; d <= raggio && risultato !== valore; d += 1) {
          const vy = gy + d;
          if (vy >= 0 && vy < righe && orizzontale[vy * colonne + gx] === valore) risultato = valore;
        }
        finale[gy * colonne + gx] = risultato;
      }
    }
    return finale;
  }

  function cercaRetroUno(nero, griglia, colonne, righe, zx, zy) {
    const pieno = new Uint8Array(griglia.length);
    for (let cella = 0; cella < griglia.length; cella += 1) pieno[cella] = nero[cella] || griglia[cella] >= 0 ? 1 : 0;
    const raggio = RETRO_UNO.cucitura;
    const cucito = espandi(espandi(pieno, colonne, righe, raggio, 1), colonne, righe, raggio, 0);
    const dentro = (cella) => cucito[cella] === 1;
    const visto = new Uint8Array(griglia.length);
    const pila = new Int32Array(griglia.length);
    const totale = canvas.width * canvas.height;
    let migliore = null;

    for (let inizio = 0; inizio < griglia.length; inizio += 1) {
      if (visto[inizio] || !dentro(inizio)) continue;

      const celle = [];
      const conti = { neri: 0, rossi: 0, gialli: 0, verdiBlu: 0 };
      let tocca = false;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let cima = 0;
      pila[cima++] = inizio;
      visto[inizio] = 1;

      while (cima > 0) {
        const cella = pila[--cima];
        const gx = cella % colonne;
        const gy = (cella - gx) / colonne;
        const x = zx + gx * PASSO;
        const y = zy + gy * PASSO;
        celle.push(x, y);
        if (nero[cella]) conti.neri += 1;
        else if (griglia[cella] === 0) conti.rossi += 1;
        else if (griglia[cella] === 1) conti.gialli += 1;
        else if (griglia[cella] >= 2) conti.verdiBlu += 1;
        if (gx === 0 || gy === 0 || gx === colonne - 1 || gy === righe - 1) tocca = true;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        const vicini = [
          gx > 0 ? cella - 1 : -1,
          gx < colonne - 1 ? cella + 1 : -1,
          gy > 0 ? cella - colonne : -1,
          gy < righe - 1 ? cella + colonne : -1,
        ];
        for (const v of vicini) {
          if (v >= 0 && !visto[v] && dentro(v)) {
            visto[v] = 1;
            pila[cima++] = v;
          }
        }
      }

      const n = celle.length / 2;
      const area = (n * PASSO * PASSO) / totale;
      if (tocca || area < RETRO_UNO.areaMin || area > RETRO_UNO.areaMax) continue;
      if (conti.neri / n < RETRO_UNO.quotaNero || conti.rossi / n < RETRO_UNO.quotaRosso) continue;
      if (conti.verdiBlu / n > RETRO_UNO.quotaVerdeBlu) continue;
      if (migliore && n <= migliore.area) continue;

      const forma = misuraForma(celle);
      if (forma.riempimento < RETRO_UNO.riempimento) continue;
      if (forma.allungamento < RETRO.allungamentoMin || forma.allungamento > RETRO.allungamentoMax) continue;

      migliore = {
        colore: 'nessuno',
        retro: true,
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        lato: Math.hypot(maxX - minX, maxY - minY) + PASSO * 2,
        area: n,
        pezzi: 1,
      };
    }
    return migliore;
  }

  function cercaCambioColore(griglia, colonne, righe, zx, zy) {
    const gruppo = new Int32Array(griglia.length);
    const pila = new Int32Array(griglia.length);
    const macchie = [null];

    for (let inizio = 0; inizio < griglia.length; inizio += 1) {
      const colore = griglia[inizio];
      if (colore < 0 || gruppo[inizio]) continue;

      const numero = macchie.length;
      let n = 0;
      let sx = 0;
      let sy = 0;
      let cima = 0;
      pila[cima++] = inizio;
      gruppo[inizio] = numero;

      while (cima > 0) {
        const cella = pila[--cima];
        const gx = cella % colonne;
        const gy = (cella - gx) / colonne;
        n += 1;
        sx += gx;
        sy += gy;

        const vicini = [
          gx > 0 ? cella - 1 : -1,
          gx < colonne - 1 ? cella + 1 : -1,
          gy > 0 ? cella - colonne : -1,
          gy < righe - 1 ? cella + colonne : -1,
        ];
        for (const v of vicini) {
          if (v >= 0 && !gruppo[v] && griglia[v] === colore) {
            gruppo[v] = numero;
            pila[cima++] = v;
          }
        }
      }

      macchie.push({ numero, colore, n, x: sx / n, y: sy / n, vicine: new Set() });
    }

    const minimo = (CAMBIO_COLORE_MIN * canvas.width * canvas.height) / (PASSO * PASSO);
    const perColore = COLORI.map((_, colore) =>
      macchie
        .filter((macchia) => macchia && macchia.colore === colore && macchia.n >= minimo)
        .sort((a, b) => b.n - a.n)
        .slice(0, CAMBIO_COLORE_CANDIDATE),
    );
    if (perColore.some((lista) => !lista.length)) return null;

    const candidata = new Uint8Array(macchie.length);
    perColore.flat().forEach((macchia) => (candidata[macchia.numero] = 1));
    segnaContatti(macchie, candidata, gruppo, colonne, righe);

    let migliore = null;
    for (const r of perColore[0]) {
      for (const y of perColore[1]) {
        for (const g of perColore[2]) {
          for (const b of perColore[3]) {
            const quattro = [r, y, g, b];
            const area = r.n + y.n + g.n + b.n;
            if (migliore && area <= migliore.area) continue;
            if (sembraCambioColore(quattro, area)) migliore = { quattro, area };
          }
        }
      }
    }
    if (!migliore) return null;

    const { quattro, area } = migliore;
    const raggio = Math.sqrt(area / Math.PI);
    const cx = quattro.reduce((somma, macchia) => somma + macchia.x, 0) / quattro.length;
    const cy = quattro.reduce((somma, macchia) => somma + macchia.y, 0) / quattro.length;
    return {
      colore: 'tutti',
      cambiaColore: true,
      cx: zx + cx * PASSO,
      cy: zy + cy * PASSO,
      lato: raggio * 2 * PASSO,
      area,
      pezzi: quattro.length,
    };
  }

  function segnaContatti(macchie, candidata, gruppo, colonne, righe) {
    const passi = [];
    for (let d = 1; d <= CAMBIO_COLORE_CONTATTO; d += 1) passi.push([d, 0], [0, d], [d, d], [d, -d]);

    for (let gy = 0; gy < righe; gy += 1) {
      for (let gx = 0; gx < colonne; gx += 1) {
        const a = gruppo[gy * colonne + gx];
        if (!candidata[a]) continue;

        for (const [dx, dy] of passi) {
          const vx = gx + dx;
          const vy = gy + dy;
          if (vx >= colonne || vy < 0 || vy >= righe) continue;
          const b = gruppo[vy * colonne + vx];
          if (!candidata[b] || b === a || macchie[b].colore === macchie[a].colore) continue;
          macchie[a].vicine.add(b);
          macchie[b].vicine.add(a);
        }
      }
    }
  }

  function sembraCambioColore(quattro, area) {
    if (quattro.some((macchia) => macchia.n < area * CAMBIO_COLORE_QUOTA)) return false;

    const toccate = quattro.every(
      (macchia) => quattro.filter((altra) => macchia.vicine.has(altra.numero)).length >= 2,
    );
    if (!toccate) return false;

    const raggio = Math.sqrt(area / Math.PI);
    const cx = quattro.reduce((somma, macchia) => somma + macchia.x, 0) / quattro.length;
    const cy = quattro.reduce((somma, macchia) => somma + macchia.y, 0) / quattro.length;
    return quattro.every((macchia) => Math.hypot(macchia.x - cx, macchia.y - cy) <= raggio * CAMBIO_COLORE_VICINANZA);
  }

  function descriviGruppo(gruppo) {
    const minX = Math.min(...gruppo.map((b) => b.minX));
    const maxX = Math.max(...gruppo.map((b) => b.maxX));
    const minY = Math.min(...gruppo.map((b) => b.minY));
    const maxY = Math.max(...gruppo.map((b) => b.maxY));
    const forma = misuraForma(gruppo.flatMap((b) => b.celle));

    return {
      colore: COLORI[gruppo[0].colore],
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      lato: Math.hypot(maxX - minX, maxY - minY) + PASSO * 2,
      area: gruppo.reduce((somma, b) => somma + b.n, 0),
      pezzi: gruppo.length,
      ...forma,
    };
  }

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

  function ritagliaSimbolo(simbolo) {
    const lato = LATO_LETTURA;
    lettura.width = lato;
    lettura.height = lato;

    const scala = lato / (simbolo.lato * 1.3);
    ctxLettura.fillStyle = '#000';
    ctxLettura.fillRect(0, 0, lato, lato);
    ctxLettura.save();
    ctxLettura.translate(lato / 2, lato / 2);
    ctxLettura.scale(scala, scala);
    ctxLettura.translate(-simbolo.cx, -simbolo.cy);
    ctxLettura.drawImage(canvas, 0, 0);
    ctxLettura.restore();

    const { data } = ctxLettura.getImageData(0, 0, lato, lato);
    const colore = COLORI.indexOf(simbolo.colore);
    const inchiostro = new Uint8Array(lato * lato);
    for (let i = 0; i < inchiostro.length; i += 1) {
      inchiostro[i] = coloreDelPixel(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) === colore ? 0 : 1;
    }

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
    return inchiostro;
  }

  function puntiDi(maschera, lato) {
    const punti = [];
    for (let i = 0; i < maschera.length; i += 1) {
      if (maschera[i]) punti.push(i % lato, Math.floor(i / lato));
    }
    return punti;
  }

  function normalizza(punti, angolo) {
    const cos = Math.cos(angolo);
    const sin = Math.sin(angolo);
    const xs = new Float32Array(punti.length / 2);
    const ys = new Float32Array(punti.length / 2);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < xs.length; i += 1) {
      const x = punti[i * 2];
      const y = punti[i * 2 + 1];
      xs[i] = x * cos - y * sin;
      ys[i] = x * sin + y * cos;
      minX = Math.min(minX, xs[i]);
      maxX = Math.max(maxX, xs[i]);
      minY = Math.min(minY, ys[i]);
      maxY = Math.max(maxY, ys[i]);
    }

    const ultimo = LATO_MODELLO - 1;
    const scala = ultimo / Math.max(maxX - minX, maxY - minY, 1);
    const dx = (ultimo - (maxX - minX) * scala) / 2;
    const dy = (ultimo - (maxY - minY) * scala) / 2;
    const maschera = new Uint8Array(LATO_MODELLO * LATO_MODELLO);
    for (let i = 0; i < xs.length; i += 1) {
      const x = Math.round((xs[i] - minX) * scala + dx);
      const y = Math.round((ys[i] - minY) * scala + dy);
      maschera[y * LATO_MODELLO + x] = 1;
    }
    return maschera;
  }

  async function preparaModelli() {
    const lato = 220;
    const foglio = document.createElement('canvas');
    foglio.width = lato;
    foglio.height = lato;
    const ctxFoglio = foglio.getContext('2d', { willReadFrequently: true });
    const nuovi = [];

    for (const peso of PESI_CARTE) {
      const caricati = await document.fonts.load(`${peso} 160px "${FONT_CARTE}"`, GLIFI_AMMESSI.join(''));
      if (!caricati.length) console.warn(`[UniWebcam] font ${FONT_CARTE} ${peso} non caricato: le carte verranno confrontate con il font di sistema.`);
      for (const testo of GLIFI_AMMESSI) {
        ctxFoglio.clearRect(0, 0, lato, lato);
        ctxFoglio.font = `${peso} 120px "${FONT_CARTE}"`;
        ctxFoglio.textAlign = 'center';
        ctxFoglio.textBaseline = 'middle';
        ctxFoglio.fillText(SIMBOLO_AL_CENTRO[testo] ?? testo, lato / 2, lato / 2);

        const { data } = ctxFoglio.getImageData(0, 0, lato, lato);
        const maschera = new Uint8Array(lato * lato);
        for (let i = 0; i < maschera.length; i += 1) maschera[i] = data[i * 4 + 3] > 128 ? 1 : 0;
        const punti = puntiDi(maschera, lato);

        for (let gradi = 0; gradi < 360; gradi += PASSO_ROTAZIONE) {
          const angolo = (gradi * Math.PI) / 180;
          nuovi.push({ testo, angolo, maschera: normalizza(punti, angolo) });
        }
      }
    }

    const puntiDueCarte = disegnaDueCarte(ctxFoglio, lato);
    const dueCarte = [];
    for (let gradi = 0; gradi < 360; gradi += PASSO_ROTAZIONE) {
      dueCarte.push(normalizza(puntiDueCarte, (gradi * Math.PI) / 180));
    }
    modelliDueCarte = dueCarte;
    modelli = nuovi;
  }

  function disegnaDueCarte(ctxFoglio, lato) {
    const { larghezza, altezza, raggio, posizioni } = DUE_CARTE;
    const totaleX = Math.max(...posizioni.map(([x]) => x)) + larghezza;
    const totaleY = Math.max(...posizioni.map(([, y]) => y)) + altezza;
    const scala = (lato * 0.8) / Math.max(totaleX, totaleY);

    ctxFoglio.clearRect(0, 0, lato, lato);
    ctxFoglio.save();
    ctxFoglio.translate((lato - totaleX * scala) / 2, (lato - totaleY * scala) / 2);
    ctxFoglio.scale(scala, scala);
    ctxFoglio.fillStyle = '#000';
    for (const [x, y] of posizioni) {
      ctxFoglio.beginPath();
      ctxFoglio.roundRect(x, y, larghezza, altezza, raggio);
      ctxFoglio.fill();
    }
    ctxFoglio.restore();

    const { data } = ctxFoglio.getImageData(0, 0, lato, lato);
    const maschera = new Uint8Array(lato * lato);
    for (let i = 0; i < maschera.length; i += 1) maschera[i] = data[i * 4 + 3] > 128 ? 1 : 0;
    return puntiDi(maschera, lato);
  }

  function somiglianza(a, b) {
    let comune = 0;
    let unione = 0;
    for (let i = 0; i < a.length; i += 1) {
      comune += a[i] & b[i];
      unione += a[i] | b[i];
    }
    return unione ? comune / unione : 0;
  }

  function pienezza(punti) {
    const lista = [];
    for (let i = 0; i < punti.length; i += 2) lista.push([punti[i], punti[i + 1]]);
    lista.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (lista.length < 3) return 0;

    const svolta = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const sotto = [];
    for (const p of lista) {
      while (sotto.length >= 2 && svolta(sotto[sotto.length - 2], sotto[sotto.length - 1], p) <= 0) sotto.pop();
      sotto.push(p);
    }
    const sopra = [];
    for (let i = lista.length - 1; i >= 0; i -= 1) {
      const p = lista[i];
      while (sopra.length >= 2 && svolta(sopra[sopra.length - 2], sopra[sopra.length - 1], p) <= 0) sopra.pop();
      sopra.push(p);
    }
    const bordo = sotto.slice(0, -1).concat(sopra.slice(0, -1));

    let area = 0;
    for (let i = 0; i < bordo.length; i += 1) {
      const [x1, y1] = bordo[i];
      const [x2, y2] = bordo[(i + 1) % bordo.length];
      area += x1 * y2 - x2 * y1;
    }
    const perimetro = bordo.reduce((somma, p, i) => {
      const q = bordo[(i + 1) % bordo.length];
      return somma + Math.hypot(q[0] - p[0], q[1] - p[1]);
    }, 0);
    return lista.length / (Math.abs(area) / 2 + perimetro / 2 + 1);
  }

  function sembraDueCarte(punti) {
    if (!modelliDueCarte.length || pienezza(punti) < DUE_CARTE_PIENEZZA) return false;
    const maschera = normalizza(punti, 0);
    return modelliDueCarte.some((modello) => somiglianza(maschera, modello) >= DUE_CARTE_SOMIGLIANZA);
  }

  function eSlash(simbolo) {
    return (
      simbolo.pezzi === 1 &&
      simbolo.allungamento >= SLASH_ALLUNGAMENTO &&
      simbolo.riempimento >= SLASH_RIEMPIMENTO
    );
  }

  function riconosci(simbolo) {
    if (simbolo.cambiaColore) return 'cambia';
    if (simbolo.retro) return 'retro';
    if (eSlash(simbolo)) return '/';

    const punti = puntiDi(ritagliaSimbolo(simbolo), LATO_LETTURA);
    if (punti.length < 40) return null;
    if (sembraDueCarte(punti)) return LETTURA_DUE_CARTE;
    const maschera = normalizza(punti, 0);

    const migliori = new Map();
    for (const modello of modelli) {
      const punteggio = somiglianza(maschera, modello.maschera);
      if (punteggio > (migliori.get(modello.testo)?.punteggio ?? -1)) {
        migliori.set(modello.testo, { testo: modello.testo, angolo: modello.angolo, punteggio });
      }
    }

    const storto = (angolo) => Math.abs(Math.atan2(Math.sin(angolo), Math.cos(angolo)));
    const classifica = [...migliori.values()].sort((a, b) => b.punteggio - a.punteggio);
    const [primo] = classifica;
    if (primo.punteggio < SOMIGLIANZA_MIN) return null;
    const scelto = classifica
      .filter((c) => primo.punteggio - c.punteggio < PARI_MERITO)
      .sort((a, b) => storto(a.angolo) - storto(b.angolo))[0];
    return scelto.testo;
  }

  function votato() {
    if (voti.length < VOTI) return null;
    const conti = new Map();
    for (const voto of voti) conti.set(voto, (conti.get(voto) ?? 0) + 1);
    for (const [testo, conto] of conti) {
      if (testo && conto >= MAGGIORANZA) return testo;
    }
    return null;
  }

  function allarga(forma, lato, valore) {
    const nuova = new Uint8Array(forma.length);
    for (let y = 0; y < lato; y++) {
      for (let x = 0; x < lato; x++) {
        let risultato = forma[y * lato + x];
        for (let dy = -1; dy <= 1 && risultato !== valore; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const vx = x + dx;
            const vy = y + dy;
            if (vx >= 0 && vy >= 0 && vx < lato && vy < lato && forma[vy * lato + vx] === valore) {
              risultato = valore;
              break;
            }
          }
        }
        nuova[y * lato + x] = risultato;
      }
    }
    return nuova;
  }

  function contaBuchi(simbolo) {
    if (simbolo.cambiaColore || simbolo.retro) return 0;
    const lato = LATO_LETTURA;
    let forma = ritagliaSimbolo(simbolo);
    forma = allarga(allarga(forma, lato, 1), lato, 1);
    forma = allarga(allarga(forma, lato, 0), lato, 0);

    const visto = new Uint8Array(forma.length);
    const riempi = (inizio) => {
      let area = 0;
      const pila = [inizio];
      visto[inizio] = 1;
      while (pila.length) {
        const i = pila.pop();
        area++;
        const x = i % lato;
        const vicini = [x > 0 ? i - 1 : -1, x < lato - 1 ? i + 1 : -1, i - lato, i + lato];
        for (const v of vicini) {
          if (v >= 0 && v < forma.length && !forma[v] && !visto[v]) {
            visto[v] = 1;
            pila.push(v);
          }
        }
      }
      return area;
    };

    for (let k = 0; k < lato; k++) {
      for (const i of [k, (lato - 1) * lato + k, k * lato, k * lato + lato - 1]) {
        if (!forma[i] && !visto[i]) riempi(i);
      }
    }

    let quanti = 0;
    for (let i = 0; i < forma.length; i++) {
      if (!forma[i] && !visto[i] && riempi(i) >= BUCO_MIN) quanti++;
    }
    return quanti;
  }

  function piuFrequente(valori) {
    const conti = new Map();
    for (const valore of valori) conti.set(valore, (conti.get(valore) ?? 0) + 1);
    return [...conti].sort((a, b) => b[1] - a[1])[0][0];
  }

  function decidi(simbolo, testo, buchiCarta) {
    if (!disturbato) return;
    const adesso = performance.now();
    if (ultimaGiocata && adesso - ultimaGiocata.tempo < PAUSA_TURNI) return;
    disturbato = false;

    const forme = [testo, ultimaGiocata?.testo];
    const stessiBuchi = ultimaGiocata?.buchi === buchiCarta && !forme.includes(LETTURA_DUE_CARTE);
    const stessa =
      ultimaGiocata?.simbolo.colore === simbolo.colore && (ultimaGiocata.testo === testo || stessiBuchi);
    if (stessa) return;

    ultimaGiocata = { simbolo, testo, buchi: buchiCarta, tempo: adesso };
    console.debug(`[UniWebcam] carta ${testo} ${simbolo.colore}`);
    const colore = simbolo.cambiaColore || simbolo.retro ? null : simbolo.colore;
    const carta = testo === LETTURA_DUE_CARTE ? '+2' : testo;
    window.dispatchEvent(new CustomEvent('carta-rilevata', { detail: { carta, colore } }));
  }

  function ciclo() {
    if (!flusso) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const simbolo = trovaSimbolo();

    if (stessoSimbolo(simbolo, precedente, 0.15)) conteggio += 1;
    else {
      conteggio = 0;
      voti = [];
      buchi = [];
    }
    precedente = simbolo;

    if (movimento > QUOTA_MOVIMENTO) disturbato = true;

    if (simbolo && conteggio >= FOTOGRAMMI_STABILI) {
      if (!simbolo.cambiaColore && !simbolo.retro) coloreStabile = simbolo.colore;
      if (modelli && disturbato) {
        voti = [...voti, riconosci(simbolo)].slice(-VOTI);
        buchi = [...buchi, contaBuchi(simbolo)].slice(-VOTI);
        const testo = votato();
        if (testo) decidi(simbolo, testo, piuFrequente(buchi));
      }
    }

    requestAnimationFrame(ciclo);
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
    try {
      await video.play();
    } catch (errore) {
      console.warn('[UniWebcam] il video della webcam non parte:', errore);
      ferma();
      return false;
    }
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

  preparaModelli().catch((errore) => console.warn('[UniWebcam] glifi del font non pronti:', errore));
  avvia();

  window.UniWebcam = Object.freeze({
    avvia,
    ferma,
    coloreRilevato: () => coloreStabile,
    letturaAttuale: () => (precedente && modelli ? riconosci(precedente) : null),
    ultimoSimbolo: () => precedente,
  });
})();
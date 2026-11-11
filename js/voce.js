(() => {
  'use strict';

  const DURATA_ASCOLTO = 15000;
  const LINGUA = 'it-IT';

  const PAROLE_COLORE = {
    rosso: 'rosso',
    rossa: 'rosso',
    red: 'rosso',
    giallo: 'giallo',
    gialla: 'giallo',
    yellow: 'giallo',
    verde: 'verde',
    green: 'verde',
    blu: 'blu',
    blue: 'blu',
    blou: 'blu',
  };

  const Riconoscimento = window.SpeechRecognition || window.webkitSpeechRecognition;
  let ascoltoInCorso = null;

  const aspetta = (millisecondi) => new Promise((fine) => setTimeout(fine, millisecondi));

  function trovaColore(frase) {
    const parole = frase
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^a-z]+/);
    for (const parola of parole) {
      if (PAROLE_COLORE[parola]) return PAROLE_COLORE[parola];
    }
    return null;
  }

  function chiediPermesso() {
    if (!Riconoscimento || !navigator.mediaDevices?.getUserMedia) return;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((flusso) => flusso.getTracks().forEach((traccia) => traccia.stop()))
      .catch((errore) => console.warn('[UniVoce] microfono non disponibile:', errore));
  }

  function ferma() {
    ascoltoInCorso?.(null);
  }

  function ascolta() {
    ferma();

    if (!Riconoscimento) {
      console.warn('[UniVoce] questo browser non riconosce la voce: usa Chrome o Safari, oppure i tasti r/y/g/b.');
      return aspetta(DURATA_ASCOLTO).then(() => null);
    }

    return new Promise((risolvi) => {
      const riconoscimento = new Riconoscimento();
      riconoscimento.lang = LINGUA;
      riconoscimento.continuous = true;
      riconoscimento.interimResults = true;
      riconoscimento.maxAlternatives = 3;

      let finito = false;
      const scadenza = setTimeout(() => chiudi(null), DURATA_ASCOLTO);

      function chiudi(colore) {
        if (finito) return;
        finito = true;
        clearTimeout(scadenza);
        if (ascoltoInCorso === chiudi) ascoltoInCorso = null;
        try {
          riconoscimento.abort();
        } catch {}
        risolvi(colore);
      }

      riconoscimento.addEventListener('result', (e) => {
        for (let i = e.resultIndex; i < e.results.length; i += 1) {
          for (const alternativa of e.results[i]) {
            const colore = trovaColore(alternativa.transcript);
            if (colore) {
              chiudi(colore);
              return;
            }
          }
        }
      });

      riconoscimento.addEventListener('error', (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
          console.warn('[UniVoce] microfono non disponibile:', e.error);
          chiudi(null);
        }
      });

      riconoscimento.addEventListener('end', () => {
        if (finito) return;
        try {
          riconoscimento.start();
        } catch {
          chiudi(null);
        }
      });

      ascoltoInCorso = chiudi;
      try {
        riconoscimento.start();
      } catch (errore) {
        console.warn('[UniVoce] il riconoscimento vocale non parte:', errore);
        chiudi(null);
      }
    });
  }

  chiediPermesso();

  window.UniVoce = Object.freeze({
    ascolta,
    ferma,
    disponibile: Boolean(Riconoscimento),
  });
})();
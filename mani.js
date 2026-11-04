(() => {
  'use strict';

  const PUNTI_MANO = 21;
  const PUNTE = [4, 8, 12, 16, 20];
  const MANI_MAX = 2;
  const INTERVALLO = 1000 / 15;
  const MORBIDEZZA = 0.5;
  const RAGGIO_PUNTA = 3.2;
  const RAGGIO_ARTICOLAZIONE = 2;
  const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
  const CARTELLA_MEDIAPIPE = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/';

  const video = document.getElementById('video');
  const disegno = document.getElementById('mani');

  if (!video || !disegno || typeof Hands === 'undefined') {
    console.warn('[UniMani] MediaPipe Hands non disponibile: niente cerchi nel quadrato.');
    return;
  }

  const cerchi = [];
  for (let m = 0; m < MANI_MAX; m += 1) {
    const mano = [];
    for (let p = 0; p < PUNTI_MANO; p += 1) {
      const punta = PUNTE.includes(p);
      const cerchio = document.createElementNS(NAMESPACE_SVG, 'circle');
      cerchio.setAttribute('class', punta ? 'punta' : 'articolazione');
      cerchio.setAttribute('r', punta ? RAGGIO_PUNTA : RAGGIO_ARTICOLAZIONE);
      cerchio.setAttribute('visibility', 'hidden');
      disegno.append(cerchio);
      mano.push(cerchio);
    }
    cerchi.push(mano);
  }

  const posizioni = cerchi.map(() => null);

  function nelQuadrato(punto) {
    const larghezza = video.videoWidth || 4;
    const altezza = video.videoHeight || 3;
    const quota = altezza / larghezza;
    return {
      x: ((punto.x - (1 - quota) / 2) / quota) * 100,
      y: punto.y * 100,
    };
  }

  function disegnaMani(risultati) {
    const trovate = risultati.multiHandLandmarks ?? [];

    cerchi.forEach((mano, m) => {
      const punti = trovate[m];
      if (!punti) {
        posizioni[m] = null;
        mano.forEach((cerchio) => cerchio.setAttribute('visibility', 'hidden'));
        return;
      }

      const nuovi = punti.map(nelQuadrato);
      const prima = posizioni[m];
      posizioni[m] = prima
        ? prima.map((p, i) => ({
            x: p.x + (nuovi[i].x - p.x) * MORBIDEZZA,
            y: p.y + (nuovi[i].y - p.y) * MORBIDEZZA,
          }))
        : nuovi;

      mano.forEach((cerchio, i) => {
        cerchio.setAttribute('cx', posizioni[m][i].x.toFixed(2));
        cerchio.setAttribute('cy', posizioni[m][i].y.toFixed(2));
        cerchio.setAttribute('visibility', 'visible');
      });
    });
  }

  const mani = new Hands({ locateFile: (file) => CARTELLA_MEDIAPIPE + file });
  mani.setOptions({
    maxNumHands: MANI_MAX,
    modelComplexity: 0,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5,
  });
  mani.onResults(disegnaMani);

  let occupato = false;

  async function guarda() {
    if (!occupato && video.readyState >= 2 && !video.paused) {
      occupato = true;
      try {
        await mani.send({ image: video });
      } catch (errore) {
        console.warn('[UniMani] lettura delle mani non riuscita:', errore);
      }
      occupato = false;
    }
    setTimeout(guarda, INTERVALLO);
  }

  guarda();
})();
(() => {
  'use strict';

  const PUNTI_MANO = 21;
  const PUNTE = [4, 8, 12, 16, 20];
  const PUNTO_PALMO = 9;
  const MANI_MAX = 2;
  const MORBIDEZZA_QUADRATO = 0.5;
  const MORBIDEZZA_WEBCAM = 0.85;
  const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
  const CARTELLA_MEDIAPIPE = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/';

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');

  if (!video || typeof Hands === 'undefined') {
    console.warn('[UniMani] MediaPipe Hands non disponibile: niente cerchi sulle mani.');
    return;
  }

  function nelQuadrato(punto) {
    const larghezza = video.videoWidth || 4;
    const altezza = video.videoHeight || 3;
    const quota = altezza / larghezza;
    return {
      x: ((punto.x - (1 - quota) / 2) / quota) * 100,
      y: punto.y * 100,
    };
  }

  function nellaWebcam(punto) {
    return {
      x: punto.x * (canvas?.width ?? 640),
      y: punto.y * (canvas?.height ?? 480),
    };
  }

  const disegni = [
    { svg: document.getElementById('mani'), posizione: nelQuadrato, morbidezza: MORBIDEZZA_QUADRATO, punta: 3.2, articolazione: 2 },
    { svg: document.getElementById('mani-webcam'), posizione: nellaWebcam, morbidezza: MORBIDEZZA_WEBCAM, punta: 7, articolazione: 4.5 },
  ]
    .filter((disegno) => disegno.svg)
    .map((disegno) => ({
      ...disegno,
      posizioni: Array.from({ length: MANI_MAX }, () => null),
      cerchi: Array.from({ length: MANI_MAX }, () =>
        Array.from({ length: PUNTI_MANO }, (_, p) => {
          const punta = PUNTE.includes(p);
          const cerchio = document.createElementNS(NAMESPACE_SVG, 'circle');
          cerchio.setAttribute('class', punta ? 'punta' : 'articolazione');
          cerchio.setAttribute('r', punta ? disegno.punta : disegno.articolazione);
          cerchio.setAttribute('visibility', 'hidden');
          disegno.svg.append(cerchio);
          return cerchio;
        }),
      ),
    }));

  function disegnaMani(risultati) {
    const trovate = risultati.multiHandLandmarks ?? [];
    const palmo = trovate[0]?.[PUNTO_PALMO];
    window.dispatchEvent(new CustomEvent('mano-mossa', { detail: palmo ? { x: palmo.x, y: palmo.y } : null }));

    disegni.forEach((disegno) => {
      for (let m = 0; m < MANI_MAX; m += 1) {
        const punti = trovate[m];
        if (!punti) {
          disegno.posizioni[m] = null;
          disegno.cerchi[m].forEach((cerchio) => cerchio.setAttribute('visibility', 'hidden'));
          continue;
        }

        const prima = disegno.posizioni[m];
        disegno.posizioni[m] = prima
          ? prima.map((p, i) => ({
              x: p.x + (punti[i].x - p.x) * disegno.morbidezza,
              y: p.y + (punti[i].y - p.y) * disegno.morbidezza,
            }))
          : punti.map(({ x, y }) => ({ x, y }));

        disegno.cerchi[m].forEach((cerchio, i) => {
          const { x, y } = disegno.posizione(disegno.posizioni[m][i]);
          cerchio.setAttribute('cx', x.toFixed(2));
          cerchio.setAttribute('cy', y.toFixed(2));
          cerchio.setAttribute('visibility', 'visible');
        });
      }
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

  const prossimaImmagine =
    typeof video.requestVideoFrameCallback === 'function'
      ? (fatto) => video.requestVideoFrameCallback(fatto)
      : (fatto) => requestAnimationFrame(fatto);

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
    prossimaImmagine(guarda);
  }

  guarda();
})();
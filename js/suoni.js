(() => {
  'use strict';

  const PESI = [300, 400, 500, 700, 800, 900];
  const NOTE = [392, 440, 494, 587, 659, 784];
  const VOLUME = 0.22;
  const TASTO_MUTO = 'm';

  let audio = null;
  let muto = false;
  let ultimoPeso = null;

  function contesto() {
    if (!audio) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return null;
      audio = new Audio();
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }

  function sblocca() {
    contesto();
    removeEventListener('pointerdown', sblocca);
    removeEventListener('keydown', sblocca);
  }

  addEventListener('pointerdown', sblocca);
  addEventListener('keydown', sblocca);

  function gradino(peso) {
    let vicino = 0;
    PESI.forEach((valore, i) => {
      if (Math.abs(valore - peso) < Math.abs(PESI[vicino] - peso)) vicino = i;
    });
    return vicino;
  }

  function nota(peso, ritardo = 0, durata = 0.5, volume = VOLUME) {
    const a = contesto();
    if (!a || muto || a.state !== 'running') return;

    const indice = gradino(peso);
    const pienezza = indice / (PESI.length - 1);
    const frequenza = NOTE[indice];
    const inizio = a.currentTime + ritardo;
    const fine = inizio + durata * (0.7 + pienezza * 0.6);

    const principale = a.createOscillator();
    const sotto = a.createOscillator();
    const corpo = a.createGain();
    const filtro = a.createBiquadFilter();
    const uscita = a.createGain();

    principale.type = 'triangle';
    principale.frequency.value = frequenza;
    sotto.type = 'sine';
    sotto.frequency.value = frequenza / 2;
    corpo.gain.value = pienezza * 0.9;
    filtro.type = 'lowpass';
    filtro.frequency.value = 900 + pienezza * 2600;
    filtro.Q.value = 0.7;

    principale.connect(filtro);
    sotto.connect(corpo).connect(filtro);
    filtro.connect(uscita).connect(a.destination);

    uscita.gain.setValueAtTime(0, inizio);
    uscita.gain.linearRampToValueAtTime(volume, inizio + 0.012);
    uscita.gain.exponentialRampToValueAtTime(0.0008, fine);

    [principale, sotto].forEach((oscillatore) => {
      oscillatore.start(inizio);
      oscillatore.stop(fine + 0.05);
    });
  }

  function carta(peso) {
    if (typeof peso !== 'number') return;
    if (ultimoPeso !== null && peso < ultimoPeso) {
      nota(ultimoPeso, 0, 0.35);
      nota(peso, 0.18, 0.6);
    } else {
      nota(peso);
    }
    ultimoPeso = peso;
  }

  function piuDue(peso) {
    if (typeof peso === 'number') ultimoPeso = peso;
    nota(800, 0, 0.28, VOLUME * 1.2);
    nota(800, 0.13, 0.5, VOLUME * 1.2);
  }

  function cambiaColore() {
    [300, 500, 700, 900].forEach((peso, i) => nota(peso, i * 0.07, 0.6, VOLUME * 0.65));
  }

  function finaleInizio() {
    [300, 500, 700].forEach((peso, i) => nota(peso, 0.2 + i * 0.16, 0.9, VOLUME * 0.75));
  }

  function finaleColore() {
    [300, 500, 700, 900].forEach((peso) => nota(peso, 0, 1.8, VOLUME * 0.55));
  }

  function nuovaPartita() {
    ultimoPeso = null;
  }

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.key.toLowerCase() !== TASTO_MUTO) return;
    muto = !muto;
    console.info(`[UniSuoni] suoni ${muto ? 'spenti' : 'accesi'}`);
  });

  window.UniSuoni = Object.freeze({ carta, piuDue, cambiaColore, finaleInizio, finaleColore, nuovaPartita });
})();
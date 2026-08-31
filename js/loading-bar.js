// Laadbalk bovenaan de pagina, geïnspireerd op de voortgangsbalk die je bij
// grote sites ziet tijdens het laden — hier in de gouden merkkleur.
// Gebruik: window.sopheaLoadingBar.start() bij het begin van het laden,
// window.sopheaLoadingBar.done() zodra de content klaar staat.
(function () {
  const bar = document.createElement('div');
  bar.id = 'sopheaLoadingBar';
  document.body.appendChild(bar);

  let voortgangTimer = null;
  let huidigeBreedte = 0;

  function zetBreedte(pct) {
    huidigeBreedte = pct;
    bar.style.width = `${pct}%`;
  }

  function start() {
    clearInterval(voortgangTimer);
    bar.classList.remove('is-klaar', 'is-verborgen');
    zetBreedte(0);

    // Kruipt geleidelijk naar 92% toe, sneller dan voorheen — anders hangt
    // de balk nog rond de 40-50% terwijl de content (vaak al na ~1s, of
    // sneller bij gecachete productdata) al klaarstaat, en voelt de balk
    // achterop.
    requestAnimationFrame(() => zetBreedte(30));
    voortgangTimer = setInterval(() => {
      const resterend = 92 - huidigeBreedte;
      if (resterend <= 0.5) return;
      zetBreedte(huidigeBreedte + resterend * 0.3);
    }, 100);
  }

  function done() {
    clearInterval(voortgangTimer);
    bar.classList.add('is-klaar');
    zetBreedte(100);
    setTimeout(() => {
      bar.classList.add('is-verborgen');
      setTimeout(() => zetBreedte(0), 250);
    }, 50);
  }

  window.sopheaLoadingBar = { start, done };
})();
// REVIEWS — pas alleen REVIEWS_CONFIG aan.
// Neem de score, het aantal en de reviews precies over van jullie Trustpilot-pagina.

const REVIEWS_CONFIG = {
  // TrustScore zoals op Trustpilot staat, bv. 4.7. Laat op null zolang je hem
  // nog niet hebt overgenomen; dan wordt de score-pil niet getoond.
  score: 4.2,

  // Totaal aantal reviews op Trustpilot.
  aantal: 6,

  // Datum waarop je de score en het aantal voor het laatst hebt overgenomen
  // van Trustpilot (jjjj-mm-dd). Wordt onder de score getoond.
  bijgewerkt: '2026-10-28',

  profielUrl: 'https://nl.trustpilot.com/review/sophea.nl',
  schrijfUrl: 'https://nl.trustpilot.com/evaluate/sophea.nl',

  // Neem naam, titel en tekst letterlijk over van Trustpilot.
  // titel en tekst zijn allebei optioneel.
  // label: precies wat Trustpilot bij de review zet ('Op uitnodiging' of
  // 'Geverifieerd'), of null als er niets staat.
  reviews: [
    {
      naam: 'fien pijl',
      datum: '2026-10-26',
      sterren: 5,
      titel: 'Mega mooie sieraden',
      tekst: 'Mega mooie sieraden, heel mooi zo’n set!🧡🧡',
      label: 'Geverifieerd'
    },
    {
      naam: 'chiara van der linden',
      datum: '2026-10-20',
      sterren: 5,
      titel: 'prachtige sieraden',
      tekst: 'super snelle verzending en mega mooie sieraden, heel mooi handgemaakt en mooie details',
      label: 'Op uitnodiging'
    },
    {
      naam: 'Nikkie Vierhouten',
      datum: '2026-10-12',
      sterren: 5,
      titel: null,
      tekst: 'Hele snelle verzending en ik draag met plezier iedere dag de oorbellen van Sophéa. Ze zijn erg leuk te combineren ook met meerdere oorbellen.',
      label: 'Op uitnodiging'
    },
    {
      naam: 'Emma',
      datum: '2026-10-11',
      sterren: 5,
      titel: 'Mega leuk!!!',
      tekst: null,
      label: 'Op uitnodiging'
    },
    {
      naam: 'Marieke',
      datum: '2026-10-11',
      sterren: 5,
      titel: 'Sieraden Sophea',
      tekst: 'Super leuk setje en verkleurd niet :)',
      label: 'Op uitnodiging'
    },
    {
      naam: 'Lola Heijm',
      datum: '2026-10-11',
      sterren: 5,
      titel: 'Super mooi en was snel binnen :)',
      tekst: null,
      label: 'Geverifieerd'
    },
  ]
};

(function () {
  const sectie = document.getElementById('reviews');
  if (!sectie) return;

  const scoreEl = document.getElementById('reviewsScore');
  const grid = document.getElementById('reviewsGrid');
  const leeg = document.getElementById('reviewsLeeg');
  const knop = document.getElementById('reviewsKnop');
  const link = document.getElementById('reviewsLink');

  const { score, aantal, bijgewerkt, profielUrl, schrijfUrl, reviews } = REVIEWS_CONFIG;
  const formatScore = (n) => n.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const STER = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.5l2.8 6.1 6.7.7-5 4.5 1.4 6.6L12 17.1l-5.9 3.3 1.4-6.6-5-4.5 6.7-.7z"/></svg>';
  const RIJ = `<span class="sterren__rij">${STER.repeat(5)}</span>`;

  function maakSterren(waarde) {
    const wrap = document.createElement('span');
    wrap.className = 'sterren';
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', `${formatScore(waarde)} van 5 sterren`);
    const procent = Math.max(0, Math.min(5, waarde)) / 5 * 100;
    wrap.innerHTML = `${RIJ}<span class="sterren__vulling" style="width:${procent}%">${RIJ}</span>`;
    return wrap;
  }

  // Score-pil
  if (score && aantal > 0) {
    scoreEl.href = profielUrl;
    scoreEl.innerHTML = '';
    const tekst = document.createElement('span');
    tekst.innerHTML = `<strong>${formatScore(score)}</strong> uit 5 <span class="reviews__score-bron">· ${aantal} ${aantal === 1 ? 'review' : 'reviews'} op <span class="reviews__trustpilot">Trustpilot</span></span>`;
    tekst.className = 'reviews__score-tekst';
    scoreEl.append(maakSterren(score), tekst);
    scoreEl.hidden = false;

    // "Bijgewerkt op ..." onder de score, zodat duidelijk is dat de score
    // handmatig is overgenomen en van welke datum hij is.
    if (bijgewerkt) {
      const wrap = document.createElement('div');
      wrap.className = 'reviews__score-wrap';
      scoreEl.parentNode.insertBefore(wrap, scoreEl);
      wrap.appendChild(scoreEl);

      const datumEl = document.createElement('p');
      datumEl.className = 'reviews__bijgewerkt';
      const datum = new Date(bijgewerkt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
      datumEl.innerHTML = `Bijgewerkt op <time datetime="${bijgewerkt}">${datum}</time>`;
      wrap.appendChild(datumEl);
    }
  }

  // Reviewkaarten
  if (reviews.length > 0) {
    reviews.forEach((r) => {
      const li = document.createElement('li');
      li.className = 'review';

      // Kop: initiaal, naam en datum
      const kop = document.createElement('div');
      kop.className = 'review__kop';

      const avatar = document.createElement('span');
      avatar.className = 'review__avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = r.naam.trim().charAt(0).toUpperCase();

      const wie = document.createElement('div');
      const naam = document.createElement('p');
      naam.className = 'review__naam';
      naam.textContent = r.naam;

      const datum = document.createElement('time');
      datum.className = 'review__datum';
      datum.dateTime = r.datum;
      datum.textContent = new Date(r.datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

      wie.append(naam, datum);
      kop.append(avatar, wie);

      li.append(kop, maakSterren(r.sterren));

      if (r.titel) {
        const titel = document.createElement('h3');
        titel.className = 'review__titel';
        titel.textContent = r.titel;
        li.appendChild(titel);
      }

      if (r.tekst) {
        const tekst = document.createElement('p');
        tekst.className = 'review__tekst';
        tekst.textContent = r.tekst;
        li.appendChild(tekst);
      }

      // Label zoals Trustpilot het toont: "Op uitnodiging" of "Geverifieerd"
      if (r.label) {
        const ICONEN = {
          'Geverifieerd': '<polyline points="20 6 9 17 4 12"/>',
          'Op uitnodiging': '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
        };
        const badge = document.createElement('p');
        badge.className = 'review__geverifieerd';
        badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONEN[r.label] || ICONEN['Geverifieerd']}</svg>`;
        badge.append(r.label);
        li.appendChild(badge);
      }

      grid.appendChild(li);
    });

    grid.hidden = false;
    knop.textContent = 'Bekijk alle reviews';
    knop.href = profielUrl;
    link.href = schrijfUrl;
    link.textContent = 'Schrijf een review';
    link.hidden = false;
  } else {
    leeg.hidden = false;
    knop.textContent = 'Schrijf een review';
    knop.href = schrijfUrl;
  }
})();
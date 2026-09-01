const EMAILJS_PUBLIC_KEY = 'ZGgzqXkHaOg2t-pKD';
const EMAILJS_SERVICE_ID = 'service_3hm1ex6';
const EMAILJS_TEMPLATE_ID = 'template_hqptvdn';

const emailjsScript = document.createElement('script');
emailjsScript.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
emailjsScript.onload = () => emailjs.init(EMAILJS_PUBLIC_KEY);
document.head.appendChild(emailjsScript);

(async function () {
  // TERUG-KNOP — moet naar de pagina waar de bezoeker oorspronkelijk vandaan
  // kwam (home of een collectiepagina), niet naar de vorige kleurvariant die
  // je via de kleurbolletjes hebt bekeken. We onthouden dat herkomst-adres
  // in sessionStorage zodra je voor het eerst op een productpagina landt,
  // en overschrijven 'm niet zolang je alleen tussen kleurvarianten wisselt
  // (die navigatie komt namelijk altijd van een andere product.html-pagina).
  const vanuitProductPagina = document.referrer.includes('/product.html');
  if (!vanuitProductPagina || !sessionStorage.getItem('sophea-product-terug')) {
    sessionStorage.setItem('sophea-product-terug', document.referrer || 'index.html');
  }
  document.getElementById('navSubTerug')?.addEventListener('click', () => {
    window.location.href = sessionStorage.getItem('sophea-product-terug') || 'index.html';
  });

  const PRODUCTS = await window.sopheaProductsPromise;

  // Haal product op via URL handle
  const params = new URLSearchParams(window.location.search);
  const handle = params.get('handle');
  const product = PRODUCTS.find(p => p.handle === handle) || PRODUCTS[0];

  function formatPrijs(bedrag) {
    return Number(bedrag).toFixed(2).replace('.', ',');
  }

  // Render product info
  const naamEl = document.querySelector('.product__naam') || document.querySelector('.product__titel');
  if (naamEl) naamEl.textContent = product.naam;

  const breadcrumbEl = document.getElementById('breadcrumbNaam');
  if (breadcrumbEl) breadcrumbEl.textContent = product.naam;

  document.title = `${product.naam} - SOPHÉA`;

  const prijsEl = document.querySelector('.product__prijs');
  const uitverkocht = product.beschikbaar === false;
  if (prijsEl) {
    prijsEl.textContent = uitverkocht ? 'Tijdelijk uitverkocht' : `€ ${formatPrijs(product.prijs)}`;
    if (uitverkocht) prijsEl.classList.add('product__prijs--uitverkocht');
  }

  const voorraadEl = document.getElementById('productOpVoorraad');

  // Badges dynamisch tonen — op basis van de badge:-tags van dit specifieke
  // product (dezelfde als op de collectiepagina). Heeft een product meerdere
  // badges (bv. zowel bestseller als nieuw), dan worden ze allebei getoond;
  // heeft het er geen, dan blijft de wrapper leeg/verborgen.
  const badgesEl = document.getElementById('productBadges');
  if (badgesEl) {
    const badgeLabels = { nieuw: 'nieuw', bestseller: 'bestseller', 'laatste-items': 'laatste items' };
    const badges = product.badges || [];
    badgesEl.innerHTML = badges
      .map(b => `<span class="product__badge product__badge--${b}">${badgeLabels[b] || b}</span>`)
      .join('');
    badgesEl.style.display = badges.length ? '' : 'none';
  }

  // Bewaar-knop koppelen aan de wishlist van dit specifieke product
  const bewaarBtn = document.getElementById('productBewaarBtn');
  if (bewaarBtn) {
    bewaarBtn.dataset.handle = product.handle;
    const zetBewaarTekst = () => {
      bewaarBtn.textContent = sopheaWishlistBevat(product.handle) ? '♥ BEWAARD' : '♡ BEWAAR';
    };
    zetBewaarTekst();
    bewaarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sopheaWishlistToggle(product.handle);
      zetBewaarTekst();
    });
  }
  if (voorraadEl) {
    voorraadEl.textContent = uitverkocht ? '' : '✓ Op voorraad';
  }

  // Accordeon vullen met Shopify-data: beschrijving (staat standaard open),
  // details en materialen als bullet-lijst
  const accordeonEl = document.getElementById('productAccordeon');
  if (accordeonEl) {
    const bulletLijst = (items) => items && items.length
      ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`
      : `<p>Nog geen informatie beschikbaar.</p>`;

    accordeonEl.innerHTML = `
      <div class="accordeon__item is-open">
        <button class="accordeon__btn">
          <span>Productbeschrijving</span>
          <span class="accordeon__icon">+</span>
        </button>
        <div class="accordeon__content">
          ${product.beschrijving || '<p>Nog geen beschrijving beschikbaar.</p>'}
        </div>
      </div>
      <div class="accordeon__item">
        <button class="accordeon__btn">
          <span>Details</span>
          <span class="accordeon__icon">+</span>
        </button>
        <div class="accordeon__content">
          ${bulletLijst(product.details)}
        </div>
      </div>
      <div class="accordeon__item">
        <button class="accordeon__btn">
          <span>Materiaal</span>
          <span class="accordeon__icon">+</span>
        </button>
        <div class="accordeon__content">
          ${bulletLijst(product.materiaal)}
        </div>
      </div>
      <div class="accordeon__item">
        <button class="accordeon__btn">
          <span>Afmetingen</span>
          <span class="accordeon__icon">+</span>
        </button>
        <div class="accordeon__content">
          ${bulletLijst(product.afmetingen)}
        </div>
      </div>
      <div class="accordeon__item">
        <button class="accordeon__btn">
          <span>Verzorging</span>
          <span class="accordeon__icon">+</span>
        </button>
        <div class="accordeon__content">
          <ul>
            <li>Bewaar je sieraad droog, bij voorkeur in het meegeleverde zakje of doosje</li>
            <li>Doe het sieraad af voor het douchen, zwemmen of sporten</li>
            <li>Vermijd contact met parfum, lotion en schoonmaakmiddelen</li>
            <li>Maak schoon met een zachte, droge doek</li>
          </ul>
        </div>
      </div>
      <div class="accordeon__item">
        <button class="accordeon__btn">
          <span>Verzending & Retour</span>
          <span class="accordeon__icon">+</span>
        </button>
        <div class="accordeon__content">
          <p>Gratis verzending vanaf €50. Levertijd 3-5 werkdagen. Retourneren binnen 14 dagen, mits ongedragen en in originele verpakking.</p>
        </div>
      </div>
    `;
  }

  // Render foto's (en eventuele video's) als verticale stapel — scrollen
  // toont automatisch het volgende item. Video's die je in Shopify bij het
  // product hebt geüpload komen gewoon tussen de foto's in te staan, in de
  // volgorde zoals in Shopify ingesteld.
  const media = product.media && product.media.length > 0
    ? product.media
    : (product.images && product.images.length > 0 ? product.images : [product.image].filter(Boolean)).map(src => ({ type: 'image', src }));

  // Losse lijst van alleen de foto's, voor de lightbox (die is alleen voor
  // foto's bedoeld — video's spelen gewoon inline af in de carrousel).
  const foto = media.filter(m => m.type === 'image').map(m => m.src);

  const fotosEl = document.getElementById('productFotos');
  if (fotosEl) {
    let fotoTeller = 0;
    fotosEl.innerHTML = media.length > 0
      ? media.map((item) => {
          if (item.type === 'video') {
            return `
              <div class="product__foto-item">
                <video src="${item.src}" controls muted playsinline loop></video>
              </div>
            `;
          }
          const index = fotoTeller++;
          return `
            <div class="product__foto-item">
              <img src="${item.src}" alt="${product.naam}" data-foto-index="${index}" />
            </div>
          `;
        }).join('')
      : `<div class="product__foto-item"><div class="product__foto-placeholder">FOTO<br><small>product op witte achtergrond</small></div></div>`;
  }

  // FOTO LIGHTBOX — klik op een productfoto voor een vergrote weergave,
  // met pijlen/bullets om tussen alle foto's van dit product te schakelen.
  let fotoOverlayActief = 0;
  let fotoOverlayScrollY = 0;

  function laadFotoOverlay(index) {
    fotoOverlayActief = index;
    const img = document.getElementById('fotoOverlayImg');
    if (img) {
      img.src = foto[fotoOverlayActief];
      img.alt = product.naam;
    }
    const titelEl = document.getElementById('fotoOverlayTitel');
    if (titelEl) titelEl.textContent = product.naam;
    const bulletsEl = document.getElementById('fotoOverlayBullets');
    if (bulletsEl) {
      bulletsEl.innerHTML = foto.length > 1
        ? foto.map((_, i) => `<button class="foto-overlay__bullet ${i === fotoOverlayActief ? 'foto-overlay__bullet--actief' : ''}" data-foto="${i}"></button>`).join('')
        : '';
      bulletsEl.querySelectorAll('.foto-overlay__bullet').forEach(b => {
        b.addEventListener('click', () => laadFotoOverlay(parseInt(b.dataset.foto)));
      });
    }
    const pijlLinks = document.getElementById('fotoOverlayVorige');
    const pijlRechts = document.getElementById('fotoOverlayVolgende');
    const toonPijlen = foto.length > 1;
    if (pijlLinks) pijlLinks.style.display = toonPijlen ? 'flex' : 'none';
    if (pijlRechts) pijlRechts.style.display = toonPijlen ? 'flex' : 'none';
  }

  function openFotoOverlay(index, sourceEl) {
    laadFotoOverlay(index);
    document.getElementById('fotoOverlay')?.classList.add('is-open');
    document.getElementById('fotoBackdrop')?.classList.add('is-open');
    fotoOverlayScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${fotoOverlayScrollY}px`;
    document.body.style.width = '100%';

    if (!sourceEl) return;

    const overlayImg = document.getElementById('fotoOverlayImg');
    if (!overlayImg) return;

    const speel = () => {
      requestAnimationFrame(() => {
        const startRect = sourceEl.getBoundingClientRect();
        const eindRect = overlayImg.getBoundingClientRect();

        const schaalX = startRect.width / eindRect.width;
        const schaalY = startRect.height / eindRect.height;
        const verschuifX = (startRect.left + startRect.width / 2) - (eindRect.left + eindRect.width / 2);
        const verschuifY = (startRect.top + startRect.height / 2) - (eindRect.top + eindRect.height / 2);

        overlayImg.style.transition = 'none';
        overlayImg.style.transform = `translate(${verschuifX}px, ${verschuifY}px) scale(${schaalX}, ${schaalY})`;
        overlayImg.getBoundingClientRect(); // forceer reflow zodat de starttoestand echt gerenderd wordt
        requestAnimationFrame(() => {
          overlayImg.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
          overlayImg.style.transform = 'translate(0, 0) scale(1, 1)';
        });
      });
    };

    // Foto moet echt geladen zijn voordat we z'n eindformaat kunnen meten
    if (overlayImg.complete) {
      speel();
    } else {
      overlayImg.addEventListener('load', speel, { once: true });
    }
  }

  function sluitFotoOverlay() {
    document.getElementById('fotoOverlay')?.classList.remove('is-open');
    document.getElementById('fotoBackdrop')?.classList.remove('is-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: fotoOverlayScrollY, behavior: 'instant' });

    const overlayImg = document.getElementById('fotoOverlayImg');
    if (overlayImg) {
      overlayImg.style.transition = '';
      overlayImg.style.transform = '';
    }
  }

  fotosEl?.querySelectorAll('.product__foto-item img').forEach(img => {
    img.addEventListener('click', () => openFotoOverlay(parseInt(img.dataset.fotoIndex), img));
  });

  document.getElementById('fotoOverlaySluit')?.addEventListener('click', sluitFotoOverlay);
  document.getElementById('fotoBackdrop')?.addEventListener('click', sluitFotoOverlay);

  document.getElementById('fotoOverlayVolgende')?.addEventListener('click', () => {
    laadFotoOverlay((fotoOverlayActief + 1) % foto.length);
  });

  document.getElementById('fotoOverlayVorige')?.addEventListener('click', () => {
    laadFotoOverlay((fotoOverlayActief - 1 + foto.length) % foto.length);
  });

  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('fotoOverlay')?.classList.contains('is-open')) return;
    if (e.key === 'Escape') sluitFotoOverlay();
    if (e.key === 'ArrowRight') laadFotoOverlay((fotoOverlayActief + 1) % foto.length);
    if (e.key === 'ArrowLeft') laadFotoOverlay((fotoOverlayActief - 1 + foto.length) % foto.length);
  });

  // Swipe-ondersteuning op mobiel
  (function () {
    const overlayEl = document.getElementById('fotoOverlay');
    if (!overlayEl) return;
    let touchStartX = 0;
    overlayEl.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    overlayEl.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) < 40 || foto.length < 2) return;
      if (diff < 0) laadFotoOverlay((fotoOverlayActief + 1) % foto.length);
      else laadFotoOverlay((fotoOverlayActief - 1 + foto.length) % foto.length);
    }, { passive: true });
  })();

  // KLEURVARIANTEN
  function kleurWeergave(p) {
    // Platte schijf i.p.v. bol: een diagonale kleurovergang, met daaroverheen
    // een schuine glanzende lichtstreep (zoals bij glanzend/parelmoer materiaal) —
    // geen bol-schaduw meer, wel veel meer glans-gevoel.
    const maakGradient = (kleur1, kleur2) => `
      linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.7) 48%, transparent 62%),
      linear-gradient(135deg, ${kleur1}, ${kleur2})
    `;

    // Zelfde kleurenlijst als op de collectiepagina, zodat kleuren overal
    // hetzelfde ogen. Nieuwe kleur:-tags in Shopify die hier niet in staan
    // krijgen automatisch een neutrale grijze gradient (breekt nooit).
    const basis = {
      navy: ['#3d5a8a', '#0d1b3d'], marineblauw: ['#3d5a8a', '#0d1b3d'],
      turquoise: ['#6fe0d0', '#0f8a78'],
      roze: ['#f7c3d3', '#c76080'], rose: ['#f7c3d3', '#c76080'], pink: ['#f7c3d3', '#c76080'],
      helder: ['#ffffff', '#d9ecec'], clear: ['#ffffff', '#d9ecec'], transparant: ['#ffffff', '#d9ecec'],
      kristal: ['#ffffff', '#e6e1d6'], crystal: ['#ffffff', '#e6e1d6'],
      blauw: ['#8fc4ef', '#3a72a8'], blue: ['#8fc4ef', '#3a72a8'],
      lichtblauw: ['#a8d4f0', '#4a90c2'], donkerblauw: ['#3d5a8a', '#0d1b3d'],
      champagne: ['#f5e6c8', '#c9a96e'],
      bordeaux: ['#a04060', '#4a0f22'], wijnrood: ['#a04060', '#4a0f22'],
      zwart: ['#4a4a4a', '#1a1a1a'], black: ['#4a4a4a', '#1a1a1a'],
      wit: ['#ffffff', '#e0d8d0'], white: ['#ffffff', '#e0d8d0'],
      rood: ['#e57373', '#8a1f1f'], red: ['#e57373', '#8a1f1f'],
      oranje: ['#ffb680', '#c9601a'], orange: ['#ffb680', '#c9601a'],
      geel: ['#fde68a', '#c9a227'], yellow: ['#fde68a', '#c9a227'],
      groen: ['#8fd4a8', '#2f7a4f'], green: ['#8fd4a8', '#2f7a4f'],
      mint: ['#a9e8d4', '#3fa98a'], mintgroen: ['#a9e8d4', '#3fa98a'],
      paars: ['#c9a8e0', '#6b3fa0'], purple: ['#c9a8e0', '#6b3fa0'], lila: ['#c9a8e0', '#6b3fa0'],
      bruin: ['#c9a374', '#6b4423'], brown: ['#c9a374', '#6b4423'],
      beige: ['#e8ddc8', '#b8a279'],
      grijs: ['#d4d4d4', '#7a7a7a'], gray: ['#d4d4d4', '#7a7a7a'], grey: ['#d4d4d4', '#7a7a7a'],
      goud: ['#f5e6c8', '#c9a96e'], gold: ['#f5e6c8', '#c9a96e'],
      zilver: ['#e8e8e8', '#a8a8a8'], silver: ['#e8e8e8', '#a8a8a8'],
      koper: ['#e0a87a', '#a85f2e'], copper: ['#e0a87a', '#a85f2e'],
      creme: ['#f7f2e0', '#e0d4b0'], ivoor: ['#f7f2e0', '#e0d4b0'], ivory: ['#f7f2e0', '#e0d4b0'],
    };

    const kleurNaam = (p.kleur || '').toLowerCase();
    const [k1, k2] = basis[kleurNaam] || ['#ccc', '#999'];
    const label = p.kleur ? p.kleur.charAt(0).toUpperCase() + p.kleur.slice(1) : '';

    return { label, gradient: maakGradient(k1, k2) };
  }

  function renderKleurVarianten() {
    const wrap = document.getElementById('productKleuren');
    if (!wrap || !product.model) return;

    const groep = PRODUCTS.filter(p => p.model === product.model && p.categorie === product.categorie);
    if (groep.length <= 1) return;

    const huidigeKleur = kleurWeergave(product);

    wrap.innerHTML = `
      <p class="product__kleuren-label">Kleur: <span>${huidigeKleur.label}</span></p>
      <div class="product__kleuren-opties">
        ${groep.map(p => {
          const kw = kleurWeergave(p);
          return `<a href="product.html?handle=${p.handle}" class="product__kleur-dot ${p.handle === product.handle ? 'product__kleur-dot--actief' : ''}" style="background: ${kw.gradient};" title="${kw.label}"></a>`;
        }).join('')}
      </div>
    `;
  }

  renderKleurVarianten();

  // Accordeon
  document.querySelectorAll('.accordeon__item').forEach(item => {
    const knop = item.querySelector('.accordeon__btn') || item.querySelector('.accordeon__knop');
    knop?.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.accordeon__item').forEach(i => i.classList.remove('is-open'));
      if (!isOpen) item.classList.add('is-open');
    });
  });

  // WINKELWAGEN TOEVOEGEN
  function voegToeAanCart(productId) {
    let cart = JSON.parse(localStorage.getItem('sophea-cart') || '[]');
    const bestaand = cart.find(i => i.productId === productId);
    if (bestaand) {
      bestaand.aantal += 1;
    } else {
      cart.push({ productId, aantal: 1 });
    }
    localStorage.setItem('sophea-cart', JSON.stringify(cart));
    updateCartBadge();
    openCart();
  }

  const cta = document.getElementById('winkelwagenBtn');
  if (cta) {
    if (uitverkocht) {
      cta.textContent = 'UITVERKOCHT';
      cta.disabled = true;
      cta.classList.add('product__cta--uitverkocht');

      const meldWrap = document.createElement('div');
      meldWrap.className = 'product__meld-wrap';
      meldWrap.innerHTML = `
        <button class="product__meld-btn" id="meldMijBtn" type="button">Breng mij op de hoogte zodra dit stuk terugkeert</button>
        <form class="product__meld-form" id="meldMijForm" style="display:none;">
          <input type="email" class="product__meld-input" id="meldMijEmail" placeholder="Jouw e-mailadres" required />
          <button type="submit" class="product__meld-submit">VERSTUREN</button>
        </form>
        <p class="product__meld-bevestiging" id="meldMijBevestiging" style="display:none;">Bedankt! Je hoort van ons zodra dit stuk weer beschikbaar is. Houd ook onze socials in de gaten voor nieuwe drops.</p>
      `;
      cta.insertAdjacentElement('afterend', meldWrap);

      const meldBtn = document.getElementById('meldMijBtn');
      const meldForm = document.getElementById('meldMijForm');
      const meldBevestiging = document.getElementById('meldMijBevestiging');

      meldBtn.addEventListener('click', () => {
        meldBtn.style.display = 'none';
        meldForm.style.display = 'flex';
      });

      meldForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailVeld = document.getElementById('meldMijEmail');
        const submitBtn = meldForm.querySelector('.product__meld-submit');
        submitBtn.textContent = 'VERSTUREN...';
        submitBtn.disabled = true;

        try {
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            naam: 'Voorraadmelding',
            email: emailVeld.value,
            onderwerp: 'Voorraadmelding',
            ordernummer: product.handle,
            bericht: `Deze klant (${emailVeld.value}) wil op de hoogte gebracht worden zodra "${product.naam}" weer op voorraad is.`,
          });
          meldForm.style.display = 'none';
          meldBevestiging.style.display = 'block';
        } catch (err) {
          console.error('EmailJS fout (voorraadmelding):', err);
          submitBtn.textContent = 'PROBEER OPNIEUW';
          submitBtn.disabled = false;
        }
      });
    } else {
      cta.addEventListener('click', () => {
        voegToeAanCart(product.id);
        cta.textContent = '✓ TOEGEVOEGD';
        setTimeout(() => {
          cta.textContent = 'IN WINKELWAGEN';
        }, 2000);
      });
    }
  }

  // OOK LEUK
  function telKleuren(p) {
    if (!p.model) return null;
    const groep = PRODUCTS.filter(x => x.model === p.model && x.categorie === p.categorie);
    return groep.length > 1 ? groep.length : null;
  }

  function renderOokLeuk() {
    const grid = document.getElementById('ookLeukGrid');
    if (!grid) return;

    // Relevantie-score: dezelfde kleur weegt het zwaarst (bv. iemand die naar
    // een blauwe handchain kijkt, ziet dan liever ook oorbellen in diezelfde
    // blauwe kleur dan iets willekeurigs), en weegt nu duidelijk zwaarder dan
    // categorie — een kleurmatch wint altijd van een categorie+model-match
    // zonder kleurmatch. Daarna komt categorie, dan hetzelfde model (een
    // andere kleur van precies dit ontwerp). Daarbovenop komt een kleine
    // random-factor, zodat de selectie én volgorde bij elk paginabezoek
    // anders is — maar wel logisch verwant blijft.
    const gescoord = PRODUCTS
      .filter(p => p.id !== product.id)
      .map(p => {
        let score = 0;
        if (p.kleurGroep && p.kleurGroep === product.kleurGroep) score += 6;
        if (p.categorie === product.categorie) score += 2;
        if (p.model && p.model === product.model) score += 1;
        return { p, score: score + Math.random() * 1 };
      })
      .sort((a, b) => b.score - a.score);

    const suggesties = gescoord.slice(0, 4).map(x => x.p);

    grid.innerHTML = suggesties.map(p => {
      const hoofdfoto = p.images?.[0] || p.image;
      const hoverfoto = p.images?.[1];
      const kleurenAantal = telKleuren(p);
      return `
      <a href="product.html?handle=${p.handle}" class="product-card">
        <div class="product-card__img-wrap">
          ${hoofdfoto
            ? `<img class="product-card__img-main" src="${hoofdfoto}" alt="${p.naam}" />`
            : `<div class="product-card__foto-placeholder">FOTO</div>`
          }
          ${hoverfoto
            ? `<img class="product-card__img-hover" src="${hoverfoto}" alt="${p.naam}" />`
            : ''
          }
          <button class="product-card__hart" data-handle="${p.handle}" aria-label="Aan wishlist toevoegen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.1 1.8 6.6 4.7 5.2c2.2-1.05 4.6-.2 5.9 1.5l1.4 1.8 1.4-1.8c1.3-1.7 3.7-2.55 5.9-1.5 2.9 1.4 3.7 4.9 2 7.7C18.7 16.65 12 21 12 21z"/>
            </svg>
          </button>
        </div>
        <div class="product-card__body">
          <span class="product-card__naam">${p.naam}</span>
          <span class="product-card__prijs">€ ${formatPrijs(p.prijs)}</span>
          ${kleurenAantal ? `<span class="product-card__kleuren">${kleurenAantal} kleuren</span>` : ''}
        </div>
      </a>
    `;
    }).join('');
    sopheaWishlistKnoppenBinden(grid);
  }

  renderOokLeuk();

  // OUTFIT INSPO — video's per product-handle. Voeg hier een regel toe zodra
  // er een nieuwe outfit-inspo video is voor een product; dezelfde video kan
  // bij meerdere handles staan (zoals nu bij ketting + oorbellen roze).
  // Video-bestanden horen in de map videos/.
  // OUTFIT INSPO — video's per product-handle. Voeg hier een regel toe zodra
  // er een nieuwe outfit-inspo video is voor een product; dezelfde video kan
  // bij meerdere handles staan (zoals nu bij ketting + oorbellen + hand chain
  // set roze). Video-bestanden horen in de map videos/.
  // 'producten' bevat de handles van ALLE items die in de video te zien zijn
  // — dat is wat er in de "Shop the look"-lijst van de overlay verschijnt,
  // niet alleen het product van de pagina waar je nu op zit.
  const OUTFIT_INSPO_VIDEOS = {
    'golden-hour-ketting-roze-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'outfit-inspo-roze.mp4',
        tiktokUrl: 'https://www.tiktok.com/@sophea.nl/video/7661698310788435233',
        producten: [
          'golden-hour-x-hand-chain-set-roze-gold-plated',
          'golden-hour-ketting-roze-gold-plated',
          'golden-hour-oorbellen-roze-gold-plated',
        ],
      },
    ],
    'golden-hour-oorbellen-roze-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'outfit-inspo-roze.mp4',
        tiktokUrl: 'https://www.tiktok.com/@sophea.nl/video/7661698310788435233',
        producten: [
          'golden-hour-x-hand-chain-set-roze-gold-plated',
          'golden-hour-ketting-roze-gold-plated',
          'golden-hour-oorbellen-roze-gold-plated',
        ],
      },
    ],
    'golden-hour-x-hand-chain-set-roze-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'outfit-inspo-roze.mp4',
        tiktokUrl: 'https://www.tiktok.com/@sophea.nl/video/7661698310788435233',
        producten: [
          'golden-hour-x-hand-chain-set-roze-gold-plated',
          'golden-hour-ketting-roze-gold-plated',
          'golden-hour-oorbellen-roze-gold-plated',
        ],
      },
    ],
    'golden-hour-x-hand-chain-set-blauw-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'blue-stack.mp4',
        tiktokUrl: 'https://www.tiktok.com/@sophea.nl/video/7662447102529703201',
        producten: [
          'golden-hour-x-hand-chain-set-blauw-gold-plated',
          'golden-hour-ketting-blauw-gold-plated',
          'golden-hour-oorbellen-blauw-gold-plated',
        ],
      },
      {
        naam: '@sophea.nl',
        video: 'wine.mp4',
        tiktokUrl: 'https://www.tiktok.com/@sophea.nl/video/7665046618185551136',
        producten: [
          'golden-hour-x-hand-chain-set-blauw-gold-plated',
          'golden-hour-hand-chain-helder-gold-plated',
        ],
      },
    ],
    'golden-hour-hand-chain-helder-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'wine.mp4',
        tiktokUrl: 'https://www.tiktok.com/@sophea.nl/video/7665046618185551136',
        producten: [
          'golden-hour-x-hand-chain-set-blauw-gold-plated',
          'golden-hour-hand-chain-helder-gold-plated',
        ],
      },
    ],
    'golden-hour-oorbellen-blauw-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'blue-stack.mp4',
        tiktokUrl: 'https://www.tiktok.com/@sophea.nl/video/7662447102529703201',
        producten: [
          'golden-hour-x-hand-chain-set-blauw-gold-plated',
          'golden-hour-ketting-blauw-gold-plated',
          'golden-hour-oorbellen-blauw-gold-plated',
        ],
      },
    ],
    'golden-hour-ketting-blauw-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'blue-stack.mp4',
        tiktokUrl: 'https://www.tiktok.com/@sophea.nl/video/7662447102529703201',
        producten: [
          'golden-hour-x-hand-chain-set-blauw-gold-plated',
          'golden-hour-ketting-blauw-gold-plated',
          'golden-hour-oorbellen-blauw-gold-plated',
        ],
      },
    ],
    'golden-hour-ketting-navy-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'navy-stack.mp4',
        producten: [
          'golden-hour-ketting-navy-gold-plated',
          'golden-hour-oorbellen-navy-gold-plated',
          'golden-hour-x-hand-chain-set-navy-gold-plated',
          'cote-complete-set-donkerblauw-gold-plated',
        ],
      },
    ],
    'golden-hour-oorbellen-navy-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'navy-stack.mp4',
        producten: [
          'golden-hour-ketting-navy-gold-plated',
          'golden-hour-oorbellen-navy-gold-plated',
          'golden-hour-x-hand-chain-set-navy-gold-plated',
          'cote-complete-set-donkerblauw-gold-plated',
        ],
      },
    ],
    'golden-hour-x-hand-chain-set-navy-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'navy-stack.mp4',
        producten: [
          'golden-hour-ketting-navy-gold-plated',
          'golden-hour-oorbellen-navy-gold-plated',
          'golden-hour-x-hand-chain-set-navy-gold-plated',
          'cote-complete-set-donkerblauw-gold-plated',
        ],
      },
    ],
    'cote-complete-set-donkerblauw-gold-plated': [
      {
        naam: '@sophea.nl',
        video: 'navy-stack.mp4',
        producten: [
          'golden-hour-ketting-navy-gold-plated',
          'golden-hour-oorbellen-navy-gold-plated',
          'golden-hour-x-hand-chain-set-navy-gold-plated',
          'cote-complete-set-donkerblauw-gold-plated',
        ],
      },
    ],
  };

  const naarTiktokProduct = (p) => p ? { naam: p.naam, prijs: p.prijs, handle: p.handle, image: p.image } : null;

  const TIKTOK_DATA = (OUTFIT_INSPO_VIDEOS[product.handle] || []).map(item => ({
    naam: item.naam,
    video: item.video,
    tiktokUrl: item.tiktokUrl,
    producten: item.producten.map(h => naarTiktokProduct(PRODUCTS.find(p => p.handle === h))).filter(Boolean),
  }));

  const tiktokSectie = document.querySelector('.tiktok');
  const tiktokGrid = document.getElementById('tiktokGrid');

  if (TIKTOK_DATA.length === 0) {
    // Geen outfit-inspo video voor dit specifieke product: hele sectie verbergen
    // i.p.v. nep-placeholders tonen.
    if (tiktokSectie) tiktokSectie.style.display = 'none';
  } else {
    if (tiktokGrid) {
      tiktokGrid.innerHTML = TIKTOK_DATA.map((data, index) => {
        const hoofdproduct = data.producten.find(p => p.handle === product.handle) || data.producten[0];
        return `
        <div class="tiktok__item" data-index="${index}">
          <video class="tiktok__video" src="videos/${data.video}" loop muted playsinline></video>
          <div class="tiktok__handle">
            ${data.tiktokUrl
              ? `<a href="${data.tiktokUrl}" target="_blank" rel="noopener" class="tiktok__naam" onclick="event.stopPropagation()">${data.naam}</a>`
              : `<span class="tiktok__naam">${data.naam}</span>`
            }
          </div>
          ${hoofdproduct ? `
          <div class="tiktok__productkaart">
            <div class="tiktok__product-img">
              ${hoofdproduct.image ? `<img src="${hoofdproduct.image}" alt="${hoofdproduct.naam}" />` : ''}
            </div>
            <span class="tiktok__product-naam">${hoofdproduct.naam}</span>
          </div>
          ` : ''}
        </div>
      `;
      }).join('');

      // Video's blijven anders continu op de achtergrond decoderen zodra
      // ze eenmaal gestart zijn — ook ver buiten beeld — wat de hele pagina
      // laat haperen. Met een IntersectionObserver spelen ze alleen af
      // zolang ze daadwerkelijk zichtbaar zijn, en pauzeren ze zodra je
      // wegscrolt (currentTime niet resetten, zodat 'ie soepel hervat).
      if ('IntersectionObserver' in window) {
        const tiktokVideoObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.play().catch(() => {});
            } else {
              entry.target.pause();
            }
          });
        }, { threshold: 0.25 });

        tiktokGrid.querySelectorAll('.tiktok__video').forEach(video => {
          tiktokVideoObserver.observe(video);
        });
      } else {
        // Fallback voor zeer oude browsers zonder IntersectionObserver-support
        tiktokGrid.querySelectorAll('.tiktok__video').forEach(video => {
          video.play().catch(() => {});
        });
      }
    }
  }

  let tiktokActief = 0;
  let geluidAan = true;

  document.querySelectorAll('.tiktok__item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      openTiktokOverlay(index);
    });
  });

  function laadTiktokVideo(index) {
    const data = TIKTOK_DATA[index];
    const overlayVideo = document.getElementById('tiktokOverlayVideo');
    const overlayNaam = document.getElementById('tiktokOverlayNaam');
    const overlayProduct = document.getElementById('tiktokProduct');

    if (!overlayVideo) return;

    overlayVideo.src = data.video ? `videos/${data.video}` : '';
    // Bij openen meteen mét geluid afspelen (dit is een expliciete klik van
    // de gebruiker, dus browsers staan autoplay-met-geluid hier toe).
    overlayVideo.muted = false;
    geluidAan = true;
    overlayVideo.play().catch(() => {
      // Blokkeert de browser autoplay-met-geluid toch: alsnog muted starten
      // zodat de video sowieso speelt i.p.v. helemaal stil te blijven staan.
      overlayVideo.muted = true;
      geluidAan = false;
      overlayVideo.play();
    });
    document.getElementById('tiktokGeluid')?.querySelectorAll('.geluid-aan').forEach(el => {
      el.style.display = geluidAan ? 'block' : 'none';
    });

    if (overlayNaam) {
      overlayNaam.innerHTML = data.tiktokUrl
        ? `<a href="${data.tiktokUrl}" target="_blank" rel="noopener">${data.naam}</a>`
        : data.naam;
    }

    // Pijlen om tussen video's te wisselen alleen tonen als er meerdere zijn.
    const pijlVorige = document.getElementById('tiktokVorige');
    const pijlVolgende = document.getElementById('tiktokVolgende');
    if (pijlVorige) pijlVorige.style.display = TIKTOK_DATA.length > 1 ? 'flex' : 'none';
    if (pijlVolgende) pijlVolgende.style.display = TIKTOK_DATA.length > 1 ? 'flex' : 'none';

    if (overlayProduct) {
      overlayProduct.innerHTML = data.producten.length > 0
        ? data.producten.map(p => `
          <div class="stl__product">
            <div class="stl__product-img">
              ${p.image ? `<img src="${p.image}" alt="${p.naam}" />` : ''}
            </div>
            <div>
              <p class="stl__product-naam">${p.naam}</p>
              <p class="stl__product-prijs">€ ${formatPrijs(p.prijs)}</p>
            </div>
            <a href="product.html?handle=${p.handle}" class="stl__product-btn">SHOP</a>
          </div>
        `).join('')
        : `<p class="stl__product-leeg">Dit sieraad is binnenkort te shoppen.</p>`;
    }
  }

  let tiktokScrollY = 0;

  function openTiktokOverlay(index) {
    tiktokActief = index;
    laadTiktokVideo(index);
    document.getElementById('tiktokOverlay')?.classList.add('is-open');
    document.getElementById('tiktokBackdrop')?.classList.add('is-open');
    // position: fixed i.p.v. overflow: hidden — overflow: hidden (ook
    // tijdelijk) breekt position: sticky permanent in Safari/iOS.
    tiktokScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${tiktokScrollY}px`;
    document.body.style.width = '100%';
    // Roostervideo's op de achtergrond pauzeren — anders lopen die onafhankelijk
    // door terwijl de overlay-video vanaf het begin start, en oogt het alsof
    // ze niet synchroon lopen.
    tiktokGrid?.querySelectorAll('.tiktok__video').forEach(video => video.pause());
  }

  document.getElementById('tiktokVolgende')?.addEventListener('click', () => {
    tiktokActief = (tiktokActief + 1) % TIKTOK_DATA.length;
    laadTiktokVideo(tiktokActief);
  });

  document.getElementById('tiktokVorige')?.addEventListener('click', () => {
    tiktokActief = (tiktokActief - 1 + TIKTOK_DATA.length) % TIKTOK_DATA.length;
    laadTiktokVideo(tiktokActief);
  });

  document.getElementById('tiktokGeluid')?.addEventListener('click', () => {
    const video = document.getElementById('tiktokOverlayVideo');
    if (!video) return;
    geluidAan = !geluidAan;
    video.muted = !geluidAan;
    document.getElementById('tiktokGeluid')?.querySelectorAll('.geluid-aan').forEach(el => {
      el.style.display = geluidAan ? 'block' : 'none';
    });
  });

  function sluitTiktokOverlay() {
    const video = document.getElementById('tiktokOverlayVideo');
    if (video) { video.pause(); video.src = ''; }
    document.getElementById('tiktokOverlay')?.classList.remove('is-open');
    document.getElementById('tiktokBackdrop')?.classList.remove('is-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: tiktokScrollY, behavior: 'instant' });
    // Roostervideo's die weer in beeld zijn hervatten — de IntersectionObserver
    // pakt scroll-in/uit vanaf hier vanzelf weer op, maar de al zichtbare
    // items moeten na het pauzeren bij het openen wel weer expliciet starten.
    tiktokGrid?.querySelectorAll('.tiktok__video').forEach(video => {
      const rect = video.getBoundingClientRect();
      const zichtbaar = rect.top < window.innerHeight && rect.bottom > 0;
      if (zichtbaar) video.play().catch(() => {});
    });
  }

  document.getElementById('tiktokSluit')?.addEventListener('click', sluitTiktokOverlay);
  document.getElementById('tiktokBackdrop')?.addEventListener('click', sluitTiktokOverlay);

  // STL DATA — #SOPHÉA carrousel
  // Zoekt bestaande producten op via hun Shopify-handle. Staat een product
  // hier nog niet in Shopify, dan wordt het gewoon overgeslagen (leeg array),
  // en toont de overlay automatisch een "binnenkort beschikbaar"-melding.
  //
  // Elke foto heeft zijn EIGEN producten-lijst (i.p.v. één gedeelde lijst per
  // persoon) — zo verspringen de getoonde sieraden rechts automatisch mee
  // zodra je tussen de foto's van dezelfde persoon swipet/klikt, zonder dat
  // je naar de volgende persoon in de carrousel gaat.
  const vindProduct = (handle) => PRODUCTS.find(p => p.handle === handle);
  const naarShopProduct = (p) => p ? { naam: p.naam, prijs: p.prijs, handle: p.handle, image: p.image } : null;

  // Handige hulpfunctie om een foto op te bouwen: geef de afbeelding en de
  // handles van de producten die erop te zien zijn.
  const maakFoto = (src, handles) => ({
    src,
    producten: handles.map(h => naarShopProduct(vindProduct(h))).filter(Boolean),
  });

  const sophiaData = {
    naam: '@sophiavandoornik',
    fotos: [
      maakFoto('images/sophia-1.jpg', [
        'golden-hour-ketting-helder-gold-plated',
        'capri-hand-chain-helder-gold-plated',
        'golden-hour-oorbellen-helder-gold-plated',
      ]),
      maakFoto('images/sophia-2-nieuw.jpg', [
        'golden-hour-ketting-helder-gold-plated',
        'capri-hand-chain-helder-gold-plated',
        'golden-hour-oorbellen-helder-gold-plated',
      ]),
      maakFoto('images/sophia-3.jpg', [
        'golden-hour-ketting-helder-gold-plated',
        'capri-hand-chain-helder-gold-plated',
        'golden-hour-oorbellen-helder-gold-plated',
      ]),
      maakFoto('images/sophia.jpg', ['golden-hour-x-hand-chain-set-helder-gold-plated']),
      maakFoto('images/sophia-2.jpg', [
        'golden-hour-handchain-blauw-gold-plated',
        'golden-hour-ketting-blauw-gold-plated',
        'golden-hour-oorbellen-blauw-gold-plated',
        'golden-hour-voordeelset-blauw-gold-plated',
      ]),
    ],
  };

  const elishaData = {
    naam: '@elishatenkate',
    fotos: [
      maakFoto('images/elisha-1-nieuw.jpg', [
        'golden-hour-voordeelset-navy-gold-plated',
        'capri-hand-chain-navy-gold-plated',
        'golden-hour-ketting-navy-gold-plated',
        'golden-hour-oorbellen-navy-gold-plated',
      ]),
      maakFoto('images/elisha-2-nieuw.jpg', [
        'golden-hour-ketting-navy-gold-plated',
        'golden-hour-oorbellen-navy-gold-plated',
      ]),
      maakFoto('images/elisha.jpeg', [
        'golden-hour-ketting-roze-gold-plated',
        'golden-hour-oorbellen-roze-gold-plated',
        'golden-hour-x-hand-chain-set-roze-gold-plated',
      ]),
      maakFoto('images/elisha-2.jpg', [
        'golden-hour-x-hand-chain-set-navy-gold-plated',
        'golden-hour-ketting-navy-gold-plated',
        'golden-hour-oorbellen-navy-gold-plated',
      ]),
    ],
  };

  const ellaData = {
    naam: '@ellaverhagen_',
    fotos: [
      maakFoto('images/ella.jpg', [
        'golden-hour-x-hand-chain-set-turquoise-gold-plated',
        'golden-hour-ketting-turquoise-gold-plated',
        'golden-hour-oorbellen-turquoise-gold-plated',
      ]),
      maakFoto('images/ella-2.jpg', [
        'golden-hour-x-hand-chain-set-turquoise-gold-plated',
        'golden-hour-ketting-turquoise-gold-plated',
        'golden-hour-oorbellen-turquoise-gold-plated',
      ]),
    ],
  };

  const dakotaData = {
    naam: '@dakotakosmann',
    fotos: [
      maakFoto('images/dakota.jpg', [
        'golden-hour-x-hand-chain-set-navy-gold-plated',
        'golden-hour-ketting-navy-gold-plated',
        'golden-hour-oorbellen-navy-gold-plated',
      ]),
      maakFoto('images/dakota-2.jpg', [
        'golden-hour-x-hand-chain-set-navy-gold-plated',
        'golden-hour-ketting-navy-gold-plated',
        'golden-hour-oorbellen-navy-gold-plated',
      ]),
    ],
  };

  const julieData = {
    naam: '@juliedorjee',
    fotos: [
      maakFoto('images/julie.jpg', ['capri-hand-chain-helder-gold-plated', 'golden-hour-ketting-helder-gold-plated']),
      maakFoto('images/julie-2.jpg', ['capri-hand-chain-helder-gold-plated', 'golden-hour-ketting-helder-gold-plated']),
      maakFoto('images/julie-3.jpg', ['capri-hand-chain-helder-gold-plated', 'golden-hour-ketting-helder-gold-plated']),
    ],
  };

  // Volgorde: placeholders links, dan Sophia, dan Elisha, dan Ella en Dakota
  // rechts — zo begint de carrousel met Sophia in het midden, precies zoals
  // op de homepage. SOPHIA_INDEX wordt via indexOf opgezocht i.p.v. berekend
  // vanaf de lengte, zodat het blijft kloppen ongeacht hoeveel mensen er na
  // Sophia in de array staan.
  const STL_DATA = [sophiaData, elishaData, ellaData, dakotaData, julieData];
  const SOPHIA_INDEX = STL_DATA.indexOf(sophiaData);

  let stlActiefInfluencer = 0;
  let stlActiefFoto = 0;

  // De lijst wordt 3x achter elkaar herhaald zodat er altijd genoeg buffer
  // is om in beide richtingen te kunnen doorklikken. Zodra je de eerste of
  // laatste kopie nadert, springt de carrousel onzichtbaar (zonder animatie)
  // terug naar de middelste kopie — omdat de inhoud daar identiek is, merk
  // je dat spronggetje nooit. Zo voelt de carrousel echt oneindig aan.
  const STL_HERHALINGEN = 3;
  const STL_RENDER_ITEMS = Array(STL_HERHALINGEN).fill(STL_DATA).flat();
  let stlRenderIndex = STL_DATA.length + SOPHIA_INDEX; // start bij Sophia, in de middelste kopie

  function renderCarrousel() {
    const carrousel = document.getElementById('stlCarrousel');
    if (!carrousel) return;

    carrousel.innerHTML = STL_RENDER_ITEMS.map((item, renderI) => `
      <div class="stl__item" data-render-index="${renderI}" data-index="${renderI % STL_DATA.length}">
        <div class="stl__item-foto">
          ${item.fotos[0]?.src
            ? `<img src="${item.fotos[0].src}" alt="${item.naam}" />`
            : `<div class="stl__foto-placeholder"></div>`
          }
          <div class="stl__item-label">
            <span>${item.naam}</span>
            <span class="stl__item-icon">+</span>
          </div>
        </div>
      </div>
    `).join('');

    carrousel.querySelectorAll('.stl__item').forEach(item => {
      item.addEventListener('click', () => {
        stlActiefInfluencer = parseInt(item.dataset.index);
        stlActiefFoto = 0;
        openSTLOverlay();
      });
    });

    stlWerkActieveClassenBij();
    stlCentreerCarrousel(true);

    // Vangnet: soms is de layout (lettertype, afbeeldingen) nog niet volledig
    // gesetteld op het exacte moment van de eerste meting — na een frame nog
    // een keer herberekenen zorgt dat de startpositie altijd klopt.
    requestAnimationFrame(() => stlCentreerCarrousel(true));
  }

  function stlWerkActieveClassenBij() {
    document.querySelectorAll('.stl__item').forEach(item => {
      const renderI = parseInt(item.dataset.renderIndex);
      item.classList.toggle('stl__item--actief', renderI === stlRenderIndex);
    });
  }

  function stlCentreerCarrousel(instant) {
    const carrousel = document.getElementById('stlCarrousel');
    const wrapper = document.querySelector('.stl__carrousel-wrapper');
    if (!carrousel || !wrapper) return;

    const actiefItem = carrousel.querySelector(`[data-render-index="${stlRenderIndex}"]`) || carrousel.querySelector('.stl__item');
    if (!actiefItem) return;

    // offsetLeft/offsetWidth geven de echte layout-positie van het actieve
    // item, ongeacht of items allemaal dezelfde breedte hebben — nodig nu
    // het actieve item breder is dan de rest.
    const itemMidden = actiefItem.offsetLeft + actiefItem.offsetWidth / 2;
    const paddingLinks = parseFloat(getComputedStyle(wrapper).paddingLeft) || 0;
    const targetX = (wrapper.offsetWidth / 2) - paddingLinks - itemMidden;

    carrousel.style.transition = instant ? 'none' : 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    carrousel.style.transform = `translateX(${targetX}px)`;
    if (instant) carrousel.offsetHeight; // forceer reflow zodat 'transition: none' echt toegepast wordt
  }

  // Zodra de actieve positie de eerste of laatste kopie van de lijst
  // bereikt, onzichtbaar terugspringen naar de equivalente plek in de
  // middelste kopie — na afloop van de schuifanimatie, zodat je er niets
  // van merkt.
  function stlHerpositioneerIndienNodig() {
    const totaal = STL_DATA.length;
    if (stlRenderIndex < totaal * 0.5) {
      stlRenderIndex += totaal;
      stlCentreerCarrousel(true);
    } else if (stlRenderIndex >= totaal * 2.5) {
      stlRenderIndex -= totaal;
      stlCentreerCarrousel(true);
    }
  }

  const STL_OVERGANG_DUUR = 560; // ms — moet gelijk zijn aan de CSS-transitieduur

  function stlNaarPositie(deltaIndex) {
    stlRenderIndex += deltaIndex;

    // Fase 1: eerst alleen schuiven — de groottes blijven nog zoals ze waren,
    // dus het item waar je vandaan komt blijft groot terwijl het wegschuift.
    stlCentreerCarrousel(false);

    setTimeout(() => {
      // Fase 2: nu pas de nieuwe middelste laten groeien (en de vorige weer
      // terug naar klein), en tegelijk opnieuw centreren zodat het groeiende
      // item mooi in het midden blijft staan terwijl het groter wordt.
      stlWerkActieveClassenBij();
      stlCentreerCarrousel(false);

      setTimeout(stlHerpositioneerIndienNodig, STL_OVERGANG_DUUR);
    }, STL_OVERGANG_DUUR);
  }

  document.getElementById('stlCarrouselVolgende')?.addEventListener('click', () => stlNaarPositie(1));
  document.getElementById('stlCarrouselVorige')?.addEventListener('click', () => stlNaarPositie(-1));

  window.addEventListener('resize', () => stlCentreerCarrousel(true));

  function renderSTLOverlay() {
    const data = STL_DATA[stlActiefInfluencer];
    const huidigeFoto = data.fotos[stlActiefFoto];

    const fotoEl = document.getElementById('stlOverlayFoto');
    if (fotoEl) {
      fotoEl.innerHTML = huidigeFoto?.src
        ? `<img src="${huidigeFoto.src}" alt="${data.naam}" />`
        : `<div class="stl__foto-placeholder"></div>`;
    }

    const naamEl = document.getElementById('stlOverlayNaam');
    if (naamEl) naamEl.textContent = data.naam;

    const bulletsEl = document.getElementById('stlOverlayBullets');
    if (bulletsEl) {
      bulletsEl.innerHTML = data.fotos.map((_, i) => `
        <span class="stl__bullet ${i === stlActiefFoto ? 'stl__bullet--actief' : ''}" data-foto="${i}"></span>
      `).join('');

      bulletsEl.querySelectorAll('.stl__bullet').forEach(b => {
        b.addEventListener('click', () => {
          stlActiefFoto = parseInt(b.dataset.foto);
          renderSTLOverlay();
        });
      });
    }

    const pijlLinks = document.getElementById('stlOverlayVorige');
    const pijlRechts = document.getElementById('stlOverlayVolgende');
    if (pijlLinks) pijlLinks.style.display = data.fotos.length > 1 ? 'flex' : 'none';
    if (pijlRechts) pijlRechts.style.display = data.fotos.length > 1 ? 'flex' : 'none';

    const productenEl = document.getElementById('stlProducten');
    if (productenEl) {
      const producten = huidigeFoto?.producten || [];
      productenEl.innerHTML = producten.length > 0
        ? producten.map(p => `
          <div class="stl__product">
            <div class="stl__product-img">
              ${p.image ? `<img src="${p.image}" alt="${p.naam}" />` : ''}
            </div>
            <div>
              <p class="stl__product-naam">${p.naam}</p>
              <p class="stl__product-prijs">€ ${formatPrijs(p.prijs)}</p>
            </div>
            <a href="product.html?handle=${p.handle}" class="stl__product-btn">SHOP</a>
          </div>
        `).join('')
        : `<p class="stl__product-leeg">Dit sieraad is binnenkort te shoppen.</p>`;
    }
  }

  let stlProductScrollY = 0;

  document.addEventListener('scroll', (e) => {
    if (e.target.closest && e.target.closest('.stl-overlay')) {
      document.getElementById('stlOverlaySwipeHint')?.classList.add('is-verborgen');
    }
  }, { capture: true, passive: true });

  function openSTLOverlay() {
    renderSTLOverlay();
    document.getElementById('stlOverlay')?.classList.add('is-open');
    document.getElementById('stlBackdrop')?.classList.add('is-open');
    document.getElementById('stlOverlaySwipeHint')?.classList.remove('is-verborgen');
    // position: fixed i.p.v. overflow: hidden — overflow: hidden (ook
    // tijdelijk) breekt position: sticky permanent in Safari/iOS.
    stlProductScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${stlProductScrollY}px`;
    document.body.style.width = '100%';
  }

  function sluitSTLOverlay() {
    document.getElementById('stlOverlay')?.classList.remove('is-open');
    document.getElementById('stlBackdrop')?.classList.remove('is-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: stlProductScrollY, behavior: 'instant' });
  }

  document.getElementById('stlOverlayVolgende')?.addEventListener('click', () => {
    const data = STL_DATA[stlActiefInfluencer];
    stlActiefFoto = (stlActiefFoto + 1) % data.fotos.length;
    renderSTLOverlay();
  });

  document.getElementById('stlOverlayVorige')?.addEventListener('click', () => {
    const data = STL_DATA[stlActiefInfluencer];
    stlActiefFoto = (stlActiefFoto - 1 + data.fotos.length) % data.fotos.length;
    renderSTLOverlay();
  });

  document.getElementById('stlVolgendInfluencer')?.addEventListener('click', () => {
    stlActiefInfluencer = (stlActiefInfluencer + 1) % STL_DATA.length;
    stlActiefFoto = 0;
    renderSTLOverlay();
  });

  document.getElementById('stlVorigeInfluencer')?.addEventListener('click', () => {
    stlActiefInfluencer = (stlActiefInfluencer - 1 + STL_DATA.length) % STL_DATA.length;
    stlActiefFoto = 0;
    renderSTLOverlay();
  });

  document.getElementById('stlSluit')?.addEventListener('click', sluitSTLOverlay);
  document.getElementById('stlBackdrop')?.addEventListener('click', sluitSTLOverlay);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      sluitTiktokOverlay();
      sluitSTLOverlay();
    }
  });

  renderCarrousel();
})();

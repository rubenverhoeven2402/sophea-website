(async function () {
  renderFeaturedSkeletons();
  const MIN_SKELETON_MS = 400;
  const [PRODUCTS] = await Promise.all([
    window.sopheaProductsPromise,
    new Promise(resolve => setTimeout(resolve, MIN_SKELETON_MS)),
  ]);

  function renderFeaturedSkeletons(aantal = 4) {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: aantal }).map(() => `
      <div class="product-card product-card--skeleton">
        <div class="product-card__img-wrap skeleton-shimmer"></div>
      </div>
    `).join('');
  }

  function formatPrijs(bedrag) {
    return Number(bedrag).toFixed(2).replace('.', ',');
  }

  function telKleuren(product) {
    if (!product.model) return null;
    const groep = PRODUCTS.filter(p => p.model === product.model && p.categorie === product.categorie);
    return groep.length > 1 ? groep.length : null;
  }

  // FEATURED GRID (bovenaan homepage, "DE COLLECTIE")
  // Herbruikbare productkaart-HTML — gebruikt door zowel de featured grid
  // (bovenaan) als de nieuwe bestsellers-grid, zodat ze er identiek uitzien.
  function productKaartHTML(p) {
    const hoofdfoto = p.images?.[0] || p.image;
    const hoverfoto = p.images?.[1];
    const kleurenAantal = telKleuren(p);
    const badgeLabels = { nieuw: 'nieuw', bestseller: 'bestseller', 'laatste-items': 'laatste items' };
    const badgeHTML = p.badges && p.badges.length
      ? `<div class="product-card__badges">${[...p.badges].sort((a, b) => (badgeLabels[b] || b).length - (badgeLabels[a] || a).length).map(b => `<span class="product-card__badge product-card__badge--${b}">${badgeLabels[b] || b}</span>`).join('')}</div>`
      : '';
    const prijsHTML = p.beschikbaar === false
      ? `<span class="product-card__prijs product-card__prijs--uitverkocht">Uitverkocht</span>`
      : `<span class="product-card__prijs">€ ${formatPrijs(p.prijs)}</span>`;
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
          ${badgeHTML}
          <button class="product-card__hart" data-handle="${p.handle}" aria-label="Aan wishlist toevoegen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.1 1.8 6.6 4.7 5.2c2.2-1.05 4.6-.2 5.9 1.5l1.4 1.8 1.4-1.8c1.3-1.7 3.7-2.55 5.9-1.5 2.9 1.4 3.7 4.9 2 7.7C18.7 16.65 12 21 12 21z"/>
              </svg>
          </button>
        </div>
        <div class="product-card__body">
          <span class="product-card__naam">${p.naam}</span>
          ${prijsHTML}
          ${kleurenAantal ? `<span class="product-card__kleuren">${kleurenAantal} kleuren</span>` : ''}
        </div>
      </a>
    `;
  }

  function renderFeaturedGrid() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    // Alleen hand chains in deze sectie — anders kan een bestseller uit een
    // andere categorie (bv. oorbellen) hier per ongeluk tussen komen staan.
    const handChains = PRODUCTS.filter(p => p.categorie === 'handchains');

    // Vaste volgorde: eerst de bestseller, dan turquoise, roze, blauw (niet navy)
    const bestseller = handChains.find(p => p.badge === 'bestseller');
    const turquoise = handChains.find(p => p.kleur === 'turquoise');
    const roze = handChains.find(p => p.kleur === 'roze');
    const blauw = handChains.find(p => p.kleur === 'blauw');

    let featured = [bestseller, turquoise, roze, blauw].filter(Boolean);

    // Vul aan met overige hand chains als er (nog) minder dan 4 matches zijn
    if (featured.length < 4) {
      const restProducten = handChains.filter(p => !featured.includes(p));
      featured = featured.concat(restProducten.slice(0, 4 - featured.length));
    }
    grid.innerHTML = featured.map(productKaartHTML).join('');
    sopheaWishlistKnoppenBinden(grid);
  }
  renderFeaturedGrid();

  // BESTSELLERS GRID (tussen de sfeerbanners en de categorieën)
  function renderBestsellersGrid() {
    const grid = document.getElementById('bestsellersGrid');
    if (!grid) return;

    const bestsellers = PRODUCTS.filter(p => p.badges && p.badges.includes('bestseller')).slice(0, 4);
    grid.innerHTML = bestsellers.map(productKaartHTML).join('');
    sopheaWishlistKnoppenBinden(grid);
  }
  renderBestsellersGrid();

  // SHOP THE LOOK DATA (producten dynamisch, foto's/influencers blijven placeholder)
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
      maakFoto('images/ella-2.jpg', [
        'golden-hour-x-hand-chain-set-turquoise-gold-plated',
        'golden-hour-ketting-turquoise-gold-plated',
        'golden-hour-oorbellen-turquoise-gold-plated',
      ]),

      maakFoto('images/ella.jpg', [
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
  // rechts. Omdat de carrousel circulair is (rondloopt), kom je bij vaak
  // naar links klikken via de placeholders uiteindelijk gewoon weer bij de
  // rest uit. SOPHIA_INDEX wordt via indexOf opgezocht i.p.v. berekend
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
  const HERHALINGEN = 3;
  const RENDER_ITEMS = Array(HERHALINGEN).fill(STL_DATA).flat();
  let stlRenderIndex = STL_DATA.length + SOPHIA_INDEX; // start in de middelste kopie

  function renderCarrousel() {
    const carrousel = document.getElementById('stlCarrousel');
    if (!carrousel) return;

    carrousel.innerHTML = RENDER_ITEMS.map((item, renderI) => `
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
        openOverlay();
      });
    });

    werkActieveClassenBij();
    centreerCarrousel(true);

    // Vangnet: soms is de layout (lettertype, afbeeldingen) nog niet volledig
    // gesetteld op het exacte moment van de eerste meting — na een frame nog
    // een keer herberekenen zorgt dat de startpositie altijd klopt.
    requestAnimationFrame(() => centreerCarrousel(true));
  }

  function werkActieveClassenBij() {
    document.querySelectorAll('.stl__item').forEach(item => {
      const renderI = parseInt(item.dataset.renderIndex);
      item.classList.toggle('stl__item--actief', renderI === stlRenderIndex);
    });
  }

  function centreerCarrousel(instant) {
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
  function herpositioneerIndienNodig() {
    const totaal = STL_DATA.length;
    if (stlRenderIndex < totaal * 0.5) {
      stlRenderIndex += totaal;
      centreerCarrousel(true);
    } else if (stlRenderIndex >= totaal * 2.5) {
      stlRenderIndex -= totaal;
      centreerCarrousel(true);
    }
  }

  const OVERGANG_DUUR = 560; // ms — moet gelijk zijn aan de CSS-transitieduur

  function naarPositie(deltaIndex) {
    stlRenderIndex += deltaIndex;

    // Fase 1: eerst alleen schuiven — de groottes blijven nog zoals ze waren,
    // dus het item waar je vandaan komt blijft groot terwijl het wegschuift.
    centreerCarrousel(false);

    setTimeout(() => {
      // Fase 2: nu pas de nieuwe middelste laten groeien (en de vorige weer
      // terug naar klein), en tegelijk opnieuw centreren zodat het groeiende
      // item mooi in het midden blijft staan terwijl het groter wordt.
      werkActieveClassenBij();
      centreerCarrousel(false);

      setTimeout(herpositioneerIndienNodig, OVERGANG_DUUR);
    }, OVERGANG_DUUR);
  }

  document.getElementById('stlCarrouselVolgende')?.addEventListener('click', () => naarPositie(1));
  document.getElementById('stlCarrouselVorige')?.addEventListener('click', () => naarPositie(-1));

  window.addEventListener('resize', () => centreerCarrousel(true));

  function renderOverlay() {
    const data = STL_DATA[stlActiefInfluencer];
    const huidigeFoto = data.fotos[stlActiefFoto];

    const fotoEl = document.getElementById('stlOverlayFoto');
    fotoEl.innerHTML = huidigeFoto?.src
      ? `<img src="${huidigeFoto.src}" alt="${data.naam}" />`
      : `<div class="stl__foto-placeholder"></div>`;

    document.getElementById('stlOverlayNaam').textContent = data.naam;

    const bulletsEl = document.getElementById('stlOverlayBullets');
    bulletsEl.innerHTML = data.fotos.map((_, i) => `
      <span class="stl__bullet ${i === stlActiefFoto ? 'stl__bullet--actief' : ''}" data-foto="${i}"></span>
    `).join('');

    bulletsEl.querySelectorAll('.stl__bullet').forEach(b => {
      b.addEventListener('click', () => {
        stlActiefFoto = parseInt(b.dataset.foto);
        renderOverlay();
      });
    });

    const pijlLinks = document.getElementById('stlOverlayVorige');
    const pijlRechts = document.getElementById('stlOverlayVolgende');
    pijlLinks.style.display = data.fotos.length > 1 ? 'flex' : 'none';
    pijlRechts.style.display = data.fotos.length > 1 ? 'flex' : 'none';

    const producten = huidigeFoto?.producten || [];
    document.getElementById('stlProducten').innerHTML = producten.length > 0
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

  let stlScrollY = 0;
  let stlSwipeHintTimer = null;

  document.addEventListener('scroll', (e) => {
    if (e.target.closest && e.target.closest('.stl-overlay')) {
      clearTimeout(stlSwipeHintTimer);
      stlSwipeHintTimer = setTimeout(() => {
        document.getElementById('stlOverlaySwipeHint')?.classList.add('is-verborgen');
      }, 200);
    }
  }, { capture: true, passive: true });

  function openOverlay() {
    renderOverlay();
    document.getElementById('stlOverlay').classList.add('is-open');
    document.getElementById('stlBackdrop').classList.add('is-open');
    clearTimeout(stlSwipeHintTimer);
    document.getElementById('stlOverlaySwipeHint')?.classList.remove('is-verborgen');
    // position: fixed i.p.v. overflow: hidden — overflow: hidden (ook
    // tijdelijk) breekt position: sticky permanent in Safari/iOS.
    stlScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${stlScrollY}px`;
    document.body.style.width = '100%';
  }

  function sluitOverlay() {
    document.getElementById('stlOverlay').classList.remove('is-open');
    document.getElementById('stlBackdrop').classList.remove('is-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: stlScrollY, behavior: 'instant' });
  }

  document.getElementById('stlOverlayVolgende')?.addEventListener('click', () => {
    const data = STL_DATA[stlActiefInfluencer];
    stlActiefFoto = (stlActiefFoto + 1) % data.fotos.length;
    renderOverlay();
  });

  document.getElementById('stlOverlayVorige')?.addEventListener('click', () => {
    const data = STL_DATA[stlActiefInfluencer];
    stlActiefFoto = (stlActiefFoto - 1 + data.fotos.length) % data.fotos.length;
    renderOverlay();
  });

  document.getElementById('stlVolgendInfluencer')?.addEventListener('click', () => {
    stlActiefInfluencer = (stlActiefInfluencer + 1) % STL_DATA.length;
    stlActiefFoto = 0;
    renderOverlay();
  });

  document.getElementById('stlVorigeInfluencer')?.addEventListener('click', () => {
    stlActiefInfluencer = (stlActiefInfluencer - 1 + STL_DATA.length) % STL_DATA.length;
    stlActiefFoto = 0;
    renderOverlay();
  });

  document.getElementById('stlSluit')?.addEventListener('click', sluitOverlay);
  document.getElementById('stlBackdrop')?.addEventListener('click', sluitOverlay);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') sluitOverlay();
  });

  renderCarrousel();

  // USP-BALK — mobiele swipe-carrousel met dot-indicator (zoals bij Franky).
  // Begint altijd met de eerste (linker) kaart actief, en de bolletjes
  // volgen automatisch mee met wat je aan het swipen bent; klikken op een
  // bolletje scrollt naar die kaart.
  const uspBar = document.querySelector('.usp-bar');
  const uspDots = document.querySelectorAll('.usp-bar__dot');
  if (uspBar && uspDots.length) {
    uspDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const kaart = uspBar.children[i];
        if (kaart) kaart.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      });
    });

    let uspScrollTimer = null;
    uspBar.addEventListener('scroll', () => {
      clearTimeout(uspScrollTimer);
      uspScrollTimer = setTimeout(() => {
        const actieveIndex = Math.round(uspBar.scrollLeft / uspBar.clientWidth);
        uspDots.forEach((dot, i) => {
          dot.classList.toggle('usp-bar__dot--actief', i === actieveIndex);
        });
      }, 80);
    });
  }
})();

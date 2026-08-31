(async function () {
  window.sopheaLoadingBar?.start();
  renderSkeletons();

  const hero = document.querySelector('.collectie-hero');
  hero?.classList.add('collectie-hero--laden');

  // categorieVast/collectieVast: gezet als de pagina een vaste context heeft
  // via de URL (bv. ?categorie=oorbellen of ?collectie=golden-hour). In dat
  // geval wordt de bijbehorende filtergroep verborgen (die keuze ligt al vast),
  // maar de kleur/collectie-opties worden nog steeds correct geschat op basis
  // van alleen de producten die binnen die vaste context vallen.
  let filters = { categorieen: [], kleuren: [], prijsMin: 0, prijsMax: null, collecties: [], collectiesAlle: [], badge: null };
  let categorieVast = null;
  let collectieVast = null;
  let actiefSort = 'aanbevolen';
  const PRODUCTEN_PER_PAGINA = 48; // 12 rijen van 4 producten
  let huidigePagina = 1;

  const params = new URLSearchParams(window.location.search);
  // Zelfde alias als in shopify.js: zodat ?categorie=sets in de URL ook
  // gewoon werkt, naast ?categorie=combi.
  const CATEGORIE_ALIASSEN_URL = { sets: 'combi', set: 'combi' };
  const urlCategorieRaw = params.get('categorie');
  const urlCategorie = urlCategorieRaw
    ? (CATEGORIE_ALIASSEN_URL[urlCategorieRaw.toLowerCase()] || urlCategorieRaw.toLowerCase())
    : null;
  const urlMateriaal = params.get('materiaal');
  const urlCollectie = params.get('collectie');

  const mooieNaam = (slug) => slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const titels = {
    'handchains': 'Hand chains', 'kettingen': 'Kettingen',
    'oorbellen': 'Oorbellen', 'ringen': 'Ringen',
    'combi': 'Sets', 'nieuw': 'Nieuw',
    'bestsellers': 'Bestsellers',
  };

  const heroAfbeeldingen = {
    'all': 'images/alles-hero.jpg',
    'handchains': 'images/hero-handchains.png',
    'kettingen': 'images/kettingen-hero.jpg',
    'oorbellen': 'images/oorbellen-hero.png',
    'combi': 'images/sets-hero.jpg',
    'nieuw': 'images/alles-hero.jpg',
    'bestsellers': 'images/bestsellers-hero.jpg',
    'côte,capri': 'images/hero-handchains.png',
    'capri,côte': 'images/hero-handchains.png',
    'côte': 'images/handchain-hero.jpg',
    'capri': 'images/capri-hero.png',
    'azure': 'images/oorbellen-hero.png',
    'soleil': 'images/kettingen-hero.jpg',
  };

  // Standaard wordt een hero-foto gecentreerd getoond (background-position:
  // center, zie collectie.css). Voor foto's waar het belangrijkste element
  // (zoals de chain zelf) lager in beeld staat, kan hier per sleutel een
  // eigen positie worden opgegeven om dat stuk beter zichtbaar te maken.
  const heroPosities = {
    'handchains': 'center 60%',
    'côte,capri': 'center 60%',
    'capri,côte': 'center 60%',
    'capri': 'center 70%', 
    'côte': 'center 67%', 
    'all': 'center 80%',
    'nieuw': 'center 80%',
    'bestsellers': 'center 65%',
    'soleil': 'center 80%',
    'kettingen': 'center 80%',
    'combi': 'center 65%',
  };

  function zetHeroAfbeelding(key) {
    const pad = heroAfbeeldingen[key] || heroAfbeeldingen['all'];
    if (hero) {
      hero.style.backgroundImage = `url('${pad}')`;
      hero.style.backgroundPosition = heroPosities[key] || 'center';
    }
  }

  // Hero-titel en -foto meteen instellen (zitten al klaar achter de shimmer-overlay)
  // "Nieuw" en "Bestsellers" zijn geen categorie:-tags, maar badge:-tags —
  // die filteren we dus apart, vóórdat we de generieke categorie-aftakking
  // proberen (anders zou 'nieuw'/'bestsellers' daar per ongeluk ook in
  // terechtkomen, aangezien titels[] voor allebei ook een label heeft).
  const BADGE_ALIASSEN_URL = { nieuw: 'nieuw', bestsellers: 'bestseller' };

  if (urlCategorie && BADGE_ALIASSEN_URL[urlCategorie]) {
    document.querySelector('.collectie-hero__title').textContent = titels[urlCategorie];
    document.title = `${titels[urlCategorie]} - SOPHÉA`;
    filters.badge = BADGE_ALIASSEN_URL[urlCategorie];
    zetHeroAfbeelding(urlCategorie);
  } else if (urlCategorie && titels[urlCategorie]) {
    document.querySelector('.collectie-hero__title').textContent = titels[urlCategorie];
    document.title = `${titels[urlCategorie]} - SOPHÉA`;
    categorieVast = urlCategorie;
    filters.categorieen = [urlCategorie];
    zetHeroAfbeelding(urlCategorie);
    const catGroep = document.getElementById('filterCategorieGroep');
    if (catGroep) catGroep.style.display = 'none';
  } else if (urlMateriaal && titels[urlMateriaal]) {
    document.querySelector('.collectie-hero__title').textContent = titels[urlMateriaal];
    document.title = `${titels[urlMateriaal]} - SOPHÉA`;
    zetHeroAfbeelding(urlMateriaal);
  } else if (urlCollectie && urlCollectie.includes(',')) {
    // Generieke gecombineerde collectiepagina: werkt voor ELKE combinatie van
    // collectie-tags, niet alleen Côte x Capri. Een product moet ALLE
    // opgegeven collecties hebben (AND) om hier te verschijnen — dus alleen
    // de echte combi-producten, niet alle losse producten van elke collectie
    // apart. De titel wordt automatisch opgebouwd uit de tag-namen zelf.
    const tags = urlCollectie.split(',').map(t => t.trim()).filter(Boolean);
    const titel = tags.map(mooieNaam).join(' x ');
    document.querySelector('.collectie-hero__title').textContent = titel;
    document.title = `${titel} - SOPHÉA`;
    collectieVast = urlCollectie;
    filters.collectiesAlle = tags;
    // Genormaliseerde sleutel (gesorteerd, kleine letters) — zo maakt de
    // volgorde in de URL niet uit voor het vinden van de juiste hero-foto.
    zetHeroAfbeelding([...tags].map(t => t.toLowerCase()).sort().join(','));
  } else if (urlCollectie) {
    const naam = mooieNaam(urlCollectie);
    document.querySelector('.collectie-hero__title').textContent = naam;
    document.title = `${naam} - SOPHÉA`;
    collectieVast = urlCollectie;
    filters.collecties = [urlCollectie];
    zetHeroAfbeelding(urlCollectie);
  } else {
    document.querySelector('.collectie-hero__title').textContent = 'Alles';
    document.title = 'Collectie - SOPHÉA';
    zetHeroAfbeelding('all');
  }

  const MIN_SKELETON_MS = 1000;
  const [PRODUCTS] = await Promise.all([
    window.sopheaProductsPromise,
    new Promise(resolve => setTimeout(resolve, MIN_SKELETON_MS)),
  ]);

  // Hoogste productprijs, afgerond naar boven op een rond getal — gebruikt
  // als maximum van de prijsslider, zodat die zich automatisch aanpast aan
  // je assortiment i.p.v. een vast bedrag dat kan gaan afwijken.
  const maxProductPrijs = Math.max(10, Math.ceil(Math.max(...PRODUCTS.map(p => p.prijs), 0) / 10) * 10);
  filters.prijsMax = maxProductPrijs;

  hero?.classList.remove('collectie-hero--laden');
  window.sopheaLoadingBar?.done();

  function renderSkeletons(aantal = 6) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: aantal }).map(() => `
      <div class="product-card product-card--skeleton">
        <div class="product-card__img-wrap skeleton-shimmer"></div>
      </div>
    `).join('');
  }

  function telKleuren(product) {
      if (!product.model) return null;
      const groep = PRODUCTS.filter(p => p.model === product.model && p.categorie === product.categorie);
      return groep.length > 1 ? groep.length : null;
  }

  function gefilterd() {
      let lijst = [...PRODUCTS];

      if (filters.badge) {
        lijst = lijst.filter(p => p.badges && p.badges.includes(filters.badge));
      }
      if (filters.categorieen.length > 0) {
        lijst = lijst.filter(p => p.categorieen.some(c => filters.categorieen.includes(c)));
      }
      if (filters.collecties.length > 0) {
        lijst = lijst.filter(p => p.collecties.some(c => filters.collecties.includes(c)));
      }
      if (filters.collectiesAlle.length > 0) {
        lijst = lijst.filter(p => filters.collectiesAlle.every(c => p.collecties.includes(c)));
      }
      if (filters.kleuren.length > 0) {
        lijst = lijst.filter(p => filters.kleuren.includes(p.kleurGroep));
      }
      if (filters.prijsMax !== null && (filters.prijsMin > 0 || filters.prijsMax < maxProductPrijs)) {
        lijst = lijst.filter(p => p.prijs >= filters.prijsMin && p.prijs <= filters.prijsMax);
      }

      // Aanbevolen (standaard): bestsellers eerst, dan 'nieuw'-gelabelde
      // producten, dan de rest — binnen elke groep een lichte shuffle zodat
      // het niet elke keer identiek statisch aanvoelt, maar bestsellers wel
      // altijd bovenaan blijven staan.
      if (actiefSort === 'aanbevolen') {
        const shuffle = (arr) => {
          const kopie = [...arr];
          for (let i = kopie.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
          }
          return kopie;
        };
        const isBestseller = (p) => p.badges && p.badges.includes('bestseller');
        const isNieuw = (p) => p.badges && p.badges.includes('nieuw');
        const sorteerGroep = (groep) => {
          const bestsellers = groep.filter(isBestseller);
          const nieuw = groep.filter(p => isNieuw(p) && !isBestseller(p));
          const rest = groep.filter(p => !isBestseller(p) && !isNieuw(p));
          return [...shuffle(bestsellers), ...shuffle(nieuw), ...shuffle(rest)];
        };

        // Op een losse collectiepagina (bv. alleen Côte, of alleen Capri —
        // niet de gecombineerde Côte x Capri-pagina zelf) horen de "pure"
        // producten van die collectie boven de combi-producten (die ook een
        // andere collectie-tag hebben) te staan.
        if (collectieVast && !collectieVast.includes(',')) {
          const puur = lijst.filter(p => p.collecties.length <= 1);
          const combi = lijst.filter(p => p.collecties.length > 1);
          lijst = [...sorteerGroep(puur), ...sorteerGroep(combi)];
        } else {
          lijst = sorteerGroep(lijst);
        }
      }
      if (actiefSort === 'nieuwst') lijst.sort((a, b) => b.volgorde - a.volgorde);
      if (actiefSort === 'oudst') lijst.sort((a, b) => a.volgorde - b.volgorde);
      if (actiefSort === 'prijs-laag') lijst.sort((a, b) => a.prijs - b.prijs);
      if (actiefSort === 'prijs-hoog') lijst.sort((a, b) => b.prijs - a.prijs);
      if (actiefSort === 'az') lijst.sort((a, b) => a.naam.localeCompare(b.naam));
      if (actiefSort === 'za') lijst.sort((a, b) => b.naam.localeCompare(a.naam));

    return lijst;
  }

  function formatPrijs(bedrag) {
    return Number(bedrag).toFixed(2).replace('.', ',');
  }

  function renderCard(product) {
    const badgeLabels = { nieuw: 'nieuw', bestseller: 'bestseller', 'laatste-items': 'laatste items' };
    const badgeHTML = product.badges && product.badges.length
      ? `<div class="product-card__badges">${[...product.badges].sort((a, b) => (badgeLabels[b] || b).length - (badgeLabels[a] || a).length).map(b => `<span class="product-card__badge product-card__badge--${b}">${badgeLabels[b] || b}</span>`).join('')}</div>`
      : '';
    const hoofdfoto = product.images?.[0] || product.image;
    const hoverfoto = product.images?.[1];
    const kleurenAantal = telKleuren(product);
    const prijsHTML = product.beschikbaar === false
      ? `<span class="product-card__prijs product-card__prijs--uitverkocht">Uitverkocht</span>`
      : `<span class="product-card__prijs">€ ${formatPrijs(product.prijs)}</span>`;

    const fotoHTML = hoofdfoto
      ? `<img class="product-card__img-main" src="${hoofdfoto}" alt="${product.naam}" />`
      : `<div class="product-card__foto-placeholder">FOTO</div>`;

    const hoverHTML = hoverfoto
      ? `<img class="product-card__img-hover" src="${hoverfoto}" alt="${product.naam}" />`
      : '';

    return `
      <a href="product.html?handle=${product.handle}" class="product-card">
        <div class="product-card__img-wrap">
          ${fotoHTML}
          ${hoverHTML}
          ${badgeHTML}
          <button class="product-card__hart" data-handle="${product.handle}" aria-label="Aan wishlist toevoegen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.1 1.8 6.6 4.7 5.2c2.2-1.05 4.6-.2 5.9 1.5l1.4 1.8 1.4-1.8c1.3-1.7 3.7-2.55 5.9-1.5 2.9 1.4 3.7 4.9 2 7.7C18.7 16.65 12 21 12 21z"/>
            </svg>
          </button>
        </div>
        <div class="product-card__body">
          <span class="product-card__naam">${product.naam}</span>
          ${prijsHTML}
          ${kleurenAantal ? `<span class="product-card__kleuren">${kleurenAantal} kleuren</span>` : ''}
        </div>
      </a>
    `;
  }

  let eersteRenderGrid = true;

  function renderGrid() {
    // Bij de allereerste render is de balk al gekoppeld aan het laden van de
    // productdata zelf (zie hero-loading hierboven) — die render gebeurt dus
    // meteen, zonder extra kunstmatige vertraging. Bij elke render daarna
    // (filteren, sorteren, pagina wisselen) wachten we bewust tot de balk
    // écht vol is voordat de producten zelf verversen — zo voelt het alsof
    // de balk het laden aanstuurt, in plaats van dat de content al verandert
    // terwijl de balk nog aan het vullen is.
    if (!eersteRenderGrid) {
      window.sopheaLoadingBar?.start();
      setTimeout(() => {
        werkGridBij();
        window.sopheaLoadingBar?.done();
      }, 700);
      return;
    }
    eersteRenderGrid = false;
    werkGridBij();
  }

  function werkGridBij() {
    const grid = document.getElementById('productGrid');
    const lijst = gefilterd();

    if (lijst.length === 0) {
      grid.innerHTML = `<p class="grid-leeg">Er zijn geen producten gevonden voor deze prijs.</p>`;
      renderPaginering(1);
      return;
    }

    const totaalPaginas = Math.max(1, Math.ceil(lijst.length / PRODUCTEN_PER_PAGINA));
    if (huidigePagina > totaalPaginas) huidigePagina = totaalPaginas;

    const start = (huidigePagina - 1) * PRODUCTEN_PER_PAGINA;
    const paginaItems = lijst.slice(start, start + PRODUCTEN_PER_PAGINA);

    grid.innerHTML = paginaItems.map(renderCard).join('');
    sopheaWishlistKnoppenBinden(grid);
    renderPaginering(totaalPaginas);
  }

  function renderPaginering(totaalPaginas) {
    const wrap = document.getElementById('paginering');
    if (!wrap) return;

    if (totaalPaginas <= 1) {
      wrap.innerHTML = '';
      return;
    }

    const paginaKnoppen = Array.from({ length: totaalPaginas }, (_, i) => i + 1).map(p => `
      <button class="paginering__pagina ${p === huidigePagina ? 'paginering__pagina--actief' : ''}" data-pagina="${p}">${p}</button>
    `).join('');

    const volgendeHTML = huidigePagina < totaalPaginas
      ? `<button class="paginering__volgende" id="paginaVolgende">Volgende</button>`
      : '';

    wrap.innerHTML = `${paginaKnoppen}${volgendeHTML}`;

    wrap.querySelectorAll('.paginering__pagina').forEach(btn => {
      btn.addEventListener('click', () => {
        huidigePagina = parseInt(btn.dataset.pagina, 10);
        renderGrid();
        document.querySelector('.grid-sectie')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    document.getElementById('paginaVolgende')?.addEventListener('click', () => {
      huidigePagina += 1;
      renderGrid();
      document.querySelector('.grid-sectie')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // FILTER OVERLAY
  const filterOverlay = document.getElementById('filterOverlay');
  const filterBackdrop = document.getElementById('filterBackdrop');
  let filterScrollY = 0;

  document.getElementById('filterOpenBtn').addEventListener('click', () => {
    filterOverlay.classList.add('is-open');
    filterBackdrop.classList.add('is-open');
    // position: fixed i.p.v. overflow: hidden — overflow: hidden (ook
    // tijdelijk) breekt position: sticky permanent in Safari/iOS.
    filterScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${filterScrollY}px`;
    document.body.style.width = '100%';
  });

  function sluitFilter() {
    filterOverlay.classList.remove('is-open');
    filterBackdrop.classList.remove('is-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, filterScrollY);
  }

  document.getElementById('filterSluitBtn').addEventListener('click', sluitFilter);
  filterBackdrop.addEventListener('click', sluitFilter);

  // Kleur naar mooie gradient — zelfde stijl als op de productpagina.
  // Onbekende/nieuwe kleuren krijgen automatisch een neutrale gradient,
  // dus een nieuwe kleur:-tag in Shopify werkt altijd, ook zonder dat
  // hij hier expliciet gedefinieerd staat.
  function kleurGradient(kleur) {
    // Platte schijf i.p.v. bol: een diagonale kleurovergang, met daaroverheen
    // een schuine glanzende lichtstreep — zelfde stijl als op de productpagina.
    const basis = {
      navy: ['#3d5a8a', '#0d1b3d'],
      marineblauw: ['#3d5a8a', '#0d1b3d'],
      turquoise: ['#6fe0d0', '#0f8a78'],
      roze: ['#f7c3d3', '#c76080'],
      rose: ['#f7c3d3', '#c76080'],
      pink: ['#f7c3d3', '#c76080'],
      helder: ['#ffffff', '#d9ecec'],
      clear: ['#ffffff', '#d9ecec'],
      transparant: ['#ffffff', '#d9ecec'],
      kristal: ['#ffffff', '#e6e1d6'],
      crystal: ['#ffffff', '#e6e1d6'],
      blauw: ['#8fc4ef', '#3a72a8'],
      blue: ['#8fc4ef', '#3a72a8'],
      lichtblauw: ['#a8d4f0', '#4a90c2'],
      donkerblauw: ['#3d5a8a', '#0d1b3d'],
      champagne: ['#f5e6c8', '#c9a96e'],
      bordeaux: ['#a04060', '#4a0f22'],
      wijnrood: ['#a04060', '#4a0f22'],
      zwart: ['#4a4a4a', '#1a1a1a'],
      black: ['#4a4a4a', '#1a1a1a'],
      wit: ['#ffffff', '#e0d8d0'],
      white: ['#ffffff', '#e0d8d0'],
      rood: ['#e57373', '#8a1f1f'],
      red: ['#e57373', '#8a1f1f'],
      oranje: ['#ffb680', '#c9601a'],
      orange: ['#ffb680', '#c9601a'],
      geel: ['#fde68a', '#c9a227'],
      yellow: ['#fde68a', '#c9a227'],
      groen: ['#8fd4a8', '#2f7a4f'],
      green: ['#8fd4a8', '#2f7a4f'],
      mint: ['#a9e8d4', '#3fa98a'],
      mintgroen: ['#a9e8d4', '#3fa98a'],
      paars: ['#c9a8e0', '#6b3fa0'],
      purple: ['#c9a8e0', '#6b3fa0'],
      lila: ['#c9a8e0', '#6b3fa0'],
      bruin: ['#c9a374', '#6b4423'],
      brown: ['#c9a374', '#6b4423'],
      beige: ['#e8ddc8', '#b8a279'],
      grijs: ['#d4d4d4', '#7a7a7a'],
      gray: ['#d4d4d4', '#7a7a7a'],
      grey: ['#d4d4d4', '#7a7a7a'],
      goud: ['#f5e6c8', '#c9a96e'],
      gold: ['#f5e6c8', '#c9a96e'],
      zilver: ['#e8e8e8', '#a8a8a8'],
      silver: ['#e8e8e8', '#a8a8a8'],
      koper: ['#e0a87a', '#a85f2e'],
      copper: ['#e0a87a', '#a85f2e'],
      creme: ['#f7f2e0', '#e0d4b0'],
      ivoor: ['#f7f2e0', '#e0d4b0'],
      ivory: ['#f7f2e0', '#e0d4b0'],
      // Edelsteenkleuren
      smaragd: ['#6fcf97', '#0b6b3a'], emerald: ['#6fcf97', '#0b6b3a'],
      robijn: ['#e8768a', '#8a0f28'], ruby: ['#e8768a', '#8a0f28'],
      saffier: ['#5b8ce0', '#13337a'], sapphire: ['#5b8ce0', '#13337a'],
      amethist: ['#b48ee0', '#5a2d8a'], amethyst: ['#b48ee0', '#5a2d8a'],
      topaas: ['#f7d98a', '#c98a1a'], topaz: ['#f7d98a', '#c98a1a'],
      granaat: ['#9a3050', '#4a0f22'], garnet: ['#9a3050', '#4a0f22'],
      koraal: ['#ff9e80', '#e2492f'], coral: ['#ff9e80', '#e2492f'],
      parel: ['#fdf6ec', '#e3d9c8'], parelmoer: ['#fdf6ec', '#e3d9c8'], pearl: ['#fdf6ec', '#e3d9c8'],
      // Metaaltinten
      rosegoud: ['#f3c9c0', '#c88a76'], rosegold: ['#f3c9c0', '#c88a76'],
      platina: ['#eef0ee', '#b8bcbe'], platinum: ['#eef0ee', '#b8bcbe'],
      brons: ['#c98a4a', '#7a4a1e'], bronze: ['#c98a4a', '#7a4a1e'],
      messing: ['#d4b25a', '#9a7a28'], brass: ['#d4b25a', '#9a7a28'],
      chroom: ['#f0f2f2', '#c4c8ca'], chrome: ['#f0f2f2', '#c4c8ca'],
      antraciet: ['#7a7d80', '#3a3c3f'], anthracite: ['#7a7d80', '#3a3c3f'], gunmetal: ['#5a5f66', '#2a2d33'],
      // Blauwtinten
      kobalt: ['#3a5fcf', '#152a70'], cobalt: ['#3a5fcf', '#152a70'],
      marine: ['#3d5a8a', '#0d1b3d'], denim: ['#6f96c4', '#33517a'],
      hemelsblauw: ['#a8d4f0', '#4a90c2'], skyblue: ['#a8d4f0', '#4a90c2'],
      korenbloemblauw: ['#6f9ce0', '#2f5aa8'], cornflower: ['#6f9ce0', '#2f5aa8'],
      petrol: ['#3a8f92', '#0f4547'], petroleumblauw: ['#3a8f92', '#0f4547'],
      aqua: ['#8fe8dd', '#1a9e8f'], aquamarijn: ['#8fe8dd', '#1a9e8f'], aquamarine: ['#8fe8dd', '#1a9e8f'],
      // Roze/paarstinten
      fuchsia: ['#f060a0', '#a01060'], magenta: ['#f060a0', '#a01060'],
      lichtroze: ['#fbd7e2', '#e08fac'], donkerroze: ['#e8709a', '#a3355c'],
      lavendel: ['#d4c2f0', '#8a6bc9'], lavender: ['#d4c2f0', '#8a6bc9'],
      indigo: ['#5a4fa0', '#2a2260'], violet: ['#a875d1', '#5c2d8a'],
      // Groen/geel/oranje/bruintinten
      olijfgroen: ['#b7b56a', '#5f5d2e'], olijf: ['#b7b56a', '#5f5d2e'], olive: ['#b7b56a', '#5f5d2e'],
      lichtgroen: ['#bdeecb', '#5cad78'], donkergroen: ['#4d8f61', '#1f4d2c'],
      limoen: ['#d4ef7a', '#8fae1f'], lime: ['#d4ef7a', '#8fae1f'],
      kaki: ['#c3c08a', '#8a8756'], khaki: ['#c3c08a', '#8a8756'],
      okergeel: ['#e0b04a', '#a8721c'], oker: ['#e0b04a', '#a8721c'], ochre: ['#e0b04a', '#a8721c'],
      mosterd: ['#dcb64a', '#a3781a'], mustard: ['#dcb64a', '#a3781a'],
      honing: ['#f0c874', '#c9922a'], honey: ['#f0c874', '#c9922a'],
      terracotta: ['#d98a5e', '#a34a24'], camel: ['#d3a86a', '#8a5a28'], amber: ['#e0a04a', '#a3591a'],
      taupe: ['#c9b8a8', '#8a7460'],
      zalm: ['#ffab91', '#e2664a'], salmon: ['#ffab91', '#e2664a'],
      perzik: ['#ffd3b0', '#e8946a'], peach: ['#ffd3b0', '#e8946a'],
      abrikoos: ['#ffc98a', '#d98a2e'], apricot: ['#ffc98a', '#d98a2e'],
    };
    const [k1, k2] = basis[kleur.toLowerCase()] || ['#ccc', '#999'];
    return `
      linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.7) 48%, transparent 62%),
      linear-gradient(135deg, ${k1}, ${k2})
    `;
  }

  // Bepaalt welke producten relevant zijn om KLEUR-opties uit af te leiden:
  // gescoped op de actief gekozen categorieën én collecties (faceted filtering).
  function kleurContextProducten() {
    let lijst = [...PRODUCTS];
    if (filters.badge) lijst = lijst.filter(p => p.badges && p.badges.includes(filters.badge));
    if (filters.categorieen.length > 0) lijst = lijst.filter(p => p.categorieen.some(c => filters.categorieen.includes(c)));
    if (filters.collecties.length > 0) lijst = lijst.filter(p => p.collecties.some(c => filters.collecties.includes(c)));
    if (filters.collectiesAlle.length > 0) lijst = lijst.filter(p => filters.collectiesAlle.every(c => p.collecties.includes(c)));
    return lijst;
  }

  // Zelfde principe voor COLLECTIE-opties, maar dan gescoped op categorie
  // (niet op collectie zelf, anders zou je na 1 keuze alle andere opties kwijtraken).
  function collectieContextProducten() {
    let lijst = [...PRODUCTS];
    if (filters.badge) lijst = lijst.filter(p => p.badges && p.badges.includes(filters.badge));
    if (filters.categorieen.length > 0) lijst = lijst.filter(p => p.categorieen.some(c => filters.categorieen.includes(c)));
    return lijst;
  }

  function renderKleurFilters() {
    const wrap = document.getElementById('kleurFilterOpties');
    const groep = document.getElementById('kleurFilterGroep');
    if (!wrap) return;

    const kleuren = [...new Set(kleurContextProducten().map(p => p.kleurGroep).filter(Boolean))].sort();

    // Kleuren die niet meer voorkomen binnen de huidige categorie/collectie-keuze
    // automatisch uit de actieve selectie halen, zodat er nooit een "dode" filter
    // actief blijft staan.
    filters.kleuren = filters.kleuren.filter(k => kleuren.includes(k));

    if (groep) groep.style.display = kleuren.length > 0 ? '' : 'none';

    wrap.innerHTML = kleuren.map(k => `
      <button class="filter-optie ${filters.kleuren.includes(k) ? 'filter-optie--active' : ''}" data-type="kleur" data-filter="${k}">
        <span class="filter-checkbox"></span>
        <span class="kleur-dot" style="background: ${kleurGradient(k)};"></span>
        ${k.charAt(0).toUpperCase() + k.slice(1)}
      </button>
    `).join('');

    bindKleurListeners();
  }

  function bindKleurListeners() {
    document.querySelectorAll('.filter-optie[data-type="kleur"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const kleur = btn.dataset.filter;

        if (filters.kleuren.includes(kleur)) {
          filters.kleuren = filters.kleuren.filter(k => k !== kleur);
          btn.classList.remove('filter-optie--active');
        } else {
          filters.kleuren.push(kleur);
          btn.classList.add('filter-optie--active');
        }

        huidigePagina = 1;
        renderGrid();
      });
    });
  }

  function renderCollectieFilters() {
    const wrap = document.getElementById('collectieFilterOpties');
    const groep = document.getElementById('collectieFilterGroep');
    if (!wrap) return;

    // Op een pagina met vaste collectie (bv. ?collectie=golden-hour) is deze
    // groep niet relevant — die keuze ligt al vast via de URL.
    if (collectieVast) {
      if (groep) groep.style.display = 'none';
      return;
    }

    const collecties = [...new Set(collectieContextProducten().flatMap(p => p.collecties).filter(Boolean))].sort();

    filters.collecties = filters.collecties.filter(c => collecties.includes(c));

    // Geen enkel product met een collectie:-tag binnen deze context? Dan de
    // hele sectie verbergen i.p.v. een lege "Alles"-knop tonen.
    if (groep) groep.style.display = collecties.length > 0 ? '' : 'none';

    wrap.innerHTML = collecties.map(c => `
      <button class="filter-optie ${filters.collecties.includes(c) ? 'filter-optie--active' : ''}" data-type="collectie" data-filter="${c}">
        <span class="filter-checkbox"></span>
        ${mooieNaam(c)}
      </button>
    `).join('');

    bindCollectieListeners();
  }

  function bindCollectieListeners() {
    document.querySelectorAll('.filter-optie[data-type="collectie"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const collectie = btn.dataset.filter;

        if (filters.collecties.includes(collectie)) {
          filters.collecties = filters.collecties.filter(c => c !== collectie);
          btn.classList.remove('filter-optie--active');
        } else {
          filters.collecties.push(collectie);
          btn.classList.add('filter-optie--active');
        }

        // Collectiekeuze kan de beschikbare kleuren beïnvloeden
        renderKleurFilters();
        huidigePagina = 1;
        renderGrid();
      });
    });
  }

  // CATEGORIE FILTER — meervoudig (checkbox-gedrag), alleen relevant als de
  // pagina geen vaste categorie via de URL heeft (die groep is dan verborgen).
  function bindCategorieListeners() {
    document.querySelectorAll('.filter-optie[data-type="categorie"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const categorie = btn.dataset.filter;

        if (filters.categorieen.includes(categorie)) {
          filters.categorieen = filters.categorieen.filter(c => c !== categorie);
          btn.classList.remove('filter-optie--active');
        } else {
          filters.categorieen.push(categorie);
          btn.classList.add('filter-optie--active');
        }

        // Categoriekeuze kan de beschikbare kleuren én collecties beïnvloeden
        renderCollectieFilters();
        renderKleurFilters();
        huidigePagina = 1;
        renderGrid();
      });
    });
  }
  bindCategorieListeners();

  // PRIJS FILTER — dual-range slider (zoals bij de eerder gedeelde
  // referentieafbeelding), met de max automatisch op de hoogste productprijs.
  function initPrijsSlider() {
    const sliderMin = document.getElementById('prijsSliderMin');
    const sliderMax = document.getElementById('prijsSliderMax');
    const inputMin = document.getElementById('prijsInputMin');
    const inputMax = document.getElementById('prijsInputMax');
    const track = document.getElementById('prijsSliderTrackActief');
    if (!sliderMin || !sliderMax) return;

    [sliderMin, sliderMax].forEach(el => {
      el.min = 0;
      el.max = maxProductPrijs;
    });
    sliderMin.value = filters.prijsMin;
    sliderMax.value = filters.prijsMax;
    if (inputMin) inputMin.placeholder = String(filters.prijsMin);
    if (inputMax) inputMax.placeholder = String(filters.prijsMax);

    function werkTrackBij() {
      if (!track) return;
      const pctMin = (filters.prijsMin / maxProductPrijs) * 100;
      const pctMax = (filters.prijsMax / maxProductPrijs) * 100;
      track.style.left = `${pctMin}%`;
      track.style.right = `${100 - pctMax}%`;
    }

    function bijwerken() {
      // Handvatten mogen elkaar niet passeren — houd altijd min ≤ max aan.
      if (filters.prijsMin > filters.prijsMax) {
        [filters.prijsMin, filters.prijsMax] = [filters.prijsMax, filters.prijsMin];
      }
      sliderMin.value = filters.prijsMin;
      sliderMax.value = filters.prijsMax;
      if (inputMin) inputMin.value = filters.prijsMin;
      if (inputMax) inputMax.value = filters.prijsMax;
      werkTrackBij();
    }

    // 'input' vuurt continu tijdens het slepen — alleen de balk en het getal
    // volgen live mee. 'change' vuurt pas zodra je loslaat, en pas dán wordt
    // de grid daadwerkelijk herfilterd — zo blijft slepen soepel en filtert
    // de pagina niet tussentijds bij elke kleine muisbeweging.
    sliderMin.addEventListener('input', () => {
      filters.prijsMin = Math.min(parseInt(sliderMin.value, 10), filters.prijsMax);
      sliderMin.value = filters.prijsMin;
      if (inputMin) inputMin.value = filters.prijsMin;
      werkTrackBij();
    });

    sliderMax.addEventListener('input', () => {
      filters.prijsMax = Math.max(parseInt(sliderMax.value, 10), filters.prijsMin);
      sliderMax.value = filters.prijsMax;
      if (inputMax) inputMax.value = filters.prijsMax;
      werkTrackBij();
    });

    sliderMin.addEventListener('change', () => {
      huidigePagina = 1;
      renderGrid();
    });

    sliderMax.addEventListener('change', () => {
      huidigePagina = 1;
      renderGrid();
    });

    inputMin?.addEventListener('change', () => {
      let waarde = parseInt(inputMin.value, 10);
      if (isNaN(waarde)) waarde = 0;
      filters.prijsMin = Math.max(0, Math.min(waarde, filters.prijsMax));
      bijwerken();
      huidigePagina = 1;
      renderGrid();
    });

    inputMax?.addEventListener('change', () => {
      let waarde = parseInt(inputMax.value, 10);
      if (isNaN(waarde)) waarde = maxProductPrijs;
      filters.prijsMax = Math.min(maxProductPrijs, Math.max(waarde, filters.prijsMin));
      bijwerken();
      huidigePagina = 1;
      renderGrid();
    });

    werkTrackBij();
  }
  initPrijsSlider();

  renderCollectieFilters();
  renderKleurFilters();

  // RESET
  document.getElementById('filterResetBtn').addEventListener('click', () => {
    filters = {
      categorieen: categorieVast ? [categorieVast] : [],
      kleuren: [],
      prijsMin: 0,
      prijsMax: maxProductPrijs,
      collecties: (collectieVast && !collectieVast.includes(',')) ? [collectieVast] : [],
      collectiesAlle: (collectieVast && collectieVast.includes(',')) ? collectieVast.split(',').map(t => t.trim()).filter(Boolean) : [],
      badge: filters.badge,
    };

    initPrijsSlider();
    document.querySelectorAll('.filter-optie[data-type="categorie"]').forEach(btn => {
      btn.classList.remove('filter-optie--active');
      if (categorieVast && btn.dataset.filter === categorieVast) btn.classList.add('filter-optie--active');
    });

    renderCollectieFilters();
    renderKleurFilters();

    huidigePagina = 1;
    renderGrid();
  });

  // SORT DROPDOWN
  const sortBtn = document.getElementById('sortBtn');
  const sortDropdown = document.getElementById('sortDropdown');

  sortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sortBtn.classList.toggle('is-open');
    sortDropdown.classList.toggle('is-open');
  });

  document.addEventListener('click', () => {
    sortBtn.classList.remove('is-open');
    sortDropdown.classList.remove('is-open');
  });

  document.querySelectorAll('.sort-optie').forEach(optie => {
    optie.addEventListener('click', () => {
      document.querySelectorAll('.sort-optie').forEach(o => o.classList.remove('sort-optie--active'));
      optie.classList.add('sort-optie--active');
      actiefSort = optie.dataset.sort;
      sortBtn.classList.remove('is-open');
      sortDropdown.classList.remove('is-open');
      huidigePagina = 1;
      renderGrid();
    });
  });

  renderGrid();
})();
// SCROLL LOCK — gedeeld door menu, zoek en winkelwagen overlays.
// Gebruikt position: fixed i.p.v. overflow: hidden op body, want
// overflow: hidden (ook tijdelijk) breekt position: sticky permanent
// in Safari/iOS voor de rest van de sessie. Telt op/af zodat het ook
// klopt als er per ongeluk twee overlays kort na elkaar open/dicht gaan.
let scrollLockCount = 0;
let scrollLockY = 0;

function lockScroll() {
  if (scrollLockCount === 0) {
    scrollLockY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollLockY}px`;
    document.body.style.width = '100%';
  }
  scrollLockCount++;
}

function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: scrollLockY, behavior: 'instant' });
  }
}

// HAMBURGER MENU
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navOverlay = document.getElementById('navOverlay');
const navBackdrop = document.getElementById('navBackdrop');

function openMenu() {
  navOverlay?.classList.add('is-open');
  navBackdrop?.classList.add('is-open');
  hamburgerBtn?.classList.add('is-open');
  lockScroll();
}

function closeMenu() {
  navOverlay?.classList.remove('is-open');
  navBackdrop?.classList.remove('is-open');
  hamburgerBtn?.classList.remove('is-open');
  unlockScroll();
}

hamburgerBtn?.addEventListener('click', () => {
  if (navOverlay?.classList.contains('is-open')) {
    closeMenu();
  } else {
    openMenu();
  }
});

navBackdrop?.addEventListener('click', closeMenu);

navOverlay?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// Blokkeert horizontaal swipen binnen het menu (bv. Safari's "swipe vanaf
// de rand = terug"-gebaar) zonder verticaal scrollen te hinderen. Puur CSS
// (touch-action) kan dit browser-navigatiegebaar niet tegenhouden, dus dat
// doen we hier expliciet zelf.
(function () {
  let startX = null;
  let startY = null;
  let blokkeerHorizontaal = false;

  [navOverlay, document.getElementById('collectieSubmenu')].forEach(el => {
    if (!el) return;
    el.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      blokkeerHorizontaal = false;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (startX === null) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!blokkeerHorizontaal && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        blokkeerHorizontaal = true;
      }
      if (blokkeerHorizontaal) {
        e.preventDefault();
      }
    }, { passive: false });
  });
})();

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenu();
    sluitZoek();
    sluitCart();
  }
});

// BACK TO TOP
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTop.classList.add('is-visible');
    } else {
      backToTop.classList.remove('is-visible');
    }
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// CART BADGE
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const cart = JSON.parse(localStorage.getItem('sophea-cart') || '[]');
  const totaal = cart.reduce((sum, item) => sum + item.aantal, 0);
  if (totaal > 0) {
    badge.textContent = totaal;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

updateCartBadge();

const sluitBtn = document.getElementById('sluitBtn');
if (sluitBtn) sluitBtn.addEventListener('click', closeMenu);

// COLLECTIE SUBMENU
const collectieBtn = document.getElementById('collectieBtn');
const collectieSubmenu = document.getElementById('collectieSubmenu');
const submenuTerug = document.getElementById('submenuTerug');

if (collectieBtn) {
  // Onderscheid een echte tik van een sleepbeweging (swipe) die toevallig
  // over deze rij gaat — browsers vuren anders alsnog een click-event af
  // bij een korte drag, waardoor het submenu per ongeluk opende.
  let collectieBtnStartX = null;
  let collectieBtnStartY = null;
  let collectieBtnWasSwipe = false;

  collectieBtn.addEventListener('touchstart', (e) => {
    collectieBtnStartX = e.touches[0].clientX;
    collectieBtnStartY = e.touches[0].clientY;
    collectieBtnWasSwipe = false;
  }, { passive: true });

  collectieBtn.addEventListener('touchmove', (e) => {
    if (collectieBtnStartX === null) return;
    const dx = Math.abs(e.touches[0].clientX - collectieBtnStartX);
    const dy = Math.abs(e.touches[0].clientY - collectieBtnStartY);
    if (dx > 10 || dy > 10) collectieBtnWasSwipe = true;
  }, { passive: true });

  collectieBtn.addEventListener('click', (e) => {
    if (collectieBtnWasSwipe) {
      e.preventDefault();
      return;
    }
    collectieSubmenu.classList.add('is-open');
  });
}

if (submenuTerug) {
  submenuTerug.addEventListener('click', () => {
    collectieSubmenu.classList.remove('is-open');
  });
}

// COLLECTIES AUTOMATISCH VULLEN — op basis van collectie:-tags in Shopify
async function vulCollectiesMenu() {
  // Zoek de nav-submenu__groep met het label "COLLECTIES", ongeacht welke
  // pagina dit is — geen vaste id nodig, werkt overal waar nav.js draait.
  const groepen = document.querySelectorAll('.nav-submenu__groep');
  let collectiesGroep = null;
  groepen.forEach(g => {
    const label = g.querySelector('.nav-submenu__label');
    if (label && label.textContent.trim().toUpperCase() === 'COLLECTIES') {
      collectiesGroep = g;
    }
  });
  if (!collectiesGroep) return;

  const PRODUCTS = await window.sopheaProductsPromise;

  const mooieNaam = (slug) => slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Alle losse collecties — uit ALLE collectie:-tags van een product, niet
  // alleen de eerste (anders mis je een collectie die bij een product
  // alleen als 2e tag voorkomt, bv. bij een combi-product).
  const collecties = [...new Set(PRODUCTS.flatMap(p => p.collecties || []).filter(Boolean))];

  // Combinaties: producten met 2+ collectie-tags samen (bv. Côte + Capri).
  const combosMap = new Map();
  PRODUCTS.forEach(p => {
    if (p.collecties && p.collecties.length >= 2) {
      const tags = [...p.collecties].sort();
      const key = tags.join(',');
      if (!combosMap.has(key)) combosMap.set(key, tags);
    }
  });

  if (collecties.length === 0 && combosMap.size === 0) {
    // Nog geen enkele collectie:-tag gebruikt — hele sectie verbergen
    collectiesGroep.style.display = 'none';
    return;
  }

  // Vaste volgorde: Côte en Capri altijd bovenaan (in die volgorde), hun
  // combinatie(s) er direct achteraan, en de rest gewoon alfabetisch.
  const PRIORITEIT = ['côte', 'capri'];
  const prioriteitsCollecties = PRIORITEIT.filter(c => collecties.includes(c));
  const overigeCollecties = collecties.filter(c => !PRIORITEIT.includes(c)).sort();

  const label = collectiesGroep.querySelector('.nav-submenu__label');
  collectiesGroep.innerHTML = '';
  if (label) collectiesGroep.appendChild(label);

  function voegLinkToe(href, tekst) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = tekst;
    link.addEventListener('click', closeMenu);
    collectiesGroep.appendChild(link);
  }

  prioriteitsCollecties.forEach(slug => voegLinkToe(`collectie.html?collectie=${slug}`, mooieNaam(slug)));
  // Combinatie-tags in dezelfde volgorde tonen als PRIORITEIT (dus Côte
  // vóór Capri), niet alfabetisch — anders zou het "Capri x Côte" worden.
  function sorteerOpPrioriteit(tags) {
    return [...tags].sort((a, b) => {
      const ia = PRIORITEIT.indexOf(a);
      const ib = PRIORITEIT.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  combosMap.forEach(tags => {
    const weergaveVolgorde = sorteerOpPrioriteit(tags);
    voegLinkToe(`collectie.html?collectie=${weergaveVolgorde.join(',')}`, weergaveVolgorde.map(mooieNaam).join(' x '));
  });
  overigeCollecties.forEach(slug => voegLinkToe(`collectie.html?collectie=${slug}`, mooieNaam(slug)));
}

vulCollectiesMenu();


// NAV SCROLL ANIMATIE
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  if (window.scrollY > 10) {
    nav.classList.add('nav--scrolled');
  } else {
    nav.classList.remove('nav--scrolled');
  }
});

// =====================
// ZOEK OVERLAY
// =====================
function zoekProductCard(p) {
  return `
    <a href="product.html?handle=${p.handle}" class="product-card">
      <div class="product-card__img-wrap">
        ${p.image
          ? `<img src="${p.image}" alt="${p.naam}" />`
          : `<div class="product-card__foto-placeholder" style="width:100%;height:100%;background:var(--clr-border);display:flex;align-items:center;justify-content:center;font-size:0.6rem;opacity:0.3;letter-spacing:0.15em;">FOTO</div>`
        }
      </div>
      <div class="product-card__body">
        <span class="product-card__naam">${p.naam}</span>
        <span class="product-card__prijs">€ ${p.prijs}</span>
      </div>
    </a>
  `;
}

async function openZoek() {
  document.getElementById('zoekOverlay')?.classList.add('is-open');
  document.getElementById('zoekBackdrop')?.classList.add('is-open');
  lockScroll();
  setTimeout(() => document.getElementById('zoekInput')?.focus(), 100);

  const populair = document.getElementById('zoekPopulair');
  if (populair && !populair.innerHTML) {
    const PRODUCTS = await window.sopheaProductsPromise;
    const bestsellers = PRODUCTS.filter(p => p.badges && p.badges.includes('bestseller'));
    // Vult aan met overige producten als er (nog) minder dan 4 bestsellers zijn,
    // zodat de sectie nooit leeg of te kort oogt.
    const populaireProducten = bestsellers.length >= 4
      ? bestsellers.slice(0, 4)
      : bestsellers.concat(PRODUCTS.filter(p => !bestsellers.includes(p)).slice(0, 4 - bestsellers.length));
    populair.innerHTML = populaireProducten.map(p => zoekProductCard(p)).join('');
  }
}

function sluitZoek() {
  document.getElementById('zoekOverlay')?.classList.remove('is-open');
  document.getElementById('zoekBackdrop')?.classList.remove('is-open');
  unlockScroll();
  const input = document.getElementById('zoekInput');
  if (input) input.value = '';
  const leeg = document.getElementById('zoekLeeg');
  const gevonden = document.getElementById('zoekGevonden');
  const niets = document.getElementById('zoekNiets');
  const wis = document.getElementById('zoekWis');
  if (leeg) leeg.style.display = 'block';
  if (gevonden) gevonden.style.display = 'none';
  if (niets) niets.style.display = 'none';
  if (wis) wis.classList.remove('zichtbaar');
}

function zoekNormaliseer(tekst) {
  return tekst.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function zoekQuery(term) {
  term = zoekNormaliseer(term.trim().toLowerCase());
  document.getElementById('zoekWis')?.classList.toggle('zichtbaar', term.length > 0);

  if (term.length === 0) {
    sluitZoek();
    openZoek();
    return;
  }

  const PRODUCTS = await window.sopheaProductsPromise;
  const resultaten = PRODUCTS.filter(p => zoekNormaliseer(p.naam.toLowerCase()).includes(term));

  document.getElementById('zoekLeeg').style.display = 'none';

  if (resultaten.length === 0) {
    document.getElementById('zoekGevonden').style.display = 'none';
    document.getElementById('zoekNiets').style.display = 'block';
    document.getElementById('zoekNietsTerm').textContent = term;
  } else {
    document.getElementById('zoekNiets').style.display = 'none';
    document.getElementById('zoekGevonden').style.display = 'block';
    document.getElementById('zoekLabel').textContent = `${resultaten.length} resultaat${resultaten.length !== 1 ? 'en' : ''} voor "${term}"`;
    document.getElementById('zoekGrid').innerHTML = resultaten.map(p => zoekProductCard(p)).join('');
  }
}

document.querySelectorAll('.nav__search').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openZoek();
  });
});

document.getElementById('zoekSluit')?.addEventListener('click', sluitZoek);
document.getElementById('zoekBackdrop')?.addEventListener('click', sluitZoek);
document.getElementById('zoekWis')?.addEventListener('click', () => {
  const input = document.getElementById('zoekInput');
  if (input) { input.value = ''; input.focus(); }
  document.getElementById('zoekLeeg').style.display = 'block';
  document.getElementById('zoekGevonden').style.display = 'none';
  document.getElementById('zoekNiets').style.display = 'none';
  document.getElementById('zoekWis')?.classList.remove('zichtbaar');
});
document.getElementById('zoekInput')?.addEventListener('input', (e) => zoekQuery(e.target.value));

// =====================
// WINKELWAGEN OVERLAY
// =====================
function laadCartData() {
  return JSON.parse(localStorage.getItem('sophea-cart') || '[]');
}

async function renderCartOverlay() {
  const PRODUCTS = await window.sopheaProductsPromise;
  const getP = (id) => PRODUCTS.find(p => p.id === id);

  const cart = laadCartData();
  const itemsEl = document.getElementById('cartItems');
  const leegEl = document.getElementById('cartLeeg');
  const footerEl = document.getElementById('cartFooter');
  const verzendBalk = document.getElementById('cartVerzendBalk');

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.style.display = 'none';
    leegEl.style.display = 'flex';
    footerEl.style.display = 'none';
    if (verzendBalk) verzendBalk.style.display = 'none';
    return;
  }

  leegEl.style.display = 'none';
  itemsEl.style.display = 'block';
  footerEl.style.display = 'flex';
  if (verzendBalk) verzendBalk.style.display = 'block';

  itemsEl.innerHTML = cart.map(item => {
    const p = getP(item.productId);
    if (!p) return '';
    return `
      <div class="cart-item">
        <div class="cart-item__img">
          ${p.image
            ? `<img src="${p.image}" alt="${p.naam}" />`
            : `<div class="cart-item__img-placeholder">FOTO</div>`
          }
        </div>
        <div class="cart-item__info">
          <a href="product.html?handle=${p.handle}" class="cart-item__naam">${p.naam}</a>
          <p class="cart-item__prijs">€ ${p.prijs.toFixed(2).replace('.', ',')}</p>
          <div class="cart-item__acties">
            <div class="cart-item__aantal">
              <button onclick="cartUpdateAantal('${p.id}', -1)">−</button>
              <span>${item.aantal}</span>
              <button onclick="cartUpdateAantal('${p.id}', 1)">+</button>
            </div>
            <button class="cart-item__verwijder" onclick="cartVerwijder('${p.id}')">Verwijderen</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const subtotaal = cart.reduce((sum, item) => {
    const p = getP(item.productId);
    return sum + (p ? p.prijs * item.aantal : 0);
  }, 0);
  const verzending = subtotaal >= 50 ? 'Gratis' : '€ 4,95';
  const totaal = subtotaal >= 50 ? subtotaal : subtotaal + 4.95;

  document.getElementById('cartSubtotaal').textContent = `€ ${subtotaal.toFixed(2).replace('.', ',')}`;
  document.getElementById('cartVerzending').textContent = verzending;
  document.getElementById('cartTotaal').textContent = `€ ${totaal.toFixed(2).replace('.', ',')}`;

  const grensVerzending = 50;
  const progressPct = Math.min((subtotaal / grensVerzending) * 100, 100);
  const progressBar = document.getElementById('cartProgressBar');
  const verzendTekst = document.getElementById('cartVerzendTekst');

  if (progressBar && verzendTekst) {
    progressBar.style.width = `${progressPct}%`;
    if (subtotaal >= grensVerzending) {
      progressBar.classList.add('cart-overlay__progress-bar--vol');
      verzendTekst.innerHTML = 'Je hebt <span>gratis verzending</span>!';
    } else {
      progressBar.classList.remove('cart-overlay__progress-bar--vol');
      const nog = (grensVerzending - subtotaal).toFixed(2).replace('.', ',');
      verzendTekst.innerHTML = `Voeg nog <span>€ ${nog}</span> toe voor gratis verzending`;
    }
  }
}

function cartUpdateAantal(productId, delta) {
  let cart = laadCartData();
  const item = cart.find(i => i.productId === productId);
  if (!item) return;
  item.aantal += delta;
  if (item.aantal <= 0) cart = cart.filter(i => i.productId !== productId);
  localStorage.setItem('sophea-cart', JSON.stringify(cart));
  renderCartOverlay();
  updateCartBadge();
}

function cartVerwijder(productId) {
  let cart = laadCartData().filter(i => i.productId !== productId);
  localStorage.setItem('sophea-cart', JSON.stringify(cart));
  renderCartOverlay();
  updateCartBadge();
}

async function openCart() {
  await renderCartOverlay();
  document.getElementById('cartOverlay')?.classList.add('is-open');
  document.getElementById('cartBackdrop')?.classList.add('is-open');
  lockScroll();
}

function sluitCart() {
  document.getElementById('cartOverlay')?.classList.remove('is-open');
  document.getElementById('cartBackdrop')?.classList.remove('is-open');
  unlockScroll();
}

document.querySelectorAll('.nav__cart').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openCart();
  });
});

document.getElementById('cartSluit')?.addEventListener('click', sluitCart);
document.getElementById('cartBackdrop')?.addEventListener('click', sluitCart);

document.getElementById('cartAfrekenen')?.addEventListener('click', async () => {
  const cart = laadCartData();
  if (cart.length === 0) return;

  const PRODUCTS = await window.sopheaProductsPromise;
  const items = cart.map(item => {
    const p = PRODUCTS.find(pr => pr.id === item.productId);
    return p ? { variantId: p.variantId, aantal: item.aantal } : null;
  });

  if (items.some(i => !i || !i.variantId)) {
    alert('Er ontbreekt nog productdata om af te rekenen. Probeer het later opnieuw.');
    return;
  }

  const cartString = items.map(i => `${i.variantId}:${i.aantal}`).join(',');
  window.location.href = `https://${SHOPIFY_DOMEIN}/cart/${cartString}`;
});

(async function () {
  const ingelogd = sopheaIsIngelogd();

  // --- In-/uitlog-knoppen tonen naargelang de status --------------------
  document.getElementById('accountInloggenBtn').style.display = ingelogd ? 'none' : 'block';
  document.getElementById('accountUitloggenBtn').style.display = ingelogd ? 'block' : 'none';
  document.getElementById('accountInloggenBtn')?.addEventListener('click', sopheaStartInloggen);
  document.getElementById('accountUitloggenBtn')?.addEventListener('click', sopheaUitloggen);

  // --- Tab-wisselen ------------------------------------------------------
  document.querySelectorAll('.account__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.account__tab').forEach(t => t.classList.remove('account__tab--actief'));
      document.querySelectorAll('.account__paneel').forEach(p => p.classList.remove('account__paneel--actief'));
      tab.classList.add('account__tab--actief');
      document.getElementById(`paneel${tab.dataset.tab.charAt(0).toUpperCase()}${tab.dataset.tab.slice(1)}`)?.classList.add('account__paneel--actief');
    });
  });

  // --- WISHLIST — werkt altijd, ook zonder inloggen -------------------------
  try {
    const PRODUCTS = await window.sopheaProductsPromise;
    const wishlistHandles = JSON.parse(localStorage.getItem('sophea-wishlist') || '[]');
    const wishlistGrid = document.getElementById('wishlistGrid');

    if (wishlistHandles.length === 0) {
      wishlistGrid.innerHTML = `
        <div class="account__leeg-wrap account__leeg-wrap--wishlist">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" class="account__leeg-icon">
            <path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2.3 4.5 6 4c2-.3 3.7.7 6 3 2.3-2.3 4-3.3 6-3 3.7.5 5.5 4.2 4 7.7C19.5 16.4 12 21 12 21z"/>
          </svg>
          <p class="account__leeg">Je wishlist is nog leeg. Bewaar sieraden via het hartje op een productkaart of productpagina.</p>
          <a href="collectie.html" class="account__inline-inloggen">BEKIJK DE COLLECTIE</a>
        </div>
      `;
    } else {
      const wishlistProducten = wishlistHandles
        .map(handle => PRODUCTS.find(p => p.handle === handle))
        .filter(Boolean);

      wishlistGrid.innerHTML = wishlistProducten.map(p => `
        <a href="product.html?handle=${p.handle}" class="account__wishlist-item">
          <div class="account__wishlist-item-foto">
            ${p.image ? `<img src="${p.image}" alt="${p.naam}" />` : ''}
          </div>
          <p class="account__wishlist-item-naam">${p.naam}</p>
          <p class="account__wishlist-item-prijs">€ ${Number(p.prijs).toFixed(2).replace('.', ',')}</p>
        </a>
      `).join('');
    }
  } catch (err) {
    console.error(err);
    document.getElementById('wishlistGrid').innerHTML = `<p class="account__foutmelding">Wishlist kon niet worden geladen.</p>`;
  }

  // --- PROFIEL EN BESTELLINGEN — vereisen wél inloggen ------------------
  if (!ingelogd) {
    document.getElementById('accountWelkom').textContent = 'Mijn account';
    const inlogMelding = `
      <div class="account__leeg-wrap">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" class="account__leeg-icon">
          <circle cx="12" cy="7.5" r="4.5"/>
          <path d="M3.5 20.5c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5"/>
        </svg>
        <p class="account__leeg">Log in om dit te bekijken.</p>
        <button class="account__inline-inloggen">Inloggen</button>
      </div>
    `;
    document.getElementById('profielVelden').innerHTML = inlogMelding;
    document.getElementById('ordersLijst').innerHTML = inlogMelding;
    document.querySelectorAll('.account__inline-inloggen').forEach(btn => {
      btn.addEventListener('click', sopheaStartInloggen);
    });
    return; // De rest van dit script (Shopify-data ophalen) hoeft dan niet te draaien
  }

  // --- Profiel ophalen -----------------------------------------------------
  // Let op: mocht een van deze veldnamen niet blijken te kloppen zodra je
  // dit live test, check dan even de GraphiQL-app van Shopify (onder de
  // Customer Account API-instellingen) voor de exacte schema-namen.
  try {
    const profielData = await sopheaAccountQuery(`
      query {
        customer {
          firstName
          lastName
          emailAddress { emailAddress }
          phoneNumber { phoneNumber }
        }
      }
    `);

    const klant = profielData.customer;
    document.getElementById('accountWelkom').textContent = klant.firstName ? `Welkom, ${klant.firstName}` : 'Mijn account';

    document.getElementById('profielVelden').innerHTML = `
      <div class="account__veld">
        <span class="account__veld-label">Naam</span>
        <span class="account__veld-waarde">${[klant.firstName, klant.lastName].filter(Boolean).join(' ') || '—'}</span>
      </div>
      <div class="account__veld">
        <span class="account__veld-label">E-mailadres</span>
        <span class="account__veld-waarde">${klant.emailAddress?.emailAddress || '—'}</span>
      </div>
      <div class="account__veld">
        <span class="account__veld-label">Telefoonnummer</span>
        <span class="account__veld-waarde">${klant.phoneNumber?.phoneNumber || '—'}</span>
      </div>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById('profielVelden').innerHTML = `<p class="account__foutmelding">Profiel kon niet worden geladen.</p>`;
  }

  // --- Bestellingen ophalen --------------------------------------------------
  try {
    const ordersData = await sopheaAccountQuery(`
      query {
        customer {
          orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                id
                name
                processedAt
                financialStatus
                totalPrice { amount currencyCode }
                lineItems(first: 3) {
                  edges {
                    node {
                      title
                      quantity
                      image { url }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

    const orders = ordersData.customer.orders.edges.map(e => e.node);
    const ordersLijst = document.getElementById('ordersLijst');

    if (orders.length === 0) {
      ordersLijst.innerHTML = `<p class="account__leeg">Je hebt nog geen bestellingen geplaatst.</p>`;
    } else {
      ordersLijst.innerHTML = orders.map(order => {
        const datum = new Date(order.processedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
        const prijs = Number(order.totalPrice.amount).toFixed(2).replace('.', ',');
        const fotos = order.lineItems.edges.map(e => e.node.image?.url).filter(Boolean);

        return `
          <div class="account__order">
            <div class="account__order-fotos">
              ${fotos.map(url => `<img src="${url}" alt="" />`).join('')}
            </div>
            <div class="account__order-info">
              <p class="account__order-naam">${order.name}</p>
              <p class="account__order-datum">${datum}</p>
              <p class="account__order-status">${order.financialStatus || ''}</p>
            </div>
            <p class="account__order-prijs">€ ${prijs}</p>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error(err);
    document.getElementById('ordersLijst').innerHTML = `<p class="account__foutmelding">Bestellingen konden niet worden geladen.</p>`;
  }
})();
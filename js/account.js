// ============================================
// SOPHÉA — account.js
// Klantaccounts via Shopify's Customer Account API (OAuth 2.0 + PKCE).
// Regelt: het account-icoontje, de inlog-flow naar Shopify's gehoste
// loginpagina, het bewaren/verversen van tokens, en een herbruikbare
// functie om data bij de Customer Account API op te vragen (gebruikt door
// account.html voor Orders/Profiel).
// ============================================

const SOPHEA_ACCOUNT_CONFIG = {
  shopId: '103558447452',
  shopDomein: 'rviwh3-jc.myshopify.com',
  clientId: '6422c396-509f-4adf-8596-a5d442e9b114',
  redirectUri: 'https://sophea.nl/account-callback.html',
  authorizeEndpoint: 'https://shopify.com/authentication/103558447452/oauth/authorize',
  tokenEndpoint: 'https://shopify.com/authentication/103558447452/oauth/token',
  logoutEndpoint: 'https://shopify.com/authentication/103558447452/logout',
  scope: 'openid email customer-account-api:full',
};

// --- PKCE-hulpfuncties -----------------------------------------------
// PKCE (Proof Key for Code Exchange) is een extra beveiligingslaag die
// hoort bij "Openbare (webapp)"-clients zoals de onze: we bewijzen bij het
// omwisselen van de code dat wíj degene zijn die de login-aanvraag heeft
// gestart, zonder dat daar een geheime sleutel in de browser voor nodig is.

function sopheaRandomString(lengte = 64) {
  const bytes = new Uint8Array(lengte);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, b => ('0' + b.toString(16)).slice(-2)).join('').slice(0, lengte);
}

function sopheaBase64UrlEncode(buffer) {
  let str = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sopheaCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return sopheaBase64UrlEncode(digest);
}

// --- Token-opslag --------------------------------------------------------
// Tokens bewaren we in localStorage (i.p.v. sessionStorage) zodat een
// klant ingelogd blijft, ook na het sluiten van de browser — net als bij
// een normale webshop. Alleen de tijdelijke PKCE-gegevens (tijdens het
// inlogproces zelf) staan in sessionStorage, die zijn maar heel even nodig.

function sopheaBewaarTokens(data) {
  const verlooptOp = Date.now() + (data.expires_in * 1000);
  localStorage.setItem('sophea-account-token', data.access_token);
  localStorage.setItem('sophea-account-token-verloopt', String(verlooptOp));
  if (data.refresh_token) localStorage.setItem('sophea-account-refresh-token', data.refresh_token);
  if (data.id_token) localStorage.setItem('sophea-account-id-token', data.id_token);
}

function sopheaWisTokens() {
  localStorage.removeItem('sophea-account-token');
  localStorage.removeItem('sophea-account-token-verloopt');
  localStorage.removeItem('sophea-account-refresh-token');
  localStorage.removeItem('sophea-account-id-token');
}

function sopheaIsIngelogd() {
  const token = localStorage.getItem('sophea-account-token');
  const verlooptOp = localStorage.getItem('sophea-account-token-verloopt');
  if (!token || !verlooptOp) return false;
  return Date.now() < parseInt(verlooptOp, 10);
}

// Ververst het access token op basis van het bewaarde refresh token —
// nodig zodra het huidige token bijna/al verlopen is (meestal na ~1 uur).
async function sopheaVersTokenOp() {
  const refreshToken = localStorage.getItem('sophea-account-refresh-token');
  if (!refreshToken) return false;

  const res = await fetch(SOPHEA_ACCOUNT_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: SOPHEA_ACCOUNT_CONFIG.clientId,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    sopheaWisTokens();
    return false;
  }

  const data = await res.json();
  sopheaBewaarTokens(data);
  return true;
}

// --- Inlog-flow starten --------------------------------------------------

async function sopheaStartInloggen() {
  const codeVerifier = sopheaRandomString(64);
  const state = sopheaRandomString(32);
  const codeChallenge = await sopheaCodeChallenge(codeVerifier);

  // Bewaren voor de callback-pagina straks — die heeft de code_verifier
  // nodig om de ontvangen code om te wisselen, en de state om te
  // controleren dat de reactie ook echt bij déze poging hoort.
  sessionStorage.setItem('sophea-account-code-verifier', codeVerifier);
  sessionStorage.setItem('sophea-account-state', state);

  const params = new URLSearchParams({
    client_id: SOPHEA_ACCOUNT_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: SOPHEA_ACCOUNT_CONFIG.redirectUri,
    scope: SOPHEA_ACCOUNT_CONFIG.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${SOPHEA_ACCOUNT_CONFIG.authorizeEndpoint}?${params.toString()}`;
}

// --- Uitloggen -------------------------------------------------------------

function sopheaUitloggen() {
  const idToken = localStorage.getItem('sophea-account-id-token');
  sopheaWisTokens();
  const params = new URLSearchParams({
    id_token_hint: idToken || '',
    post_logout_redirect_uri: 'https://sophea.nl/',
  });
  window.location.href = `${SOPHEA_ACCOUNT_CONFIG.logoutEndpoint}?${params.toString()}`;
}

// --- Customer Account API opvragen (GraphQL) ------------------------------
// De GraphQL-URL wordt niet hardcoded, maar dynamisch "ontdekt" bij
// Shopify zelf — zo blijft dit altijd correct, ook als Shopify die URL
// ooit aanpast. We bewaren 'm even in sessionStorage zodat we niet bij
// elke aanvraag opnieuw hoeven te ontdekken.

async function sopheaGraphQLEndpoint() {
  const bewaard = sessionStorage.getItem('sophea-account-graphql-endpoint');
  if (bewaard) return bewaard;

  const res = await fetch(`https://${SOPHEA_ACCOUNT_CONFIG.shopDomein}/.well-known/customer-account-api`);
  const data = await res.json();
  sessionStorage.setItem('sophea-account-graphql-endpoint', data.graphql_api);
  return data.graphql_api;
}

// Voer een query/mutatie uit tegen de Customer Account API. Ververst
// automatisch het token als dat nodig is, en gooit een fout als de klant
// (na een ververs-poging) alsnog niet ingelogd blijkt.
async function sopheaAccountQuery(query, variables = {}) {
  if (!sopheaIsIngelogd()) {
    const gelukt = await sopheaVersTokenOp();
    if (!gelukt) throw new Error('Niet ingelogd');
  }

  const endpoint = await sopheaGraphQLEndpoint();
  const token = localStorage.getItem('sophea-account-token');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Let op: dit is bewust GEEN "Bearer "-token — de Customer Account
      // API verwacht het token zonder dat voorvoegsel.
      Authorization: token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    console.error('Customer Account API fout:', json.errors);
    throw new Error(json.errors[0]?.message || 'Onbekende fout');
  }
  return json.data;
}

// --- Wishlist --------------------------------------------------------------
// Lokaal per browser bewaard (localStorage), gekoppeld aan product-handles.
// Beschikbaar op elke pagina omdat account.js overal wordt geladen.

function sopheaWishlistOphalen() {
  return JSON.parse(localStorage.getItem('sophea-wishlist') || '[]');
}

function sopheaWishlistBevat(handle) {
  return sopheaWishlistOphalen().includes(handle);
}

// Zet een product aan/uit de wishlist, geeft de nieuwe status terug
// (true = nu toegevoegd, false = nu verwijderd).
function sopheaWishlistToggle(handle) {
  let lijst = sopheaWishlistOphalen();
  const stondErAlIn = lijst.includes(handle);
  lijst = stondErAlIn ? lijst.filter(h => h !== handle) : [...lijst, handle];
  localStorage.setItem('sophea-wishlist', JSON.stringify(lijst));
  return !stondErAlIn;
}

// Koppelt klik-gedrag aan alle hartjes binnen een gegeven container (of de
// hele pagina als er geen container wordt meegegeven). Wordt aangeroepen
// nadat productkaarten dynamisch zijn gerenderd, zodat de nieuwe hartjes
// ook werken.
function sopheaWishlistKnoppenBinden(root = document) {
  root.querySelectorAll('.product-card__hart, .product__bewaar').forEach(btn => {
    const handle = btn.dataset.handle;
    if (!handle) return;

    btn.classList.toggle('product-card__hart--actief', sopheaWishlistBevat(handle));
    btn.classList.toggle('product__bewaar--actief', sopheaWishlistBevat(handle));

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nuActief = sopheaWishlistToggle(handle);
      btn.classList.toggle('product-card__hart--actief', nuActief);
      btn.classList.toggle('product__bewaar--actief', nuActief);
    });
  });
}

// --- Klik-gedrag account-icoontje ---------------------------------------

document.getElementById('accountBtn')?.addEventListener('click', () => {
  // account.html toont sowieso altijd de wishlist (geen inlog nodig) en
  // vraagt alleen voor Profiel/Bestellingen om in te loggen — dus we
  // sturen hier altijd daarheen, ongeacht de inlog-status.
  window.location.href = 'account.html';
});

// Let op: de "COLLECTIES"-sectie in het hamburgermenu (losse collecties +
// combinaties zoals "Côte x Capri") wordt volledig gevuld door nav.js —
// dat gebeurde eerder óók (deels dubbel) hier in account.js, wat af en toe
// tot een lege of onvolledige lijst leidde. Nu zit die logica nog maar op
// één plek.
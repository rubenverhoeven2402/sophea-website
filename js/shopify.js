const SHOPIFY_DOMEIN = 'rviwh3-jc.myshopify.com';
const STOREFRONT_TOKEN = 'c334c4369b24eb0a203b21118502fda0';
const API_VERSIE = '2026-07';

// Koppelt specifieke kleurtags aan een algemene kleurgroep, zodat filters
// op de collectiepagina bv. "Blauw" tonen (i.p.v. losse "Navy" / "Blauw"
// opties), terwijl de productpagina gewoon de exacte kleur per variant
// blijft tonen (navy blijft navy, blauw blijft blauw).
// Onbekende kleuren die hier niet in staan vallen terug op zichzelf,
// dus een nieuwe kleur:-tag breekt nooit — hij wordt gewoon zijn eigen groep.
const KLEUR_GROEPEN = {
  navy: 'blauw', marineblauw: 'blauw', blauw: 'blauw', blue: 'blauw',
  lichtblauw: 'blauw', donkerblauw: 'blauw',
  turquoise: 'turquoise',
  roze: 'roze', rose: 'roze', pink: 'roze',
  helder: 'wit', clear: 'wit', transparant: 'wit', kristal: 'wit', crystal: 'wit', wit: 'wit', white: 'wit',
  champagne: 'goud', goud: 'goud', gold: 'goud',
  bordeaux: 'bordeaux', wijnrood: 'bordeaux',
  zwart: 'zwart', black: 'zwart',
  rood: 'rood', red: 'rood',
  oranje: 'oranje', orange: 'oranje',
  geel: 'geel', yellow: 'geel',
  groen: 'groen', green: 'groen', mint: 'groen', mintgroen: 'groen',
  paars: 'paars', purple: 'paars', lila: 'paars',
  bruin: 'bruin', brown: 'bruin',
  beige: 'beige', creme: 'beige', ivoor: 'beige', ivory: 'beige',
  grijs: 'grijs', gray: 'grijs', grey: 'grijs',
  zilver: 'zilver', silver: 'zilver',
  koper: 'koper', copper: 'koper',
  // Edelsteenkleuren met een eigen herkenbare groep
  smaragd: 'smaragd', emerald: 'smaragd',
  robijn: 'robijn', ruby: 'robijn',
  saffier: 'saffier', sapphire: 'saffier',
  rosegoud: 'rosegoud', rosegold: 'rosegoud',
  // Overige veelvoorkomende sieradenkleuren, gegroepeerd bij de dichtstbijzijnde basiskleur
  amethist: 'paars', amethyst: 'paars', lavendel: 'paars', lavender: 'paars', indigo: 'paars', violet: 'paars',
  topaas: 'goud', topaz: 'goud', messing: 'goud', brass: 'goud',
  granaat: 'bordeaux', garnet: 'bordeaux',
  koraal: 'oranje', coral: 'oranje', zalm: 'oranje', salmon: 'oranje', perzik: 'oranje', peach: 'oranje', abrikoos: 'oranje', apricot: 'oranje',
  parel: 'wit', parelmoer: 'wit', pearl: 'wit',
  fuchsia: 'roze', magenta: 'roze', lichtroze: 'roze', donkerroze: 'roze',
  aqua: 'turquoise', aquamarijn: 'turquoise', aquamarine: 'turquoise', petrol: 'turquoise', petroleumblauw: 'turquoise',
  kobalt: 'blauw', cobalt: 'blauw', marine: 'blauw', denim: 'blauw', hemelsblauw: 'blauw', skyblue: 'blauw', korenbloemblauw: 'blauw', cornflower: 'blauw',
  olijfgroen: 'groen', olijf: 'groen', olive: 'groen', lichtgroen: 'groen', donkergroen: 'groen', limoen: 'groen', lime: 'groen', kaki: 'groen', khaki: 'groen',
  okergeel: 'geel', oker: 'geel', ochre: 'geel', mosterd: 'geel', mustard: 'geel', honing: 'geel', honey: 'geel',
  terracotta: 'bruin', camel: 'bruin', amber: 'bruin',
  taupe: 'beige',
  antraciet: 'grijs', anthracite: 'grijs', gunmetal: 'grijs',
  platina: 'zilver', platinum: 'zilver', chroom: 'zilver', chrome: 'zilver',
  brons: 'koper', bronze: 'koper',
};

function algemeneKleur(kleur) {
  if (!kleur) return '';
  return KLEUR_GROEPEN[kleur.toLowerCase()] || kleur.toLowerCase();
}

// Sommige categorie-tags hebben een andere naam in Shopify dan intern in de
// site gebruikt wordt (bv. "sets" i.p.v. "combi", wat de site verwacht voor
// de Sets-categorie in nav/filters). Hier normaliseren we die alias, zodat
// het niet uitmaakt welke van de twee je in Shopify typt.
const CATEGORIE_ALIASSEN = {
  sets: 'combi',
  set: 'combi',
};

function normaliseerCategorie(categorie) {
  if (!categorie) return null;
  const lower = categorie.toLowerCase();
  return CATEGORIE_ALIASSEN[lower] || lower;
}

async function haalShopifyProducten() {
  // Cache-key opgehoogd naar v2 omdat het productschema is uitgebreid
  // met kleurGroep — voorkomt dat oude sessionStorage-cache zonder dat
  // veld de nieuwe filterlogica breekt.
  // Cache-key opgehoogd naar v6 — producten hebben nu een collecties-array
  // (meerdere collectie:-tags per product mogelijk) i.p.v. één vaste
  // collectie-waarde. Voorkomt dat oude cache zonder dat veld de nieuwe
  // filterlogica breekt.
  // Cache-key opgehoogd naar v7 — producten hebben nu een afmetingen-veld
  // (metafield custom.afmetingen). Voorkomt dat oude cache zonder dat veld
  // een lege Afmetingen-accordion toont.
  // Cache-key opgehoogd naar v8 — producten hebben nu een media-veld
  // (foto's én video's samen, in de volgorde zoals in Shopify ingesteld)
  // naast het bestaande images-veld. Voorkomt dat oude cache zonder dat
  // veld video's niet toont op de productpagina.
  const cache = sessionStorage.getItem('sophea-producten-v8');
  if (cache) return JSON.parse(cache);

  const query = `{
    products(first: 100) {
      edges {
        node {
          title
          handle
          tags
          descriptionHtml
          images(first: 10) {
            edges { node { url } }
          }
          media(first: 10) {
            edges {
              node {
                mediaContentType
                ... on MediaImage {
                  image { url }
                }
                ... on Video {
                  sources { url mimeType }
                }
              }
            }
          }
          variants(first: 1) {
            edges { node { id price { amount } availableForSale quantityAvailable } }
          }
          metaDetails: metafield(namespace: "custom", key: "details") {
            value
          }
          metaMateriaal: metafield(namespace: "custom", key: "materiaal") {
            value
          }
          metaAfmetingen: metafield(namespace: "custom", key: "afmetingen") {
            value
          }
        }
      }
    }
  }`;

  const res = await fetch(`https://${SHOPIFY_DOMEIN}/api/${API_VERSIE}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();

  const producten = json.data.products.edges.map(({ node }, index) => {
    const variant = node.variants.edges[0]?.node;
    const variantId = variant?.id.split('/').pop() || null;

    const getTag = (prefix) => node.tags.find(t => t.startsWith(prefix + ':'))?.split(':')[1] || null;
    const getTags = (prefix) => node.tags.filter(t => t.startsWith(prefix + ':')).map(t => t.split(':')[1]);

    const afbeeldingen = node.images.edges.map(e => e.node.url);

    // Media in Shopify's eigen volgorde, foto's én video's samen — gebruikt
    // op de productpagina voor de hoofdcarrousel. Voor video's pakken we bij
    // voorkeur de mp4-bron; als die er niet is, de eerste beschikbare bron.
    const media = node.media.edges.map(e => {
      if (e.node.mediaContentType === 'VIDEO') {
        const bronnen = e.node.sources || [];
        const mp4 = bronnen.find(b => b.mimeType === 'video/mp4');
        return { type: 'video', src: (mp4 || bronnen[0])?.url };
      }
      return { type: 'image', src: e.node.image?.url };
    }).filter(m => m.src);

    const parseMetaLijst = (metafield) => {
      if (!metafield || !metafield.value) return [];
      try {
        const parsed = JSON.parse(metafield.value);
        return Array.isArray(parsed) ? parsed : [metafield.value];
      } catch {
        // Niet-lijst metafield: elke regel wordt een eigen bullet
        return metafield.value.split('\n').map(r => r.trim()).filter(Boolean);
      }
    };

    return {
        id: node.handle,
        naam: node.title,
        prijs: Math.round(parseFloat(variant?.price?.amount || 0) * 100) / 100,
        categorieen: getTags('categorie').length > 0
          ? getTags('categorie').map(normaliseerCategorie)
          : ['handchains'],
        get categorie() { return this.categorieen[0]; },
        kleur: getTag('kleur') || '',
        kleurGroep: algemeneKleur(getTag('kleur')),
        badge: getTag('badge'),
        badges: getTags('badge'),
        model: getTag('model') || null,
        collecties: getTags('collectie'),
        get collectie() { return this.collecties[0] || null; },
        handle: node.handle,
        image: afbeeldingen[0] || null,
        images: afbeeldingen,
        media,
        variantId,
        volgorde: index,
        beschikbaar: variant ? variant.availableForSale : true,
        voorraad: variant && typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null,
        beschrijving: node.descriptionHtml || '',
        details: parseMetaLijst(node.metaDetails),
        materiaal: parseMetaLijst(node.metaMateriaal),
        afmetingen: parseMetaLijst(node.metaAfmetingen),
    };
  });

  sessionStorage.setItem('sophea-producten-v8', JSON.stringify(producten));
  return producten;
}

window.sopheaProductsPromise = haalShopifyProducten();
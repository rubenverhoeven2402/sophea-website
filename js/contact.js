const EMAILJS_PUBLIC_KEY = 'ZGgzqXkHaOg2t-pKD';
const EMAILJS_SERVICE_ID = 'service_3hm1ex6';
const EMAILJS_TEMPLATE_ID = 'template_hqptvdn';

// EmailJS laden
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
script.onload = () => emailjs.init(EMAILJS_PUBLIC_KEY);
document.head.appendChild(script);

const contactForm = document.getElementById('contactForm');
const submitBtn = contactForm?.querySelector('.contact__submit');
const onderwerpSelect = document.getElementById('onderwerp');
const berichtVeld = document.getElementById('bericht');

const berichtPlaceholders = {
  bestelling: 'Vertel ons om welke bestelling het gaat (je ordernummer helpt enorm) en wat je precies wilt weten.',
  product: 'Over welk sieraad gaat je vraag? Deel ook meteen de naam of link, dan kunnen we je sneller helpen.',
  idee: 'Vertel ons over je idee: wat voor sieraad zie je voor je, en welke kleuren of materialen passen daarbij?',
  retour: 'Welk product wil je retourneren en waarom? Dan zorgen we dat het soepel verloopt.',
  samenwerking: 'Vertel over jezelf of je merk, en hoe je je een samenwerking met SOPHÉA voorstelt.',
  anders: 'Schrijf gerust op wat je kwijt wilt, we lezen alles.',
};
const standaardPlaceholder = berichtVeld?.placeholder || 'Schrijf hier je vraag...';

onderwerpSelect?.addEventListener('change', () => {
  if (berichtVeld) {
    berichtVeld.placeholder = berichtPlaceholders[onderwerpSelect.value] || standaardPlaceholder;
  }
});

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      naam: document.getElementById('naam').value,
      email: document.getElementById('email').value,
      onderwerp: document.getElementById('onderwerp').value,
      ordernummer: document.getElementById('ordernummer').value || 'Geen ordernummer',
      bericht: document.getElementById('bericht').value,
    };

    submitBtn.textContent = 'VERZENDEN...';
    submitBtn.disabled = true;

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, data);

      submitBtn.textContent = '✓ BERICHT VERZONDEN';
      submitBtn.style.background = 'var(--clr-gold)';
      submitBtn.style.color = 'var(--clr-text)';
      contactForm.reset();

      setTimeout(() => {
        submitBtn.textContent = 'VERSTUUR BERICHT';
        submitBtn.disabled = false;
        submitBtn.style.background = '';
        submitBtn.style.color = '';
      }, 4000);

    } catch (err) {
      console.error('EmailJS fout:', err);
      submitBtn.textContent = 'PROBEER OPNIEUW';
      submitBtn.disabled = false;
    }
  });
}
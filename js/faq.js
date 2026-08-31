// CATEGORIE FILTER
const pills = document.querySelectorAll('.faq-pill');
const categorieen = document.querySelectorAll('.faq-categorie');

function toonCategorie(naam) {
  categorieen.forEach(cat => {
    if (naam === 'alles') {
      cat.style.display = 'block';
    } else {
      cat.style.display = cat.dataset.categorie === naam ? 'block' : 'none';
    }
  });
}

pills.forEach(pill => {
  pill.addEventListener('click', () => {
    pills.forEach(p => p.classList.remove('faq-pill--active'));
    pill.classList.add('faq-pill--active');
    toonCategorie(pill.dataset.categorie);
  });
});

// Start met "alles" zichtbaar
toonCategorie('alles');

// ACCORDEON
document.querySelectorAll('.faq-item__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('is-open');

    // Sluit alle andere items binnen dezelfde categorie
    item.closest('.faq-categorie').querySelectorAll('.faq-item').forEach(i => i.classList.remove('is-open'));

    if (!isOpen) {
      item.classList.add('is-open');
    }
  });
});

// Open eerste vraag van eerste categorie standaard
const eersteItem = document.querySelector('.faq-categorie[data-categorie="bestelling"] .faq-item');
if (eersteItem) eersteItem.classList.add('is-open');
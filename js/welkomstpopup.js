(function () {
  const AL_GEZIEN_KEY = 'sophea-welkomstpopup-gezien';
  const VERTRAGING_MS = 2500;

  if (localStorage.getItem(AL_GEZIEN_KEY)) return;

  // position: fixed i.p.v. overflow: hidden op body — overflow: hidden
  // (ook tijdelijk) breekt position: sticky permanent in Safari/iOS voor
  // de rest van de sessie. Deze popup gaat vanzelf open, dus dit raakte
  // anders zowat elke bezoeker automatisch.
  let scrollY = 0;

  setTimeout(() => {
    document.getElementById('welkomstPopup')?.classList.add('is-open');
    document.getElementById('welkomstPopupBackdrop')?.classList.add('is-open');
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  }, VERTRAGING_MS);

  function sluitPopup() {
    document.getElementById('welkomstPopup')?.classList.remove('is-open');
    document.getElementById('welkomstPopupBackdrop')?.classList.remove('is-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
    localStorage.setItem(AL_GEZIEN_KEY, 'true');
  }

  document.getElementById('welkomstPopupSluit')?.addEventListener('click', sluitPopup);
  document.getElementById('welkomstPopupBackdrop')?.addEventListener('click', sluitPopup);
  document.getElementById('welkomstPopupNeeBedankt')?.addEventListener('click', sluitPopup);

  const form = document.getElementById('welkomstPopupForm');
  const submitBtn = form?.querySelector('.welkomst-popup__submit');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('welkomstPopupEmail').value;

    submitBtn.textContent = 'BEZIG...';
    submitBtn.disabled = true;

    try {
      await schrijfInVoorNieuwsbrief(email);

      document.getElementById('welkomstPopupFormWrap').style.display = 'none';
      document.getElementById('welkomstPopupBedankt').style.display = 'block';
      localStorage.setItem(AL_GEZIEN_KEY, 'true');
    } catch (err) {
      console.error(err);
      submitBtn.textContent = 'PROBEER OPNIEUW';
      submitBtn.disabled = false;
    }
  });
})();
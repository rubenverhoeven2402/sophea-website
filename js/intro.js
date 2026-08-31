(function () {
  const AL_GEZIEN_KEY = 'sophea-intro-gezien';
  const WACHT_MS = 2200; // hoe lang het logo in beeld blijft voor de site verschijnt

  const overlay = document.getElementById('sopheaIntro');
  if (!overlay) return;

  // Al gezien in dit tabblad/deze sessie? Meteen verwijderen, geen animatie, geen flits.
  if (sessionStorage.getItem(AL_GEZIEN_KEY)) {
    overlay.remove();
    return;
  }

  // Scroll blokkeren tijdens de intro zonder overflow op body aan te raken —
  // overflow: hidden (ook tijdelijk) breekt position: sticky permanent in
  // Safari/iOS voor de rest van de sessie. position: fixed heeft dat probleem niet.
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';

  setTimeout(() => {
    overlay.remove();
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
    sessionStorage.setItem(AL_GEZIEN_KEY, 'true');
  }, WACHT_MS);
})();
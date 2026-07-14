(() => {
  const header = document.querySelector('.site-header');
  const isHome = document.body.classList.contains('home');

  const updateHeader = () => {
    if (!header) return;
    if (!isHome) {
      header.classList.add('solid');
      return;
    }
    if (window.scrollY > 40) {
      header.classList.add('solid');
    } else {
      header.classList.remove('solid');
    }
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      const expanded = nav.classList.contains('open');
      toggle.setAttribute('aria-expanded', String(expanded));
    });
    nav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => nav.classList.remove('open'))
    );
  }

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
// Fecha o menu do celular ao tocar fora dele
document.addEventListener('click', function (e) {
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-toggle');
  if (!nav || !nav.classList.contains('open')) return;
  if (nav.contains(e.target) || (toggle && toggle.contains(e.target))) return;
  nav.classList.remove('open');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
});

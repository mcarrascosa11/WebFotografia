(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  // Detecta orientación REAL (no por nombre de archivo)
  function detectOrientation(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return 'square';
    const r = w / h;
    if (r > 1.05) return 'landscape';
    if (r < 0.95) return 'portrait';
    return 'square';
  }

  function processImage(img) {
    const fig = img.closest('.gallery__item');
    if (!fig) return;
    const o = detectOrientation(img);
    fig.classList.add('is-' + o);

    // Regla editorial: las horizontales alternan 1 y 2 columnas.
    // Verticales y cuadradas → 1 columna.
    // Ocasionalmente una vertical puede ir a 2 columnas (1 de cada 5).
    if (!fig.dataset.span) {
      if (o === 'landscape') {
        const idx = Array.from(fig.parentNode.children).indexOf(fig);
        fig.dataset.span = (idx % 2 === 0) ? '2' : '1';
      } else if (o === 'portrait') {
        const idx = Array.from(fig.parentNode.children).indexOf(fig);
        fig.dataset.span = (idx > 0 && idx % 5 === 0) ? '2' : '1';
      } else {
        fig.dataset.span = '1';
      }
    }
  }

  // Animación sutil al entrar en viewport
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        reveal.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

  // Cambio de modo DIGITAL / ANALÓGICA
  const modeEl = document.getElementById('modeIndicator');
  const digital = document.getElementById('digital');
  const analogue = document.getElementById('analogica');
  let mode = 'digital';

  function setMode(m) {
    if (m === mode) return;
    mode = m;
    if (m === 'analogue') {
      document.body.classList.add('mode-analogue');
      if (modeEl) modeEl.textContent = 'ANALÓGICA';
    } else {
      document.body.classList.remove('mode-analogue');
      if (modeEl) modeEl.textContent = 'DIGITAL';
    }
  }

  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        if (e.target.id === 'analogica') setMode('analogue');
        else if (e.target.id === 'digital') setMode('digital');
      }
    });
  }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });

  function init() {
    document.querySelectorAll('.gallery__item img').forEach((img) => {
      if (img.complete && img.naturalWidth > 0) processImage(img);
      else img.addEventListener('load', () => processImage(img), { once: true });
      const fig = img.closest('.gallery__item');
      if (fig) reveal.observe(fig);
    });
    if (digital) sectionObs.observe(digital);
    if (analogue) sectionObs.observe(analogue);
    setTimeout(() => modeEl && modeEl.classList.add('visible'), 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();
})();
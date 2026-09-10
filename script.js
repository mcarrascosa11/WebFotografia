(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js-ready');

  // ==========================================
  // Detección de orientación real
  // ==========================================
  function detectOrientation(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return 'square';
    const r = w / h;
    if (r > 1.05) return 'landscape';
    if (r < 0.95) return 'portrait';
    return 'square';
  }

  // ==========================================
  // Asignar spans fila a fila SIN HUECOS
  // ==========================================
  function assignSpans(figures) {
    let col = 0;

    figures.forEach(function (fig) {
      const img = fig.querySelector('img');
      const o = (img && img.dataset.orientation) || 'portrait';

      let span = 1;

      if (o === 'landscape') {
        // Landscape: 2 columnas si caben, si no 1
        span = (col <= 1) ? 2 : 1;
      }

      // Si no cabe en lo que queda de fila, cerramos fila
      if (col + span > 3) {
        col = 0;
        span = (o === 'landscape') ? 2 : 1;
      }

      fig.dataset.span = String(span);
      col += span;
      if (col >= 3) col = 0;
    });
  }

  function processImage(img) {
    const fig = img.closest('.gallery__item');
    if (!fig) return;
    const o = detectOrientation(img);
    img.dataset.orientation = o;
    fig.classList.add('is-' + o);
  }

  // ==========================================
  // Animación de entrada
  // ==========================================
  const reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        reveal.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });

  // ==========================================
  // Cambio de modo DIGITAL / ANALÓGICA
  // ==========================================
  const modeEl = document.getElementById('modeIndicator');
  const digitalSection = document.getElementById('digital');
  const analogueSection = document.getElementById('analogica');
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

  const sectionObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      if (e.target.id === 'analogica') setMode('analogue');
      else if (e.target.id === 'digital') setMode('digital');
    });
  }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });

  // ==========================================
  // Init
  // ==========================================
  function init() {
    const galleries = document.querySelectorAll('.gallery');

    galleries.forEach(function (gallery) {
      const figures = Array.from(gallery.querySelectorAll('.gallery__item'));
      const imgs = figures.map(function (f) { return f.querySelector('img'); }).filter(Boolean);

      let pending = imgs.length;

      function onLoad() {
        pending--;
        if (pending <= 0) {
          imgs.forEach(processImage);
          assignSpans(figures);
        }
      }

      imgs.forEach(function (img) {
        if (img.complete && img.naturalWidth > 0) {
          onLoad();
        } else {
          img.addEventListener('load', onLoad, { once: true });
          img.addEventListener('error', onLoad, { once: true });
        }
      });

      figures.forEach(function (fig) { reveal.observe(fig); });
    });

    if (digitalSection) sectionObs.observe(digitalSection);
    if (analogueSection) sectionObs.observe(analogueSection);

    setTimeout(function () {
      if (modeEl) modeEl.classList.add('visible');
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

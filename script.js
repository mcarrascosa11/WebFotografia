(function () {
  'use strict';

  // Marcar que JS está listo — activa las animaciones del CSS
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js-ready');

  // ==========================================
  // Detección de orientación (para clases CSS extra)
  // ==========================================
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

    // Si un item no tiene data-span explícito, lo calculamos:
    // - horizontal → alterna 1 y 2
    // - vertical   → 1 (pero rompe ritmo a 2 cada 5)
    // - cuadrada   → 1
    if (!fig.dataset.span) {
      const idx = Array.from(fig.parentNode.children).indexOf(fig);
      if (o === 'landscape') {
        fig.dataset.span = (idx % 2 === 0) ? '2' : '1';
      } else if (o === 'portrait') {
        fig.dataset.span = (idx > 0 && idx % 5 === 0) ? '2' : '1';
      } else {
        fig.dataset.span = '1';
      }
    }
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
    document.querySelectorAll('.gallery__item img').forEach(function (img) {
      if (img.complete && img.naturalWidth > 0) {
        processImage(img);
      } else {
        img.addEventListener('load', function () { processImage(img); }, { once: true });
      }
      const fig = img.closest('.gallery__item');
      if (fig) reveal.observe(fig);
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
